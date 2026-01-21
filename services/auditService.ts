
import { supabase } from '../lib/supabase';

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}

export const auditService = {
  async getRecentLogs(limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles!actor_id(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async getEntityLogs(entityId: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};
