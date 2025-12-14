import { supabase } from '../lib/supabase';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  client_id: string;
  service_id: number;
  salon_id: number;
  start_at: string;
  end_at?: string;
  status: BookingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  service?: {
    name: string;
    price: number;
    duration: number;
  };
  salon?: {
    name: string;
    address: string;
  };
  client?: {
    email: string;
  };
}

// Admin functions
export async function listBookingsSmart(): Promise<Booking[]> {
  try {
    // First, try to get basic bookings without joins to check if table exists
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      // If bookings table doesn't exist or is empty, return empty array instead of throwing
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('Bookings table not found or empty, returning empty array');
        return [];
      }
      throw error;
    }
    
    return (data || []) as Booking[];
  } catch (err) {
    console.error('Error in listBookingsSmart:', err);
    // Return empty array instead of crashing the dashboard
    return [];
  }
}

export async function adminUpdateBookingStatus(
  bookingId: number,
  status: BookingStatus
): Promise<void> {
  // Prefer updating updated_at as well, but gracefully fallback if the column
  // doesn't exist in the current schema.
  const preferredUpdate = { status, updated_at: new Date().toISOString() };

  const { error: preferredError } = await supabase
    .from('bookings')
    .update(preferredUpdate)
    .eq('id', bookingId);

  if (!preferredError) return;

  const message = preferredError.message || '';
  const mentionsMissingUpdatedAt =
    message.includes('updated_at') &&
    (message.includes('does not exist') || message.includes('unknown') || message.includes('column'));

  if (mentionsMissingUpdatedAt) {
    const { error: fallbackError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (fallbackError) {
      console.error('Error updating booking status (fallback):', fallbackError);
      throw fallbackError;
    }
    return;
  }

  console.error('Error updating booking status:', preferredError);
  throw preferredError;
}

export type BookingPaymentMethod = 'cash' | 'online' | 'visa';

export type BookingPaymentDetails = {
  booking_id: string;
  payment_method: BookingPaymentMethod;
  details: Record<string, unknown>;
  created_at: string;
};

export async function getBookingPaymentDetails(
  bookingId: number | string
): Promise<BookingPaymentDetails | null> {
  const bookingIdText = String(bookingId);

  const { data, error } = await supabase
    .from('booking_payment_details')
    .select('booking_id,payment_method,details,created_at')
    .eq('booking_id', bookingIdText)
    .maybeSingle();

  if (error) {
    const message = (error.message || '').toLowerCase();
    const missingTable =
      error.code === '42P01' || (message.includes('relation') && message.includes('does not exist'));
    if (missingTable) return null;
    throw error;
  }

  return (data as unknown as BookingPaymentDetails) ?? null;
}
