import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { checkSubscriptionAccess, type SubscriptionAccess } from '../api/subscriptions';
import '../styles/components/subscription-required.css';

interface SubscriptionRequiredProps {
  onSubscribe: () => void;
  onBack: () => void;
}

export function SubscriptionRequired({ onSubscribe, onBack }: SubscriptionRequiredProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionAccess | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const access = await checkSubscriptionAccess(session.user.id);
        setSubscription(access);
      } catch (error) {
        console.error('Error checking subscription:', error);
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
            <button className="btn-primary" onClick={onSubscribe}>
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

  // No subscription at all
  return (
    <div className="subscription-required-screen">
      <div className="subscription-container">
        <div className="subscription-icon">
          <CreditCard size={48} />
        </div>
        <h1>Subscription Required</h1>
        <p className="subscription-message">
          To access the admin dashboard and manage your salon, you need an active subscription.
          Choose a plan that fits your business needs.
        </p>
        
        <div className="plan-benefits">
          <h3>What you'll get:</h3>
          <ul>
            <li>
              <CheckCircle size={20} />
              <span>Full access to salon management dashboard</span>
            </li>
            <li>
              <CheckCircle size={20} />
              <span>Appointment booking and scheduling</span>
            </li>
            <li>
              <CheckCircle size={20} />
              <span>Client management and CRM tools</span>
            </li>
            <li>
              <CheckCircle size={20} />
              <span>Analytics and reporting</span>
            </li>
            <li>
              <CheckCircle size={20} />
              <span>Multi-branch support</span>
            </li>
          </ul>
        </div>

        <div className="subscription-actions">
          <button className="btn-primary" onClick={onSubscribe}>
            <CreditCard size={20} />
            Choose a Plan
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

