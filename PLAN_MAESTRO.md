# DePaso — PLAN MAESTRO

**Actualizado:** 7 de julio de 2026
**Qué es este documento:** la única fuente de verdad de *qué falta para terminar el MVP*. Integra y reemplaza a `AUDITORIA_BACKEND.md` y `TODO_COMPLETO.md` (eliminados — su historia queda en git). La referencia técnica de *cómo está construido* el sistema es `ARQUITECTURA.md`.

---

## 0. Stack (resumen — detalle en ARQUITECTURA.md)

| Pieza | Tecnología |
|---|---|
| **Backend** (`depaso_rest`) | Python 3.12 + FastAPI + Pydantic v2 + SQLAlchemy 2 + Alembic · PostgreSQL (prod) / SQLite (dev y tests) · JWT access+refresh con argon2 · slowapi · structlog |
| **App móvil** (`depaso_app`) | Expo SDK 54 + expo-router 6 + React Native 0.81 + React 19 · NativeWind 4 (tokens cream/forest/lime) · zustand + TanStack Query v5 · Reanimated 4 |
| **Panel web** (`depaso_web`) | Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui · TanStack Query v5 + react-router-dom + axios · Recharts |
| **IA/ML** | TensorFlow/Keras · MobileNetV2 transfer learning, dual input (imagen 224×224 + flag objeto de referencia) · entrenamiento en Google Colab |
| **Infra** | Docker (ya contenerizada) · Render (backend) + Supabase (Postgres) + Vercel (web) + EAS (APK Android) — ver §4 |

---

## 1. Estado actual — QUÉ ESTÁ HECHO (verificado 6-jul contra el código)

### Backend (`depaso_rest`) — ~98%
- ✅ Auth completo: registro cliente/carrier, login, **refresh tokens**, forgot/reset password wired, argon2, rate limiting slowapi.
- ✅ Shipments: máquina de estados validada (`PENDING → ASSIGNED → PICKUP_ARRIVED → IN_TRANSIT → DELIVERED / CANCELLED`), eventos auditables, cancelación con penalización de reputación (−0.3), quote con precio dedicado vs colaborativo.
- ✅ Matching: knockouts (verificado, capacidad residual, tabla vehículo/carga, XL nunca colaborativo, desvío ≤15%), scoring w1–w5 **editable por admin en DB** (`PATCH /matching/weights`), desvío por inserción, explicabilidad en español.
- ✅ Modalidad 2 (`BY_AVAILABILITY`): wiring completo en `_rank_dedicated` (consulta ventanas `dedicated_window` activas) + toggle real en `SummaryScreen`. **Gap C2: cerrado.**
- ✅ Routes (trayecto colaborativo + ventana dedicada), Tracking (GPS polling 15s, privacidad), CO₂ (factores IPCC, real vs contrafactual), Ratings, Capacidad derivada, Admin (dashboard, moderación de carriers, weights).
- ✅ Vision: `POST /vision/classify` con carga del modelo en startup y **fallback determinístico** si el `.keras` no está — la API nunca se rompe sin modelo.
- ✅ **Módulo `organizations` (pymes)**: models + service + router + migración `002_organizations` registrados. Dos tipos: fletera (gestiona flota: alta/baja de carriers, baja = inactivo, nunca borra el user) y de productos (crea/programa envíos con `organization_id`). Finanzas: dinero puesto (gastado en envíos) vs ganado (por la flota, **neto de comisión**), mensual + acumulado.
- ✅ **Pago simulado + comisión de plataforma** (migración `003_payment_status`): `POST /shipments/{id}/pay` (escrow simulado `pending → paid → released`/`refunded`). Comisión definida en `shipments/pricing.py` (`PLATFORM_COMMISSION_RATE = 0.15`, con `platform_fee()` / `carrier_payout()`), justificada por la brecha WTP/WTA de la encuesta. El cliente paga el precio completo (dinero puesto); el cadete cobra neto de comisión (ganado). Aplicada consistentemente en el desglose de pago, el summary del cadete (`/carriers/me/summary`) y las finanzas de la org.
- ✅ Seed demo idempotente + smoke test E2E completo.

### App móvil (`depaso_app`) — ~95%
- ✅ Flujos cliente y cadete completos y wired a la API real (crear envío con foto+IA, tracking con polling, calificación, feed, hitos de estado, GPS publisher).
- ✅ **Rider screens rehechas desde los mockups** (`screens/rider.jsx`): RiderHomeScreen (offline/online), PublishTripScreen, IncomingOfferModal, RiderEarningsScreen + tab Pagos, MotoIcon SVG, riderStore. NativeWind, tsc 0 / eslint 0.
- ✅ Pantalla Impacto CO₂, perfil, tabs por rol, admin.
- ✅ **Pago simulado en el flujo de envío**: al confirmar se abre una hoja de pago (`SummaryScreen`) que muestra el total y, al pagar, el desglose transparente (monto · comisión DePaso · payout al cadete).
- ✅ **Notificaciones locales** (`expo-notifications`): hook `useShipmentNotifications` montado en `(main)/_layout`. Cliente: aviso en cada cambio de estado de su envío (asignado / en retiro / en tránsito / entregado / cancelado). Cadete: aviso de nuevas ofertas que le quedan de paso. Sin infra de push (se disparan desde el polling del cliente) — atacan el pain point #1 de la encuesta (demoras/seguimiento/coordinación).

### Panel web (`depaso_web`) — ~100% (código; falta solo deploy → §4)
- ✅ Scaffold Vite + infraestructura: `lib/api.ts` (axios + refresh), `queryClient`, `stores/auth`, `types`, tokens en `index.css`, componentes shadcn/ui (button, card, table, dialog, tabs, badge, toast, select, input, label, skeleton).
- ✅ Entry point (`main.tsx`), routing con guard de auth (`App.tsx`), layout con sidebar (`AppShell`), login.
- ✅ Páginas completas wired a endpoints reales: **Dashboard** (`/organizations/me/dashboard`), **Flota** (alta/baja de carriers vía `/organizations/me/carriers`), **Envíos** (`/organizations/me/shipments`), **Finanzas** (puesto vs ganado, `/organizations/me/finance`, Recharts), **Admin** (dashboard global, moderación de carriers, matching weights, health del API + estado del modelo de visión).
- ✅ `npx tsc --noEmit` limpio + `npm run build` OK. Flujo E2E verificado en vivo (registro → crear org → dashboard/finanzas/carriers 200).

### IA/ML — ~45% (código listo, falta dataset + entrenar → §3)

---

## 2. QUÉ FALTA — código

> **Estado 7-jul: los tres workstreams de código (A/C/E) están CERRADOS y verificados.** No queda código pendiente para el MVP salvo lo que depende del modelo IA (§3) y del deploy (§4). Detalle de lo hecho abajo, marcado ✅.

### A. Backend al 100% — owner: **rm** ✅ (commit 04c49b8)
- [x] `organizations` verificado end-to-end (boot, migración `002`, flujo curl completo: registro → crear org → dashboard/finanzas/carriers 200). Re-verificado en vivo el 7-jul.
- [x] `ORGANIZATIONS_API_CONTRACT.md` publicado (contrato para el panel web).
- [x] Gap C1 cerrado: knockout movilidad suave (peatón/bici <5km) en el check compartido de **todos** los paths de matching, incluido `_rank_dedicated`.
- [x] `datetime.utcnow()` → `datetime.now(timezone.utc)` (0 llamadas reales restantes).
- [x] Hardening: guard de producción que rechaza `JWT_SECRET` default inseguro y CORS `*`.
- [~] Overlap `packages`/`freight` vs `shipments`: convive sin romper el frontend (limpieza opcional, no bloquea MVP).

### C. Panel web `depaso_web` completo — owner: **depaso-web** ✅ (commit 18010fe)
- [x] `main.tsx` + `App.tsx` + react-router + guard de auth, login (`POST /auth/login`), layout con sidebar (`AppShell`).
- [x] **Dashboard** (KPIs org) · **Flota** (alta/baja de carriers con badges) · **Envíos** (tabla + crear/programar) · **Finanzas** (puesto vs ganado, Recharts) — todo wired a endpoints reales.
- [x] **Admin** = ítem de alcance de la tesis *"Herramientas básicas de monitoreo operativo para administradores"*: KPIs globales, moderación de carriers, matching weights, health del API + estado del modelo de visión (cargado/fallback). Es la UI con la que Martina opera todo en producción.
- [x] `npx tsc --noEmit` limpio + `npm run build` OK.

### E. UI quality pass del app móvil — owner: **jimin** ✅ (commit dc03003)
- [x] Eliminada la card falsa "Asegurado / Hasta $80k" de `app/index.tsx` (cobertura ante daños fuera del MVP).
- [x] Borrado `OfferSelectionScreen.tsx` huérfano.
- [x] `StyleSheet.create` restantes migrados a NativeWind (SummaryScreen, CarrierShipmentsScreen, ImpactScreen, ShipmentsScreen, AdminScreen, RouteOfferScreen, ProfileScreen).
- [x] Hex hardcodeados (`#8E5A0B` etc.) → tokens.
- [x] Pase general de estados vacíos/carga, feedback en mutaciones, contraste. tsc 0 / eslint 0.

**Verificación global (corrida 7-jul, todo en verde):**
```bash
cd depaso_rest && DATABASE_URL="sqlite:///./depaso_test.db" RATE_LIMIT_ENABLED=false \
  .venv/bin/python -m pytest tests/ -q -p no:warnings        # existentes en verde
cd depaso_app && npx tsc --noEmit && npx eslint .            # 0 / 0
cd depaso_web && npx tsc --noEmit && npm run build           # OK
```

---

## 3. IA/ML — instrucciones (lo hace Martina, nadie más lo toca)

El código del pipeline ya existe y está corregido. Lo único que falta es **dataset + entrenar + evaluar + copiar el modelo**. **Guía completa paso a paso: `depaso_rest/ml/GUIA_IA.md`** + tres notebooks listos para Colab en `depaso_rest/ml/notebooks/` (`01_dataset.ipynb` · `02_entrenamiento.ipynb` · `03_evaluacion.ipynb`). Referencia corta en inglés: `COLAB_QUICKSTART.md`. La MacBook no tiene GPU — el entrenamiento va en Colab.

### Paso 1 — Dataset (~1500 imágenes, 4 clases `s|m|l|xl`)
1. `ml/dataset/download_open_images.py` — baja ~70% desde Open Images V7 vía FiftyOne (Box, Envelope, Suitcase, Furniture…).
2. **Fotos propias (~30%, ~450-600)**: paquetes reales S/M/L/XL variando iluminación (natural/artificial/baja), ángulo (frontal/cenital/oblicuo) y fondo (liso/desordenado/exterior). Sacar **pares con y sin objeto de referencia** (celular/botella) — alimenta el flag `has_reference_object`.
3. Etiquetar en `labels.csv`: `filename,category,lighting,angle,background,has_reference_object,source`.
4. `ml/dataset/build_dataset.py` — dedup por hash perceptual, valida el CSV.
5. `ml/dataset/make_splits.py` — split 70/15/15 estratificado por categoría **y** condiciones de sesgo. El test set queda congelado.

### Paso 2 — Entrenamiento (Colab)
- `ml/train_classifier.py`: Etapa A (base congelada, Adam 1e-3, 20 épocas, EarlyStopping) → Etapa B (fine-tune últimas ~30 capas, Adam 1e-5, 10 épocas). Guardar las curvas (van a la tesis).
- Exporta `cargo_classifier_v1.keras` + `metadata.json`.

### Paso 3 — Evaluación y sesgos (capítulo de la tesis)
- `ml/evaluate_bias.py` sobre el test set: accuracy global (objetivo ≥80%, mínimo defendible 75%), precision/recall/F1 por clase, matriz de confusión, y **accuracy por grupo** (iluminación/ángulo/fondo/con-sin referencia, ⚠️ si un grupo cae >10 puntos). Los PNG + markdown salen casi directo al capítulo de sesgos.

### Paso 4 — Integración (automática)
- Copiar el modelo a `depaso_rest/ml/models/cargo_classifier_v1.keras` (path por defecto de `vision_model_path` en config; override con env `VISION_MODEL_PATH`). El backend lo carga solo en el startup; sin modelo sigue funcionando con el fallback.

### Constraints que NO se pueden romper
- `CATEGORIES = ["s", "m", "l", "xl"]` — orden fijo (la inferencia indexa por posición). Nunca `xs`.
- El modelo tiene **dos inputs siempre**: `model.predict([img_batch, ref_batch])`.
- `preprocess_input` se aplica **solo en el pipeline de datos**, no dentro del modelo ni en `vision/service.py` (el bug de doble preprocesado ya se corrigió una vez — no reintroducirlo).

---

## 4. Infraestructura y deploy — recomendación (owner: felix, cuando el código cierre)

### Decisión: Render + Supabase + Vercel + EAS. **NO Kubernetes, NO AWS.**

| Pieza | Dónde | Por qué |
|---|---|---|
| Backend FastAPI | **Render** (Docker, free tier) | Ya está contenerizada (`Dockerfile` multi-stage listo) y `render.yaml` ya existe — es deploy por blueprint, cero config nueva. |
| PostgreSQL | **Supabase** (free) | Postgres gestionado sin operar nada; el código ya soporta Postgres vía `DATABASE_URL`. |
| Panel web `depaso_web` | **Vercel** (free) | Es un build estático de Vite — Vercel lo sirve gratis con deploy automático desde GitHub. Alternativa equivalente: Netlify. |
| APK Android (defensa) | **EAS Build** | `eas build --profile preview --platform android` — `eas.json` ya está configurado. |
| Modelo ML | Dentro de la imagen Docker (o volumen) | ~15 MB; se carga una vez en el lifespan. `VISION_MODEL_PATH` por env. |

**¿Por qué no Kubernetes?** K8s orquesta *muchos* contenedores con equipo de ops detrás. DePaso es **un** contenedor + una DB gestionada, presupuesto $0 (RNF-COST) y un equipo de una persona: K8s suma clusters, YAML y costos sin ningún beneficio para el MVP. Para la tesis se menciona como camino de escalado futuro (junto con réplicas y autoscaling), no se implementa.

**¿Por qué no AWS/GCP?** Poder haría lo mismo (ECS/Cloud Run), pero con mucha más fricción (IAM, VPC, billing con riesgo de costos sorpresa, free tier que vence). Render/Supabase/Vercel dan el mismo resultado con horas menos de configuración. Si un jurado pregunta: la app es portable — es Docker + Postgres estándar, migrar a AWS es cambiar dónde corre el contenedor, no el código (RNF-PRT-02).

**Sí conviene mantener Docker**: es lo que hace la app portable y es lo que Render consume. `docker-compose.yml` sigue siendo el entorno dev local con Postgres.

### Pasos concretos del deploy (cuando A/C/E estén cerrados)
1. Supabase: crear proyecto → copiar `DATABASE_URL` → `alembic upgrade head` contra esa DB → correr seed.
2. Render: New → Blueprint → apuntar al repo (`render.yaml`). Env: `DATABASE_URL`, `JWT_SECRET_KEY` (se autogenera), `VISION_MODEL_PATH`. Verificar `GET /api/v1/health` → 200.
3. Vercel: importar el repo, root directory `depaso_web`, build `npm run build`, env `VITE_API_URL` apuntando a Render.
4. EAS: `eas login` → `eas build --profile preview --platform android` → APK para la defensa.
5. ⚠️ Render free hace *spin down* tras ~15 min sin tráfico (cold start ~30-60s). Para la defensa: pegarle al health 5 min antes de la demo, o un cron ping (p. ej. cron-job.org) los días previos.

---

## 5. Tests — al final, explícitamente diferidos (owner: jungkook)
- Corregir los 7 tests de `test_vision.py` cuando exista el modelo real.
- Cobertura actual 76% (objetivo RNF-MNT-02 de 60% ya superado; meta 80%).
- Formalizar el smoke E2E como test pytest; QA manual en dispositivo real (GPS background, conectividad intermitente).

## 6. Tesis escrita (`../UADE_PFI_Template-develop`)
- **Cap 4 (hoy vacío)**: arquitectura 4 capas, las 4 modalidades, matching (knockouts + scoring w1–w5), máquina de estados, decisiones (polling vs WebSocket, capacidad derivada, CO₂ al aceptar, argon2 vs bcrypt, scoring determinístico vs subastas), restricciones vehículo/carga. + Sub-cap IA (dataset, MobileNetV2 dual-input, métricas, sesgos — sale de §3 paso 3) + sub-cap testing.
- **Cap 1/3**: el panel pymes materializa el ítem existente *"Herramientas básicas de monitoreo operativo para administradores"* — describir el rol B2B (personas pyme fletera / pyme de productos), **sin ampliar el alcance**.
- **Limitaciones y trabajo futuro**: cobertura ante daños (73.4% de carriers lo pide — se documenta el diseño, no se integra aseguradora), notificaciones push, elasticidad de precios, K8s/escalado.
- Conclusiones, abstract, summary.

## 7. Cronograma restante (jul–dic 2026)

| Período | Qué | Estado |
|---|---|---|
| **Julio (1-2)** | ✅ Workstreams A + C + E cerrados (7-jul) · 🔄 Dataset IA: Open Images + fotos propias (empezar YA) | 🔄 |
| **Agosto** | Entrenamiento v1 en Colab + evaluación de sesgos | ⏳ |
| **Septiembre** | Modelo real integrado, QA en dispositivo, tests vision corregidos | ⏳ |
| **Octubre** | Deploy de prueba (Render+Supabase+Vercel), pulido | ⏳ |
| **Noviembre** | Deploy productivo + APK EAS + fix bugs | ⏳ |
| **Diciembre** | Cap 4 + docs finales (1-2) · Defensa (3-4) | ⏳ |

**Hitos GO/NO-GO:** dataset completo 31-ago · modelo v1 ≥75% accuracy 15-sep · deploy productivo + APK 30-nov · defensa lista 15-dic.
**Riesgo #1:** el dataset es lo único que no se acelera con código — las fotos propias empiezan YA, en paralelo con todo lo demás.

---

## 8. Referencia rápida

```bash
# Backend local
cd depaso_rest
DATABASE_URL="sqlite:///./depaso_dev.db" .venv/bin/python -m scripts.seed_demo
DATABASE_URL="sqlite:///./depaso_dev.db" .venv/bin/uvicorn src.app.main:app --reload
DATABASE_URL="sqlite:///./depaso_dev.db" .venv/bin/python -m scripts.smoke_test

# App móvil
cd depaso_app && npx expo start        # typecheck: npx tsc --noEmit · lint: npx eslint .

# Panel web
cd depaso_web && npm run dev           # build: npm run build
```

**Usuarios demo:** admin@depaso.com/admin1234 · cliente@depaso.com/cliente1234 · lucia@depaso.com/lucia1234 (cadete moto verificada) · carlos@depaso.com/carlos1234 (camión, pendiente de verificación).

**Gotchas:**
- `.venv/bin/pip` roto → usar `.venv/bin/python -m pip`.
- `.env` apunta a Postgres local; para correr sin Postgres, override `DATABASE_URL` a SQLite.
- El repo vive en iCloud Drive: ante errores raros de `node_modules` → `rm -rf node_modules && npm ci`.
- El seed consume datos si el smoke corrió antes — re-seedear ante dudas.
- Sin el `.keras`, el endpoint de visión usa fallback determinístico automáticamente.
