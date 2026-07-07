import type { Flight } from '../../types';
import { Card, Button } from '../common';
import { Plane, Clock, Users } from 'lucide-react';
import { formatCurrency, formatDate, formatTime, calculateDuration } from '../../utils/formatters';
import { motion } from 'framer-motion';

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight) => void;
}

const CLASS_STYLES = [
  {
    label: 'Economy',
    seatsKey: 'economy_seats' as const,
    multiplierKey: null as null,
    textColor: 'text-blue-300',
    dotColor: 'bg-blue-400',
  },
  {
    label: 'Business',
    seatsKey: 'business_seats' as const,
    multiplierKey: 'business_multiplier' as const,
    textColor: 'text-amber-300',
    dotColor: 'bg-amber-400',
  },
  {
    label: 'Galaxium',
    seatsKey: 'galaxium_seats' as const,
    multiplierKey: 'galaxium_multiplier' as const,
    textColor: 'text-purple-300',
    dotColor: 'bg-purple-400',
  },
] as const;

export const FlightCard = ({ flight, onBook }: FlightCardProps) => {
  const economySeats = flight.economy_seats ?? flight.seats_available;
  const businessSeats = flight.business_seats ?? 0;
  const galaxiumSeats = flight.galaxium_seats ?? 0;
  const totalSeats = economySeats + businessSeats + galaxiumSeats;
  const isSoldOut = totalSeats === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col">
        {/* Route Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cosmic-gradient">
              <Plane className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-star-white">
                {flight.origin} → {flight.destination}
              </h3>
              <p className="text-sm text-star-white/60">
                Flight #{flight.flight_id}
              </p>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="space-y-3 mb-6 flex-1">
          {/* Departure & Arrival */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-star-white/60 mb-1">Departure</p>
              <p className="text-sm font-medium text-star-white">
                {formatDate(flight.departure_time, 'MMM dd, yyyy')}
              </p>
              <p className="text-lg font-bold text-cosmic-purple">
                {formatTime(flight.departure_time)}
              </p>
            </div>
            <div>
              <p className="text-xs text-star-white/60 mb-1">Arrival</p>
              <p className="text-sm font-medium text-star-white">
                {formatDate(flight.arrival_time, 'MMM dd, yyyy')}
              </p>
              <p className="text-lg font-bold text-cosmic-purple">
                {formatTime(flight.arrival_time)}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-star-white/70">
            <Clock size={16} />
            <span className="text-sm">
              Duration: {calculateDuration(flight.departure_time, flight.arrival_time)}
            </span>
          </div>

          {/* Seat Classes */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-star-white/50 mb-1">
              <Users size={13} />
              <span>Seat availability by class</span>
            </div>
            {CLASS_STYLES.map(({ label, seatsKey, multiplierKey, textColor, dotColor }) => {
              const seats = seatsKey === 'economy_seats' ? economySeats : flight[seatsKey] ?? 0;
              const price = multiplierKey
                ? Math.round(flight.price * (flight[multiplierKey] ?? (multiplierKey === 'business_multiplier' ? 2 : 4)))
                : flight.price;
              const isClassSoldOut = seats === 0;
              return (
                <div
                  key={label}
                  className={`flex items-center justify-between text-xs ${isClassSoldOut ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className={`font-medium ${textColor}`}>{label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-star-white/70">
                    <span className="font-semibold text-star-white/90">
                      {formatCurrency(price)}
                    </span>
                    <span>·</span>
                    <span>{isClassSoldOut ? 'Sold out' : `${seats} left`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Book Button */}
        <Button
          onClick={() => onBook(flight)}
          disabled={isSoldOut}
          className="w-full"
        >
          {isSoldOut ? 'Sold Out' : 'Book Now'}
        </Button>
      </Card>
    </motion.div>
  );
};

// Made with Bob
