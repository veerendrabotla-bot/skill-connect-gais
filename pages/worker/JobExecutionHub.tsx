
import React, { useState, useEffect } from 'react';
import { Job, JobStatus } from '../../types';
import { jobService } from '../../services/jobService';
import { STATUS_COLORS } from '../../constants';
import InvoiceModal from '../../components/worker/InvoiceModal';
import { 
  Navigation, ShieldCheck, MapPin, Clock, Phone, 
  MessageSquare, AlertTriangle, ArrowLeft, Zap, CheckCircle2,
  Lock, Loader2, Info, Gavel
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

  // Start a live timer if the job is active
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

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] z-[100] overflow-y-auto animate-in fade-in duration-500">
      {/* Persistent Action Bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 h-20 flex items-center justify-between z-10">
         <button onClick={onBack} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
            <ArrowLeft size={24} />
         </button>
         <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Deployment Hub</p>
            <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">NODE_ID: #{job.id.slice(0,12)}</p>
         </div>
         <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[job.status]}`}>
            {job.status.replace(/_/g, ' ')}
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Geographic Context Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Site Intervention</h2>
                 <p className="text-gray-500 font-bold text-lg flex items-start gap-3">
                    <MapPin size={24} className="text-blue-600 shrink-0 mt-1" />
                    {job.location.address}
                 </p>
              </div>

              {/* Lifecycle-specific UI */}
              <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 min-h-[300px] flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 
                 {job.status === JobStatus.ASSIGNED && (
                   <div className="text-center space-y-8 relative z-10 animate-in zoom-in">
                      <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl animate-float">
                        <Navigation size={48} />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase">Awaiting Departure</h3>
                      <button 
                        onClick={handleTransit}
                        disabled={submitting}
                        className="px-16 py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] shadow-3xl shadow-blue-100 hover:bg-black transition-all active:scale-95"
                      >
                        {submitting ? <Loader2 className="animate-spin" /> : 'Initialize Transit'}
                      </button>
                   </div>
                 )}

                 {job.status === JobStatus.IN_TRANSIT && (
                   <div className="text-center space-y-8 relative z-10 animate-in zoom-in">
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 bg-orange-600 rounded-full animate-ping opacity-20"></div>
                        <div className="w-32 h-32 bg-orange-600 rounded-[2.5rem] flex items-center justify-center text-white relative shadow-2xl">
                          <Lock size={56} />
                        </div>
                      </div>
                      <div className="space-y-4">
                         <h3 className="text-2xl font-black text-gray-900 uppercase">Authentication Required</h3>
                         <p className="text-gray-400 font-bold text-xs max-w-xs mx-auto uppercase tracking-widest">Verify the 6-digit handshake code provided by the customer to begin.</p>
                      </div>
                      <div className="flex flex-col items-center gap-6">
                        <input 
                          type="text" 
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="bg-white border-4 border-gray-100 w-64 text-center py-6 rounded-[2rem] text-4xl font-black tracking-[0.3em] outline-none focus:border-orange-600 transition-all shadow-inner"
                        />
                        <button 
                          onClick={handleVerifyOTP}
                          disabled={submitting || otp.length < 6}
                          className="w-64 py-6 bg-orange-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all disabled:opacity-30"
                        >
                          {submitting ? <Loader2 className="animate-spin" /> : 'Verify & Secure'}
                        </button>
                      </div>
                   </div>
                 )}

                 {job.status === JobStatus.STARTED && (
                   <div className="text-center space-y-10 relative z-10 animate-in zoom-in">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.4em]">Node Execution Active</p>
                         <h3 className="text-7xl font-black text-gray-900 tracking-tighter tabular-nums">{elapsedTime}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-6 bg-white rounded-3xl border border-gray-100 flex flex-col items-center gap-2">
                            <Zap size={24} className="text-yellow-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Power Matrix</span>
                            <span className="font-bold text-gray-900">Stable</span>
                         </div>
                         <div className="p-6 bg-white rounded-3xl border border-gray-100 flex flex-col items-center gap-2">
                            <ShieldCheck size={24} className="text-green-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Safety Protocol</span>
                            <span className="font-bold text-gray-900">Verified</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => setShowInvoice(true)}
                        className="w-full py-7 bg-green-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] shadow-3xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-4"
                      >
                        <CheckCircle2 size={28} /> Finalize Settlement
                      </button>
                   </div>
                 )}

                 {job.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
                   <div className="text-center space-y-8 relative z-10 animate-in zoom-in">
                      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto shadow-inner">
                         <Loader2 size={48} className="animate-spin" />
                      </div>
                      <div className="space-y-3">
                         <h3 className="text-2xl font-black text-gray-900 uppercase">Awaiting Customer Release</h3>
                         <p className="text-gray-500 font-medium">The customer is currently authorizing the escrow settlement.</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 font-black text-3xl text-blue-600 shadow-sm">
                         ₹{job.price}
                      </div>
                   </div>
                 )}
              </div>
           </div>

           <div className="space-y-8">
              {/* Interaction Panel */}
              <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Mission Dossier
                 </h4>
                 <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 italic text-gray-600 leading-relaxed font-medium">
                    "{job.description}"
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <button className="flex items-center justify-center gap-4 py-6 bg-white border-2 border-gray-100 rounded-[2rem] font-black text-sm uppercase tracking-widest text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95">
                       <Phone size={20} /> Masked Comm Link
                    </button>
                    <button className="flex items-center justify-center gap-4 py-6 bg-white border-2 border-gray-100 rounded-[2rem] font-black text-sm uppercase tracking-widest text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95">
                       <MessageSquare size={20} /> Encrypted Chat
                    </button>
                 </div>
              </div>

              {/* Safety & Compliance */}
              <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 space-y-6">
                 <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-widest">
                    <AlertTriangle size={18} /> Safety Protocol
                 </div>
                 <p className="text-xs text-red-900 font-bold leading-relaxed uppercase tracking-tight">
                    All transmissions and site movements are logged. Ensure your wearable beacon is active at all times.
                 </p>
                 <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 flex items-center justify-center gap-2">
                    <Gavel size={14} /> Panic Signal
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
