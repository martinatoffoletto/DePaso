# DePaso — Stack Tecnológico y Arquitectura

> Documento de referencia técnica para el PFI: **cómo está construido el sistema** (stack,
> arquitectura backend/frontend/web, organización del código, pantallas, y el plan completo
> del modelo de visión). Basado en los requerimientos de `proy.txt` y `PROYECTO.txt`.
> **Qué falta hacer y en qué orden vive en `PLAN_MAESTRO.md`** (única fuente de verdad del backlog).
> **Diagramas (C4 alto/medio/bajo, secuencia, despliegue) + justificación de infra
> (Terraform/Jenkins/CI-CD): `ARQUITECTURA_DIAGRAMAS.md`.**
> Actualizado: julio 2026 — incluye el panel web `depaso_web` y el módulo `organizations`.

---

## 1. Stack recomendado (resumen ejecutivo)

| Capa | Tecnología | Por qué |
|---|---|---|
| **Backend** | Python 3.12 + FastAPI (async) | Mandatorio por propuesta. Async nativo, OpenAPI gratis (RNF-MNT-04), Pydantic v2 integrado (RNF-SEC-04) |
| **ORM / DB** | SQLAlchemy 2 async + **PostgreSQL 16 + PostGIS** | PostGIS es **obligatorio** para matching geoespacial (RNF-SCAL-02, ST_DWithin). GeoAlchemy2 para modelos |
| **DB hosting** | **Supabase** (free tier) | Postgres + PostGIS + Storage con URLs firmadas (RNF-SEC-07) + Auth opcional. Todo en tier gratuito (RNF-COST) |
| **Migraciones** | Alembic | Ya configurado, mandatorio (RNF-MNT-03) |
| **Auth** | JWT access (30 min) + refresh token (7 días), passlib + **argon2** | RNF-SEC-03. Nota: la spec dice bcrypt, pero argon2 (ya instalado) es superior — documentar la mejora en la tesis |
| **Rate limiting** | `slowapi` | RNF-SEC-06 (5 intentos/min en login) con una sola dependencia |
| **Ruteo / distancias** | **OSRM** (demo server público o Docker local) | Necesario para `compat_geo` y `desvio_norm` del matching (5.2) y para CO₂ contrafactual. Gratis |
| **ML** | TensorFlow / Keras + **MobileNetV2** (transfer learning) | Mandatorio por propuesta (5.1). Entrenamiento en Google Colab (GPU gratis) |
| **Inferencia ML** | Modelo exportado `.keras` / SavedModel cargado en FastAPI | < 2 s por imagen (RNF-PERF-02). Sin servicios de terceros (RNF-UADE-04) |
| **Frontend** | React Native 0.81 + **Expo SDK 54** + Expo Router | Mandatorio por propuesta. File-based routing, builds EAS |
| **Estilos** | **NativeWind v4** (Tailwind) + tokens propios | Ya configurado. **Recomendación: eliminar React Native Paper** y quedarse solo con NativeWind + componentes propios (un solo sistema de estilos, bundle más chico, diseño cream/forest ya hecho) |
| **Server state** | TanStack Query v5 | Cache, polling (tracking RF-TRK), retry, offline (RNF-AVL-02) |
| **Client state** | Zustand | Sesión, flujo de creación de envío multi-pantalla |
| **Formularios** | react-hook-form + Zod | Registro, creación de pedido. Validación espejo de Pydantic |
| **Mapas** | react-native-maps | Ya instalado. Google Maps (Android, key gratis) / Apple Maps (iOS) |
| **Cámara / fotos** | expo-camera + expo-image-picker + expo-image-manipulator | Foto del paquete → resize a 224×224 **en el cliente** antes de subir (menos ancho de banda, inferencia más rápida) |
| **Tracking GPS** | expo-location + polling con React Query (`refetchInterval`) | Push productivas excluidas del PFI (7.2) — polling cada 15-30 s cumple RF-TRK |
| **Panel web pymes/admin** | **`depaso_web`**: Vite + React 19 + TS + Tailwind 4 + shadcn/ui + TanStack Query v5 + react-router + Recharts | Carpeta hermana que consume los mismos endpoints. Monitoreo para pymes (flota, envíos, finanzas) + panel admin operativo. Deploy estático gratis (Vercel) |
| **Deploy backend** | Docker + **Render** (free) o **Fly.io** | RNF-PRT-02. Docker-compose ya existe para dev local |
| **Logs** | structlog (JSON) | Ya instalado. RNF-MNT-05, RNF-OBS-01 |
| **Tests** | pytest + pytest-asyncio + httpx (back) / jest + RNTL (front, opcional) | Cobertura ≥ 60% en auth, shipments, matching (RNF-MNT-02) |
| **CI** | GitHub Actions (free) | lint (ruff/eslint) + tests en cada push |

**Veredicto sobre el stack: está bien elegido y ya completado en lo esencial.**
Estado de las recomendaciones originales (jul-2026):
1. ✅ **slowapi** (rate limiting) y **refresh tokens** — implementados.
2. ✅ **OSRM** — `shared/osrm_client.py` con degradación automática al fallback haversine×1.3 (suficiente para la demo; el contenedor OSRM propio es opcional).
3. ⚪ **PostGIS** — no activado; el matching usa haversine con factor de circuidad y funciona. Queda como optimización de escalado (documentar en tesis, no bloquea el MVP).
4. ⚪ **React Native Paper** — la app usa NativeWind + componentes propios como sistema principal.

---

## 2. Arquitectura Backend (`depaso_rest`)

### 2.1 Patrón: modular por dominio + 4 capas (RNF-MNT-01)

Cada módulo de dominio tiene exactamente 4 archivos con responsabilidades estrictas:

```
router.py      → HTTP: define endpoints, valida auth, llama al service. SIN lógica de negocio.
service.py     → Lógica de negocio: orquesta repositorios, aplica reglas, lanza excepciones de dominio.
repository.py  → Acceso a datos: queries SQLAlchemy. SIN lógica de negocio.
schemas.py     → Pydantic: request/response models. Lo único que el router expone.
models.py      → (5to archivo) Modelos SQLAlchemy del dominio.
```

Regla de dependencia: `router → service → repository → DB`. Nunca al revés, nunca salteando capas.

### 2.2 Estructura de carpetas

```
depaso_rest/
├── src/app/
│   ├── main.py                  # FastAPI app, middlewares, routers, lifespan (carga modelo ML)
│   ├── core/
│   │   ├── config.py            # Pydantic Settings (env vars)
│   │   ├── database.py          # engine async, session factory, get_db
│   │   ├── security.py          # JWT encode/decode, hash argon2, deps get_current_user
│   │   └── exceptions.py        # excepciones de dominio + handlers HTTP
│   ├── modules/
│   │   ├── auth/                # RF-USR-01..04: registro, login, refresh, recovery
│   │   ├── users/               # RF-USR-05..06: perfil, roles duales cliente+transportista
│   │   ├── carriers/            # RF-CAR + RF-USR-07: vehículos, validación admin, disponibilidad
│   │   ├── shipments/           # RF-SHP: CRUD pedidos, máquina de estados, calificaciones
│   │   ├── routes/              # RF-CAR-01/02: trayectos colaborativos y disponibilidad dedicada
│   │   ├── matching/            # RF-MAT: scoring multivariable, filtros knockout, pesos en DB
│   │   ├── vision/              # RF-VIS: POST /classify, carga del modelo, log de clasificaciones
│   │   ├── tracking/            # RF-TRK: ingesta GPS, última posición, historial de trazas
│   │   ├── capacity/            # RF-CAP: volumen por vehículo, reserva/liberación
│   │   ├── co2/                 # RF-CO2: cálculo determinístico, acumulados
│   │   ├── organizations/       # Pymes: orgs, miembros, flota (alta/baja), envíos B2B, finanzas
│   │   └── admin/               # RF-ADM: stats, moderación, configuración de pesos
│   ├── common/                  # utils compartidos (paginación, geo helpers, enums globales)
│   └── shared/                  # clientes externos: osrm_client.py, storage_client.py (Supabase)
├── ml/                          # TODO lo del modelo de IA (ver sección 5)
│   ├── dataset/                 # scripts de construcción del dataset (NO las imágenes — van en Drive)
│   ├── notebooks/               # Colab notebooks de entrenamiento y evaluación
│   ├── models/                  # modelo exportado .keras + metadata.json (versión, métricas)
│   └── reports/                 # matriz de confusión, análisis de sesgos (para la tesis)
├── alembic/                     # migraciones
├── tests/
│   ├── unit/                    # services con repos mockeados; matching y co2 son funciones puras → fáciles
│   └── integration/             # endpoints con DB de test (testcontainers o SQLite donde aplique)
├── Dockerfile
└── requirements.txt
```

### 2.3 Modelo de datos (entidades principales)

```
users (id, email, password_hash, name, phone, type[individual|comercial], roles[client,carrier])
carriers (user_id FK, vehicle_type[walk|bike|moto|car|van|truck], license, plate,
          status[pending|approved|suspended], rating_avg, volume_max, volume_available)
routes (id, carrier_id, kind[collab_route|dedicated_window], origin GEOGRAPHY(Point),
        destination GEOGRAPHY(Point), path GEOGRAPHY(LineString), zone GEOGRAPHY(Polygon),
        window_start, window_end, recurrence, active)
shipments (id, client_id, carrier_id?, origin Point, destination Point, status,
           payment_status[pending|paid|released|refunded],
           modality[dedicated|collaborative], assignment[on_demand|by_space],
           category[S|M|L|XL], volume_est, price, window_start, window_end,
           photo_url, co2_saved_kg, created_at)
shipment_events (id, shipment_id, status, timestamp, location?)        # auditoría de estados
classifications (id, shipment_id?, image_url, predicted_category, confidence,
                 accepted bool, manual_category?, has_reference_object, created_at)   # RF-VIS-04
gps_traces (id, carrier_id, shipment_id, location Point, timestamp)    # RF-TRK-03
ratings (id, shipment_id, stars 1-5, comment, created_at)
matching_weights (key w1..w5, value float)                             # 5.2 — editables por admin

# Pymes (módulo organizations)
organizations (id, name, cuit, kind[fleet|merchant|both], owner_user_id, created_at, updated_at)
organization_members (org_id, user_id, role[owner|manager], joined_at)          # PK compuesta
organization_carriers (org_id, carrier_id, status[active|inactive], linked_at, unlinked_at)
shipments.organization_id (FK nullable — envíos creados por la pyme)
```
Reglas del dominio pyme: el rol org se **deriva de la membresía** (no va en el JWT); la baja de un
carrier es `status=inactive` + `unlinked_at` (nunca borra el user); las finanzas son
**dinero puesto** (Σ price de envíos de la org) vs **dinero ganado** (Σ ganancias netas de envíos
DELIVERED de la flota), por mes + acumulado. Contrato completo: `ORGANIZATIONS_API_CONTRACT.md`.

**Pago simulado + comisión (RF-SHP):** la pasarela se simula (alcance). `POST /shipments/{id}/pay`
mueve `payment_status` por un escrow `pending → paid → released` (al entregar) / `refunded` (al
cancelar). La comisión de plataforma vive en `shipments/pricing.py` (`PLATFORM_COMMISSION_RATE = 0.15`
+ `platform_fee()` / `carrier_payout()`): el cliente paga el precio completo (**puesto**), el cadete
cobra neto (**ganado**), la plataforma retiene la comisión. Aplica en el desglose de pago, el summary
del cadete y las finanzas de la org.

Índices clave: GIST sobre todas las columnas GEOGRAPHY; índice compuesto sobre
`gps_traces(carrier_id, timestamp DESC)`; índice sobre `shipments(status)`.

### 2.4 Máquina de estados del envío (RF-SHP-05)

```
pending → assigned → pickup_arrived → in_transit → delivered
   ↓          ↓
cancelled  cancelled (penaliza reputación del carrier, RF-CAR-07)
```
Implementar como validación en `shipments/service.py`: transiciones permitidas en un dict,
cualquier otra lanza `InvalidTransitionError` → HTTP 409. Cada transición inserta en `shipment_events`.

### 2.5 Matching (módulo más importante después de vision)

```python
# matching/service.py — pseudocódigo de la estructura
async def match(shipment) -> list[Candidate]:
    candidates = await repo.knockout_filter(shipment)
    # SQL con PostGIS: activo + capacidad >= volumen + vehículo compatible (tabla 4.3)
    #                  + ST_DWithin(route.path, shipment.origin, X_km)
    scored = []
    for c in candidates:
        detour = await osrm.detour_km(c.route, shipment)      # desvío real por calles
        if detour / c.route_km > MAX_DETOUR[shipment.modality]:
            continue
        score = (w1 * compat_geo(c, shipment)
               + w2 * (1 - normalize(detour))
               + w3 * compat_carga(c, shipment)                # 0 o 1 (knockout ya filtró)
               + w4 * c.rating_avg / 5
               + w5 * compat_horaria(c, shipment))
        scored.append((score, c, explain(...)))               # explicabilidad: guardar componentes
    return top_k(scored, k=5)
```
Los pesos `w1..w5` se leen de `matching_weights` (cacheados, invalidables desde admin) — RF-ADM permite iterar sin redeploy.

`compat_*`, `normalize`, y el cálculo de CO₂ son **funciones puras** → unit tests triviales, clave para la cobertura del 60%.

### 2.6 Endpoints principales (mapa RF → API)

```
POST   /auth/register/client          RF-USR-01
POST   /auth/register/carrier         RF-USR-02
POST   /auth/login                    RF-USR-03
POST   /auth/refresh                  RNF-SEC-03
POST   /auth/forgot-password          RF-USR-04
GET/PATCH /users/me                   RF-USR-05
POST   /classify                      RF-VIS-01 (multipart image + has_reference_object)
POST   /shipments                     RF-SHP-01
GET    /shipments/{id} /shipments     RF-SHP-06, historial
POST   /shipments/{id}/pay            RF-SHP (pago simulado + comisión 15%)
POST   /shipments/{id}/cancel         RF-SHP-07
POST   /shipments/{id}/rating         RF-SHP-08
POST   /shipments/{id}/status         RF-CAR-05 (transiciones, solo carrier asignado)
POST   /routes                        RF-CAR-01/02 (trayecto o ventana dedicada)
GET    /carriers/me/feed              RF-CAR-03 / RF-MAT-03
POST   /shipments/{id}/accept|reject  RF-CAR-03/07
GET    /carriers/me/summary           RF-CAR-06 (historial, ingresos, reputación, CO₂)
POST   /tracking                      RF-TRK-01 (carrier publica posición)
GET    /shipments/{id}/location       RF-TRK-02 (cliente la consulta — polling)
GET    /admin/dashboard               RF-ADM-01/02
PATCH  /admin/carriers/{id}           RF-USR-07, RF-ADM-03
PATCH  /admin/matching-weights        5.2
```

---

## 3. Arquitectura Frontend (`depaso_app`)

### 3.1 Organización: Expo Router (rutas) + features (lógica)

```
depaso_app/
├── app/                            # SOLO routing — pantallas delgadas que montan features
│   ├── _layout.tsx                 # providers: QueryClient, fonts, auth guard
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register-client.tsx
│   │   ├── register-carrier.tsx    # + vehículo + documentación (RF-USR-02)
│   │   └── forgot-password.tsx
│   ├── (client)/                   # tab group del rol cliente
│   │   ├── _layout.tsx             # tabs: Inicio | Envíos | Impacto | Perfil
│   │   ├── index.tsx               # home: CTA crear envío + envíos activos
│   │   ├── create/                 # flujo crear envío — máx 4 pantallas (RNF-UX-01)
│   │   │   ├── route.tsx           # 1. origen/destino/ventana/modalidad (RF-SHP-01)
│   │   │   ├── package.tsx         # 2. foto → /classify → confirmar o manual (RF-SHP-02/03/04)
│   │   │   ├── offers.tsx          # 3. modalidad/precio (dedicada vs colaborativa)
│   │   │   └── confirm.tsx         # 4. resumen + confirmar
│   │   ├── shipment/[id].tsx       # tracking en vivo: mapa + estado + cancelar (RF-SHP-06/07)
│   │   ├── shipment/[id]/rate.tsx  # calificación post-entrega (RF-SHP-08)
│   │   ├── history.tsx
│   │   ├── impact.tsx              # CO₂ ahorrado acumulado (RF-CO2-03)
│   │   └── profile.tsx
│   ├── (carrier)/                  # tab group del rol transportista
│   │   ├── _layout.tsx             # tabs: Pedidos | Mi ruta | Activo | Ganancias | Perfil
│   │   ├── feed.tsx                # pedidos compatibles, aceptar/rechazar (RF-CAR-03)
│   │   ├── publish-route.tsx       # trayecto colaborativo (RF-CAR-01)
│   │   ├── publish-window.tsx      # disponibilidad dedicada (RF-CAR-02)
│   │   ├── active/[id].tsx         # envío activo: botones de estado + GPS en background (RF-CAR-05, RF-TRK-01)
│   │   ├── earnings.tsx            # historial, ingresos, reputación (RF-CAR-06)
│   │   └── profile.tsx             # incluye estado de validación (RF-USR-07)
│   └── (admin)/                    # solo Expo Web — panel operativo (RF-ADM)
│       ├── dashboard.tsx           # mapa en vivo, envíos activos, stats
│       └── moderation.tsx          # aprobar/suspender carriers, editar pesos
├── src/
│   ├── features/                   # lógica por dominio (espeja los módulos del back)
│   │   ├── auth/                   #   hooks (useLogin, useSession), api calls, stores
│   │   ├── shipments/
│   │   ├── classify/               #   useClassifyImage: captura → resize 224 → upload → resultado
│   │   ├── carrier/
│   │   ├── tracking/               #   useShipmentLocation (refetchInterval 15s), useGpsPublisher
│   │   └── impact/
│   ├── components/ui/              # design system propio: Button, Card, Badge, Input, Sheet...
│   ├── lib/
│   │   ├── api.ts                  # axios instance + interceptor refresh token
│   │   ├── queryClient.ts
│   │   └── schemas.ts              # Zod schemas (espejo de Pydantic)
│   └── constants/tokens.ts         # tokens cream/forest (ya existe)
```

**Reglas:**
- Las pantallas en `app/` no contienen lógica: importan de `src/features/*` y componen UI.
- Un rol = un route group. El guard en `_layout.tsx` raíz redirige según rol y sesión
  (un usuario con ambos roles puede cambiar de modo desde el perfil — RF-USR-06).
- Server state **siempre** en TanStack Query. Zustand solo para: sesión/rol activo y el
  borrador del envío entre las 4 pantallas del flujo `create/`.
- Tracking del cliente: `useQuery({ refetchInterval: 15_000 })` sobre `GET /shipments/{id}/location`.
- Publicación GPS del carrier: `expo-location` `watchPositionAsync` + POST cada 15-30 s
  mientras hay envío activo (RNF-PERF-04 tolera 30 s).
- Toda mutación con feedback visual: loading / toast success / toast error (RNF-UX-03).
- Texto mínimo 14, contraste AA (RNF-UX-04), todo en español rioplatense (RNF-UX-02).

### 3.2 Inventario completo de pantallas (checklist)

**Auth (4):** login, registro cliente, registro transportista, recuperar contraseña.
**Cliente (9):** home, crear-ruta, crear-paquete(foto+IA), crear-ofertas, crear-confirmar, tracking de envío, calificar, historial, impacto CO₂, perfil.
**Transportista (7):** feed de pedidos, publicar trayecto, publicar ventana dedicada, envío activo, ganancias/historial, perfil.
**Admin web (2):** dashboard operativo, moderación.
**Total: ~22 pantallas**, de las cuales el flujo crear-envío ya está prototipado (4 de 4).

---

## 4. Infraestructura y deploy (presupuesto $0, RNF-COST)

```
┌─────────────┐
│  Expo App    │──┐ HTTPS   ┌──────────────────┐         ┌─────────────────────┐
│  (EAS build) │  ├───────► │  FastAPI (Docker) │ ──────► │ Supabase Postgres   │
└─────────────┘  │         │  Render free tier │         │ (+ Storage)         │
┌─────────────┐  │         └──────┬───────────┘         └─────────────────────┘
│  depaso_web  │──┘                │
│  (Vercel)    │                   ▼
└─────────────┘           ┌──────────────┐
                          │ OSRM (ruteo) │  ← opcional: fallback haversine×1.3 ya funciona
                          └──────────────┘
```

**Decisión de infra (jul-2026): Render + Supabase + Vercel + EAS — sin Kubernetes, sin AWS.**
Un solo contenedor + DB gestionada + build estático no justifican orquestación: K8s/AWS suman
complejidad y riesgo de costos sin beneficio para un MVP de presupuesto $0 (RNF-COST). La app
queda portable igual (Docker + Postgres estándar, RNF-PRT-02) — migrar de proveedor es cambiar
dónde corre el contenedor, no el código. K8s/autoscaling se documenta en la tesis como
escalado futuro. Pasos concretos del deploy: `PLAN_MAESTRO.md` §4.

- **Dev local:** `docker-compose` con Postgres+PostGIS (`postgis/postgis:16`) y opcionalmente OSRM con el extracto de Argentina de Geofabrik.
- **Modelo ML:** se versiona el `.keras` exportado (~15 MB con MobileNetV2) dentro de la imagen Docker; se carga una sola vez en el `lifespan` de FastAPI.
- **Imágenes de paquetes:** Supabase Storage, bucket privado, URLs firmadas (RNF-SEC-07).
- **App Android para la defensa:** `eas build -p android --profile preview` → APK instalable.
- **Panel web (`depaso_web`):** build estático de Vite → Vercel free (deploy automático desde GitHub, `VITE_API_URL` apunta a Render).

---

## 5. Modelo de IA — Clasificador de tamaño de carga (plan completo)

> Requisito UADE: modelo **entrenado por el equipo** (no desde cero — transfer learning está
> permitido y es lo correcto), documentando dataset, arquitectura, métricas, validación y sesgos.

### Categorías (4): `S` (paquetes pequeños y documentos) · `M` (cargas medianas) · `L` (cargas grandes o voluminosas) · `XL` (mudanzas o fletes)

### Fase 1 — Construcción del dataset (~2-3 semanas, en paralelo con otras tareas)

1. **Fuentes:**
   - **Google Open Images V7**: descargar con la herramienta `openimages` o FiftyOne las clases
     `Box`, `Envelope`, `Suitcase`, `Furniture`, `Television`, `Refrigerator`, `Book`, `Parcel`.
   - **Fotos propias del equipo** (objetivo: ≥30% del dataset): cajas reales, sobres, paquetes,
     muebles — esto es lo que más valor le da a la defensa.
2. **Tamaño objetivo:** ~1500 imágenes, 300 por categoría (balanceado).
3. **Etiquetado con metadata de sesgos** — clave para la sección de análisis de sesgos.
   Por cada imagen registrar en un `labels.csv`:
   ```csv
   filename,category,lighting,angle,background,has_reference_object,source
   img_0001.jpg,M,natural,frontal,plain,true,own
   img_0002.jpg,XL,artificial,oblique,cluttered,false,openimages
   ```
   - `lighting`: natural / artificial / baja
   - `angle`: frontal / cenital / oblicuo
   - `background`: liso / desordenado / exterior
   - `has_reference_object`: si hay celular/botella de referencia en la foto
4. **Fotos con objeto de referencia (RF-VIS-03):** tomar un subset de fotos propias en pares
   (misma carga con y sin celular/botella al lado). El flag `has_reference_object` entra al
   modelo como **feature auxiliar concatenada** después del pooling (ver arquitectura).
5. **Split estratificado:** 70% train / 15% val / 15% test, estratificado por categoría **y**
   por condiciones de sesgo (que el test tenga de todo). El test set no se toca hasta el final.
6. **Limpieza:** eliminar duplicados (hash perceptual con `imagehash`), recortar al objeto
   si la foto es muy amplia, convertir todo a JPG, máx 1024px lado mayor.
7. **Almacenamiento:** Google Drive compartido del equipo (se monta directo en Colab).

### Fase 2 — Entrenamiento en Google Colab (GPU gratis)

Notebook en `depaso_rest/ml/notebooks/train_classifier.ipynb`:

1. **Pipeline de datos:** `tf.data` desde el CSV; resize a **224×224**, normalización de MobileNetV2 (`preprocess_input`).
2. **Data augmentation (solo train):** rotación ±15°, zoom ±20%, brillo ±0.2, flip horizontal
   — exactamente lo especificado en 5.1, implementado con capas `keras.layers.Random*`.
3. **Arquitectura:**
   ```python
   base = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224,224,3))
   base.trainable = False
   img_in = keras.Input((224,224,3));  ref_in = keras.Input((1,))   # flag objeto de referencia
   x = base(img_in, training=False)
   x = layers.GlobalAveragePooling2D()(x)
   x = layers.Concatenate()([x, ref_in])
   x = layers.Dense(128, activation="relu")(x)
   x = layers.Dropout(0.3)(x)
   out = layers.Dense(5, activation="softmax")(x)
   model = keras.Model([img_in, ref_in], out)
   ```
4. **Etapa A — cabeza custom:** base congelada, Adam `lr=1e-3`, categorical cross-entropy,
   20 épocas, `EarlyStopping(patience=5, restore_best_weights=True)` sobre val_loss.
5. **Etapa B — fine-tuning:** descongelar las últimas ~30 capas de MobileNetV2,
   Adam `lr=1e-5`, 10 épocas. Guardar curvas de loss/accuracy de ambas etapas (van a la tesis).
6. **Cross-validation 5-fold** sobre train+val para reportar estabilidad (media ± desvío de accuracy).
7. **Exportar:** `model.save("cargo_classifier_v1.keras")` + `metadata.json`
   (fecha, dataset size, métricas, hash del CSV) → commitear en `ml/models/`.

### Fase 3 — Evaluación y análisis de sesgos (capítulo de la tesis)

Notebook `evaluate_and_bias.ipynb`, corre **solo sobre el test set**:

1. **Métricas globales:** accuracy (objetivo ≥80%), precision/recall/F1 por clase
   (`sklearn.metrics.classification_report`).
2. **Matriz de confusión** normalizada (heatmap con seaborn) — analizar confusiones
   adyacentes (S↔M, M↔L son esperables; S↔XL sería grave).
3. **Análisis de sesgos:** agrupar el test set por cada columna de metadata y calcular
   accuracy por grupo:
   - por iluminación (natural vs artificial vs baja)
   - por ángulo (frontal vs cenital vs oblicuo)
   - por fondo (liso vs desordenado vs exterior)
   - con vs sin objeto de referencia (¿mejora la confianza? — valida RF-VIS-03)
4. **Reporte de debilidades + mitigaciones** (ej.: "accuracy cae 12 puntos con luz baja →
   mitigación: más muestras de luz baja en v2 / aviso en la UI de sacar la foto con buena luz").
5. Guardar todo en `ml/reports/` (PNGs + markdown) — esto se pega casi directo en la tesis.

### Fase 4 — Integración en el backend (módulo `vision/`)

```python
# main.py (lifespan): cargar una vez al arrancar
app.state.classifier = keras.models.load_model("ml/models/cargo_classifier_v1.keras")

# vision/service.py
async def classify(image_bytes, has_reference: bool) -> ClassificationResult:
    img = preprocess(image_bytes)                    # decode, resize 224, preprocess_input
    probs = model.predict([img, [[float(has_reference)]]], verbose=0)[0]
    category, confidence = CATEGORIES[probs.argmax()], float(probs.max())
    await repo.log_classification(...)               # RF-VIS-04: SIEMPRE se registra
    return ClassificationResult(
        category=category,
        confidence=confidence,
        needs_manual=confidence < settings.CONFIDENCE_THRESHOLD,   # RF-VIS-02, ej. 0.70
    )
```
- `POST /classify` recibe `multipart/form-data` (imagen + flag), responde < 2 s (RNF-PERF-02;
  MobileNetV2 en CPU tarda ~100-300 ms, sobra margen).
- El cliente ya manda la imagen reducida (expo-image-manipulator) → upload rápido.
- Si `needs_manual = true`, la UI muestra el selector manual de categoría (RF-SHP-03).
- La tabla `classifications` acumula datos reales para fine-tuning futuro y auditoría de sesgos en producción.

### Fase 5 — Iteración (si hay tiempo)

- v2 del modelo con las fotos reales registradas en `classifications` (re-etiquetadas).
- Comparar v1 vs v2 en el mismo test set → gráfico de mejora para la defensa.

---

## 6. Orden de trabajo sugerido (roadmap)

| # | Hito | Incluye |
|---|---|---|
| 1 | **Base sólida** | PostGIS activado + modelos/migraciones completos + auth con refresh token + rate limiting |
| 2 | **Envíos end-to-end** | CRUD shipments + máquina de estados + app conectada al back real (adiós mocks) |
| 3 | **Dataset IA** *(en paralelo desde el día 1)* | Recolección + etiquetado con metadata de sesgos |
| 4 | **Matching v1** | Knockout + scoring con pesos en DB + OSRM + feed del transportista |
| 5 | **Modelo IA v1** | Entrenamiento + evaluación + sesgos + endpoint /classify + pantalla de foto |
| 6 | **Tracking + capacidad + CO₂** | GPS polling, reserva de volumen, cálculo de ahorro |
| 7 | **Roles y pantallas restantes** | Flujo completo transportista + calificaciones + historial |
| 8 | **Panel admin + deploy** | Dashboard web + Render/Supabase productivo + APK de la defensa |
| 9 | **Calidad** | Tests ≥60% en auth/shipments/matching + análisis de sesgos final + documentación |

**Regla de oro:** el dataset (hito 3) es lo único que no se puede acelerar con código —
empezarlo ya, aunque el resto avance despacio.

---

## 7. Algoritmos centrales — diseño fundamentado en el estado del arte (IMPLEMENTADO)

> Esta sección documenta los algoritmos ya implementados en `depaso_rest`, con su
> fundamentación en la literatura relevada en `estadoarte.txt` (sección 2). Cada decisión
> de diseño responde a un hallazgo concreto de los antecedentes.

### 7.1 Mapa de la literatura a las decisiones de diseño

| Hallazgo del estado del arte | Decisión de diseño implementada |
|---|---|
| **Yang et al. (2022):** la ventaja ambiental del CSD desaparece cuando el desvío supera un umbral — puede incluso emitir MÁS que el viaje dedicado | El desvío es un **filtro duro (knockout)**, no una penalización suave: colaborativo se descarta si `detour_ratio > 15%`. Implementado en `matching/service.py` con desvío real por inserción de paradas |
| **Luy et al. (2023):** las plataformas asumen que todos son gig-workers y desaprovechan a los conductores ocasionales (ODs); el OD requiere su propio flujo | Módulo `routes/` nuevo: el transportista **publica su trayecto habitual** (`collaborative_route`) o su ventana dedicada (`dedicated_window`); el matching colaborativo opera sobre esos trayectos, no sobre posiciones |
| **Akamatsu & Oyama (2023/24):** los mecanismos de mercado (subastas, elasticidades) requieren datos históricos masivos inexistentes en el arranque | **Scoring determinístico multivariable** con pesos configurables — la alternativa correcta para cold-start; el ML de matching queda como trabajo futuro con datos reales |
| **Saleh et al. (2024):** las decisiones de Deep RL no son explicables al usuario — problema de auditabilidad | Cada score devuelve su **breakdown por componente + explicación legible** (`CarrierScoreResponse.explanation`): "¿por qué me asignaron este pedido?" siempre tiene respuesta |
| **Naumann et al. (2023):** estimar volumen exacto desde foto móvil 2D es inviable sin sensores 3D | El clasificador predice **categorías volumétricas discretas** (S–XL, 4 clases) con CNN + transfer learning, no volumen continuo |
| **Encuesta propia (n=145):** 62% de transportistas potenciales solo participa sin desviarse de su trayectoria diaria | Los componentes geo + desvío concentran el **65% del peso** del score (w1=0.35, w2=0.30) |

### 7.2 Matching inteligente (`modules/matching/service.py`)

Dos caminos según modalidad:

**Colaborativo** — matchea contra trayectos publicados (`carrier_routes`):
1. **Knockouts:** carrier activo+verificado · capacidad ≥ peso · tabla vehículo/carga (3.3) · XL nunca colaborativo · peatón/bici solo viajes < 5 km · **desvío ≤ 15% del trayecto** (Yang et al.)
2. **Desvío real por inserción:** `insertion_detour()` calcula `origen→pickup→dropoff→destino` vs el trayecto base (orden óptimo demostrable por desigualdad triangular para 2 paradas)
3. **Score:** `0.35·geo + 0.30·(1−desvío_norm) + 0.15·carga + 0.10·reputación + 0.10·ventana`
   - `geo`: peor distancia entre pickup y dropoff a la recta del trayecto (los dos deben estar "de paso" — un promedio dejaría pasar un dropoff fuera de ruta)
   - `desvío_norm`: ratio del desvío normalizado contra el máximo permitido (15%)
   - `ventana`: 1.0 dentro de la ventana horaria del trayecto, decae linealmente hasta 0 a las 3 h

**Dedicado** — matchea contra transportistas disponibles por posición GPS:
- `geo` = proximidad al origen; componente de desvío neutro (spec 5.2: "dedicado: sin límite", y la persona Carlos: "no le importa el desvío")

**Salida:** top-K candidatos con score total, breakdown, desvío en km y %, ETA al pickup, y explicación en español (asignación auditable — diferenciador #3 del estado del arte).

### 7.3 Optimización de rutas (`shared/geo.py`)

- `insertion_detour()` — inserción óptima de un pedido en un trayecto (la base del control de desvío)
- `greedy_multi_insertion()` — múltiples pedidos en un trayecto por **cheapest insertion greedy**, respetando pickup-antes-de-dropoff (spec 5.4: variante greedy del bin packing, no optimización combinatoria — justificado por Akamatsu & Oyama: la solución exacta no escala y no aporta en un prototipo)
- Distancias: haversine × **factor de circuidad urbana 1.3** (aprox. para ciudades en grilla como Buenos Aires); `shared/osrm_client.py` reemplaza la estimación por ruteo real de OSRM cuando el contenedor está disponible, con degradación automática al fallback
- `eta_minutes()` por velocidades urbanas promedio por tipo de vehículo

### 7.4 CO₂ ahorrado (`modules/co2/service.py`)

Determinístico, factores IPCC 2019 (moto 0.09 / auto 0.18 / camioneta 0.25 / camión 0.60 kg CO₂/km):
- **Real** = desvío de la inserción × factor del vehículo colaborativo
- **Contrafactual** = viaje dedicado equivalente (posición→pickup→dropoff) × factor del vehículo dedicado
- **Ahorro** = contrafactual − real (con piso en 0 — aunque el filtro duro de desvío garantiza que el caso negativo nunca se asigne: coherencia entre matching y CO₂, hallazgo central de Yang et al.)
- Si el vehículo colaborativo es bici/peatón (factor 0), el contrafactual usa **moto** como vehículo dedicado de referencia (el courier más común del AMBA)
- Endpoint `POST /co2/estimate` para mostrar el ahorro en la pantalla de ofertas antes de confirmar (RF-CO2-01) — la cuantificación por envío es el diferenciador #4: ninguna plataforma ni paper relevado la reporta

### 7.5 Clasificador de carga (`modules/vision/` + `ml/`)

- `ml/train_classifier.py` — script Colab-ready: MobileNetV2 transfer learning en 2 fases (cabeza 20 épocas lr=1e-3 → fine-tuning últimas 30 capas, 10 épocas lr=1e-5), doble input (imagen 224×224 + flag de objeto de referencia, RF-VIS-03), augmentation exacto de la spec, split estratificado 70/15/15, exporta `.keras` + `metadata.json` + el test split congelado
- `ml/evaluate_bias.py` — evalúa SOLO sobre el test set: classification report, matriz de confusión normalizada (PNG), y **análisis de sesgos** por iluminación/ángulo/fondo/objeto de referencia con Δ vs accuracy global (marca ⚠️ los grupos >10 puntos por debajo) — sale directo al capítulo de sesgos de la tesis (RNF-UADE-01)
- `vision/service.py` — carga el `.keras` en el startup, inferencia < 2 s (RNF-PERF-02), umbral de confianza 0.7 → `needs_manual` (RF-VIS-02); **fallback determinístico** cuando TF o el modelo no están (la API nunca se rompe en dev)

### 7.6 Tests (`tests/test_geo.py`, `test_matching.py`, `test_co2.py`)

30 tests unitarios sobre funciones puras y el service con repos fake (sin DB): tabla de compatibilidad, knockouts (XL colaborativo, bici > 5 km, desvío > 15%), ranking por proximidad, inserción múltiple, factores IPCC, contrafactual con coordenadas reales del AMBA. Aportan directo a la cobertura ≥ 60% en matching (RNF-MNT-02).

---

## 8. Decisiones documentables en la tesis (justificación académica)

- **Transfer learning vs entrenar desde cero:** MobileNetV2 preentrenado en ImageNet aporta
  features visuales genéricas; con ~1500 imágenes entrenar desde cero sería inviable
  (overfitting). Se entrena la cabeza + fine-tuning ⇒ cumple "modelo entrenado por el equipo".
- **Matching determinístico vs ML:** sin datos históricos reales, un modelo de ML de matching
  no tiene con qué entrenarse; el scoring explicable es la decisión de ingeniería correcta
  y el ML queda justificado como trabajo futuro (7.2).
- **Polling vs WebSockets/push:** push productivas excluidas del alcance; polling de 15-30 s
  cumple RNF-PERF-04 con complejidad mínima y se degrada con gracia (RNF-AVL-02).
- **Argon2 vs bcrypt:** argon2id es el ganador del Password Hashing Competition y recomendado
  por OWASP por sobre bcrypt; se documenta como mejora sobre la spec original.
- **Panel web separado (`depaso_web`) vs Expo Web:** se eligió una SPA Vite independiente porque
  el panel B2B (pymes + admin) tiene UX de escritorio (tablas densas, gráficos, sidebar) ajena al
  paradigma móvil; comparte el backend y el design system (tokens), no el runtime. Expo Web habría
  forzado componentes RN en un contexto de dashboard.
- **Scoring determinístico vs mecanismos de mercado:** sin datos históricos al arranque, subastas y
  elasticidades no tienen con qué calibrarse (Akamatsu & Oyama); el scoring explicable con pesos
  editables es la decisión correcta para cold-start.
- **Pago simulado con comisión de escrow:** la pasarela real está fuera del alcance, pero el
  prototipo modela el flujo de dinero completo (escrow `paid → released`/`refunded`) y una comisión
  de plataforma del 15% derivada de la brecha WTP/WTA medida en la encuesta (cliente $3.000-6.000 vs
  cadete $2.500-5.000, hallazgo 5: "no tolera comisiones altas"). Esto hace explícito y defendible el
  modelo de negocio sin integrar un proveedor de pagos.
