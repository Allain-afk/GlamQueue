import React, { useState, useEffect, Suspense, lazy } from 'react';
import { RedesignedLandingPage } from './components/RedesignedLandingPage';
import { AdminLogin } from './admin/components/AdminLogin';
import { OtpVerification } from './admin/components/OtpVerification';
import { AuthProvider } from './auth/AuthContext';
import { useAuth } from './auth/useAuth';
import { type Profile } from './api/profile';
import { getMyProfile } from './api/profile';
import './index.css';

// Lazy load heavy components for code splitting
const NewAdminDashboard = lazy(() => import('./admin/components/NewAdminDashboard').then(module => ({ default: module.NewAdminDashboard })));
const ClientApp = lazy(() => import('./client/ClientApp').then(module => ({ default: module.ClientApp })));

type AppState = 'landing' | 'login' | 'otp-verification' | 'admin-dashboard' | 'client-app';

function AppContent() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPassword, setOtpPassword] = useState('');
  const { signOut, session } = useAuth();

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
          const profile = await getMyProfile();
          if (profile) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            
            // Redirect based on role
            if (profile.role === 'admin') {
              setAppState('admin-dashboard');
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
  }, [session]);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoginSuccess = (_profile: Profile) => {
    setAppState('admin-dashboard');
  };

  const handleClientLogin = () => {
    setIsSignUpMode(false);
    setAppState('client-app');
  };

  const handleOtpVerificationSuccess = (profile: Profile) => {
    // After OTP verification, redirect based on role
    if (profile.role === 'admin') {
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
    
    default:
      return (
        <RedesignedLandingPage 
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
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
