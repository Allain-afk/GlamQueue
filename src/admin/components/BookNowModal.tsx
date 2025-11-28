import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { createBookingForClient } from '../../api/clientBookings';
import { supabase } from '../../lib/supabase';
import type { Client } from '../../api/admin';

interface BookNowModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: () => void;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Shop {
  id: string;
  name: string;
  address: string;
}

export function BookNowModal({ client, isOpen, onClose, onBookingCreated }: BookNowModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadServicesAndShops();
      // Set default date to today
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const loadServicesAndShops = async () => {
    try {
      const [servicesResult, shopsResult] = await Promise.all([
        supabase.from('services').select('id, name, price, duration').eq('is_active', true),
        supabase.from('shops').select('id, name, address'),
      ]);

      if (servicesResult.data) {
        setServices(servicesResult.data.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price || 500,
          duration: s.duration || 60,
        })));
      }

      if (shopsResult.data) {
        setShops(shopsResult.data.map(s => ({
          id: s.id,
          name: s.name,
          address: s.address || '',
        })));
      }

      // Set defaults
      if (servicesResult.data && servicesResult.data.length > 0) {
        setSelectedService(servicesResult.data[0] as any);
      }
      if (shopsResult.data && shopsResult.data.length > 0) {
        setSelectedShop(shopsResult.data[0] as any);
      }
    } catch (error) {
      console.error('Error loading services and shops:', error);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedShop || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);

      await createBookingForClient({
        client_id: client.id,
        service_id: selectedService.id,
        shop_id: selectedShop.id,
        start_at: dateTime.toISOString(),
        notes: notes || `Walk-in booking for ${client.full_name || client.email}`,
      });

      onBookingCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
            <p className="text-sm text-gray-600 mt-1">Walk-in booking for {client.full_name || client.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
              <select
                value={selectedService?.id || ''}
                onChange={(e) => {
                  const service = services.find(s => s.id === e.target.value);
                  setSelectedService(service || null);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ₱{service.price} ({service.duration} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Shop Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <select
                value={selectedShop?.id || ''}
                onChange={(e) => {
                  const shop = shops.find(s => s.id === e.target.value);
                  setSelectedShop(shop || null);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select a location</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} - {shop.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select a time</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>
                      {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any special notes or requests..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBooking}
            disabled={loading || !selectedService || !selectedShop || !selectedDate || !selectedTime}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}

