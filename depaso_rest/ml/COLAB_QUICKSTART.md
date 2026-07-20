# DePASO — ML pipeline quickstart (Google Colab)

Run every cell in order. The free T4 GPU is enough for both training phases.

---

## 0. Mount Google Drive

```python
from google.colab import drive
drive.mount('/content/drive')
```

Create a working folder on Drive and copy the repo's `depaso_rest/ml/` tree there
(or clone the repo directly):

```bash
# option A — clone the repo
!git clone https://github.com/<org>/depaso.git /content/drive/MyDrive/depaso

# option B — upload just the ml/ folder via the Drive UI, then set:
ML_DIR=/content/drive/MyDrive/depaso/depaso_rest/ml
```

Set the working paths (adjust if you used option B):

```python
ML_DIR   = "/content/drive/MyDrive/depaso/depaso_rest/ml"
RAW_DIR  = f"{ML_DIR}/dataset/raw"
CLEAN_DIR= f"{ML_DIR}/dataset/clean"
MODEL_DIR= f"{ML_DIR}/models"
```

---

## 1. Install dependencies

```bash
!pip install fiftyone pillow imagehash pandas scikit-learn matplotlib numpy
# tensorflow is pre-installed on Colab GPU runtimes; upgrade if needed:
!pip install -q "tensorflow>=2.17.0"
```

---

## 2. Download Open Images V7 (~2600 images, ~15-20 min)

```bash
!python {ML_DIR}/dataset/download_open_images.py \
    --out {RAW_DIR} \
    --per-class 650
```

`--per-class` is now a budget **per DePaso category** (was per Open Images class
in v1). Each category maps to one or more OI classes:
`s`←Envelope/Book, `m`←Box, `l`←Suitcase, `xl`←Furniture/Couch/Bed/Table.
An unavailable OI class is skipped with a warning instead of aborting.

**Add your own photos** (fotos propias, ~100-140):
- Drop images in `raw/images/`
- Append rows to `raw/labels.csv`. Put most of class `s` here, and shoot
  **~60-80 photos with a reference object** (`has_reference_object=True`,
  ideally with/without pairs). v1 had ZERO of these, leaving the model's second
  input dead while production sends `ref=1`. Bias columns (`lighting`, `angle`,
  `background`) are annotated in step 4b — leave them `unknown` for now.

---

## 3. Clean and deduplicate

```bash
!python {ML_DIR}/dataset/build_dataset.py \
    --in  {RAW_DIR} \
    --out {CLEAN_DIR}
```

Produces `clean/images/` (normalised JPEGs, max 1024 px) and `clean/labels.csv`
with perceptual-hash duplicates removed.

---

## 4b. Annotate bias conditions (before splitting)

Open Images rows land with `lighting`/`angle`/`background = unknown`. Annotate a
sample so the bias report isn't empty (this was the v1 gap):

```bash
# generate a template: all your photos + a sample of Open Images (~180 rows)
!python {ML_DIR}/dataset/annotate_bias.py template \
    --data {CLEAN_DIR} --out {CLEAN_DIR}/annotation_template.csv --sample-oi 180
```

Fill `lighting` (`natural`/`artificial`/`baja`), `angle`
(`frontal`/`cenital`/`oblicuo`), `background` (`liso`/`desordenado`/`exterior`)
in the CSV (Sheets/Excel), then merge it back:

```bash
!python {ML_DIR}/dataset/annotate_bias.py apply \
    --data {CLEAN_DIR} --annotations {CLEAN_DIR}/annotation_template.csv
```

---

## 4. Stratified 70/15/15 split

```bash
!python {ML_DIR}/dataset/make_splits.py \
    --data {CLEAN_DIR}
```

Writes `clean/train.csv`, `clean/val.csv`, `clean/test.csv`.
The test set is frozen from this point — it is the sole input to `evaluate_bias.py`.

---

## 5. Train the classifier

```bash
!python {ML_DIR}/train_classifier.py \
    --data-dir {CLEAN_DIR} \
    --out-dir  {MODEL_DIR}
```

- Phase A: frozen MobileNetV2 base, trains the custom head (up to 40 epochs).
- Phase B: unfreezes the last 60 layers, fine-tunes at lr=1e-5 (up to 25 epochs).
- EarlyStopping (patience=8, restore_best_weights) + ReduceLROnPlateau on val_loss.
- Balanced `class_weight` from the train split + label smoothing 0.1 (curbs the
  v1 "M-vacuum"). Augmentation runs on raw pixels in the data pipeline.
- Expect ~30-60 min on a T4 with the ~2000-image dataset.

Output files in `models/`:
```
cargo_classifier_v1.keras   <-- the trained model
test_split.csv              <-- held-out rows used by evaluate_bias.py
metadata.json               <-- training provenance
```

---

## 6. Evaluate and generate bias report

```bash
!python {ML_DIR}/evaluate_bias.py \
    --data-dir  {CLEAN_DIR} \
    --model-dir {MODEL_DIR}
```

Writes to `models/reports/`:
```
classification_report.txt   -- per-class precision / recall / F1
confusion_matrix.png        -- normalised heatmap (thesis figure)
bias_analysis.csv           -- accuracy per lighting / angle / background group
bias_analysis.md            -- human-readable summary with delta-vs-overall flags
```

---

## 7. Copy the model back to the repo

If you cloned the repo in step 0, just commit from Drive:

```bash
%cd /content/drive/MyDrive/depaso
!git add depaso_rest/ml/models/cargo_classifier_v1.keras \
         depaso_rest/ml/models/metadata.json
!git commit -m "train: add cargo_classifier_v1 (val_acc see metadata.json)"
!git push
```

Otherwise, download the file via Colab's file browser or:

```python
from google.colab import files
files.download(f"{MODEL_DIR}/cargo_classifier_v1.keras")
```

Then place it at `depaso_rest/ml/models/cargo_classifier_v1.keras` locally.
The backend reads it via the `VISION_MODEL_PATH` env var, which should point to
this path (absolute) in `depaso_rest/.env`.
