import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Users, Activity } from 'lucide-react';
import { getManagerDashboardStats, getManagerAppointments } from '../../api/manager';
import { supabase } from '../../lib/supabase';
import type { AppointmentWithDetails } from '../../api/admin';

export function DashboardScreen() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    revenueChange: 0,
    totalAppointments: 0,
    appointmentsChange: 0,
    activeClients: 0,
    clientsChange: 0,
    staffUtilization: 0,
    utilizationChange: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Set up realtime subscription for bookings
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, appointmentsData] = await Promise.all([
        getManagerDashboardStats(),
        getManagerAppointments(10),
      ]);
      setStats(statsData);
      setTodayAppointments(appointmentsData.filter(apt => {
        const aptDate = new Date(apt.start_at);
        const today = new Date();
        return aptDate.toDateString() === today.toDateString();
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
              <p className={`text-sm mt-1 ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}% from yesterday
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              <p className={`text-sm mt-1 ${stats.appointmentsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.appointmentsChange >= 0 ? '+' : ''}{stats.appointmentsChange}% change
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
              <p className={`text-sm mt-1 ${stats.clientsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.clientsChange >= 0 ? '+' : ''}{stats.clientsChange}% change
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Staff Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{stats.staffUtilization}%</p>
              <p className={`text-sm mt-1 ${stats.utilizationChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.utilizationChange >= 0 ? '+' : ''}{stats.utilizationChange}% change
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Appointments</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{apt.client_name}</p>
                  <p className="text-sm text-gray-600">{apt.service_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {new Date(apt.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

