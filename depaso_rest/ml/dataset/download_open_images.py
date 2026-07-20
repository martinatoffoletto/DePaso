"""
Fase 1 del dataset (TODO IA/ML): descarga de Open Images V7 (~85-90% del dataset).

Baja imágenes vía FiftyOne (maneja descargas parciales sin bajar el dataset
completo), las copia a <out>/images/ con nombre normalizado y agrega filas a
<out>/labels.csv con el esquema que espera ml/train_classifier.py:

    filename,category,lighting,angle,background,has_reference_object,source

Cada categoría DePaso se mapea a UNA O MÁS clases de Open Images (ver
CATEGORY_TO_OI_CLASSES). El presupuesto --per-class se reparte entre las clases
de cada categoría, así que apuntás a ~per-class imágenes POR CATEGORÍA, no por
clase de Open Images.

    v1 -> v2: se subió el cupo (225 -> 650 por categoría, ~2600 crudas antes de
    dedup) y se agregaron clases por categoría para dar más variedad visual. La
    clase "m" (cajas medianas) era la más floja del v1 — más volumen + balanceo
    de clases en el entrenamiento la despegan del rol de "aspirador".

Las condiciones de sesgo (lighting/angle/background) quedan en "unknown" para
Open Images: se anotan aparte con ml/dataset/annotate_bias.py sobre una muestra
+ las fotos propias. has_reference_object queda en False (no podemos verificar un
objeto de escala en fotos de stock); las fotos propias lo marcan en True.

Uso:
    pip install fiftyone
    python ml/dataset/download_open_images.py --out ml/dataset/raw --per-class 650
"""
import argparse
import csv
import math
import shutil
from pathlib import Path

# DePaso category -> candidate Open Images V7 classes.
# Varias clases por categoría = más variedad. Si alguna clase no existe en la
# versión instalada de Open Images, se saltea con un aviso (no aborta todo).
CATEGORY_TO_OI_CLASSES = {
    "s":  ["Envelope", "Book"],            # sobres / documentos / items chicos
    "m":  ["Box"],                          # cajas medianas (clase problema del v1)
    "l":  ["Suitcase"],                     # valijas / cargas voluminosas
    "xl": ["Furniture", "Couch", "Bed", "Table"],  # muebles / mudanzas
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

    totals: dict[str, int] = {c: 0 for c in CATEGORY_TO_OI_CLASSES}
    with open(labels_path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        if write_header:
            writer.writeheader()

        for category, oi_classes in CATEGORY_TO_OI_CLASSES.items():
            # Reparte el presupuesto de la categoría entre sus clases de OI.
            budget = math.ceil(per_class / len(oi_classes))
            for oi_class in oi_classes:
                print(f"→ {oi_class} ({category}): bajando hasta {budget} imágenes…")
                try:
                    dataset = foz.load_zoo_dataset(
                        "open-images-v7",
                        split=split,
                        label_types=["classifications"],
                        classes=[oi_class],
                        max_samples=budget,
                        dataset_name=f"depaso_{oi_class.lower().replace(' ', '_')}_{split}",
                        shuffle=True,
                        seed=42,
                    )
                except Exception as exc:  # clase inexistente / error de red
                    print(f"  ⚠️  no se pudo bajar '{oi_class}', se saltea: {exc}")
                    continue

                count = 0
                for sample in dataset:
                    src = Path(sample.filepath)
                    # el stem trae el image-id de OI -> nombre único entre clases
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
                totals[category] += count
                print(f"  {count} imágenes copiadas a {images_dir}")
                fo.delete_dataset(dataset.name)

    print("\nListo. Total por categoría (antes de dedup):")
    for c, n in totals.items():
        print(f"  {c}: {n}")
    print(f"Etiquetas en {labels_path}")
    print("Siguiente paso: agregar fotos propias y correr build_dataset.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("ml/dataset/raw"),
                        help="directorio destino (default: ml/dataset/raw)")
    parser.add_argument("--per-class", type=int, default=650,
                        help="imágenes por CATEGORÍA (default: 650 ≈ 2600 total)")
    parser.add_argument("--split", default="train",
                        help="split de Open Images a usar (default: train)")
    args = parser.parse_args()
    download(args.out, args.per_class, args.split)
