# Modalidades de envío — propósito, representación y justificación

Documento canónico de diseño de producto. Define **para qué existe** cada
submodalidad, **cómo se le presenta** a cada perfil (remitente / transportista)
y **en qué autor o hallazgo de la tesis se apoya** cada decisión. Alineado con
el capítulo 1 (submodalidades), capítulo 2 (estado del arte) y capítulo 3
(encuesta n=145) del PFI.

> Este documento describe el modelo objetivo, independiente del estado actual
> del código. El gap con lo implementado se lista al final.

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
- **Transportista**: declara un turno en zona ("hoy de 14 a 18, Caballito").
  Durante la ventana **encadena entregas dedicadas una tras otra** — cada
  viaje sigue siendo exclusivo (regla del dedicado), pero la ventana completa
  se llena de pedidos secuenciales. Menos pago por viaje que el "Ya", más
  volumen y cero incertidumbre: sabe cuándo y dónde trabaja.
- **Por qué es más barato que el "Ya"** (propuesta de pricing): el retiro se
  agenda dentro de un turno ya comprometido — el costo de acercarse al pickup
  se reparte entre los pedidos de la ventana en lugar de cargarse a uno solo.
  Descuento intermedio (~15–20%), a calibrar.
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

---

## 4. Representación por perfil

### 4.1 Remitente — elige resultados, nunca taxonomía

Una sola pregunta estructura el flow: **¿cuándo lo necesitás?**

| Producto | Pregunta que responde | Submodalidad interna | Precio | Promesa |
|---|---|---|---|---|
| **Ya** | "Lo necesito ahora" | Dedicado por demanda | 100% | Cadete exclusivo saliendo ya, ETA mínimo |
| **Hoy** | "Hoy, en esta franja" | Dedicado por espacio | ~80–85% (propuesto) | Retiro programado dentro de la franja, sin vigilar el teléfono |
| **De paso** | "Puedo esperar a que alguien vaya" | Colaborativo (demanda o espacio — lo decide el matching) | 57% | El más barato y el único con ahorro de CO2 visible; el tiempo depende de que haya un viaje compatible |

Reglas de presentación:
- Los tres productos se muestran **lado a lado con precio, tiempo y CO2** —
  la encuesta es categórica: el precio es el criterio #1 (82%) y debe verse
  antes de confirmar, sin cargos ocultos.
- "De paso" muestra **disponibilidad real** (viajes compatibles ahora / espera
  estimada) — nunca promete un descuento que depende de una oferta que quizá
  no existe.
- XL (mudanza/flete): solo aparece "Ya" y "Hoy", con la explicación de por qué
  ("por volumen, va siempre en viaje exclusivo").
- Los nombres internos (dedicado, colaborativo, on_demand…) pueden aparecer
  como etiqueta secundaria chica, jamás como el título de la opción.

### 4.2 Transportista — elige cómo trabajar, nunca qué submodalidad servir

Una sola pregunta estructura la home: **¿cómo querés trabajar?**

| Modo | Qué declara | Submodalidad que sirve | Qué recibe |
|---|---|---|---|
| **Salir a repartir** | Nada — un toggle + GPS | Dedicado por demanda | Viajes exclusivos inmediatos, mejor pago por viaje |
| **Turno en zona** | Zona + franja ("hoy 14–18, Caballito") | Dedicado por espacio | Cadena de entregas programadas durante la ventana |
| **Mi trayecto** | Origen→destino + horario; **habitual** (días recurrentes) o **especial** (un día puntual) | Colaborativo — demanda **y** espacio a la vez | Pedidos que le quedan de paso: push en vivo + lista al entrar en ventana; lleva varios según capacidad residual |

Reglas de presentación:
- "Mi trayecto" es **una sola declaración que sirve a las dos submodalidades
  colaborativas**: la misma ruta publicada recibe matches en vivo (demanda) y
  sugerencias al conectarse en la franja (espacio). El transportista no tiene
  por qué saber que internamente son dos.
- Cada oferta colaborativa muestra **el desvío en km y %** y la ganancia — el
  91,8% participa solo si no se desvía de su rutina, así que el desvío es EL
  dato de la decisión, no un detalle.
- Nada es punitivo: rechazar ofertas, no conectarse o cerrar una ventana no
  degrada reputación (OIT 2020 como antipatrón explícito). La reputación se
  construye solo con entregas realizadas y calificaciones.
- Los tres modos son combinables en el tiempo pero con exclusividad operativa
  clara: un dedicado en curso bloquea todo lo demás; una trayectoria activa
  oculta el modo "turno en zona".

---

## 5. La escalera precio–tiempo–certeza

El sistema completo se puede explicar (y defender) como una escalera de
trade-offs donde cada escalón cede urgencia a cambio de precio:

```
   precio                          certeza temporal
    100%  ── Ya (exclusivo) ─────── máxima (ETA directo)
  ~80–85% ── Hoy (turno en zona) ── alta (franja pactada)
     57%  ── De paso (colaborativo) ─ variable (depende de un viaje compatible)
                                      + único con ahorro CO2
```

La brecha WTP/WTA de la encuesta ($3.000–6.000 vs $2.500–5.000) fija los
límites: el colaborativo debe caer dentro de esa superposición, y la comisión
de plataforma debe ser baja en etapas tempranas ("el modelo no tolera
comisiones altas" — hallazgo 5).

---

## 6. Reglas transversales (invariantes de las 4)

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

## 7. Gap con lo implementado hoy

| Tema | Hoy | Objetivo (este doc) |
|---|---|---|
| Elección del sender | 2 cards (dedicada/colaborativa) + franja que deriva `assignment_mode` | 3 productos explícitos (Ya / Hoy / De paso) con la escalera de precios visible |
| Pricing del tier "Hoy" | Mismo precio que "Ya" | Descuento intermedio ~15–20% (propuesta, a calibrar) |
| Disponibilidad colaborativa | La card promete −43% sin chequear si hay trayectos vivos | Señal real: "N viajes compatibles ahora" o espera estimada |
| Carrier: modos de trabajo | Toggle en línea + toggle espacio + publicar viaje (habitual/especial) | Mismos tres modos, presentados como una sola pregunta ("¿cómo querés trabajar?") |
| `assignment_mode` en colaborativos | Se guarda pero el matching no lo lee | Correcto por diseño: la distinción es la dirección del flujo (push vs feed), documentarlo así en la tesis |
