import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { checkSubscriptionAccess, type SubscriptionAccess, type PlanType } from '../api/subscriptions';
import '../styles/components/subscription-required.css';

interface SubscriptionRequiredProps {
  onSubscribe: (planType: PlanType) => void;
  onBack: () => void;
}

export function SubscriptionRequired({ onSubscribe, onBack }: SubscriptionRequiredProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionAccess | null>(null);
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const access = await checkSubscriptionAccess(session.user.id);
        setSubscription(access);
        
        // If user is seeing this screen, it means their subscription/trial has ended
        // Therefore, they have used their free trial (it expired) and can't get it again
        // Always set to true since seeing this screen means their trial expired
        setHasUsedFreeTrial(true);
      } catch (error) {
        console.error('Error checking subscription:', error);
        // If there's an error, assume they've used it since they're seeing this screen
        setHasUsedFreeTrial(true);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [session]);

  if (loading) {
    return (
      <div className="subscription-required-screen">
        <div className="subscription-container">
          <div className="loading-spinner"></div>
          <p>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // If subscription exists but expired
  if (subscription && !subscription.has_access) {
    return (
      <div className="subscription-required-screen">
        <div className="subscription-container">
          <div className="subscription-icon expired">
            <AlertCircle size={48} />
          </div>
          <h1>Subscription Expired</h1>
          <p className="subscription-message">
            Your {subscription.plan_type} subscription has expired.
            {subscription.days_remaining !== null && subscription.days_remaining <= 0 && (
              <span> Please renew to continue using GlamQueue.</span>
            )}
          </p>
          <div className="subscription-actions">
            <button className="btn-primary" onClick={() => onSubscribe('pro')}>
              <CreditCard size={20} />
              Subscribe Now
            </button>
            <button className="btn-secondary" onClick={onBack}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No subscription at all - Show pricing screen
  return (
    <div className="subscription-required-screen">
      <div className="subscription-container" style={{ maxWidth: '1200px', width: '100%' }}>
        <div className="subscription-icon">
          <CreditCard size={48} />
        </div>
        <h1>Subscription Required</h1>
        <p className="subscription-message" style={{ marginBottom: '2rem' }}>
          To access the admin dashboard and manage your salon, you need an active subscription.
          Choose a plan that fits your business needs.
        </p>
        
        {/* Pricing Grid */}
        <div className="pricing-grid">
          {/* Free Trial Card */}
          <div 
            className={`pricing-card ${hasUsedFreeTrial ? 'disabled' : ''}`}
            style={{ position: 'relative' }}
          >
            {hasUsedFreeTrial && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#6b7280',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                Used
              </div>
            )}
            <h3 className="plan-name" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: hasUsedFreeTrial ? '#9ca3af' : '#1a1a1a' }}>
              Freemium
            </h3>
            <div className="plan-price" style={{ fontSize: '2.5rem', fontWeight: '800', color: hasUsedFreeTrial ? '#9ca3af' : '#e91e8c', marginBottom: '0.5rem' }}>
              ₱0
            </div>
            <div className="plan-period" style={{ color: hasUsedFreeTrial ? '#9ca3af' : '#6b7280', marginBottom: '1.5rem' }}>
              for 14 days
            </div>
            <ul className="plan-features" style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: hasUsedFreeTrial ? '#9ca3af' : '#4b5563' }}>
                <CheckCircle size={18} style={{ color: hasUsedFreeTrial ? '#9ca3af' : '#10b981', flexShrink: 0 }} />
                <span>All Pro features for 14 days</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: hasUsedFreeTrial ? '#9ca3af' : '#4b5563' }}>
                <CheckCircle size={18} style={{ color: hasUsedFreeTrial ? '#9ca3af' : '#10b981', flexShrink: 0 }} />
                <span>No credit card required</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: hasUsedFreeTrial ? '#9ca3af' : '#4b5563' }}>
                <CheckCircle size={18} style={{ color: hasUsedFreeTrial ? '#9ca3af' : '#10b981', flexShrink: 0 }} />
                <span>Cancel Anytime</span>
              </li>
            </ul>
            <button 
              className="pricing-btn" 
              onClick={() => !hasUsedFreeTrial && onSubscribe('free-trial')}
              disabled={hasUsedFreeTrial}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: hasUsedFreeTrial ? 'not-allowed' : 'pointer',
                background: hasUsedFreeTrial ? '#d1d1d1' : 'linear-gradient(to right, #e91e8c, #d81b60)',
                color: 'white',
                transition: 'all 0.3s ease',
                opacity: hasUsedFreeTrial ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!hasUsedFreeTrial) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 140, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!hasUsedFreeTrial) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {hasUsedFreeTrial ? 'Free Trial Used' : 'Start Free Trial'}
            </button>
          </div>
          
          {/* Pro Card - Highlighted */}
          <div 
            className="pricing-card featured"
            style={{ position: 'relative' }}
          >
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to right, #e91e8c, #d81b60)',
              color: 'white',
              padding: '0.5rem 1.5rem',
              borderRadius: '999px',
              fontSize: '0.875rem',
              fontWeight: '700',
              whiteSpace: 'nowrap'
            }}>
              RECOMMENDED
            </div>
            <h3 className="plan-name" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#1a1a1a', marginTop: '0.5rem' }}>
              Pro
            </h3>
            <div className="plan-price" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#e91e8c', marginBottom: '0.5rem' }}>
              ₱1,499
            </div>
            <div className="plan-period" style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              per month
            </div>
            <ul className="plan-features" style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563' }}>
                <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>100 Appointments per day</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563' }}>
                <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Client CRM & loyalty tools</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563' }}>
                <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Up to 5 branches</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563' }}>
                <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>AI Chatbot & Advanced analytics</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563' }}>
                <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Email & chat support</span>
              </li>
            </ul>
            <button 
              className="pricing-btn" 
              onClick={() => onSubscribe('pro')}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'linear-gradient(to right, #e91e8c, #d81b60)',
                color: 'white',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 140, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Get Pro
            </button>
          </div>
          
          {/* Enterprise Card */}
          <div className="pricing-card">
            <h3 className="plan-name" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#1a1a1a' }}>
              Enterprise
            </h3>
            <div className="plan-price" style={{ fontSize: '2.5rem', fontWeight: '800', color: '#e91e8c', marginBottom: '0.5rem' }}>
              Custom Pricing
            </div>
            <div className="plan-period" style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              billed annually
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '600' }}>
              Everything in Pro, plus:
            </p>
            <ul className="plan-features" style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563', fontSize: '0.875rem' }}>
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Unlimited appointments</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563', fontSize: '0.875rem' }}>
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Unlimited branches</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563', fontSize: '0.875rem' }}>
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Dedicated success manager</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#4b5563', fontSize: '0.875rem' }}>
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>SLA & priority support</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '0.875rem' }}>
                <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>Custom integrations</span>
              </li>
            </ul>
            <button 
              className="pricing-btn" 
              onClick={() => onSubscribe('enterprise')}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '2px solid #e91e8c',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'white',
                color: '#e91e8c',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fce7f3';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Contact Sales
            </button>
          </div>
        </div>

        <div className="subscription-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onBack} style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: '2px solid #d1d5db',
            background: 'white',
            color: '#374151',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

