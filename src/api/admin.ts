import { supabase } from '../lib/supabase';

// ============= TYPES =============

export interface DashboardStats {
  todayRevenue: number;
  totalRevenue: number; // Total revenue from all completed bookings
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
  service_id: string | number; // Can be UUID (string) or number
  salon_id?: string | number; // Can be UUID (string) or number, optional since shop_id can be NULL
  shop_id?: string; // Actual database column name
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
  staff_id?: string; // Staff assignment
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

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    // Get today's bookings with service prices
    const { data: todayBookings, error: todayError } = await supabase
      .from('bookings')
      .select('service_id, status, start_at')
      .gte('start_at', todayStr)
      .lt('start_at', tomorrowStr);

    if (todayError) throw todayError;

    // Get yesterday's bookings with service prices
    const { data: yesterdayBookings, error: yesterdayError } = await supabase
      .from('bookings')
      .select('service_id, status, start_at')
      .gte('start_at', yesterdayStr)
      .lt('start_at', todayStr);

    if (yesterdayError) throw yesterdayError;

    // Get service IDs and fetch prices
    const todayServiceIds = [...new Set((todayBookings || []).map(b => b.service_id).filter(Boolean))];
    const yesterdayServiceIds = [...new Set((yesterdayBookings || []).map(b => b.service_id).filter(Boolean))];
    const allServiceIds = [...new Set([...todayServiceIds, ...yesterdayServiceIds])];

    // Fetch service prices
    let servicePriceMap = new Map();
    if (allServiceIds.length > 0) {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, price')
        .in('id', allServiceIds);

      if (!servicesError && services) {
        servicePriceMap = new Map(services.map(s => [s.id, s.price || 500]));
      }
    }

    // Calculate today's revenue (only from completed bookings)
    const todayRevenue = (todayBookings || [])
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => {
        const price = servicePriceMap.get(b.service_id) || 500;
        return sum + price;
      }, 0);

    // Get total appointments for today (all statuses)
    const totalAppointments = (todayBookings || []).length;

    // Get yesterday's appointments count
    const yesterdayAppointments = (yesterdayBookings || []).length;
    const appointmentsChange = yesterdayAppointments > 0
      ? Math.round(((totalAppointments - yesterdayAppointments) / yesterdayAppointments) * 100)
      : (totalAppointments > 0 ? 100 : 0);

    // Get active clients (clients with bookings in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeClientsData, error: clientsError } = await supabase
      .from('bookings')
      .select('client_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (clientsError) throw clientsError;

    // Get active clients from 30-60 days ago for comparison
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const { data: previousClientsData, error: prevClientsError } = await supabase
      .from('bookings')
      .select('client_id')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (prevClientsError) throw prevClientsError;

    const uniqueClients = new Set((activeClientsData || []).map(b => b.client_id));
    const activeClients = uniqueClients.size;

    const previousUniqueClients = new Set((previousClientsData || []).map(b => b.client_id));
    const previousActiveClients = previousUniqueClients.size;
    
    const clientsChange = previousActiveClients > 0
      ? Math.round(((activeClients - previousActiveClients) / previousActiveClients) * 100)
      : (activeClients > 0 ? 100 : 0);

    // Calculate staff utilization based on appointments vs available staff
    const { data: staffData, error: staffError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'staff');

    if (staffError) throw staffError;

    const totalStaff = (staffData || []).length;
    const staffWithAppointments = new Set(
      (todayBookings || [])
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .map(b => b.service_id) // This is approximate - ideally we'd have staff_id
    ).size;

    // Calculate utilization: appointments per staff member (capped at 100%)
    const staffUtilization = totalStaff > 0
      ? Math.min(Math.round((staffWithAppointments / totalStaff) * 100), 100)
      : 0;

    // Get previous day's staff utilization for comparison
    const previousStaffWithAppointments = new Set(
      (yesterdayBookings || [])
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .map(b => b.service_id)
    ).size;

    const previousUtilization = totalStaff > 0
      ? Math.min(Math.round((previousStaffWithAppointments / totalStaff) * 100), 100)
      : 0;

    const utilizationChange = previousUtilization > 0
      ? Math.round(((staffUtilization - previousUtilization) / previousUtilization) * 100)
      : (staffUtilization > 0 ? 100 : 0);

    // Calculate total revenue from all completed bookings
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select('service_id, status')
      .eq('status', 'completed');

    if (allBookingsError) {
      console.error('Error fetching all bookings for total revenue:', allBookingsError);
    }

    // Get all service IDs for total revenue calculation
    const allCompletedServiceIds = [...new Set((allBookings || []).map(b => b.service_id).filter(Boolean))];
    let allServicePriceMap = new Map();
    
    if (allCompletedServiceIds.length > 0) {
      const { data: allServices, error: allServicesError } = await supabase
        .from('services')
        .select('id, price')
        .in('id', allCompletedServiceIds);

      if (!allServicesError && allServices) {
        allServicePriceMap = new Map(allServices.map(s => [s.id, s.price || 500]));
      }
    }

    // Calculate total revenue from all completed bookings
    const totalRevenue = (allBookings || []).reduce((sum, b) => {
      const price = allServicePriceMap.get(b.service_id) || 500;
      return sum + price;
    }, 0);

    // Calculate revenue change: compare this month vs last month
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);
    const oneMonthAgoStr = oneMonthAgo.toISOString();

    const twoMonthsAgo = new Date(oneMonthAgo);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);
    const twoMonthsAgoStr = twoMonthsAgo.toISOString();

    // This month's revenue (from one month ago to today)
    const { data: thisMonthBookings, error: thisMonthError } = await supabase
      .from('bookings')
      .select('service_id, status')
      .eq('status', 'completed')
      .gte('created_at', oneMonthAgoStr)
      .lt('created_at', tomorrowStr);

    if (thisMonthError) {
      console.error('Error fetching this month bookings:', thisMonthError);
    }

    const thisMonthRevenue = (thisMonthBookings || []).reduce((sum, b) => {
      const price = allServicePriceMap.get(b.service_id) || 500;
      return sum + price;
    }, 0);

    // Last month's revenue (from two months ago to one month ago)
    const { data: lastMonthBookings, error: lastMonthError } = await supabase
      .from('bookings')
      .select('service_id, status')
      .eq('status', 'completed')
      .gte('created_at', twoMonthsAgoStr)
      .lt('created_at', oneMonthAgoStr);

    if (lastMonthError) {
      console.error('Error fetching last month bookings:', lastMonthError);
    }

    const lastMonthRevenue = (lastMonthBookings || []).reduce((sum, b) => {
      const price = allServicePriceMap.get(b.service_id) || 500;
      return sum + price;
    }, 0);

    // Calculate percentage change: (this month - last month) / last month * 100
    const totalRevenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : (thisMonthRevenue > 0 ? 100 : 0);

    return {
      todayRevenue,
      totalRevenue,
      revenueChange: totalRevenueChange,
      totalAppointments,
      appointmentsChange,
      activeClients,
      clientsChange,
      staffUtilization,
      utilizationChange,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      todayRevenue: 0,
      totalRevenue: 0,
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

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return [];
    }
    
    if (!bookings || bookings.length === 0) {
      return [];
    }

    // Fetch related data in parallel - filter out null/undefined IDs
    const clientIds = [...new Set(bookings.map(b => b.client_id).filter(Boolean))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))];
    
    const [profilesResult, servicesResult] = await Promise.all([
      clientIds.length > 0 ? supabase
        .from('profiles')
        .select('id, email')
        .in('id', clientIds) : Promise.resolve({ data: [], error: null }),
      serviceIds.length > 0 ? supabase
        .from('services')
        .select('id, name, price')
        .in('id', serviceIds) : Promise.resolve({ data: [], error: null })
    ]);

    if (profilesResult.error) {
      console.error('Error fetching profiles:', profilesResult.error);
    }
    if (servicesResult.error) {
      console.error('Error fetching services:', servicesResult.error);
    }

    // Create lookup maps
    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.email]));
    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s]));

    const result = bookings.map(booking => {
      const clientEmail = profileMap.get(booking.client_id) || 'Unknown Client';
      const service = serviceMap.get(booking.service_id);
      
      // Ensure we have a valid status (default to 'pending' if missing)
      const status = booking.status || 'pending';
      
      // Handle both shop_id (actual DB column) and salon_id (legacy/alias)
      const shopId = booking.shop_id || booking.salon_id;
      
      return {
        id: booking.id,
        client_id: booking.client_id,
        service_id: booking.service_id, // Keep as-is (UUID string)
        salon_id: shopId, // Map shop_id to salon_id for compatibility
        shop_id: shopId, // Also include shop_id directly
        start_at: booking.start_at,
        end_at: booking.end_at,
        status: status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        notes: booking.notes,
        created_at: booking.created_at,
        staff_id: booking.staff_id, // Include staff assignment
        client_email: clientEmail,
        client_name: clientEmail !== 'Unknown Client' ? clientEmail.split('@')[0] : 'Unknown Client',
        service_name: service?.name || `Service #${String(booking.service_id).slice(0, 8)}`,
        service_price: service?.price || 500,
      } as AppointmentWithDetails;
    });

    return result;
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    // Return empty array on error to prevent crashes
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
            data.visits >= 26 ? 'Platinum' :
            data.visits >= 11 ? 'Gold' :
            data.visits >= 6 ? 'Silver' : 'Bronze'
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

    // Get only completed bookings to match getTopClients logic (only completed bookings generate revenue)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('client_id, service_id, status, start_at')
      .eq('status', 'completed');

    if (bookingsError) throw bookingsError;

    // Get service IDs and fetch prices
    const serviceIds = [...new Set((bookings || []).map(b => b.service_id).filter(Boolean))];
    let servicePriceMap = new Map();
    
    if (serviceIds.length > 0) {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, price')
        .in('id', serviceIds);

      if (!servicesError && services) {
        servicePriceMap = new Map(services.map(s => [s.id, s.price || 500]));
      }
    }

    const bookingStats = new Map<string, { visits: number; lastVisit: string; totalSpent: number }>();
    
    bookings?.forEach(booking => {
      const existing = bookingStats.get(booking.client_id);
      // Use actual service price, matching getTopClients logic
      const spent = servicePriceMap.get(booking.service_id) || 500;
      
      if (existing) {
        existing.visits += 1;
        existing.totalSpent += spent;
        if (booking.start_at && new Date(booking.start_at) > new Date(existing.lastVisit)) {
          existing.lastVisit = booking.start_at;
        }
      } else {
        bookingStats.set(booking.client_id, {
          visits: 1,
          totalSpent: spent,
          lastVisit: booking.start_at || new Date().toISOString(),
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
          (stats?.visits || 0) >= 26 ? 'Platinum' :
          (stats?.visits || 0) >= 11 ? 'Gold' :
          (stats?.visits || 0) >= 6 ? 'Silver' : 'Bronze'
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

    // Get service IDs and fetch service data
    const serviceIds = [...new Set((bookings || []).map(b => b.service_id).filter(Boolean))];
    let serviceMap = new Map();
    
    if (serviceIds.length > 0) {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, price')
        .in('id', serviceIds);

      if (!servicesError && services) {
        serviceMap = new Map(services.map(s => [s.id, { name: s.name, price: s.price || 500 }]));
      }
    }

    const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
    
    // Calculate revenue using actual service prices
    const totalRevenue = completedBookings.reduce((sum, b) => {
      const service = serviceMap.get(b.service_id);
      const price = service?.price || 500;
      return sum + price;
    }, 0);
    
    const totalBookings = bookings?.length || 0;
    const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

    // Calculate retention (clients with 2+ bookings)
    const clientBookingCounts = new Map<string, number>();
    bookings?.forEach(b => {
      clientBookingCounts.set(b.client_id, (clientBookingCounts.get(b.client_id) || 0) + 1);
    });
    const returningClients = Array.from(clientBookingCounts.values()).filter(count => count >= 2).length;
    const clientRetentionRate = clientBookingCounts.size > 0 
      ? Math.round((returningClients / clientBookingCounts.size) * 100)
      : 0;

    // Popular services with actual names and revenue
    const serviceCountMap = new Map<number, number>();
    const serviceRevenueMap = new Map<number, number>();
    
    completedBookings.forEach(b => {
      const service = serviceMap.get(b.service_id);
      const price = service?.price || 500;
      serviceCountMap.set(b.service_id, (serviceCountMap.get(b.service_id) || 0) + 1);
      serviceRevenueMap.set(b.service_id, (serviceRevenueMap.get(b.service_id) || 0) + price);
    });
    
    const popularServices = Array.from(serviceCountMap.entries())
      .map(([serviceId, count]) => {
        const service = serviceMap.get(serviceId);
        return {
          name: service?.name || `Service #${serviceId}`,
          count,
          revenue: serviceRevenueMap.get(serviceId) || 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Peak hours
    const hourMap = new Map<string, number>();
    bookings?.forEach(b => {
      if (b.start_at) {
        const hour = new Date(b.start_at).getHours();
        const hourStr = `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`;
        hourMap.set(hourStr, (hourMap.get(hourStr) || 0) + 1);
      }
    });
    const peakHours = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly trend (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { revenue: number; bookings: number }>();
    
    bookings?.forEach(b => {
      if (b.created_at) {
        const date = new Date(b.created_at);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        const existing = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0 };
        const service = serviceMap.get(b.service_id);
        const price = (b.status === 'completed' ? (service?.price || 500) : 0);
        monthlyMap.set(monthKey, {
          revenue: existing.revenue + price,
          bookings: existing.bookings + 1,
        });
      }
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        // Sort by date
        const aDate = new Date(a.month + ' 1');
        const bDate = new Date(b.month + ' 1');
        return aDate.getTime() - bDate.getTime();
      })
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

