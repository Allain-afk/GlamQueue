import React, { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { getMyProfile, type Profile } from '../../api/profile';
import { isSupabaseConfigured } from '../../lib/supabase';
import { LogIn, Eye, EyeOff, AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (profile: Profile) => void;
  onClientLogin: () => void;
  onBackToLanding: () => void;
  onNavigateToOtp: (email: string, password: string) => void;
  initialMode?: 'login' | 'signup';
}

export function AdminLogin({ onLoginSuccess, onClientLogin, onBackToLanding, onNavigateToOtp, initialMode = 'login' }: AdminLoginProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { signInWithEmail, sendOTP } = useAuth();


  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError('Configuration Error: Supabase environment variables are not set.');
      setLoading(false);
      return;
    }

    try {
      const { error: otpError } = await sendOTP(email, password);
      
      if (otpError) {
        const errorMessage = otpError.message || 'Unknown error';
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setError('Network Error: Unable to connect to Supabase. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.');
        } else {
          setError(`Failed to send verification code: ${errorMessage}`);
        }
        setLoading(false);
        return;
      }

      setSuccess('A 6-digit verification code has been sent to your email! Please check your inbox. Redirecting to verification page...');
      // Redirect to dedicated OTP verification page
      setTimeout(() => {
        onNavigateToOtp(email, password);
      }, 1500);
    } catch (err) {
      console.error('OTP send error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Validate password first
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Send OTP and redirect to verification page
      await handleSendOtp();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setError('Configuration Error: Supabase environment variables are not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel project settings.');
      setLoading(false);
      return;
    }

    try {
      if (!isSignUp) {
        // Login flow
        console.log('Attempting login with:', email);
        const { error: signInError } = await signInWithEmail(email, password);
        
        if (signInError) {
          console.error('Sign in error:', signInError);
          // Check for network errors
          const errorMessage = signInError.message || 'Unknown error';
          if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
            setError('Network Error: Unable to connect to Supabase. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables. Go to Vercel Dashboard > Settings > Environment Variables.');
          } else {
            setError(`Login failed: ${errorMessage}`);
          }
          return;
        }

        console.log('Sign in successful, getting profile...');
        // Get user profile to check role
        const profile = await getMyProfile();
        console.log('Profile data:', profile);
        
        if (!profile) {
          setError('Profile not found. Please contact administrator.');
          return;
        }

        // Handle different roles
        if (profile.role === 'admin') {
          console.log('Admin login successful!');
          onLoginSuccess(profile);
        } else if (profile.role === 'manager' || profile.role === 'staff') {
          // Managers and staff also use onLoginSuccess which will route them correctly
          console.log(`${profile.role} login successful!`);
          onLoginSuccess(profile);
        } else {
          // Redirect clients to client app
          console.log(`User with role '${profile.role}' logged in, redirecting to client app...`);
          setLoading(false);
          onClientLogin();
          return;
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : (isSignUp ? 'Sign up failed' : 'Login failed');
      
      // Check for network errors in catch block
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
        setError('Network Error: Unable to connect to Supabase. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables. Go to Vercel Dashboard > Settings > Environment Variables.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen admin-dashboard flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            {isSignUp ? (
              <UserPlus className="h-8 w-8 text-white" />
            ) : (
              <LogIn className="h-8 w-8 text-white" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp 
              ? 'Sign up to start booking salon services' 
              : 'Sign in to access your GlamQueue account'}
          </p>
        </div>

        <div className="admin-card p-8">
          {/* Back to Landing Page Button */}
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Landing Page</span>
          </button>

          {/* Sign Up / Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="admin-input"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      required={!isSignUp}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="admin-input"
                      style={{ paddingRight: '48px' }}
                      placeholder={isSignUp ? 'Create a password (min. 6 characters)' : 'Enter your password'}
                      minLength={isSignUp ? 6 : undefined}
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 -translate-y-1/2 right-3 p-1 flex items-center justify-center"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="admin-input"
                        style={{ paddingRight: '48px' }}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 flex items-center justify-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="admin-button w-full flex justify-center py-3 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isSignUp ? 'Sending verification code...' : 'Signing in...'}
                    </div>
                  ) : (
                    isSignUp ? 'Send Verification Code' : 'Sign in'
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full flex justify-center py-3 px-4 border-2 border-pink-300 text-sm font-medium rounded-lg text-pink-600 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  {isSignUp ? 'Sign in instead' : 'Sign up for an account'}
                </button>
              </div>
            </form>
        </div>

        {!isSignUp && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Enter your credentials to access your account
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
