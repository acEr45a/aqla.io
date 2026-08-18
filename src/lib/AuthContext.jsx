import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Load profile from public.profiles and auto-provision if missing
  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) return null;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        return {
          id: authUser.id,
          email: authUser.email,
          full_name: profile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
          role: profile.role || 'user',
          preferences: profile.preferences || {},
          welcome_email_sent: profile.welcome_email_sent || false,
          admin_trusted_devices: profile.admin_trusted_devices || [],
          ...profile,
        };
      }

      // Auto-provision profile record for new OAuth or email sign-ups
      const newProfile = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        role: 'user',
      };

      await supabase.from('profiles').upsert(newProfile).catch(() => {});

      return {
        id: authUser.id,
        email: authUser.email,
        full_name: newProfile.full_name,
        role: 'user',
        preferences: {},
        welcome_email_sent: false,
        admin_trusted_devices: [],
        ...newProfile,
      };
    } catch (err) {
      console.warn('loadProfile error fallback:', err);
      return {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        role: 'user',
        preferences: {},
        welcome_email_sent: false,
        admin_trusted_devices: [],
      };
    }
  }, []);

  // Re-check auth from Supabase session
  const checkUserAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await loadProfile(session.user);
        setUser(profile);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error.message || 'Auth check failed' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [loadProfile]);

  // Subscribe to Supabase auth state changes (handles OAuth callbacks, signOut, token refresh)
  useEffect(() => {
    let mounted = true;

    // Detect if OAuth callback parameters are present in URL
    const hasAuthParams =
      typeof window !== 'undefined' &&
      (window.location.hash.includes('access_token=') ||
        window.location.hash.includes('error=') ||
        window.location.search.includes('code='));

    if (hasAuthParams) {
      setIsLoadingAuth(true);
    }

    // Reactive listener for all auth state events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const profile = await loadProfile(session.user);
        if (!mounted) return;
        setUser(profile);
        setIsAuthenticated(true);
        setAuthError(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      } else if (event === 'SIGNED_OUT' || !hasAuthParams) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    // Initial getSession check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await loadProfile(session.user);
        if (!mounted) return;
        setUser(profile);
        setIsAuthenticated(true);
        setAuthError(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      } else if (!hasAuthParams) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const logout = useCallback(async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await loadProfile(session.user);
      setUser(profile);
    }
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: isLoadingAuth,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
