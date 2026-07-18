# DePaso — Cómo está organizado el código (los "niveles" explicados)

Guía para entender **por qué los archivos están separados en niveles** y **dónde va cada cosa**.
Si alguna vez no sabés en qué archivo poner algo, esta guía te lo dice.

---

## La idea de fondo: cada nivel tiene UNA responsabilidad

En vez de meter todo en un archivo, el código se parte en **capas**, y cada capa hace una sola
cosa. Ventaja: cuando algo falla o hay que cambiarlo, sabés exactamente dónde tocar, y podés
cambiar una capa sin romper las otras. Es el principio de **responsabilidad única** (SRP).

Pensalo como un restaurante:
- **Mozo** (toma el pedido, no cocina) → en el back es el **router**.
- **Cocinero** (prepara la comida, decide la receta) → el **service**.
- **Despensa** (guarda y trae ingredientes) → el **repository**.
- **Los ingredientes** (la comida en sí) → los **models**.

El mozo nunca cocina, la despensa nunca decide la receta. Cada uno su rol.

---

## BACKEND (`depaso_rest`) — 4 niveles + compartidos

Cada módulo de dominio (`shipments`, `carriers`, `matching`, …) tiene los mismos 4 archivos:

```
modules/<nombre>/
  router.py       ← NIVEL 1: HTTP (recibe la request, devuelve la response)
  service.py      ← NIVEL 2: lógica de negocio (las reglas)
  repository.py   ← NIVEL 3: acceso a la base de datos (queries)
  models.py       ← NIVEL 4: las tablas (cómo es el dato)
  schemas.py      ← contrato de entrada/salida (validación con Pydantic)
```

| Nivel | Archivo | Qué hace | Qué NO hace |
|---|---|---|---|
| 1 | `router.py` | Define las URLs, valida el input con schemas, mapea errores a códigos HTTP (400/403/404). **Delgado.** | No calcula reglas de negocio ni hace queries |
| 2 | `service.py` | **Las reglas**: precios, máquina de estados, comisión, quién puede hacer qué. Es el cerebro. | No sabe de HTTP ni arma queries SQL a mano |
| 3 | `repository.py` | Habla con la base: `SELECT`, `INSERT`, `UPDATE`. Traduce entre la DB y los objetos. | No decide reglas; solo trae/guarda datos |
| 4 | `models.py` | Define las columnas de cada tabla (SQLAlchemy). | No tiene lógica |

Y lo **compartido** (lo usan todos los módulos):
```
core/      ← config, seguridad (JWT, hash), conexión a la DB, dependencias de auth
shared/    ← cosas transversales: enums, geo (distancias), excepciones, base_repository
```

### Ejemplo real: "crear un envío con destinatario" (atraviesa las 4 capas)

Cuando el cliente confirma un envío, la request viaja por los niveles así:

```
POST /shipments  { ..., recipient_name, recipient_phone }
      │
  1. router.py        valida el body con ShipmentCreate (schema), llama al service
      │
  2. service.py       create_shipment(): calcula el precio (pricing), arma el envío,
      │                registra el evento PENDING  ← acá viven las REGLAS
      │
  3. repository.py    repository.create(...): hace el INSERT en la tabla shipments
      │
  4. models.py        Shipment: define las columnas (incluida recipient_name/phone)
      │
  ← vuelve para arriba y el router responde con ShipmentResponse (schema de salida)
```

**Regla mental (backend):** ¿es una URL/código HTTP? → router. ¿es una regla del negocio? →
service. ¿es una query? → repository. ¿es una columna nueva? → models (el esquema se crea con
`create_all()` al arrancar).

> Nota: el módulo `admin` es especial — es de *reportería* (lee de varias tablas a la vez), así
> que su `service.py` consulta directo la sesión en vez de un solo repository. Sigue teniendo su
> service para no dejar la lógica en el router.

---

## FRONTEND app (`depaso_app`) — los niveles

Acá los "niveles" son carpetas por rol. La regla es parecida: la pantalla dibuja, los servicios
hablan con la API, los stores guardan estado, los utils calculan.

```
app/                 ← NIVEL RUTAS: qué pantalla se ve en cada URL (expo-router)
  (auth)/            login, registro…
  (main)/            tabs según el rol (enviar, envios, perfil, admin…)
src/
  features/          ← NIVEL PANTALLAS: la UI de verdad, agrupada por rol
    sender/          pantallas del cliente (crear envío, mis envíos, impacto)
    carrier/         pantallas del cadete (feed, viajes, ganancias)
    profile/  admin/ perfil y panel admin
  services/          ← NIVEL API: hablan con el backend (axios). Ej: shipments.ts
  stores/            ← NIVEL ESTADO GLOBAL: zustand (usuario logueado, etc.)
  types/             ← los tipos TypeScript compartidos (Shipment, PaymentStatus…)
  utils/             ← cálculos puros y reutilizables (co2, dimensioning, packageCategory)
  components/        ← piezas de UI chiquitas reusables (botones, iconos)
constants/tokens.ts  ← colores y design tokens (T.forest, T.bg…)
```

| Nivel | Carpeta | Qué hace |
|---|---|---|
| Rutas | `app/` | Decide qué pantalla se monta en cada tab/URL. Casi no tiene lógica. |
| Pantallas | `src/features/` | La UI: lo que se ve y los gestos. Llama a services para datos. |
| API | `src/services/` | Las llamadas HTTP al backend (una función por endpoint). |
| Estado | `src/stores/` | Datos globales que muchas pantallas comparten (el usuario). |
| Tipos | `src/types/` | Las "formas" de los datos, compartidas por todo el front. |
| Utils | `src/utils/` | Funciones puras (sin UI): conversiones, cálculos, labels. |
| UI reusable | `src/components/` | Componentes chicos que se usan en varias pantallas. |

### El mismo ejemplo del destinatario, del lado del app

```
SummaryScreen (features/sender/send-flow)   ← la pantalla arma el payload y…
      │  llama a…
shipmentsService.createShipment(payload)     (services/shipments.ts)  ← la llamada HTTP
      │  el payload usa el tipo…
ShipmentCreatePayload                          (types/index.ts)        ← la forma del dato
      │
   … y del otro lado, el cadete lo ve en:
CarrierShipmentsScreen (features/carrier)     ← muestra "RECIBE: …" + botón Llamar
```

**Regla mental (frontend):** ¿es algo que se ve? → `features/` (o `components/` si es reusable).
¿es una llamada a la API? → `services/`. ¿es un cálculo sin pantalla? → `utils/`. ¿es un dato que
muchas pantallas necesitan saber? → `stores/` o `types/`.

---

## FRONTEND web (`depaso_web`) — mismos niveles, otra herramienta

El panel web sigue la misma idea con la estructura típica de una SPA Vite:

```
src/
  pages/ (o features/)  ← las pantallas (Dashboard, Flota, Envíos, Finanzas, Admin)
  lib/                  ← api.ts (axios), queryClient, utils   ≈ el "services" del app
  stores/               ← auth (usuario logueado)
  components/ui/         ← componentes shadcn/ui reusables (botones, tablas…)
  types/                ← tipos compartidos
```

Consume **los mismos endpoints** que la app móvil (mismo backend), solo que con UI de escritorio.

---

## Resumen en una línea

- **Backend:** URL → `router` → `service` (reglas) → `repository` (DB) → `models` (tablas).
- **Frontend:** `app/` (rutas) → `features/` (pantallas) → `services/` (API) → `stores/`/`types/`
  (estado y formas) → `utils/` (cálculos).
- **Cada nivel una responsabilidad.** Si dudás dónde va algo, preguntate *qué tipo de cosa es*
  (una URL, una regla, una query, una pantalla, un cálculo) y la tabla te dice la carpeta.

*Referencia técnica completa: `ARQUITECTURA.md`. Diagramas visuales: `ARQUITECTURA_DIAGRAMAS.md`.*
