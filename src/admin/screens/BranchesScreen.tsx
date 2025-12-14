import { useState, useEffect } from 'react';
import { Plus, MapPin, Phone, DollarSign, TrendingUp, Calendar, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AddBranchModal } from '../components/AddBranchModal';
import { glamConfirm, glamError, glamSuccess } from '../../lib/glamAlerts';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone_number?: string;
  description?: string;
  rating?: number;
  review_count?: number;
  is_open: boolean;
  created_at?: string;
  // Calculated fields
  totalSales: number;
  totalBookings: number;
  monthlySales: number;
  monthlyBookings: number;
}

export function BranchesScreen() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      
      // Fetch all shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (shopsError) throw shopsError;

      // Fetch bookings for each shop to calculate sales
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('shop_id, service_id, status, created_at, start_at')
        .eq('status', 'completed');

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      }

      // Get service prices
      const serviceIds = [...new Set((bookingsData || []).map(b => b.service_id).filter(Boolean))];
      let servicePriceMap = new Map();
      
      if (serviceIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, price')
          .in('id', serviceIds);

        if (!servicesError && servicesData) {
          servicePriceMap = new Map(servicesData.map(s => [s.id, s.price || 0]));
        }
      }

      // Calculate sales for each branch
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const branchesWithSales = (shopsData || []).map((shop) => {
        const shopBookings = (bookingsData || []).filter(b => b.shop_id === shop.id);
        const monthlyBookings = shopBookings.filter(b => 
          new Date(b.created_at || b.start_at) >= oneMonthAgo
        );

        const totalSales = shopBookings.reduce((sum, b) => {
          const price = servicePriceMap.get(b.service_id) || 0;
          return sum + price;
        }, 0);

        const monthlySales = monthlyBookings.reduce((sum, b) => {
          const price = servicePriceMap.get(b.service_id) || 0;
          return sum + price;
        }, 0);

        return {
          ...shop,
          totalSales,
          totalBookings: shopBookings.length,
          monthlySales,
          monthlyBookings: monthlyBookings.length,
        } as Branch;
      });

      setBranches(branchesWithSales);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await glamConfirm({
      title: 'Delete this branch?',
      text: 'This will close the branch and may affect related services/bookings.',
      confirmText: 'Yes, delete',
    });
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_open: false })
        .eq('id', id);

      if (error) throw error;
      glamSuccess('Branch deleted');
      loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      glamError('Failed to delete branch');
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Branches Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage salon branches and track their performance</p>
        </div>
        <button
          onClick={() => {
            setEditingBranch(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Branch</span>
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
            placeholder="Search branches by name or address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Branches Grid */}
      {filteredBranches.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No branches found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search' : 'Add your first branch to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                    {branch.is_open ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Open
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{branch.address}</span>
                  </div>
                  {branch.phone_number && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{branch.phone_number}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingBranch(branch);
                      setShowAddModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {branch.description && (
                <p className="text-sm text-gray-600 mb-4">{branch.description}</p>
              )}

              {/* Sales Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Sales</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">{formatCurrency(branch.totalSales)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-blue-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Bookings</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">{branch.totalBookings}</p>
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">This Month</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(branch.monthlySales)}</p>
                  <p className="text-xs text-gray-500">{branch.monthlyBookings} bookings</p>
                </div>
                {branch.rating && (
                  <div>
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <span className="text-xs">Rating</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {branch.rating.toFixed(1)} ⭐
                    </p>
                    <p className="text-xs text-gray-500">{branch.review_count || 0} reviews</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Branch Performance</h3>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(branches.reduce((sum, b) => sum + b.totalSales, 0))}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Across {branches.length} branch{branches.length !== 1 ? 'es' : ''} • {branches.reduce((sum, b) => sum + b.totalBookings, 0)} total bookings
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-2">This Month</p>
            <p className="text-2xl font-bold text-pink-600">
              {formatCurrency(branches.reduce((sum, b) => sum + b.monthlySales, 0))}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {branches.reduce((sum, b) => sum + b.monthlyBookings, 0)} bookings
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AddBranchModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingBranch(null);
        }}
        onBranchSaved={loadBranches}
        editingBranch={editingBranch}
      />
    </div>
  );
}

