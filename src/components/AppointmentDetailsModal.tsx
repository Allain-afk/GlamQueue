import { useEffect, useMemo, useState } from 'react';
import { X, Calendar, Clock, Mail, StickyNote, Check, Ban } from 'lucide-react';
import type { AppointmentWithDetails } from '../api/admin';
import { getBookingPaymentDetails, type BookingPaymentDetails } from '../api/bookings';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  appointment: AppointmentWithDetails | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: AppointmentWithDetails['status']) => Promise<void>;
}

export function AppointmentDetailsModal({
  isOpen,
  appointment,
  onClose,
  onUpdateStatus,
}: AppointmentDetailsModalProps) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<BookingPaymentDetails | null>(null);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);

  const statusColor = useMemo(() => {
    switch (appointment?.status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, [appointment?.status]);

  const formattedDate = useMemo(() => {
    if (!appointment?.start_at) return '';
    return new Date(appointment.start_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [appointment?.start_at]);

  const formattedTime = useMemo(() => {
    if (!appointment?.start_at) return '';
    return new Date(appointment.start_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [appointment?.start_at]);

  const formattedPrice = useMemo(() => {
    const amount = appointment?.service_price || 0;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  }, [appointment?.service_price]);

  // Move useEffect BEFORE the early return to follow Rules of Hooks
  useEffect(() => {
    // Only load payment details if modal is open and appointment exists
    if (!isOpen || !appointment) {
      setPaymentDetails(null);
      setLoadingPaymentDetails(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadingPaymentDetails(true);
      try {
        const details = await getBookingPaymentDetails(appointment.id);
        if (!cancelled) setPaymentDetails(details);
      } catch (e) {
        // Don't block the modal if payment details aren't available.
        console.error('Failed to load booking payment details:', e);
        if (!cancelled) setPaymentDetails(null);
      } finally {
        if (!cancelled) setLoadingPaymentDetails(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, appointment?.id]);

  if (!isOpen || !appointment) return null;

  const handleUpdate = async (status: AppointmentWithDetails['status']) => {
    setUpdating(true);
    setError(null);
    try {
      await onUpdateStatus(appointment.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
      return;
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-4 sm:px-6 py-4 text-white flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold">Appointment #{appointment.id}</h2>
              <div className="mt-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold border bg-white/10 border-white/20">
                {appointment.status}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Client</p>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{appointment.client_name || 'Unknown'}</span>
              </div>
              {appointment.client_email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{appointment.client_email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Service</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-700">{appointment.service_name || 'Service'}</p>
                <p className="text-xs text-gray-500">Service ID: {appointment.service_id}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formattedPrice}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Schedule</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>

          {appointment.notes && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Notes</p>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <StickyNote className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="leading-relaxed">{appointment.notes}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Payment (Mock)</p>
            {loadingPaymentDetails ? (
              <p className="text-sm text-gray-600">Loading…</p>
            ) : paymentDetails ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-medium">Method:</span>{' '}
                  {paymentDetails.payment_method === 'cash'
                    ? 'Cash'
                    : paymentDetails.payment_method === 'online'
                      ? 'DigiBank/Online'
                      : 'Visa'}
                </p>
                {paymentDetails.payment_method === 'online' && (
                  <>
                    {paymentDetails.details?.provider ? (
                      <p>
                        <span className="font-medium">Provider:</span> {String(paymentDetails.details.provider)}
                      </p>
                    ) : null}
                    {paymentDetails.details?.accountName ? (
                      <p>
                        <span className="font-medium">Account Name:</span> {String(paymentDetails.details.accountName)}
                      </p>
                    ) : null}
                    {paymentDetails.details?.accountIdentifier ? (
                      <p>
                        <span className="font-medium">Identifier:</span> {String(paymentDetails.details.accountIdentifier)}
                      </p>
                    ) : null}
                    {paymentDetails.details?.reference ? (
                      <p>
                        <span className="font-medium">Reference:</span> {String(paymentDetails.details.reference)}
                      </p>
                    ) : null}
                  </>
                )}
                {paymentDetails.payment_method === 'visa' && (
                  <>
                    {paymentDetails.details?.cardholderName ? (
                      <p>
                        <span className="font-medium">Cardholder:</span> {String(paymentDetails.details.cardholderName)}
                      </p>
                    ) : null}
                    {paymentDetails.details?.cardLast4 ? (
                      <p>
                        <span className="font-medium">Last 4:</span> {String(paymentDetails.details.cardLast4)}
                      </p>
                    ) : null}
                    {paymentDetails.details?.cardExpiry ? (
                      <p>
                        <span className="font-medium">Expiry:</span> {String(paymentDetails.details.cardExpiry)}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No payment details recorded.</p>
            )}
          </div>

          <div className="pt-2">
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
              Status: {appointment.status}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          {appointment.status === 'pending' && (
            <>
              <button
                disabled={updating}
                onClick={() => handleUpdate('cancelled')}
                className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Cancel
              </button>
              <button
                disabled={updating}
                onClick={() => handleUpdate('confirmed')}
                className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm
              </button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <button
              disabled={updating}
              onClick={() => handleUpdate('completed')}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Mark Complete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
