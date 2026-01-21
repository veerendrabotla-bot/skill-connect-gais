
import { supabase } from '../lib/supabase';

export const systemService = {
  async logEvent(action: string, entityType: string, entityId: string, metadata: any = {}) {
    const { data, error } = await supabase.rpc('create_audit_entry', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: metadata
    });
    if (error) console.error("Audit System Failure:", error);
    return data;
  },

  async getJobHistory(jobId: string) {
    const { data, error } = await supabase.rpc('get_job_full_state', {
      p_job_id: jobId
    });
    if (error) throw error;
    return data?.[0];
  }
};
