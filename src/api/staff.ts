import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails } from './admin';

// Get staff's assigned shop_id based on their email pattern
async function getStaffShopId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get staff profile to check email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .eq('role', 'staff')
    .maybeSingle();

  if (!profile?.email) return null;

  // Map email patterns to shop names (same as manager logic)
  const emailPatterns: Record<string, string> = {
    'glamstudio': 'Glam Studio Cebu',
    'beautylounge': 'Beauty Lounge IT Park',
    'nailspa': 'Nail Spa Mandaue',
  };

  // Find matching pattern
  const shopKey = Object.keys(emailPatterns).find(key => 
    profile.email.includes(key)
  );

  if (!shopKey) {
    console.warn(`No shop pattern found for staff email: ${profile.email}`);
    return null;
  }

  const shopName = emailPatterns[shopKey];

  // Get shop ID from shops table
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .ilike('name', `%${shopName}%`)
    .limit(1)
    .maybeSingle();

  if (shopError) {
    console.error('Error fetching staff shop:', shopError);
    return null;
  }

  return shop?.id || null;
}

// ============= APPOINTMENTS (Staff-specific) =============

export async function getStaffAppointments(): Promise<AppointmentWithDetails[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get staff's shop_id
    const shopId = await getStaffShopId();
    if (!shopId) {
      console.warn('No shop found for staff member');
      return [];
    }

    // Fetch ALL bookings for this shop (not just assigned ones)
    // Staff should see all bookings for their shop so they can assign themselves
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('shop_id', shopId)
      .order('start_at', { ascending: true });
    
    if (bookingsError) {
      console.error('Error fetching staff bookings:', bookingsError);
      throw bookingsError;
    }
    
    if (!bookings || bookings.length === 0) {
      return [];
    }

    // Fetch related data in parallel
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    const shopIds = [...new Set(bookings.map(b => b.shop_id))];
    
    const [profilesResult, servicesResult, shopsResult] = await Promise.all([
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
      // Fetch shops
      supabase
        .from('shops')
        .select('id, name')
        .in('id', shopIds)
    ]);

    if (profilesResult.error) console.error('Error fetching profiles:', profilesResult.error);
    if (servicesResult.error) console.error('Error fetching services:', servicesResult.error);
    if (shopsResult.error) console.error('Error fetching shops:', shopsResult.error);

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
    console.error('Error fetching staff appointments:', error);
    return [];
  }
}

// Get today's appointments for staff
export async function getStaffTodayAppointments(): Promise<AppointmentWithDetails[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get staff's shop_id
    const shopId = await getStaffShopId();
    if (!shopId) {
      console.warn('No shop found for staff member');
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch ALL today's bookings for this shop (not just assigned ones)
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('shop_id', shopId)
      .gte('start_at', today.toISOString())
      .lt('start_at', tomorrow.toISOString())
      .order('start_at', { ascending: true });
    
    if (bookingsError) {
      console.error('Error fetching staff today bookings:', bookingsError);
      throw bookingsError;
    }
    
    if (!bookings || bookings.length === 0) {
      return [];
    }

    // Fetch related data in parallel
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    const shopIds = [...new Set(bookings.map(b => b.shop_id))];
    
    const [profilesResult, servicesResult, shopsResult] = await Promise.all([
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
      // Fetch shops
      supabase
        .from('shops')
        .select('id, name')
        .in('id', shopIds)
    ]);

    if (profilesResult.error) console.error('Error fetching profiles:', profilesResult.error);
    if (servicesResult.error) console.error('Error fetching services:', servicesResult.error);
    if (shopsResult.error) console.error('Error fetching shops:', shopsResult.error);

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
    console.error('Error fetching staff today appointments:', error);
    return [];
  }
}

// Update booking status (for staff to approve/complete)
export async function updateBookingStatus(
  bookingId: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // When staff confirms a booking, assign it to themselves if not already assigned
  const updateData: { status: string; updated_at: string; staff_id?: string } = {
    status,
    updated_at: new Date().toISOString()
  };

  // If confirming and booking doesn't have staff_id, assign to current staff
  if (status === 'confirmed') {
    // Check current booking to see if it has staff_id
    const { data: booking } = await supabase
      .from('bookings')
      .select('staff_id')
      .eq('id', bookingId)
      .maybeSingle();
    
    // If no staff assigned, assign to current staff member
    if (!booking?.staff_id) {
      updateData.staff_id = user.id;
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId);

  if (error) throw error;
}

// Assign booking to staff
export async function assignBookingToStaff(
  bookingId: number,
  staffId: string
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ 
      staff_id: staffId,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId);

  if (error) throw error;
}

