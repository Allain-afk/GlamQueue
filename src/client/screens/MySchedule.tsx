import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Eye, Trash2, Scissors } from 'lucide-react';
import { useClient } from '../context/ClientContext';
import { cancelBooking, deleteBooking } from '../api/bookings';
import { glamConfirm, glamError, glamSuccess } from '../../lib/glamAlerts';
import { AppointmentDetailsModal } from '../components/AppointmentDetailsModal';
import { RatingModal } from '../components/RatingModal';
import { hasRatedBooking } from '../api/ratings';
import type { Booking } from '../types';

// Component for service image thumbnail with fallback
function ServiceImageThumbnail({ imageUrl, serviceName }: { imageUrl?: string; serviceName: string }) {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-pink-100">
        <Scissors className="w-8 h-8 text-white" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-pink-100">
      <img 
        src={imageUrl} 
        alt={serviceName} 
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

interface MyScheduleProps {
  onBack: () => void;
  initialTab?: 'upcoming' | 'history';
  onBookAgain?: (serviceId: string, shopId: string) => void;
}

export function MySchedule({ onBack, initialTab = 'upcoming', onBookAgain }: MyScheduleProps) {
  const { bookings, upcomingBookings, loading, refreshBookings } = useClient();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'history'>(initialTab);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [hiddenBookingIds, setHiddenBookingIds] = useState<Set<string>>(new Set());

  // Load hidden booking IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('hiddenBookingIds');
    if (stored) {
      try {
        setHiddenBookingIds(new Set(JSON.parse(stored)));
      } catch (error) {
        console.error('Error loading hidden bookings:', error);
      }
    }
  }, []);

  // Save hidden booking IDs to localStorage
  const saveHiddenBookings = (ids: Set<string>) => {
    localStorage.setItem('hiddenBookingIds', JSON.stringify(Array.from(ids)));
    setHiddenBookingIds(ids);
  };

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

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleRate = async (booking: Booking) => {
    // Check if already rated
    try {
      const alreadyRated = await hasRatedBooking(booking.id);
      if (alreadyRated) {
        glamError('You have already rated this appointment');
        return;
      }
    } catch (error) {
      console.error('Error checking rating:', error);
      // Continue anyway - let the rating modal handle it
    }
    
    setRatingBooking(booking);
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = async () => {
    // Refresh bookings to update the UI
    await refreshBookings();
    // Close rating modal
    setShowRatingModal(false);
    setRatingBooking(null);
    // Refresh the details modal if open to show the new rating
    // The modal's useEffect will automatically reload the rating when booking.id changes
    if (selectedBooking && showDetailsModal) {
      // Force a refresh by updating the booking reference
      // This will trigger the useEffect in the modal to reload the rating
      setSelectedBooking({ ...selectedBooking });
    }
  };

  const handleRatingComplete = async () => {
    await handleRatingSubmitted();
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const booking = displayBookings.find(b => b.id === bookingId);
    const ok = await glamConfirm({
      title: 'Permanently delete this appointment?',
      text: booking
        ? `Are you sure you want to permanently delete the appointment for "${booking.service?.name || 'Service'}"? This action cannot be undone and the appointment will be removed from your history.`
        : 'Are you sure you want to permanently delete this appointment? This action cannot be undone.',
      confirmText: 'Yes, delete permanently',
      confirmButtonColor: '#dc2626',
    });
    if (!ok) return;

    try {
      setDeletingId(bookingId);
      await deleteBooking(bookingId);
      await refreshBookings();
      glamSuccess('Appointment deleted permanently');
      // Close details modal if the deleted booking was open
      if (selectedBooking?.id === bookingId) {
        setShowDetailsModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      glamError(error instanceof Error ? error.message : 'Failed to delete appointment');
    } finally {
      setDeletingId(null);
    }
  };

  const historyBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const visibleHistoryBookings = historyBookings.filter(b => !hiddenBookingIds.has(b.id));
  const displayBookings = selectedTab === 'upcoming' ? upcomingBookings : visibleHistoryBookings;

  const handleDeleteAllHistory = async () => {
    const historyCount = historyBookings.length;
    if (historyCount === 0) {
      glamError('No history to delete');
      return;
    }

    const ok = await glamConfirm({
      title: 'Hide all appointment history?',
      text: `This will hide all ${historyCount} history items from your view. They will still be accessible to administrators for tracking purposes. You can restore them later if needed.`,
      confirmText: 'Yes, hide all',
      confirmButtonColor: '#dc2626',
    });
    if (!ok) return;

    const allHistoryIds = new Set(historyBookings.map(b => b.id));
    saveHiddenBookings(new Set([...hiddenBookingIds, ...allHistoryIds]));
    glamSuccess('All history items have been hidden');
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
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-4">
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
                History ({visibleHistoryBookings.length})
              </button>
            </div>
            {selectedTab === 'history' && visibleHistoryBookings.length > 0 && (
              <button
                onClick={handleDeleteAllHistory}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded-lg transition-colors"
                title="Hide all history (still accessible to admin)"
              >
                <Trash2 className="w-4 h-4" />
                Hide All History
              </button>
            )}
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
                        <ServiceImageThumbnail 
                          imageUrl={booking.service?.image_url} 
                          serviceName={booking.service?.name || 'Service'}
                        />
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
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
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
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all"
                      >
                        <Eye className="w-4 h-4" />
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
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {(booking.status === 'cancelled' || booking.status === 'completed') && (
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          disabled={deletingId === booking.id}
                          className="px-4 py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          title="Delete permanently"
                        >
                          {deletingId === booking.id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              Deleting...
                            </div>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </button>
                      )}
                      {booking.status === 'completed' && booking.service_id && booking.shop_id && (
                        <button 
                          onClick={() => {
                            if (onBookAgain && booking.service_id && booking.shop_id) {
                              onBookAgain(booking.service_id, booking.shop_id);
                            }
                          }}
                          className="px-6 py-3 border-2 border-pink-500 text-pink-500 rounded-xl font-semibold hover:bg-pink-50 transition-all"
                        >
                          Book Again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        booking={selectedBooking}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBooking(null);
        }}
        onRate={handleRate}
        onDelete={(booking) => handleDeleteBooking(booking.id)}
      />

      {/* Rating Modal */}
      {showRatingModal && ratingBooking && (
        <RatingModal
          isOpen={showRatingModal}
          booking={ratingBooking}
          onClose={() => {
            setShowRatingModal(false);
            setRatingBooking(null);
          }}
          onRated={handleRatingComplete}
        />
      )}
    </div>
  );
}

