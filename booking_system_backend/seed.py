from models import Base, User, Flight, Booking
from db import engine, SessionLocal
from datetime import datetime, timedelta
import random

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Clear existing data
    db.query(Booking).delete()
    db.query(User).delete()
    db.query(Flight).delete()
    db.commit()
    # Add demo users
    users = [
        User(name="Alice", email="alice@example.com"),
        User(name="Bob", email="bob@example.com"),
        User(name="Charlie", email="charlie@galaxium.com"),
        User(name="Diana", email="diana@moonmail.com"),
        User(name="Eve", email="eve@marsmail.com"),
        User(name="Frank", email="frank@venusmail.com"),
        User(name="Grace", email="grace@jupiter.com"),
        User(name="Heidi", email="heidi@europa.com"),
        User(name="Ivan", email="ivan@asteroidbelt.com"),
        User(name="Judy", email="judy@pluto.com"),
    ]
    db.add_all(users)
    db.commit()
    # Add demo flights
    def make_flight(origin, destination, departure_time, arrival_time, price, seats_available,
                    business_multiplier=2.0, galaxium_multiplier=4.0):
        economy = seats_available
        business = max(1, seats_available // 3)
        galaxium = max(1, seats_available // 5)
        return Flight(
            origin=origin, destination=destination,
            departure_time=departure_time, arrival_time=arrival_time,
            price=price, seats_available=seats_available,
            economy_seats=economy, business_seats=business, galaxium_seats=galaxium,
            business_multiplier=business_multiplier, galaxium_multiplier=galaxium_multiplier,
        )

    flights = [
        make_flight("Earth",   "Mars",    "2099-01-01T09:00:00Z", "2099-01-01T17:00:00Z", 1000000, 5),
        make_flight("Earth",   "Moon",    "2099-01-02T10:00:00Z", "2099-01-02T14:00:00Z",  500000, 3),
        make_flight("Mars",    "Earth",   "2099-01-03T12:00:00Z", "2099-01-03T20:00:00Z",  950000, 7),
        make_flight("Venus",   "Earth",   "2099-01-04T08:00:00Z", "2099-01-04T18:00:00Z", 1200000, 2),
        make_flight("Jupiter", "Europa",  "2099-01-05T15:00:00Z", "2099-01-05T19:00:00Z", 2000000, 1),
        make_flight("Earth",   "Venus",   "2099-01-06T07:00:00Z", "2099-01-06T15:00:00Z", 1100000, 4),
        make_flight("Moon",    "Mars",    "2099-01-07T11:00:00Z", "2099-01-07T19:00:00Z",  800000, 6),
        make_flight("Mars",    "Jupiter", "2099-01-08T13:00:00Z", "2099-01-08T23:00:00Z", 2500000, 2),
        make_flight("Europa",  "Earth",   "2099-01-09T09:00:00Z", "2099-01-09T21:00:00Z", 3000000, 3),
        make_flight("Earth",   "Pluto",   "2099-01-10T06:00:00Z", "2099-01-11T06:00:00Z", 5000000, 1),
    ]
    db.add_all(flights)
    db.commit()
    # Add demo bookings
    user_ids = [user.user_id for user in db.query(User).all()]
    flight_ids = [flight.flight_id for flight in db.query(Flight).all()]
    statuses = ["booked", "cancelled", "completed"]
    bookings = []
    now = datetime.utcnow()
    for i in range(20):
        user_id = random.choice(user_ids)
        flight_id = random.choice(flight_ids)
        status = random.choice(statuses)
        booking_time = (now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))).isoformat() + "Z"
        bookings.append(Booking(user_id=user_id, flight_id=flight_id, status=status, booking_time=booking_time))
    db.add_all(bookings)
    db.commit()
    db.close()
    print("Database seeded with elaborate demo data!")

if __name__ == "__main__":
    seed() 