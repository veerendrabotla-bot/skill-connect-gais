
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

export const identityService = {
  async getFullContext() {
    const { data, error } = await supabase.rpc('get_identity_context');
    if (error) {
      console.error("Identity Engine Error:", error);
      throw error;
    }
    return data;
  },

  async isRole(role: UserRole): Promise<boolean> {
    try {
      const { data } = await supabase.rpc('require_role', { p_required_role: role });
      return !!data;
    } catch {
      return false;
    }
  },

  async updateProfile(updates: { fullName?: string, phone?: string, avatarUrl?: string }) {
    const { data, error } = await supabase.rpc('update_profile', {
      p_full_name: updates.fullName,
      p_phone: updates.phone,
      p_avatar_url: updates.avatarUrl
    });
    if (error) throw error;
    return data;
  },

  async adminVerifyUser(targetUserId: string, status: boolean, reason: string) {
    const { data, error } = await supabase.rpc('admin_verify_user', {
      p_target_user_id: targetUserId,
      p_verified_status: status,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  }
};
