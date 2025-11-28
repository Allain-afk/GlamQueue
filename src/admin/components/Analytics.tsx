import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AnalyticsAIChatbot } from '../../components/AnalyticsAIChatbot';
import '../../styles/components/analytics-chatbot.css';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bot
} from 'lucide-react';

interface AnalyticsData {
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  averageBookingValue: number;
  bookingsByStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  bookingsByMonth: Array<{
    month: string;
    count: number;
  }>;
  topServices: Array<{
    service_id: number;
    count: number;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    timestamp: string;
    user: string;
  }>;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Get bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Get users data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (usersError) throw usersError;

      // Calculate analytics
      const totalBookings = bookings?.length || 0;
      const totalUsers = users?.length || 0;
      
      // Get service IDs and fetch prices
      const serviceIds = [...new Set((bookings || []).map(b => b.service_id).filter(Boolean))];
      let servicePriceMap = new Map();
      
      if (serviceIds.length > 0) {
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price')
          .in('id', serviceIds);

        if (!servicesError && services) {
          servicePriceMap = new Map(services.map(s => [s.id, { name: s.name, price: s.price || 500 }]));
        }
      }
      
      // Calculate revenue using actual service prices (only completed bookings)
      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      const totalRevenue = completedBookings.reduce((sum, b) => {
        const service = servicePriceMap.get(b.service_id);
        const price = service?.price || 500;
        return sum + price;
      }, 0);
      
      const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

      const bookingsByStatus = {
        pending: bookings?.filter(b => b.status === 'pending').length || 0,
        confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
        completed: bookings?.filter(b => b.status === 'completed').length || 0,
        cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      };

      // Group bookings by month
      const bookingsByMonth = bookings?.reduce((acc: Array<{ month: string; count: number }>, booking) => {
        const month = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ month, count: 1 });
        }
        return acc;
      }, []) || [];

      // Top services (real data)
      const serviceCountMap = new Map<number, number>();
      bookings?.forEach(b => {
        serviceCountMap.set(b.service_id, (serviceCountMap.get(b.service_id) || 0) + 1);
      });
      
      const topServices = Array.from(serviceCountMap.entries())
        .map(([serviceId, count]) => ({ service_id: serviceId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent activity (from bookings and users)
      const recentActivity: Array<{ id: number; action: string; timestamp: string; user: string }> = [];
      
      // Add recent bookings
      const recentBookings = bookings?.slice(0, 5) || [];
      recentBookings.forEach((booking) => {
        recentActivity.push({
          id: booking.id,
          action: `Booking ${booking.status}`,
          timestamp: booking.created_at || booking.start_at,
          user: booking.client_id || 'Unknown',
        });
      });
      
      // Add recent users
      const recentUsers = users?.slice(0, 3) || [];
      recentUsers.forEach((user, index) => {
        recentActivity.push({
          id: 1000 + index,
          action: 'User registered',
          timestamp: user.created_at || new Date().toISOString(),
          user: user.email || 'Unknown',
        });
      });
      
      // Sort by timestamp and take most recent
      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const finalActivity = recentActivity.slice(0, 5);

      setAnalytics({
        totalBookings,
        totalUsers,
        totalRevenue,
        averageBookingValue,
        bookingsByStatus,
        bookingsByMonth,
        topServices,
        recentActivity: finalActivity,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.averageBookingValue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(analytics.bookingsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                  {status === 'confirmed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {status === 'completed' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  {status === 'cancelled' && <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Services</h3>
          <div className="space-y-3">
            {analytics.topServices.length > 0 ? (
              analytics.topServices.map((service) => (
                <div key={service.service_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Service #{service.service_id}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{service.count} bookings</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No service data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {analytics.recentActivity.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">by {activity.user}</p>
                </div>
                <span className="text-sm text-gray-500">{formatDate(activity.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights & Chatbot Section */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl shadow-lg border border-pink-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Business Insights</h3>
              <p className="text-sm text-gray-600">Get personalized recommendations based on your sales data</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-pink-200">
          <div className="flex items-center justify-center min-h-[200px] relative">
            <AnalyticsAIChatbot />
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <h4 className="text-sm font-semibold text-gray-900">Revenue Insights</h4>
            </div>
            <p className="text-xs text-gray-600">Ask about revenue trends and optimization strategies</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-900">Peak Hours</h4>
            </div>
            <p className="text-xs text-gray-600">Discover your busiest times and scheduling opportunities</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-900">Customer Retention</h4>
            </div>
            <p className="text-xs text-gray-600">Get tips on improving customer loyalty and retention</p>
          </div>
        </div>
      </div>
    </div>
  );
}
