import { useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Users,
  Activity,
  MessageSquare,
  Send,
  Smartphone,
  Gift,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminData } from '../context/AdminDataContext';
import { AIInsightsCard } from '../components/AIInsightsCard';

export function DashboardScreen() {
  const {
    dashboardStats,
    todayAppointments,
    staffMembers,
    topClients,
    revenueData,
    loading,
    fetchDashboardStats,
    fetchTodayAppointments,
    fetchStaffMembers,
    fetchTopClients,
    fetchRevenueData,
  } = useAdminData();

  // Load data only if not cached
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchDashboardStats(),
        fetchTodayAppointments(),
        fetchStaffMembers(),
        fetchTopClients(),
        fetchRevenueData(),
      ]);
    };
    loadData();
  }, []); // Only run once on mount

  // Memoize formatted functions to prevent re-creation
  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
      }).format(amount);
    };
  }, []);

  const formatTime = useMemo(() => {
    return (dateString: string) => {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };
  }, []);

  const getStatusColor = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
        case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
    };
  }, []);

  const getStaffStatusColor = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case 'available': return 'bg-green-500';
        case 'busy': return 'bg-red-500';
        case 'break': return 'bg-yellow-500';
        default: return 'bg-gray-500';
      }
    };
  }, []);

  const getTierColor = useMemo(() => {
    return (tier: string) => {
      switch (tier) {
        case 'Platinum': return 'bg-purple-100 text-purple-700';
        case 'Gold': return 'bg-yellow-100 text-yellow-700';
        case 'Silver': return 'bg-gray-100 text-gray-700';
        default: return 'bg-orange-100 text-orange-700';
      }
    };
  }, []);

  // Slice arrays for display (memoized)
  const displayStaff = useMemo(() => staffMembers.slice(0, 4), [staffMembers]);
  const displayAppointments = useMemo(() => todayAppointments.slice(0, 5), [todayAppointments]);

  const isLoading = loading.dashboard || loading.appointments || loading.staff || loading.clients;

  if (isLoading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Card */}
      <AIInsightsCard 
        dashboardStats={dashboardStats ?? undefined}
        appointments={todayAppointments}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {formatCurrency(dashboardStats?.totalRevenue || 0)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-semibold">+{dashboardStats?.revenueChange || 0}%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Appointments</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {dashboardStats?.totalAppointments || 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-blue-600 font-semibold">+{dashboardStats?.appointmentsChange || 0}%</span>
            <span className="text-gray-500 ml-2">from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Clients</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {dashboardStats?.activeClients || 0}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-purple-600 font-semibold">+{dashboardStats?.clientsChange || 0}%</span>
            <span className="text-gray-500 ml-2">from yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Staff Utilization</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {dashboardStats?.staffUtilization || 0}%
              </h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-orange-600 font-semibold">+{dashboardStats?.utilizationChange || 0}%</span>
            <span className="text-gray-500 ml-2">from yesterday</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
              <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors">
                New Booking
              </button>
            </div>
          </div>
          <div className="p-6">
            {displayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No appointments today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {apt.client_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{apt.client_name}</p>
                        <p className="text-sm text-gray-500">{apt.service_name} • {apt.staff_name || 'Emma Wilson'}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(apt.start_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(apt.service_price || 0)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Staff Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {displayStaff.map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStaffStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                    {member.next_appointment && (
                      <p className="text-xs text-gray-400">Next: {member.next_appointment}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {member.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { icon: MessageSquare, label: 'AI Chatbot', color: 'purple' },
              { icon: Send, label: 'Send Promotions', color: 'green' },
              { icon: Smartphone, label: 'Mobile Check-in', color: 'blue' },
              { icon: Gift, label: 'Loyalty Rewards', color: 'orange' },
            ].map(({ icon: Icon, label, color }) => (
              <button 
                key={label}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-${color}-50 to-${color}-50 hover:from-${color}-100 hover:to-${color}-100 transition-colors`}
              >
                <div className={`w-10 h-10 bg-${color}-500 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
              <p className="text-sm text-gray-500 mt-1">This Week</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 font-semibold">+15%</span>
                <span className="text-gray-500">vs Last Week</span>
              </div>
            </div>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dayLabel" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No revenue data available
            </div>
          )}
          <div className="mt-6 flex items-center justify-around pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueData.reduce((sum, d) => sum + d.amount, 0))}</p>
              <p className="text-xs text-gray-500 mt-1">Total This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">92%</p>
              <p className="text-xs text-gray-500 mt-1">Goal Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top Clients</h3>
            <button className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              View All →
            </button>
          </div>
        </div>
        <div className="p-6">
          {topClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No client data yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topClients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 transition-colors flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTierColor(client.tier)}`}>
                      {client.tier}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">{client.name}</p>
                  <p className="text-sm text-gray-500 mb-2">{client.visits} visits • {Math.floor(Math.random() * 10) + 1} days ago</p>
                  
                  {/* Spacer to push footer to bottom */}
                  <div className="flex-grow"></div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    <span className="text-xs text-gray-500">Total Spent</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(client.totalSpent)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


