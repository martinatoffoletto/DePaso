"""
DePaso cargo size classifier — training script (spec 5.1).

MobileNetV2 transfer learning in two phases:
  Phase A: frozen base, train custom head (20 epochs, lr=1e-3)
  Phase B: unfreeze last layers, fine-tune (10 epochs, lr=1e-5)

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
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split

CATEGORIES = ["s", "m", "l", "xl"]  # index order shared with vision/service.py
IMG_SIZE = 224
BATCH_SIZE = 32
SEED = 42

HEAD_EPOCHS = 20
HEAD_LR = 1e-3
FINETUNE_EPOCHS = 10
FINETUNE_LR = 1e-5
FINETUNE_UNFREEZE_LAYERS = 30


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


def make_dataset(df: pd.DataFrame, training: bool) -> tf.data.Dataset:
    def load(path, ref_flag, label):
        img = tf.io.read_file(path)
        img = tf.io.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
        img = tf.keras.applications.mobilenet_v2.preprocess_input(
            tf.cast(img, tf.float32)
        )  # normalise to [-1, 1] here; model graph does NOT repeat it
        return (img, tf.reshape(ref_flag, [1])), tf.one_hot(label, len(CATEGORIES))

    ds = tf.data.Dataset.from_tensor_slices(
        (df["path"].values, df["ref_flag"].values, df["label"].values)
    )
    ds = ds.map(load, num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        ds = ds.shuffle(1000, seed=SEED)
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


def build_model() -> tf.keras.Model:
    # Augmentation exactly as specified: rotation +-15 deg, zoom +-20%,
    # brightness +-0.2, horizontal flip. Active only during training.
    augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(15 / 360),
        tf.keras.layers.RandomZoom(0.2),
        tf.keras.layers.RandomBrightness(0.2),
    ], name="augmentation")

    base = tf.keras.applications.MobileNetV2(
        weights="imagenet", include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )
    base.trainable = False

    img_in = tf.keras.Input((IMG_SIZE, IMG_SIZE, 3), name="image")
    ref_in = tf.keras.Input((1,), name="has_reference_object")

    # preprocess_input is applied in make_dataset (data pipeline owns it once).
    # Augmentation receives already-normalised [-1, 1] values; active only during
    # training (Keras disables RandomFlip/RandomRotation/etc. at inference time).
    x = augmentation(img_in)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Concatenate()([x, ref_in])
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(len(CATEGORIES), activation="softmax")(x)

    return tf.keras.Model([img_in, ref_in], out, name="depaso_cargo_classifier")


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

    train_ds = make_dataset(train_df, training=True)
    val_ds = make_dataset(val_df, training=False)

    model = build_model()
    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=5, restore_best_weights=True
    )

    # Phase A — train custom head only
    model.compile(
        optimizer=tf.keras.optimizers.Adam(HEAD_LR),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    hist_a = model.fit(train_ds, validation_data=val_ds,
                       epochs=HEAD_EPOCHS, callbacks=[early_stop])

    # Phase B — unfreeze last layers of the base, fine-tune with low lr
    base = model.get_layer("mobilenetv2_1.00_224")
    base.trainable = True
    for layer in base.layers[:-FINETUNE_UNFREEZE_LAYERS]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(FINETUNE_LR),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    hist_b = model.fit(train_ds, validation_data=val_ds,
                       epochs=FINETUNE_EPOCHS, callbacks=[early_stop])

    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "cargo_classifier_v1.keras"
    model.save(model_path)

    # Persist the exact test split so evaluate_bias.py scores untouched data.
    test_df.to_csv(out_dir / "test_split.csv", index=False)

    val_acc = max(hist_a.history["val_accuracy"] + hist_b.history["val_accuracy"])
    metadata = {
        "version": "v1",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "categories": CATEGORIES,
        "dataset_size": len(train_df) + len(val_df) + len(test_df),
        "split": {"train": len(train_df), "val": len(val_df), "test": len(test_df)},
        "best_val_accuracy": round(float(val_acc), 4),
        "architecture": "MobileNetV2 + GAP + concat(ref_flag) + Dense(128) + Dropout(0.3) + Dense(4)",
        "training": {
            "phase_a": {"epochs": HEAD_EPOCHS, "lr": HEAD_LR, "frozen_base": True},
            "phase_b": {"epochs": FINETUNE_EPOCHS, "lr": FINETUNE_LR,
                        "unfrozen_layers": FINETUNE_UNFREEZE_LAYERS},
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
