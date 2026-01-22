
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, UserRole, AdminLevel } from '../types';
import { identityService } from '../services/identityService';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsEmailVerification: boolean;
  workerStats: any | null;
  isInitializing: boolean;
  
  // Capability Flags
  isCustomer: boolean;
  isWorker: boolean;
  isAdmin: boolean;
  adminLevel: AdminLevel | null;
  isVerified: boolean;
  
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workerStats, setWorkerStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const retryCount = useRef(0);

  const fetchAndSetProfile = async (uid: string, sessionUser: any) => {
    try {
      if (sessionUser && !sessionUser.email_confirmed_at) {
        setNeedsEmailVerification(true);
        setUser(null);
        setLoading(false);
        setIsInitializing(false);
        return;
      }

      setNeedsEmailVerification(false);
      
      const context = await identityService.getFullContext();
      
      if (!context || !context.user) {
         console.warn("Identity context empty, profile might be initializing.");
         return;
      }

      setUser({
        id: context.user.id,
        email: context.user.email,
        name: context.user.full_name,
        role: context.user.role as UserRole,
        adminLevel: context.admin_level as AdminLevel,
        verified: context.user.verified,
        avatar: context.user.avatar_url,
        phone: context.user.phone
      });

      if (context.worker_stats) {
        setWorkerStats(context.worker_stats);
      }
      
      retryCount.current = 0;

    } catch (err) {
      console.error("Identity sync attempt failed:", err);
      
      if (retryCount.current < 3) {
        retryCount.current++;
        const backoff = retryCount.current * 1000;
        setTimeout(() => fetchAndSetProfile(uid, sessionUser), backoff);
        return;
      }
      
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchAndSetProfile(session.user.id, session.user);
      } else {
        setLoading(false);
        setIsInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug(`Auth Event Detected: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await fetchAndSetProfile(session.user.id, session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setWorkerStats(null);
        setNeedsEmailVerification(false);
        setLoading(false);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await authService.signOut();
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchAndSetProfile(session.user.id, session.user);
    }
  };

  const isCustomer = user?.role === UserRole.CUSTOMER;
  const isWorker = user?.role === UserRole.WORKER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const adminLevel = user?.adminLevel || null;
  const isVerified = user?.verified === true;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      needsEmailVerification, 
      workerStats, 
      isInitializing,
      isCustomer,
      isWorker,
      isAdmin,
      adminLevel,
      isVerified,
      logout, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
