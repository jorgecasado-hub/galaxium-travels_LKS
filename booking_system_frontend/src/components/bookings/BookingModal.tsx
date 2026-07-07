import { useState } from 'react';
import type { Flight, SeatClass } from '../../types';
import { Modal, Button } from '../common';
import { Plane, Calendar, Clock, DollarSign, Users } from 'lucide-react';
import { formatCurrency, formatDate, calculateDuration } from '../../utils/formatters';
import { bookFlight, isErrorResponse } from '../../services/api';
import { useUser } from '../../hooks/useUser';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  onSuccess: () => void;
}

interface SeatClassOption {
  id: SeatClass;
  label: string;
  description: string;
  colorClass: string;
  selectedClass: string;
  disabledClass: string;
  seats: number;
  price: number;
}

export const BookingModal = ({ isOpen, onClose, flight, onSuccess }: BookingModalProps) => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SeatClass>('economy');

  if (!flight) return null;

  const seatOptions: SeatClassOption[] = [
    {
      id: 'economy',
      label: 'Economy',
      description: 'Standard interplanetary travel',
      colorClass: 'border-blue-400/50 text-blue-300',
      selectedClass: 'border-blue-400 bg-blue-500/20 ring-1 ring-blue-400',
      disabledClass: 'opacity-40 cursor-not-allowed',
      seats: flight.economy_seats ?? flight.seats_available,
      price: flight.price,
    },
    {
      id: 'business',
      label: 'Business',
      description: 'Premium comfort & priority boarding',
      colorClass: 'border-amber-400/50 text-amber-300',
      selectedClass: 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400',
      disabledClass: 'opacity-40 cursor-not-allowed',
      seats: flight.business_seats ?? 0,
      price: Math.round(flight.price * (flight.business_multiplier ?? 2)),
    },
    {
      id: 'galaxium',
      label: 'Galaxium',
      description: 'Ultimate luxury across the cosmos',
      colorClass: 'border-purple-400/50 text-purple-300',
      selectedClass: 'border-purple-400 bg-purple-500/20 ring-1 ring-purple-400',
      disabledClass: 'opacity-40 cursor-not-allowed',
      seats: flight.galaxium_seats ?? 0,
      price: Math.round(flight.price * (flight.galaxium_multiplier ?? 4)),
    },
  ];

  const activeOption = seatOptions.find((o) => o.id === selectedClass)!;

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book a flight');
      return;
    }

    setIsLoading(true);

    try {
      const result = await bookFlight({
        user_id: user.user_id,
        name: user.name,
        flight_id: flight.flight_id,
        seat_class: selectedClass,
      });

      if (isErrorResponse(result)) {
        toast.error(result.details || result.error);
        return;
      }

      toast.success(`${activeOption.label} class seat booked successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.details || error.error || 'Failed to book flight');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Your Booking"
      size="md"
    >
      <div className="space-y-6">
        {/* Flight Summary */}
        <div className="glass-card p-4 bg-white/5">
          <div className="flex items-center gap-3 mb-4">
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

          <div className="space-y-3">
            {/* Departure */}
            <div className="flex items-start gap-3">
              <Calendar className="text-cosmic-purple mt-1" size={20} />
              <div>
                <p className="text-xs text-star-white/60">Departure</p>
                <p className="text-star-white font-medium">
                  {formatDate(flight.departure_time)}
                </p>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex items-start gap-3">
              <Calendar className="text-cosmic-purple mt-1" size={20} />
              <div>
                <p className="text-xs text-star-white/60">Arrival</p>
                <p className="text-star-white font-medium">
                  {formatDate(flight.arrival_time)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <Clock className="text-cosmic-purple mt-1" size={20} />
              <div>
                <p className="text-xs text-star-white/60">Duration</p>
                <p className="text-star-white font-medium">
                  {calculateDuration(flight.departure_time, flight.arrival_time)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Class Selector */}
        <div>
          <h4 className="text-sm font-semibold text-star-white mb-3">Select Class</h4>
          <div className="grid grid-cols-3 gap-3">
            {seatOptions.map((option) => {
              const isDisabled = option.seats === 0;
              const isSelected = selectedClass === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setSelectedClass(option.id)}
                  className={[
                    'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-center',
                    isDisabled
                      ? `border-white/10 bg-white/5 ${option.disabledClass}`
                      : isSelected
                      ? option.selectedClass
                      : `border-white/10 bg-white/5 hover:bg-white/10 ${option.colorClass}`,
                  ].join(' ')}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {option.label}
                  </span>
                  <span className="text-sm font-semibold text-star-white">
                    {formatCurrency(option.price)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-star-white/60">
                    <Users size={11} />
                    <span>{isDisabled ? 'Sold out' : `${option.seats} left`}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-star-white/50 mt-2">{activeOption.description}</p>
        </div>

        {/* Passenger Info */}
        {user && (
          <div className="glass-card p-4 bg-white/5">
            <h4 className="text-sm font-semibold text-star-white mb-2">
              Passenger Information
            </h4>
            <p className="text-star-white">{user.name}</p>
            <p className="text-star-white/60 text-sm">{user.email}</p>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between p-4 glass-card bg-cosmic-gradient">
          <div className="flex items-center gap-2">
            <DollarSign className="text-white" size={24} />
            <span className="text-white font-semibold">Total Price</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(activeOption.price)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            isLoading={isLoading}
            className="flex-1"
          >
            Confirm Booking
          </Button>
        </div>

        <p className="text-xs text-star-white/60 text-center">
          By confirming, you agree to our terms and conditions
        </p>
      </div>
    </Modal>
  );
};

// Made with Bob
