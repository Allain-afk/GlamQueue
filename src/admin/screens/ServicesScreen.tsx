import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Scissors } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AddServiceModal } from '../components/AddServiceModal';
import { glamConfirm, glamError, glamSuccess } from '../../lib/glamAlerts';
import { getCurrentOrganizationId } from '../../api/multiTenancy';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  shop_id: string;
  shop_name?: string;
  is_active: boolean;
  created_at?: string;
}

export function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Get organization_id for multi-tenancy filtering
      const organizationId = await getCurrentOrganizationId();
      
      let servicesQuery = supabase
        .from('services')
        .select(`
          *,
          shop:shops(id, name)
        `)
        .order('created_at', { ascending: false });
      
      // Filter by organization_id if available (multi-tenancy)
      if (organizationId) {
        servicesQuery = servicesQuery.eq('organization_id', organizationId);
      }
      
      const { data, error } = await servicesQuery;

      if (error) throw error;

      setServices((data || []).map((s: any) => ({
        ...s,
        shop_name: s.shop?.name || 'Unknown',
      })));
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await glamConfirm({
      title: 'Delete this service?',
      text: 'This will disable the service and hide it from clients.',
      confirmText: 'Yes, delete',
    });
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      glamSuccess('Service deleted');
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      glamError('Failed to delete service');
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage salon services and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by name, description, or category..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
          <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search' : 'Add your first service to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{service.category}</span>
                    <span>•</span>
                    <span>{service.duration} min</span>
                    <span>•</span>
                    <span>{service.shop_name}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setShowAddModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-2xl font-bold text-pink-600">{formatCurrency(service.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddServiceModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingService(null);
        }}
        onServiceSaved={loadServices}
        editingService={editingService}
      />
    </div>
  );
}

