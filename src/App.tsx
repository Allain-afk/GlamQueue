import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { createNewTenant } from './api/multiTenancy';
import './index.css';

// Lazy load heavy components for code splitting
// Properly typed lazy loading that preserves component prop types
type NewAdminDashboardProps = { onLogout: () => Promise<void> };
const NewAdminDashboard = lazy(() => 
  import('./admin/components/NewAdminDashboard').then(module => ({ 
    default: module.NewAdminDashboard 
  }))
) as React.LazyExoticComponent<React.ComponentType<NewAdminDashboardProps>>;

type ManagerDashboardProps = { onLogout: () => Promise<void> };
const ManagerDashboard = lazy(() => 
  import('./manager/components/ManagerDashboard').then(module => ({ 
    default: module.ManagerDashboard 
  }))
) as React.LazyExoticComponent<React.ComponentType<ManagerDashboardProps>>;

type StaffDashboardProps = { onLogout: () => Promise<void> };
const StaffDashboard = lazy(() => 
  import('./staff/components/StaffDashboard').then(module => ({ 
    default: module.StaffDashboard 
  }))
) as React.LazyExoticComponent<React.ComponentType<StaffDashboardProps>>;

type ClientAppProps = { 
  onBackToLanding: () => void; 
  onLogout: () => Promise<void>; 
  onRequireLogin: () => void; 
};
const ClientApp = lazy(() => 
  import('./client/ClientApp').then(module => ({ 
    default: module.ClientApp 
  }))
) as React.LazyExoticComponent<React.ComponentType<ClientAppProps>>;

type AppState = 'landing' | 'login' | 'otp-verification' | 'admin-dashboard' | 'manager-dashboard' | 'staff-dashboard' | 'client-app' | 'onboarding' | 'subscription-required';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>('free-trial');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { signOut, session } = useAuth();

  // Helper to get app state from URL path
  const getAppStateFromPath = (path: string): AppState => {
    if (path.startsWith('/admin-dashboard')) return 'admin-dashboard';
    if (path.startsWith('/manager-dashboard')) return 'manager-dashboard';
    if (path.startsWith('/staff-dashboard')) return 'staff-dashboard';
    if (path.startsWith('/client-app')) return 'client-app';
    if (path.startsWith('/login')) return 'login';
    if (path.startsWith('/otp-verification')) return 'otp-verification';
    if (path.startsWith('/onboarding')) return 'onboarding';
    if (path.startsWith('/subscription-required')) return 'subscription-required';
    return 'landing';
  };

  const appState = getAppStateFromPath(location.pathname);

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

      // Step 1: Create the tenant/organization first
      const tenantResult = await createNewTenant({
        userId: session.user.id,
        orgName: formData.businessName || 'My Salon',
        userName: formData.fullName,
        userEmail: formData.email || session.user.email,
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

  // Check session and redirect based on role (runs when session changes or on mount)
  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      // Mark that we're checking auth - this prevents showing landing page during check
      setIsCheckingAuth(true);

      // Wait a bit for session to load from Supabase storage
      // This prevents the flash when session is being retrieved
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!session?.user) {
        // If no session and we're on a protected route, go to landing or login
        if (appState === 'admin-dashboard' || appState === 'manager-dashboard' || appState === 'staff-dashboard') {
          // For admin/manager/staff routes, redirect to login page
          navigate('/login', { replace: true });
        } else if (appState === 'client-app') {
          navigate('/', { replace: true });
        }
        setIsCheckingAuth(false);
        return;
      }

      try {
        // IMPORTANT: Handle pending subscription FIRST before checking profile role
        // This ensures the user gets upgraded to admin before we redirect
        const pendingData = localStorage.getItem('pending_subscription');
        if (pendingData) {
          console.log('Found pending subscription, processing before role check...');
          await handlePendingSubscription();
          // Re-fetch profile after processing pending subscription
        }

        const profile = await getMyProfile();
        console.log('Session check - Profile:', profile);
        if (profile) {
          console.log(`Session check - User role: ${profile.role}, Current appState: ${appState}`);
          // Redirect based on role - always check and redirect if needed
          if (profile.role === 'admin') {
            const hasSubscription = await hasActiveSubscription(profile.id);
            if (!hasSubscription) {
              if (appState !== 'subscription-required') {
                navigate('/subscription-required', { replace: true });
              }
            } else {
              if (appState !== 'admin-dashboard') {
                navigate('/admin-dashboard', { replace: true });
              }
            }
          } else if (profile.role === 'manager') {
            if (appState !== 'manager-dashboard') {
              navigate('/manager-dashboard', { replace: true });
            }
          } else if (profile.role === 'staff') {
            if (appState !== 'staff-dashboard') {
              navigate('/staff-dashboard', { replace: true });
            }
          } else {
            // Client role
            if (appState !== 'client-app' && appState !== 'onboarding' && appState !== 'subscription-required') {
              navigate('/client-app', { replace: true });
            }
          }
        }
      } catch (err) {
        console.error('Error checking session and redirecting:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSessionAndRedirect();
  }, [session, handlePendingSubscription, appState, navigate]);

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
                navigate('/subscription-required', { replace: true });
              } else {
                navigate('/admin-dashboard', { replace: true });
              }
            } else if (profile.role === 'manager') {
              navigate('/manager-dashboard', { replace: true });
            } else if (profile.role === 'staff') {
              navigate('/staff-dashboard', { replace: true });
            } else {
              navigate('/client-app', { replace: true });
            }
          }
        } catch (err) {
          console.error('Error getting profile after auth callback:', err);
        }
      }
    };

    handleAuthCallback();
  }, [session, handlePendingSubscription, navigate]);

  const handleGetStarted = () => {
    console.log('Book Now clicked - Redirecting to sign-up');
    setIsSignUpMode(true);
    navigate('/login');
  };

  const handleLogin = () => {
    setIsSignUpMode(false);
    navigate('/login');
  };

  const handleBackToLanding = () => {
    setIsSignUpMode(false);
    navigate('/');
  };

  // Check subscription and handle pending subscription after login
  const handleLoginSuccess = async (profile: Profile) => {
    // Handle pending subscription from onboarding
    await handlePendingSubscription();
    
    // Redirect based on role
    if (profile.role === 'admin' && session?.user) {
      // Check subscription for admin users
      const hasSubscription = await hasActiveSubscription(session.user.id);
      if (!hasSubscription) {
        navigate('/subscription-required', { replace: true });
        return;
      }
      navigate('/admin-dashboard', { replace: true });
    } else if (profile.role === 'manager') {
      navigate('/manager-dashboard', { replace: true });
    } else if (profile.role === 'staff') {
      navigate('/staff-dashboard', { replace: true });
    } else {
      navigate('/client-app', { replace: true });
    }
  };

  const handleClientLogin = () => {
    setIsSignUpMode(false);
    navigate('/client-app', { replace: true });
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
          navigate('/subscription-required', { replace: true });
          return;
        }
      }
      navigate('/admin-dashboard', { replace: true });
    } else if (profile.role === 'manager') {
      navigate('/manager-dashboard', { replace: true });
    } else if (profile.role === 'staff') {
      navigate('/staff-dashboard', { replace: true });
    } else {
      navigate('/client-app', { replace: true });
    }
  };

  const handleNavigateToOtp = (email: string, password: string) => {
    setOtpEmail(email);
    setOtpPassword(password);
    navigate('/otp-verification', { replace: true });
  };

  const handleBackFromOtp = () => {
    navigate('/login', { replace: true });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleStartOnboarding = (planType: PlanType) => {
    setSelectedPlanType(planType);
    navigate('/onboarding', { replace: true });
  };

  const handleOnboardingComplete = () => {
    // After onboarding, redirect to sign-up/login
    setIsSignUpMode(true);
    navigate('/login', { replace: true });
  };

  const handleBackFromOnboarding = () => {
    navigate('/', { replace: true });
  };


  // Show loading screen while checking authentication to prevent landing page flash
  // This prevents showing the landing page during the initial auth check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const LoadingFallback = ({ message }: { message: string }) => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );

  return (
    <Routes>
      {/* Landing Page */}
      <Route 
        path="/" 
        element={
          <RedesignedLandingPage 
            onGetStarted={handleGetStarted}
            onLogin={handleLogin}
            onStartOnboarding={handleStartOnboarding}
          />
        } 
      />

      {/* Login Page */}
      <Route 
        path="/login" 
        element={
          <AdminLogin 
            onLoginSuccess={handleLoginSuccess}
            onClientLogin={handleClientLogin}
            onBackToLanding={handleBackToLanding}
            onNavigateToOtp={handleNavigateToOtp}
            initialMode={isSignUpMode ? 'signup' : 'login'}
          />
        } 
      />

      {/* Admin Dashboard - Direct access with nested routes */}
      <Route 
        path="/admin-dashboard/*" 
        element={
          session?.user ? (
            <Suspense fallback={<LoadingFallback message="Loading dashboard..." />}>
              <NewAdminDashboard onLogout={handleLogout} />
            </Suspense>
          ) : (
            <AdminLogin 
              onLoginSuccess={handleLoginSuccess}
              onClientLogin={handleClientLogin}
              onBackToLanding={handleBackToLanding}
              onNavigateToOtp={handleNavigateToOtp}
              initialMode="login"
            />
          )
        } 
      />

      {/* OTP Verification */}
      <Route 
        path="/otp-verification" 
        element={
          <OtpVerification
            email={otpEmail}
            password={otpPassword}
            onVerificationSuccess={handleOtpVerificationSuccess}
            onBack={handleBackFromOtp}
          />
        } 
      />

      {/* Manager Dashboard - with nested routes */}
      <Route 
        path="/manager-dashboard/*" 
        element={
          <Suspense fallback={<LoadingFallback message="Loading manager dashboard..." />}>
            <ManagerDashboard onLogout={handleLogout} />
          </Suspense>
        } 
      />

      {/* Staff Dashboard - with nested routes */}
      <Route 
        path="/staff-dashboard/*" 
        element={
          <Suspense fallback={<LoadingFallback message="Loading staff dashboard..." />}>
            <StaffDashboard onLogout={handleLogout} />
          </Suspense>
        } 
      />

      {/* Client App */}
      <Route 
        path="/client-app" 
        element={
          <Suspense fallback={<LoadingFallback message="Loading app..." />}>
            <ClientApp 
              onBackToLanding={handleBackToLanding}
              onLogout={handleLogout}
              onRequireLogin={() => {
                setIsSignUpMode(true);
                navigate('/login');
              }}
            />
          </Suspense>
        } 
      />

      {/* Onboarding */}
      <Route 
        path="/onboarding" 
        element={
          <OnboardingPaymentScreen
            planType={selectedPlanType}
            onBack={handleBackFromOnboarding}
            onComplete={handleOnboardingComplete}
          />
        } 
      />

      {/* Subscription Required */}
      <Route 
        path="/subscription-required" 
        element={
          <SubscriptionRequired
            onSubscribe={(planType) => handleStartOnboarding(planType)}
            onBack={handleLogout}
          />
        } 
      />

      {/* Catch all - redirect to landing */}
      <Route 
        path="*" 
        element={
          <RedesignedLandingPage 
            onGetStarted={handleGetStarted}
            onLogin={handleLogin}
            onStartOnboarding={handleStartOnboarding}
          />
        } 
      />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
