
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { walletService } from '../../services/walletService';
import { WalletTransaction, EarningsAnalytics } from '../../types';
import { 
  Wallet, ArrowUpRight, History, Loader2, ArrowDownLeft, 
  TrendingUp, Calendar, CreditCard, X, ShieldCheck, 
  CheckCircle2, Info, Building2, Landmark, DollarSign
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
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
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Querying Financial Node</p>
      </div>
    );
  }

  const currentBalance = workerStats?.wallet_balance || 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Top Level Wallet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* The Vault Card */}
        <div className="lg:col-span-8 bg-blue-900 text-white p-14 sm:p-20 rounded-[5rem] border border-white/10 shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -mr-[250px] -mt-[250px] group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-4">
              <p className="text-xs text-blue-300 font-black uppercase tracking-[0.4em]">Settled Escrow Reserves</p>
              <div className="flex items-baseline gap-4">
                <h3 className="text-8xl font-black tracking-tighter">₹{currentBalance.toLocaleString()}</h3>
                <span className="text-green-400 font-black text-xl flex items-center gap-2">
                  <ArrowUpRight size={24} /> +12.4%
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="px-16 py-6 bg-white text-blue-900 rounded-[2.5rem] font-black text-xl shadow-3xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Wallet size={24} /> Withdraw Protocol
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                    <TrendingUp size={24} />
                 </div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</span>
              </div>
              <div className="space-y-1">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifetime Earnings</h4>
                 <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{(ledger.reduce((acc, curr) => curr.type === 'CREDIT' ? acc + curr.amount : acc, 0)).toLocaleString()}</p>
              </div>
           </div>
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                    <Calendar size={24} />
                 </div>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Cycle</span>
              </div>
              <div className="space-y-1">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Daily Pay</h4>
                 <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{Math.round(analytics.reduce((acc, curr) => acc + curr.amount, 0) / 7).toLocaleString()}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Earnings Analytics Chart */}
      <div className="bg-white p-12 sm:p-16 rounded-[4rem] border border-gray-100 shadow-sm space-y-12">
         <div className="flex justify-between items-end">
            <div className="space-y-2">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Performance Analytics</h4>
               <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Earnings Velocity</h3>
            </div>
            <div className="flex gap-2">
               {['7D', '30D', '90D'].map(t => (
                 <button key={t} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${t === '7D' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>{t}</button>
               ))}
            </div>
         </div>

         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: '#9ca3af'}}
                    dy={15}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { weekday: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 800, fill: '#9ca3af'}}
                    dx={-10}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                    labelStyle={{ fontWeight: 900, marginBottom: '5px', textTransform: 'uppercase', fontSize: '10px', color: '#9ca3af' }}
                    itemStyle={{ fontWeight: 900, color: '#2563eb', fontSize: '18px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#2563eb" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    animationDuration={2000}
                  />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Transaction Registry (Ledger) */}
      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-10 border-b border-gray-100 flex justify-between items-center">
            <h4 className="font-black text-xl uppercase tracking-widest text-gray-900 flex items-center gap-3">
               <History size={20} className="text-blue-600" />
               Transaction Registry
            </h4>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
               <ShieldCheck size={12} className="text-green-500" /> Kernel Verified Logs
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50">
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Context</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Type</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Settlement</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {ledger.length > 0 ? ledger.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                       <td className="px-10 py-6">
                          <p className="text-xs font-bold text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] font-medium text-gray-400">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                       </td>
                       <td className="px-10 py-6">
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{tx.description}</p>
                          {tx.reference_job_id && <p className="text-[10px] text-blue-600 font-bold">NODE_REF: #{tx.reference_job_id.slice(0,8)}</p>}
                       </td>
                       <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {tx.type}
                          </span>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <span className={`text-xl font-black tracking-tighter ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                             {tx.type === 'CREDIT' ? '+' : '-'} ₹{Math.abs(tx.amount).toLocaleString()}
                          </span>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={4} className="p-20 text-center">
                          <History size={64} className="text-gray-100 mx-auto mb-6" />
                          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Genesis Block: No transactions found</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-500 max-h-[90vh] flex flex-col">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <DollarSign size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Pledge Withdrawal</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Protocol: PAYOUT_AUTH_V2</p>
                  </div>
               </div>
               <button onClick={() => setShowWithdrawModal(false)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100"><X size={20} /></button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 space-y-10">
               {/* Amount Selector */}
               <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount to Liquidate</label>
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Available: ₹{currentBalance}</span>
                  </div>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-gray-300">₹</span>
                     <input 
                        type="number"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-14 pr-10 py-10 bg-gray-50 border-4 border-transparent focus:border-blue-600 rounded-[3rem] text-6xl font-black tracking-tighter outline-none transition-all shadow-inner"
                     />
                  </div>
               </div>

               {/* Bank Credentials */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-gray-900 font-black text-[10px] uppercase tracking-widest px-1">
                     <Landmark size={16} className="text-blue-600" /> Destination Credentials
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <input 
                        type="text"
                        placeholder="Beneficiary Bank Name"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                        className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold outline-none shadow-sm"
                     />
                     <div className="grid grid-cols-2 gap-4">
                        <input 
                           type="text"
                           placeholder="Account Number"
                           value={bankDetails.accountNumber}
                           onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                           className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold outline-none shadow-sm"
                        />
                        <input 
                           type="text"
                           placeholder="IFSC Protocol"
                           value={bankDetails.ifsc}
                           onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                           className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-bold outline-none shadow-sm"
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 flex items-start gap-4">
                  <Info className="text-orange-600 shrink-0" size={24} />
                  <p className="text-xs font-medium text-orange-800 leading-relaxed uppercase tracking-tight">
                     Withdrawals are subject to 24-hour auditing protocols to ensure ledger parity. Processing fees may apply based on banking node.
                  </p>
               </div>
            </div>

            <div className="p-10 bg-gray-50">
               <button 
                disabled={withdrawing || !payoutAmount || Number(payoutAmount) > currentBalance || !bankDetails.accountNumber}
                onClick={handleWithdrawal}
                className="w-full py-8 bg-blue-600 text-white rounded-[3rem] font-black text-xl uppercase tracking-[0.3em] shadow-3xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
               >
                 {withdrawing ? <Loader2 className="animate-spin" /> : <ShieldCheck size={28} />}
                 {withdrawing ? 'Authorizing...' : 'Finalize Request'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsView;
