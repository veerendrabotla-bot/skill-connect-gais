
import React, { useState, useEffect } from 'react';
import { adminService, WorkerAppEnriched } from '../../services/adminService';
import { verifyWorkerDocument } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
// Added RefreshCcw to the import list
import { 
  Shield, User, CheckCircle, XCircle, Loader2, Sparkles, 
  ExternalLink, ArrowLeft, FileText, BadgeCheck, Scale,
  AlertTriangle, MessageSquare, Fingerprint, RefreshCcw
} from 'lucide-react';

const WorkerReviewView: React.FC = () => {
  const { user: admin } = useAuth();
  const [apps, setApps] = useState<WorkerAppEnriched[]>([]);
  const [selectedApp, setSelectedApp] = useState<WorkerAppEnriched | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [adminReason, setAdminReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingApplications();
      setApps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAI = async (text: string) => {
    setVerifying(true);
    try {
      const result = await verifyWorkerDocument(text);
      setAiResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedApp || !admin || !adminReason) {
      alert("A signed administrative reason is required for this protocol.");
      return;
    }
    setProcessing(true);
    try {
      if (status === 'APPROVED') {
        await adminService.approveWorker(selectedApp.id, admin.id, adminReason);
      } else {
        await adminService.rejectWorker(selectedApp.id, admin.id, adminReason);
      }
      setSelectedApp(null);
      setAdminReason('');
      setAiResult(null);
      loadApps();
    } catch (err) {
      alert("Protocol execution failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (selectedApp) {
    return (
      <div className="animate-in slide-in-from-right-10 duration-500">
        <button onClick={() => { setSelectedApp(null); setAiResult(null); }} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-10 hover:-translate-x-1 transition-transform">
          <ArrowLeft size={14} /> Return to Triage
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             <div className="bg-white p-10 sm:p-14 rounded-[4.5rem] border border-gray-100 shadow-sm space-y-12">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl">
                         <img src={selectedApp.avatar_url || `https://picsum.photos/seed/${selectedApp.worker_id}/200`} alt="Candidate" className="w-full h-full object-cover" />
                      </div>
                      <div>
                         <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{selectedApp.full_name}</h3>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">{selectedApp.email}</p>
                      </div>
                   </div>
                   <div className="px-6 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      Awaiting Audit
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <FileText size={14} /> Professional Manifest
                   </h4>
                   <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 italic text-gray-600 leading-relaxed font-medium text-lg">
                      "{selectedApp.experience_summary}"
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Shield size={14} /> Declared Skillsets
                   </h4>
                   <div className="flex flex-wrap gap-3">
                      {selectedApp.skills.map(s => (
                        <span key={s} className="px-6 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-700 uppercase tracking-wider shadow-sm">{s}</span>
                      ))}
                   </div>
                </div>

                {/* AI Advisor Panel */}
                <div className="bg-indigo-950 text-white p-10 sm:p-14 rounded-[3.5rem] space-y-10 relative overflow-hidden shadow-3xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                   <div className="flex items-center justify-between relative z-10">
                      <div className="space-y-2">
                         <h4 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                           <Sparkles className="text-indigo-300" /> Gemini Audit Signal
                         </h4>
                         <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.3em]">AI Intelligence Analysis</p>
                      </div>
                      {!aiResult && (
                         <button 
                           onClick={() => handleRunAI(selectedApp.experience_summary)}
                           disabled={verifying}
                           className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50"
                         >
                           {verifying ? <Loader2 className="animate-spin" /> : 'Execute AI Scan'}
                         </button>
                      )}
                   </div>

                   {aiResult && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10 animate-in zoom-in duration-500">
                        <div className="md:col-span-1 flex flex-col items-center justify-center p-8 bg-white/10 rounded-[2.5rem] border border-white/10">
                           <div className="relative w-24 h-24 flex items-center justify-center">
                              <svg className="absolute inset-0 w-full h-full -rotate-90">
                                 <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                 <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-400" strokeDasharray={276} strokeDashoffset={276 - (276 * aiResult.confidenceScore) / 100} />
                              </svg>
                              <span className="text-2xl font-black">{aiResult.confidenceScore}%</span>
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-widest mt-4 text-indigo-300">Confidence Score</p>
                        </div>
                        <div className="md:col-span-2 space-y-6">
                           <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Observation Report</p>
                              <p className="text-sm font-medium leading-relaxed italic text-indigo-50">"{aiResult.analysis}"</p>
                           </div>
                           {aiResult.flags?.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                                {aiResult.flags.map((f: string) => (
                                  <span key={f} className="px-3 py-1 bg-red-500/20 text-red-200 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                     <AlertTriangle size={10} /> {f}
                                  </span>
                                ))}
                             </div>
                           )}
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                     <Scale size={14} className="text-indigo-600" /> Judicial Decision
                   </h4>
                   <textarea 
                     value={adminReason}
                     onChange={(e) => setAdminReason(e.target.value)}
                     placeholder="Administrative justification for this decision (Logged)..."
                     rows={5}
                     className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none transition-all"
                   />
                </div>

                <div className="space-y-4">
                   <button 
                     onClick={() => handleDecision('APPROVED')}
                     disabled={processing || !adminReason}
                     className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {processing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                     Authorize Partner
                   </button>
                   <button 
                     onClick={() => handleDecision('REJECTED')}
                     disabled={processing || !adminReason}
                     className="w-full py-6 border-2 border-gray-100 text-red-500 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {processing ? <Loader2 className="animate-spin" /> : <XCircle size={20} />}
                     Reject Submission
                   </button>
                </div>
             </div>

             <div className="bg-indigo-900 text-white p-10 rounded-[3.5rem] shadow-3xl space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Fingerprint size={24} />
                   </div>
                   <h4 className="text-lg font-black tracking-tight uppercase">Audit Protocol</h4>
                </div>
                <p className="text-xs text-indigo-300 font-medium leading-relaxed italic relative z-10">
                   "All partner elevations require a verified administrative signature. Decisions are logged to the immutable ledger and can be subject to secondary review."
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Application Triage</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Managing the professional partner pipeline</p>
         </div>
         <button onClick={loadApps} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {loading ? (
            Array(6).fill(0).map((_, i) => (
               <div key={i} className="bg-white h-64 rounded-[3.5rem] border border-gray-100 animate-pulse"></div>
            ))
         ) : apps.length > 0 ? apps.map(app => (
            <div 
              key={app.id} 
              onClick={() => setSelectedApp(app)}
              className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col gap-8"
            >
               <div className="flex justify-between items-start">
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                     <img src={app.avatar_url || `https://picsum.photos/seed/${app.worker_id}/200`} alt="Candidate" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">Awaiting Audit</span>
                     <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
               </div>

               <div className="space-y-1">
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1">{app.full_name}</h4>
                  <p className="text-gray-400 font-bold text-xs line-clamp-1 italic">{app.experience_summary}</p>
               </div>

               <div className="flex flex-wrap gap-2">
                  {app.skills.slice(0, 3).map(s => (
                    <span key={s} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[8px] font-black text-gray-500 uppercase tracking-widest">{s}</span>
                  ))}
                  {app.skills.length > 3 && <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">+{app.skills.length - 3} More</span>}
               </div>

               <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  Inspect Dossier
               </button>
            </div>
         )) : (
            <div className="col-span-full py-40 text-center flex flex-col items-center">
               <Shield className="text-gray-100 mb-6" size={80} />
               <h3 className="text-3xl font-black text-gray-300 uppercase tracking-widest">Triage Clear</h3>
               <p className="text-gray-400 font-medium mt-2">Zero pending worker applications detected in the mesh.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default WorkerReviewView;
