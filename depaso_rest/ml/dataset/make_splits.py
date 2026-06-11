"""
Fase 1 del dataset — split estratificado 70/15/15 con test set congelado.

Estratifica por categoría Y condición de sesgo (lighting/angle/background)
cuando el grupo tiene muestras suficientes; si no, cae a estratificar solo
por categoría. Escribe train.csv / val.csv / test.csv en el dataset.

El test.csv queda CONGELADO: no se toca durante el entrenamiento y es el
único insumo de ml/evaluate_bias.py. train_classifier.py puede consumir
estos splits o regenerar el suyo con la misma semilla (SEED=42).

Uso:
    pip install pandas scikit-learn
    python ml/dataset/make_splits.py --data ml/dataset/clean
"""
import argparse
from pathlib import Path

SEED = 42
TRAIN_FRACTION = 0.70
VAL_FRACTION = 0.15  # el 15% restante es test
MIN_GROUP_SIZE = 7   # mínimo para estratificar por categoría+condición


def make_splits(data_dir: Path) -> None:
    try:
        import pandas as pd
        from sklearn.model_selection import train_test_split
    except ImportError:
        raise SystemExit("Faltan dependencias. Correr: pip install pandas scikit-learn")

    df = pd.read_csv(data_dir / "labels.csv")

    # Estrato compuesto: categoría + condiciones de sesgo. Grupos chicos
    # colapsan a la categoría sola para que el split no falle.
    composite = (
        df["category"].astype(str) + "|" + df["lighting"].astype(str)
        + "|" + df["angle"].astype(str) + "|" + df["background"].astype(str)
    )
    counts = composite.value_counts()
    df["_stratum"] = [
        c if counts[c] >= MIN_GROUP_SIZE else df["category"].iloc[i]
        for i, c in enumerate(composite)
    ]

    train_df, rest = train_test_split(
        df, train_size=TRAIN_FRACTION, stratify=df["_stratum"], random_state=SEED
    )
    # rest = 30% -> mitad val, mitad test
    val_df, test_df = train_test_split(
        rest, test_size=0.50, stratify=rest["category"], random_state=SEED
    )

    for name, part in [("train", train_df), ("val", val_df), ("test", test_df)]:
        out = data_dir / f"{name}.csv"
        part.drop(columns="_stratum").to_csv(out, index=False)
        print(f"{name}: {len(part):4d} imágenes -> {out}")

    print("\nDistribución por categoría (train / val / test):")
    summary = (
        train_df["category"].value_counts().rename("train").to_frame()
        .join(val_df["category"].value_counts().rename("val"))
        .join(test_df["category"].value_counts().rename("test"))
        .fillna(0).astype(int)
    )
    print(summary.to_string())
    print("\n⚠️  test.csv queda congelado: solo lo consume evaluate_bias.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path("ml/dataset/clean"))
    args = parser.parse_args()
    make_splits(args.data)
