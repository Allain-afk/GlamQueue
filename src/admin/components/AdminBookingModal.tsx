import { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Search, Loader } from 'lucide-react';
import { getServices } from '../../client/api/services';
import { getAllClients, type Client } from '../../api/admin';
import { supabase } from '../../lib/supabase';
import type { Service } from '../../client/types';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: () => void;
}

type Step = 'client' | 'service' | 'datetime' | 'complete';

export function AdminBookingModal({ isOpen, onClose, onBookingComplete }: AdminBookingModalProps) {
  const [step, setStep] = useState<Step>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('client');
    setSelectedClient(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime('');
    setClientSearch('');
    setError(null);
  };

  const loadData = async () => {
    try {
      const [clientsData, servicesData] = await Promise.all([
        getAllClients(),
        getServices(),
      ]);
      setClients(clientsData);
      setServices(servicesData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setStep('service');
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedClient || !selectedService) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: selectedClient.id,
          service_id: selectedService.id,
          shop_id: selectedService.shop_id,
          start_at: dateTime.toISOString(),
          status: 'confirmed',
        });

      if (bookingError) throw bookingError;

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const timeSlots = generateTimeSlots();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">New Booking</h2>
              <p className="text-xs sm:text-sm text-white/90">
                {step === 'client' && 'Select Client'}
                {step === 'service' && 'Select Service'}
                {step === 'datetime' && 'Select Date & Time'}
                {step === 'complete' && 'Booking Created'}
              </p>
            </div>
            {step !== 'complete' && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'client' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search clients by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No clients found
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{client.full_name || 'Unknown'}</h4>
                          <p className="text-sm text-gray-600">{client.email}</p>
                          {client.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          client.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                          client.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                          client.tier === 'Silver' ? 'bg-gray-100 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {client.tier}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 'service' && selectedClient && (
            <div className="space-y-4">
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Selected Client</p>
                <h4 className="font-semibold text-gray-900">{selectedClient.full_name || 'Unknown'}</h4>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select Service</h3>
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{service.shop_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-pink-600">₱{service.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{service.duration} min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'datetime' && selectedService && selectedClient && (
            <div className="space-y-6">
              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900">{selectedService.name}</h4>
                <p className="text-sm text-gray-600">Client: {selectedClient.full_name}</p>
                <p className="text-lg font-bold text-pink-600 mt-2">
                  ₱{selectedService.price.toLocaleString()}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {Array.from({ length: 14 }, (_, i) => {
                    const date = new Date(today);
                    date.setDate(date.getDate() + i);
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isToday = i === 0;

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <p className="text-xs text-gray-500">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className={`font-semibold ${isSelected ? 'text-pink-600' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </p>
                        {isToday && <p className="text-xs text-pink-500">Today</p>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time</h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedTime === time
                          ? 'border-pink-500 bg-pink-50 text-pink-600'
                          : 'border-gray-200 hover:border-pink-300 text-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Created!</h3>
              <p className="text-gray-600 mb-6">
                The booking has been successfully created for {selectedClient?.full_name}.
              </p>
              <button
                onClick={() => {
                  onBookingComplete();
                  onClose();
                }}
                className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'complete' && (
          <div className="border-t border-gray-200 p-4 flex justify-between">
            {step !== 'client' && (
              <button
                onClick={() => {
                  if (step === 'service') setStep('client');
                  if (step === 'datetime') setStep('service');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <div className="flex-1"></div>
            {step === 'client' && (
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            {step === 'service' && (
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            {step === 'datetime' && (
              <button
                onClick={handleBooking}
                disabled={loading || !selectedDate || !selectedTime}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    <span>Create Booking</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

