"""
DePaso cargo size classifier — training script (spec 5.1).

MobileNetV2 transfer learning in two phases:
  Phase A: frozen base, train custom head (up to 40 epochs, lr=1e-3)
  Phase B: unfreeze last 60 layers, fine-tune (up to 25 epochs, lr=1e-5)

Dual input: image (224x224x3) + has_reference_object flag (RF-VIS-03).

Dataset layout (built per ARQUITECTURA.md section 5, Fase 1):
  dataset/
    images/img_0001.jpg ...
    labels.csv   # filename,category,lighting,angle,background,has_reference_object,source

Run in Google Colab (free GPU):
  !pip install tensorflow pandas scikit-learn
  from google.colab import drive; drive.mount('/content/drive')
  !python train_classifier.py --data-dir /content/drive/MyDrive/depaso_dataset \
                              --out-dir  /content/drive/MyDrive/depaso_models

--- v1 -> v2 changelog (see ml/GUIA_IA.md "de v1 a v2") ---
  * Augmentation moved into the tf.data pipeline and applied on RAW [0,255]
    pixels BEFORE preprocess_input. In v1 it ran on already-normalised [-1,1]
    values inside the model graph, where RandomBrightness/RandomContrast default
    to value_range=(0,255) and CLIPPED every image to ~0 — the augmented inputs
    were effectively blank. That bug is gone.
  * Longer schedule with smart stops: EarlyStopping(restore_best_weights) +
    ReduceLROnPlateau, 40 head epochs + 25 fine-tune epochs, 60 unfrozen layers.
  * class_weight (balanced) from the train split + label smoothing 0.1 to stop
    "m" from acting as a catch-all (the v1 M-vacuum: >50% of "m" predictions
    were wrong).
  * Stronger augmentation (flip / rotation / zoom / brightness / contrast) —
    also feeds the thesis bias chapter.

CONSTRAINTS (CLAUDE.md — do not break):
  * CATEGORIES = ["s","m","l","xl"], fixed index order (backend indexes by it).
  * Dual input model: predict([img_batch, ref_batch]) — two inputs, always.
  * preprocess_input lives ONLY in the data pipeline (make_dataset), never in
    the model graph nor in vision/service.py.
  * Model saved as .keras (never .h5).
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

CATEGORIES = ["s", "m", "l", "xl"]  # index order shared with vision/service.py
IMG_SIZE = 224
BATCH_SIZE = 32
SEED = 42

HEAD_EPOCHS = 40
HEAD_LR = 1e-3
FINETUNE_EPOCHS = 25
FINETUNE_LR = 1e-5
FINETUNE_UNFREEZE_LAYERS = 60
LABEL_SMOOTHING = 0.1
EARLY_STOP_PATIENCE = 8       # generous: restore_best_weights keeps the best epoch
REDUCE_LR_PATIENCE = 3
MIN_REF_FLAG_WARN = 20        # below this, the 2nd input is effectively degenerate


def _enrich(df: pd.DataFrame, data_dir: Path) -> pd.DataFrame:
    """Add derived columns used by the tf.data pipeline (label index, ref_flag, path)."""
    df = df.copy()
    df["category"] = df["category"].str.lower()
    unknown = set(df["category"]) - set(CATEGORIES)
    if unknown:
        raise ValueError(f"Unknown categories: {unknown}")
    df["label"] = df["category"].map(CATEGORIES.index)
    df["ref_flag"] = df["has_reference_object"].astype(bool).astype("float32")
    df["path"] = df["filename"].map(lambda f: str(data_dir / "images" / f))
    return df


def load_labels(data_dir: Path) -> pd.DataFrame:
    return _enrich(pd.read_csv(data_dir / "labels.csv"), data_dir)


def split_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """70/15/15 stratified by category (spec 5.1). Test set is never touched
    during training; bias analysis runs on it via evaluate_bias.py."""
    train_df, rest = train_test_split(
        df, test_size=0.30, stratify=df["category"], random_state=SEED
    )
    val_df, test_df = train_test_split(
        rest, test_size=0.50, stratify=rest["category"], random_state=SEED
    )
    return train_df, val_df, test_df


def build_augmentation() -> tf.keras.Sequential:
    """Image augmentation, applied in the data pipeline on RAW [0,255] pixels.

    The layers keep their default value_range=(0,255), which is why they MUST
    run before preprocess_input (never on the [-1,1] normalised tensor — that
    was the v1 bug that blanked the images). Stronger than v1 to widen the
    lighting/angle coverage the thesis bias chapter reports on.
    """
    return tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(20 / 360),   # +-20 deg
        tf.keras.layers.RandomZoom(0.25),           # +-25%
        tf.keras.layers.RandomBrightness(0.3),      # value_range=(0,255) -> ok on raw pixels
        tf.keras.layers.RandomContrast(0.3),
    ], name="augmentation")


def make_dataset(df: pd.DataFrame, training: bool,
                 augment: tf.keras.Sequential | None = None) -> tf.data.Dataset:
    """Build the tf.data pipeline. preprocess_input is applied HERE (and only
    here). When `augment` is given and training=True, augmentation runs on the
    raw [0,255] image before normalisation."""
    def load(path, ref_flag, label):
        img = tf.io.read_file(path)
        img = tf.io.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
        img = tf.cast(img, tf.float32)  # raw [0,255]
        if training and augment is not None:
            img = augment(img[tf.newaxis, ...], training=True)[0]
        img = tf.keras.applications.mobilenet_v2.preprocess_input(
            img
        )  # normalise to [-1, 1] here; model graph does NOT repeat it
        return (img, tf.reshape(ref_flag, [1])), tf.one_hot(label, len(CATEGORIES))

    ds = tf.data.Dataset.from_tensor_slices(
        (df["path"].values, df["ref_flag"].values, df["label"].values)
    )
    if training:
        ds = ds.shuffle(1000, seed=SEED)
    ds = ds.map(load, num_parallel_calls=tf.data.AUTOTUNE)
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


def build_model() -> tf.keras.Model:
    base = tf.keras.applications.MobileNetV2(
        weights="imagenet", include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )
    base.trainable = False

    img_in = tf.keras.Input((IMG_SIZE, IMG_SIZE, 3), name="image")
    ref_in = tf.keras.Input((1,), name="has_reference_object")

    # img_in arrives already preprocessed to [-1, 1] (data pipeline owns it once).
    # No augmentation and no preprocess_input in the graph -> the saved model is a
    # clean inference graph matching vision/service.py.
    x = base(img_in, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Concatenate()([x, ref_in])
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(len(CATEGORIES), activation="softmax")(x)

    return tf.keras.Model([img_in, ref_in], out, name="depaso_cargo_classifier")


def _class_weight(train_df: pd.DataFrame) -> dict[int, float]:
    """Balanced class weights from the train split — counters the M-vacuum by
    down-weighting whichever classes dominate the training set."""
    classes = np.arange(len(CATEGORIES))
    present = np.unique(train_df["label"].values)
    weights = compute_class_weight(
        "balanced", classes=present, y=train_df["label"].values
    )
    cw = {int(c): 1.0 for c in classes}
    cw.update({int(c): float(w) for c, w in zip(present, weights)})
    return cw


def train(data_dir: Path, out_dir: Path) -> None:
    split_files = [data_dir / f for f in ("train.csv", "val.csv", "test.csv")]
    if all(p.exists() for p in split_files):
        # Honour the bias-stratified splits produced by make_splits.py (preferred).
        print("Using pre-built splits from make_splits.py (bias-stratified).")
        train_df, val_df, test_df = [
            _enrich(pd.read_csv(p), data_dir) for p in split_files
        ]
    else:
        # Fall back to category-only stratification (useful when running the
        # trainer standalone without having run make_splits.py first).
        print("No pre-built splits found; re-splitting from labels.csv.")
        df = load_labels(data_dir)
        train_df, val_df, test_df = split_dataset(df)
    print(f"Dataset: {len(train_df)} train / {len(val_df)} val / {len(test_df)} test")
    print("Train class distribution:")
    print(train_df["category"].value_counts().to_string())

    class_weight = _class_weight(train_df)
    print(f"class_weight (by index {CATEGORIES}): {class_weight}")

    n_ref = int(train_df["ref_flag"].sum())
    if n_ref < MIN_REF_FLAG_WARN:
        print(
            f"\n⚠️  WARNING: only {n_ref} train images have has_reference_object=1. "
            "The second model input is nearly constant, so the app sending ref=1 "
            "at inference is out-of-distribution. Add reference-object photos "
            "(~60-80, spread across classes) — see ml/GUIA_IA.md §4.\n"
        )

    augment = build_augmentation()
    train_ds = make_dataset(train_df, training=True, augment=augment)
    val_ds = make_dataset(val_df, training=False)

    model = build_model()
    loss = tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING)
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=EARLY_STOP_PATIENCE,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=REDUCE_LR_PATIENCE, min_lr=1e-7,
        ),
    ]

    # Phase A — train custom head only
    model.compile(
        optimizer=tf.keras.optimizers.Adam(HEAD_LR),
        loss=loss,
        metrics=["accuracy"],
    )
    hist_a = model.fit(train_ds, validation_data=val_ds, epochs=HEAD_EPOCHS,
                       class_weight=class_weight, callbacks=callbacks)

    # Phase B — unfreeze last layers of the base, fine-tune with low lr
    base = model.get_layer("mobilenetv2_1.00_224")
    base.trainable = True
    for layer in base.layers[:-FINETUNE_UNFREEZE_LAYERS]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(FINETUNE_LR),
        loss=loss,
        metrics=["accuracy"],
    )
    hist_b = model.fit(train_ds, validation_data=val_ds, epochs=FINETUNE_EPOCHS,
                       class_weight=class_weight, callbacks=callbacks)

    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "cargo_classifier_v1.keras"
    model.save(model_path)

    # Persist the exact test split so evaluate_bias.py scores untouched data.
    test_df.to_csv(out_dir / "test_split.csv", index=False)

    val_acc = max(hist_a.history["val_accuracy"] + hist_b.history["val_accuracy"])
    metadata = {
        "version": "v2",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "categories": CATEGORIES,
        "dataset_size": len(train_df) + len(val_df) + len(test_df),
        "split": {"train": len(train_df), "val": len(val_df), "test": len(test_df)},
        "train_class_counts": {
            c: int((train_df["category"] == c).sum()) for c in CATEGORIES
        },
        "best_val_accuracy": round(float(val_acc), 4),
        "architecture": "MobileNetV2 + GAP + concat(ref_flag) + Dense(128) + Dropout(0.3) + Dense(4)",
        "class_weight": class_weight,
        "label_smoothing": LABEL_SMOOTHING,
        "ref_flag_train_positives": n_ref,
        "augmentation": "flip / rotation +-20 / zoom +-25% / brightness +-0.3 / contrast +-0.3 (on raw pixels)",
        "training": {
            "phase_a": {"epochs": HEAD_EPOCHS, "lr": HEAD_LR, "frozen_base": True},
            "phase_b": {"epochs": FINETUNE_EPOCHS, "lr": FINETUNE_LR,
                        "unfrozen_layers": FINETUNE_UNFREEZE_LAYERS},
            "early_stopping_patience": EARLY_STOP_PATIENCE,
            "reduce_lr_patience": REDUCE_LR_PATIENCE,
        },
    }
    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print(f"Saved {model_path} (best val_accuracy={val_acc:.4f})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, default=Path("models"))
    args = parser.parse_args()
    tf.keras.utils.set_random_seed(SEED)
    train(args.data_dir, args.out_dir)
