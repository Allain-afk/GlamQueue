import { useState } from 'react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { createBooking } from '../api/bookings';
import { useClient } from '../context/ClientContext';
import type { Service, TimeSlot } from '../types';

interface BookingScreenProps {
  service: Service;
  onBack: () => void;
  onBookingComplete: (bookingId: string) => void;
}

export function BookingScreen({ service, onBack, onBookingComplete }: BookingScreenProps) {
  const { refreshBookings } = useClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate time slots from 9 AM to 6 PM
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({ time, available: true });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);

      const booking = await createBooking({
        service_id: service.id,
        shop_id: service.shop_id,
        date_time: dateTime.toISOString(),
        notes: notes || undefined,
      });

      await refreshBookings();
      onBookingComplete(booking.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 sticky top-0 z-50 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-pink-50 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Service Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden sticky top-24">
              <div className="h-48 bg-gradient-to-br from-pink-400 to-purple-500 relative overflow-hidden">
                {service.image_url ? (
                  <img 
                    src={service.image_url} 
                    alt={service.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="w-20 h-20 text-white opacity-50" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h2>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-pink-500" />
                    <div>
                      <p className="font-medium text-gray-900">{service.shop_name}</p>
                      <p className="text-gray-600">{service.shop_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-5 h-5 text-pink-500" />
                    <span className="text-gray-900">{service.duration} minutes</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="text-2xl font-bold text-pink-600">₱{service.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Select Date</h3>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-pink-50 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-pink-50 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = date < today;
                    const isSelected =
                      selectedDate?.getDate() === day &&
                      selectedDate?.getMonth() === currentMonth.getMonth() &&
                      selectedDate?.getFullYear() === currentMonth.getFullYear();

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateSelect(day)}
                        disabled={isPast}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                            : isPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-pink-50 text-gray-900'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Select Time</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        selectedTime === slot.time
                          ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                          : slot.available
                          ? 'bg-pink-50 text-gray-900 hover:bg-pink-100'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedTime && (
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or preferences..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Confirm Button */}
            {selectedDate && selectedTime && (
              <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Selected Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      at {selectedTime}
                    </p>
                  </div>
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Confirming...
                    </div>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

