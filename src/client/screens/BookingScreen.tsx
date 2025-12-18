import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check, Star } from 'lucide-react';
import { createBooking } from '../api/bookings';
import { useClient } from '../context/ClientContext';
import { supabase } from '../../lib/supabase';
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
  const [existingBookings, setExistingBookings] = useState<Array<{ start_at: string }>>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (hour24: number, minute: number): string => {
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Convert 12-hour format back to 24-hour for comparison
  const parseTime12Hour = (time12: string): { hour: number; minute: number } => {
    const [time, period] = time12.split(' ');
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return { hour, minute };
  };

  // Generate time slots from 9 AM to 6 PM in 12-hour format
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time12 = formatTime12Hour(hour, minute);
        slots.push({ time: time12, available: true });
      }
    }
    return slots;
  };

  // Fetch existing bookings for the selected date, service, and shop
  useEffect(() => {
    const fetchExistingBookings = async () => {
      if (!selectedDate) {
        setExistingBookings([]);
        return;
      }

      try {
        setLoadingBookings(true);
        // Get start and end of selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('bookings')
          .select('start_at, service_id, shop_id, status')
          .eq('service_id', service.id)
          .eq('shop_id', service.shop_id)
          .gte('start_at', startOfDay.toISOString())
          .lte('start_at', endOfDay.toISOString())
          .in('status', ['pending', 'confirmed']); // Only check active bookings

        if (error) {
          console.error('Error fetching existing bookings:', error);
          setExistingBookings([]);
        } else {
          setExistingBookings(data || []);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setExistingBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchExistingBookings();
  }, [selectedDate, service.id, service.shop_id]);

  // Check if a time slot is available
  const isTimeSlotAvailable = useMemo(() => {
    return (time12: string): boolean => {
      if (!selectedDate) return false;

      const now = new Date();
      const { hour, minute } = parseTime12Hour(time12);
      
      // Check if time is in the past
      const slotDateTime = new Date(selectedDate);
      slotDateTime.setHours(hour, minute, 0, 0);
      
      if (slotDateTime <= now) {
        return false; // Time is in the past
      }

      // Check if time conflicts with existing bookings
      // Check for exact time match (same service, same shop, same date and time)
      const isBooked = existingBookings.some(booking => {
        const bookingTime = new Date(booking.start_at);
        // Check if it's the exact same time (same hour and minute)
        return bookingTime.getHours() === hour && bookingTime.getMinutes() === minute;
      });

      return !isBooked;
    };
  }, [selectedDate, existingBookings, service.duration]);

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

    // Validate time is not in the past
    const { hour, minute } = parseTime12Hour(selectedTime);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hour, minute, 0, 0);
    
    const now = new Date();
    if (dateTime <= now) {
      setError('Cannot book appointments in the past. Please select a future time.');
      return;
    }

    // Double-check availability before booking
    if (!isTimeSlotAvailable(selectedTime)) {
      setError('This time slot is no longer available. Please select another time.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const booking = await createBooking({
        service_id: service.id,
        shop_id: service.shop_id,
        date_time: dateTime.toISOString(),
        notes: notes || undefined,
      });

      await refreshBookings();
      onBookingComplete(booking.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      // Check if it's a double booking error
      if (errorMessage.includes('already exists') || errorMessage.includes('time slot') || errorMessage.includes('conflict')) {
        setError('This time slot has already been booked. Please select another time.');
      } else {
        setError(errorMessage);
      }
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
                  {service.rating && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-gray-900">{service.rating.toFixed(1)}</span>
                      <span className="text-gray-600">rating</span>
                    </div>
                  )}
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Select Time</h3>
                  {loadingBookings && (
                    <span className="text-sm text-gray-500">Checking availability...</span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {timeSlots.map((slot) => {
                    const isAvailable = isTimeSlotAvailable(slot.time);
                    return (
                      <button
                        key={slot.time}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedTime(slot.time);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`py-3.5 px-4 rounded-xl text-sm font-medium transition-all ${
                          selectedTime === slot.time
                            ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                            : isAvailable
                            ? 'bg-pink-50 text-gray-900 hover:bg-pink-100 border border-pink-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                        title={!isAvailable ? 'This time slot is not available' : ''}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
                {existingBookings.length > 0 && (
                  <p className="mt-4 text-xs text-gray-500 text-center">
                    {existingBookings.length} appointment{existingBookings.length !== 1 ? 's' : ''} already booked for this date
                  </p>
                )}
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
                      at <span className="font-bold">{selectedTime}</span>
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

