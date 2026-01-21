
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: UserRole) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut safety exit:", e);
    }
  },

  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Identity Fetch Critical Failure:', error);
        return null;
      }

      if (!data) {
        // This is a common race condition during first signup.
        // The trigger handles it, but client might fetch before trigger finishes.
        console.warn(`Kernel: Profile for ${userId} not initialized yet.`);
        return null;
      }
      
      return {
        id: data.id,
        email: data.email,
        name: data.full_name,
        role: data.role as UserRole,
        verified: data.verified,
        avatar: data.avatar_url,
        phone: data.phone
      };
    } catch (e) {
      console.error('Security Layer Fault:', e);
      return null;
    }
  }
};
