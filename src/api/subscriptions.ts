import { supabase } from '../lib/supabase';

export type PlanType = 'free-trial' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'suspended';

export interface Subscription {
  id: string;
  user_id: string;
  organization_id?: string | null; // Multi-tenancy: links to organization
  plan_type: PlanType;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  price: number;
  billing_period: string;
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

export interface Payment {
  id: string;
  subscription_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method: string;
  payment_provider: string;
  transaction_id: string | null;
  card_last4: string | null;
  card_brand: string | null;
  card_expiry_month: number | null;
  card_expiry_year: number | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_zip_code: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface SubscriptionAccess {
  has_access: boolean;
  plan_type: string | null;
  status: string | null;
  expires_at: string | null;
  trial_ends_at: string | null;
  days_remaining: number | null;
}

/**
 * Check if user has active subscription access
 */
export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionAccess | null> {
  try {
    const { data, error } = await supabase
      .rpc('check_subscription_access', { p_user_id: userId });

    if (error) {
      console.error('Error checking subscription access:', error);
      return null;
    }

    return data as SubscriptionAccess;
  } catch (error) {
    console.error('Error in checkSubscriptionAccess:', error);
    return null;
  }
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_active_subscription', { p_user_id: userId });

    if (error) {
      console.error('Error getting active subscription:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as Subscription;
  } catch (error) {
    console.error('Error in getActiveSubscription:', error);
    return null;
  }
}

/**
 * Check if user has active subscription (boolean)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('has_active_subscription', { p_user_id: userId });

    if (error) {
      console.error('Error checking subscription:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in hasActiveSubscription:', error);
    return false;
  }
}

/**
 * Create subscription from onboarding
 */
export async function createSubscriptionFromOnboarding(
  userId: string,
  planType: PlanType,
  businessName: string,
  businessPhone: string,
  businessAddress: string,
  businessCity: string,
  businessZipCode: string,
  price: number = 0,
  billingPeriod: string = 'monthly'
): Promise<string | null> {
  try {
    // Calculate trial end date for free-trial plans
    let trialEndsAt: string | null = null;
    let expiresAt: string | null = null;

    if (planType === 'free-trial') {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);
      trialEndsAt = trialEndDate.toISOString();
    } else if (planType === 'pro') {
      const expireDate = new Date();
      if (billingPeriod === 'monthly') {
        expireDate.setMonth(expireDate.getMonth() + 1);
      } else {
        expireDate.setFullYear(expireDate.getFullYear() + 1);
      }
      expiresAt = expireDate.toISOString();
    }
    // Enterprise plans have no expiry

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        business_name: businessName,
        business_phone: businessPhone,
        business_address: businessAddress,
        business_city: businessCity,
        business_zip_code: businessZipCode,
        price: price,
        billing_period: billingPeriod,
        trial_ends_at: trialEndsAt,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createSubscriptionFromOnboarding:', error);
    return null;
  }
}

/**
 * Create payment record
 */
export async function createPaymentRecord(
  subscriptionId: string,
  userId: string,
  amount: number,
  cardLast4: string | null = null,
  cardBrand: string | null = null,
  cardExpiryMonth: number | null = null,
  cardExpiryYear: number | null = null,
  billingAddress: string | null = null,
  billingCity: string | null = null,
  billingZipCode: string | null = null,
  transactionId: string | null = null
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        subscription_id: subscriptionId,
        user_id: userId,
        amount: amount,
        currency: 'PHP',
        status: 'completed',
        payment_method: 'card',
        payment_provider: 'mock',
        transaction_id: transactionId || `mock_txn_${Date.now()}`,
        card_last4: cardLast4,
        card_brand: cardBrand,
        card_expiry_month: cardExpiryMonth,
        card_expiry_year: cardExpiryYear,
        billing_address: billingAddress,
        billing_city: billingCity,
        billing_zip_code: billingZipCode,
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createPaymentRecord:', error);
    return null;
  }
}

/**
 * Get user's subscription history
 */
export async function getSubscriptionHistory(userId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting subscription history:', error);
      return [];
    }

    return (data || []) as Subscription[];
  } catch (error) {
    console.error('Error in getSubscriptionHistory:', error);
    return [];
  }
}

/**
 * Get payments for a subscription
 */
export async function getSubscriptionPayments(subscriptionId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting payments:', error);
      return [];
    }

    return (data || []) as Payment[];
  } catch (error) {
    console.error('Error in getSubscriptionPayments:', error);
    return [];
  }
}

