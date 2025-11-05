import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { RedesignedLandingPage } from './components/RedesignedLandingPage';
import { AdminLogin } from './admin/components/AdminLogin';
import { OtpVerification } from './admin/components/OtpVerification';
import { OnboardingPaymentScreen, type PlanType } from './components/OnboardingPaymentScreen';
import { SubscriptionRequired } from './components/SubscriptionRequired';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { type Profile } from './api/profile';
import { getMyProfile } from './api/profile';
import { hasActiveSubscription } from './api/subscriptions';
import { createSubscriptionFromOnboarding, createPaymentRecord } from './api/subscriptions';
import './index.css';

// Lazy load heavy components for code splitting
const NewAdminDashboard = lazy(() => import('./admin/components/NewAdminDashboard').then(module => ({ default: module.NewAdminDashboard })));
const ClientApp = lazy(() => import('./client/ClientApp').then(module => ({ default: module.ClientApp })));

type AppState = 'landing' | 'login' | 'otp-verification' | 'admin-dashboard' | 'client-app' | 'onboarding' | 'subscription-required';

function AppContent() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>('free-trial');
  const { signOut, session } = useAuth();

  // Handle pending subscription stored in localStorage
  const handlePendingSubscription = useCallback(async () => {
    if (!session?.user) return;

    try {
      const pendingData = localStorage.getItem('pending_subscription');
      if (!pendingData) return;

      const { planType, formData, timestamp } = JSON.parse(pendingData);
      
      // Check if data is still valid (not older than 1 hour)
      if (Date.now() - timestamp > 3600000) {
        localStorage.removeItem('pending_subscription');
        return;
      }

      // Calculate price
      const price = planType === 'pro' ? 1499.00 : planType === 'enterprise' ? 0 : 0;
      const billingPeriod = planType === 'enterprise' ? 'yearly' : 'monthly';

      // Create subscription
      const subscriptionId = await createSubscriptionFromOnboarding(
        session.user.id,
        planType,
        formData.businessName,
        formData.phone,
        formData.billingAddress || '',
        formData.city || '',
        formData.zipCode || '',
        price,
        billingPeriod
      );

      if (subscriptionId && planType !== 'free-trial') {
        // Create payment record
        const cardLast4 = formData.cardNumber?.slice(-4)?.replace(/\s/g, '') || null;
        const [expiryMonth, expiryYear] = (formData.expiryDate || '').split('/');
        const cardBrand = cardLast4?.startsWith('4') ? 'visa' : 'mastercard';
        const fullYear = expiryYear ? parseInt('20' + expiryYear) : null;

        await createPaymentRecord(
          subscriptionId,
          session.user.id,
          price,
          cardLast4,
          cardBrand,
          expiryMonth ? parseInt(expiryMonth) : null,
          fullYear,
          formData.billingAddress,
          formData.city,
          formData.zipCode,
          `mock_txn_${Date.now()}`
        );
      }

      // Clear pending data
      localStorage.removeItem('pending_subscription');
    } catch (error) {
      console.error('Error handling pending subscription:', error);
    }
  }, [session]);

  // Handle auth callback from email confirmation
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if URL contains auth hash (Supabase redirects with hash fragments)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error');

      if (error) {
        console.error('Auth callback error:', error);
        return;
      }

      if (accessToken && session) {
        // User has confirmed email via Supabase email link
        // Get their profile and redirect accordingly
        try {
          // Handle pending subscription first
          await handlePendingSubscription();
          
          const profile = await getMyProfile();
          if (profile) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            
            // Redirect based on role
            if (profile.role === 'admin') {
              // Check subscription for admin users
              const hasSubscription = await hasActiveSubscription(profile.id);
              if (!hasSubscription) {
                setAppState('subscription-required');
              } else {
                setAppState('admin-dashboard');
              }
            } else {
              setAppState('client-app');
            }
          }
        } catch (err) {
          console.error('Error getting profile after auth callback:', err);
        }
      }
    };

    handleAuthCallback();
  }, [session, handlePendingSubscription]);

  const handleGetStarted = () => {
    console.log('Book Now clicked - Redirecting to sign-up');
    setIsSignUpMode(true);
    setAppState('login');
  };

  const handleLogin = () => {
    setIsSignUpMode(false);
    setAppState('login');
  };

  const handleBackToLanding = () => {
    setIsSignUpMode(false);
    setAppState('landing');
  };

  // Check subscription and handle pending subscription after login
  const handleLoginSuccess = async (profile: Profile) => {
    // Handle pending subscription from onboarding
    await handlePendingSubscription();
    
    // Check subscription for admin users
    if (profile.role === 'admin' && session?.user) {
      const hasSubscription = await hasActiveSubscription(session.user.id);
      if (!hasSubscription) {
        setAppState('subscription-required');
        return;
      }
    }
    
    setAppState('admin-dashboard');
  };

  const handleClientLogin = () => {
    setIsSignUpMode(false);
    setAppState('client-app');
  };

  const handleOtpVerificationSuccess = async (profile: Profile) => {
    // Handle pending subscription
    await handlePendingSubscription();
    
    // After OTP verification, redirect based on role
    if (profile.role === 'admin') {
      // Check subscription for admin users
      if (session?.user) {
        const hasSubscription = await hasActiveSubscription(session.user.id);
        if (!hasSubscription) {
          setAppState('subscription-required');
          return;
        }
      }
      setAppState('admin-dashboard');
    } else {
      setAppState('client-app');
    }
  };

  const handleNavigateToOtp = (email: string, password: string) => {
    setOtpEmail(email);
    setOtpPassword(password);
    setAppState('otp-verification');
  };

  const handleBackFromOtp = () => {
    setAppState('login');
  };

  const handleLogout = async () => {
    await signOut();
    setAppState('landing');
  };

  const handleStartOnboarding = (planType: PlanType) => {
    setSelectedPlanType(planType);
    setAppState('onboarding');
  };

  const handleOnboardingComplete = () => {
    // After onboarding, redirect to sign-up/login
    setIsSignUpMode(true);
    setAppState('login');
  };

  const handleBackFromOnboarding = () => {
    setAppState('landing');
  };


  switch (appState) {
    case 'login':
      return (
        <AdminLogin 
          onLoginSuccess={handleLoginSuccess}
          onClientLogin={handleClientLogin}
          onBackToLanding={handleBackToLanding}
          onNavigateToOtp={handleNavigateToOtp}
          initialMode={isSignUpMode ? 'signup' : 'login'}
        />
      );
    
    case 'otp-verification':
      return (
        <OtpVerification
          email={otpEmail}
          password={otpPassword}
          onVerificationSuccess={handleOtpVerificationSuccess}
          onBack={handleBackFromOtp}
        />
      );
    
    case 'admin-dashboard':
      return (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading dashboard...</p>
            </div>
          </div>
        }>
          <NewAdminDashboard 
            onLogout={handleLogout}
          />
        </Suspense>
      );
    
    case 'client-app':
      return (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading app...</p>
            </div>
          </div>
        }>
          <ClientApp 
            onBackToLanding={handleBackToLanding}
            onLogout={handleLogout}
            onRequireLogin={() => {
              setIsSignUpMode(true);
              setAppState('login');
            }}
          />
        </Suspense>
      );
    
    case 'onboarding':
      return (
        <OnboardingPaymentScreen
          planType={selectedPlanType}
          onBack={handleBackFromOnboarding}
          onComplete={handleOnboardingComplete}
        />
      );
    
    case 'subscription-required':
      return (
        <SubscriptionRequired
          onSubscribe={() => handleStartOnboarding('free-trial')}
          onBack={handleBackToLanding}
        />
      );
    
    default:
      return (
        <RedesignedLandingPage 
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
          onStartOnboarding={handleStartOnboarding}
        />
      );
  }
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
