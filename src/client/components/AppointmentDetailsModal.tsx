import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, XCircle, Star, Trash2, Scissors } from 'lucide-react';
import type { Booking } from '../types';
import { getBookingRating, hasRatedBooking } from '../api/ratings';
import type { Rating } from '../api/ratings';

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

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onRate?: (booking: Booking) => void;
  onDelete?: (booking: Booking) => void;
}

export function AppointmentDetailsModal({ isOpen, booking, onClose, onRate, onDelete }: AppointmentDetailsModalProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);


  useEffect(() => {
    const loadRating = async () => {
      if (!isOpen || !booking || booking.status !== 'completed') {
        setRating(null);
        return;
      }

      try {
        setLoadingRating(true);
        const bookingRating = await getBookingRating(booking.id);
        setRating(bookingRating);
      } catch (error) {
        console.error('Error loading rating:', error);
        setRating(null);
      } finally {
        setLoadingRating(false);
      }
    };

    if (isOpen && booking) {
      loadRating();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, booking?.id]);

  if (!isOpen || !booking) return null;

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              <ServiceImageThumbnail 
                imageUrl={booking.service?.image_url} 
                serviceName={booking.service?.name || 'Service'}
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {booking.service?.name || 'Service'}
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  {booking.service?.description || ''}
                </p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span className="capitalize">{booking.status}</span>
                </span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-pink-600">₱{booking.service?.price || 0}</p>
                <p className="text-sm text-gray-500">{booking.service?.duration || 0} min</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Date & Time */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Date & Time</p>
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
            </div>

            {/* Location */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Location</p>
                  <p className="text-sm text-gray-600 font-medium">{booking.shop?.name || 'Shop'}</p>
                  <p className="text-sm text-gray-600">{booking.shop?.address || ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="mb-6 p-4 bg-pink-50 rounded-xl border border-pink-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {/* Rating Display (if already rated) */}
          {booking.status === 'completed' && rating && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Your Rating</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= rating.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-gray-700">
                      {rating.rating}/5
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{rating.comment}"</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Booking Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Booking ID</p>
                <p className="font-mono font-semibold text-gray-900">{booking.id.slice(0, 8).toUpperCase()}</p>
              </div>
              {booking.created_at && (
                <div>
                  <p className="text-gray-600 mb-1">Booked On</p>
                  <p className="font-medium text-gray-900">
                    {new Date(booking.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions - Stacked vertically for better spacing */}
          <div className="space-y-3">
            {booking.status === 'completed' && onRate && !rating && !loadingRating && (
              <button
                onClick={async () => {
                  // Check again before opening rating modal
                  const alreadyRated = await hasRatedBooking(booking.id);
                  if (alreadyRated) {
                    // Refresh rating display
                    const bookingRating = await getBookingRating(booking.id);
                    setRating(bookingRating);
                    return;
                  }
                  onRate(booking);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white py-3.5 rounded-xl font-semibold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
              >
                <Star className="w-5 h-5" />
                Rate This Appointment
              </button>
            )}
            {(booking.status === 'cancelled' || booking.status === 'completed') && onDelete && (
              <button
                onClick={() => {
                  onDelete(booking);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                Delete Permanently
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full px-4 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

