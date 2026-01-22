
import React, { useState, useEffect } from 'react';
import { adminService, WithdrawalEnriched, FiscalHealth, RevenueLog, RevenuePoint } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { 
  Landmark, Wallet, History, Search, ArrowLeft, 
  CheckCircle2, XCircle, Loader2, ShieldCheck, 
  Building2, RefreshCcw, AlertTriangle, Scale,
  TrendingUp, DollarSign, PieChart, Activity,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const FinancialAdminView: React.FC = () => {
  const { user: admin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'PAYOUTS' | 'TREASURY' | 'REVENUE'>('PAYOUTS');
  const [payouts, setPayouts] = useState<WithdrawalEnriched[]>([]);
  const [fiscalHealth, setFiscalHealth] = useState<FiscalHealth | null>(null);
  const [revenueLogs, setRevenueLogs] = useState<RevenueLog[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenuePoint[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<WithdrawalEnriched | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  
  const [adminReason, setAdminReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();

    // Fiscal Reactive Subscriptions
    const sub1 = adminService.subscribeToTable('withdrawals', loadInitialData);
    const sub2 = adminService.subscribeToTable('platform_revenue_ledger', loadInitialData);

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [payoutData, healthData, revData, statsData] = await Promise.all([
        adminService.getWithdrawalRequests(),
        adminService.getFiscalHealth(),
        adminService.getRevenueLogs(),
        adminService.getRevenueAnalytics()
      ]);
      setPayouts(payoutData);
      setFiscalHealth(healthData);
      setRevenueLogs(revData);
      setRevenueStats(statsData);
    } catch (err) {
      console.error("Fiscal Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectPayout = async (payout: WithdrawalEnriched) => {
    setSelectedPayout(payout);
    setLoadingLedger(true);
    try {
      const data = await adminService.getWorkerLedger(payout.worker_id);
      setLedger(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleDecision = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedPayout || !admin || !adminReason) {
      alert("A signed administrative reason is required for fiscal finality.");
      return;
    }
    setProcessing(true);
    try {
      await adminService.processWithdrawal(selectedPayout.id, admin.id, action, adminReason);
      setSelectedPayout(null);
      setAdminReason('');
      loadInitialData();
    } catch (err) {
      alert("Fiscal protocol failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (selectedPayout) {
    return (
      <div className="animate-in slide-in-from-right-10 duration-500 pb-20">
        <button onClick={() => setSelectedPayout(null)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-10 hover:-translate-x-1 transition-transform">
          <ArrowLeft size={14} /> Back to Payout Queue
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             <div className="bg-white p-10 sm:p-14 rounded-[4.5rem] border border-gray-100 shadow-sm space-y-12">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Beneficiary Node</p>
                      <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{selectedPayout.worker_name}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">{selectedPayout.worker_email}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Requested Capital</p>
                      <span className="text-5xl font-black text-indigo-600 tracking-tighter">₹{selectedPayout.amount}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6 bg-gray-50 p-8 rounded-[3rem] border border-gray-100 shadow-inner">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Building2 size={14} /> Bank Routing Data
                      </h4>
                      <div className="space-y-3">
                         <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase tracking-widest">Institution:</span>
                            <span className="text-gray-900 font-black uppercase">{selectedPayout.bank_details?.bankName || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase tracking-widest">Account:</span>
                            <span className="text-gray-900 font-black">•••• {selectedPayout.bank_details?.accountNumber?.slice(-4) || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase tracking-widest">IFSC Protocol:</span>
                            <span className="text-gray-900 font-black uppercase">{selectedPayout.bank_details?.ifsc || 'N/A'}</span>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-6 bg-indigo-900 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                      <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2 relative z-10">
                        <ShieldCheck size={14} /> Vault Standing
                      </h4>
                      <div className="space-y-1 relative z-10">
                         <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Current Liquid Balance</p>
                         <p className="text-3xl font-black tracking-tighter">₹{selectedPayout.current_vault_balance}</p>
                      </div>
                      <p className="text-[9px] text-indigo-300/60 font-bold uppercase italic relative z-10">Post-disbursement balance: ₹{selectedPayout.current_vault_balance - selectedPayout.amount}</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                     <History size={14} /> Forensic Ledger Audit
                   </h4>
                   <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50/50">
                              <tr>
                                 <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                 <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                 <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Settlement</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {loadingLedger ? (
                                 <tr><td colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-200" /></td></tr>
                              ) : ledger.length > 0 ? ledger.map(tx => (
                                 <tr key={tx.id} className="text-[10px] hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-4 text-gray-400 font-bold">{new Date(tx.timestamp).toLocaleDateString()}</td>
                                    <td className="px-8 py-4 text-gray-700 font-black uppercase tracking-tight">{tx.description}</td>
                                    <td className={`px-8 py-4 text-right font-black ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                       {tx.type === 'CREDIT' ? '+' : '-'} ₹{Math.abs(tx.amount)}
                                    </td>
                                 </tr>
                              )) : (
                                <tr><td colSpan={3} className="p-10 text-center text-gray-400 font-bold uppercase italic">No ledger history available for this node.</td></tr>
                              )}
                           </tbody>
                        </table>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                     <Scale size={14} className="text-indigo-600" /> Fiscal Directive
                   </h4>
                   <textarea 
                     value={adminReason}
                     onChange={(e) => setAdminReason(e.target.value)}
                     placeholder="State the audit result or rejection reason..."
                     rows={5}
                     className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none transition-all shadow-inner"
                   />
                </div>

                <div className="space-y-4">
                   <button 
                     onClick={() => handleDecision('APPROVE')}
                     disabled={processing || !adminReason}
                     className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                     Authorize Disbursement
                   </button>
                   <button 
                     onClick={() => handleDecision('REJECT')}
                     disabled={processing || !adminReason}
                     className="w-full py-6 border-2 border-gray-100 text-red-500 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {processing ? <Loader2 className="animate-spin" /> : <XCircle size={18} />}
                     Reject & Revert Funds
                   </button>
                </div>
             </div>

             <div className="bg-orange-50 p-10 rounded-[3.5rem] border border-orange-100 space-y-6 shadow-sm">
                <div className="flex items-center gap-3 text-orange-600 font-black text-[10px] uppercase tracking-widest">
                   <AlertTriangle size={20} /> Integrity Protocol
                </div>
                <p className="text-xs text-orange-800 font-medium leading-relaxed italic">
                   "Rejection will automatically trigger a capital reversion event, crediting the full amount back to the worker's vault in real-time."
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-widest">
               <Activity size={16} /> Gross Throughput
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{fiscalHealth?.gross_volume.toLocaleString() || '0'}</p>
         </div>
         <div className="bg-indigo-600 text-white p-8 rounded-[3rem] shadow-xl space-y-4 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 text-indigo-200 font-black text-[10px] uppercase tracking-widest">
               <TrendingUp size={16} /> Platform Yield
            </div>
            <p className="text-3xl font-black tracking-tighter">₹{fiscalHealth?.net_yield.toLocaleString() || '0'}</p>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-widest">
               <PieChart size={16} /> Tax Liability
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{fiscalHealth?.tax_liability.toLocaleString() || '0'}</p>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 text-orange-600 font-black text-[10px] uppercase tracking-widest">
               <DollarSign size={16} /> Capital In Transit
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{fiscalHealth?.capital_in_transit.toLocaleString() || '0'}</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
         <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm w-fit">
            {(['PAYOUTS', 'TREASURY', 'REVENUE'] as const).map(tab => (
               <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
               >
                  {tab}
               </button>
            ))}
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Fiscal Feed Live</span>
            </div>
            <button onClick={loadInitialData} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
               <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
         </div>
      </div>

      {activeSubTab === 'PAYOUTS' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading && payouts.length === 0 ? (
               Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white h-72 rounded-[4rem] border border-gray-100 animate-pulse"></div>
               ))
            ) : payouts.length > 0 ? payouts.map(p => (
               <div 
               key={p.id} 
               onClick={() => handleInspectPayout(p)}
               className="bg-white p-10 rounded-[4.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col gap-8 animate-in zoom-in"
               >
                  <div className="flex justify-between items-start">
                     <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <Landmark size={28} />
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Disbursement</p>
                        <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{p.amount.toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1">{p.worker_name}</h4>
                     <p className="text-xs text-gray-400 font-bold line-clamp-1 italic uppercase tracking-tight">{p.bank_details?.bankName || 'Institution Data Unavailable'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Vault Context</p>
                        <p className="text-xs font-black text-gray-900">₹{p.current_vault_balance}</p>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Standing</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{p.status}</p>
                     </div>
                  </div>

                  <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     Audit Beneficiary Ledger
                  </button>
               </div>
            )) : (
               <div className="col-span-full py-40 text-center flex flex-col items-center">
                  <ShieldCheck className="text-gray-100 mb-6" size={80} />
                  <h3 className="text-3xl font-black text-gray-300 uppercase tracking-widest">Fiscal Pipeline Cleared</h3>
                  <p className="text-gray-400 font-medium mt-2 italic">Zero pending payout authorizations detected in current cycle.</p>
               </div>
            )}
         </div>
      )}

      {activeSubTab === 'TREASURY' && (
         <div className="space-y-10 animate-in slide-in-from-bottom-5">
            <div className="bg-white p-12 sm:p-16 rounded-[4rem] border border-gray-100 shadow-sm space-y-12">
               <div className="flex items-end justify-between">
                  <div className="space-y-2">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Revenue Dynamics</h4>
                     <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Marketplace Yield Aggregator</h3>
                  </div>
                  <div className="flex gap-3 items-center bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
                     <BarChart3 size={18} className="text-indigo-600" />
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">30-Day Forensic Window</span>
                  </div>
               </div>

               <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={revenueStats}>
                        <defs>
                           <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                           </linearGradient>
                           <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                           dataKey="day" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{fontSize: 9, fontWeight: 900, fill: '#9ca3af'}}
                           dy={15}
                           tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{fontSize: 9, fontWeight: 900, fill: '#9ca3af'}}
                           dx={-10}
                           tickFormatter={(val) => `₹${val}`}
                        />
                        <Tooltip 
                           contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '24px' }}
                           labelStyle={{ fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', color: '#9ca3af' }}
                           itemStyle={{ fontWeight: 900, fontSize: '14px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                        <Area 
                           name="Gross GMV"
                           type="monotone" 
                           dataKey="gross_volume" 
                           stroke="#4F46E5" 
                           strokeWidth={4}
                           fillOpacity={1} 
                           fill="url(#colorGross)" 
                           animationDuration={1500}
                        />
                        <Area 
                           name="Net Platform Yield"
                           type="monotone" 
                           dataKey="net_yield" 
                           stroke="#10B981" 
                           strokeWidth={4}
                           fillOpacity={1} 
                           fill="url(#colorNet)" 
                           animationDuration={2000}
                        />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-indigo-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <ShieldCheck size={16} /> Compliance Reserve
                  </h4>
                  <div className="space-y-2">
                     <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Simulated GST Liability</p>
                     <p className="text-4xl font-black tracking-tighter">₹{fiscalHealth?.tax_liability.toLocaleString() || '0'}</p>
                  </div>
                  <p className="text-[10px] text-indigo-300/60 font-bold uppercase mt-8 leading-relaxed italic">
                     Funds held in temporary escrow for quarterly simulation of statutory obligations.
                  </p>
               </div>
               <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8 flex flex-col justify-center">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <PieChart size={16} className="text-emerald-500" /> Platform Performance Index
                  </h4>
                  <div className="grid grid-cols-2 gap-8">
                     <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Fee Margin</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tighter">10.0%</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Growth (30d)</p>
                        <p className="text-2xl font-black text-emerald-600 tracking-tighter">+14.2%</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeSubTab === 'REVENUE' && (
         <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                     <tr>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Payment</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Cut</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">GST Protocol</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Net Yield</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {revenueLogs.length > 0 ? revenueLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-10 py-6">
                              <p className="text-xs font-bold text-gray-500">{new Date(log.created_at).toLocaleDateString()}</p>
                              <p className="text-[10px] text-gray-400 uppercase">{new Date(log.created_at).toLocaleTimeString()}</p>
                           </td>
                           <td className="px-10 py-6 font-black text-gray-900">₹{log.gross_amount.toLocaleString()}</td>
                           <td className="px-10 py-6 font-bold text-blue-600">₹{log.commission_amount.toLocaleString()}</td>
                           <td className="px-10 py-6 font-bold text-red-500">₹{log.tax_amount.toLocaleString()}</td>
                           <td className="px-10 py-6 text-right font-black text-indigo-600">₹{log.net_platform_yield.toLocaleString()}</td>
                        </tr>
                     )) : (
                        <tr>
                           <td colSpan={5} className="p-20 text-center text-gray-400 font-black uppercase text-[10px] italic tracking-[0.2em]">Zero revenue events logged in current node cycle.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      )}
    </div>
  );
};

export default FinancialAdminView;
