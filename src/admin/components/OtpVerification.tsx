import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { getMyProfile, createProfile, type Profile } from '../../api/profile';
import { isSupabaseConfigured } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface OtpVerificationProps {
  email: string;
  password: string;
  onVerificationSuccess: (profile: Profile) => void;
  onBack: () => void;
}

export function OtpVerification({ email, password, onVerificationSuccess, onBack }: OtpVerificationProps) {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { sendOTP, verifyOTPCode } = useAuth();

  // Don't auto-send OTP - AdminLogin already sends it before redirecting
  // This prevents duplicate OTPs due to React StrictMode double-invocation
  // Users can manually click "Resend Code" if needed

  // Countdown timer effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Redirect happens in handleVerifyOtp after countdown completes
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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

      setSuccess('A 6-digit verification code has been sent to your email! Please check your inbox.');
    } catch (err) {
      console.error('OTP send error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: verifyData, error: verifyError } = await verifyOTPCode(email, code);
      
      if (verifyError) {
        setError(`Verification failed: ${verifyError.message || 'Invalid or expired code'}`);
        setLoading(false);
        return;
      }

      if (!verifyData?.user) {
        setError('Verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // Check if we have a session (user should be auto-signed in)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        // If no session, try to sign in manually
        console.log('No session found, attempting to sign in...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(`Account created but sign-in failed: ${signInError.message}. Please try logging in manually.`);
          setLoading(false);
          return;
        }
      }

      // Create profile for new user (handle gracefully if it already exists)
      try {
        if (verifyData.user) {
          await createProfile(verifyData.user.id, verifyData.user.email || null);
        }
      } catch (profileError: unknown) {
        // Only log if it's not a duplicate key error (which is expected)
        const error = profileError as { code?: string };
        if (error?.code !== '23505') {
          console.error('Profile creation error:', profileError);
        }
        // Continue anyway - profile might already exist from a previous attempt
      }

      setSuccess('Email verified successfully! Redirecting to dashboard...');
      setLoading(false);
      
      // Start 3-second countdown
      setCountdown(3);
      
      // Wait 3 seconds then redirect
      setTimeout(async () => {
        const profile = await getMyProfile();
        if (profile) {
          onVerificationSuccess(profile);
        } else if (verifyData.user) {
          // New users are always clients - create a default profile object
          const defaultProfile: Profile = {
            id: verifyData.user.id,
            email: verifyData.user.email || null,
            name: null,
            profile_picture: null,
            role: 'client',
            organization_id: null, // Clients are global (no organization)
            created_at: new Date().toISOString(),
          };
          onVerificationSuccess(defaultProfile);
        }
      }, 3000);
    } catch (err) {
      console.error('OTP verify error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen admin-dashboard flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to
          </p>
          <p className="mt-1 text-sm font-medium text-pink-600">{email}</p>
        </div>

        <div className="admin-card p-8">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign Up</span>
          </button>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center gap-3">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                    autoFocus={index === 0}
                    disabled={loading || countdown !== null}
                  />
                ))}
              </div>
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
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                    {countdown !== null && (
                      <p className="text-xs text-green-700 mt-1">
                        Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.join('').length !== 6 || countdown !== null}
                className="admin-button w-full flex justify-center py-3 px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Verifying...
                  </div>
                ) : countdown !== null ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Redirecting...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || countdown !== null}
                className="w-full flex justify-center py-2 px-4 text-sm text-pink-600 hover:text-pink-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

