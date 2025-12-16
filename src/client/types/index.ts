// Client-side TypeScript types for GlamQueue

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  shop_id: string;
  organization_id?: string; // Multi-tenancy: denormalized for RLS
  shop_name: string;
  shop_address: string;
  image_url?: string;
  rating?: number;
  created_at?: string;
}

export interface Shop {
  id: string;
  organization_id?: string; // Multi-tenancy: links to organization (tenant)
  name: string;
  address: string;
  rating: number;
  review_count: number;
  image_url?: string;
  description: string;
  is_open: boolean;
  phone_number?: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  shop_id: string;
  organization_id?: string; // Multi-tenancy: auto-set from shop
  date_time: string;
  status: BookingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  service?: Service;
  shop?: Shop;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

