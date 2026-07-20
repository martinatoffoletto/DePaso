# Modalidades de envío — propósito, representación y justificación

Documento canónico de diseño de producto. Define **para qué existe** cada
submodalidad, **cómo se le presenta** a cada perfil (remitente / transportista)
y **en qué autor o hallazgo de la tesis se apoya** cada decisión. Alineado con
el capítulo 1 (submodalidades), capítulo 2 (estado del arte) y capítulo 3
(encuesta n=145) del PFI.

> Este documento describe el modelo de producto y cómo se refleja en las
> pantallas reales de la app. El estado de implementación se lista en §9.

---

## 1. La idea central

Internamente el sistema opera una **matriz 2×2** (modalidad × asignación). Pero
esa matriz es vocabulario del matching, no de las personas: **ningún perfil ve
jamás "las 4 submodalidades"**. Cada lado del mercado ve **tres opciones,
formuladas en su propio idioma**:

- El **remitente** responde una sola pregunta — *¿cuándo lo necesitás?* — y ve
  tres productos: **Ya**, **Hoy** y **De paso**.
- El **transportista** responde una sola pregunta — *¿cómo querés trabajar?* —
  y ve tres modos: **Salir a repartir**, **Turno en zona** y **Mi trayecto**.

Las dos submodalidades colaborativas colapsan en una sola opción por lado,
porque su diferencia (demanda vs espacio) describe *de qué lado se origina la
señal*, nunca una decisión que el otro lado deba tomar.

---

## 2. Los dos ejes y su fundamento

### Eje 1 — Modalidad: ¿el viaje existe por el paquete, o el paquete aprovecha un viaje?

Es la distinción **DV / SPV** de Yang et al.: vehículos dedicados (DVs) que
viajan exclusivamente para entregar, versus vehículos personales compartidos
(SPVs) cuyos conductores integran pedidos en viajes que ya tenían planificados.
No es una diferencia de grado sino de estructura: costos, emisiones y dinámica
de participación completamente distintos.

| | `dedicated` | `collaborative` |
|---|---|---|
| El viaje | Se genera por el envío | **Ya iba a ocurrir** |
| Costo marginal | Viaje completo | Solo el desvío |
| Emisiones | Un vehículo más en la calle | ≈ cero adicionales si el desvío es acotado |
| Precio | Tarifa plena | −43% (paga el desvío, no el viaje) |
| CO2 | No computa ahorro | Ahorro calculado y mostrado por envío |
| Desvío | Sin límite | **Knockout duro ≤ 15%** (Yang et al.: con desvío excesivo la ventaja ambiental se revierte) |
| Carga XL | Siempre acá (mudanzas/fletes) | Prohibida |

### Eje 2 — Asignación: ¿la oferta de transporte se busca ahora, o fue declarada antes?

Es la distinción **GW / OD** de Luy et al.: *gig workers* (disponibilidad
activa, esperando pedidos) versus *occasional drivers* (viajeros habituales que
ofrecen capacidad ociosa cuando les coincide). Los autores muestran que las
plataformas existentes asumen que todos son GWs y desperdician el potencial de
sincronizar la demanda con los ODs.

| | `on_demand` ("por demanda") | `by_availability` ("por espacio") |
|---|---|---|
| Quién dispara | El remitente crea el envío; el sistema **sale a buscar ya** | El transportista **declaró antes** dónde/cuándo aporta capacidad |
| Naturaleza de la oferta | Reactiva (estoy conectado ahora) | Declarativa (zona+franja o trayecto publicado) |
| Promesa temporal | Inmediatez | Previsibilidad |

La dimensión declarativa es además una decisión de diseño laboral: la OIT
(2020) documenta que las plataformas del AMBA operan con gestión algorítmica
punitiva (penalizan rechazar pedidos o desconectarse). En DePaso la
disponibilidad **la declara el transportista** — zona, franja, trayecto, días —
y el sistema se adapta a esa declaración, no al revés. No hay penalidad por no
estar conectado.

---

## 3. Las cuatro submodalidades

### 3.1 Dedicado por demanda — "Ya"

**Propósito**: urgencia. El envío no puede esperar y justifica generar un viaje
exclusivo. Análogo comercial: Uber Flash / Rappi Favor.

- **Remitente**: promesa de inmediatez y exclusividad ("un cadete sale ahora
  solo por tu envío"). Paga tarifa plena — es el techo de la escalera de
  precios y el punto de comparación de los descuentos.
- **Transportista**: toca "salir a repartir" y queda en el pool inmediato con
  su GPS. Recibe viajes exclusivos: mientras tiene un dedicado en curso no se
  le ofrece nada más (la exclusividad es el producto). Mejor pago por viaje.
- **Justificación (tesis)**: Yang et al. — el DV es la línea base del modelo
  híbrido: hay cargas (XL) y urgencias donde es la única opción racional, y es
  el escenario contra el cual se mide el ahorro colaborativo. El análogo
  comercial (relevamiento cap. 2: Uber Flash, Rappi) valida la demanda; el
  diferencial de DePaso es que convive con lo colaborativo y no es punitivo
  (OIT 2020).

### 3.2 Dedicado por espacio — "Hoy" (esperá y ahorrá)

**Propósito**: previsibilidad barata. El envío es de hoy pero no de este
minuto; se resuelve con **capacidad dedicada declarada de antemano**.

- **Remitente**: elige una franja ("hoy entre 14 y 18") y paga menos que el
  "Ya". No es inmediato ni lento al azar: es *programado* — su pedido entra a
  la agenda de un transportista que declaró esa zona y franja.
- **Transportista**: declara un turno en zona ("hoy de 14 a 18, Caballito"),
  por **dos vías equivalentes** que crean el mismo objeto interno
  (`dedicated_window`): el **toggle** ("turno que empieza ya", con su ubicación
  actual) o la **publicación anticipada** (elige día — hoy, mañana, una fecha —,
  franja aproximada y zona; la zona se declara explícita porque todavía no está
  ahí). Publicar antes es lo coherente con el eje "por espacio" (la oferta se
  declara de antemano) y permite que los pedidos "Hoy" se le acerquen con
  tiempo: minutos antes de la ventana ya ve la agenda del turno. Durante la
  ventana **encadena entregas dedicadas una tras otra** — cada viaje sigue
  siendo exclusivo (regla del dedicado), pero la ventana completa se llena de
  pedidos secuenciales. Menos pago por viaje que el "Ya", más volumen y cero
  incertidumbre: sabe cuándo y dónde trabaja.
- **Por qué es más barato que el "Ya"**: el retiro se agenda dentro de un
  turno ya comprometido — el costo de acercarse al pickup se reparte entre los
  pedidos de la ventana en lugar de cargarse a uno solo. Descuento del **18%**
  sobre la tarifa dedicada (`SCHEDULED_DISCOUNT = 0.18`), a recalibrar con
  historial (Oyama & Akamatsu).
- **Justificación (tesis)**: Saleh et al. muestran que el *scheduling* dinámico
  óptimo de repartidores requiere RL con datos históricos extensos —
  inaplicable en arranque en frío y no explicable. La alternativa de DePaso es
  **auto-scheduling declarativo**: el transportista publica su ventana y esa
  declaración reemplaza al agente. Es además la respuesta directa al modelo
  punitivo documentado por la OIT: el turno lo define el trabajador. Oyama &
  Akamatsu (elasticidad de precios por zona/franja) fundamentan la evolución
  futura del pricing de este tier cuando exista historial.

### 3.3 Colaborativo por demanda — "De paso" (hay alguien en camino)

**Propósito**: aprovechar una **trayectoria viva**. Alguien está yendo ahora
(o sale en minutos) en la dirección del envío; el paquete se suma a ese viaje.

- **Remitente**: declaró flexibilidad temporal y ve la oferta eco: precio −43%,
  ahorro de CO2 visible, tiempo mayor y menos determinístico ("va con alguien
  que ya viajaba para allá"). La promesa honesta: *puede no haber nadie en
  camino* — el producto muestra disponibilidad real ("2 viajes compatibles
  ahora") o la espera estimada, nunca un checkout ciego.
- **Transportista**: no hace nada nuevo — publicó su trayecto (especial o
  habitual) y le llega un push: "te queda de paso, desvío 1,2 km (8%), +$1.700".
  Acepta o ignora sin penalidad.
- **Justificación (tesis)**: núcleo del proyecto. Yang et al.: los SPVs reducen
  el costo unitario **solo si** el desvío está acotado — por eso el ≤15% es
  filtro duro previo al matching, no una variable de score. Luy et al.: la
  sincronización demanda↔OD es el potencial desaprovechado por las plataformas
  actuales. Encuesta: 69,8% de predisposición al modelo, y la brecha
  WTP ($3.000–6.000) / WTA ($2.500–5.000) valida que el −43% deja margen
  operativo sin comisiones altas.

### 3.4 Colaborativo por espacio — "Mi trayecto" (junto paquetes en mi camino)

**Propósito**: convertir la **rutina** del transportista en un canal logístico
recurrente. Es la misma economía del 3.3 vista del lado de la oferta, con una
diferencia clave: la trayectoria no es un evento, es un **hábito declarado**.

- **Transportista**: publica su trayecto habitual ("lunes a viernes, 8 a 9,
  Caballito → Microcentro"). Cada día, al entrar en ventana, encuentra los
  pedidos compatibles ya juntados sobre su recorrido y elige cuántos llevar
  según su capacidad residual — uno, varios o ninguno. Es el modo de menor
  fricción: la app trabaja para su rutina, no al revés.
- **Remitente**: no distingue este caso del 3.3 — su paquete "va de paso" igual;
  solo cambia (internamente) si lo levantó una trayectoria viva o una habitual.
  A lo sumo lo percibe como mejor disponibilidad en horarios pico de rutina.
- **Justificación (tesis)**: es la submodalidad con el sustento empírico más
  fuerte de la encuesta: **91,8% de los transportistas potenciales quiere un
  ingreso extra sin desviarse de su rutina** — la ruta habitual declarada es
  exactamente ese producto. Luy et al. definen al OD como viajero habitual con
  capacidad ociosa intermitente; Oyama & Akamatsu formalizan el agrupamiento de
  varios pedidos en un mismo viaje (*task-bundling*), que acá aparece como
  "llevar varios paquetes del recorrido dentro de la capacidad residual".
  El 25,5% a pie y 22,4% en bici de la encuesta fundamentan que la movilidad
  blanda participe (con su restricción de ≤5 km y solo carga S).

### 3.5 Cómo no confundirlas: ¿de quién es el viaje?

Las cuatro submodalidades se desambiguan con **una sola pregunta: ¿de quién es
el viaje?**

- En todo lo **dedicado** (Ya y Hoy) el viaje es *del paquete*: DePaso lo
  genera y el transportista va adonde el pedido lo mande. No tiene recorrido
  propio — por eso no existe el desvío ni el ahorro de CO2.
- En todo lo **colaborativo** (De paso) el viaje es *del transportista*: él ya
  iba a algún lado y el paquete alquila el espacio que sobra. Solo acá existen
  desvío (knockout ≤15%) y CO2.

Los tres modos que suelen confundirse, lado a lado:

| | **Turno en zona** (dedicado por espacio) | **De paso en vivo** (colab. por demanda) | **Mi trayecto en ventana** (colab. por espacio) |
|---|---|---|---|
| ¿El carrier tiene viaje propio? | **No** — está disponible en una zona, va adonde lo manden | Sí, y está ocurriendo **ahora** | Sí, declarado **antes** |
| Qué declaró | "Estoy disponible acá, en esta franja" | Su trayecto (ya publicado, hoy activo) | Su trayecto habitual/especial |
| Cómo le llega el trabajo | Pedidos "Hoy" encadenados durante la franja | Push en medio del viaje: "te queda de paso, +1,2 km" | Lista pre-armada al tocar "Iniciar trayecto" |
| Cada entrega | **Exclusiva** (regla del dedicado) | Comparte su viaje; puede llevar varios | Ídem |
| Desvío | No aplica — no hay ruta que proteger | Knockout ≤15% | Knockout ≤15% |
| CO2 | No | Sí | Sí |
| Cobra | 82% por entrega, volumen alto | 57%, ingreso marginal | 57%, varios por bundling |

Dos consecuencias que importan para el diseño:

- **Los dos colaborativos no son dos opciones del carrier — son el mismo modo
  visto en dos momentos.** El carrier publica su trayecto una sola vez ("Mi
  trayecto"); *por demanda* es cuando un envío aparece mientras su viaje está
  vivo (el match lo dispara la demanda), *por espacio* es cuando los envíos
  flexibles se acumularon antes y lo esperan al iniciar su ventana (el match
  lo dispara su oferta). El carrier no elige entre ellos ni nota la
  diferencia; por eso en la app son una sola cosa.
- **Turno en zona vs Mi trayecto sí es una elección real**, y la diferencia es
  física: en el turno no hay recorrido propio que respetar (por eso cada viaje
  es exclusivo, sin desvío y mejor pago); en el trayecto la rutina es
  intocable y el sistema solo acerca lo que no la rompe (por eso desvío
  knockout, CO2 y precio mínimo).

---

## 4. Representación por perfil — cómo se ve cada modalidad en pantalla

### 4.1 Remitente — elige resultados, nunca taxonomía

El flow de creación (`sender/send-flow/FlowNavigator`) tiene 4 pasos:

```
1. Paquete      → foto + clasificación por visión (s/m/l/xl) + peso, descripción, valor declarado
2. Direcciones  → origen, destino y datos del destinatario
3. Elegí tu envío → LA pantalla de modalidades (RouteOfferScreen)
4. Resumen      → mapa con el recorrido, desglose y confirmación (pago simulado en 2º plano)
```

La modalidad se elige en el **paso 3**, bajo el título literal **"PASO 03 ·
¿CUÁNDO LO NECESITÁS?"**. La pantalla es: mapa arriba (pines origen→destino +
card flotante con distancia), y abajo un bottom-sheet con **tres cards
apiladas** (`ProductOptionCard`), cada una con radio de selección, badge,
precio a la derecha y una línea de contexto:

| Card | Badge | Precio mostrado | Qué más muestra |
|---|---|---|---|
| **Ya** | `DEDICADA` | `price_dedicated` (100%) | ETA en minutos + *"Un cadete sale ahora, sólo por tu envío"* |
| **Hoy** | `PROGRAMADA` | `price_scheduled` (−18%) | Al seleccionarla se despliega **inline** el selector de franja (`InlineWindowPicker`); no deja continuar sin franja válida; elegida la franja, la card la muestra como subtítulo |
| **De paso** | `ECO −43%` | `price_collaborative`, con el precio dedicado **tachado** | Card destacada en verde (variante eco); ETA + kg de CO₂ ahorrados; abajo, la señal de disponibilidad |

Dos detalles de la card "De paso" que encarnan las reglas del §3.3:

- **Señal honesta de disponibilidad** (`collaborative_routes_now`, que el
  backend calcula contra las trayectorias vivas en ventana con desvío ≤15%):
  chip verde *"N viajes compatibles ahora"* si hay, o el texto *"Nadie va en
  camino ahora — tu envío queda publicado y te avisamos apenas alguien
  coincida"* si no. Sin viajes vivos la card se **atenúa pero no se bloquea**:
  el envío colaborativo puede esperar a que aparezca un trayecto.
- **XL (mudanza/flete)**: la card se reemplaza por un placeholder
  deshabilitado con la explicación: *"«De paso» no disponible — las mudanzas y
  fletes van siempre en un viaje dedicado, por su volumen"*.

El **paso 4 (resumen)** es el único punto del sistema donde el producto se
traduce a la taxonomía interna:

```
ya     → dedicated    + on_demand
hoy    → dedicated    + by_availability
depaso → collaborative + (by_availability si eligió franja; on_demand si no)
```

Reglas de presentación que sobreviven a cualquier rediseño:
- El precio de cada producto **se ve antes de confirmar, siempre** — criterio
  #1 de la encuesta (82%), sin cargos ocultos. Nunca "a convenir".
- Los nombres internos (dedicado, colaborativo, on_demand…) solo aparecen como
  badge secundario chico, jamás como título de la opción.

### 4.2 Transportista — elige cómo trabajar, nunca qué submodalidad servir

La home del rider (`carrier/RiderHomeScreen`) es un mapa con panel inferior.
La pregunta *"¿cómo querés trabajar?"* está representada por **dos toggles y
la lista de viajes publicados**:

| Modo | Cómo se ve en pantalla | Qué pasa al activarlo |
|---|---|---|
| **Salir a repartir** | Toggle principal "en línea" | Entra al pool on-demand publicando su GPS; recibe pedidos "Ya" exclusivos |
| **Turno en zona** | Toggle secundario "Dedicado por espacio" (turno ya) **o** publicación anticipada desde "Publicar viaje" (día + franja + zona) | Ambas vías crean una `dedicated_window`; encadena pedidos "Hoy" durante la ventana. **El toggle se oculta mientras hay un trayecto activo** (exclusividad operativa) |
| **Mi trayecto** | Botón "Publicar viaje" + lista de viajes publicados | Abre `PublishTripScreen`, que ofrece **Trayecto** (variantes **Habitual** — *"Tu trayecto de todos los días"*, con días recurrentes — y **Especial** — *"Un viaje puntual, un día concreto"*) además del **Turno en zona** anticipado |

Ciclo de vida del trayecto en la UI:

- **30 minutos antes** de la ventana aparece la `ActiveTripCard` (si está
  offline) o el banner sobre el mapa (si está online) con el CTA **"Iniciar
  trayecto"** — el inicio es una **acción explícita del carrier**, nunca
  automática: la app le avisa, él decide.
- Cada viaje publicado (fila `TripRow`) es **tocable** y abre el
  `TripDetailModal`: estado de la ventana, días de recurrencia, y las acciones
  **Iniciar (antes de hora) / Modificar / Eliminar** — todas sin penalidad
  (ver §6).
- Con el trayecto vivo, el feed lista los pedidos compatibles del recorrido
  (*"Buscando pedidos que te queden de paso…"*) y los matches en vivo llegan
  como `IncomingOfferModal`, que muestra **el desvío en km** en primer plano —
  el 91,8% participa solo si no se desvía de su rutina, así que el desvío es
  EL dato de la decisión, no un detalle.

Durante una entrega (cualquier modalidad), el `ActiveJobPanel` del mapa
concentra la operación: los hitos de la máquina de estados como botón único
(*"Llegué al origen" → "Retiré el paquete" → "Entregué el paquete"*), botón
para llamar al destinatario, y el botón **"Navegar"** que abre la app de
navegación que el carrier prefiera (ver §8).

Regla transversal de presentación: "Mi trayecto" es **una sola declaración que
sirve a las dos submodalidades colaborativas** — la misma ruta recibe matches
en vivo (demanda) y la lista al entrar en ventana (espacio). El transportista
no tiene por qué saber que internamente son dos.

---

## 5. La escalera precio–tiempo–certeza

El sistema completo se puede explicar (y defender) como una escalera de
trade-offs donde cada escalón cede urgencia a cambio de precio:

```
   precio                          certeza temporal
    100%  ── Ya (exclusivo) ─────── máxima (ETA directo)
     82%  ── Hoy (turno en zona) ── alta (franja pactada)
     57%  ── De paso (colaborativo) ─ variable (depende de un viaje compatible)
                                      + único con ahorro CO2
```

La brecha WTP/WTA de la encuesta ($3.000–6.000 vs $2.500–5.000) fija los
límites: el colaborativo debe caer dentro de esa superposición, y la comisión
de plataforma debe ser baja en etapas tempranas ("el modelo no tolera
comisiones altas" — hallazgo 5).

---

## 6. Penalidades: qué se pena y qué no

Pregunta obligada de la defensa: *¿alguna modalidad penaliza al transportista?*
**Ninguna modalidad penaliza por sí misma.** La única penalidad del sistema es
transversal a las cuatro y castiga el incumplimiento de un compromiso ya
asumido — nunca la disponibilidad:

| Acción del carrier | ¿Penaliza? |
|---|---|
| Rechazar o ignorar una oferta (push o feed) | No |
| No conectarse / no iniciar su trayecto en la ventana | No |
| Modificar o eliminar un viaje publicado | No |
| Apagar cualquier toggle / desconectarse del pool | No |
| **Cancelar un envío que ya aceptó** | **Sí: −0,3 de reputación** (RF-CAR-07) |
| Abandonar un envío ya en tránsito | No permitido — la transición no existe en la máquina de estados |

Mecánica de la única penalidad (`carrier_cancel`): el envío vuelve a `PENDING`
y se reabre al matching, el pago del remitente queda retenido para el próximo
carrier (no se reintegra), y la reputación baja `CARRIER_CANCEL_PENALTY = 0.3`
(con piso en 0). La UI lo advierte antes de confirmar: *"Cancelar después de
aceptar penaliza tu reputación"*.

**Justificación (tesis)**: la OIT (2020) documenta como antipatrón la gestión
algorítmica que penaliza la *disponibilidad* (rechazar pedidos, desconectarse,
no cumplir cuotas). DePaso adopta ese principio para todo lo declarativo: la
oferta de capacidad es libre y retractable sin costo. Pero una vez aceptado un
envío hay un remitente con una promesa concreta — la penalidad protege esa
promesa, y es proporcional (−0,3 sobre 5, recuperable con buenas entregas), no
expulsiva. La línea divisoria es nítida: **libertad total antes de aceptar,
responsabilidad después**.

---

## 7. Reglas transversales (invariantes de las 4)

- **XL siempre dedicado** — nunca colaborativo, por volumen (spec 3.3).
- **Desvío ≤15% como knockout** en todo lo colaborativo — filtro previo al
  ranking, no un componente del score (Yang et al.).
- **Movilidad blanda (peatón/bici)**: solo carga S y viajes ≤5 km, en cualquier
  modalidad.
- **Exclusividad del dedicado**: un viaje dedicado no comparte vehículo con
  nada; un carrier con dedicado activo no recibe más ofertas hasta entregar.
- **CO2 solo colaborativo**: el ahorro existe únicamente cuando se evitó un
  vehículo extra; un dedicado jamás muestra ahorro.
- **El precio siempre existe y siempre se ve antes de confirmar** — nunca
  "a convenir" (criterio #1 de la encuesta, 82%).

---

## 8. Navegación: DePaso asigna, no rutea

DePaso no resuelve un problema de ruteo de vehículos (VRP/TSP): resuelve un
problema de **asignación** — qué paquete viaja con qué trayectoria. Esa
distinción delimita qué es de la plataforma y qué del transportista:

- **El desvío ≤15% se calcula ex-ante**, en el momento del matching (OSRM),
  como criterio de compatibilidad — no es una ruta prescripta. La plataforma
  fija *qué* lleva el carrier y *entre qué puntos*, no por qué calles va.
- **La promesa al remitente es de puntos e hitos, no de camino**: retiro y
  entrega se verifican con la máquina de estados y el tracking GPS, que corre
  por debajo independientemente de con qué app navegue el carrier.
- **El turn-by-turn se delega** a la app que el carrier prefiera: el botón
  "Navegar" del panel de entrega activa abre Google Maps / Waze / Apple Maps
  hacia la *próxima parada* (al origen hasta retirar, al destino después), con
  URLs universales que caen al browser si la app no está instalada. Es la
  práctica estándar de la industria (Uber, Rappi, PedidosYa deep-linkean la
  navegación) y es coherente con el modelo: en colaborativo el carrier **ya
  conoce su trayecto** — prescribirle la ruta contradiría el hallazgo del
  91,8% y el diseño no punitivo (§6). Además, Waze/Google Maps son
  insuperables en tráfico en tiempo real por efecto de red (datos
  crowdsourced); competir con eso no aporta al problema de investigación.
- **El mapa in-app es de referencia, no de navegación**: responde *"a dónde
  voy y en qué orden"* (pines de retiro/entrega y recorrido; el orden de
  paradas cuando lleva varios paquetes es donde la plataforma sí agrega valor,
  porque sale del bundling). La app externa responde *"por qué calles"*.

Se documenta como decisión de alcance del MVP, igual que la cobertura ante
daños.

---

## 9. Estado de implementación

| Tema | Estado |
|---|---|
| 3 productos del sender (Ya / Hoy / De paso) | ✅ `RouteOfferScreen` + `ProductOptionCard` + `InlineWindowPicker` |
| Pricing del tier "Hoy" | ✅ `SCHEDULED_DISCOUNT = 0.18` (`pricing.py`); el quote devuelve `price_scheduled` |
| Señal de disponibilidad colaborativa | ✅ `collaborative_routes_now` (`matching.count_compatible_routes`: trayectorias vivas en ventana, desvío ≤15%) |
| Precio siempre obligatorio | ✅ `estimated_price` NOT NULL en modelo, schema y DB — nunca "a convenir" |
| Modos de trabajo del carrier | ✅ toggle en línea + toggle espacio (oculto con trayecto activo) + Habitual/Especial + banner 30′ antes + `TripDetailModal` (iniciar/modificar/eliminar) |
| Navegación externa | ✅ botón "Navegar" (`ActiveJobPanel` → `openExternalNavigation`: Google Maps / Waze / Apple Maps) |
| Penalidad única por cancelar tras aceptar | ✅ `carrier_cancel`: −0,3 reputación + reapertura del envío (§6) |
| `assignment_mode` en colaborativos | Se guarda pero el matching no lo lee — **correcto por diseño**: la distinción es la dirección del flujo (push en vivo vs feed en ventana) |
| Descuento "Hoy" calibrado con historial | Pendiente post-MVP (Oyama & Akamatsu: elasticidad por zona/franja) |
