import { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, Loader, UserPlus } from 'lucide-react';
import { getServices } from '../../client/api/services';
import { getAllClients } from '../../api/admin';
import { createBookingForClient } from '../../api/clientBookings';
import { supabase } from '../../lib/supabase';
import type { Service } from '../../client/types';
import type { Client } from '../../api/admin';
import { AddClientModal } from './AddClientModal';

interface WalkInBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: () => void;
}

type Step = 'client' | 'service' | 'datetime' | 'payment' | 'complete';

export function WalkInBookingModal({ isOpen, onClose, onBookingComplete }: WalkInBookingModalProps) {
  const [step, setStep] = useState<Step>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Reset form when modal closes
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('client');
    setSelectedClient(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setClientSearch('');
    setIsNewClient(false);
    setPaymentMethod('cash');
    setError(null);
    setBookingId(null);
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

  const handleNewClient = () => {
    setIsNewClient(true);
    setStep('service');
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleDateTimeSelect = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }
    setStep('payment');
  };


  const handlePaymentContinue = async (clientId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create booking
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(selectedDate!);
      dateTime.setHours(hours, minutes, 0, 0);

      const booking = await createBookingForClient({
        client_id: clientId,
        service_id: selectedService!.id,
        shop_id: selectedService!.shop_id,
        start_at: dateTime.toISOString(),
        notes: `Walk-in customer. Payment: ${paymentMethod}`,
      });

      setBookingId(String(booking.id));
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (isNewClient) {
      if (!customerName || !customerPhone) {
        setError('Please fill in customer name and phone');
        return;
      }
      // Show add client modal first
      setShowAddClientModal(true);
      return;
    }

    if (!selectedClient) {
      setError('Please select a client');
      return;
    }

    await handlePaymentContinue(selectedClient.id);
  };

  const handleMarkComplete = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      onBookingComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as complete');
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
              <h2 className="text-xl sm:text-2xl font-bold">Walk-In Booking</h2>
              <p className="text-xs sm:text-sm text-white/90">
                {step === 'client' && 'Select or Add Client'}
                {step === 'service' && 'Select Service'}
                {step === 'datetime' && 'Select Date & Time'}
                {step === 'payment' && 'Payment Information'}
                {step === 'complete' && 'Booking Complete'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Select Client or Add New</h3>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search clients by name, email, or phone..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{client.full_name || client.email || 'Unknown'}</h4>
                        <p className="text-sm text-gray-600">{client.email}</p>
                        {client.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleNewClient}
                className="w-full p-4 border-2 border-dashed border-pink-300 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all text-left flex items-center space-x-3"
              >
                <UserPlus className="w-5 h-5 text-pink-600" />
                <span className="font-medium text-pink-600">Add New Walk-In Client</span>
              </button>
            </div>
          )}

          {step === 'service' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Service</h3>
              <div className="grid grid-cols-1 gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{service.shop_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-pink-600">
                          ₱{service.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{service.duration} min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'datetime' && selectedService && (
            <div className="space-y-6">
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Client: {selectedClient?.full_name || customerName || 'New Client'}</p>
                <h4 className="font-semibold text-gray-900">{selectedService.name}</h4>
                <p className="text-sm text-gray-600">₱{selectedService.price.toLocaleString()}</p>
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
                        <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
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

          {step === 'payment' && selectedService && (
            <div className="space-y-6">
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Client: {selectedClient?.full_name || customerName || 'New Client'}</p>
                <h4 className="font-semibold text-gray-900">{selectedService.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {selectedTime}
                </p>
                <p className="text-lg font-bold text-pink-600 mt-2">
                  ₱{selectedService.price.toLocaleString()}
                </p>
              </div>

              {isNewClient && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Cash</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'card'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Card</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-6">
                The booking has been created successfully. You can mark it as complete once the service is done.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleMarkComplete}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Mark Service as Complete</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onBookingComplete();
                    onClose();
                  }}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
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
                  if (step === 'payment') setStep('datetime');
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
                onClick={handleDateTimeSelect}
                disabled={!selectedDate || !selectedTime}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            )}
            {step === 'payment' && (
              <button
                onClick={handlePayment}
                disabled={loading || (isNewClient && (!customerName || !customerPhone))}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Complete Booking</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <AddClientModal
          isOpen={showAddClientModal}
          onClose={() => {
            setShowAddClientModal(false);
            if (!selectedClient) {
              setStep('client');
            }
          }}
          onClientAdded={async () => {
            // Reload clients
            const newClients = await getAllClients();
            setClients(newClients);
            // Find the newly added client by email or phone
            const newClient = newClients.find(
              c => c.email === customerEmail || c.phone === customerPhone
            );
            if (newClient) {
              setSelectedClient(newClient);
              setIsNewClient(false);
              setShowAddClientModal(false);
              await handlePaymentContinue(newClient.id);
            } else {
              // If we can't find the client, reload and try again
              await loadData();
            }
          }}
        />
      )}
    </div>
  );
}

