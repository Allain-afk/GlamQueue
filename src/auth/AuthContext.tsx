import { useEffect, useState } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { createAndStoreOTP, sendOTPEmail, verifyOTP } from '../api/otp';
import { AuthContext } from './AuthContextInstance';

type AuthResponse = {
  user?: User | null;
  session?: Session | null;
};

export type Ctx = {
  session: Session | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signInWithOAuth: (provider: 'google' | 'azure') => Promise<{ error?: AuthError }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ data?: AuthResponse; error?: AuthError }>;
  sendOTP: (email: string, password: string) => Promise<{ code?: string; error?: Error | AuthError }>;
  verifyOTPCode: (email: string, code: string) => Promise<{ data?: AuthResponse; error?: Error | AuthError }>;
  signOut: () => Promise<void>;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    return { error: result.error || undefined };
  };

  const signInWithOAuth = async (provider: 'google' | 'azure') => {
    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Works with our state-machine app; session is picked up via detectSessionInUrl.
        redirectTo: window.location.origin,
      },
    });
    return { error: result.error || undefined };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const result = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    return { 
      data: result.data ? { user: result.data.user, session: result.data.session } : undefined,
      error: result.error || undefined
    };
  };

  const sendOTP = async (email: string, password: string) => {
    // Generate and store OTP
    const { code, error: createError } = await createAndStoreOTP(email, password);
    
    if (createError) {
      // If table doesn't exist, we'll still generate the code but log it
      console.warn('Could not store OTP in database:', createError);
      // Continue anyway - code is still generated
    }

    // Send OTP via email (this will also log to console)
    const { code: returnedCode, error: sendError } = await sendOTPEmail(email, code);
    
    if (sendError) {
      // Even if sending fails, the code is logged in sendOTPEmail
      return { error: sendError, code: returnedCode || code };
    }

    return { code: returnedCode || code };
  };

  const verifyOTPCode = async (email: string, code: string) => {
    // Verify OTP and get password
    const { password, error: verifyError } = await verifyOTP(email, code);
    
    if (verifyError || !password) {
      return { error: verifyError || new Error('Invalid verification code') };
    }

    // Create account using Edge Function (Admin API)
    // This bypasses the Email provider requirement and creates user directly
    try {
      const { data: createUserData, error: createError } = await supabase.functions.invoke('create-user', {
        body: { email, password }
      });

      if (createError) {
        return { error: createError };
      }

      if (!createUserData?.user) {
        return { error: new Error('Failed to create user account') };
      }

      // Sign in the user automatically after account creation
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, return the user data - user will need to manually login
        console.warn('Auto sign-in failed:', signInError);
        return { data: { user: createUserData.user }, error: signInError };
      }

      // Return sign-in data which includes session
      return { data: signInData || { user: createUserData.user } };
    } catch (err) {
      console.error('Error creating user:', err);
      return { error: err };
    }
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ session, signInWithEmail, signInWithOAuth, signUpWithEmail, sendOTP, verifyOTPCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

