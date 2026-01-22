
import React, { useState, useEffect } from 'react';
import { Job, JobStatus } from '../../types';
import { jobService } from '../../services/jobService';
import { locationService } from '../../services/locationService';
import { STATUS_COLORS, SERVICE_CATEGORIES } from '../../constants';
import InvoiceModal from '../../components/worker/InvoiceModal';
import MapView from '../../components/MapView';
import { 
  Navigation, ShieldCheck, MapPin, Clock, Phone, 
  MessageSquare, AlertTriangle, ArrowLeft, Zap, CheckCircle2,
  Lock, Loader2, Info, Gavel, PartyPopper, Wallet,
  Fingerprint, ShieldEllipsis, Terminal, LifeBuoy, Sparkles, Wrench
} from 'lucide-react';

interface Props {
  job: Job;
  onBack: () => void;
  onStatusUpdate: (jobId: string, next: JobStatus) => Promise<void>;
}

const JobExecutionHub: React.FC<Props> = ({ job, onBack, onStatusUpdate }) => {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [sosLoading, setSosLoading] = useState(false);

  useEffect(() => {
    if (job.status !== JobStatus.STARTED) return;
    const start = new Date(job.updatedAt).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsedTime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [job.status, job.updatedAt]);

  const handleTransit = async () => {
    setSubmitting(true);
    try {
      await jobService.initializeTransit(job.id, job.workerId!);
      await onStatusUpdate(job.id, JobStatus.IN_TRANSIT);
    } catch (err) {
      alert("Transit initialization failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSOS = async () => {
    const confirm = window.confirm("Trigger EMERGENCY SOS? This broadcasts your coordinates to all active administrators immediately.");
    if (!confirm) return;

    setSosLoading(true);
    try {
       const pos = await locationService.getCurrentPosition();
       await jobService.triggerSOS(job.id, pos.lat, pos.lng);
       alert("SOS Broadcast Active. Stay in a safe location. Admins have been notified.");
    } catch (err) {
       alert("SOS Protocol Fault. Use manual emergency services immediately.");
    } finally {
       setSosLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    setSubmitting(true);
    try {
      const success = await jobService.updateJobStatus(job.id, JobStatus.STARTED, otp, job.workerId);
      if (success) {
        await onStatusUpdate(job.id, JobStatus.STARTED);
      }
    } catch (err) {
      alert("Invalid Security Token.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeInvoice = async (invoice: any) => {
    setSubmitting(true);
    try {
      await jobService.finalizeInvoice(job.id, job.workerId!, invoice);
      await onStatusUpdate(job.id, JobStatus.COMPLETED_PENDING_PAYMENT);
      setShowInvoice(false);
    } catch (err) {
      alert("Ledger sync failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (job.status === JobStatus.PAID) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-[100] flex items-center justify-center p-6 text-white animate-in zoom-in duration-500">
        <div className="max-w-md w-full text-center space-y-12">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
            <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center text-indigo-600 mx-auto relative shadow-3xl border-8 border-white/20">
              <PartyPopper size={64} />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">Mission Complete</h2>
            <p className="text-indigo-300 font-bold text-lg uppercase tracking-widest italic">Capital successfully released to vault.</p>
          </div>
          <div className="bg-white/5 p-10 rounded-[3.5rem] border border-white/10 backdrop-blur-2xl shadow-inner">
             <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Settlement Received</p>
                <div className="flex items-center gap-5 text-6xl font-black tabular-nums">
                   <Wallet size={48} className="text-indigo-400" /> ₹{(job.price * 0.9).toFixed(0)}
                </div>
             </div>
          </div>
          <button 
            onClick={onBack}
            className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] shadow-3xl hover:bg-white hover:text-indigo-900 transition-all active:scale-95"
          >
            Acknowledge & Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 h-24 flex items-center justify-between z-10">
         <button onClick={onBack} className="p-4 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group flex items-center gap-2">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Back to Fleet Grid</span>
         </button>
         <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-600">
               <Terminal size={14} />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Tactical Interface</p>
            </div>
            <p className="text-lg font-black text-gray-900 uppercase tracking-tighter">NODE_REF: #{job.id.slice(0,12)}</p>
         </div>
         <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border ${STATUS_COLORS[job.status]}`}>
            {job.status.replace(/_/g, ' ')}
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Primary Action Zone */}
           <div className="lg:col-span-8 bg-white p-10 sm:p-14 rounded-[4.5rem] border border-gray-100 shadow-sm space-y-12">
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Deployment Strategy</h2>
                 <div className="flex items-center gap-3 text-gray-500 font-bold text-xl leading-relaxed">
                    <MapPin size={28} className="text-indigo-600 shrink-0" />
                    <span>{job.location.address}</span>
                 </div>
              </div>

              <div className="bg-gray-50 p-10 rounded-[4rem] border border-gray-100 min-h-[450px] flex items-center justify-center relative overflow-hidden shadow-inner group">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 
                 {job.status === JobStatus.ASSIGNED && (
                   <div className="text-center space-y-10 relative z-10 animate-in zoom-in">
                      <div className="relative mx-auto w-32 h-32">
                        <div className="absolute -inset-10 bg-indigo-100 rounded-full animate-pulse"></div>
                        <div className="w-32 h-32 bg-indigo-600 rounded-[3rem] flex items-center justify-center text-white mx-auto shadow-3xl relative group-hover:scale-110 transition-transform duration-700">
                           <Navigation size={64} />
                        </div>
                      </div>
                      <div className="space-y-4">
                         <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Mission Initialized</h3>
                         <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] max-w-xs mx-auto italic">Confirm transit protocols to begin navigation to deployment sector.</p>
                      </div>
                      <button 
                        onClick={handleTransit}
                        disabled={submitting}
                        className="w-full px-16 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] shadow-3xl shadow-indigo-100 hover:bg-black transition-all active:scale-95"
                      >
                        {submitting ? <Loader2 className="animate-spin" /> : 'Confirm Departure'}
                      </button>
                   </div>
                 )}

                 {job.status === JobStatus.IN_TRANSIT && (
                   <div className="text-center space-y-12 relative z-10 animate-in zoom-in w-full max-w-lg">
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute -inset-12 bg-orange-600/10 rounded-full animate-ping"></div>
                        <div className="w-32 h-32 bg-orange-600 rounded-[3rem] flex items-center justify-center text-white relative shadow-3xl">
                          <Fingerprint size={64} />
                        </div>
                      </div>
                      <div className="space-y-4">
                         <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Physical Verification</h3>
                         <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed border-t border-gray-100 pt-4">Upon arrival, input the customer's 6-digit handshake token to authorize execution.</p>
                      </div>
                      <div className="flex flex-col items-center gap-8">
                        <input 
                          type="text" 
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="bg-white border-4 border-gray-100 w-full text-center py-8 rounded-[3rem] text-6xl font-black tracking-[0.4em] outline-none focus:border-orange-600 transition-all shadow-inner text-orange-600"
                        />
                        <button 
                          onClick={handleVerifyOTP}
                          disabled={submitting || otp.length < 6}
                          className="w-full py-7 bg-orange-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] shadow-3xl shadow-orange-100 hover:bg-orange-700 transition-all disabled:opacity-30 active:scale-95"
                        >
                          {submitting ? <Loader2 className="animate-spin" /> : 'Authorize Execution'}
                        </button>
                      </div>
                   </div>
                 )}

                 {job.status === JobStatus.STARTED && (
                   <div className="text-center space-y-14 relative z-10 animate-in zoom-in w-full">
                      <div className="space-y-4">
                         <div className="flex items-center justify-center gap-3 text-emerald-500 font-black text-[10px] uppercase tracking-[0.5em]">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            Execution Pipeline Live
                         </div>
                         <h3 className="text-9xl font-black text-gray-900 tracking-tighter tabular-nums drop-shadow-sm">{elapsedTime}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-10 bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center gap-4 shadow-sm group hover:border-indigo-200 transition-all">
                            <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                               <Zap size={32} />
                            </div>
                            <div className="text-center">
                               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Power Matrix</span>
                               <p className="font-black text-gray-900 uppercase">Operational</p>
                            </div>
                         </div>
                         <div className="p-10 bg-white rounded-[3rem] border border-gray-100 flex flex-col items-center gap-4 shadow-sm group hover:border-indigo-200 transition-all">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                               <ShieldCheck size={32} />
                            </div>
                            <div className="text-center">
                               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Safety Protocol</span>
                               <p className="font-black text-gray-900 uppercase">Verified</p>
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={() => setShowInvoice(true)}
                        className="w-full py-8 bg-green-600 text-white rounded-[3rem] font-black text-2xl uppercase tracking-[0.3em] shadow-3xl shadow-green-100 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-6"
                      >
                        <CheckCircle2 size={36} /> Request Settlement
                      </button>
                   </div>
                 )}

                 {job.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
                   <div className="text-center space-y-10 relative z-10 animate-in zoom-in max-w-lg">
                      <div className="relative mx-auto w-32 h-32">
                         <div className="absolute -inset-10 bg-indigo-50 rounded-full animate-ping"></div>
                         <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-indigo-600 mx-auto shadow-inner relative border-4 border-white">
                            <Loader2 size={64} className="animate-spin" />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Escrow Locked</h3>
                         <p className="text-gray-500 font-bold text-sm leading-relaxed uppercase tracking-widest px-8">
                            Awaiting customer authorization of ₹{job.price}. This node will update instantly upon capital release.
                         </p>
                      </div>
                      <div className="bg-indigo-900 text-white p-6 rounded-3xl border border-white/10 font-black text-3xl tracking-tighter shadow-2xl">
                         ₹{job.price.toLocaleString()} Pending
                      </div>
                   </div>
                 )}
              </div>
           </div>

           {/* Sidebar Info & Safety */}
           <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-10 sm:p-12 rounded-[4.5rem] border border-gray-100 shadow-sm space-y-10">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                    <Info size={16} className="text-indigo-600" /> Intelligence Dossier
                 </h4>
                 <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 italic text-gray-700 leading-relaxed font-bold text-xl shadow-inner">
                    "{job.description}"
                 </div>

                 {/* AI PREPARATION REPORT */}
                 {job.metadata?.toolsNeeded && (
                    <div className="bg-indigo-950 text-white p-8 rounded-[2.5rem] space-y-6 animate-in zoom-in">
                       <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-300">
                             <Sparkles size={12} /> AI Prep Index
                          </h5>
                          <span className="px-2 py-0.5 bg-indigo-500/20 rounded text-[8px] font-black uppercase text-indigo-400 border border-indigo-500/20">Verified</span>
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-bold uppercase text-indigo-400 border-b border-white/5 pb-2">Mandatory Hardware:</p>
                          <div className="flex flex-wrap gap-2">
                             {job.metadata.toolsNeeded.map((t: string) => (
                               <div key={t} className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-tight">
                                  <Wrench size={10} className="text-indigo-400" /> {t}
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 <div className="grid grid-cols-1 gap-4">
                    <button className="flex items-center justify-center gap-4 py-6 bg-white border-2 border-gray-100 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] text-gray-700 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 group">
                       <Phone size={22} className="group-hover:scale-110 transition-transform" /> Masked Comm
                    </button>
                    <button className="flex items-center justify-center gap-4 py-6 bg-white border-2 border-gray-100 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] text-gray-700 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 group">
                       <MessageSquare size={22} className="group-hover:scale-110 transition-transform" /> Secure Chat
                    </button>
                 </div>
              </div>

              <div className="bg-red-50 p-10 rounded-[4rem] border border-red-100 space-y-8 shadow-sm">
                 <div className="flex items-center gap-4 text-red-600 font-black text-[10px] uppercase tracking-widest">
                    <AlertTriangle size={24} /> Safety Override
                 </div>
                 <p className="text-xs text-red-900 font-bold leading-relaxed uppercase tracking-tight italic opacity-80">
                    "Platform policy requires active location sharing for the duration of this deployment. Non-compliance triggers a Tier 1 security lock."
                 </p>
                 <button 
                  onClick={handleSOS}
                  disabled={sosLoading}
                  className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-red-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {sosLoading ? <Loader2 className="animate-spin" size={18} /> : <LifeBuoy size={18} />}
                    {sosLoading ? 'Broadcasting...' : 'Signal Emergency SOS'}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal 
          job={job} 
          onClose={() => setShowInvoice(false)} 
          onSubmit={handleFinalizeInvoice} 
          submitting={submitting}
        />
      )}
    </div>
  );
};

export default JobExecutionHub;
