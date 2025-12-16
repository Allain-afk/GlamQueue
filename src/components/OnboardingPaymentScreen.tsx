import { useState } from 'react';
import { ArrowLeft, Check, CreditCard, Lock, Shield, User, Mail, Phone, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createSubscriptionFromOnboarding, createPaymentRecord } from '../api/subscriptions';
import { createNewTenant } from '../api/multiTenancy';
import { glamWarning } from '../lib/glamAlerts';
import '../styles/components/onboarding-payment.css';

export type PlanType = 'free-trial' | 'pro' | 'enterprise';

interface OnboardingPaymentScreenProps {
  planType: PlanType;
  onBack: () => void;
  onComplete: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  city: string;
  zipCode: string;
}

const planDetails = {
  'free-trial': {
    name: 'Free Trial',
    price: '₱0',
    period: '14 days',
    description: 'All Pro features for 14 days',
    features: [
      'All Pro features for 14 days',
      'No credit card required',
      'Cancel anytime',
      'Full access to platform'
    ]
  },
  'pro': {
    name: 'Pro',
    price: '₱1,499',
    period: 'per month',
    description: 'Perfect for growing salons',
    features: [
      '100 Appointments per day',
      'Client CRM & loyalty tools',
      'AI scheduling & chatbot',
      'Multibranch support',
      'Advanced analytics'
    ]
  },
  'enterprise': {
    name: 'Enterprise',
    price: 'Custom Pricing',
    period: 'billed annually',
    description: 'For large salon chains',
    features: [
      'Unlimited appointments',
      'Dedicated success manager',
      'SLA & priority support',
      'Security review & SSO'
    ]
  }
};

export function OnboardingPaymentScreen({ planType, onBack, onComplete }: OnboardingPaymentScreenProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    zipCode: ''
  });

  const plan = planDetails[planType];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    handleInputChange('cardNumber', formatted);
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiryDate(value);
    handleInputChange('expiryDate', formatted);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1 (user info)
      if (!formData.fullName || !formData.email || !formData.phone || !formData.businessName) {
        glamWarning('Please fill in all required fields');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        glamWarning('Please enter a valid email address');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2 (payment info)
      if (planType === 'free-trial') {
        // Skip payment validation for free trial
        handleSubmit();
      } else {
        if (!formData.cardNumber || !formData.cardHolder || !formData.expiryDate || !formData.cvv) {
          glamWarning('Please fill in all payment fields');
          return;
        }
        // Validate card number (should be 16 digits after removing spaces)
        const cardDigits = formData.cardNumber.replace(/\s/g, '');
        if (cardDigits.length !== 16) {
          glamWarning('Please enter a valid 16-digit card number');
          return;
        }
        // Validate CVV
        if (formData.cvv.length !== 3) {
          glamWarning('Please enter a valid 3-digit CVV');
          return;
        }
        setCurrentStep(3);
      }
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User not logged in - store data in localStorage and redirect to signup
        const onboardingData = {
          planType,
          formData,
          timestamp: Date.now()
        };
        localStorage.setItem('pending_subscription', JSON.stringify(onboardingData));
        setIsProcessing(false);
        onComplete(); // This will redirect to login/signup
        return;
      }

      // Step 1: Create the tenant/organization first
      const tenantResult = await createNewTenant({
        userId: user.id,
        orgName: formData.businessName || 'My Salon',
        userName: formData.fullName,
        userEmail: formData.email || user.email,
      });

      if (!tenantResult.success) {
        console.error('Failed to create tenant:', tenantResult.error);
        // Continue anyway - subscription can still be created
      } else {
        console.log('Tenant created:', tenantResult.organization_id);
      }

      // Step 2: Calculate price
      const price = planType === 'pro' ? 1499.00 : planType === 'enterprise' ? 0 : 0;
      const billingPeriod = planType === 'enterprise' ? 'yearly' : 'monthly';

      // Create subscription
      const subscriptionId = await createSubscriptionFromOnboarding(
        user.id,
        planType,
        formData.businessName,
        formData.phone,
        formData.billingAddress || '',
        formData.city || '',
        formData.zipCode || '',
        price,
        billingPeriod
      );

      if (!subscriptionId) {
        throw new Error('Failed to create subscription');
      }

      // Create payment record if not free trial
      if (planType !== 'free-trial') {
        // Extract card details
        const cardLast4 = formData.cardNumber.slice(-4).replace(/\s/g, '');
        const [expiryMonth, expiryYear] = formData.expiryDate.split('/');
        const cardBrand = cardLast4.startsWith('4') ? 'visa' : 'mastercard';
        
        // Extract last 2 digits of year and convert to full year
        const fullYear = parseInt('20' + expiryYear);

        await createPaymentRecord(
          subscriptionId,
          user.id,
          price,
          cardLast4,
          cardBrand,
          parseInt(expiryMonth),
          fullYear,
          formData.billingAddress,
          formData.city,
          formData.zipCode,
          `mock_txn_${Date.now()}`
        );
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsProcessing(false);
      setCurrentStep(3);
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subscription. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    onComplete();
  };

  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">{currentStep > 1 ? <Check size={16} /> : '1'}</div>
          <span className="step-label">Account Info</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">{currentStep > 2 ? <Check size={16} /> : '2'}</div>
          <span className="step-label">{planType === 'free-trial' ? 'Review' : 'Payment'}</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span className="step-label">Complete</span>
        </div>
      </div>
    );
  };

  const renderStep1 = () => {
    return (
      <div className="onboarding-step">
        <h2 className="step-title">Create Your Account</h2>
        <p className="step-subtitle">Let's get you started with {plan.name}</p>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">
              <User size={18} />
              Full Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={18} />
              Email Address *
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone size={18} />
              Phone Number *
            </label>
            <input
              type="tel"
              className="form-input"
              placeholder="+63 912 345 6789"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Building size={18} />
              Business/Salon Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Glam Studio"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              required
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    if (planType === 'free-trial') {
      return (
        <div className="onboarding-step">
          <h2 className="step-title">Review Your Plan</h2>
          <p className="step-subtitle">No payment required for your free trial</p>

          <div className="plan-summary-card">
            <div className="plan-summary-header">
              <h3>{plan.name}</h3>
              <div className="plan-price-large">
                <span className="price">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
            </div>
            <ul className="plan-features-list">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <Check size={18} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="account-info-review">
            <h4>Account Information</h4>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{formData.fullName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{formData.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">{formData.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Business:</span>
              <span className="info-value">{formData.businessName}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="onboarding-step">
        <h2 className="step-title">Payment Information</h2>
        <p className="step-subtitle">Secure payment powered by industry-leading encryption</p>

        <div className="plan-summary-card">
          <div className="plan-summary-header">
            <h3>{plan.name}</h3>
            <div className="plan-price-large">
              <span className="price">{plan.price}</span>
              <span className="period">{plan.period}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">
              <CreditCard size={18} />
              Card Number *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              maxLength={19}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <User size={18} />
              Cardholder Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="JOHN DOE"
              value={formData.cardHolder}
              onChange={(e) => handleInputChange('cardHolder', e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expiry Date *</label>
              <input
                type="text"
                className="form-input"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={(e) => handleExpiryChange(e.target.value)}
                maxLength={5}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">CVV *</label>
              <input
                type="text"
                className="form-input"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').substring(0, 3))}
                maxLength={3}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing Address *</label>
            <input
              type="text"
              className="form-input"
              placeholder="123 Main Street"
              value={formData.billingAddress}
              onChange={(e) => handleInputChange('billingAddress', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Manila"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">ZIP Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="1000"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="security-notice">
          <Shield size={20} />
          <div>
            <strong>Secure Payment</strong>
            <p>Your payment information is encrypted and secure. We never store your full card details.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div className="onboarding-step success-step">
        <div className="success-icon">
          <Check size={48} />
        </div>
        <h2 className="step-title">Welcome to GlamQueue!</h2>
        <p className="step-subtitle">
          {planType === 'free-trial' 
            ? 'Your free trial has started. Enjoy 14 days of full access!'
            : 'Your account has been created and payment processed successfully.'}
        </p>

        <div className="success-details">
          <div className="success-card">
            <h4>What's Next?</h4>
            <ul className="next-steps">
              <li>
                <Check size={18} />
                <div>
                  <strong>Check your email</strong>
                  <p>We've sent a confirmation email to {formData.email}</p>
                </div>
              </li>
              <li>
                <Check size={18} />
                <div>
                  <strong>Set up your profile</strong>
                  <p>Complete your salon profile to get started</p>
                </div>
              </li>
              <li>
                <Check size={18} />
                <div>
                  <strong>Invite your team</strong>
                  <p>Add staff members to your account</p>
                </div>
              </li>
            </ul>
          </div>

          {planType === 'free-trial' && (
            <div className="trial-notice">
              <Lock size={20} />
              <div>
                <strong>Free Trial Active</strong>
                <p>Your 14-day free trial started today. No charges until {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="onboarding-payment-screen">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="logo-section">
            <img
              src="/images/GlamQueue-Header-Logo.png"
              alt="GlamQueue Logo"
              className="onboarding-logo"
            />
          </div>
        </div>

        {renderStepIndicator()}

        <div className="onboarding-content">
          <div className="onboarding-main">
            {error && (
              <div className="error-message" style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: '#dc2626'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          <div className="onboarding-sidebar">
            <div className="sidebar-card">
              <h3>Plan Summary</h3>
              <div className="sidebar-plan-details">
                <div className="sidebar-plan-name">{plan.name}</div>
                <div className="sidebar-plan-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <p className="sidebar-plan-desc">{plan.description}</p>
                <ul className="sidebar-features">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <li key={index}>
                      <Check size={14} />
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="more-features">+{plan.features.length - 3} more features</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="sidebar-card trust-badges">
              <div className="trust-badge">
                <Shield size={20} />
                <span>Secure Payment</span>
              </div>
              <div className="trust-badge">
                <Lock size={20} />
                <span>SSL Encrypted</span>
              </div>
              <div className="trust-badge">
                <Check size={20} />
                <span>Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        <div className="onboarding-footer">
          {currentStep < 3 && (
            <div className="footer-actions">
              {currentStep > 1 && (
                <button className="btn-secondary" onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}>
                  Previous
                </button>
              )}
              <button
                className="btn-primary"
                onClick={currentStep === 2 && planType !== 'free-trial' ? handleSubmit : handleNext}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : currentStep === 2 && planType !== 'free-trial' ? (
                  <>
                    <Lock size={18} />
                    Complete Payment
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          )}
          {currentStep === 3 && (
            <button className="btn-primary btn-large" onClick={handleConfirm}>
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

