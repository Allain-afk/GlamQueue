import { supabase } from '../lib/supabase';

// ============= TYPES =============

export interface DashboardStats {
  todayRevenue: number;
  revenueChange: number;
  totalAppointments: number;
  appointmentsChange: number;
  activeClients: number;
  clientsChange: number;
  staffUtilization: number;
  utilizationChange: number;
}

export interface AppointmentWithDetails {
  id: number;
  client_id: string;
  service_id: number;
  salon_id: number;
  start_at: string;
  end_at?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  client_name?: string;
  client_email?: string;
  service_name?: string;
  service_price?: number;
  staff_name?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'available' | 'busy' | 'break';
  rating: number;
  avatar?: string;
  next_appointment?: string;
}

export interface Client {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  total_visits: number;
  total_spent: number;
  last_visit?: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  created_at: string;
}

export interface RevenueData {
  date: string;
  amount: number;
  dayLabel: string;
}

export interface TopClient {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
}

// ============= DASHBOARD STATS =============

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    // Get today's bookings
    const { data: todayBookings, error: todayError } = await supabase
      .from('bookings')
      .select('service_id')
      .gte('created_at', todayStr);

    if (todayError) throw todayError;

    // Get yesterday's bookings for comparison
    const { data: yesterdayBookings, error: yesterdayError } = await supabase
      .from('bookings')
      .select('service_id')
      .gte('created_at', yesterdayStr)
      .lt('created_at', todayStr);

    if (yesterdayError) throw yesterdayError;

    // Calculate revenue (assuming average service price of 500)
    const todayRevenue = (todayBookings?.length || 0) * 500;
    const yesterdayRevenue = (yesterdayBookings?.length || 0) * 500;
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;

    // Get total appointments
    const { count: totalAppointments, error: apptError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('start_at', todayStr);

    if (apptError) throw apptError;

    // Get active clients (clients with bookings in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeClientsData, error: clientsError } = await supabase
      .from('bookings')
      .select('client_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (clientsError) throw clientsError;

    const uniqueClients = new Set(activeClientsData?.map(b => b.client_id) || []);
    const activeClients = uniqueClients.size;

    // Staff utilization (mock for now - would need staff schedule data)
    const staffUtilization = 85;

    return {
      todayRevenue,
      revenueChange: Math.round(revenueChange),
      totalAppointments: totalAppointments || 0,
      appointmentsChange: 18,
      activeClients,
      clientsChange: 24,
      staffUtilization,
      utilizationChange: 5,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      todayRevenue: 0,
      revenueChange: 0,
      totalAppointments: 0,
      appointmentsChange: 0,
      activeClients: 0,
      clientsChange: 0,
      staffUtilization: 0,
      utilizationChange: 0,
    };
  }
}

// ============= APPOINTMENTS =============

export async function getTodayAppointments(): Promise<AppointmentWithDetails[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gte('start_at', today.toISOString())
      .lt('start_at', tomorrow.toISOString())
      .order('start_at', { ascending: true })
      .limit(10);

    if (bookingsError) throw bookingsError;
    if (!bookings || bookings.length === 0) return [];

    // Fetch related data in parallel
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    
    const [profilesResult, servicesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email')
        .in('id', clientIds),
      supabase
        .from('services')
        .select('id, name, price')
        .in('id', serviceIds)
    ]);

    if (profilesResult.error) console.error('Error fetching profiles:', profilesResult.error);
    if (servicesResult.error) console.error('Error fetching services:', servicesResult.error);

    // Create lookup maps
    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.email]));
    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s]));

    return bookings.map(booking => {
      const clientEmail = profileMap.get(booking.client_id) || 'Unknown';
      const service = serviceMap.get(booking.service_id);
      
      return {
        ...booking,
        client_email: clientEmail,
        client_name: clientEmail.split('@')[0] || 'Client',
        service_name: service?.name || `Service #${booking.service_id}`,
        service_price: service?.price || 500,
      } as AppointmentWithDetails;
    });
  } catch (error) {
    console.error('Error fetching today appointments:', error);
    return [];
  }
}

export async function getAllAppointments(limit = 50): Promise<AppointmentWithDetails[]> {
  try {
    // Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('start_at', { ascending: false })
      .limit(limit);

    if (bookingsError) throw bookingsError;
    if (!bookings || bookings.length === 0) return [];

    // Fetch related data in parallel
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    
    const [profilesResult, servicesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email')
        .in('id', clientIds),
      supabase
        .from('services')
        .select('id, name, price')
        .in('id', serviceIds)
    ]);

    if (profilesResult.error) console.error('Error fetching profiles:', profilesResult.error);
    if (servicesResult.error) console.error('Error fetching services:', servicesResult.error);

    // Create lookup maps
    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.email]));
    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s]));

    return bookings.map(booking => {
      const clientEmail = profileMap.get(booking.client_id) || 'Unknown';
      const service = serviceMap.get(booking.service_id);
      
      return {
        ...booking,
        client_email: clientEmail,
        client_name: clientEmail.split('@')[0] || 'Client',
        service_name: service?.name || `Service #${booking.service_id}`,
        service_price: service?.price || 500,
      } as AppointmentWithDetails;
    });
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    return [];
  }
}

// ============= STAFF =============

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['staff', 'manager'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map profiles to staff members with calculated status
    return (data || []).map((profile, index) => {
      const statuses: ('available' | 'busy' | 'break')[] = ['available', 'busy', 'available', 'break'];
      return {
        id: profile.id,
        name: profile.email?.split('@')[0] || 'Staff Member',
        email: profile.email || '',
        role: profile.role === 'manager' ? 'Manager' : 'Specialist',
        status: statuses[index % statuses.length],
        rating: 4.5 + Math.random() * 0.5,
        next_appointment: index % 2 === 0 ? '10:00 AM' : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
}

// ============= CLIENTS =============

export async function getTopClients(limit = 10): Promise<TopClient[]> {
  try {
    // Get all bookings grouped by client
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('client_id, service_id, start_at, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;
    if (!bookings || bookings.length === 0) return [];

    // Fetch related data in parallel
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    
    const [profilesResult, servicesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email')
        .in('id', clientIds),
      supabase
        .from('services')
        .select('id, price')
        .in('id', serviceIds)
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (servicesResult.error) throw servicesResult.error;

    // Create lookup maps
    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.email]));
    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s.price]));

    // Group by client and calculate totals
    const clientMap = new Map<string, {
      email: string;
      visits: number;
      totalSpent: number;
      lastVisit: string;
    }>();

    bookings.forEach(booking => {
      const existing = clientMap.get(booking.client_id);
      const spent = serviceMap.get(booking.service_id) || 500; // Use actual service price or default
      
      if (existing) {
        existing.visits += 1;
        existing.totalSpent += spent;
        if (new Date(booking.start_at) > new Date(existing.lastVisit)) {
          existing.lastVisit = booking.start_at;
        }
      } else {
        const profileEmail = profileMap.get(booking.client_id);
        clientMap.set(booking.client_id, {
          email: profileEmail || 'unknown@example.com',
          visits: 1,
          totalSpent: spent,
          lastVisit: booking.start_at,
        });
      }
    });

    // Convert to array and sort by total spent
    const clients = Array.from(clientMap.entries())
      .map(([id, data]) => {
        const emailParts = data.email.split('@');
        const name = emailParts.length > 0 ? emailParts[0] : 'Client';
        return {
          id,
          name,
          email: data.email,
          totalSpent: data.totalSpent,
          visits: data.visits,
          lastVisit: data.lastVisit,
          tier: (
            data.totalSpent >= 2000 ? 'Platinum' :
            data.totalSpent >= 1000 ? 'Gold' :
            data.totalSpent >= 500 ? 'Silver' : 'Bronze'
          ) as TopClient['tier'],
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    return clients;
  } catch (error) {
    console.error('Error fetching top clients:', error);
    return [];
  }
}

export async function getAllClients(): Promise<Client[]> {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Get booking counts for each client
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('client_id, status, start_at')
      .eq('status', 'completed');

    if (bookingsError) throw bookingsError;

    const bookingStats = new Map<string, { visits: number; lastVisit: string; totalSpent: number }>();
    
    bookings?.forEach(booking => {
      const existing = bookingStats.get(booking.client_id);
      const spent = 500;
      
      if (existing) {
        existing.visits += 1;
        existing.totalSpent += spent;
        if (new Date(booking.start_at) > new Date(existing.lastVisit)) {
          existing.lastVisit = booking.start_at;
        }
      } else {
        bookingStats.set(booking.client_id, {
          visits: 1,
          totalSpent: spent,
          lastVisit: booking.start_at,
        });
      }
    });

    return (profiles || []).map(profile => {
      const stats = bookingStats.get(profile.id);
      const totalSpent = stats?.totalSpent || 0;
      
      return {
        id: profile.id,
        email: profile.email || '',
        full_name: profile.email?.split('@')[0],
        phone: undefined,
        total_visits: stats?.visits || 0,
        total_spent: totalSpent,
        last_visit: stats?.lastVisit,
        tier: (
          totalSpent >= 2000 ? 'Platinum' :
          totalSpent >= 1000 ? 'Gold' :
          totalSpent >= 500 ? 'Silver' : 'Bronze'
        ) as Client['tier'],
        created_at: profile.created_at,
      };
    });
  } catch (error) {
    console.error('Error fetching all clients:', error);
    return [];
  }
}

// ============= REVENUE =============

export async function getWeeklyRevenue(): Promise<RevenueData[]> {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('bookings')
      .select('created_at, service_id, status')
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('status', 'completed');

    if (error) throw error;

    // Group by date
    const revenueMap = new Map<string, number>();
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Initialize all days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueMap.set(dateStr, 0);
    }

    // Add actual revenue
    data?.forEach(booking => {
      const date = new Date(booking.created_at);
      const dateStr = date.toISOString().split('T')[0];
      const current = revenueMap.get(dateStr) || 0;
      revenueMap.set(dateStr, current + 500);
    });

    // Convert to array
    return Array.from(revenueMap.entries()).map(([date, amount]) => {
      const dayIndex = new Date(date).getDay();
      return {
        date,
        amount,
        dayLabel: dayLabels[dayIndex === 0 ? 6 : dayIndex - 1],
      };
    });
  } catch (error) {
    console.error('Error fetching weekly revenue:', error);
    return [];
  }
}

// ============= ANALYTICS =============

export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  clientRetentionRate: number;
  popularServices: Array<{ name: string; count: number; revenue: number }>;
  peakHours: Array<{ hour: string; count: number }>;
  monthlyTrend: Array<{ month: string; revenue: number; bookings: number }>;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
    const totalRevenue = completedBookings.length * 500;
    const totalBookings = bookings?.length || 0;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate retention (clients with 2+ bookings)
    const clientBookingCounts = new Map<string, number>();
    bookings?.forEach(b => {
      clientBookingCounts.set(b.client_id, (clientBookingCounts.get(b.client_id) || 0) + 1);
    });
    const returningClients = Array.from(clientBookingCounts.values()).filter(count => count >= 2).length;
    const clientRetentionRate = clientBookingCounts.size > 0 
      ? (returningClients / clientBookingCounts.size) * 100 
      : 0;

    // Popular services
    const serviceMap = new Map<number, number>();
    completedBookings.forEach(b => {
      serviceMap.set(b.service_id, (serviceMap.get(b.service_id) || 0) + 1);
    });
    const popularServices = Array.from(serviceMap.entries())
      .map(([serviceId, count]) => ({
        name: `Service #${serviceId}`,
        count,
        revenue: count * 500,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Peak hours
    const hourMap = new Map<string, number>();
    bookings?.forEach(b => {
      const hour = new Date(b.start_at).getHours();
      const hourStr = `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`;
      hourMap.set(hourStr, (hourMap.get(hourStr) || 0) + 1);
    });
    const peakHours = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly trend (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { revenue: number; bookings: number }>();
    
    bookings?.forEach(b => {
      const date = new Date(b.created_at);
      const monthKey = `${monthNames[date.getMonth()]}`;
      const existing = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0 };
      monthlyMap.set(monthKey, {
        revenue: existing.revenue + (b.status === 'completed' ? 500 : 0),
        bookings: existing.bookings + 1,
      });
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);

    return {
      totalRevenue,
      totalBookings,
      averageBookingValue,
      clientRetentionRate,
      popularServices,
      peakHours,
      monthlyTrend,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      totalRevenue: 0,
      totalBookings: 0,
      averageBookingValue: 0,
      clientRetentionRate: 0,
      popularServices: [],
      peakHours: [],
      monthlyTrend: [],
    };
  }
}

