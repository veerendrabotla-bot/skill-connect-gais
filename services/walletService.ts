
import { supabase } from '../lib/supabase';
import { WalletTransaction, EarningsAnalytics } from '../types';

export const walletService = {
  async getWallet(userId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getLedger(userId: string): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('wallet_id', userId)
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

  async getAnalytics(workerId: string): Promise<EarningsAnalytics[]> {
    const { data, error } = await supabase.rpc('get_worker_earnings_analytics', {
      p_worker_id: workerId
    });
    if (error) throw error;
    return data.map((d: any) => ({
      date: d.date,
      amount: parseFloat(d.amount)
    }));
  },

  async requestPayout(workerId: string, amount: number, bankDetails: any) {
    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_worker_id: workerId,
      p_amount: amount,
      p_bank_details: bankDetails
    });
    if (error) throw error;
    return data;
  }
};
