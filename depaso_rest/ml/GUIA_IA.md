# DePaso · IA/ML — Guía completa (todo lo que tenés que hacer)

Esta es la **única guía que necesitás** para la parte de IA de la tesis. Te lleva de cero a
tener el clasificador de tamaño de paquete entrenado, evaluado (con análisis de sesgos para el
capítulo de IA) e integrado al backend.

> **Dos aclaraciones que aligeran el trabajo:**
> 1. **La mayoría del dataset son fotos públicas** (Open Images, ~90%). Tus fotos propias son un
>    complemento chico (**~100**, no cientos), sobre todo de la clase `s` (sobres/documentos).
> 2. **No tenés que medir nada.** El modelo clasifica en 4 categorías `s|m|l|xl` mirando la foto;
>    a cada una le ponés la categoría a ojo. No hay reglas, centímetros ni volúmenes.

---

## 0. Panorama en 1 minuto

- **Qué construís:** un clasificador de imágenes que dice si un paquete es `s | m | l | xl`
  (chico / mediano / grande / extra-grande). Es MobileNetV2 con transfer learning, y recibe
  **dos entradas**: la imagen (224×224) + un flag `has_reference_object` (si en la foto hay un
  objeto de escala conocida, como un celular o una botella).
- **Cómo:** 3 notebooks que corren en **Google Colab** (la MacBook no tiene GPU). Cada uno llama
  a los scripts del pipeline que ya están en el repo — vos solo corrés celdas.
- **Cuánto:** ~1200 imágenes (~90% de Open Images automático + ~100 fotos tuyas), 2 etapas de
  entrenamiento, y un reporte de sesgos que va casi directo a la tesis.
- **Objetivo de accuracy:** ≥80% (mínimo defendible: 75%).

```
Paso 1 (notebook 01)      Paso 2 (notebook 02)      Paso 3 (notebook 03)
┌────────────────────┐    ┌───────────────────┐    ┌──────────────────────┐
│ Open Images + tus  │ →  │ Entrenar (GPU)    │ →  │ Evaluar + sesgos     │
│ fotos → limpiar →  │    │ MobileNetV2 2     │    │ → figuras tesis →    │
│ split 70/15/15     │    │ etapas → .keras   │    │ integrar al backend  │
└────────────────────┘    └───────────────────┘    └──────────────────────┘
   CPU, ~15-20 min           GPU T4, ~20-40 min        GPU, ~5 min
```

---

## 1. Los archivos (dónde está cada cosa)

Todo vive en `depaso_rest/ml/`:

```
ml/
├── GUIA_IA.md                 ← este archivo
├── COLAB_QUICKSTART.md        ← versión corta en inglés (referencia rápida)
├── requirements-ml.txt        ← dependencias del pipeline (no las usa el backend)
├── notebooks/                 ← 👇 LO QUE ABRÍS EN COLAB
│   ├── 01_dataset.ipynb       ← descarga Open Images + tus fotos + limpia + split
│   ├── 02_entrenamiento.ipynb ← entrena el modelo (necesita GPU)
│   └── 03_evaluacion.ipynb    ← métricas + análisis de sesgos + integración
├── dataset/
│   ├── download_open_images.py  (lo llaman los notebooks, no lo corrés a mano)
│   ├── build_dataset.py
│   └── make_splits.py
├── train_classifier.py
└── evaluate_bias.py
```

Los `.py` son el pipeline canónico (los notebooks solo los orquestan). No hace falta que los
toques; si algún día querés correr localmente, cada uno tiene su `--help`.

---

## 2. Cómo abrir los notebooks

### Opción A — Google Colab (recomendada, es lo que necesitás para la GPU)

1. Andá a [colab.research.google.com](https://colab.research.google.com).
2. `Archivo → Subir cuaderno` → subí el `.ipynb` desde `depaso_rest/ml/notebooks/`.
   - *O* `Archivo → Abrir cuaderno → GitHub` → pegá `martinatoffoletto/DePaso` y elegí el
     notebook (si el repo es público).
3. Para el notebook 02: `Entorno de ejecución → Cambiar tipo de entorno → T4 GPU`.
4. Corré las celdas en orden (`Shift+Enter` en cada una, o `Entorno de ejecución → Ejecutar todo`).

Los notebooks **clonan el repo solos** (traen los scripts) y **montan tu Google Drive** (ahí
guardan el dataset y el modelo, para que no se pierdan cuando Colab reinicia).

### Opción B — Localmente (solo si querés; el entrenamiento va a ser lentísimo sin GPU)

- En VS Code: instalá la extensión **Jupyter** de Microsoft, abrí el `.ipynb` y elegí un kernel
  de Python. Para el entorno: `cd depaso_rest && pip install -r ml/requirements-ml.txt`.
- Los pasos 1 y 3 corren bien local; el **paso 2 (entrenamiento) sin GPU puede tardar horas** —
  por eso Colab.

---

## 3. Paso a paso

### Paso 1 — Dataset (`notebooks/01_dataset.ipynb`)

1. **Setup**: monta Drive, clona el repo, instala dependencias.
2. **Open Images V7**: baja ~300 imágenes por clase (`Envelope→s`, `Box→m`, `Suitcase→l`,
   `Furniture→xl`) — el grueso del dataset. Automático, ~10 min.
3. **Tus fotos propias (~100)** (ver sección 4): las subís y las etiquetás. Opcional pero suma.
4. **Limpiar**: dedup por hash perceptual, normaliza tamaño/formato.
5. **Split 70/15/15**: estratificado por categoría y por condición de sesgo. El `test.csv` queda
   **congelado** (no se toca al entrenar).

**Sale:** `MyDrive/depaso_ml/dataset/clean/` con `images/`, `labels.csv`, `train/val/test.csv`.

### Paso 2 — Entrenamiento (`notebooks/02_entrenamiento.ipynb`)

1. **Verificá la GPU** (primera celda; si no hay, cambiá el tipo de entorno a T4).
2. **Entrená**: Etapa A (base congelada, cabeza nueva, ≤20 épocas) → Etapa B (fine-tuning de las
   últimas 30 capas, lr bajo, ≤10 épocas). EarlyStopping corta si sobreajusta.
3. **Revisá** `metadata.json`: el `best_val_accuracy` te dice si llegaste al objetivo.

**Sale:** `MyDrive/depaso_ml/models/` con `cargo_classifier_v1.keras`, `test_split.csv`,
`metadata.json`. **Guardá las curvas de entrenamiento** que imprime — van a la tesis.

### Paso 3 — Evaluación e integración (`notebooks/03_evaluacion.ipynb`)

1. **Evaluá** sobre el test congelado: reporte por clase, matriz de confusión, accuracy por
   condición de sesgo.
2. **Mirá los resultados** inline (el notebook los muestra). Si algún grupo rinde >10 puntos por
   debajo del global, aparece marcado con ⚠️ — eso se documenta como limitación/mitigación.
3. **Integrá** el modelo al backend (ver sección 6).

**Sale:** `MyDrive/depaso_ml/models/reports/` con `classification_report.txt`,
`confusion_matrix.png`, `bias_analysis.csv`, `bias_analysis.md` → **material directo del
capítulo de IA**.

---

## 4. Cómo sacar y etiquetar tus fotos (~100, sin medir)

Con **~100 fotos propias** alcanza. **No tenés que medir nada**: a cada foto le ponés la
categoría a ojo. Las otras columnas son etiquetas simples de la escena (o `unknown` si no sabés).

| Dimensión | Valores a usar | Por qué |
|---|---|---|
| **category** | `s` (sobre/documento), `m` (caja mediana), `l` (valija/caja grande), `xl` (mueble/electrodoméstico) | Se pone **a ojo**. La clase `s` casi no está en Open Images → poné ahí la mayoría. |
| **lighting** | `natural` / `artificial` / `baja` (o `unknown`) | Sesgo por iluminación. |
| **angle** | `frontal` / `cenital` / `oblicuo` (o `unknown`) | Sesgo por ángulo de captura. |
| **background** | `liso` / `desordenado` / `exterior` (o `unknown`) | Sesgo por fondo. |
| **has_reference_object** | `True` / `False` | Si podés, sacá algunos **pares** con y sin un objeto de escala (celular, botella). Alimenta el 2º input del modelo. |

**Reparto sugerido de las ~100:** ~40-50 de clase `s` (lo que más falta), y el resto repartido
entre `m`/`l`/`xl`. Variá iluminación/ángulo/fondo *en la medida que puedas* — lo que no cubras
se declara como limitación del dataset en el capítulo de sesgos. Cuantas menos fotos propias, más
peso tienen las de stock internacional (domain bias): es un trade-off razonable para un MVP.

### El esquema de `labels.csv`

Una fila por foto, exactamente estas columnas:

```
filename,category,lighting,angle,background,has_reference_object,source
mi_caja_01.jpg,m,natural,frontal,liso,False,propia
mi_caja_01_ref.jpg,m,natural,frontal,liso,True,propia
mi_sobre_03.jpg,s,baja,cenital,desordenado,True,propia
mi_mueble_07.jpg,xl,artificial,oblicuo,exterior,False,propia
```

El notebook 01 tiene una celda con `pandas` para agregar filas sin editar el CSV a mano.

---

## 5. Constraints que NO se pueden romper

Estos ya están respetados en los scripts. Si tocás algo, no los rompas:

- **`CATEGORIES = ["s", "m", "l", "xl"]`** — orden fijo. La inferencia del backend indexa por
  posición. Nunca `xs`, nunca reordenar.
- **Dos inputs siempre**: `model.predict([img_batch, ref_batch])`. La imagen y el flag de
  referencia. Si entrenás un modelo de un solo input, el backend no lo puede cargar.
- **`preprocess_input` va solo en el pipeline de datos** (`make_dataset` en `train_classifier.py`),
  **no** dentro del modelo ni en `vision/service.py`. Ese bug de doble preprocesado ya se corrigió
  una vez — no lo reintroduzcas.
- **El test set está congelado**: solo lo consume `evaluate_bias.py`. No entrenes con él ni lo
  mires para tunear.

---

## 6. Integrar el modelo al backend

El backend carga el `.keras` **una vez al arrancar**, desde la ruta `VISION_MODEL_PATH`
(por defecto `./ml/models/cargo_classifier_v1.keras`, ver `core/config.py`). **Si el archivo no
está, cae automáticamente a un stub determinístico** — la API nunca se rompe por falta de modelo.

Para poner el modelo en su lugar:

1. Copiá `cargo_classifier_v1.keras` a `depaso_rest/ml/models/cargo_classifier_v1.keras`.
   - El notebook 03 te da las dos formas: commitear desde Colab con un token de GitHub, o
     descargar y colocar a mano.
2. Verificá que anda:
   ```bash
   cd depaso_rest
   ./start.sh   # en los logs de arranque debería decir que cargó el modelo (no el stub)
   # y probá el endpoint:
   curl -F "file=@una_foto.jpg" -F "has_reference_object=false" \
        http://localhost:8000/api/v1/vision/classify
   ```
3. Si en los logs ves `vision_model_unavailable_using_stub`, es que no encontró el `.keras` en
   `VISION_MODEL_PATH`. Revisá la ruta en `.env`.

> **Nota de peso**: el `.keras` pesa ~15 MB y está en `.gitignore`. Para deploy en Render, la
> opción más simple es meterlo en la imagen Docker o bajarlo como artefacto en el build. Detalle
> en `PLAN_MAESTRO.md §4`.

---

## 7. Qué va a la tesis (capítulo de IA)

De este pipeline sale, casi listo para pegar:

- **Descripción del dataset**: tamaño, fuentes (Open Images ~90% / propias ~100), distribución por
  clase, condiciones de sesgo cubiertas.
- **Arquitectura**: MobileNetV2 transfer learning, dual input, 2 etapas de entrenamiento
  (`metadata.json` tiene la provenance exacta).
- **Métricas**: accuracy global, precision/recall/F1 por clase (`classification_report.txt`),
  matriz de confusión (`confusion_matrix.png`).
- **Análisis de sesgos**: accuracy por iluminación/ángulo/fondo/referencia (`bias_analysis.md`),
  con los grupos flojos marcados y la mitigación propuesta.
- **Curvas de entrenamiento**: guardá las que imprime el notebook 02.

---

## 8. Checklist

Dataset:
- [ ] Corrí `01_dataset.ipynb` hasta la descarga de Open Images.
- [ ] Saqué ~100 fotos propias (la mayoría clase `s`), categoría puesta a ojo.
- [ ] Saqué pares con y sin objeto de referencia.
- [ ] Etiqueté todas en `labels.csv` (esquema de la sección 4).
- [ ] Corrí limpieza + split. `test.csv` congelado.

Entrenamiento:
- [ ] `02_entrenamiento.ipynb` con GPU activada.
- [ ] `best_val_accuracy` ≥ 75% (idealmente ≥ 80%).
- [ ] Guardé `metadata.json` + curvas para la tesis.

Evaluación + integración:
- [ ] `03_evaluacion.ipynb` generó los 4 reports.
- [ ] Revisé grupos con ⚠️ (>10 pts por debajo) y anoté la mitigación.
- [ ] Copié el `.keras` a `depaso_rest/ml/models/`.
- [ ] El backend arranca cargando el modelo (no el stub) y `/vision/classify` responde.

**Hitos GO/NO-GO (del cronograma, `PLAN_MAESTRO.md §7`):** dataset completo **31-ago** ·
modelo v1 ≥75% **15-sep**.

---

## 9. Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `FiftyOne no está instalado` | Corré la celda de `pip install` del notebook 01 antes de la descarga. |
| La descarga de Open Images tarda muchísimo | Es normal la primera vez (baja el índice). Bajá `PER_CLASS` si querés probar rápido. |
| `assert gpus` falla en el notebook 02 | No activaste la GPU: *Entorno de ejecución → Cambiar tipo de entorno → T4 GPU* y reiniciá. |
| Se reinició el runtime y perdí todo | El dataset y el modelo están en Drive (`MyDrive/depaso_ml/`), no se pierden. Solo re-corré el setup. |
| `Unknown categories: {...}` al entrenar | Hay una fila en `labels.csv` con una categoría que no es `s/m/l/xl`. Corregila. |
| Accuracy baja (<75%) | Sumá fotos propias de las clases/condiciones que rinden peor (mirá `bias_analysis.md`) y reentrená. |
| El backend usa el stub y no el modelo | El `.keras` no está en `VISION_MODEL_PATH`. Revisá la ruta en `depaso_rest/.env`. |

---

*Referencia rápida en inglés: `COLAB_QUICKSTART.md`. Estado general del MVP e infraestructura:
`../../PLAN_MAESTRO.md`.*
