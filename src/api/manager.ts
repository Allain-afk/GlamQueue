import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails, StaffMember, Client, DashboardStats } from './admin';

// Get manager's shop_id from shops table (manager is the owner)
async function getManagerShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get shops owned by this user (manager)
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error getting manager shop:', error);
    return null;
  }
  
  return data?.id || null;
}

// ============= DASHBOARD STATS (Shop-specific) =============

export async function getManagerDashboardStats(): Promise<DashboardStats> {
  try {
    const shopId = await getManagerShopId();
    if (!shopId) {
      throw new Error('No shop found for this manager');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    // Get today's bookings for this shop
    const { data: todayBookings, error: todayError } = await supabase
      .from('bookings')
      .select('service_id')
      .eq('shop_id', shopId)
      .gte('created_at', todayStr);

    if (todayError) throw todayError;

    // Get yesterday's bookings
    const { data: yesterdayBookings, error: yesterdayError } = await supabase
      .from('bookings')
      .select('service_id')
      .eq('shop_id', shopId)
      .gte('created_at', yesterdayStr)
      .lt('created_at', todayStr);

    if (yesterdayError) throw yesterdayError;

    // Fetch service prices for today's bookings
    const todayServiceIds = [...new Set((todayBookings || []).map(b => b.service_id))];
    const { data: todayServices } = todayServiceIds.length > 0
      ? await supabase
          .from('services')
          .select('id, price')
          .in('id', todayServiceIds)
      : { data: [] };
    
    const todayServiceMap = new Map((todayServices || []).map(s => [s.id, s.price]));

    // Fetch service prices for yesterday's bookings
    const yesterdayServiceIds = [...new Set((yesterdayBookings || []).map(b => b.service_id))];
    const { data: yesterdayServices } = yesterdayServiceIds.length > 0
      ? await supabase
          .from('services')
          .select('id, price')
          .in('id', yesterdayServiceIds)
      : { data: [] };
    
    const yesterdayServiceMap = new Map((yesterdayServices || []).map(s => [s.id, s.price]));

    // Calculate revenue
    const todayRevenue = (todayBookings || []).reduce((sum, b) => {
      const price = todayServiceMap.get(b.service_id) || 500;
      return sum + price;
    }, 0);
    
    const yesterdayRevenue = (yesterdayBookings || []).reduce((sum, b) => {
      const price = yesterdayServiceMap.get(b.service_id) || 500;
      return sum + price;
    }, 0);
    
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;

    // Get total appointments
    const { count: totalAppointments } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .gte('start_at', todayStr);

    // Get active clients (clients with bookings in last 30 days for this shop)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeClientsData } = await supabase
      .from('bookings')
      .select('client_id')
      .eq('shop_id', shopId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const uniqueClients = new Set(activeClientsData?.map(b => b.client_id) || []);
    const activeClients = uniqueClients.size;

    // Staff utilization (mock for now)
    const staffUtilization = 85;

    return {
      todayRevenue,
      totalRevenue: todayRevenue, // For manager, totalRevenue is same as todayRevenue for their shop
      revenueChange: Math.round(revenueChange),
      totalAppointments: totalAppointments || 0,
      appointmentsChange: 18,
      activeClients,
      clientsChange: 24,
      staffUtilization,
      utilizationChange: 5,
    };
  } catch (error) {
    console.error('Error fetching manager dashboard stats:', error);
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

// ============= APPOINTMENTS (Shop-specific) =============

export async function getManagerAppointments(limit = 50): Promise<AppointmentWithDetails[]> {
  try {
    const shopId = await getManagerShopId();
    if (!shopId) {
      console.log('No shop found for manager');
      return [];
    }

    // Fetch bookings for this shop only
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('shop_id', shopId)
      .order('start_at', { ascending: false })
      .limit(limit);
    
    if (bookingsError) {
      console.error('Error fetching manager bookings:', bookingsError);
      throw bookingsError;
    }
    
    if (!bookings || bookings.length === 0) {
      return [];
    }

    // Fetch related data in parallel
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    
    const [profilesResult, servicesResult, shopResult] = await Promise.all([
      // Fetch client profiles
      supabase
        .from('profiles')
        .select('id, email')
        .in('id', clientIds),
      // Fetch services
      supabase
        .from('services')
        .select('id, name, price')
        .in('id', serviceIds),
      // Fetch shop info
      supabase
        .from('shops')
        .select('id, name')
        .eq('id', shopId)
        .maybeSingle()
    ]);

    if (profilesResult.error) console.error('Error fetching profiles:', profilesResult.error);
    if (servicesResult.error) console.error('Error fetching services:', servicesResult.error);
    if (shopResult.error) console.error('Error fetching shop:', shopResult.error);

    // Create lookup maps
    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.email]));
    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s]));

    // Map bookings to AppointmentWithDetails
    return bookings.map(booking => {
      const clientEmail = profileMap.get(booking.client_id) || 'Unknown';
      const service = serviceMap.get(booking.service_id);
      
      return {
        id: booking.id,
        client_id: booking.client_id,
        service_id: booking.service_id,
        salon_id: booking.shop_id,
        start_at: booking.start_at,
        end_at: booking.end_at,
        status: booking.status,
        notes: booking.notes,
        created_at: booking.created_at,
        client_email: clientEmail,
        client_name: clientEmail.split('@')[0] || 'Client',
        service_name: service?.name || `Service #${booking.service_id}`,
        service_price: service?.price || 500,
      } as AppointmentWithDetails;
    });
  } catch (error) {
    console.error('Error fetching manager appointments:', error);
    return [];
  }
}

// ============= STAFF (Shop-specific) =============

export async function getManagerStaff(): Promise<StaffMember[]> {
  try {
    const shopId = await getManagerShopId();
    if (!shopId) return [];

    // Get shop name to determine staff email pattern
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name')
      .eq('id', shopId)
      .maybeSingle();

    if (shopError) throw shopError;
    if (!shop) return [];

    // Map shop names to email patterns
    // Staff emails follow pattern: staff{N}.{shopkey}@glamqueue.com
    const shopEmailPatterns: Record<string, string> = {
      'Glam Studio Cebu': 'glamstudio',
      'Beauty Lounge IT Park': 'beautylounge',
      'Nail Spa Mandaue': 'nailspa',
      // Fallback patterns for other shop names
      'Glam Studio': 'glamstudio',
      'Beauty Lounge': 'beautylounge',
      'Nail Spa': 'nailspa',
    };

    // Find matching pattern
    const shopKey = Object.entries(shopEmailPatterns).find(([name]) => 
      shop.name.toLowerCase().includes(name.toLowerCase())
    )?.[1];

    if (!shopKey) {
      console.warn(`No email pattern found for shop: ${shop.name}`);
      return [];
    }

    // Fetch all staff with emails matching the shop pattern
    const { data: allStaff, error: staffError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'staff')
      .like('email', `%${shopKey}@glamqueue.com`)
      .order('created_at', { ascending: false });

    if (staffError) throw staffError;
    if (!allStaff || allStaff.length === 0) return [];

    // Get staff assignments from bookings to determine status and next appointment
    const { data: bookings } = await supabase
      .from('bookings')
      .select('staff_id, start_at, status')
      .eq('shop_id', shopId)
      .in('staff_id', allStaff.map(s => s.id))
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(50);

    // Create a map of staff to their next appointment
    const staffNextAppointment = new Map<string, string>();
    bookings?.forEach(booking => {
      if (booking.staff_id && !staffNextAppointment.has(booking.staff_id)) {
        const date = new Date(booking.start_at);
        staffNextAppointment.set(booking.staff_id, date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }));
      }
    });

    // Map profiles to StaffMember format
    return allStaff.map((profile, index) => {
      const hasUpcomingAppointment = staffNextAppointment.has(profile.id);
      const statuses: ('available' | 'busy' | 'break')[] = 
        hasUpcomingAppointment ? ['busy', 'available'] : ['available', 'break'];
      
      // Extract a nicer name from email (e.g., "staff1.glamstudio" -> "Staff 1")
      const emailPrefix = profile.email?.split('@')[0] || '';
      const staffNumber = emailPrefix.match(/staff(\d+)/)?.[1] || '';
      const displayName = staffNumber ? `Staff ${staffNumber}` : emailPrefix.replace(/staff\d+\./, '').replace(/\./g, ' ') || 'Staff Member';
      
      return {
        id: profile.id,
        name: displayName,
        email: profile.email || '',
        role: 'Specialist',
        status: statuses[index % statuses.length],
        rating: 4.5 + Math.random() * 0.5,
        next_appointment: staffNextAppointment.get(profile.id),
      };
    });
  } catch (error) {
    console.error('Error fetching manager staff:', error);
    return [];
  }
}

// ============= CLIENTS (Shop-specific) =============

export async function getManagerClients(): Promise<Client[]> {
  try {
    const shopId = await getManagerShopId();
    if (!shopId) return [];

    // Get all bookings for this shop
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('client_id, status, start_at, service_id')
      .eq('shop_id', shopId)
      .eq('status', 'completed');

    if (bookingsError) throw bookingsError;
    if (!bookings || bookings.length === 0) return [];

    // Fetch related data in parallel
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    
    const [profilesResult, servicesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, created_at')
        .in('id', clientIds),
      supabase
        .from('services')
        .select('id, price')
        .in('id', serviceIds)
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (servicesResult.error) throw servicesResult.error;

    // Create lookup maps
    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p]));
    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s.price]));

    // Group by client
    const clientMap = new Map<string, {
      email: string;
      visits: number;
      totalSpent: number;
      lastVisit: string;
      created_at: string;
    }>();

    bookings.forEach(booking => {
      const existing = clientMap.get(booking.client_id);
      const price = serviceMap.get(booking.service_id) || 500;
      const profile = profileMap.get(booking.client_id);
      
      if (existing) {
        existing.visits += 1;
        existing.totalSpent += price;
        if (new Date(booking.start_at) > new Date(existing.lastVisit)) {
          existing.lastVisit = booking.start_at;
        }
      } else {
        clientMap.set(booking.client_id, {
          email: profile?.email || 'unknown@example.com',
          visits: 1,
          totalSpent: price,
          lastVisit: booking.start_at,
          created_at: profile?.created_at || new Date().toISOString(),
        });
      }
    });

    return Array.from(clientMap.entries()).map(([id, data]) => {
      const totalSpent = data.totalSpent;
      return {
        id,
        email: data.email,
        full_name: data.email.split('@')[0],
        phone: undefined,
        total_visits: data.visits,
        total_spent: totalSpent,
        last_visit: data.lastVisit,
        tier: (
          totalSpent >= 2000 ? 'Platinum' :
          totalSpent >= 1000 ? 'Gold' :
          totalSpent >= 500 ? 'Silver' : 'Bronze'
        ) as Client['tier'],
        created_at: data.created_at,
      };
    });
  } catch (error) {
    console.error('Error fetching manager clients:', error);
    return [];
  }
}

