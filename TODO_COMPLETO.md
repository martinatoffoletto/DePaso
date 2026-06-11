# DePaso — TODO COMPLETO (Junio–Diciembre 2026)

**Última actualización:** 11 de junio de 2026
**Tiempo disponible:** ~26 semanas
**Estado:** ~80% implementado — código funcional de punta a punta; falta dataset propio + entrenamiento del modelo, deploy y documentación final

---

## 📊 RESUMEN EJECUTIVO

| Área              | Completado | Falta | Prioridad  | Notas                                              |
| ----------------- | ---------- | ----- | ---------- | -------------------------------------------------- |
| **Backend**       | 95%        | 5%    | 🟢 LISTO   | Todos los módulos funcionales, 37 tests pasan      |
| **Frontend**      | 90%        | 10%   | 🟢 LISTO   | Flujos cliente y cadete completos, tsc/lint limpio |
| **IA/ML**         | 40%        | 60%   | 🔴 CRÍTICA | Scripts y endpoint listos; falta dataset + entrenar |
| **Testing**       | 50%        | 50%   | 🟡 ALTA    | 37 unit tests + smoke E2E; falta cobertura 60%     |
| **Infra/Deploy**  | 10%        | 90%   | 🟡 ALTA    | Corre local; falta Render/Supabase/EAS             |
| **Documentación** | 40%        | 60%   | 🟡 MEDIA   | ARQUITECTURA.md hecho; falta tesis + API.md        |

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
- ✅ **PRICING**: tarifa base + por km según categoría XS–XL, descuento
  colaborativo 43%, ETAs estimadas — POST /shipments/quote
- ✅ **TRACKING (RF-TRK)**: POST /tracking/position (cadete publica GPS),
  GET /tracking/{shipment_id} con control de privacidad (RNF-PRV-02), historial.
  **Decisión de diseño: polling cada 15s, sin WebSocket** (excluido del alcance)
- ✅ **RATINGS (RF-SHP-08)**: 1–5 estrellas único por envío, valida delivered/dueño,
  actualiza rating promedio del carrier
- ✅ **CAPACIDAD (RF-CAP)**: capacidad residual derivada de envíos activos
  (única fuente de verdad, sin columna duplicada)
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

### IA/ML — parcial

- ✅ Scripts de entrenamiento (`ml/train_classifier.py`: MobileNetV2 +
  cabeza custom + input has_reference, 2 etapas, augmentation) y de
  evaluación de sesgos (`ml/evaluate_bias.py`)
- ✅ Integración backend: carga del modelo en startup (`app.state.classifier`),
  endpoint /classify con fallback, logging para fine-tuning futuro

---

## ❌ LO QUE FALTA

### 🔴 1. IA/ML — Dataset + Entrenamiento (LO MÁS URGENTE)

**Esto es lo único que bloquea el modelo real. El resto del pipeline ya existe.**

#### Fase 1: Dataset (Junio–Julio)

- [ ] **Open Images V7** (~70%): descargar clases Box, Envelope, Suitcase,
  Furniture (~900 imágenes)
- [ ] **Fotos propias (~30%, ~600 imágenes)** ← _responsabilidad del equipo_
  - Cajas XS / S-M / L / XL
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

**Ya hay:** 37 unit tests (auth, shipments, matching, co2, pricing) + smoke E2E.

- [ ] Medir cobertura (`pytest --cov`) y llevar core modules a 60% (RNF-MNT-02)
- [ ] Tests de integración del flujo completo con API real (el smoke ya lo cubre,
  formalizarlo como test)
- [ ] Frontend: unit tests de stores Zustand y validaciones (RN Testing Library)
- [ ] Manual QA en dispositivo real (GPS en background, conectividad intermitente)
- [ ] (Opcional) E2E Detox si da el tiempo

---

### 🟡 3. Infra & Deploy (Noviembre)

- [ ] **Docker**: Dockerfile multi-stage + docker-compose local
- [ ] **Render**: deploy backend, auto-deploy desde GitHub, env vars
  (DATABASE_URL, JWT_SECRET, VISION_MODEL_PATH)
- [ ] **Supabase**: PostgreSQL (el código ya soporta Postgres vía DATABASE_URL);
  Storage para imágenes si se persisten
- [ ] **Alembic**: generar migración inicial para prod
  (en dev `create_all` ya cubre: carrier_routes, shipment_events, ratings,
  gps_traces, classifications)
- [ ] **EAS Build**: APK Android para la defensa (`eas build -p android --profile preview`)
- [ ] (Opcional) OSRM server para desvíos reales; hoy el fallback haversine funciona

---

### 🟡 4. Pendientes menores de producto

- [ ] **Panel admin web** (Expo Web o web simple): los endpoints
  /admin/dashboard y moderación **ya existen**, falta solo la UI
- [ ] **Rate limiting** (RNF-SEC-06): slowapi en /auth/login y /auth/register,
  5 intentos/min — esfuerzo 2-3 días
- [ ] **PATCH /matching/weights**: pesos editables por admin sin redeploy
  (hoy son constantes en código)
- [ ] Pantalla "Impacto ambiental" del cliente (gráfico CO₂ acumulado + equivalencias)
  — los datos ya están en el backend
- [ ] Forgot-password (email recovery)

#### ⚪ Excluidos del alcance (decisión de diseño documentada)

- ~~WebSocket tracking~~ → **polling 15s** (cliente) + GPS push 20s (cadete).
  Justificar en tesis: simplicidad, tolerancia a desconexión, suficiente para demo
- ~~Notificaciones push~~ → el feed del cadete se actualiza al entrar/refrescar

---

### 🟡 5. Documentación (Noviembre–Diciembre)

- [ ] **Tesis — Capítulo Implementación**: arquitectura 4 capas, algoritmo de
  matching (scoring + knockouts), tracking por polling (justificación)
- [ ] **Tesis — Capítulo Modelo IA**: dataset, MobileNetV2 + cabeza custom,
  métricas, análisis de sesgos, limitaciones
- [ ] **Tesis — Capítulo Testing**: cobertura, casos E2E, QA manual
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

# Tests backend
.venv/bin/python -m pytest tests/ -q          # 37 passed
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

| Período             | Tareas                                                   | Estado |
| ------------------- | -------------------------------------------------------- | ------ |
| **Junio (1-2)**     | Backend completo + frontend completo                     | ✅ HECHO |
| **Junio (3-4)**     | Dataset IA: descargar Open Images + empezar fotos propias | ⬅️ AHORA |
| **Julio**           | Dataset IA: fotos propias, etiquetado, limpieza, split   | ⏳ |
| **Agosto**          | Entrenamiento v1 en Colab + evaluación de sesgos         | ⏳ |
| **Septiembre**      | Integrar modelo real, QA en dispositivo, cobertura 60%   | ⏳ |
| **Octubre**         | Panel admin web, pantalla impacto, rate limiting, pulido | ⏳ |
| **Noviembre**       | Deploy Render/Supabase, EAS APK, fix bugs                | ⏳ |
| **Diciembre (1-2)** | Documentación tesis final                                | ⏳ |
| **Diciembre (3-4)** | Defensa + presentación                                   | ⏳ |

---

## 🎯 HITOS CRÍTICOS (GO/NO-GO)

| Hito                       | Fecha  | Estado / Criterio                                    |
| -------------------------- | ------ | ---------------------------------------------------- |
| **Matching v1 funcional**  | 30 Jul | ✅ HECHO (knockouts + scoring + smoke test)          |
| **App E2E funcional**      | 30 Sep | ✅ HECHO (cliente + cadete + admin endpoints)        |
| **Dataset IA completo**    | 31 Ago | ~1500 imágenes, etiquetadas, split 70/15/15          |
| **Modelo IA v1 entrenado** | 15 Sep | Accuracy ≥75%, análisis de sesgos documentado        |
| **Testing 60%**            | 31 Oct | Cobertura medida y validada en core modules          |
| **Deploy productivo**      | 30 Nov | Backend en Render, APK generado                      |
| **Defensa lista**          | 15 Dic | Tesis escrita, demo funcional, datos reales          |

---

## 🚨 RIESGOS & MITIGACIONES

| Riesgo                    | Impacto    | Mitigación                                                       |
| ------------------------- | ---------- | ---------------------------------------------------------------- |
| Dataset IA lento          | 🔴 CRÍTICO | Empezar YA: Open Images primero, fotos propias en paralelo       |
| Modelo IA baja accuracy   | 🟡 ALTA    | Más augmentation, revisar sesgos; el fallback ya evita bloqueo   |
| node_modules en iCloud    | 🟡 MEDIA   | `npm ci` ante cualquier error raro; considerar mover repo fuera de iCloud |
| Deploy a último momento   | 🟡 MEDIA   | Hacer un deploy de prueba en octubre, no esperar a noviembre     |
| Tesis a último momento    | 🟡 MEDIA   | Ir guardando artefactos (heatmaps, métricas, capturas) desde agosto |

---

**Última nota:** El código está. La tesis se gana ahora con el **dataset y el
modelo entrenado** — ese es el foco de las próximas 8 semanas. 💪
