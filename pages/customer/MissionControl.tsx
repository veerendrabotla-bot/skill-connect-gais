
import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus } from '../../types';
import { STATUS_COLORS, SERVICE_CATEGORIES } from '../../constants';
import { systemService } from '../../services/systemService';
import { jobService } from '../../services/jobService';
import { locationService } from '../../services/locationService';
import { paymentService, PaymentMethod } from '../../services/paymentService';
import MapView from '../../components/MapView';
import DisputeModal from '../../components/customer/DisputeModal';
import { 
  ArrowLeft, MapPin, Navigation, History, Loader2, ShieldCheck, Star, 
  Phone, MessageCircle, Lock, Zap, CreditCard, CheckCircle2, ShieldAlert,
  Gavel, AlertTriangle, CreditCard as CardIcon, Search, Sparkles, RefreshCcw,
  Terminal, ShieldEllipsis, Activity, Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  job: Job;
  onClose: () => void;
}

const MissionControl: React.FC<Props> = ({ job, onClose }) => {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [workerLiveCoords, setWorkerLiveCoords] = useState<{lat: number, lng: number} | null>(null);
  const [activeOTP, setActiveOTP] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('pm_razorpay');
  const [dispatcherLogs, setDispatcherLogs] = useState<string[]>([]);
  
  const workerTrackInterval = useRef<number | null>(null);

  useEffect(() => {
    loadTimeline();
    loadPayments();
    
    // Phase 10.1: Dispatcher Initialization - Immersive Feedback
    if (job.status === JobStatus.REQUESTED || job.status === JobStatus.MATCHING) {
       runDispatcherSequence();
    }
  }, [job.id, job.status]);

  const runDispatcherSequence = async () => {
    const sequence = [
       "Initializing Sovereign Dispatcher Node v4.2...",
       "Acquiring spatial sector lock...",
       `Analyzing requirements for ${SERVICE_CATEGORIES.find(c => c.id === job.categoryId)?.name} mission...`,
       "Scanning sector fleet for verified experts...",
       "Applying ranking algorithm (Proximity + Rating)..."
    ];
    
    // Animate the logs for a high-end feel
    for (let i = 0; i < sequence.length; i++) {
       await new Promise(r => setTimeout(r, 600));
       setDispatcherLogs(prev => [...prev, sequence[i]]);
    }

    try {
       const result = await jobService.runDispatcher(job.id);
       setDispatcherLogs(prev => [
         ...prev,
         `Sector Lock Secured: ${result.sector.slice(0, 30)}...`,
         `Identified ${result.candidates_found} qualified specialists in range.`,
         "Broadcasting encrypted mission leads to fleet..."
       ]);
    } catch (err) {
       setDispatcherLogs(prev => [...prev, "Dispatcher kernel degraded. Manual sector scan active."]);
    }
  };

  useEffect(() => {
    if (job.status === JobStatus.IN_TRANSIT && job.workerId) {
      const poll = async () => {
        try {
          const coords = await locationService.getWorkerLiveLocation(job.workerId!);
          if (coords && coords.lat && coords.lng) {
            setWorkerLiveCoords({ lat: coords.lat, lng: coords.lng });
          }
        } catch (err) {
          console.warn("Telemetry ping failed.");
        }
      };
      poll();
      workerTrackInterval.current = window.setInterval(poll, 15000);
    } else {
      if (workerTrackInterval.current) window.clearInterval(workerTrackInterval.current);
      setWorkerLiveCoords(null);
    }
    return () => { if (workerTrackInterval.current) window.clearInterval(workerTrackInterval.current); };
  }, [job.status, job.workerId]);

  const loadTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const data = await systemService.getJobHistory(job.id);
      setTimeline(data?.events || []);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const loadPayments = async () => {
    const methods = await paymentService.getSavedMethods();
    setPaymentMethods(methods);
  };

  const generateOTP = async () => {
    if (!user) return;
    try {
      const code = await jobService.generateStartOTP(user.id);
      setActiveOTP(code);
    } catch (err) {
      alert("Encryption node busy.");
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    setIsPaying(true);
    try {
      const result = await paymentService.processPayment(job, user);
      if (result.success) {
        onClose();
      }
    } catch (err: any) {
      alert(err.message || "Payment protocol breached.");
    } finally {
      setIsPaying(false);
    }
  };

  const cancelJob = async () => {
    const confirm = window.confirm("Terminate deployment? Cancellation fees apply to assigned nodes.");
    if (!confirm) return;
    try {
      await jobService.updateJobStatus(job.id, JobStatus.CANCELLED);
      onClose();
    } catch (err) {
      alert("Termination failed.");
    }
  };

  const baseRate = job.price - 49;
  const taxAmount = Math.round(baseRate * 0.18);
  const totalDue = job.price;

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-2xl z-[110] flex items-center justify-center p-4">
      <div className="bg-[#F8FAFC] w-full max-w-7xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] animate-in zoom-in duration-500 border border-white/20">
        
        {/* Left Column: Mission Intel & Telemetry */}
        <div className="flex-1 p-10 sm:p-14 overflow-y-auto space-y-12 custom-scrollbar">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] hover:-translate-x-2 transition-all">
              <ArrowLeft size={16} /> Return to Mesh
            </button>
            <div className="flex items-center gap-4">
               <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-sm border border-indigo-100 ${STATUS_COLORS[job.status]} ${job.status === JobStatus.MATCHING ? 'animate-pulse' : ''}`}>
                  {job.status.replace(/_/g, ' ')}
               </span>
               <button onClick={loadTimeline} className="p-3 bg-white rounded-xl text-gray-400 hover:text-indigo-600 shadow-sm border border-gray-100 transition-all hover:rotate-180 duration-500">
                  <RefreshCcw size={16} className={loadingTimeline ? 'animate-spin' : ''} />
               </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
               <Terminal size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.5em]">Command Hub v4.2</span>
            </div>
            <h2 className="text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
               {SERVICE_CATEGORIES.find(c => c.id === job.categoryId)?.name || 'Service'} Mission
            </h2>
            <p className="text-gray-500 font-bold text-xl leading-relaxed flex items-center gap-3"><MapPin size={24} className="text-indigo-600" /> {job.location.address}</p>
          </div>

          <div className="animate-in fade-in duration-700">
            {/* MATCHING PHASE: Immersive Dispatcher View */}
            {(job.status === JobStatus.REQUESTED || job.status === JobStatus.MATCHING) && (
               <div className="space-y-10">
                  <div className="bg-white p-14 rounded-[4.5rem] border border-gray-100 flex flex-col items-center text-center space-y-12 shadow-sm relative overflow-hidden group">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                     <div className="relative">
                        <div className="absolute -inset-20 bg-indigo-100/50 rounded-full animate-ping"></div>
                        <div className="w-40 h-40 bg-indigo-600 rounded-[3.5rem] flex items-center justify-center text-white relative shadow-3xl group-hover:scale-105 transition-transform duration-700">
                           <Globe size={72} className="animate-pulse" />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Acquiring Best Match</h4>
                        <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.4em]">Autonomous Sector Dispatcher Active</p>
                     </div>
                  </div>

                  <div className="bg-gray-900 rounded-[3.5rem] p-12 font-mono text-xs sm:text-sm space-y-4 shadow-2xl relative overflow-hidden border-t-4 border-indigo-500">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                     <div className="flex items-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-6">
                        <Activity size={16} /> Node Kernel Output
                     </div>
                     <div className="space-y-2">
                        {dispatcherLogs.map((log, i) => (
                           <div key={i} className="flex gap-6 animate-in slide-in-from-left-4 duration-500">
                              <span className="text-indigo-500/40 shrink-0">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                              <span className="text-indigo-100/90 font-bold tracking-tight">>> {log}</span>
                           </div>
                        ))}
                     </div>
                     <div className="flex items-center gap-3 text-indigo-400 animate-pulse pt-6">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Standby for fleet handshake...</span>
                     </div>
                  </div>
               </div>
            )}

            {/* TRANSIT PHASE: Live Map Telemetry */}
            {job.status === JobStatus.IN_TRANSIT && (
              <div className="space-y-8">
                <div className="relative h-[550px] rounded-[4.5rem] overflow-hidden border-8 border-white shadow-3xl group ring-1 ring-gray-100">
                  {workerLiveCoords ? (
                    <MapView 
                      center={workerLiveCoords} 
                      zoom={15}
                      showRouteTo={{ lat: job.location.lat, lng: job.location.lng }}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-50/50 gap-8">
                      <div className="relative">
                         <div className="absolute -inset-16 bg-indigo-200/50 rounded-full animate-ping"></div>
                         <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center text-indigo-600 shadow-xl relative border-4 border-indigo-50">
                            <Navigation size={56} className="animate-float" />
                         </div>
                      </div>
                      <div className="text-center space-y-3">
                         <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.5em] animate-pulse">Acquiring Spatial Stream...</p>
                         <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Handshaking with Technician Node</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Tactical Map Overlay */}
                  <div className="absolute top-10 left-10 z-[400] flex flex-col gap-3">
                     <div className="bg-white/95 backdrop-blur-xl px-8 py-4 rounded-[1.8rem] shadow-2xl border border-white flex items-center gap-4">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
                        <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Live Telemetry: Node-402</span>
                     </div>
                  </div>
                </div>

                <div className="bg-indigo-900 text-white p-12 rounded-[4rem] flex flex-col sm:flex-row items-center justify-between shadow-3xl relative overflow-hidden gap-10">
                   <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                   <div className="flex items-center gap-10 relative z-10">
                      <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                         <Zap size={44} className="text-indigo-300" />
                      </div>
                      <div>
                         <p className="text-5xl font-black tracking-tighter uppercase tabular-nums">~8 Minutes</p>
                         <p className="text-sm text-indigo-300 font-bold uppercase tracking-[0.4em] mt-1">Estimated Arrival Protocol</p>
                      </div>
                   </div>
                   <button className="px-12 py-6 bg-white text-indigo-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-50 transition-all active:scale-95">Route Briefing</button>
                </div>
              </div>
            )}

            {/* COMPLETION PHASE: Escrow Authorization */}
            {job.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
              <div className="bg-white p-12 sm:p-20 rounded-[5rem] border-2 border-indigo-100 shadow-3xl animate-in slide-in-from-bottom-10 duration-700 space-y-16">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-5 text-indigo-600 font-black text-[12px] uppercase tracking-[0.5em]">
                     <CreditCard size={24} /> Fiscal Finalization
                   </div>
                   <div className="px-6 py-2.5 bg-emerald-50 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 shadow-sm flex items-center gap-2">
                     <CheckCircle2 size={14} /> Service Verified
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                  <div className="lg:col-span-7 space-y-12">
                    <div className="space-y-4">
                       <h4 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Authorize Settlement</h4>
                       <p className="text-gray-400 font-medium text-lg uppercase tracking-widest">Select release signature</p>
                    </div>
                    <div className="space-y-6">
                      {paymentMethods.map(pm => (
                        <button 
                          key={pm.id}
                          onClick={() => setSelectedMethod(pm.id)}
                          className={`w-full flex items-center justify-between p-12 rounded-[3.5rem] border-2 transition-all group ${
                             selectedMethod === pm.id 
                             ? 'border-indigo-600 bg-indigo-50 shadow-3xl shadow-indigo-100 scale-[1.03]' 
                             : 'border-gray-50 bg-gray-50 hover:bg-white hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center gap-10">
                            <div className={`w-20 h-20 rounded-[2rem] shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform ${selectedMethod === pm.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                               <CardIcon size={40} />
                            </div>
                            <div className="text-left space-y-1">
                              <p className="text-2xl font-black text-gray-900 uppercase tracking-tight">{pm.brand} Wallet</p>
                              <p className="text-xs text-gray-400 font-black uppercase tracking-[0.4em]">Hash: •••• {pm.last4}</p>
                            </div>
                          </div>
                          {selectedMethod === pm.id && (
                             <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl animate-in zoom-in">
                                <CheckCircle2 size={28} />
                             </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-gray-900 text-white p-14 rounded-[4.5rem] space-y-12 flex flex-col justify-between shadow-3xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mt-32 blur-[80px]"></div>
                    <div className="space-y-10 relative z-10">
                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] border-b border-white/10 pb-6">Ledger Final Brief</h4>
                      <div className="space-y-8">
                        <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">
                          <span>Service Execution</span>
                          <span className="text-white">₹{baseRate}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">
                          <span>GST (Regulated 18%)</span>
                          <span className="text-white">₹{taxAmount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">
                          <span>Node Maintenance</span>
                          <span className="text-white">₹49</span>
                        </div>
                        <div className="pt-10 border-t border-white/10 flex justify-between items-center">
                          <span className="text-sm font-black uppercase tracking-[0.5em] text-indigo-400">Total Release</span>
                          <span className="text-7xl font-black tracking-tighter tabular-nums">₹{totalDue}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6 relative z-10 pt-12">
                       <div className="flex items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10 text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-relaxed text-center">
                          <Lock size={16} className="text-emerald-400 shrink-0" /> Dual-Handshake Escrow Protocol Active
                       </div>
                       <button 
                        onClick={handlePayment}
                        disabled={isPaying}
                        className="w-full bg-indigo-600 text-white py-9 rounded-[2.5rem] font-black text-3xl shadow-3xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-6 active:scale-95 group shadow-indigo-500/20"
                       >
                         {isPaying ? <Loader2 className="animate-spin" /> : <Zap size={36} className="group-hover:text-yellow-400 transition-colors" />}
                         {isPaying ? 'Authenticating...' : 'Authorize Release'}
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EVENT CHAIN: Vertical Lifecycle Tracker */}
            {(job.status !== JobStatus.COMPLETED_PENDING_PAYMENT && job.status !== JobStatus.DISPUTED) && (
              <div className="space-y-10 pt-16 border-t border-gray-100">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] flex items-center gap-4">
                      <History size={18} className="text-indigo-600" /> Infrastructure Logs
                   </h4>
                   <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Encrypted Genesis Stream</span>
                </div>
                
                <div className="space-y-0 relative">
                  {loadingTimeline ? (
                    <div className="flex items-center gap-8 p-16 text-gray-400 animate-pulse bg-white rounded-[4.5rem] shadow-sm border border-gray-50">
                       <Loader2 className="animate-spin" size={32} />
                       <span className="font-black text-base uppercase tracking-[0.5em] italic">Decrypting Lifecycle Chain...</span>
                    </div>
                  ) : timeline.length > 0 ? (
                     <div className="bg-white p-14 rounded-[5rem] border border-gray-100 shadow-sm divide-y divide-gray-50">
                        {timeline.map((ev, i) => (
                           <div key={ev.id} className="py-10 first:pt-0 last:pb-0 group hover:bg-gray-50/50 transition-all rounded-3xl px-6">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-10">
                                    <div className={`w-4 h-4 rounded-full ${i === 0 ? 'bg-indigo-600 animate-pulse scale-150 shadow-2xl shadow-indigo-200' : 'bg-gray-200 group-hover:bg-indigo-300'} transition-all duration-500`}></div>
                                    <div>
                                       <p className={`font-black uppercase tracking-[0.3em] text-lg ${i === 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                          {ev.to_status.replace(/_/g, ' ')}
                                       </p>
                                       <p className="text-gray-400 text-[11px] font-bold mt-2 uppercase tracking-[0.2em]">
                                          {new Date(ev.created_at).toLocaleDateString('en-IN', {month: 'long', day: 'numeric'})} @ {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="text-[10px] font-black text-gray-200 uppercase tracking-[0.4em] group-hover:text-indigo-200 transition-colors italic">Signed Ledger Entry</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                    <div className="p-32 text-center text-gray-300 font-black uppercase text-[12px] tracking-[0.6em] border-8 border-dashed border-gray-50 rounded-[5rem]">
                       Initializing Node Persistence...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Interaction Column: Identity & Secure Handshake */}
        <div className="w-full md:w-[520px] bg-white border-l border-gray-100 p-10 sm:p-16 flex flex-col gap-14 overflow-y-auto custom-scrollbar shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)]">
          
          {job.workerId ? (
            <div className="space-y-14 animate-in slide-in-from-right-14 duration-1000">
              <div className="flex flex-col items-center text-center space-y-10">
                <div className="relative group">
                  <div className="w-56 h-56 bg-gray-100 rounded-[5.5rem] overflow-hidden border-[12px] border-white shadow-3xl transition-all duration-700 group-hover:scale-105 group-hover:rotate-2">
                    <img src={`https://picsum.photos/seed/${job.workerId}/600`} alt="Technician" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-emerald-500 rounded-[2.5rem] border-[6px] border-white flex items-center justify-center text-white shadow-2xl animate-in zoom-in delay-500 hover:scale-110 transition-transform">
                    <ShieldCheck size={40} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Technician ID-402</h4>
                  <div className="flex flex-col items-center gap-4">
                     <div className="flex items-center gap-3 px-6 py-2.5 bg-yellow-50 text-yellow-700 rounded-2xl text-[11px] font-black uppercase border border-yellow-100 shadow-sm">
                        <Star size={16} className="fill-yellow-600" /> 4.9 Verified Hub Performance
                     </div>
                     <span className="text-[11px] text-gray-400 font-black uppercase tracking-[0.4em]">Elite Infrastructure Specialist</span>
                  </div>
                </div>
              </div>

              {(job.status !== JobStatus.PAID && job.status !== JobStatus.CANCELLED) && (
                 <div className="grid grid-cols-2 gap-6">
                    <button className="flex flex-col items-center gap-6 p-12 bg-gray-50 rounded-[4rem] hover:bg-indigo-600 hover:text-white transition-all group shadow-sm border border-transparent hover:border-indigo-400">
                       <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl group-hover:scale-110 transition-transform duration-500">
                          <Phone size={36} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 group-hover:opacity-100">Secure Line</span>
                    </button>
                    <button className="flex flex-col items-center gap-6 p-12 bg-gray-50 rounded-[4rem] hover:bg-indigo-600 hover:text-white transition-all group shadow-sm border border-transparent hover:border-indigo-400">
                       <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl group-hover:scale-110 transition-transform duration-500">
                          <MessageCircle size={36} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 group-hover:opacity-100">Hub Logs</span>
                    </button>
                 </div>
              )}

              {/* Secure Handshake Protocol: OTP Visualization */}
              {(job.status === JobStatus.ASSIGNED || job.status === JobStatus.IN_TRANSIT) && (
                <div className="bg-indigo-950 p-14 rounded-[5rem] text-white space-y-12 shadow-3xl border border-white/5 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-1000"></div>
                  <div className="flex items-center gap-5 text-indigo-300 font-black text-[12px] uppercase tracking-[0.5em] relative z-10">
                    <ShieldEllipsis size={24} className="text-indigo-400" /> Handshake Token
                  </div>
                  {activeOTP ? (
                    <div className="text-center space-y-10 relative z-10 animate-in zoom-in duration-500">
                      <div className="bg-white/10 rounded-[3.5rem] p-16 border border-white/10 backdrop-blur-2xl shadow-inner group/otp ring-1 ring-white/5">
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-10 group-hover/otp:text-indigo-300 transition-colors">Confirm with Partner</p>
                        <p className="text-9xl font-black tracking-[0.25em] text-white tabular-nums drop-shadow-[0_10px_40px_rgba(255,255,255,0.2)]">{activeOTP}</p>
                      </div>
                      <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.4em] opacity-40 italic">Handshake Security Level: AAA-High</p>
                    </div>
                  ) : (
                    <div className="space-y-10 relative z-10">
                       <p className="text-sm text-indigo-200 font-medium leading-relaxed italic uppercase tracking-[0.2em] text-center px-4 opacity-80">
                          Authorize mission execution by generating a unique session token for physical verification.
                       </p>
                       <button 
                        onClick={generateOTP} 
                        className="w-full bg-white text-indigo-950 py-9 rounded-[2.5rem] font-black text-xl uppercase tracking-[0.5em] shadow-3xl hover:bg-indigo-50 transition-all active:scale-95 shadow-white/10"
                       >
                        Release Token
                       </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-14 animate-pulse">
               <div className="relative">
                  <div className="absolute -inset-20 bg-indigo-50 rounded-full animate-ping opacity-40"></div>
                  <div className="w-40 h-40 bg-indigo-50 rounded-[4.5rem] flex items-center justify-center text-indigo-600 relative border-[12px] border-white shadow-3xl">
                     <Globe size={64} className="animate-float" />
                  </div>
               </div>
               <div className="space-y-8 px-4">
                  <h4 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Dispatcher Engaged</h4>
                  <p className="text-gray-400 font-medium text-lg leading-relaxed max-w-xs mx-auto italic uppercase tracking-[0.15em] opacity-70">
                     Synchronizing coordinates with available elite specialist nodes in your sector.
                  </p>
               </div>
            </div>
          )}

          <div className="mt-auto space-y-8">
            {job.status !== JobStatus.PAID && job.status !== JobStatus.CANCELLED && job.status !== JobStatus.DISPUTED && (
              <>
                <div className="flex items-center gap-4 px-8 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] w-fit border border-red-100 shadow-sm mx-auto">
                   <ShieldAlert size={14} /> Governance Controls
                </div>
                <div className="flex flex-col gap-5">
                  {(job.status === JobStatus.COMPLETED_PENDING_PAYMENT || job.status === JobStatus.STARTED) && (
                    <button 
                      onClick={() => setShowDispute(true)} 
                      className="w-full py-8 bg-red-50 text-red-600 rounded-[3rem] font-black text-xs uppercase tracking-[0.4em] border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-5 active:scale-95 shadow-sm"
                    >
                      <Gavel size={24} /> Resolve Incident
                    </button>
                  )}
                  {job.status !== JobStatus.STARTED && (
                    <button 
                      onClick={cancelJob} 
                      className="w-full py-7 border-2 border-gray-100 text-gray-400 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.5em] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
                    >
                      Terminate Mission
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {showDispute && <DisputeModal job={job} onClose={() => setShowDispute(false)} onSuccess={() => { setShowDispute(false); onClose(); }} />}
    </div>
  );
};

export default MissionControl;
