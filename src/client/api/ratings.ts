import { supabase } from '../../lib/supabase';

export interface Rating {
  id?: string;
  booking_id: string;
  service_id: string; // Service being rated
  shop_id: string; // Shop that offers the service (for aggregation)
  client_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at?: string;
}

/**
 * Submit a rating for a completed appointment (service-specific)
 */
export async function submitRating(rating: {
  booking_id: string;
  service_id: string; // Service being rated
  shop_id: string; // Shop that offers the service (for aggregation)
  rating: number;
  comment?: string;
}): Promise<Rating> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  if (rating.rating < 1 || rating.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if rating already exists for this booking
  const { data: existing, error: checkError } = await supabase
    .from('ratings')
    .select('id')
    .eq('booking_id', rating.booking_id)
    .eq('client_id', user.id)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  const ratingData = {
    booking_id: rating.booking_id,
    service_id: rating.service_id, // Service being rated
    shop_id: rating.shop_id, // Shop for aggregation
    client_id: user.id,
    rating: rating.rating,
    comment: rating.comment || null,
  };

  let result;
  if (existing) {
    // Update existing rating
    const { data, error } = await supabase
      .from('ratings')
      .update(ratingData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Create new rating
    const { data, error } = await supabase
      .from('ratings')
      .insert([ratingData])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, we'll handle it gracefully
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation')) {
        console.warn('Ratings table does not exist yet');
        throw new Error('Ratings feature is not set up yet. Please contact support or check database setup.');
      }
      // Handle 404 errors (table not found)
      if (error.code === '404' || error.message.includes('404')) {
        console.warn('Ratings table not found (404)');
        throw new Error('Ratings feature is not set up yet. Please contact support or check database setup.');
      }
      throw error;
    }
    result = data;
  }

  // Update shop rating after submitting rating
  await updateShopRating(rating.shop_id);

  return result as Rating;
}

/**
 * Get ratings for a specific shop
 */
export async function getShopRatings(shopId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      return [];
    }
    throw error;
  }

  return (data || []) as Rating[];
}

/**
 * Get average rating and review count for a specific service
 */
export async function getServiceRating(serviceId: string): Promise<{ rating: number; review_count: number } | null> {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('service_id', serviceId);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return null;
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const totalRating = data.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalRating / data.length;
    const reviewCount = data.length;

    return {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      review_count: reviewCount,
    };
  } catch (error) {
    console.error('Error getting service rating:', error);
    return null;
  }
}

/**
 * Get average ratings for multiple services
 */
export async function getServiceRatings(serviceIds: string[]): Promise<Record<string, { rating: number; review_count: number }>> {
  if (serviceIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('service_id, rating')
      .in('service_id', serviceIds);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return {};
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return {};
    }

    // Group ratings by service_id and calculate averages
    const ratingsByService: Record<string, number[]> = {};
    data.forEach((r) => {
      if (!ratingsByService[r.service_id]) {
        ratingsByService[r.service_id] = [];
      }
      ratingsByService[r.service_id].push(r.rating || 0);
    });

    // Calculate averages
    const result: Record<string, { rating: number; review_count: number }> = {};
    Object.keys(ratingsByService).forEach((serviceId) => {
      const ratings = ratingsByService[serviceId];
      const totalRating = ratings.reduce((sum, r) => sum + r, 0);
      const averageRating = totalRating / ratings.length;
      result[serviceId] = {
        rating: Math.round(averageRating * 10) / 10,
        review_count: ratings.length,
      };
    });

    return result;
  } catch (error) {
    console.error('Error getting service ratings:', error);
    return {};
  }
}

/**
 * Check if a booking has been rated
 */
export async function hasRatedBooking(bookingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('ratings')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('client_id', user.id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      return false;
    }
    throw error;
  }

  return !!data;
}

/**
 * Get the rating for a specific booking by the current user
 */
export async function getBookingRating(bookingId: string): Promise<Rating | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('client_id', user.id)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      return null;
    }
    throw error;
  }

  return (data as Rating) || null;
}

/**
 * Get completed bookings that haven't been rated yet
 */
export async function getUnratedCompletedBookings(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all completed bookings for this user
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('client_id', user.id)
    .eq('status', 'completed');

  if (bookingsError) {
    if (bookingsError.code === 'PGRST116' || bookingsError.message.includes('does not exist')) {
      return [];
    }
    throw bookingsError;
  }

  if (!bookings || bookings.length === 0) return [];

  const bookingIds = bookings.map(b => String(b.id));

  // Check which ones have been rated
  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('booking_id')
    .eq('client_id', user.id)
    .in('booking_id', bookingIds);

  if (ratingsError) {
    if (ratingsError.code === 'PGRST116' || ratingsError.message.includes('does not exist')) {
      // If ratings table doesn't exist, all bookings are unrated
      return bookingIds;
    }
    throw ratingsError;
  }

  const ratedBookingIds = new Set((ratings || []).map(r => String(r.booking_id)));
  return bookingIds.filter(id => !ratedBookingIds.has(id));
}

/**
 * Update shop rating based on all service ratings in that shop
 * Shop rating = average of all service ratings from that shop
 */
async function updateShopRating(shopId: string): Promise<void> {
  try {
    // First, get all services for this shop
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('shop_id', shopId);

    if (servicesError) {
      if (servicesError.code === 'PGRST116' || servicesError.message.includes('does not exist')) {
        return; // Table doesn't exist yet
      }
      throw servicesError;
    }

    if (!services || services.length === 0) {
      // No services, set shop rating to 0
      await supabase
        .from('shops')
        .update({ rating: 0, review_count: 0 })
        .eq('id', shopId);
      return;
    }

    // Get all ratings for services in this shop
    const serviceIds = services.map(s => s.id);
    const { data: allRatings, error: allRatingsError } = await supabase
      .from('ratings')
      .select('rating')
      .in('service_id', serviceIds);

    if (allRatingsError) {
      if (allRatingsError.code === 'PGRST116' || allRatingsError.message.includes('does not exist')) {
        return;
      }
      throw allRatingsError;
    }

    if (!allRatings || allRatings.length === 0) {
      // No ratings yet, set to 0
      await supabase
        .from('shops')
        .update({ rating: 0, review_count: 0 })
        .eq('id', shopId);
      return;
    }

    // Calculate average rating from all service ratings
    const totalRating = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalRating / allRatings.length;
    const reviewCount = allRatings.length;

    // Update shop with new rating
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        review_count: reviewCount,
      })
      .eq('id', shopId);

    if (updateError) {
      // If rating/review_count columns don't exist, that's okay
      if (updateError.code === '42703') {
        console.warn('Rating columns may not exist in shops table');
        return;
      }
      throw updateError;
    }
  } catch (error) {
    console.error('Error updating shop rating:', error);
    // Don't throw - rating submission should still succeed even if shop update fails
  }
}

