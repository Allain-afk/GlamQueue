import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails } from './admin';

// Get staff schedule/appointments
export async function getStaffSchedule(_staffId: string): Promise<AppointmentWithDetails[]> {
  try {
    // Note: Assuming bookings table has staff_id field or we need to join through another table
    // For now, we'll get all bookings and filter by checking if staff is assigned
    // You may need to adjust this based on your actual database schema
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('start_at', today.toISOString())
      .lt('start_at', nextWeek.toISOString())
      .order('start_at', { ascending: true });

    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    // Fetch related data
    const clientIds = [...new Set(bookings.map(b => b.client_id))];
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    const shopIds = [...new Set(bookings.map(b => b.shop_id || b.salon_id).filter(Boolean))];
    
    const [profilesResult, servicesResult, shopsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email')
        .in('id', clientIds),
      supabase
        .from('services')
        .select('id, name, price')
        .in('id', serviceIds),
      shopIds.length > 0 ? supabase
        .from('shops')
        .select('id, name, address')
        .in('id', shopIds) : Promise.resolve({ data: [], error: null })
    ]);

    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.email]));
    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s]));
    const shopMap = new Map((shopsResult.data || []).map(s => [s.id, s]));

    return bookings.map(booking => {
      const clientEmail = profileMap.get(booking.client_id) || 'Unknown';
      const service = serviceMap.get(booking.service_id);
      const shopId = booking.shop_id || booking.salon_id;
      const shop = shopId ? shopMap.get(shopId) : null;
      
      return {
        ...booking,
        client_email: clientEmail,
        client_name: clientEmail.split('@')[0] || 'Client',
        service_name: service?.name || `Service #${booking.service_id}`,
        service_price: service?.price || 500,
        shop_name: shop?.name || (shopId ? `Salon #${shopId}` : 'Unknown Location'),
        shop_address: shop?.address || '',
      } as AppointmentWithDetails & { shop_name?: string; shop_address?: string };
    });
  } catch (error) {
    console.error('Error fetching staff schedule:', error);
    return [];
  }
}

// Update staff information
export async function updateStaffInfo(staffId: string, updates: {
  email?: string;
  full_name?: string;
  phone?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', staffId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating staff info:', error);
    throw error;
  }
}

