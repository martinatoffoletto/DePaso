"""
Anotación de condiciones de sesgo (TODO IA/ML, capítulo de sesgos de la tesis).

El v1 tenía el análisis de sesgos VACÍO: lighting/angle/background = "unknown"
en el 100% de las filas, así que evaluate_bias.py no podía reportar nada. Este
script arma el workflow para anotarlas y que el reporte sea no trivial.

Se corre DESPUÉS de build_dataset.py (los filenames de clean/ ya son estables)
y ANTES de make_splits.py, para que las anotaciones lleguen a train/val/test.

Dos subcomandos:

  template  → genera un CSV para completar a mano (o en una planilla). Incluye
              TODAS las fotos propias + una muestra aleatoria de Open Images
              (--sample-oi, default 180). Trae las columnas a anotar con el
              valor actual (unknown si no se anotó).

  apply     → toma el CSV completado y vuelca lighting/angle/background a
              clean/labels.csv (solo esas columnas; matchea por filename).

Valores esperados (consistencia = tabla de sesgos legible; cualquier string vale
pero usá estos):

  lighting:   natural | artificial | baja
  angle:      frontal | cenital | oblicuo
  background: liso | desordenado | exterior

Uso:
    # 1) generar la plantilla
    python ml/dataset/annotate_bias.py template --data ml/dataset/clean \\
        --out ml/dataset/annotation_template.csv --sample-oi 180
    # 2) completar el CSV (Excel/Sheets/editor)
    # 3) volcarlo al dataset
    python ml/dataset/annotate_bias.py apply --data ml/dataset/clean \\
        --annotations ml/dataset/annotation_template.csv
    # 4) recién ahora correr make_splits.py
"""
import argparse
from pathlib import Path

SEED = 42
BIAS_COLS = ["lighting", "angle", "background"]
ANNOTATION_COLS = ["filename", "category", "source", *BIAS_COLS, "has_reference_object"]

VALID = {
    "lighting": {"natural", "artificial", "baja", "unknown"},
    "angle": {"frontal", "cenital", "oblicuo", "unknown"},
    "background": {"liso", "desordenado", "exterior", "unknown"},
}


def make_template(data_dir: Path, out_path: Path, sample_oi: int) -> None:
    import pandas as pd

    df = pd.read_csv(data_dir / "labels.csv")
    for col in BIAS_COLS:
        if col not in df.columns:
            df[col] = "unknown"
    if "source" not in df.columns:
        df["source"] = "unknown"

    propias = df[df["source"] != "open_images"]
    oi = df[df["source"] == "open_images"]
    oi_sample = oi.sample(n=min(sample_oi, len(oi)), random_state=SEED) if len(oi) else oi

    template = pd.concat([propias, oi_sample], ignore_index=True)
    template = template[[c for c in ANNOTATION_COLS if c in template.columns]]
    template.to_csv(out_path, index=False)

    print(f"Plantilla escrita en {out_path}: {len(template)} filas "
          f"({len(propias)} propias + {len(oi_sample)} de Open Images).")
    print("Completá lighting/angle/background y después corré:")
    print(f"  python ml/dataset/annotate_bias.py apply --data {data_dir} "
          f"--annotations {out_path}")


def apply_annotations(data_dir: Path, annotations_path: Path) -> None:
    import pandas as pd

    labels_path = data_dir / "labels.csv"
    df = pd.read_csv(labels_path)
    ann = pd.read_csv(annotations_path)

    if "filename" not in ann.columns:
        raise SystemExit("El CSV de anotaciones no tiene columna 'filename'.")

    # Validación blanda: avisa valores fuera del vocabulario, no aborta.
    for col in BIAS_COLS:
        if col in ann.columns:
            ann[col] = ann[col].fillna("unknown").astype(str).str.lower().str.strip()
            bad = set(ann[col]) - VALID[col]
            if bad:
                print(f"  ⚠️  valores no estándar en '{col}': {sorted(bad)} "
                      "(se aplican igual, pero revisá que no sean typos)")

    ann_idx = ann.set_index("filename")
    updated = {c: 0 for c in BIAS_COLS}
    for col in BIAS_COLS:
        if col not in ann.columns:
            continue
        for fn, val in ann_idx[col].items():
            if val and val != "unknown":
                mask = df["filename"] == fn
                if mask.any():
                    df.loc[mask, col] = val
                    updated[col] += int(mask.sum())

    unmatched = set(ann_idx.index) - set(df["filename"])
    df.to_csv(labels_path, index=False)
    print(f"Anotaciones aplicadas a {labels_path}. Filas actualizadas por columna: {updated}")
    if unmatched:
        print(f"  ⚠️  {len(unmatched)} filenames del CSV no están en labels.csv "
              f"(¿corriste build_dataset antes?): {sorted(unmatched)[:5]}…")
    print("\nAnotaciones por condición (todo el dataset):")
    for col in BIAS_COLS:
        print(f"  {col}: {dict(df[col].value_counts())}")
    print("\nSiguiente paso: python ml/dataset/make_splits.py --data " + str(data_dir))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_t = sub.add_parser("template", help="generar CSV de anotación")
    p_t.add_argument("--data", type=Path, default=Path("ml/dataset/clean"))
    p_t.add_argument("--out", type=Path, default=Path("ml/dataset/annotation_template.csv"))
    p_t.add_argument("--sample-oi", type=int, default=180,
                     help="cuántas filas de Open Images muestrear (default: 180)")

    p_a = sub.add_parser("apply", help="volcar el CSV completado a labels.csv")
    p_a.add_argument("--data", type=Path, default=Path("ml/dataset/clean"))
    p_a.add_argument("--annotations", type=Path, required=True)

    args = parser.parse_args()
    if args.cmd == "template":
        make_template(args.data, args.out, args.sample_oi)
    elif args.cmd == "apply":
        apply_annotations(args.data, args.annotations)
