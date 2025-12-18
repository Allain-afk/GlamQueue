import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { submitRating } from '../api/ratings';
import { glamError, glamSuccess } from '../../lib/glamAlerts';
import type { Booking } from '../types';

interface RatingModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onRated: () => void;
}

export function RatingModal({ isOpen, booking, onClose, onRated }: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      glamError('Please select a rating');
      return;
    }

    if (!booking.service_id || !booking.shop_id) {
      glamError('Service or shop information is missing');
      return;
    }

    try {
      setLoading(true);
      await submitRating({
        booking_id: booking.id,
        service_id: booking.service_id, // Rate the specific service
        shop_id: booking.shop_id, // For aggregation
        rating,
        comment: comment.trim() || undefined,
      });
      glamSuccess('Thank you for your rating!');
      // Reset form
      setRating(0);
      setHoveredRating(0);
      setComment('');
      // Call onRated callback first to refresh data
      onRated();
      // Then close modal
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      glamError(error instanceof Error ? error.message : 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Experience</h2>
          <p className="text-gray-600">
            How was your <span className="font-semibold">{booking.service?.name || 'service'}</span> experience?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Service</p>
            <p className="font-semibold text-gray-900">{booking.service?.name || 'Service'}</p>
            <p className="text-sm text-gray-600 mt-1">
              {booking.shop?.name} • {new Date(booking.date_time).toLocaleDateString()}
            </p>
          </div>

          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  disabled={loading}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your experience (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              placeholder="Tell us about your experience..."
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Maybe Later
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

