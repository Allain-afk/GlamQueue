// ============================================================================
// MULTI-TENANCY API
// ============================================================================
// Supabase API functions for multi-tenant operations
// ============================================================================

import { supabase } from '../lib/supabase';
import type {
  Organization,
  OrganizationUpdate,
  OrganizationMember,
  OrganizationMemberWithProfile,
  OrganizationRole,
  CreateTenantResponse,
  AddMemberResponse,
  GetOrganizationResponse,
  SwitchOrganizationResponse,
} from '../types/multiTenancy';


// ============================================================================
// ORGANIZATION CRUD
// ============================================================================

/**
 * Get the current user's organization
 */
export async function getMyOrganization(): Promise<GetOrganizationResponse> {
  console.log('[getMyOrganization] Calling RPC get_my_organization...');
  const { data, error } = await supabase.rpc('get_my_organization');
  
  if (error) {
    console.error('[getMyOrganization] RPC Error:', error);
    return { success: false, error: error.message };
  }
  
  console.log('[getMyOrganization] RPC Result:', data);
  return data as GetOrganizationResponse;
}

/**
 * Get an organization by ID
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
  
  return data as Organization;
}

/**
 * Get an organization by slug (for public pages)
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  
  if (error) {
    console.error('Error fetching organization by slug:', error);
    return null;
  }
  
  return data as Organization;
}

/**
 * List all active organizations (marketplace browsing)
 */
export async function listOrganizations(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ data: Organization[]; count: number }> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const { data, error, count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error listing organizations:', error);
    return { data: [], count: 0 };
  }
  
  return { data: data as Organization[], count: count ?? 0 };
}

/**
 * Update the current user's organization
 */
export async function updateOrganization(updates: OrganizationUpdate): Promise<Organization | null> {
  const orgResponse = await getMyOrganization();
  if (!orgResponse.success || !orgResponse.organization) {
    console.error('No organization found');
    return null;
  }

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgResponse.organization.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating organization:', error);
    return null;
  }
  
  return data as Organization;
}


// ============================================================================
// TENANT MANAGEMENT (RPC Functions)
// ============================================================================

/**
 * Create a new tenant (organization) - typically called during onboarding
 */
export async function createNewTenant(params: {
  userId: string;
  orgName: string;
  orgSlug?: string;
  userName?: string;
  userEmail?: string;
}): Promise<CreateTenantResponse> {
  const { data, error } = await supabase.rpc('create_new_tenant', {
    p_user_id: params.userId,
    p_org_name: params.orgName,
    p_org_slug: params.orgSlug ?? null,
    p_user_name: params.userName ?? null,
    p_user_email: params.userEmail ?? null,
  });
  
  if (error) {
    console.error('Error creating tenant:', error);
    return { success: false, error: error.message };
  }
  
  return data as CreateTenantResponse;
}

/**
 * Add a member to the current user's organization
 */
export async function addOrganizationMember(params: {
  userId: string;
  role?: OrganizationRole;
  jobTitle?: string;
}): Promise<AddMemberResponse> {
  const orgResponse = await getMyOrganization();
  if (!orgResponse.success || !orgResponse.organization) {
    return { success: false, error: 'No organization found' };
  }

  const { data, error } = await supabase.rpc('add_organization_member', {
    p_organization_id: orgResponse.organization.id,
    p_user_id: params.userId,
    p_role: params.role ?? 'staff',
    p_job_title: params.jobTitle ?? null,
  });
  
  if (error) {
    console.error('Error adding member:', error);
    return { success: false, error: error.message };
  }
  
  return data as AddMemberResponse;
}

/**
 * Switch to a different organization (for multi-org users)
 */
export async function switchOrganization(organizationId: string): Promise<SwitchOrganizationResponse> {
  const { data, error } = await supabase.rpc('switch_organization', {
    p_organization_id: organizationId,
  });
  
  if (error) {
    console.error('Error switching organization:', error);
    return { success: false, error: error.message };
  }
  
  return data as SwitchOrganizationResponse;
}


// ============================================================================
// ORGANIZATION MEMBERS
// ============================================================================

/**
 * Get all members of the current user's organization
 */
export async function getOrganizationMembers(): Promise<OrganizationMemberWithProfile[]> {
  const orgResponse = await getMyOrganization();
  if (!orgResponse.success || !orgResponse.organization) {
    console.error('No organization found');
    return [];
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      profile:profiles!user_id (
        name,
        email,
        profile_picture
      )
    `)
    .eq('organization_id', orgResponse.organization.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  
  return data as OrganizationMemberWithProfile[];
}

/**
 * Update a member's role or status
 */
export async function updateOrganizationMember(
  memberId: string,
  updates: { role?: OrganizationRole; job_title?: string; is_active?: boolean }
): Promise<OrganizationMember | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating member:', error);
    return null;
  }
  
  return data as OrganizationMember;
}

/**
 * Remove a member from the organization (soft delete)
 */
export async function removeOrganizationMember(memberId: string): Promise<boolean> {
  const { error } = await supabase
    .from('organization_members')
    .update({ is_active: false })
    .eq('id', memberId);
  
  if (error) {
    console.error('Error removing member:', error);
    return false;
  }
  
  return true;
}


// ============================================================================
// USER'S ORGANIZATIONS (for multi-org support)
// ============================================================================

/**
 * Get all organizations the current user is a member of
 */
export async function getMyOrganizations(): Promise<{
  organization: Organization;
  membership: OrganizationMember;
}[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      organization:organizations!organization_id (*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
  
  return data.map((item: any) => ({
    organization: item.organization as Organization,
    membership: {
      id: item.id,
      organization_id: item.organization_id,
      user_id: item.user_id,
      role: item.role,
      job_title: item.job_title,
      is_active: item.is_active,
      joined_at: item.joined_at,
      updated_at: item.updated_at,
    } as OrganizationMember,
  }));
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if the current user has a specific role in their organization
 */
export async function hasOrganizationRole(roles: OrganizationRole[]): Promise<boolean> {
  const orgResponse = await getMyOrganization();
  if (!orgResponse.success || !orgResponse.membership) {
    return false;
  }
  return roles.includes(orgResponse.membership.role);
}

/**
 * Check if the current user is an organization admin
 */
export async function isOrganizationAdmin(): Promise<boolean> {
  return hasOrganizationRole(['admin']);
}

/**
 * Check if the current user is an organization admin or manager
 */
export async function isOrganizationAdminOrManager(): Promise<boolean> {
  return hasOrganizationRole(['admin', 'manager']);
}

/**
 * Get the current user's organization ID (for use in queries)
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const orgResponse = await getMyOrganization();
  console.log('[getCurrentOrganizationId] Response:', orgResponse);
  
  if (!orgResponse.success) {
    console.error('[getCurrentOrganizationId] Failed to get organization:', orgResponse.error);
    return null;
  }
  
  const orgId = orgResponse.organization?.id ?? null;
  console.log('[getCurrentOrganizationId] Organization ID:', orgId);
  return orgId;
}
