"""
Migración incremental para añadir clases de asiento.
Ejecutar una sola vez: python migrate.py
Es idempotente: si las columnas ya existen, no falla.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "booking.db")


def add_column_if_missing(cursor, table: str, column: str, col_type: str, default):
    cursor.execute(f"PRAGMA table_info({table})")
    existing = {row[1] for row in cursor.fetchall()}
    if column not in existing:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type} NOT NULL DEFAULT {default}")
        print(f"  + {table}.{column} añadida")
    else:
        print(f"  ~ {table}.{column} ya existe, omitida")


def migrate():
    print(f"Conectando a {DB_PATH} ...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("Migrando tabla 'flights' ...")
    add_column_if_missing(cur, "flights", "economy_seats",      "INTEGER", 0)
    add_column_if_missing(cur, "flights", "business_seats",     "INTEGER", 0)
    add_column_if_missing(cur, "flights", "galaxium_seats",     "INTEGER", 0)
    add_column_if_missing(cur, "flights", "business_multiplier","REAL",    2.0)
    add_column_if_missing(cur, "flights", "galaxium_multiplier","REAL",    4.0)

    print("Migrando tabla 'bookings' ...")
    add_column_if_missing(cur, "bookings", "seat_class", "TEXT", "'economy'")

    # Rellenar economy_seats con el valor actual de seats_available para vuelos existentes
    print("Sincronizando economy_seats con seats_available para vuelos existentes ...")
    cur.execute("""
        UPDATE flights
        SET
            economy_seats      = seats_available,
            business_seats     = MAX(1, seats_available / 3),
            galaxium_seats     = MAX(1, seats_available / 5)
        WHERE economy_seats = 0 AND seats_available > 0
    """)
    updated = cur.rowcount
    print(f"  {updated} vuelo(s) actualizados con inventario inicial por clase")

    conn.commit()
    conn.close()
    print("Migración completada.")


if __name__ == "__main__":
    migrate()
