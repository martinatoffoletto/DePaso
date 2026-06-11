"""
Fase 1 del dataset — limpieza y normalización (TODO IA/ML).

Toma un directorio crudo (images/ + labels.csv, mezcla de Open Images y fotos
propias) y produce el dataset final que consume ml/train_classifier.py:

  1. Valida labels.csv (archivos existentes, categorías xs..xl, campos completos).
  2. Deduplica con perceptual hash (imagehash.phash, distancia <= umbral).
  3. Normaliza: RGB, lado máximo 1024 px, JPG calidad 90.
  4. Escribe <out>/images/ + <out>/labels.csv limpio.

Uso:
    pip install pillow imagehash pandas
    python ml/dataset/build_dataset.py --in ml/dataset/raw --out ml/dataset/clean
"""
import argparse
from pathlib import Path

VALID_CATEGORIES = {"xs", "s", "m", "l", "xl"}
MAX_SIDE = 1024
JPEG_QUALITY = 90
PHASH_THRESHOLD = 4  # distancia de Hamming <= 4 se considera duplicado


def build(in_dir: Path, out_dir: Path) -> None:
    try:
        import imagehash
        import pandas as pd
        from PIL import Image
    except ImportError:
        raise SystemExit("Faltan dependencias. Correr: pip install pillow imagehash pandas")

    labels_path = in_dir / "labels.csv"
    if not labels_path.exists():
        raise SystemExit(f"No existe {labels_path}")

    df = pd.read_csv(labels_path)
    df["category"] = df["category"].str.lower().str.strip()

    # 1. Validación
    bad_cat = df[~df["category"].isin(VALID_CATEGORIES)]
    if not bad_cat.empty:
        raise SystemExit(f"Categorías inválidas:\n{bad_cat[['filename', 'category']]}")
    missing = [f for f in df["filename"] if not (in_dir / "images" / f).exists()]
    if missing:
        raise SystemExit(f"{len(missing)} archivos listados en labels.csv no existen: {missing[:5]}…")
    dup_names = df[df["filename"].duplicated()]
    if not dup_names.empty:
        raise SystemExit(f"Filenames repetidos en labels.csv: {dup_names['filename'].tolist()[:5]}…")

    out_images = out_dir / "images"
    out_images.mkdir(parents=True, exist_ok=True)

    # 2-3. Dedup + normalización
    seen_hashes: list[tuple[object, str]] = []
    kept_rows = []
    dropped_dupes = 0
    dropped_corrupt = 0

    for row in df.to_dict("records"):
        src = in_dir / "images" / row["filename"]
        try:
            img = Image.open(src)
            img.load()
        except Exception:
            dropped_corrupt += 1
            print(f"  ✗ corrupta, descartada: {row['filename']}")
            continue

        h = imagehash.phash(img)
        dupe_of = next((name for hh, name in seen_hashes if h - hh <= PHASH_THRESHOLD), None)
        if dupe_of is not None:
            dropped_dupes += 1
            print(f"  ✗ duplicada de {dupe_of}: {row['filename']}")
            continue
        seen_hashes.append((h, row["filename"]))

        img = img.convert("RGB")
        if max(img.size) > MAX_SIDE:
            img.thumbnail((MAX_SIDE, MAX_SIDE))

        out_name = Path(row["filename"]).stem + ".jpg"
        img.save(out_images / out_name, "JPEG", quality=JPEG_QUALITY)
        row["filename"] = out_name
        kept_rows.append(row)

    clean_df = pd.DataFrame(kept_rows)
    clean_df.to_csv(out_dir / "labels.csv", index=False)

    print(f"\n{len(clean_df)} imágenes limpias en {out_dir}")
    print(f"Descartadas: {dropped_dupes} duplicadas, {dropped_corrupt} corruptas")
    print("\nDistribución por categoría:")
    print(clean_df["category"].value_counts().to_string())
    print("\nSiguiente paso: python ml/dataset/make_splits.py --data " + str(out_dir))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--in", dest="in_dir", type=Path, default=Path("ml/dataset/raw"))
    parser.add_argument("--out", dest="out_dir", type=Path, default=Path("ml/dataset/clean"))
    args = parser.parse_args()
    build(args.in_dir, args.out_dir)
