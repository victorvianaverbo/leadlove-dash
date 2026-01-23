import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getPlanByProductId, PlanKey } from '@/lib/stripe-plans';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscribed: boolean;
  subscriptionTier: PlanKey | null;
  subscriptionEnd: string | null;
  subscriptionLoading: boolean;
  isAdmin: boolean;
  extraProjects: number;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<PlanKey | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [extraProjects, setExtraProjects] = useState(0);

  const checkSubscription = useCallback(async () => {
    // Verificar se temos uma sessão válida antes de chamar a edge function
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !currentSession?.access_token || !currentSession?.user) {
      console.log('No valid session for subscription check');
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setIsAdmin(false);
      setExtraProjects(0);
      return;
    }

    // Verify token is not expired
    const tokenExpiry = currentSession.expires_at;
    if (tokenExpiry && tokenExpiry * 1000 < Date.now()) {
      console.log('Token expired, attempting refresh');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.log('Failed to refresh session');
        setSubscribed(false);
        setSubscriptionTier(null);
        setSubscriptionEnd(null);
        setIsAdmin(false);
        setExtraProjects(0);
        return;
      }
    }

    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        // Se for erro de autenticação, limpar estado
        if (error.message?.includes('Auth') || error.message?.includes('session')) {
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
          setIsAdmin(false);
          setExtraProjects(0);
        }
        return;
      }

      if (data?.error) {
        console.error('Subscription check returned error:', data.error);
        return;
      }

      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
      setIsAdmin(data.is_admin || false);
      setExtraProjects(data.extra_projects || 0);
      
      if (data.product_id) {
        const tier = getPlanByProductId(data.product_id);
        setSubscriptionTier(tier);
      } else {
        setSubscriptionTier(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
          setIsAdmin(false);
          setExtraProjects(0);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        // Se houver erro, limpar token antigo do localStorage
        const storageKey = `sb-ohwaygqxelyaytljbcsb-auth-token`;
        localStorage.removeItem(storageKey);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session?.access_token) {
      checkSubscription();
    } else {
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setIsAdmin(false);
      setExtraProjects(0);
    }
  }, [session?.access_token, checkSubscription]);

  // Periodically check subscription (every 60 seconds)
  useEffect(() => {
    if (!session?.access_token) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [session?.access_token, checkSubscription]);

  // Proactively refresh session every 10 minutes to prevent expiration
  useEffect(() => {
    if (!session?.access_token) return;

    const refreshSession = async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('Failed to refresh session:', error);
        } else if (data.session) {
          console.log('Session refreshed proactively');
        }
      } catch (e) {
        console.warn('Session refresh error:', e);
      }
    };

    const interval = setInterval(refreshSession, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [session?.access_token]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout request failed, cleaning up locally');
    } finally {
      setSession(null);
      setUser(null);
      setSubscribed(false);
      setSubscriptionTier(null);
      setSubscriptionEnd(null);
      setIsAdmin(false);
      setExtraProjects(0);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      subscriptionLoading,
      isAdmin,
      extraProjects,
      signUp, 
      signIn, 
      signOut,
      checkSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
