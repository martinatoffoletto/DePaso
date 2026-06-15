# DePaso — TODO COMPLETO (Junio–Diciembre 2026)

**Última actualización:** 15 de junio de 2026
**Tiempo disponible:** ~26 semanas
**Estado:** ~83% implementado — código funcional de punta a punta; falta dataset propio + entrenamiento del modelo, deploy, documentación final y 2 gaps menores detectados vs tesis

---

## 📊 RESUMEN EJECUTIVO

| Área              | Completado | Falta | Prioridad  | Notas                                                               |
| ----------------- | ---------- | ----- | ---------- | ------------------------------------------------------------------- |
| **Backend**       | 96%        | 4%    | 🟢 LISTO   | 93 tests pasan, 7 fallan (test_vision.py); 2 gaps menores vs tesis  |
| **Frontend**      | 91%        | 9%    | 🟢 LISTO   | Flujos cliente y cadete completos; OfferSelectionScreen huérfano    |
| **IA/ML**         | 45%        | 55%   | 🔴 CRÍTICA | Pipeline corregido (7 bugs hoy); falta dataset + entrenar           |
| **Testing**       | 76%        | 24%   | 🟡 ALTA    | 93 unit tests + smoke E2E; cobertura 76%; 7 fallan en test_vision   |
| **Infra/Deploy**  | 40%        | 60%   | 🟡 ALTA    | Dockerfile + EAS + render.yaml listos; falta deploy real a Render   |
| **Documentación** | 40%        | 60%   | 🟡 MEDIA   | ARQUITECTURA.md hecho; Cap 4 tesis vacío; falta API.md              |

---

## ✅ LO QUE YA ESTÁ HECHO (verificado 11-jun-2026)

### Backend — depaso_rest (Python + FastAPI)

- ✅ **Auth completo**: registro, login, JWT + **refresh tokens** (POST /auth/refresh), argon2
- ✅ **SHIPMENTS (RF-SHP)**: crear con precio calculado, máquina de estados validada
  (`pending → assigned → pickup_arrived → in_transit → delivered / cancelled`),
  eventos auditables en `shipment_events`, cancelación cliente y cancelación carrier
  con penalización de reputación (−0.3), GET lista/detalle/eventos
- ✅ **MATCHING (RF-MAT)**: knockout filters (verificado, capacidad residual, vehículo
  compatible, desvío ≤15% colaborativo), scoring multivariable
  (w1=0.35 geo, w2=0.30 desvío, w3=0.15 carga, w4=0.10 reputación, w5=0.10 horario),
  desvío por inserción con haversine, asignaciones explicables
- ✅ **ROUTES (RF-CAR-01/02)**: publicar trayecto colaborativo (recurrencia por días)
  y ventana dedicada, listar, desactivar
- ✅ **FEED (RF-CAR-03)**: GET /carriers/me/feed — pedidos compatibles con la ruta
  del cadete, ordenados por score, con desvío y explicación; accept con route_id
- ✅ **VISION (RF-VIS-01..04)**: POST /vision/classify (multipart image +
  has_reference_object), preprocesado 224×224, inferencia Keras con **fallback
  determinístico** si el modelo no está, log en tabla `classifications`,
  PATCH feedback (aceptado / corrección manual)
- ✅ **CO2 (RF-CO2)**: factores IPCC (moto 0.09, auto 0.18, camioneta 0.25,
  camión 0.60 kg/km), cálculo real vs contrafactual al aceptar, acumuladores
  en summary de carrier y dashboard admin
- ✅ **PRICING**: tarifa base + por km según categoría S–XL (4 clases), descuento
  colaborativo 43%, ETAs estimadas — POST /shipments/quote
- ✅ **TRACKING (RF-TRK)**: POST /tracking/position (cadete publica GPS),
  GET /tracking/{shipment_id} con control de privacidad (RNF-PRV-02), historial.
  **Decisión de diseño: polling cada 15s, sin WebSocket** (excluido del alcance)
- ✅ **RATINGS (RF-SHP-08)**: 1–5 estrellas único por envío, valida delivered/dueño,
  actualiza rating promedio del carrier
- ✅ **CAPACIDAD (RF-CAP)**: capacidad residual derivada de envíos activos
  (única fuente de verdad, sin columna duplicada)
- ✅ **MATCHING WEIGHTS (RF-ADM)**: `GET/PATCH /matching/weights` — pesos editables
  por admin sin redeploy, validación suma = 1.0 ± 0.001, persistencia en DB.
  _(El TODO anterior los marcaba como pendientes: YA ESTÁN IMPLEMENTADOS)_
- ✅ **ADMIN (RF-ADM)**: GET /admin/dashboard (totales, activos, CO₂, tasa de
  matching), GET /admin/carriers/pending, PATCH verify/suspend/reactivate,
  dependencia `require_admin`
- ✅ **Seed demo idempotente** (`scripts/seed_demo.py`) y **smoke test E2E**
  (`scripts/smoke_test.py`): login → quote → feed → accept (CO₂ persistido) →
  GPS → hitos → transición inválida rechazada → rating → eventos → dashboard. PASA.

### Frontend — depaso_app (React Native + Expo SDK 54)

- ✅ **Auth**: login, registro cliente y cadete (vehículo + patente + perfil carrier),
  JWT en expo-secure-store, interceptor axios con auto-refresh en 401,
  Zustand authStore, guard de rutas en \_layout
- ✅ **Flujo crear envío (4 pantallas)**: origen/destino con mapa y geocoding,
  foto + clasificación IA real (resize 640w → /vision/classify → confianza →
  corrección manual → feedback), ofertas con quote real (precio dedicado vs
  colaborativo + CO₂), confirmación → POST /shipments
- ✅ **Mis Envíos (cliente)**: lista activos/pasados, timeline de estados,
  tracking en mapa con **polling 15s** y marcador del cadete, cancelar
  (solo pre-retiro), modal de calificación 5 estrellas
- ✅ **Modo cadete completo**: feed de pedidos compatibles (banner si no
  verificado, desvío, explicación, aceptar), envío activo con botones de hito
  ("Llegué al origen" → pickup_arrived, etc.), **GPS publisher cada 20s**
  (expo-location), cancelar con aviso de penalización, resumen
  entregas/ganancias/reputación/CO₂, publicar trayecto habitual
  (días + duración) desde Perfil
- ✅ **Perfil**: datos de usuario, sección MODO CADETE, logout
- ✅ **Tabs por rol**: cliente ve Enviar/Mis Envíos; cadete ve Pedidos/Mis Viajes
- ✅ **Calidad**: `tsc --noEmit` 0 errores, `expo-doctor` 18/18,
  lint 0 errores, bundle Metro exporta OK

### Frontend — CO2

- ✅ **Pantalla Impacto Ambiental (CO2)**: pantalla completa con gráfico de CO₂
  acumulado y equivalencias — _ya existía, el TODO anterior la marcaba como pendiente_

### IA/ML — parcial

- ✅ Scripts de entrenamiento (`ml/train_classifier.py`: MobileNetV2 +
  cabeza custom + input has_reference, 2 etapas, augmentation) y de
  evaluación de sesgos (`ml/evaluate_bias.py`)
- ✅ Integración backend: carga del modelo en startup (`app.state.classifier`),
  endpoint /classify con fallback, logging para fine-tuning futuro
- ✅ **Pipeline ML corregido** (15-jun-2026): 7 bugs críticos corregidos, incluyendo
  double `preprocess_input` (el más grave), errores en augmentation y en evaluación de sesgos
- ✅ **COLAB_QUICKSTART.md**: guía para correr el entrenamiento en Google Colab

### Infra — avances de hoy (15-jun-2026)

- ✅ **Dockerfile multi-stage**: corregido y funcional
- ✅ **render.yaml**: corregido, listo para deploy
- ✅ **EAS build config**: corregido (`eas.json`)

---

## ❌ LO QUE FALTA

### 🔴 1. IA/ML — Dataset + Entrenamiento (LO MÁS URGENTE)

**Esto es lo único que bloquea el modelo real. El resto del pipeline ya existe.**

#### Fase 1: Dataset (Junio–Julio)

- [ ] **Open Images V7** (~70%): descargar clases Box, Envelope, Suitcase,
  Furniture (~900 imágenes)
- [ ] **Fotos propias (~30%, ~600 imágenes)** ← _responsabilidad del equipo_
  - Paquetes S (pequeños/documentos) / M / L / XL (fletes)
  - Variar: iluminación (natural/artificial/baja), ángulo (frontal/cenital/oblicuo),
    fondo (liso/desordenado/exterior)
  - Pares con/sin objeto de referencia (celular, botella)
- [ ] **Etiquetado**: CSV con filename, category, lighting, angle, background,
  has_reference_object, source
- [ ] **Limpieza**: deduplicar (imagehash), recortar, normalizar JPG máx 1024px
- [ ] **Split estratificado** 70/15/15 por categoría Y condiciones de sesgo;
  test set congelado

#### Fase 2: Entrenamiento (Agosto)

- [ ] Correr `ml/train_classifier.py` en Colab (o adaptarlo a notebook)
  - Etapa A: base congelada, Adam 1e-3, 20 épocas, EarlyStopping
  - Etapa B: fine-tune últimas ~30 capas, Adam 1e-5, 10 épocas
- [ ] Exportar `cargo_classifier_v1.keras` + `metadata.json`
- [ ] Copiar a `depaso_rest/ml/models/` → el backend lo levanta solo
  (ya configurado vía `VISION_MODEL_PATH`)

#### Fase 3: Evaluación & Sesgos (Agosto–Septiembre)

- [ ] Correr `ml/evaluate_bias.py` sobre el test set
- [ ] Accuracy global (objetivo ≥80%), precision/recall/F1 por clase,
  matriz de confusión
- [ ] Tablas de sesgo: por iluminación / ángulo / fondo / con-sin referencia
- [ ] Guardar heatmaps PNG + markdown de hallazgos (van directo a la tesis)

#### Fase 5 (optativa): Fine-tuning v2 con datos reales de la tabla `classifications`

---

### 🟡 2. Testing — subir cobertura (Septiembre–Octubre)

**Ya hay:** 93 unit tests pasan + smoke E2E. Cobertura: 76%. 7 tests fallan en `test_vision.py`
(pendiente de modelo real — el fallback determinístico hace que algunos assertions fallen).

- [ ] **Corregir 7 tests en `test_vision.py`**: los tests fallan porque asumen comportamiento
  del modelo real que aún no existe; ajustar para que validen el fallback correctamente
- [ ] Cobertura ya está en 76% — objetivo 60% (RNF-MNT-02) superado; meta nueva: 80%
- [ ] Tests de integración del flujo completo con API real (el smoke ya lo cubre,
  formalizarlo como test pytest)
- [ ] Frontend: unit tests de stores Zustand y validaciones (RN Testing Library)
- [ ] Manual QA en dispositivo real (GPS en background, conectividad intermitente)
- [ ] (Opcional) E2E Detox si da el tiempo

---

### 🟡 3. Infra & Deploy (Noviembre)

- ✅ ~~**Docker**: Dockerfile multi-stage~~ — corregido 15-jun-2026
- ✅ ~~**render.yaml**~~ — corregido 15-jun-2026
- ✅ ~~**EAS Build config**~~ — corregido 15-jun-2026
- [ ] **Render**: hacer el deploy real del backend, auto-deploy desde GitHub, env vars
  (DATABASE_URL, JWT_SECRET, VISION_MODEL_PATH) — los archivos están listos, falta ejecutar
- [ ] **Supabase**: aprovisionar PostgreSQL en cloud; el código ya soporta Postgres vía DATABASE_URL
- [ ] **Alembic**: generar migración inicial para prod
  (en dev `create_all` ya cubre: carrier_routes, shipment_events, ratings,
  gps_traces, classifications)
- [ ] **EAS Build**: ejecutar `eas build -p android --profile preview` para APK de la defensa
- [ ] (Opcional) OSRM server para desvíos reales; hoy el fallback haversine funciona

---

### 🔴 4. Gaps detectados vs tesis (Julio–Agosto) — NUEVOS

Identificados el 15-jun-2026 al cruzar tesis con código. Bang-chan validó el estado real.

#### C1 — CRÍTICO: Restricción peatón/bici < 5km no aplica en modo dedicado

La tesis (Cap 1, tabla de restricciones) dice que peatón/bicicleta solo pueden hacer
paquetes pequeños/documentos en "trayectos cortos (< 5 km)" **sin condicionarlo al modo**.
El código aplica `MAX_SOFT_MOBILITY_TRIP_KM = 5.0` solo en `_rank_collaborative` y
`feed_for_carrier`, pero NO en `_rank_dedicated`. Un peatón activo puede recibir envíos
de 8 km en modo dedicado hoy.

- [ ] Agregar el check de distancia en `_rank_dedicated` y `_passes_common_knockouts`
  cuando `carrier.vehicle_type in SOFT_MOBILITY`
  **Archivo**: `depaso_rest/src/app/modules/matching/service.py`, método `_rank_dedicated`
  **Esfuerzo**: 5 líneas de código

#### C2 — CRÍTICO: Modalidad 2 (Dedicado por espacio) sin wiring en matching ni UX

La tesis define 4 modalidades. El código tiene 3.5: el enum `BY_AVAILABILITY` y el modelo
`dedicated_window` existen en la DB, pero `_rank_dedicated` ignora las ventanas publicadas
(usa GPS position en lugar de `list_active_in_window`). El carrier no puede publicar una
ventana dedicada desde la app. El `SummaryScreen.tsx` hardcodea `ON_DEMAND` siempre.

**Opciones** (elegir una antes de entrega 50%):
- [ ] **Opción A (código)**: Wiring completo — `_rank_dedicated` consulta `dedicated_window`
  activas, `PublishRouteScreen` agrega flujo para ventana dedicada, `SummaryScreen`
  envía `BY_AVAILABILITY` cuando corresponde.
  **Archivos**: `matching/service.py`, `depaso_app/src/features/carrier/PublishRouteScreen.tsx`,
  `depaso_app/src/features/sender/send-flow/SummaryScreen.tsx`
  **Esfuerzo**: ~2 días
- [ ] **Opción B (tesis)**: Documentar explícitamente en Cap 4/trabajo futuro que la
  Modalidad 2 es trabajo futuro, con justificación técnica (evita scope creep del MVP).
  **Esfuerzo**: 1 párrafo en la tesis

#### I1 — IMPORTANTE: Cobertura ante daños no implementada

El hallazgo UX #5 más citado en Cap 3: 73.4% de transportistas potenciales lo considera
condición de adopción. El código no tiene ningún campo, endpoint ni UI para esto.
`OfferSelectionScreen.tsx` tiene un badge "Asegurado" hardcodeado pero ese componente
es **huérfano** (no se renderiza en ningún tab del flow real).

- [ ] Documentar como limitación conocida en la tesis (Cap de trabajo futuro/limitaciones):
  "La cobertura ante daños excede el alcance regulatorio del POC; se define el diseño
  pero no se integra aseguradora real."
- [ ] Eliminar o marcar como placeholder el badge "Asegurado" en `OfferSelectionScreen.tsx`
  para que no confunda en la defensa si alguien revisa el código

#### N1 — NICE-TO-HAVE: OfferSelectionScreen.tsx huérfano con precios hardcodeados

El componente `depaso_app/src/features/sender/send-flow/OfferSelectionScreen.tsx` no
está en ningún navigator del flow real (el flow usa `RouteOfferScreen`). Tiene precios
hardcodeados ($6.900, $3.900). No daña en producción pero confunde en code review.

- [ ] Eliminar el componente o marcarlo con comentario `// TODO: huérfano`

---

### 🟡 5. Pendientes menores de producto

- [ ] **Panel admin web** (Expo Web o web simple): los endpoints
  /admin/dashboard y moderación **ya existen**, falta solo la UI
- [ ] **Rate limiting** (RNF-SEC-06): slowapi en /auth/login y /auth/register,
  5 intentos/min — esfuerzo 2-3 días
- ✅ ~~**PATCH /matching/weights**~~: ya implementado con persistencia en DB —
  el TODO anterior lo marcaba como pendiente pero ya existe en `matching/router.py`
- ✅ ~~Pantalla "Impacto ambiental"~~: ya existe completa en el frontend
- [ ] Forgot-password (email recovery)

#### ⚪ Excluidos del alcance (decisión de diseño documentada)

- ~~WebSocket tracking~~ → **polling 15s** (cliente) + GPS push 20s (cadete).
  Justificar en tesis: simplicidad, tolerancia a desconexión, suficiente para demo
- ~~Notificaciones push~~ → el feed del cadete se actualiza al entrar/refrescar
- ~~Cobertura ante daños (integración con aseguradora)~~ → diseño documentado en tesis,
  integración real queda como trabajo futuro (excede alcance del POC)

---

### 🟡 6. Documentación (Noviembre–Diciembre)

- [ ] **Tesis — Capítulo 4 (VACÍO)**: el archivo `chapters/chapter04.tex` solo tiene el
  título "Metodología de Desarrollo" — necesita contenido completo para la entrega 50%:
  arquitectura 4 capas, las 4 modalidades, algoritmo de matching (scoring + knockouts),
  decisiones de diseño (polling vs WebSocket, capacidad derivada, CO₂ al aceptar),
  restricciones de vehículo por categoría de carga
- [ ] **Tesis — Sub-capítulo Modelo IA**: dataset, MobileNetV2 + cabeza custom,
  métricas, análisis de sesgos (iluminación / ángulo / fondo / con-sin referencia), limitaciones
- [ ] **Tesis — Sub-capítulo Testing**: cobertura 76%, casos E2E, QA manual
- [ ] **Tesis — Limitaciones y trabajo futuro**: incluir Modalidad 2 dedicado por espacio
  (si se elige Opción B del gap C2), cobertura ante daños, elasticidad de precios
- [ ] **README.md**: setup local backend + frontend, envs, cómo correr tests y seed
- [ ] **API.md**: complementar el Swagger autogenerado (/docs) con ejemplos
- [ ] **DEPLOYMENT.md**: Render + Supabase + EAS
- [ ] Actualizar **ARQUITECTURA.md** con las decisiones finales (polling, capacidad derivada, CO₂ al aceptar)

---

## 🔧 CÓMO CORRER TODO (referencia rápida)

```bash
# Backend
cd depaso_rest
DATABASE_URL="sqlite:///./depaso_dev.db" .venv/bin/python -m scripts.seed_demo
DATABASE_URL="sqlite:///./depaso_dev.db" .venv/bin/uvicorn src.app.main:app --reload

# Tests backend (15-jun-2026: 93 passed, 7 failed en test_vision.py)
.venv/bin/python -m pytest tests/ -q
.venv/bin/python -m pytest tests/ --cov=src --cov-report=term-missing  # cobertura 76%
DATABASE_URL="sqlite:///./depaso_dev.db" .venv/bin/python -m scripts.smoke_test

# Frontend
cd depaso_app && npm run start
npx tsc --noEmit      # 0 errores
npx expo-doctor       # 18/18
```

**Usuarios demo:** admin@depaso.com/admin1234 · cliente@depaso.com/cliente1234 ·
lucia@depaso.com/lucia1234 (cadete moto verificada, ruta Caballito→Microcentro) ·
carlos@depaso.com/carlos1234 (camión Quilmes, pendiente de verificación)

> ⚠️ El proyecto vive en iCloud Drive: si `node_modules` se corrompe
> (errores raros de versiones o módulos faltantes), la solución es
> `rm -rf node_modules && npm ci`.

---

## 📋 CRONOGRAMA ACTUALIZADO (Junio–Diciembre)

| Período             | Tareas                                                                          | Estado |
| ------------------- | ------------------------------------------------------------------------------- | ------ |
| **Junio (1-2)**     | Backend completo + frontend completo                                            | ✅ HECHO |
| **Junio (3)**       | Dockerfile + EAS + render.yaml + pipeline ML corregidos; gaps tesis identificados | ✅ HECHO |
| **Junio (4)**       | Gap C1 (restricción peatón/bici en dedicated); Gap C2 (decisión modalidad 2); Dataset IA: Open Images | ⬅️ AHORA |
| **Julio**           | Dataset IA: fotos propias, etiquetado, limpieza, split                          | ⏳ |
| **Agosto**          | Entrenamiento v1 en Colab + evaluación de sesgos                                | ⏳ |
| **Septiembre**      | Integrar modelo real, QA en dispositivo, tests vision corregidos                | ⏳ |
| **Octubre**         | Panel admin web, rate limiting, pulido; deploy de prueba                        | ⏳ |
| **Noviembre**       | Deploy Render/Supabase productivo, EAS APK, fix bugs                            | ⏳ |
| **Diciembre (1-2)** | Documentación tesis final (Cap 4 implementación + IA + testing)                 | ⏳ |
| **Diciembre (3-4)** | Defensa + presentación                                                          | ⏳ |

---

## 🎯 HITOS CRÍTICOS (GO/NO-GO)

| Hito                         | Fecha  | Estado / Criterio                                                        |
| ---------------------------- | ------ | ------------------------------------------------------------------------ |
| **Matching v1 funcional**    | 30 Jul | ✅ HECHO (knockouts + scoring + smoke test)                              |
| **App E2E funcional**        | 30 Sep | ✅ HECHO (cliente + cadete + admin endpoints)                            |
| **Gap C1 corregido**         | 30 Jun | Restricción peatón/bici < 5km en `_rank_dedicated` — 5 líneas de código |
| **Gap C2 resuelto**          | 30 Jun | Modalidad 2: código o documentado en tesis como work-future              |
| **Infra Render productivo**  | 31 Jul | Deploy real del backend con Supabase (archivos ya listos)                |
| **Dataset IA completo**      | 31 Ago | ~1500 imágenes, etiquetadas, split 70/15/15                              |
| **Modelo IA v1 entrenado**   | 15 Sep | Accuracy ≥75%, análisis de sesgos documentado                            |
| **Testing 80%**              | 31 Oct | Cobertura en core modules; 7 tests vision corregidos                     |
| **Cap 4 tesis redactado**    | 30 Nov | Implementación + IA + testing + limitaciones                             |
| **Deploy productivo + APK**  | 30 Nov | Backend en Render, APK generado                                          |
| **Defensa lista**            | 15 Dic | Tesis escrita, demo funcional, datos reales                              |

---

## 🚨 RIESGOS & MITIGACIONES

| Riesgo                        | Impacto    | Mitigación                                                                   |
| ----------------------------- | ---------- | ---------------------------------------------------------------------------- |
| Dataset IA lento              | 🔴 CRÍTICO | Empezar YA: Open Images primero, fotos propias en paralelo                   |
| Gap C2 sin resolver en defensa | 🔴 CRÍTICO | Decidir antes del 30 jun: implementar o documentar; no dejar en el limbo     |
| Modelo IA baja accuracy       | 🟡 ALTA    | Más augmentation, revisar sesgos; el fallback ya evita bloqueo               |
| Cap 4 tesis vacío             | 🟡 ALTA    | Escribir junto con el desarrollo, no dejar para el final; guardar artefactos |
| node_modules en iCloud        | 🟡 MEDIA   | `npm ci` ante cualquier error raro; considerar mover repo fuera de iCloud    |
| Deploy a último momento       | 🟡 MEDIA   | Hacer un deploy de prueba en octubre, no esperar a noviembre                 |

---

**Última nota (15-jun-2026):** El código está. Hay dos gaps menores vs la tesis (C1 y C2)
que se resuelven en junio. La tesis se gana con el **dataset y el modelo entrenado** +
escribir el Cap 4 desde agosto — ese es el foco ahora.
