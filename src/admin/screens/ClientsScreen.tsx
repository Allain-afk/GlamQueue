import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, TrendingUp, Calendar, DollarSign, Award } from 'lucide-react';
import { getAllClients, type Client } from '../../api/admin';
import { ClientHistoryModal } from '../components/ClientHistoryModal';
import { BookNowModal } from '../components/BookNowModal';

export function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getAllClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || client.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Silver': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stats = {
    total: clients.length,
    platinum: clients.filter(c => c.tier === 'Platinum').length,
    gold: clients.filter(c => c.tier === 'Gold').length,
    silver: clients.filter(c => c.tier === 'Silver').length,
    bronze: clients.filter(c => c.tier === 'Bronze').length,
    totalRevenue: clients.reduce((sum, c) => sum + c.total_spent, 0),
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
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client relationships and history</p>
        </div>
        <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Total Clients</p>
          <p className="text-4xl font-bold mb-2">{stats.total}</p>
          <p className="text-sm opacity-75">Active members</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-700">Platinum</p>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.platinum}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-yellow-700">Gold</p>
            <Award className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.gold}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-700">Silver</p>
            <Award className="w-4 h-4 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.silver}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-orange-700">Bronze</p>
            <Award className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.bronze}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
          >
            <option value="all">All Tiers</option>
            <option value="Platinum">Platinum</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500">
            {searchQuery || tierFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first client'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all cursor-pointer flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {client.full_name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.full_name || 'Unknown'}</h3>
                    <p className="text-xs text-gray-500">ID: {client.id.slice(0, 8)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getTierColor(client.tier)}`}>
                  {client.tier}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                    <Calendar className="w-3 h-3" />
                    <p className="text-xs">Visits</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{client.total_visits}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                    <DollarSign className="w-3 h-3" />
                    <p className="text-xs">Spent</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(client.total_spent)}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-gray-500 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <p className="text-xs">Avg</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(client.total_visits > 0 ? client.total_spent / client.total_visits : 0)}
                  </p>
                </div>
              </div>

              {/* Last Visit */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
                <p className="text-xs text-gray-500">Last visit</p>
                <p className="text-xs font-semibold text-gray-900">{formatDate(client.last_visit)}</p>
              </div>

              {/* Spacer to push buttons to bottom */}
              <div className="flex-grow"></div>

              {/* Actions - Always at bottom */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setShowHistoryModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg text-sm font-medium transition-colors"
                >
                  View History
                </button>
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setShowBookModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Client Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-gray-600 mt-2">
              Average per client: {formatCurrency(stats.total > 0 ? stats.totalRevenue / stats.total : 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-2">Client Retention</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-green-600">89%</span>
              <span className="text-sm text-green-600">+5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedClient && (
        <>
          <ClientHistoryModal
            client={selectedClient}
            isOpen={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false);
              setSelectedClient(null);
            }}
          />
          <BookNowModal
            client={selectedClient}
            isOpen={showBookModal}
            onClose={() => {
              setShowBookModal(false);
              setSelectedClient(null);
            }}
            onBookingCreated={() => {
              loadClients();
            }}
          />
        </>
      )}
    </div>
  );
}


