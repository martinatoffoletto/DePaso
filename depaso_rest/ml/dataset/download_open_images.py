"""
Fase 1 del dataset (TODO IA/ML): descarga de Open Images V7 (~70% del dataset).

Baja imágenes de las clases Box, Envelope, Suitcase y Furniture vía FiftyOne
(maneja descargas parciales sin bajar el dataset completo), las copia a
<out>/images/ con nombre normalizado y agrega filas a <out>/labels.csv con el
esquema que espera ml/train_classifier.py:

    filename,category,lighting,angle,background,has_reference_object,source

Las condiciones de sesgo (lighting/angle/background) quedan en "unknown":
solo las fotos propias las llevan etiquetadas a mano. La categoría "s" casi
no aparece acá — sale de las fotos propias.

Uso:
    pip install fiftyone
    python ml/dataset/download_open_images.py --out ml/dataset/raw --per-class 225
"""
import argparse
import csv
import shutil
from pathlib import Path

# Open Images class -> DePaso category (spec 3.3 XS..XL).
CLASS_TO_CATEGORY = {
    "Envelope": "xs",
    "Box": "m",
    "Suitcase": "l",
    "Furniture": "xl",
}

CSV_FIELDS = [
    "filename", "category", "lighting", "angle", "background",
    "has_reference_object", "source",
]


def download(out_dir: Path, per_class: int, split: str) -> None:
    try:
        import fiftyone as fo
        import fiftyone.zoo as foz
    except ImportError:
        raise SystemExit(
            "FiftyOne no está instalado. Correr: pip install fiftyone\n"
            "(solo hace falta para esta descarga, no para el backend)"
        )

    images_dir = out_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_path = out_dir / "labels.csv"
    write_header = not labels_path.exists()

    with open(labels_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        if write_header:
            writer.writeheader()

        for oi_class, category in CLASS_TO_CATEGORY.items():
            print(f"→ {oi_class} ({category}): bajando hasta {per_class} imágenes…")
            dataset = foz.load_zoo_dataset(
                "open-images-v7",
                split=split,
                label_types=["classifications"],
                classes=[oi_class],
                max_samples=per_class,
                dataset_name=f"depaso_{oi_class.lower()}_{split}",
                shuffle=True,
                seed=42,
            )
            count = 0
            for sample in dataset:
                src = Path(sample.filepath)
                dst_name = f"oi_{category}_{src.stem}{src.suffix.lower()}"
                shutil.copy2(src, images_dir / dst_name)
                writer.writerow({
                    "filename": dst_name,
                    "category": category,
                    "lighting": "unknown",
                    "angle": "unknown",
                    "background": "unknown",
                    "has_reference_object": False,
                    "source": "open_images",
                })
                count += 1
            print(f"  {count} imágenes copiadas a {images_dir}")
            fo.delete_dataset(dataset.name)

    print(f"\nListo. Etiquetas en {labels_path}")
    print("Siguiente paso: agregar fotos propias y correr build_dataset.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("ml/dataset/raw"),
                        help="directorio destino (default: ml/dataset/raw)")
    parser.add_argument("--per-class", type=int, default=225,
                        help="imágenes por clase (default: 225 ≈ 900 total)")
    parser.add_argument("--split", default="train",
                        help="split de Open Images a usar (default: train)")
    args = parser.parse_args()
    download(args.out, args.per_class, args.split)
