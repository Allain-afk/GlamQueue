// ============================================================================
// MULTI-TENANCY TYPES
// ============================================================================
// TypeScript types for the multi-tenant SaaS architecture
// ============================================================================

// ============================================================================
// ORGANIZATION (TENANT)
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  timezone: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrganizationInsert = Pick<Organization, 'name' | 'owner_id'> & 
  Partial<Omit<Organization, 'id' | 'name' | 'owner_id' | 'created_at' | 'updated_at'>>;

export type OrganizationUpdate = Partial<Omit<Organization, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;


// ============================================================================
// ORGANIZATION MEMBER
// ============================================================================

export type OrganizationRole = 'admin' | 'manager' | 'staff';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  job_title: string | null;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
}

export interface OrganizationMemberWithProfile extends OrganizationMember {
  profile?: {
    name: string | null;
    email: string | null;
    profile_picture: string | null;
  };
}

export type OrganizationMemberInsert = Pick<OrganizationMember, 'organization_id' | 'user_id'> &
  Partial<Pick<OrganizationMember, 'role' | 'job_title'>>;


// ============================================================================
// PROFILE (Updated with organization_id)
// ============================================================================

export type UserRole = 'client' | 'staff' | 'manager' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  profile_picture: string | null;
  role: UserRole;
  organization_id: string | null; // NULL for clients (global users)
  created_at: string;
  updated_at?: string;
}

export interface ProfileWithOrganization extends Profile {
  organization?: Organization | null;
}

export type ProfileUpdate = Partial<Pick<Profile, 'name' | 'profile_picture' | 'organization_id' | 'role'>>;


// ============================================================================
// SHOP (Updated with organization_id)
// ============================================================================

export interface Shop {
  id: string;
  organization_id: string | null; // Links to organization (tenant)
  owner_id: string; // Legacy: owner user
  name: string;
  address: string;
  city: string | null;
  zip_code: string | null;
  phone_number: string | null;
  email: string | null;
  description: string | null;
  rating: number;
  review_count: number;
  is_open: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopWithOrganization extends Shop {
  organization?: Organization | null;
}

export type ShopInsert = Pick<Shop, 'name' | 'address'> &
  Partial<Omit<Shop, 'id' | 'name' | 'address' | 'rating' | 'review_count' | 'created_at' | 'updated_at'>>;

export type ShopUpdate = Partial<Omit<Shop, 'id' | 'organization_id' | 'owner_id' | 'created_at' | 'updated_at'>>;


// ============================================================================
// SERVICE (Updated with organization_id)
// ============================================================================

export interface Service {
  id: string;
  organization_id: string | null; // Denormalized for RLS performance
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number; // in minutes
  category: string;
  image_url: string | null;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithShop extends Service {
  shop?: Shop | null;
  shop_name?: string; // Convenience field for client display
  shop_address?: string;
}

export type ServiceInsert = Pick<Service, 'shop_id' | 'name' | 'price' | 'duration' | 'category'> &
  Partial<Omit<Service, 'id' | 'shop_id' | 'name' | 'price' | 'duration' | 'category' | 'rating' | 'created_at' | 'updated_at'>>;

export type ServiceUpdate = Partial<Omit<Service, 'id' | 'organization_id' | 'shop_id' | 'created_at' | 'updated_at'>>;


// ============================================================================
// BOOKING (Updated with organization_id)
// ============================================================================

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: number | string;
  organization_id: string | null; // Auto-set from shop
  client_id: string;
  service_id: string;
  shop_id: string;
  staff_id: string | null;
  start_at: string;
  end_at: string | null;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  service?: Service | null;
  shop?: Shop | null;
  client?: Profile | null;
  staff?: Profile | null;
}

export type BookingInsert = Pick<Booking, 'client_id' | 'service_id' | 'shop_id' | 'start_at'> &
  Partial<Pick<Booking, 'staff_id' | 'notes' | 'organization_id'>>;

export type BookingUpdate = Partial<Pick<Booking, 'status' | 'staff_id' | 'notes' | 'start_at' | 'end_at'>>;


// ============================================================================
// SUBSCRIPTION (Updated with organization_id)
// ============================================================================

export type PlanType = 'free-trial' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'suspended';
export type BillingPeriod = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  organization_id: string | null; // Links to organization (tenant)
  user_id: string; // Legacy: subscription owner
  plan_type: PlanType;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  price: number;
  billing_period: BillingPeriod;
  business_name: string | null;
  business_phone: string | null;
  business_address: string | null;
  business_city: string | null;
  business_zip_code: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface SubscriptionWithOrganization extends Subscription {
  organization?: Organization | null;
}


// ============================================================================
// RPC FUNCTION RESPONSES
// ============================================================================

export interface CreateTenantResponse {
  success: boolean;
  organization_id?: string;
  organization_slug?: string;
  user_id?: string;
  error?: string;
}

export interface AddMemberResponse {
  success: boolean;
  organization_id?: string;
  user_id?: string;
  role?: OrganizationRole;
  error?: string;
}

export interface GetOrganizationResponse {
  success: boolean;
  organization?: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    is_active: boolean;
    created_at: string;
  };
  membership?: {
    role: OrganizationRole;
    job_title: string | null;
    joined_at: string;
  };
  error?: string;
}

export interface SwitchOrganizationResponse {
  success: boolean;
  organization_id?: string;
  role?: OrganizationRole;
  error?: string;
}


// ============================================================================
// MULTI-TENANT CONTEXT
// ============================================================================

export interface TenantContext {
  organization: Organization | null;
  membership: OrganizationMember | null;
  isLoading: boolean;
  error: string | null;
  
  // Helper methods
  isAdmin: () => boolean;
  isManager: () => boolean;
  isStaff: () => boolean;
  hasPermission: (permission: string) => boolean;
}

export interface MultiTenantContextValue extends TenantContext {
  switchOrganization: (organizationId: string) => Promise<boolean>;
  refreshOrganization: () => Promise<void>;
}
