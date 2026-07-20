# TODO Martina — camino al modelo v2

Checklist personal para llegar al clasificador defendible (≥75–80% test).
Los detalles técnicos de cada paso están/estarán en `GUIA_IA.md` (suga la está
actualizando para v2).

## 1. Sesión de fotos (~150–170, se hace en una tarde)

| Clase | Qué | Cantidad | Con botella de referencia |
|---|---|---|---|
| s | sobres, documentos, cajitas | 40–50 | ~la mitad |
| m | cajas medianas (zapatos, e-commerce) | 40–50 | ~la mitad |
| l | cajas grandes, valijas, monitores | 30–40 | ~la mitad |
| xl | muebles, electrodomésticos, bultos | 20–30 | ~la mitad |

Reglas:
- [ ] Objeto de referencia: **una botella de 500ml/1L**, siempre la misma,
      apoyada AL LADO del paquete (misma superficie, visible entera).
- [ ] **Mitad de las fotos sin referencia** — si todas la tienen, el modelo
      aprende "foto casera = referencia" y el flag no sirve.
- [ ] **Muchos objetos distintos, pocas fotos de cada uno** (mismo objeto
      repetido se filtra entre train y test → accuracy mentirosa).
- [ ] Variar en tandas (así el CSV de sesgos se llena en bloques):
      luz (natural / artificial / baja) × ángulo (arriba / costado / diagonal)
      × fondo (limpio / desordenado).
- [ ] Prioridad si falta tiempo: **s y m** (las clases débiles del v1).

## 2. Anotación (~15 min si sacaste en tandas)

- [ ] Completar el CSV de anotación que genera el pipeline v2 (columnas:
      categoría, has_reference_object, lighting, angle, background) para TODAS
      las fotos propias + la muestra de Open Images que indique la guía.
      Sin esto no hay capítulo de sesgos (el v1 salió todo "unknown").

## 3. Subir a Drive

- [ ] Fotos propias → `depaso_ml/dataset/raw/` (la subcarpeta que diga la
      GUIA_IA actualizada) + el CSV de anotación donde indique.

## 4. Correr los notebooks v2 en Colab (mismo orden de siempre)

- [ ] Notebook 01 — dataset (ahora baja ~600–750 por clase de Open Images;
      va a tardar más que la vez pasada, es normal).
- [ ] Notebook 02 — entrenamiento (más épocas + early stopping; con T4
      esperá minutos, no segundos).
- [ ] Notebook 03 — evaluación + sesgos. **Chequear antes de festejar**:
      - accuracy test ≥ 75% (mínimo defendible; objetivo 80%)
      - precision de `m` ya no en 0.4x (v1: el "aspirador" de M)
      - reporte de sesgos con grupos reales, no "unknown"
      - accuracy con `has_reference_object=1` vs `=0` (el flag tiene que
        aportar — es el diferencial de la tesis)

## 5. Integrar el v2 al backend (local)

- [ ] Reemplazar `depaso_rest/ml/models/cargo_classifier_v1.keras` y
      `metadata.json` por los nuevos (mismo path — el backend ya apunta ahí).
- [ ] Reiniciar el backend y verificar el log `vision_model_loaded`.
- [ ] Probar desde la app: foto → clasificación real + confianza.
- [ ] Commitear modelo + metadata (como hiciste con v1).

## Recordatorios

- El deploy en Render sigue con stub (TensorFlow comentado en requirements a
  propósito) — la demo de visión para la defensa corre con backend local.
- Los tests del backend usan SIEMPRE el stub (forzado en conftest.py) — no se
  rompen por cambiar el modelo.
- Si el v2 no llega a 75%: los siguientes pasos ya evaluados son backbone
  EfficientNetV2-B0 (comparativa barata, misma librería) y limpieza de labels
  con cleanlab — consultar reporte de suga.
