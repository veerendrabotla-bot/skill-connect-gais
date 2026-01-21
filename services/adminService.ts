
import { supabase } from '../lib/supabase';
import { WalletTransaction } from '../types';

export interface PlatformKPIs {
  active_deployments: number;
  pending_kyc: number;
  monthly_volume: number;
  system_status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  generated_at: string;
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

export const adminService = {
  async getKPIs(): Promise<PlatformKPIs> {
    const { data, error } = await supabase.rpc('get_platform_kpis');
    if (error) throw error;
    return data;
  },

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
    if (error) throw error;
    return data || [];
  },

  async getLiveJobs(): Promise<LiveJobEnriched[]> {
    const { data, error } = await supabase
      .from('admin_live_jobs_view')
      .select('*')
      .neq('status', 'PAID')
      .neq('status', 'CANCELLED')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getWithdrawalRequests(): Promise<WithdrawalEnriched[]> {
    const { data, error } = await supabase
      .from('admin_withdrawals_view')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getFiscalHealth(): Promise<FiscalHealth> {
    const { data, error } = await supabase.rpc('get_fiscal_health');
    if (error) throw error;
    return data;
  },

  async getRevenueLogs(): Promise<RevenueLog[]> {
    const { data, error } = await supabase
      .from('platform_revenue_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async getRevenueAnalytics(): Promise<RevenuePoint[]> {
    const { data, error } = await supabase.rpc('get_platform_revenue_stats');
    if (error) throw error;
    return data || [];
  },

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

  async getDisputes(): Promise<DisputeEnriched[]> {
    const { data, error } = await supabase
      .from('admin_disputes_view')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
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

  async getForensicLogs(): Promise<ForensicLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles!actor_id(full_name, role)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return (data || []).map((d: any) => ({
      ...d,
      actor_name: d.actor?.full_name || 'System',
      actor_role: d.actor?.role || 'SYSTEM'
    }));
  },

  async getComplianceSummary(): Promise<ComplianceSummary> {
    const { data, error } = await supabase.rpc('get_compliance_summary');
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
  }
};