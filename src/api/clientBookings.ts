import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails } from './admin';

// Get all bookings for a specific client
export async function getClientBookings(clientId: string): Promise<AppointmentWithDetails[]> {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', clientId)
      .order('start_at', { ascending: false });

    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    // Fetch related data
    const serviceIds = [...new Set(bookings.map(b => b.service_id))];
    const shopIds = [...new Set(bookings.map(b => b.shop_id || b.salon_id).filter(Boolean))];
    
    const [servicesResult, shopsResult] = await Promise.all([
      supabase
        .from('services')
        .select('id, name, price')
        .in('id', serviceIds),
      shopIds.length > 0 ? supabase
        .from('shops')
        .select('id, name, address')
        .in('id', shopIds) : Promise.resolve({ data: [], error: null })
    ]);

    const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s]));
    const shopMap = new Map((shopsResult.data || []).map(s => [s.id, s]));

    return bookings.map(booking => {
      const service = serviceMap.get(booking.service_id);
      const shopId = booking.shop_id || booking.salon_id;
      const shop = shopId ? shopMap.get(shopId) : null;
      
      return {
        ...booking,
        service_name: service?.name || `Service #${booking.service_id}`,
        service_price: service?.price || 500,
        shop_name: shop?.name || (shopId ? `Salon #${shopId}` : 'Unknown Location'),
        shop_address: shop?.address || '',
      } as AppointmentWithDetails & { shop_name?: string; shop_address?: string };
    });
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    return [];
  }
}

// Create booking for a client (admin/staff can book for clients)
export async function createBookingForClient(booking: {
  client_id: string;
  service_id: string;
  shop_id: string;
  start_at: string;
  notes?: string;
}): Promise<AppointmentWithDetails> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        client_id: booking.client_id,
        service_id: booking.service_id,
        shop_id: booking.shop_id,
        start_at: booking.start_at,
        status: 'pending',
        notes: booking.notes || 'Walk-in booking',
      }])
      .select('*')
      .single();

    if (error) {
      if (
        error.code === 'P0001' &&
        typeof error.message === 'string' &&
        error.message.includes('DAILY_APPOINTMENT_LIMIT_REACHED')
      ) {
        throw new Error('Daily booking limit reached (100 appointments). Please select another date.');
      }
      throw error;
    }

    // Fetch related data
    const [serviceResult, shopResult, profileResult] = await Promise.all([
      supabase.from('services').select('id, name, price').eq('id', booking.service_id).single(),
      supabase.from('shops').select('id, name, address').eq('id', booking.shop_id).single(),
      supabase.from('profiles').select('id, email').eq('id', booking.client_id).single(),
    ]);

    const service = serviceResult.data;
    const shop = shopResult.data;
    const profile = profileResult.data;

    return {
      ...data,
      client_email: profile?.email || 'Unknown',
      client_name: profile?.email?.split('@')[0] || 'Client',
      service_name: service?.name || `Service #${booking.service_id}`,
      service_price: service?.price || 500,
      shop_name: shop?.name || `Salon #${booking.shop_id}`,
      shop_address: shop?.address || '',
    } as AppointmentWithDetails & { shop_name?: string; shop_address?: string };
  } catch (error) {
    console.error('Error creating booking for client:', error);
    throw error;
  }
}

