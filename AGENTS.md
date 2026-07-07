# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Structure

Monorepo with two independent sub-projects:
- `booking_system_backend/` — FastAPI + SQLAlchemy + FastMCP (Python, port 8080)
- `booking_system_frontend/` — React 19 + Vite + TypeScript + Tailwind (port 5173)

## Backend Commands

All commands must run from `booking_system_backend/` using its own `.venv`:

```bash
# Run server
.venv/Scripts/python.exe server.py           # Windows
python server.py                              # Mac/Linux (activate .venv first)

# Run all tests
.venv/Scripts/pytest.exe                     # Windows
pytest                                        # Mac/Linux

# Run a single test
pytest tests/test_services.py::TestBookingService::test_book_flight_success -v
pytest tests/test_rest.py::TestBookEndpoint::test_book_flight_success -v

# One-time migration (adds seat class columns to existing booking.db)
python migrate.py
```

No linter configured for Python.

## Frontend Commands

All commands must run from `booking_system_frontend/`:

```bash
npm run dev        # Vite dev server on :5173
npm run build      # tsc -b && vite build
npm run lint       # eslint .
```

## Critical Architecture Patterns

### Backend error handling — never raise HTTP exceptions
Service functions return `BookingOut | ErrorResponse` (or similar `Union`). HTTP endpoints return both with `response_model=Union[SomeOut, ErrorResponse]` and always HTTP 200. **Never raise `HTTPException`** — errors are embedded in the response body with `success: False`.

```python
# In services: return an ErrorResponse, don't raise
return ErrorResponse(error="...", error_code="FLIGHT_NOT_FOUND", details="...")
# In MCP tools: check isinstance(result, ErrorResponse) and raise Exception
```

### MCP + FastAPI dual server
`server.py` exposes both REST endpoints and an MCP server. The MCP app (`mcp.http_app()`) is mounted at `/mcp`. **MCP tools must be registered before the FastAPI app is instantiated** (order matters in `server.py`). MCP tools open their own `SessionLocal()` instead of using FastAPI dependency injection.

### DB is SQLite (`booking.db`) — no migrations auto-applied on startup
`init_db()` only creates tables via `Base.metadata.create_all`. New columns require running `migrate.py` manually. Tests use in-memory SQLite with `StaticPool`.

### Seat class logic
`seat_class` must be one of `"economy"`, `"business"`, `"galaxium"`. `Flight` stores `economy_seats`, `business_seats`, `galaxium_seats` separately plus `seats_available` as a total. Both are decremented on booking; both are incremented on cancellation. Backward-compat: rows with `economy_seats == 0` but `seats_available > 0` treat `seats_available` as economy capacity.

### Frontend API responses
`isErrorResponse(response)` from `src/services/api.ts` checks `response.success === false` — use this helper to distinguish success/error union responses. The axios interceptor re-throws error body directly (not wrapped), so catch clauses receive the `ErrorResponse` shape.

## TypeScript Strictness

`tsconfig.app.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, and `erasableSyntaxOnly`. Type-only imports must use `import type`.

## Frontend Environment

Copy `.env.example` → `.env` in `booking_system_frontend/`. Only one variable: `VITE_API_URL` (defaults to `http://localhost:8080`).

## Seeding

`seed()` runs on every FastAPI startup (inside lifespan). It **wipes all existing data** before inserting demo records. Tests monkeypatch `seed` to a no-op.
