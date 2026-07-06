# DePaso — CLAUDE.md

Tesis de grado (PFI) — app de logística colaborativa de última milla con clasificación de paquetes por visión artificial. Proyecto de Martina Toffoletto, UADE 2026.

## Estructura del monorepo

```
DePaso/
├── depaso_rest/      # Backend FastAPI
├── depaso_app/       # Frontend Expo (React Native)
├── depaso_web/       # Panel web pymes/admin (Vite + React + shadcn/ui)
├── docker-compose.yml
├── render.yaml       # Deploy config para Render (backend)
├── ARQUITECTURA.md   # Referencia técnica: cómo está construido el sistema
└── PLAN_MAESTRO.md   # Única fuente de verdad: estado actual y qué falta para el MVP
```

---

## Backend — `depaso_rest/`

### Stack
- **FastAPI** + **Pydantic v2**, **SQLAlchemy 2** + **Alembic**, **PostgreSQL** (prod) / SQLite (tests)
- Auth: JWT access+refresh, argon2 (passlib). Rate limiting: slowapi. Logging: structlog.

### Arquitectura modular
```
src/app/modules/<nombre>/
  router.py      # FastAPI routes
  service.py     # Business logic
  repository.py  # DB access (extiende BaseRepository)
  schemas.py     # Pydantic request/response
  models.py      # SQLAlchemy ORM
```
Shared: `src/app/core/` (config, security, deps, DB), `src/app/shared/` (enums, geo, base_repository, exceptions, osrm_client).

### Módulos principales
| Módulo | Descripción |
|--------|-------------|
| `auth` | Login, registro, refresh token, reset password |
| `users` | Perfil de usuario, cambio de datos |
| `carriers` | Perfil de transportista, vehículo, disponibilidad |
| `shipments` | Ciclo de vida del envío (PENDING → DELIVERED) |
| `matching` | Algoritmo de scoring y ranking de carriers |
| `routes` | Rutas habituales (dedicated_window para BY_AVAILABILITY) |
| `tracking` | GPS traces y eventos de estado |
| `vision` | Clasificación de paquetes por imagen (MobileNetV2) |
| `co2` | Cálculo de huella de carbono e impacto ambiental |
| `ratings` | Calificaciones post-entrega |
| `admin` | Panel de administración |

### Taxonomía de paquetes (CRÍTICO — no cambiar)
```python
PackageSize: s | m | l | xl   # nunca "xs"
```
Definido en `shared/enums.py`. Debe coincidir con el frontend (`src/types/index.ts`) y el modelo ML (`ml/train_classifier.py CATEGORIES`).

### Máquina de estados del envío
```
PENDING → ASSIGNED → PICKUP_ARRIVED → IN_TRANSIT → DELIVERED
                                                  ↘ CANCELLED
```

### Modalidades de servicio
- `ShipmentModality`: `dedicated` | `collaborative`
- `AssignmentMode`: `on_demand` | `by_availability`
- Regla: mudanzas/fletes (XL) → siempre dedicated.
- Regla: movilidad suave (pedestrian/bike) → máx 5km de distancia.

### Comandos clave
```bash
# Instalar dependencias
cd depaso_rest && .venv/bin/python -m pip install -r requirements.txt

# Correr servidor
./start.sh   # o: uvicorn src.app.main:app --reload

# Migraciones
.venv/bin/alembic upgrade head

# Tests (siempre con SQLite override)
DATABASE_URL="sqlite:///./depaso_test.db" RATE_LIMIT_ENABLED=false \
  .venv/bin/python -m pytest tests/ -q -p no:warnings

# Coverage actual: 76% (100 tests, todos pasan)
```

### Gotchas
- `.venv/bin/pip` está roto — usar `.venv/bin/python -m pip`
- `.env` apunta a Postgres local. Para tests locales sin Postgres: `DATABASE_URL="sqlite:///./depaso_test.db"`
- El seed (`scripts/seed_demo.py`) consume datos si se corre dos veces — usar con cuidado
- Modelo ML no está en el repo (`.gitignore`). Vive en `depaso_rest/models/cargo_classifier_v1.keras`. Sin el modelo, el endpoint de visión cae a stub automáticamente (`VISION_MOCK=true`).

---

## Frontend — `depaso_app/`

### Stack
- **Expo SDK 54**, **expo-router 6** (file-based routing, `typedRoutes: true`)
- **React Native 0.81**, **React 19**, **NativeWind 4** (Tailwind via `className`)
- **Reanimated 4**, **zustand** (stores), **@tanstack/react-query**, **axios**

### Estructura
```
app/
  (auth)/          # login, register, forgot-password, reset-password
  (main)/          # tabs principales (role-based)
    index.tsx      # redirect según rol
    enviar.tsx     # sender: flow de envío / carrier: FeedScreen
    envios.tsx     # sender: ShipmentsScreen / carrier: CarrierShipmentsScreen
    impacto.tsx    # solo clientes: pantalla CO2
    perfil.tsx     # todos los roles
    admin.tsx      # solo admins
src/
  features/
    sender/        # screens del cliente (send-flow, ShipmentsScreen, ImpactScreen)
    carrier/       # FeedScreen, CarrierShipmentsScreen, PublishRouteScreen
    profile/       # ProfileScreen
    admin/         # AdminScreen
  stores/          # zustand: authStore, shipmentStore
  services/        # axios: api.ts, vision.ts, co2Service, etc.
  types/           # index.ts — tipos compartidos y enums TS
constants/
  tokens.ts        # Design tokens → importar como `T` (ej: T.forest, T.bg)
```

### Roles y tabs
| Rol | Tab "Pedidos/Enviar" | Tab "Mis Viajes/Envíos" | Tab especial |
|-----|---------------------|------------------------|--------------|
| CLIENT | FlowNavigator (crear envío) | ShipmentsScreen | Impacto (leaf) |
| CARRIER | FeedScreen | CarrierShipmentsScreen | — |
| ADMIN | — | — | Admin (shield) |

### Convenciones críticas
- Auth gating: `Stack.Protected guard={}` en `app/_layout.tsx`. No usar `useEffect + router.replace`.
- Rutas tipadas ON — nunca `href as any`, arreglá el tipo.
- Zustand: siempre seleccionar slices (`useAuthStore(s => s.user)`), no el store completo.
- `useSafeAreaInsets()` para padding top/bottom.
- Design tokens: `T.forest` (verde primario), `T.bg` (fondo), `T.ink` (texto), `T.inkMute` (texto secundario), `T.border`.

### Comandos clave
```bash
cd depaso_app

# Typecheck (debe dar 0 errores)
npx tsc --noEmit

# Lint (debe dar 0 warnings)
npx eslint .

# Dev server
npx expo start

# Build APK para defensa (una vez configurado EAS)
eas build --profile preview --platform android
```

---

## Pipeline ML — `depaso_rest/ml/`

### Modelo
MobileNetV2 fine-tuned, **dual input**: imagen (224×224×3) + flag `has_reference_object` (0/1).
Output: 4 clases → `["s", "m", "l", "xl"]`.
Guardado como `cargo_classifier_v1.keras` (formato Keras, no `.h5`).

### Pipeline en orden
```
download_open_images.py   # descarga imágenes de Open Images (FiftyOne)
↓ agregar fotos propias (~30% del dataset)
build_dataset.py          # dedup phash, valida labels.csv
make_splits.py            # 70/15/15 con estratificación de bias
train_classifier.py       # entrena y guarda el modelo
evaluate_bias.py          # reporte de accuracy + bias por iluminación/ángulo/fondo
```

Ver `ml/COLAB_QUICKSTART.md` para correr el pipeline completo en Google Colab (el MacBook no tiene GPU).

### Constraints críticos (no romper)
- `CATEGORIES = ["s", "m", "l", "xl"]` — orden fijo, indexado por la inferencia.
- `model.predict([img_batch, ref_batch])` — dos inputs, siempre.
- `preprocess_input` se aplica **solo en el pipeline de datos** (`make_dataset`), no dentro del modelo ni en `vision/service.py`.

---

## Deploy

### Backend (Render)
```bash
# render.yaml ya configurado. Para deployar:
# 1. Render dashboard → New → Blueprint → apuntar al repo
# 2. Setear DATABASE_URL manualmente (Supabase o Render Postgres)
# 3. JWT_SECRET_KEY se auto-genera
# 4. Verificar: GET https://depaso-api.onrender.com/api/v1/health → 200
```

### Mobile (EAS)
```bash
eas login
eas build:configure          # primera vez
eas build --profile preview --platform android   # APK para defensa
```

---

## Equipo de agentes (Claude Code)

| Agente | Rol |
|--------|-----|
| `rm` | Backend FastAPI, endpoints, DB, migraciones |
| `suga` | ML training pipeline, clasificador de carga |
| `v` | Integración modelo→endpoint visión, demo |
| `jimin` | Frontend Expo/React Native |
| `jin` | Code quality, security review |
| `jungkook` | Testing pytest + E2E |
| `jhope` | Lógica de negocio: matching, CO2, máquina de estados |
| `bang-chan` | Arquitecto, requisitos, decisiones de stack |
| `felix` | DevOps: EAS builds, deploy Render, Docker |

---

## Decisiones de diseño importantes

- **Sin subastas en matching** — scoring determinístico justificado por ausencia de datos históricos al inicio (tesis cap. 2).
- **Desvío es knockout, no scoring** — un carrier que se desvía demasiado no aparece en el ranking.
- **Mudanzas (XL) siempre dedicadas** — nunca colaborativas, por volumen.
- **Cobertura ante daños** — fuera del alcance del MVP. Documentado como limitación en la tesis.
- **Modalidad 2 (BY_AVAILABILITY) UI de publicación** — backend implementado, UI de publicación de ventana wired como tab "Mi Ruta" para carriers.

Resume this session with:
claude --resume a5413fbf-60e6-4b76-87b4-31faf4a37d0e