import { useState, useEffect } from 'react';
import { X, MapPin, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../auth/useAuth';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone_number?: string;
  description?: string;
  rating?: number;
  review_count?: number;
  is_open: boolean;
}

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBranchSaved: () => void;
  editingBranch?: Branch | null;
}

export function AddBranchModal({ isOpen, onClose, onBranchSaved, editingBranch }: AddBranchModalProps) {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone_number: '',
    description: '',
    is_open: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingBranch) {
        setFormData({
          name: editingBranch.name,
          address: editingBranch.address,
          phone_number: editingBranch.phone_number || '',
          description: editingBranch.description || '',
          is_open: editingBranch.is_open ?? true,
        });
      } else {
        setFormData({
          name: '',
          address: '',
          phone_number: '',
          description: '',
          is_open: true,
        });
      }
    }
  }, [isOpen, editingBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.id) {
        throw new Error('You must be logged in to create a branch');
      }

      const branchData = {
        name: formData.name,
        address: formData.address,
        phone_number: formData.phone_number || null,
        description: formData.description || null,
        is_open: formData.is_open,
        rating: 0,
        review_count: 0,
        owner_id: session.user.id, // Set owner_id to current user
      };

      if (editingBranch) {
        const { error: updateError } = await supabase
          .from('shops')
          .update(branchData)
          .eq('id', editingBranch.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('shops')
          .insert(branchData);

        if (insertError) throw insertError;
      }

      onBranchSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 sm:p-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-bold">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Glam Studio Manila"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Makati City, Metro Manila"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., +63 2 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter branch description..."
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_open}
                onChange={(e) => setFormData({ ...formData, is_open: e.target.checked })}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-700">Branch is currently open</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>{editingBranch ? 'Update Branch' : 'Add Branch'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

