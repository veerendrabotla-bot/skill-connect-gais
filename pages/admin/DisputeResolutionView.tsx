
import React, { useState, useEffect } from 'react';
import { adminService, DisputeEnriched } from '../../services/adminService';
import { systemService } from '../../services/systemService';
import { useAuth } from '../../context/AuthContext';
import { STATUS_COLORS } from '../../constants';
import { 
  Scale, User, Gavel, Clock, MapPin, Search, 
  ArrowLeft, History, AlertTriangle, ShieldCheck, 
  XCircle, CheckCircle2, Loader2, ExternalLink,
  MessageSquare, Fingerprint, RefreshCcw, DollarSign
} from 'lucide-react';

const DisputeResolutionView: React.FC = () => {
  const { user: admin } = useAuth();
  const [disputes, setDisputes] = useState<DisputeEnriched[]>([]);
  const [selectedCase, setSelectedCase] = useState<DisputeEnriched | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCase, setLoadingCase] = useState(false);
  
  // Judicial State
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDisputes();
      setDisputes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectCase = async (dispute: DisputeEnriched) => {
    setSelectedCase(dispute);
    setLoadingCase(true);
    try {
      const data = await systemService.getJobHistory(dispute.job_id);
      setTimeline(data?.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCase(false);
    }
  };

  const handleJudgment = async (decision: 'UPHOLD_REFUND' | 'DISMISS_RELEASE') => {
    if (!selectedCase || !admin || !adminNotes) {
      alert("A signed administrative judgment and reasoning is required for case finality.");
      return;
    }
    setProcessing(true);
    try {
      await adminService.resolveDispute(selectedCase.id, admin.id, decision, adminNotes);
      setSelectedCase(null);
      setAdminNotes('');
      loadDisputes();
    } catch (err) {
      alert("Judicial execution failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (selectedCase) {
    return (
      <div className="animate-in slide-in-from-right-10 duration-500">
        <button onClick={() => setSelectedCase(null)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-10 hover:-translate-x-1 transition-transform">
          <ArrowLeft size={14} /> Back to Court Bench
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             <div className="bg-white p-10 sm:p-14 rounded-[4.5rem] border border-gray-100 shadow-sm space-y-12">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-red-100">
                        <Gavel size={36} />
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Arbitration Case File</h3>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">CASE_ID: #{selectedCase.id.slice(0, 16)}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Escrow at Stake</p>
                      <span className="text-4xl font-black text-indigo-600 tracking-tighter">₹{selectedCase.job_price}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6 bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User size={14} /> Complainant (Customer)
                      </h4>
                      <div className="space-y-1">
                         <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedCase.customer_name}</p>
                         <p className="text-xs text-gray-500 font-bold">{selectedCase.customer_email}</p>
                      </div>
                   </div>
                   <div className="space-y-6 bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Fingerprint size={14} /> Respondent (Worker)
                      </h4>
                      <div className="space-y-1">
                         <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedCase.worker_name || 'N/A'}</p>
                         <p className="text-xs text-gray-500 font-bold">{selectedCase.worker_email || 'N/A'}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                     <MessageSquare size={14} /> Statement of Facts
                   </h4>
                   <div className="bg-red-50/30 p-10 rounded-[3rem] border border-red-50 italic text-gray-700 leading-relaxed font-medium text-lg shadow-inner">
                      "{selectedCase.reason}"
                   </div>
                </div>

                <div className="space-y-8 pt-6 border-t border-gray-50">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} /> Logged Deployment Evidence
                   </h4>
                   <div className="space-y-6 pl-4 border-l-2 border-gray-50">
                      {loadingCase ? (
                        <div className="py-10 flex items-center gap-4 text-gray-400 animate-pulse">
                           <Loader2 className="animate-spin" size={20} />
                           <span className="text-xs font-black uppercase tracking-widest">Reconstructing Timeline...</span>
                        </div>
                      ) : timeline.length > 0 ? timeline.map(ev => (
                        <div key={ev.id} className="relative pl-8 group">
                           <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-sm"></div>
                           <div className="space-y-1">
                              <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{ev.to_status.replace(/_/g, ' ')}</p>
                              <p className="text-[10px] text-gray-400 font-bold">{new Date(ev.created_at).toLocaleString()}</p>
                           </div>
                        </div>
                      )) : (
                        <p className="text-sm font-bold text-gray-300 uppercase italic">Timeline genesis inaccessible.</p>
                      )}
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                     <Scale size={14} className="text-indigo-600" /> Judicial Verdict
                   </h4>
                   <textarea 
                     value={adminNotes}
                     onChange={(e) => setAdminNotes(e.target.value)}
                     placeholder="State the formal reasoning for this judgment..."
                     rows={5}
                     className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none transition-all shadow-inner"
                   />
                </div>

                <div className="space-y-4">
                   <button 
                     onClick={() => handleJudgment('DISMISS_RELEASE')}
                     disabled={processing || !adminNotes}
                     className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                     Dismiss & Release Escrow
                   </button>
                   <button 
                     onClick={() => handleJudgment('UPHOLD_REFUND')}
                     disabled={processing || !adminNotes}
                     className="w-full py-6 border-2 border-gray-100 text-red-500 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {processing ? <Loader2 className="animate-spin" /> : <XCircle size={18} />}
                     Uphold & Refund Customer
                   </button>
                </div>
             </div>

             <div className="bg-orange-50 p-10 rounded-[3.5rem] border border-orange-100 space-y-6">
                <div className="flex items-center gap-3 text-orange-600 font-black text-[10px] uppercase tracking-widest">
                   <AlertTriangle size={20} /> Arbitrator Policy
                </div>
                <p className="text-xs text-orange-800 font-medium leading-relaxed italic">
                   "Upholding a dispute terminates the deployment and prevents the worker from receiving capital. Releasing funds acknowledges service completion despite grievances."
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
         <div className="space-y-1">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Judicial Docket</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arbitrating platform disputes and escrow locks</p>
         </div>
         <div className="flex gap-4">
            <div className="relative w-72">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
               <input 
                 type="text" 
                 placeholder="Search Case ID..."
                 className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-indigo-600 text-xs font-bold shadow-sm"
               />
            </div>
            <button onClick={loadDisputes} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
               <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {loading ? (
            Array(3).fill(0).map((_, i) => (
               <div key={i} className="bg-white h-72 rounded-[4rem] border border-gray-100 animate-pulse"></div>
            ))
         ) : disputes.length > 0 ? disputes.map(d => (
            <div 
              key={d.id} 
              onClick={() => handleInspectCase(d)}
              className="bg-white p-10 rounded-[4.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col gap-8"
            >
               <div className="flex justify-between items-start">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                     <Scale size={28} />
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Escrow Locked</p>
                     <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{d.job_price.toLocaleString()}</span>
                  </div>
               </div>

               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-black uppercase tracking-widest">{d.category}</span>
                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Case # {d.id.slice(0,8)}</p>
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1 mt-2">{d.customer_name} vs {d.worker_name || 'N/A'}</h4>
                  <p className="text-xs text-gray-400 font-bold line-clamp-2 italic leading-relaxed">"{d.reason}"</p>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                     <Clock size={12} className="text-gray-400" />
                     <p className="text-[10px] font-black text-gray-900">4h Open</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                     <AlertTriangle size={12} className="text-red-500" />
                     <p className="text-[10px] font-black text-gray-900 uppercase">Priority</p>
                  </div>
               </div>

               <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  Inspect Evidence
               </button>
            </div>
         )) : (
            <div className="col-span-full py-40 text-center flex flex-col items-center">
               <CheckCircle2 className="text-gray-100 mb-6" size={80} />
               <h3 className="text-3xl font-black text-gray-300 uppercase tracking-widest">Bench is Clear</h3>
               <p className="text-gray-400 font-medium mt-2 italic">Zero open disputes detected in the arbitration pipeline.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default DisputeResolutionView;
