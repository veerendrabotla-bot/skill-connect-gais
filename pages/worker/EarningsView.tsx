
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { walletService } from '../../services/walletService';
import { WalletTransaction, EarningsAnalytics } from '../../types';
// Add Search and RefreshCcw to the imports
import { 
  Wallet, ArrowUpRight, History, Loader2, ArrowDownLeft, 
  TrendingUp, Calendar, CreditCard, X, ShieldCheck, 
  CheckCircle2, Info, Building2, Landmark, DollarSign,
  Activity, ArrowRight, ShieldAlert, Fingerprint, Search, RefreshCcw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const EarningsView: React.FC = () => {
  const { user, workerStats, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<WalletTransaction[]>([]);
  const [analytics, setAnalytics] = useState<EarningsAnalytics[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  
  // Bank Details State
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifsc: '',
    bankName: ''
  });

  useEffect(() => {
    loadFiscalData();
  }, [user]);

  const loadFiscalData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ledgerData, analyticsData] = await Promise.all([
        walletService.getLedger(user.id),
        walletService.getAnalytics(user.id)
      ]);
      setLedger(ledgerData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load financial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!user || !payoutAmount || Number(payoutAmount) <= 0) return;
    setWithdrawing(true);
    try {
      await walletService.requestPayout(user.id, Number(payoutAmount), bankDetails);
      await loadFiscalData();
      await refreshProfile();
      setShowWithdrawModal(false);
      setPayoutAmount('');
      alert("Withdrawal Protocol Initialized. Processing in next 24-48h.");
    } catch (err: any) {
      alert(err.message || "Payout request failed.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Syncing Fiscal Ledger</p>
      </div>
    );
  }

  const currentBalance = workerStats?.wallet_balance || 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* Top Level Wallet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* The Vault Card */}
        <div className="lg:col-span-8 bg-indigo-900 text-white p-14 sm:p-20 rounded-[5rem] border border-white/10 shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -mr-[250px] -mt-[250px] group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-4">
              <p className="text-xs text-indigo-300 font-black uppercase tracking-[0.4em]">Verified Reserve Capital</p>
              <div className="flex items-baseline gap-6">
                <h3 className="text-9xl font-black tracking-tighter leading-none">₹{currentBalance.toLocaleString()}</h3>
                <span className="text-emerald-400 font-black text-2xl flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                  <ArrowUpRight size={28} /> +12%
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="px-16 py-7 bg-white text-indigo-900 rounded-[2.5rem] font-black text-xl shadow-3xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-4 group"
              >
                <Wallet size={28} className="group-hover:rotate-12 transition-transform" /> Withdraw Protocol
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-all">
              <div className="flex justify-between items-start">
                 <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <TrendingUp size={28} />
                 </div>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Peak</span>
              </div>
              <div className="space-y-1">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifetime Yield</h4>
                 <p className="text-5xl font-black text-gray-900 tracking-tighter">₹{(ledger.reduce((acc, curr) => curr.type === 'CREDIT' ? acc + curr.amount : acc, 0)).toLocaleString()}</p>
              </div>
           </div>
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-all">
              <div className="flex justify-between items-start">
                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Calendar size={28} />
                 </div>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rolling Cycle</span>
              </div>
              <div className="space-y-1">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">7D Velocity</h4>
                 <p className="text-5xl font-black text-gray-900 tracking-tighter">₹{Math.round(analytics.reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Analytics Engine Chart */}
      <div className="bg-white p-12 sm:p-16 rounded-[5rem] border border-gray-100 shadow-sm space-y-12">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
               <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-[0.5em]">
                  <Activity size={16} /> Fiscal Intelligence
               </div>
               <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Earnings Trajectory</h3>
            </div>
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
               {['7D', '30D', '90D'].map(t => (
                 <button key={t} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t === '7D' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>{t}</button>
               ))}
            </div>
         </div>

         <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                    dy={20}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}}
                    dx={-15}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                    labelStyle={{ fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', color: '#6366f1', tracking: '0.1em' }}
                    itemStyle={{ fontWeight: 900, color: '#111827', fontSize: '20px', tracking: '-0.02em' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#4F46E5" 
                    strokeWidth={5}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    animationDuration={2500}
                    strokeLinecap="round"
                  />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Forensic Ledger Table */}
      <div className="bg-white rounded-[4.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
         <div className="p-12 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-1">
               <h4 className="font-black text-2xl uppercase tracking-tighter text-gray-900 flex items-center gap-4">
                  <History size={24} className="text-indigo-600" />
                  Audit Ledger
               </h4>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Full settlement history for the current account node</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="relative w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                     type="text" 
                     placeholder="Search Transaction ID..."
                     className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-indigo-600 rounded-xl outline-none text-xs font-bold transition-all"
                  />
               </div>
               <button onClick={loadFiscalData} className="p-3 bg-gray-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
               </button>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50">
                     <th className="px-12 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp (UTC)</th>
                     <th className="px-12 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deployment Identity</th>
                     <th className="px-12 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Protocol</th>
                     <th className="px-12 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Settlement</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {ledger.length > 0 ? ledger.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                       <td className="px-12 py-8">
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{new Date(tx.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                       </td>
                       <td className="px-12 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                {tx.type === 'CREDIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                             </div>
                             <div>
                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{tx.description}</p>
                                {tx.reference_job_id && <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">DEPLOY_REF: #{tx.reference_job_id.slice(0,12)}</p>}
                             </div>
                          </div>
                       </td>
                       <td className="px-12 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                             tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                             {tx.type}
                          </span>
                       </td>
                       <td className="px-12 py-8 text-right">
                          <span className={`text-2xl font-black tracking-tighter ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                             {tx.type === 'CREDIT' ? '+' : '-'} ₹{Math.abs(tx.amount).toLocaleString()}
                          </span>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={4} className="p-32 text-center">
                          <History size={80} className="text-gray-100 mx-auto mb-8 opacity-20" />
                          <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Zero Historical Records</h3>
                          <p className="text-gray-400 font-medium mt-2 italic">Waiting for the first settlement event in the current node cycle.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] flex flex-col">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                    <Fingerprint size={40} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Vault Liquidation</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Protocol: SETTLEMENT_AUTH_V4</p>
                  </div>
               </div>
               <button onClick={() => setShowWithdrawModal(false)} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 shadow-sm border border-gray-100 transition-all hover:rotate-90 duration-300"><X size={24} /></button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 space-y-12">
               <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Auth Amount</label>
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">Limit: ₹{currentBalance}</span>
                  </div>
                  <div className="relative">
                     <span className="absolute left-8 top-1/2 -translate-y-1/2 text-5xl font-black text-gray-300">₹</span>
                     <input 
                        type="number"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-16 pr-10 py-12 bg-gray-50 border-4 border-transparent focus:border-indigo-600 rounded-[3.5rem] text-7xl font-black tracking-tighter outline-none transition-all shadow-inner text-gray-900 placeholder:text-gray-200"
                     />
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="flex items-center gap-4 text-gray-900 font-black text-[10px] uppercase tracking-[0.4em] px-2 border-b border-gray-100 pb-4">
                     <Landmark size={20} className="text-indigo-600" /> Destination Credentials
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                     <input 
                        type="text"
                        placeholder="Legal Beneficiary Institution"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                        className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] font-bold outline-none shadow-sm transition-all placeholder:text-gray-300"
                     />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input 
                           type="text"
                           placeholder="Account Index"
                           value={bankDetails.accountNumber}
                           onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                           className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] font-bold outline-none shadow-sm transition-all placeholder:text-gray-300"
                        />
                        <input 
                           type="text"
                           placeholder="IFSC Protocol"
                           value={bankDetails.ifsc}
                           onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                           className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] font-bold outline-none shadow-sm transition-all placeholder:text-gray-300"
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-orange-50 p-10 rounded-[3.5rem] border border-orange-100 flex items-start gap-6">
                  <ShieldAlert className="text-orange-600 shrink-0" size={32} />
                  <div className="space-y-2">
                     <p className="text-sm font-black text-orange-800 uppercase tracking-tight leading-relaxed">
                        Settlement Finality Agreement
                     </p>
                     <p className="text-[11px] text-orange-700/80 font-medium leading-relaxed italic uppercase tracking-tight">
                        Disbursements are finalized within a 24-hour auditing window. Ensure all site movements are logged for dispute immunity.
                     </p>
                  </div>
               </div>
            </div>

            <div className="p-10 bg-gray-50 shrink-0">
               <button 
                disabled={withdrawing || !payoutAmount || Number(payoutAmount) > currentBalance || !bankDetails.accountNumber}
                onClick={handleWithdrawal}
                className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.3em] shadow-3xl shadow-indigo-100 hover:bg-black transition-all flex items-center justify-center gap-6 active:scale-95 disabled:opacity-30"
               >
                 {withdrawing ? <Loader2 className="animate-spin" size={32} /> : <ShieldCheck size={32} />}
                 {withdrawing ? 'Authorizing Protocol...' : 'Confirm Withdrawal'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsView;
