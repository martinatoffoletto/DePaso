# Casos de Uso - Tests de Integración (DePaso)

Este documento detalla los flujos críticos de la aplicación que se deben validar mediante tests de integración (End-to-End). En lugar de probar unitariamente pequeñas funciones aisladas, el objetivo es simular el ciclo de vida real de las entidades involucradas y garantizar que la lógica de negocio, como la asignación colaborativa, el cruce de ubicaciones y el manejo de capacidades, funcione integralmente contra la base de datos real.

---

## 1. Casos de Uso: Usuario Común (Cliente)

Estos tests simulan a un usuario regular (`client`) usando la aplicación para enviar paquetes.

### 1.1. Cotización y Publicación de Envío
- **Flujo:** El usuario pide una cotización (Quote) detallando tamaño de paquete, origen y destino.
- **Validación:** Se debe devolver un precio para la modalidad dedicada y colaborativa, estimación de ahorro de CO2 y ETA. 
- **Flujo:** Tras ver la cotización, el usuario crea un envío (`POST /shipments`).
- **Validación:** El sistema debe registrar el envío correctamente con estado `PENDING` en la base de datos, con el ID del cliente actual inyectado desde el token JWT.

### 1.2. Edición y Cancelación Previa
- **Flujo:** El usuario edita un envío pendiente (e.g. cambia de modalidad o de tamaño).
- **Validación:** El sistema debe recalcular y actualizar el precio estimado, guardando los cambios sin afectar a un carrier (ya que no está asignado).
- **Flujo:** El usuario cancela el envío antes de que sea aceptado (`POST /shipments/{id}/cancel`).
- **Validación:** El estado pasa a `CANCELLED`, y este envío ya no debe figurar en el feed de ningún transportista.

### 1.3. Valoración del Transportista (Rating)
- **Flujo:** Tras una entrega exitosa, el cliente califica al transportista (`POST /shipments/{id}/rating`).
- **Validación:** El sistema debe registrar la calificación y, más importante, actualizar asíncronamente (o de manera transaccional) la reputación promedio en el perfil del carrier.

---

## 2. Casos de Uso: Transportista (Rider / Carrier)

Estos tests se enfocan en las acciones de los repartidores (rutas, capacidades, entregas).

### 2.1. Creación de Perfil Carrier (Role Switching)
- **Flujo:** Un usuario común entra a la sección "Quiero ser repartidor" y crea su perfil de carrier (`POST /carriers/me`) definiendo su vehículo (e.g. `car` o `moto`) y capacidad en Kg.
- **Validación:** El perfil se crea correctamente y su estado inicial es `is_verified=False` (requiere aprobación).

### 2.2. Publicación de Rutas (Matching Colaborativo)
- **Flujo:** Un transportista activo y verificado publica un trayecto recurrente o puntual (e.g., va desde el centro a su casa) usando `POST /routes`.
- **Validación:** La ruta queda persistida en base de datos.
- **Flujo:** Posteriormente, cuando el motor de matching busca candidatos para un nuevo envío colaborativo, si el trayecto se ajusta a menos de 15% de desvío, la carga de este envío debe aparecer en el "feed" del transportista (`GET /carriers/me/feed`).

### 2.3. Aceptación Múltiple y Reducción de Capacidad (CRÍTICO)
- **Flujo:** El carrier ve 3 envíos en su feed que pesan 10kg, 15kg y 5kg respectivamente. Su vehículo tiene una capacidad de 25kg total.
- **Validación:** Acepta el primer envío (10kg). Su capacidad reservada es 10kg, le quedan 15kg disponibles.
- **Validación:** Acepta el segundo envío (15kg). Se le asigna. Queda sin espacio disponible.
- **Validación:** Intenta aceptar el tercer envío (5kg). El sistema **debe rechazar la operación** con un error `409 Conflict` (o `422`), garantizando que no se puede sobreasignar capacidad.

### 2.4. Ciclo de Entrega y Liberación de Capacidad
- **Flujo:** El carrier empieza su viaje y actualiza los hitos de un paquete (`PICKUP_ARRIVED` -> `IN_TRANSIT` -> `DELIVERED`).
- **Validación:** Una vez que el estado es `DELIVERED`, el cálculo de espacio (`_available_capacity`) debe reflejar que el carrier recuperó la capacidad que pesaba ese paquete.
- **Validación:** Además, se debe calcular y persistir el ahorro de CO2 en el envío (si era de modalidad colaborativa).

---

## 3. Casos de Uso Comunes e Interacciones Completas

Flujos End-to-End donde ambas partes (y el admin) interactúan.

### 3.1. Flujo "Happy Path" Colaborativo E2E
1. **Admin** establece un peso especial en el matching (`PATCH /admin/matching-weights`).
2. **Carrier** (previamente aprobado por admin) publica una ruta para el martes por la tarde.
3. **Client** pide un envío en modalidad `collaborative` que se encuentra justo en el trayecto de la ruta del carrier.
4. **Matching:** El carrier revisa su `feed` y ve el envío rankeado positivamente por el sistema (al no requerir gran desvío).
5. **Aceptación:** El carrier acepta el envío. El cliente verifica que el envío pasó a `ASSIGNED`.
6. **Desarrollo:** El carrier marca recogida y posteriormente `DELIVERED`.
7. **Finalización:** El cliente da 5 estrellas. El carrier verifica que su reputación global (en su summary `GET /carriers/me/summary`) ha aumentado o se ha ajustado, y que su historial de ganancias y CO2 ahorrado se ha actualizado.

### 3.2. Cancelación Tarde (Penalidad de Reputación)
1. Carrier acepta un envío.
2. Antes de llegar a recogerlo, el carrier decide abortar la misión (`POST /shipments/{id}/carrier-cancel`).
3. **Validación:** El envío vuelve a estar `PENDING` para otros repartidores. Se le aplica la penalización de cancelación (restando reputación) al perfil del carrier.

---

### Resumen de Próximos Pasos Técnicos

Para automatizar esto en `pytest` necesitaremos:
- **`client_token`** y **`carrier_token`**: Fixtures que inyecten headers de autenticación para roles separados.
- **`test_db`**: Base de datos aislada con testcontainers para que cada test case corra de forma segura, o un teardown/rollback limpio por test usando SQLAlchemy.
- Mock de **OSRM**: Como el ruteo de OSRM ocurre en un contenedor aparte, se proveerá un _mock_ de la dependencia OSRM (o fallback en haversine) para que los tests pasen instantáneamente en integración sin depender de la red local.
