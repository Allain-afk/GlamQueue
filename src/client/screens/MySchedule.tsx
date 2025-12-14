import { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useClient } from '../context/ClientContext';
import { cancelBooking } from '../api/bookings';
import { glamConfirm, glamError, glamSuccess } from '../../lib/glamAlerts';
// import type { Booking } from '../types'; // Unused for now

interface MyScheduleProps {
  onBack: () => void;
}

export function MySchedule({ onBack }: MyScheduleProps) {
  const { bookings, upcomingBookings, loading, refreshBookings } = useClient();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'history'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    const ok = await glamConfirm({
      title: 'Cancel this booking?',
      text: 'This action cannot be undone.',
      confirmText: 'Yes, cancel',
    });
    if (!ok) return;

    try {
      setCancellingId(bookingId);
      await cancelBooking(bookingId);
      await refreshBookings();
      glamSuccess('Booking cancelled');
    } catch (error) {
      glamError('Failed to cancel booking');
      console.error(error);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const displayBookings = selectedTab === 'upcoming' ? upcomingBookings : bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

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
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setSelectedTab('upcoming')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedTab === 'upcoming'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedTab === 'history'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {selectedTab === 'upcoming'
                ? "You don't have any upcoming appointments"
                : "You don't have any booking history"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {booking.service?.name || 'Service'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {booking.service?.description || ''}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="capitalize">{booking.status}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-pink-600">₱{booking.service?.price || 0}</p>
                      <p className="text-sm text-gray-500">{booking.service?.duration || 0} min</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-pink-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date & Time</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.date_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.date_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-pink-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{booking.shop?.name || 'Shop'}</p>
                        <p className="text-sm text-gray-600">{booking.shop?.address || ''}</p>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}

                  {booking.status === 'pending' || booking.status === 'confirmed' ? (
                    <div className="flex gap-3">
                      <button className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all">
                        View Details
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-6 py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === booking.id ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            Cancelling...
                          </div>
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    </div>
                  ) : (
                    <button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all">
                      Book Again
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

