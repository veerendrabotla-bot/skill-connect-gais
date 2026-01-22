
import { supabase } from '../lib/supabase';
import { WalletTransaction, ServiceCategory } from '../types';

export interface PlatformKPIs {
  active_deployments: number;
  pending_kyc: number;
  monthly_volume: number;
  system_status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  generated_at: string;
}

export interface SOSAlert {
  id: string;
  job_id: string;
  actor_id: string;
  location_lat: number;
  location_lng: number;
  status: 'ACTIVE' | 'RESPONDED' | 'RESOLVED';
  created_at: string;
  customer_name?: string;
  worker_name?: string;
}

export interface Promotion {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  used_count: number;
  expires_at: string;
}

export interface WorkerAppEnriched {
  id: string;
  worker_id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  skills: string[];
  experience_summary: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  admin_reason?: string;
  current_rating?: number;
}

export interface LiveJobEnriched {
  id: string;
  status: string;
  price: number;
  description: string;
  location_address: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  worker_name?: string;
  worker_email?: string;
  worker_rating?: number;
  category_name: string;
  category_icon: string;
  metadata?: any;
}

export interface WithdrawalEnriched {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_email: string;
  amount: number;
  bank_details: any;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  admin_reason?: string;
  created_at: string;
  current_vault_balance: number;
}

export interface DisputeEnriched {
  id: string;
  job_id: string;
  reporter_id: string;
  category: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  admin_id?: string;
  admin_notes?: string;
  created_at: string;
  job_price: number;
  job_status: string;
  category_name: string;
  customer_name: string;
  customer_email: string;
  worker_name?: string;
  worker_email?: string;
}

export interface FiscalHealth {
  gross_volume: number;
  net_yield: number;
  tax_liability: number;
  capital_in_transit: number;
  timestamp: string;
}

export interface RevenueLog {
  id: string;
  job_id: string;
  payment_id: string;
  gross_amount: number;
  commission_amount: number;
  tax_amount: number;
  net_platform_yield: number;
  created_at: string;
}

export interface RevenuePoint {
  day: string;
  gross_volume: number;
  net_yield: number;
  tax_collected: number;
}

export interface ForensicLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}

export interface ComplianceSummary {
  kyc_audited: number;
  disputes_settled: number;
  payouts_authorized: number;
  recent_mutations: number;
}

const isMissingSchemaError = (error: any) => {
  return error?.code === 'PGRST205' || error?.message?.includes('Could not find the table');
};

export const adminService = {
  // --- SOVEREIGN SIMULATION ---
  async simulateTier(tier: string | null) {
    const { data, error } = await supabase.rpc('simulate_admin_tier', { p_tier: tier });
    if (error) throw error;
    return data;
  },

  // --- ROOT DIAGNOSTICS ---
  async checkSchemaParity() {
    const requiredViews = [
      'admin_forensic_audit_view',
      'admin_worker_applications_view',
      'admin_live_jobs_view',
      'admin_withdrawals_view',
      'admin_disputes_view'
    ];
    
    const results: Record<string, boolean> = {};
    for (const view of requiredViews) {
      const { error } = await supabase.from(view).select('*').limit(1);
      results[view] = !isMissingSchemaError(error);
    }
    return results;
  },

  // --- CORE KPIs ---
  async getKPIs(): Promise<PlatformKPIs> {
    const { data, error } = await supabase.rpc('get_platform_kpis');
    if (error) {
      if (isMissingSchemaError(error)) {
        return { active_deployments: 0, pending_kyc: 0, monthly_volume: 0, system_status: 'DEGRADED', generated_at: new Date().toISOString() };
      }
      throw error;
    }
    return data;
  },

  /**
   * Fetches counts of safety critical events for the Global Alert Hub
   */
  async getLivePulse() {
    const { data: sosCount } = await supabase.from('sos_alerts').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
    const { data: disputeCount } = await supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'OPEN');
    return {
       sos_active: sosCount || 0,
       disputes_pending: disputeCount || 0
    };
  },

  // --- REAL-TIME SUBSCRIPTION HUB ---
  subscribeToAllChanges(onUpdate: () => void) {
    return supabase
      .channel('admin-global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers_applications' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, onUpdate)
      .subscribe();
  },

  subscribeToTable(table: string, onUpdate: () => void) {
    return supabase
      .channel(`admin-${table}-sync`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, onUpdate)
      .subscribe();
  },

  // --- SAFETY METHODS ---
  async getActiveSOS(): Promise<SOSAlert[]> {
    const { data, error } = await supabase
      .from('sos_alerts')
      .select('*, job:jobs(id, location_address, description)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
       ...d,
       location_lat: parseFloat(d.location_lat),
       location_lng: parseFloat(d.location_lng)
    }));
  },

  async updateSOSStatus(sosId: string, status: 'RESPONDED' | 'RESOLVED') {
    const { error } = await supabase.from('sos_alerts').update({ status }).eq('id', sosId);
    if (error) throw error;
  },

  // --- GROWTH METHODS ---
  async getPromotions(): Promise<Promotion[]> {
    const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createPromotion(code: string, percent: number, expiry: string) {
    const { error } = await supabase.from('promotions').insert({ code, discount_percent: percent, expires_at: expiry });
    if (error) throw error;
  },

  // --- AGILITY METHODS ---
  async updateCategory(catId: string, updates: Partial<ServiceCategory>) {
    const { error } = await supabase.from('service_categories').update(updates).eq('id', catId);
    if (error) throw error;
  },

  // --- DATA FETCHERS ---
  async getHealthLogs() {
    const { data, error } = await supabase
      .from('system_health_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  },

  async getPendingApplications(): Promise<WorkerAppEnriched[]> {
    const { data, error } = await supabase
      .from('admin_worker_applications_view')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });
    
    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return data || [];
  },

  async getLiveJobs(): Promise<LiveJobEnriched[]> {
    const { data, error } = await supabase
      .from('admin_live_jobs_view')
      .select('*')
      .neq('status', 'PAID')
      .neq('status', 'CANCELLED')
      .order('updated_at', { ascending: false });

    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return data || [];
  },

  async getWithdrawalRequests(): Promise<WithdrawalEnriched[]> {
    const { data, error } = await supabase
      .from('admin_withdrawals_view')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return data || [];
  },

  async getFiscalHealth(): Promise<FiscalHealth> {
    const { data, error } = await supabase.rpc('get_fiscal_health');
    if (error) {
      if (isMissingSchemaError(error)) return { gross_volume: 0, net_yield: 0, tax_liability: 0, capital_in_transit: 0, timestamp: new Date().toISOString() };
      throw error;
    }
    return data;
  },

  async getRevenueLogs(): Promise<RevenueLog[]> {
    const { data, error } = await supabase
      .from('platform_revenue_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return [];
    return data || [];
  },

  async getRevenueAnalytics(): Promise<RevenuePoint[]> {
    const { data, error } = await supabase.rpc('get_platform_revenue_stats');
    if (error) return [];
    return data || [];
  },

  async getDisputes(): Promise<DisputeEnriched[]> {
    const { data, error } = await supabase
      .from('admin_disputes_view')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: true });
    
    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return data || [];
  },

  async getForensicLogs(): Promise<ForensicLog[]> {
    const { data, error } = await supabase
      .from('admin_forensic_audit_view')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }
    return data || [];
  },

  async getComplianceSummary(): Promise<ComplianceSummary> {
    const { data, error } = await supabase.rpc('get_compliance_summary');
    if (error) return { kyc_audited: 0, disputes_settled: 0, payouts_authorized: 0, recent_mutations: 0 };
    return data;
  },

  // --- ACTIONS ---
  async processWithdrawal(withdrawalId: string, adminId: string, action: 'APPROVE' | 'REJECT', reason: string) {
    const { data, error } = await supabase.rpc('process_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_admin_id: adminId,
      p_action: action,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  },

  async getWorkerLedger(workerId: string): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('wallet_id', workerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      amount: parseFloat(d.amount),
      type: d.type as 'CREDIT' | 'DEBIT',
      description: d.description,
      timestamp: d.created_at,
      reference_job_id: d.reference_job_id
    }));
  },

  async adjustLedger(workerId: string, adminId: string, amount: number, description: string) {
    const { data, error } = await supabase.rpc('adjust_worker_ledger', {
      p_worker_id: workerId,
      p_admin_id: adminId,
      p_amount: amount,
      p_description: description
    });
    if (error) throw error;
    return data;
  },

  async resolveDispute(disputeId: string, adminId: string, decision: 'UPHOLD_REFUND' | 'DISMISS_RELEASE', notes: string) {
    const { data, error } = await supabase.rpc('resolve_dispute', {
      p_dispute_id: disputeId,
      p_admin_id: adminId,
      p_decision: decision,
      p_notes: notes
    });
    if (error) throw error;
    return data;
  },

  async approveWorker(applicationId: string, adminId: string, reason: string) {
    const { data, error } = await supabase.rpc('approve_worker_application', {
      p_app_id: applicationId,
      p_admin_id: adminId,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  },

  async rejectWorker(applicationId: string, adminId: string, reason: string) {
    const { data, error } = await supabase.rpc('reject_worker_application', {
      p_app_id: applicationId,
      p_admin_id: adminId,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  },

  async executeIntervention(jobId: string, adminId: string, action: 'TERMINATE' | 'FORCE_COMPLETE', reason: string) {
    const { data, error } = await supabase.rpc('admin_job_intervention', {
      p_job_id: jobId,
      p_admin_id: adminId,
      p_action: action,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  },

  async bootstrapTestData() {
    const { data, error } = await supabase.rpc('bootstrap_platform_data');
    if (error) throw error;
    return data;
  }
};
