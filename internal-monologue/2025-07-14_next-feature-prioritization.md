# ¿Qué construir a continuación?

**Contexto revisado:**
- `seat-classes-plan.md`: Sub-Tareas 2–6 marcadas como [x] done. Sub-Tarea 1 (migración BD) marcada como [ ] pending.
- Backend: modelos, schemas, servicios y MCP tools ya soportan seat classes.
- Frontend: BookingModal, FlightCard, BookingCard ya implementados.
- Tests: cubren flujos básicos de booking/cancel/user — sin cobertura de seat classes.
- No hay autenticación real (solo name+email lookup).
- No hay paginación en vuelos ni bookings.
- No hay búsqueda de vuelos por fecha/precio.
- No hay historial de precios pagados por clase (BookingOut no incluye precio pagado).

**Brechas identificadas:**
1. Sub-Tarea 1 del plan pendiente: migración BD (pero los modelos ya están en código, así que la BD real en disco puede no tener las columnas nuevas).
2. El precio pagado no se persiste en la reserva — BookingOut no tiene `price_paid`.
3. No hay filtros por clase en "Mis Reservas".
4. Tests no cubren seat classes (ni por clase correcta, ni clase inválida, ni clase agotada).
5. Búsqueda de vuelos solo por texto, no por fecha/precio/disponibilidad.

**Conclusión para el plan:** La prioridad #1 es completar la Sub-Tarea 1 pendiente. Tras eso, las oportunidades de mayor valor son: guardar precio pagado en booking, filtros en MyBookings, y tests de seat classes.
