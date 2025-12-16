import { useState, useEffect } from 'react';
import { X, Scissors, Loader, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getShops } from '../../client/api/services';
import { useAuth } from '../../auth/useAuth';
import type { Shop } from '../../client/types';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  shop_id: string;
  image_url?: string | null;
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceSaved: () => void;
  editingService?: Service | null;
}

export function AddServiceModal({ isOpen, onClose, onServiceSaved, editingService }: AddServiceModalProps) {
  const { session } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    shop_id: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
        // Load existing image if available
        if ('image_url' in editingService && editingService.image_url) {
          setImagePreview(editingService.image_url);
        } else {
          setImagePreview(null);
        }
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '',
          category: '',
          shop_id: '',
        });
        setImageFile(null);
        setImagePreview(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadServiceImage = async (): Promise<string | null> => {
    if (!imageFile || !session?.user?.id) {
      return null;
    }

    try {
      setUploadingImage(true);
      
      // Get file extension
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `service-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `services/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // Provide more specific error messages
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
          throw new Error('Storage permissions not configured. Please contact administrator to set up storage policies.');
        } else if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('404')) {
          throw new Error('Storage bucket not found. Please create "services" bucket in Supabase Storage.');
        } else if (uploadError.message.includes('400') || uploadError.message.includes('Invalid')) {
          throw new Error('Invalid file or storage configuration. Please check file format and storage settings.');
        }
        
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    } finally {
      setUploadingImage(false);
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

      // Upload image if a new one was selected
      let imageUrl = imagePreview && !imageFile ? imagePreview : null; // Keep existing URL if no new file
      if (imageFile) {
        imageUrl = await uploadServiceImage();
        if (!imageUrl) {
          throw new Error('Failed to upload service image');
        }
      }

      const serviceData = {
        name: formData.name,
        description: formData.description || '',
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category,
        shop_id: formData.shop_id,
        is_active: true,
        image_url: imageUrl,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 sm:p-6 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-bold">
                {editingService ? 'Edit Service' : 'Add New Service'}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* Two-column layout on desktop, single column on mobile */}
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Left Column - Basic Info */}
            <div className="flex-1 space-y-4">
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
            </div>

            {/* Right Column - Image Upload (Desktop) / Below Form (Mobile) */}
            <div className="flex-1 mt-4 lg:mt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Image
                </label>
                <div className="space-y-2">
                  {imagePreview && (
                    <div className="relative w-full h-48 lg:h-56 rounded-lg overflow-hidden border border-gray-300">
                      <img 
                        src={imagePreview} 
                        alt="Service preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-32 lg:h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingImage ? (
                        <>
                          <Loader className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                          <p className="text-sm text-gray-500">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold text-pink-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Tips Section - Only on Desktop */}
              <div className="hidden lg:block p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                <h4 className="font-medium text-gray-800 mb-2">💡 Tips for a great service listing</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use a clear, descriptive name</li>
                  <li>• Add a high-quality image</li>
                  <li>• Include accurate duration estimate</li>
                  <li>• Set competitive pricing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-6 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading || uploadingImage ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>{uploadingImage ? 'Uploading...' : 'Saving...'}</span>
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

