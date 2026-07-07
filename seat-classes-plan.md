# Plan: Clases de Asiento — Economy, Business y Galaxium

## Resumen

Añadir soporte para tres clases de asiento (Economy, Business, Galaxium) en el sistema de reservas de Galaxium Travels. Cada clase tiene su propio inventario de asientos y precio derivado de multiplicadores configurables sobre el precio base del vuelo. La clase se guarda en la reserva y se muestra visualmente en la UI.

**Alcance:**
- Backend: migración incremental de BD, lógica de reserva por clase, actualización de esquemas y endpoints
- Frontend: selector de clase en BookingModal, precios en tiempo real, badge en BookingCard, disponibilidad por clase en FlightCard
- Tests: asegurar que los tests existentes sigan pasando tras los cambios

**Fuera del alcance:**
- Selección de asiento individual (número de fila/columna)
- Cambio de clase después de reservar
- Nuevos tests

---

## Sub-Tarea 1 — Migración incremental de la base de datos

**Status:** [ ] pending

### Intent
Ampliar el modelo `Flight` con campos de inventario por clase y multiplicadores de precio, y el modelo `Booking` con la clase elegida. La migración debe ser incremental para no perder datos existentes.

### Expected Outcomes
- La tabla `flights` tiene los nuevos campos: `economy_seats`, `business_seats`, `galaxium_seats`, `business_multiplier`, `galaxium_multiplier`
- La tabla `bookings` tiene el nuevo campo: `seat_class`
- Los registros existentes conservan sus datos; los nuevos campos toman valores por defecto
- El campo `seats_available` se mantiene (compatibilidad con código existente durante la migración)

### Todo List
1. En `booking_system_backend/models.py`, añadir los 6 campos nuevos a la clase `Flight`:
   - `economy_seats` (Integer, default=0)
   - `business_seats` (Integer, default=0)
   - `galaxium_seats` (Integer, default=0)
   - `business_multiplier` (Float, default=2.0)
   - `galaxium_multiplier` (Float, default=4.0)
2. En `booking_system_backend/models.py`, añadir `seat_class` (String, default="economy") a la clase `Booking`
3. Crear script `booking_system_backend/migrate.py` que ejecute `ALTER TABLE` para añadir las columnas a `booking.db` usando SQLite directamente (con `IF NOT EXISTS` o manejo de error para idempotencia)
4. Poblar los nuevos campos de asientos con valores razonables: `economy_seats = seats_available`, `business_seats = max(1, seats_available // 3)`, `galaxium_seats = max(1, seats_available // 5)` para cada vuelo existente
5. Actualizar `seed.py` para que los nuevos vuelos semilla incluyan los 5 campos nuevos de Flight

### Relevant Context
- `booking_system_backend/models.py` — clases `Flight` (líneas 12-20) y `Booking` (líneas 22-28)
- `booking_system_backend/seed.py` — datos semilla de vuelos (líneas ~30-50)
- `booking_system_backend/booking.db` — BD SQLite existente que debe preservarse

---

## Sub-Tarea 2 — Actualizar esquemas y lógica de reserva en el backend

**Status:** [x] done

### Intent
Actualizar los esquemas Pydantic y la lógica de negocio para soportar la clase de asiento en el proceso de reserva: validación de disponibilidad por clase, descuento del contador correcto y precio calculado en la respuesta.

### Expected Outcomes
- `BookingRequest` incluye `seat_class: str` (valores válidos: `"economy"`, `"business"`, `"galaxium"`)
- `FlightOut` expone los nuevos campos de inventario y multiplicadores
- `BookingOut` incluye `seat_class` en la respuesta
- `book_flight()` descuenta el contador de la clase elegida y valida que haya disponibilidad en esa clase
- `cancel_booking()` incrementa el contador de la clase correspondiente al cancelar
- Los tests existentes siguen pasando (los campos nuevos tienen valores por defecto)

### Todo List
1. En `booking_system_backend/schemas.py`:
   - Añadir `economy_seats`, `business_seats`, `galaxium_seats`, `business_multiplier`, `galaxium_multiplier` a `FlightOut`
   - Añadir `seat_class: str` a `BookingOut`
   - Añadir `seat_class: str = "economy"` a `BookingRequest` (con default para no romper tests existentes)
2. En `booking_system_backend/services/booking.py`:
   - Validar que `seat_class` es uno de los tres valores permitidos
   - Sustituir el chequeo de `seats_available` por el contador de la clase elegida (`economy_seats`, `business_seats` o `galaxium_seats`)
   - Decrementar el contador correcto al reservar
   - Decrementar también `seats_available` (mantener coherencia del campo existente)
   - Al cancelar, obtener `seat_class` de la reserva e incrementar el contador correspondiente
3. Verificar que `server.py` no necesita cambios (ya usa los servicios y esquemas)

### Relevant Context
- `booking_system_backend/schemas.py` — `FlightOut` (l.5-15), `BookingOut` (l.24-32), `BookingRequest` (l.18-21)
- `booking_system_backend/services/booking.py` — funciones `book_flight` y `cancel_booking`
- `booking_system_backend/tests/test_services.py` y `test_rest.py` — no deben romperse

---

## Sub-Tarea 3 — Actualizar tipos e interfaz API en el frontend

**Status:** [x] done

### Intent
Sincronizar los tipos TypeScript del frontend con los nuevos campos del backend para que las llamadas API estén tipadas correctamente.

### Expected Outcomes
- La interfaz `Flight` incluye los nuevos campos de inventario y multiplicadores
- La interfaz `Booking` incluye `seat_class`
- La interfaz `BookingRequest` incluye `seat_class`
- El servicio `api.ts` pasa `seat_class` en la llamada `bookFlight()`

### Todo List
1. En `booking_system_frontend/src/types/index.ts`, actualizar:
   - `Flight`: añadir `economy_seats`, `business_seats`, `galaxium_seats`, `business_multiplier`, `galaxium_multiplier`
   - `Booking`: añadir `seat_class: 'economy' | 'business' | 'galaxium'`
   - `BookingRequest`: añadir `seat_class: 'economy' | 'business' | 'galaxium'`
2. En `booking_system_frontend/src/services/api.ts`, verificar que `bookFlight()` ya pasa el objeto completo sin hardcodear campos (si lo hace, asegurar que `seat_class` viaje en el body)

### Relevant Context
- `booking_system_frontend/src/types/index.ts` — interfaces `Flight`, `Booking`, `BookingRequest`, `BookingWithFlight`
- `booking_system_frontend/src/services/api.ts` — función `bookFlight(data: BookingRequest)` → POST /book

---

## Sub-Tarea 4 — Selector de clase en BookingModal con precio en tiempo real

**Status:** [x] done

### Intent
Añadir al modal de reserva existente un selector de las tres clases de asiento. Al cambiar la clase, el precio mostrado debe actualizarse en tiempo real. La clase seleccionada se envía al confirmar la reserva.

### Expected Outcomes
- El modal muestra 3 opciones de clase: Economy, Business, Galaxium
- Cada opción indica: nombre de la clase, precio calculado, asientos disponibles
- Si una clase no tiene asientos disponibles, la opción está deshabilitada
- El precio en el modal se actualiza al seleccionar otra clase
- Al confirmar, se pasa `seat_class` en la llamada `bookFlight()`

### Todo List
1. En `booking_system_frontend/src/components/bookings/BookingModal.tsx`:
   - Añadir estado local `selectedClass: 'economy' | 'business' | 'galaxium'` con default `'economy'`
   - Calcular precios por clase: `economyPrice = flight.price`, `businessPrice = flight.price * flight.business_multiplier`, `galaxiumPrice = flight.price * flight.galaxium_multiplier`
   - Renderizar 3 tarjetas/botones de selección de clase con: nombre, precio formateado, asientos disponibles, estado deshabilitado si `seats === 0`
   - Mostrar el precio total calculado según la clase activa
   - Pasar `seat_class: selectedClass` en la llamada a `onBook()`
2. Asegurarse de que la prop `onBook` del modal recibe y pasa `seat_class` hasta la llamada `api.bookFlight()`

### Relevant Context
- `booking_system_frontend/src/components/bookings/BookingModal.tsx` — modal actual de reserva
- `booking_system_frontend/src/utils/formatters.ts` — función para formatear precios
- `booking_system_frontend/src/pages/Flights.tsx` — orquesta la apertura del modal y llama a `api.bookFlight()`

---

## Sub-Tarea 5 — Mostrar disponibilidad por clase en FlightCard

**Status:** [x] done

### Intent
Actualizar la tarjeta de vuelo para mostrar la disponibilidad de asientos desglosada por clase con sus precios correspondientes, en lugar del contador genérico actual.

### Expected Outcomes
- `FlightCard` muestra los 3 tipos de clase con su disponibilidad y precio base
- El botón "Book Now" sigue funcionando igual (abre el modal)
- Si todas las clases están a 0, se muestra "Sold Out"
- El diseño mantiene la estética espacial existente

### Todo List
1. En `booking_system_frontend/src/components/flights/FlightCard.tsx`:
   - Sustituir el bloque de "X seats available" por tres filas o pills con: icono/badge de clase, precio calculado y disponibilidad
   - Calcular los precios con los multiplicadores del objeto `flight`
   - Condición "Sold Out": `economy_seats + business_seats + galaxium_seats === 0`
   - Mantener animaciones y estilos existentes de Framer Motion / Tailwind

### Relevant Context
- `booking_system_frontend/src/components/flights/FlightCard.tsx` — componente actual (105 líneas)
- Clases CSS y animaciones existentes en el componente deben reutilizarse
- `booking_system_frontend/src/utils/formatters.ts` — formatear precios

---

## Sub-Tarea 6 — Badge de clase en BookingCard

**Status:** [x] done

### Intent
Mostrar la clase de asiento de cada reserva en la tarjeta de "Mis Reservas" con un badge visual diferenciado por clase.

### Expected Outcomes
- `BookingCard` muestra un badge con la clase: Economy (azul/gris), Business (dorado/ámbar), Galaxium (púrpura/violeta)
- El badge es visualmente coherente con el diseño espacial existente
- Las reservas antiguas (sin `seat_class` o con default `"economy"`) muestran Economy por defecto

### Todo List
1. En `booking_system_frontend/src/components/bookings/BookingCard.tsx`:
   - Añadir lógica de badge según `booking.seat_class` con tres variantes de color
   - Colocar el badge en un lugar visible de la tarjeta (junto al estado o encabezado)
   - Economy: colores neutros/azul, Business: ámbar/dorado, Galaxium: púrpura/violeta con efecto especial

### Relevant Context
- `booking_system_frontend/src/components/bookings/BookingCard.tsx` — componente actual (131 líneas)
- Patrones de badge de estado ya existentes en el componente (status booked/cancelled/completed) — reutilizar ese patrón
- `booking_system_frontend/src/types/index.ts` — interface `Booking` actualizada en Sub-Tarea 3
