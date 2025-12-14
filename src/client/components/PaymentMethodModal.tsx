import { useMemo, useState } from 'react';
import { Banknote, CreditCard, Smartphone, ChevronLeft } from 'lucide-react';
import { useClient } from '../context/ClientContext';
import {
  setBookingPaymentMethod,
  upsertMockPaymentDetails,
  type ClientPaymentMethod,
  type MockPaymentDetails,
} from '../api/bookings';
import { glamError } from '../../lib/glamAlerts';

interface PaymentMethodModalProps {
  bookingId: string;
  onDone: () => void;
}

export function PaymentMethodModal({ bookingId, onDone }: PaymentMethodModalProps) {
  const { refreshBookings } = useClient();
  const [selected, setSelected] = useState<ClientPaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'method' | 'details'>('method');
  const [onlineProvider, setOnlineProvider] = useState<'gcash' | 'maya' | 'paypal'>('gcash');
  const [form, setForm] = useState<MockPaymentDetails>({});

  const options = useMemo(
    () =>
      [
        {
          value: 'cash' as const,
          title: 'Cash',
          description: 'Pay after the completion of the appointment',
          Icon: Banknote,
        },
        {
          value: 'online' as const,
          title: 'DigiBank/Online',
          description: 'Gcash / Maya / PayPal',
          Icon: Smartphone,
        },
        {
          value: 'visa' as const,
          title: 'Visa',
          description: 'Debit cards (and similar)',
          Icon: CreditCard,
        },
      ],
    []
  );

  const handleContinueFromMethod = async () => {
    if (!selected || saving) return;

    if (selected === 'cash') {
      try {
        setSaving(true);
        await setBookingPaymentMethod(bookingId, selected);
        await refreshBookings();
        onDone();
      } catch (error) {
        console.error('Error saving payment method:', error);
        glamError(error instanceof Error ? error.message : 'Failed to save payment method');
      } finally {
        setSaving(false);
      }
      return;
    }

    setStep('details');
  };

  const handleSaveDetails = async () => {
    if (!selected || selected === 'cash' || saving) return;

    try {
      setSaving(true);

      const details: MockPaymentDetails =
        selected === 'online'
          ? {
              provider: onlineProvider,
              accountName: form.accountName?.trim() || undefined,
              accountIdentifier: form.accountIdentifier?.trim() || undefined,
              reference: form.reference?.trim() || undefined,
            }
          : {
              cardholderName: form.cardholderName?.trim() || undefined,
              cardLast4: form.cardLast4?.trim() || undefined,
              cardExpiry: form.cardExpiry?.trim() || undefined,
            };

      await setBookingPaymentMethod(bookingId, selected);
      await upsertMockPaymentDetails(bookingId, selected, details);
      await refreshBookings();
      onDone();
    } catch (error) {
      console.error('Error saving mock payment details:', error);
      glamError(error instanceof Error ? error.message : 'Failed to save payment details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'method' ? 'Choose payment method' : 'Enter mock payment details'}
            </h2>
            <p className="text-sm text-gray-600">
              {step === 'method'
                ? 'Select how you’ll pay for this appointment.'
                : 'This is a placeholder only (not used for real payments).'}
            </p>
          </div>
        </div>

        {step === 'method' ? (
          <>
            <div className="space-y-3">
              {options.map(({ value, title, description, Icon }) => {
                const isSelected = selected === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSelected(value);
                      setForm({});
                      setOnlineProvider('gcash');
                    }}
                    disabled={saving}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-pink-300 bg-pink-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-white' : 'bg-pink-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{title}</p>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-pink-500' : 'border-gray-300'
                          }`}
                        >
                          {isSelected ? <div className="w-2 h-2 rounded-full bg-pink-500" /> : null}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleContinueFromMethod}
              disabled={!selected || saving}
              className="mt-5 w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep('method')}
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="mt-3 space-y-4">
              {selected === 'online' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Provider</label>
                    <select
                      value={onlineProvider}
                      onChange={(e) => setOnlineProvider(e.target.value as 'gcash' | 'maya' | 'paypal')}
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="gcash">Gcash</option>
                      <option value="maya">Maya</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Account Name</label>
                    <input
                      value={form.accountName ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))}
                      disabled={saving}
                      placeholder="e.g., Juan Dela Cruz"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Account Identifier</label>
                    <input
                      value={form.accountIdentifier ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, accountIdentifier: e.target.value }))}
                      disabled={saving}
                      placeholder="e.g., phone number / email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Reference / Note</label>
                    <input
                      value={form.reference ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
                      disabled={saving}
                      placeholder="e.g., mock ref #1234"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">Cardholder Name</label>
                    <input
                      value={form.cardholderName ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, cardholderName: e.target.value }))}
                      disabled={saving}
                      placeholder="e.g., Juan Dela Cruz"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Last 4 Digits</label>
                      <input
                        value={form.cardLast4 ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        disabled={saving}
                        inputMode="numeric"
                        placeholder="1234"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Expiry (MM/YY)</label>
                      <input
                        value={form.cardExpiry ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, cardExpiry: e.target.value.slice(0, 5) }))}
                        disabled={saving}
                        placeholder="12/30"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Please don’t enter real card numbers. This is mock-only.
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={saving}
              className="mt-5 w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save & Continue'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
