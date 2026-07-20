"""
DePaso cargo classifier — evaluation and bias analysis (spec 5.1, RNF-UADE-01).

Runs ONLY on the held-out test split saved by train_classifier.py.

Produces (in --out-dir/reports):
  - classification_report.txt   accuracy global + precision/recall/F1 per class
  - confusion_matrix.png        normalized heatmap
  - bias_analysis.csv           accuracy per lighting / angle / background /
                                reference-object condition
  - bias_analysis.md            human-readable summary for the thesis

Usage (Colab or local with the model + dataset available):
  python evaluate_bias.py --data-dir dataset/ --model-dir models/
"""
import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Ensure train_classifier is importable regardless of the caller's working directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from train_classifier import CATEGORIES, make_dataset  # noqa: E402

BIAS_DIMENSIONS = ["lighting", "angle", "background", "has_reference_object"]
MIN_GROUP_N = 5  # bias groups smaller than this are too noisy to read into


def predict_all(model: tf.keras.Model, df: pd.DataFrame) -> np.ndarray:
    ds = make_dataset(df, training=False)
    probs = model.predict(ds, verbose=0)
    return probs.argmax(axis=1)


def plot_confusion(cm: np.ndarray, out_path: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    row_sums = cm.sum(axis=1, keepdims=True)
    cm_norm = np.divide(cm.astype("float"), row_sums,
                        out=np.zeros_like(cm, dtype="float"), where=row_sums != 0)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm_norm, cmap="Greens", vmin=0, vmax=1)
    ax.set_xticks(range(len(CATEGORIES)), [c.upper() for c in CATEGORIES])
    ax.set_yticks(range(len(CATEGORIES)), [c.upper() for c in CATEGORIES])
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title("Confusion matrix (normalized)")
    for i in range(len(CATEGORIES)):
        for j in range(len(CATEGORIES)):
            ax.text(j, i, f"{cm_norm[i, j]:.2f}", ha="center", va="center",
                    color="black" if cm_norm[i, j] < 0.5 else "white")
    fig.colorbar(im)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)


def bias_table(df: pd.DataFrame, y_true: np.ndarray, y_pred: np.ndarray) -> pd.DataFrame:
    """Accuracy per condition group, for every bias dimension in the metadata.

    Groups smaller than MIN_GROUP_N are dropped: with a ~250-row test set a
    group of 1-2 images produces meaningless 0%/100% accuracies that would
    pollute the thesis table."""
    rows = []
    overall = accuracy_score(y_true, y_pred)
    rows.append({"dimension": "overall", "group": "all", "n": len(df),
                 "accuracy": round(overall, 4), "delta_vs_overall": 0.0})
    for dim in BIAS_DIMENSIONS:
        if dim not in df.columns:
            continue
        for group, idx in df.groupby(dim).groups.items():
            mask = df.index.isin(idx)
            n = int(mask.sum())
            if n < MIN_GROUP_N:
                continue
            acc = accuracy_score(y_true[mask], y_pred[mask])
            rows.append({
                "dimension": dim,
                "group": str(group),
                "n": n,
                "accuracy": round(acc, 4),
                "delta_vs_overall": round(acc - overall, 4),
            })
    return pd.DataFrame(rows)


def write_bias_md(table: pd.DataFrame, out_path: Path) -> None:
    overall = table.loc[table["dimension"] == "overall", "accuracy"].iloc[0]
    lines = [
        "# Análisis de sesgos — clasificador de carga\n",
        f"Accuracy global sobre test: **{overall:.2%}**\n",
        "| Dimensión | Grupo | n | Accuracy | Δ vs global |",
        "|---|---|---|---|---|",
    ]
    for _, r in table[table["dimension"] != "overall"].iterrows():
        flag = " ⚠️" if r["delta_vs_overall"] < -0.10 else ""
        lines.append(
            f"| {r['dimension']} | {r['group']} | {r['n']} "
            f"| {r['accuracy']:.2%}{flag} | {r['delta_vs_overall']:+.2%} |"
        )
    lines += [
        "",
        "⚠️ = el grupo rinde más de 10 puntos por debajo del accuracy global;",
        "documentar mitigación (más muestras de esa condición en la próxima",
        "iteración del dataset, o aviso en la UI al capturar la foto).",
    ]
    out_path.write_text("\n".join(lines))


def main(data_dir: Path, model_dir: Path) -> None:
    model = tf.keras.models.load_model(model_dir / "cargo_classifier_v1.keras")
    test_df = pd.read_csv(model_dir / "test_split.csv").reset_index(drop=True)
    # re-resolve image paths in case the dataset moved
    test_df["path"] = test_df["filename"].map(lambda f: str(data_dir / "images" / f))

    y_true = test_df["label"].values
    y_pred = predict_all(model, test_df)

    reports = model_dir / "reports"
    reports.mkdir(exist_ok=True)

    labels = list(range(len(CATEGORIES)))  # keep all 4 classes even if one is never predicted
    report = classification_report(
        y_true, y_pred, labels=labels,
        target_names=[c.upper() for c in CATEGORIES], zero_division=0,
    )
    (reports / "classification_report.txt").write_text(report)
    print(report)

    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plot_confusion(cm, reports / "confusion_matrix.png")

    table = bias_table(test_df, y_true, y_pred)
    table.to_csv(reports / "bias_analysis.csv", index=False)
    write_bias_md(table, reports / "bias_analysis.md")
    print(f"Reports written to {reports}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--model-dir", type=Path, default=Path("models"))
    args = parser.parse_args()
    main(args.data_dir, args.model_dir)
