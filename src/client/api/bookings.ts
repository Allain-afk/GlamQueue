import { supabase } from '../../lib/supabase';
import type { Booking, BookingStatus } from '../types';

// Database response types
interface DatabaseBooking {
  id: string | number;
  client_id: string;
  service_id: string | number;
  shop_id: string | number;
  start_at: string;
  end_at?: string | null;
  status: BookingStatus;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  service?: {
    id: string | number;
    name: string;
    price: number | string;
    duration: number;
    [key: string]: unknown;
  } | null;
  shop?: {
    id: string | number;
    name: string;
    address: string;
    [key: string]: unknown;
  } | null;
}

export async function createBooking(booking: {
  service_id: string;
  shop_id: string;
  date_time: string;
  notes?: string;
}): Promise<Booking> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Validate that service_id and shop_id are valid UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(booking.service_id)) {
    throw new Error(`Invalid service_id format: "${booking.service_id}". Expected a valid UUID.`);
  }
  
  if (!uuidRegex.test(booking.shop_id)) {
    throw new Error(`Invalid shop_id format: "${booking.shop_id}". Expected a valid UUID.`);
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([
      {
        client_id: user.id,
        service_id: booking.service_id, // Must be UUID
        shop_id: booking.shop_id, // Must be UUID
        start_at: booking.date_time,
        status: 'pending' as BookingStatus,
        notes: booking.notes,
      },
    ])
    .select(`
      *,
      service:services(*),
      shop:shops(*)
    `)
    .single();

  if (error) {
    console.error('Booking creation error:', error);
    // Provide more helpful error messages
    if (error.code === '42501') {
      throw new Error('Permission denied. Please check your Row Level Security policies.');
    } else if (error.code === '23503') {
      throw new Error('Invalid service or salon ID. Please try again.');
    } else if (error.code === '23505') {
      throw new Error('A booking already exists for this time slot.');
    } else if (error.message) {
      throw new Error(error.message);
    }
    throw error;
  }
  
  // Map database response to client type
  return {
    ...data,
    id: String(data.id),
    user_id: data.client_id,
    shop_id: String(data.shop_id),
    date_time: data.start_at,
    service_id: String(data.service_id),
    shop: data.shop ? { ...data.shop, id: String(data.shop.id) } : undefined,
  } as Booking;
}

export async function getMyBookings(): Promise<Booking[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Return empty array if not authenticated

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      shop:shops(*)
    `)
    .eq('client_id', user.id)
    .order('start_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    // Return empty array if table doesn't exist yet
    if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
      return [];
    }
    throw error;
  }
  
  // Map database response to client type
  return (data || []).map((booking: DatabaseBooking) => ({
    ...booking,
    id: String(booking.id),
    user_id: booking.client_id,
    shop_id: String(booking.shop_id),
    date_time: booking.start_at,
    service_id: String(booking.service_id),
    shop: booking.shop ? { ...booking.shop, id: String(booking.shop.id) } : undefined,
  })) as Booking[];
}

export async function getUpcomingBookings(): Promise<Booking[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // Return empty array if not authenticated

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      shop:shops(*)
    `)
    .eq('client_id', user.id)
    .gte('start_at', now)
    .in('status', ['pending', 'confirmed'])
    .order('start_at', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming bookings:', error);
    // Return empty array if table doesn't exist yet
    if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
      return [];
    }
    throw error;
  }
  
  // Map database response to client type
  return (data || []).map((booking: DatabaseBooking) => ({
    ...booking,
    id: String(booking.id),
    user_id: booking.client_id,
    shop_id: String(booking.shop_id),
    date_time: booking.start_at,
    service_id: String(booking.service_id),
    shop: booking.shop ? { ...booking.shop, id: String(booking.shop.id) } : undefined,
  })) as Booking[];
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) throw error;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);

  if (error) throw error;
}

