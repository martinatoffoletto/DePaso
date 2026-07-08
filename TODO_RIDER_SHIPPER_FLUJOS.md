# DePaso — TODO Rider/Shipper y flujos dedicados

**Actualizado:** 7 de julio de 2026  
**Objetivo:** listar los pendientes funcionales y de UX que hay que resolver en la app móvil para que los flujos de rider/shipper queden coherentes con el modelo operativo de DePaso.

> **Estado (7 jul 2026): TODO IMPLEMENTADO.** El checklist de la sección 10 quedó completo — mapa operativo real (react-native-maps) con gestión de hitos, modal entrante estilo Uber con foto/descripción/valor declarado (auto-popup al detectar pedidos nuevos), toggle «dedicado por espacio» con capacidad restante y encadenamiento de zona en el matching, publicar viaje/ventana con el mismo autocomplete de direcciones del shipper + calendario + hora + duración, Viajes convertido en historial, contraste corregido y comisión oculta al cliente.

---

## 1. Rider: empezar a trabajar debe abrir el mapa operativo

### Problema actual
Después de tocar **"Empezar a trabajar"** en modo dedicado, el flujo no lleva al conductor a una pantalla operativa completa.

### Comportamiento esperado
- Al tocar **"Empezar a trabajar"**, redirigir al rider a una pantalla con mapa.
- El mapa debe ser funcional, similar al mapa que usa el shipper para elegir origen y destino.
- Debe mostrar la ubicación actual del conductor.
- Desde esta pantalla se gestiona la actividad real del conductor.

### Pantalla esperada
- Mapa interactivo como vista principal.
- Estado del conductor: online/offline.
- Ubicación actual visible.
- Pedidos entrantes como modal superpuesto.
- Acciones operativas del pedido: llegar al origen, retirar paquete, llegar al destino, entregar paquete.

---

## 2. Modal de pedido entrante estilo Uber

### Comportamiento esperado
Cuando aparezca un pedido disponible para el rider, debe abrirse un modal de pedido entrante.

### Información mínima del modal
- Origen: desde dónde se retira.
- Destino: hacia dónde se entrega.
- Precio del viaje.
- Foto del paquete si existe.
- Descripción del paquete.
- Valor declarado del paquete, si aplica.
- Botones para aceptar o rechazar.

### Reglas de UX
- El modal debe sentirse como una solicitud entrante, no como una pantalla estática.
- Debe poder aparecer sobre el mapa operativo.
- Si el rider acepta, el pedido pasa a formar parte de su actividad activa.
- Si rechaza, el rider sigue disponible.

---

## 3. Dedicado por demanda

### Definición funcional
**Dedicado por demanda:** el remitente solicita un envío y el sistema identifica transportistas disponibles cercanos al punto de origen.

### Reglas esperadas
- El shipper crea un envío desde origen hacia destino.
- El sistema busca riders online cercanos al origen.
- Los riders reciben el pedido entrante en el mapa operativo.
- El criterio principal es cercanía al punto de origen, disponibilidad y compatibilidad con vehículo/capacidad.

### Pendientes
- Verificar que el flujo del shipper dispare correctamente ofertas a riders disponibles.
- Verificar que el rider online vea el pedido como modal entrante.
- Mostrar el pedido con datos completos: origen, destino, precio, foto, descripción y valor.

---

## 4. Dedicado por espacio

### Definición funcional
**Dedicado por espacio:** el transportista informa disponibilidad en una zona y franja horaria determinadas, permitiendo la asignación de pedidos compatibles con la capacidad de su vehículo.

### Comportamiento esperado
- El rider puede activar un toggle de **dedicado por espacio**.
- Al activarlo, informa que tiene capacidad disponible para aceptar pedidos compatibles.
- Si ya aceptó un pedido, pueden seguir apareciendo nuevos pedidos.
- Los nuevos pedidos no deben mandarlo a zonas totalmente distintas o incompatibles con su recorrido.
- La asignación debe respetar la capacidad restante del vehículo.

### Reglas de matching
- Considerar ubicación actual del rider.
- Considerar pedidos ya aceptados.
- Considerar origen/destino del pedido activo.
- Considerar capacidad total y capacidad restante del vehículo.
- Evitar pedidos con desvíos demasiado grandes o direcciones ultra diferentes.
- Priorizar pedidos que entren naturalmente en la zona, ventana horaria o recorrido activo.

### Pendientes
- Agregar/ajustar toggle en la pantalla del rider.
- Hacer visible si el rider está trabajando solo por demanda o también por espacio.
- Definir cómo se muestra la capacidad restante.
- Definir cómo se acumulan varios pedidos activos en el mapa.

---

## 5. Publicar un viaje habitual (colaborativo)

### Problema actual
La pantalla de publicar viaje necesita usar el mismo estándar de direcciones que el shipper y representar mejor trayectos habituales.

### Comportamiento esperado
Al tocar **"Publicar un viaje que voy a hacer"**, el rider debe poder cargar un trayecto habitual.

### Campos necesarios
- Desde: selector de dirección con la misma librería/componente que usa el shipper.
- Hasta: selector de dirección con la misma librería/componente que usa el shipper.
- Días de la semana en los que hace ese trayecto.
- Hora de inicio.

### Caso de uso
Ejemplo: el rider hace todos los días el trayecto de su casa a la oficina y quiere aceptar envíos compatibles con ese recorrido.

### Pendientes
- Reutilizar el componente/librería de direcciones del flujo shipper.
- Evitar inputs manuales inconsistentes si ya existe autocompletado/geocoding.
- Agregar selección clara de días.
- Agregar selección clara de hora de inicio.

---

## 6. Ventana dedicada

### Comportamiento esperado
La ventana dedicada también debe cargarse en base a direcciones reales y una disponibilidad temporal clara.

### Campos necesarios
- Zona o dirección base, usando el mismo sistema de direcciones que el shipper.
- Inicio de ventana:
  - Selección de día con componente de calendario.
  - Selección de hora con dropdown.
  - Opción **"ahora"** para iniciar inmediatamente.
- Fin de ventana:
  - No seleccionar otro día.
  - Definir duración por cantidad de horas.

### Pendiente de definición
Evaluar si además hace falta:
- Radio máximo de operación.
- Capacidad disponible al inicio de la ventana.
- Tipo de carga aceptada.
- Vehículo activo para esa ventana.

---

## 7. Viajes debe ser historial, no gestión activa

### Problema actual
La sección de viajes puede confundirse con una pantalla de operación.

### Comportamiento esperado
- La sección **Viajes** debe funcionar solo como historial.
- No se debería gestionar actividad activa desde ahí.
- La actividad activa se gestiona desde el mapa interactivo.

### Actividad activa
Desde el mapa y sus modales se deben manejar los hitos:
- Llegué al punto de retiro.
- Retiré el paquete.
- Llegué al punto de entrega.
- Entregué el paquete.

---

## 8. Contraste visual en headers de Rider y Shipper

### Problema actual
Las letras de **Rider** arriba, sobre fondo verde, no se ven con suficiente claridad. Revisar también **Shipper**.

### Comportamiento esperado
- Mejorar contraste del texto sobre fondo verde.
- Revisar color, peso tipográfico y opacidad.
- Asegurar legibilidad en modo claro/oscuro si aplica.

### Pendientes
- Auditar headers de Rider.
- Auditar headers de Shipper.
- Ajustar tokens/estilos para cumplir contraste mínimo.

---

## 9. Sacar alert de comisión DePaso

### Problema actual
Hay un alert o desglose visible sobre la comisión de DePaso.

### Regla de negocio
El cliente no debe ver la comisión de DePaso. La comisión se descuenta del payout del conductor, no se presenta como un cargo explícito al cliente.

### Comportamiento esperado
- El cliente ve el precio total del envío.
- El conductor ve lo que cobra o corresponde cobrar.
- No mostrar al cliente un alert/desglose con la comisión de DePaso.

### Pendientes
- Remover alert de comisión del flujo visible al cliente.
- Revisar pantallas de resumen, pago y confirmación.
- Mantener la comisión internamente para cálculos del backend y finanzas.
- Si hay desglose para admin/organización, verificar que no aparezca en el flujo del cliente final.

---

## 10. Checklist de implementación

- [x] Redirigir **Empezar a trabajar** al mapa operativo del rider.
- [x] Reutilizar o adaptar el mapa de origen/destino del shipper para el rider.
- [x] Mostrar ubicación actual del rider en el mapa operativo.
- [x] Crear modal de pedido entrante estilo Uber.
- [x] Mostrar origen, destino, precio, foto, descripción y valor del paquete.
- [x] Implementar/ajustar flujo de dedicado por demanda.
- [x] Implementar/ajustar toggle de dedicado por espacio.
- [x] Permitir múltiples pedidos compatibles cuando el rider tenga capacidad restante.
- [x] Evitar asignaciones con desvíos o destinos incompatibles.
- [x] Rehacer **Publicar viaje** con selector de direcciones, días y hora de inicio.
- [x] Rehacer **Ventana dedicada** con dirección/zona, calendario, hora y duración en horas.
- [x] Convertir **Viajes** en historial solamente.
- [x] Mover gestión activa de pedidos al mapa y modales.
- [x] Mejorar contraste de headers Rider/Shipper.
- [x] Sacar alert/desglose visible de comisión DePaso para clientes.

