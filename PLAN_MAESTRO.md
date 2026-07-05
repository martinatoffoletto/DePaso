# DePaso — PLAN MAESTRO (Julio 2026)

**Fecha:** 1 de julio de 2026
**Objetivo:** cerrar backend al 100%, crear el panel web para pymes (`depaso_web`), rehacer las pantallas del rider y elevar la calidad de UI del app móvil.
**Fuera de alcance de este plan:** IA/ML (dataset + entrenamiento — lo hace Martina) y tests (se difieren al final, explícitamente).

---

## 1. Gap analysis — tesis (`../UADE_PFI_Template-develop`) ↔ código (`DePaso/`)

### 1.1 Qué falta en la tesis (existe en el código, no está escrito)

| Gap | Detalle | Dónde va |
|---|---|---|
| **Capítulo 4 vacío** | `chapters/chapter04.tex` tiene solo el título. Falta: arquitectura 4 capas, las 4 modalidades, matching (knockouts + scoring w1–w5), máquina de estados, decisiones (polling vs WebSocket, capacidad derivada, CO₂ al aceptar, argon2 vs bcrypt), restricciones vehículo/carga | `chapter04.tex` |
| **Sub-capítulo IA** | MobileNetV2 dual-input, dataset, métricas, sesgos | `chapter04.tex` |
| **Panel web pymes** | El alcance del Cap 1 (línea 100) ya lo cubre: *"Herramientas básicas de monitoreo operativo para administradores"* → `depaso_web` es la materialización de ese ítem, extendido al rol pyme. Solo hay que describir el rol B2B (Cap 3 personas / Cap 4), no ampliar alcance | Cap 3, 4 |
| **Limitaciones y trabajo futuro** | Cobertura ante daños (gap I1), elasticidad de precios, notificaciones push | Cap final |
| **Conclusiones / abstract / summary** | Plantillas sin contenido real | `conclusion.tex`, `abstract.tex` |

### 1.2 Qué pide la tesis/specs y falta (o está a medias) en el código

| Gap | Estado | Workstream |
|---|---|---|
| C1 — peatón/bici <5km no aplica en `_rank_dedicated` | 5 líneas en `matching/service.py` | A |
| C2 — Modalidad 2 (`BY_AVAILABILITY`) sin wiring completo en matching + UX de publicación de ventana | Elegida **Opción A (implementar)** | A |
| Forgot-password: service implementado, **verificar wiring al router** | Auditoría lo marca ambiguo | A |
| Role switching (RF-USR-06) | No implementado | A |
| Editar perfil carrier / vehículo post-registro | No implementado | A |
| Panel admin web (RF-ADM) | Endpoints listos, sin UI | C |
| Deploy Render + Supabase + APK | Archivos listos, sin ejecutar | (felix, después) |

> Nota: la auditoría es del 13-jun y el TODO del 15-jun se contradicen en algunos puntos
> (p. ej. matching weights en DB, rate limiting). **Regla: verificar contra el código actual antes de implementar.**

---

## 2. Workstreams

### Workstream A — Backend al 100% (`depaso_rest`) — **owner: rm** (reglas de dominio con jhope)

Cerrar todos los gaps funcionales de `AUDITORIA_BACKEND.md` + `TODO_COMPLETO.md`, verificando primero qué ya está resuelto:

1. **Gap C1:** restricción soft-mobility <5km también en `_rank_dedicated` / knockouts comunes (`matching/service.py`).
2. **Gap C2 (Opción A):** `_rank_dedicated` consulta ventanas `dedicated_window` activas (`list_active_in_window`); `SummaryScreen` deja de hardcodear `ON_DEMAND` (coordinar con jimin).
3. **Auth:** confirmar forgot/reset password wired al router; agregar change-password si falta.
4. **Users:** role switching (RF-USR-06) — un usuario con ambos roles cambia de modo activo; PATCH de perfil carrier (vehículo, patente).
5. **Routes:** `PATCH /routes/{id}`.
6. **Shipments:** setear `photo_url` en creación; tarifas a config/DB (no constantes).
7. **Limpieza:** resolver overlap `packages`/`freight` vs `shipments` (fusionar o eliminar módulos muertos); borrar código muerto.
8. **Hardening:** `JWT_SECRET` sin default en prod (fallar si falta env), CORS restringible por env, `datetime.utcnow()` → `datetime.now(timezone.utc)`.
9. **Verificar** (pueden ya estar hechos): matching weights en DB + `PATCH /matching/weights`, rate limiting slowapi, refresh tokens.

**Criterio de aceptación:** smoke test E2E pasa; los 93 tests existentes no-vision siguen verdes (no escribir tests nuevos); OpenAPI `/docs` refleja todos los endpoints nuevos.

### Workstream B — Módulo `organizations` (pymes) en backend — **owner: rm + jhope**

Nuevo módulo `depaso_rest/src/app/modules/organizations/` (patrón router/service/repository/schemas/models). Dos tipos de pyme:

- **Pyme de fleteros** (oferta): tiene flota propia → gestiona el **alta y baja de sus transportistas** (invitación/vinculación de carriers existentes o alta directa; baja = desvinculación, no borra el user).
- **Pyme de productos** (demanda): usa DePaso para su logística → **crea y programa sus envíos/viajes** (carga individual o batch, ventanas horarias, logística recurrente).

Modelo de datos propuesto (validar con bang-chan):
```
organizations (id, name, cuit, kind[fleet|merchant|both], owner_user_id, created_at)
organization_members (org_id, user_id, role[owner|manager], joined_at)
organization_carriers (org_id, carrier_id, status[active|inactive], linked_at, unlinked_at)
shipments.organization_id (nullable FK — envíos creados por la pyme)
```

Endpoints mínimos:
```
POST/GET/PATCH  /organizations                       # alta, mi org, editar
GET             /organizations/me/dashboard          # KPIs de monitoreo
POST/DELETE/GET /organizations/me/carriers           # alta/baja/lista de flota
GET             /organizations/me/shipments          # envíos de la pyme (+ filtros)
POST            /organizations/me/shipments          # crear envío como pyme (reusa shipments.service)
GET             /organizations/me/finance            # dinero puesto (gastado en envíos) y ganado (por su flota), por período
```

Finanzas: **dinero puesto** = suma de `price` de envíos creados por la org; **dinero ganado** = suma de ganancias de envíos entregados por carriers de la flota. Agregados por mes + acumulado.

Incluye: migración Alembic, extensión de `scripts/seed_demo.py` con una pyme demo de cada tipo, y rol `org` en el JWT o derivado de membresía.

**Criterio de aceptación:** flujo completo por curl/Swagger: crear org → vincular carrier → crear envío → ver dashboard y finanzas.

### Workstream C — `depaso_web`: panel de monitoreo para pymes — **carpeta nueva en la raíz**

SPA web que consume **los mismos endpoints** del backend.

- **Stack propuesto:** Vite + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui + TanStack Query v5 + react-router + axios (mismo interceptor de refresh que el app). Recharts para gráficos (seguir skill `dataviz`).
  *(ARQUITECTURA.md sugería Expo Web, pero Martina pidió carpeta separada — bang-chan ratifica el stack.)*
- **Design system:** portar tokens cream/forest/lime de `depaso_app/constants/tokens.ts` a Tailwind theme. Calidad alta — usar skills de diseño (`design-taste-frontend` / `high-end-visual-design`), nada genérico.
- **Pantallas:**
  1. Login (mismo `/auth/login`, guarda tokens, guard por rol org/admin)
  2. **Dashboard de monitoreo:** envíos activos, estados, KPIs (entregas, CO₂, plata), actividad reciente
  3. **Flota:** lista de transportistas de la pyme, alta (invitar/vincular), baja, estado y reputación de cada uno
  4. **Envíos / logística:** tabla con filtros, crear envío/viaje programado, detalle con timeline y tracking
  5. **Finanzas:** dinero puesto vs ganado, series por mes, desglose por carrier/envío
  6. **Admin (rol admin) = monitoreo operativo post-deploy.** Este panel es la materialización del ítem del alcance de la tesis *"Herramientas básicas de monitoreo operativo para administradores"* y es lo que Martina va a usar en producción para operar sin tocar nada a mano. Debe incluir: envíos activos en vivo (auto-refresh), moderación de carriers pendientes (aprobar/suspender/reactivar con un click), edición de matching weights, KPIs globales (dashboard admin existente), estado del sistema (health del API, si el modelo de visión está cargado o en fallback), y últimas clasificaciones/errores visibles. Los endpoints admin ya existen; si falta alguno para health/actividad, rm lo agrega.
- Estructura espejo del app: `src/features/*`, `src/lib/api.ts`, `src/components/ui/*`.

**Criterio de aceptación:** `npm run build` sin errores, flujo pyme completo contra backend local con seed.

**Dependencia:** B (endpoints de organizations). El scaffolding + login + panel admin pueden arrancar en paralelo porque esos endpoints ya existen.

### Workstream D — Rehacer pantallas del rider — **owner: jimin**

Referencia: mockups en `screens/rider.jsx` (4 pantallas, sistema cream + forest + lime):

| # | Mockup | Destino en `depaso_app` |
|---|---|---|
| 01 | `RiderHomeOffline` — decide cómo trabajar (on-demand vs publicar viaje) | `src/features/carrier/` nueva Home del rider |
| 02 | `RiderHomeOnline` — trabajando: mapa, estado, envío activo | ídem |
| 03 | `RiderPublishTrip` — publicar viaje (origen/destino/días/ventana) | reemplaza/absorbe `PublishRouteScreen` |
| 04 | `RiderIncomingOffer` — oferta entrante full-screen (aceptar/rechazar con desvío, ganancia, CO₂) | nueva, integra con feed/accept |

Reglas duras:
- **NativeWind 4 (`className`) — prohibido StyleSheet y estilos inline.** Los mockups usan CSS inline de web: traducir, no copiar.
- Tokens desde `constants/tokens.ts` (`T.*`) mapeados en `tailwind.config`.
- Nav del rider según mockup: Inicio · Viajes · Pagos · Perfil (revisar cómo mapea a los tabs actuales `(main)` por rol CARRIER; la pestaña "Pagos" necesita el summary de ganancias existente).
- Íconos: `lucide-react-native` o el set ya usado; el `MotoIcon` custom del mockup se porta como componente SVG (`react-native-svg`).
- Todo wired a endpoints reales: feed, accept, routes, summary, tracking. Nada mockeado.
- `npx tsc --noEmit` y `npx eslint .` en 0. Rutas tipadas, guard con `Stack.Protected`, zustand por slices (convenciones de CLAUDE.md).

### Workstream E — UI quality pass del app móvil — **owner: jimin (después de D)**

Guiarse por los demás mockups de `screens/` (`auth.jsx`, `home.jsx`, `flow-v2.jsx`, `offer.jsx`, `package-summary.jsx`, `profile.jsx`, `shipments.jsx`):
- Consistencia de espaciado, jerarquía tipográfica, radios y sombras según mockups.
- Estados vacíos y de carga cuidados (EmptyState, skeletons), feedback en toda mutación (RNF-UX-03).
- Eliminar `OfferSelectionScreen.tsx` huérfano (y su badge "Asegurado" hardcodeado) — gap N1/I1.
- Texto ≥14, contraste AA, español rioplatense (RNF-UX-02/04).
- Animaciones sutiles con Reanimated 4 donde el mockup lo sugiere (transiciones de la oferta entrante, toggle online/offline).

---

## 3. Orden y dependencias

```
A (backend 100%) ──┬────────────→ listo para demo
B (organizations) ─┴→ C (depaso_web pantallas pyme)
C (scaffold + login + admin) ← puede arrancar ya (endpoints existentes)
D (rider screens) → E (UI pass)      ← independiente de A/B/C
```

Paralelizable: **A+B (rm/jhope)** · **C scaffold (web)** · **D (jimin)**.

## 4. Delegación (equipo)

| Workstream | Owner | Apoyo |
|---|---|---|
| A — Backend 100% | rm | jhope (reglas C1/C2, pricing) |
| B — organizations | rm | jhope (modelo de negocio pyme) |
| C — depaso_web | jimin o general (decide bang-chan) | jin (review) |
| D — Rider screens | jimin | — |
| E — UI pass | jimin | jin (review) |
| Coordinación | **bang-chan** | — |
| Deploy (después) | felix | — |
| Tests (al final, hoy NO) | jungkook | — |

## 5. Verificación global (sin tests nuevos)

```bash
# Backend
cd depaso_rest
DATABASE_URL="sqlite:///./depaso_test.db" RATE_LIMIT_ENABLED=false .venv/bin/python -m pytest tests/ -q -p no:warnings   # los existentes no-vision en verde
DATABASE_URL="sqlite:///./depaso_dev.db" .venv/bin/python -m scripts.smoke_test

# App móvil
cd depaso_app && npx tsc --noEmit && npx eslint .

# Web
cd depaso_web && npm run build
```

## 6. Pendiente para la tesis (no bloquea el código, recordatorio)

- Escribir Cap 4 completo + sub-cap IA + testing (dic).
- Ampliar alcance/personas con el rol pyme (panel B2B) en Cap 1 y 3.
- Documentar limitaciones: cobertura ante daños, push, elasticidad de precios.
- Actualizar ARQUITECTURA.md cuando A/B/C estén mergeados (nuevo módulo + depaso_web).
