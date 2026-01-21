
import { supabase } from '../lib/supabase';

export const workerService = {
  async submitApplication(workerId: string, skills: string[], summary: string) {
    const { data, error } = await supabase.rpc('submit_worker_application', {
      p_worker_id: workerId,
      p_skills: skills,
      p_summary: summary
    });
    if (error) throw error;
    return data;
  },

  async getMyApplication(workerId: string) {
    const { data, error } = await supabase
      .from('workers_applications')
      .select('*')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateOnlineStatus(workerId: string, isOnline: boolean) {
    const { error } = await supabase
      .from('workers')
      .update({ is_online: isOnline })
      .eq('id', workerId);
    if (error) throw error;
  },

  async getWorkerStats(workerId: string) {
    const { data, error } = await supabase
      .from('workers')
      .select('rating, total_jobs, admin_approved, wallet_balance, skills')
      .eq('id', workerId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(workerId: string, data: { fullName?: string, phone?: string, skills?: string[], avatarUrl?: string }) {
    const { data: result, error } = await supabase.rpc('update_worker_profile', {
      p_worker_id: workerId,
      p_full_name: data.fullName,
      p_phone: data.phone,
      p_skills: data.skills,
      p_avatar_url: data.avatarUrl
    });
    if (error) throw error;
    return result;
  }
};
