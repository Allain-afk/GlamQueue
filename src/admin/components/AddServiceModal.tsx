import { useState, useEffect } from 'react';
import { X, Scissors, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getShops } from '../../client/api/services';
import type { Shop } from '../../client/types';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  shop_id: string;
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceSaved: () => void;
  editingService?: Service | null;
}

export function AddServiceModal({ isOpen, onClose, onServiceSaved, editingService }: AddServiceModalProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    shop_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadShops();
      if (editingService) {
        setFormData({
          name: editingService.name,
          description: editingService.description,
          price: editingService.price.toString(),
          duration: editingService.duration.toString(),
          category: editingService.category,
          shop_id: editingService.shop_id,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '',
          category: '',
          shop_id: '',
        });
      }
    }
  }, [isOpen, editingService]);

  const loadShops = async () => {
    try {
      const shopsData = await getShops();
      setShops(shopsData);
      if (shopsData.length > 0 && !editingService) {
        setFormData(prev => ({ ...prev, shop_id: shopsData[0].id }));
      }
    } catch (err) {
      console.error('Error loading shops:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.duration || !formData.shop_id || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const serviceData = {
        name: formData.name,
        description: formData.description || '',
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category,
        shop_id: formData.shop_id,
        is_active: true,
      };

      if (editingService) {
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert(serviceData);

        if (insertError) throw insertError;
      }

      onServiceSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    'haircut',
    'coloring',
    'treatment',
    'styling',
    'manicure',
    'facial',
    'massage',
    'waxing',
    'beard',
    'other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Scissors className="w-6 h-6" />
              <h2 className="text-2xl font-bold">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Shave Beard"
              required
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
              placeholder="Enter service description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="60"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salon Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.shop_id}
              onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value="">Select salon branch</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
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
                  <Scissors className="w-5 h-5" />
                  <span>{editingService ? 'Update Service' : 'Add Service'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

