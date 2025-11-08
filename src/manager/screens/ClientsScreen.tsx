import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { getManagerClients } from '../../api/manager';
import type { Client } from '../../api/admin';

export function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getManagerClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-700';
      case 'Gold': return 'bg-yellow-100 text-yellow-700';
      case 'Silver': return 'bg-gray-100 text-gray-700';
      default: return 'bg-orange-100 text-orange-700';
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">View all shop clients</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredClients.map((client) => (
            <div key={client.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {client.full_name?.charAt(0).toUpperCase() || client.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.full_name || 'Client'}</h3>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{client.total_visits} visits</span>
                      <span>{formatCurrency(client.total_spent)} spent</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${getTierColor(client.tier)}`}>
                    {client.tier}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No clients found
          </div>
        )}
      </div>
    </div>
  );
}

