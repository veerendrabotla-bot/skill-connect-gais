
import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus, UserRole } from '../../types';
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
  Gavel, AlertTriangle, CreditCard as CardIcon, Search, Sparkles
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
  
  const workerTrackInterval = useRef<number | null>(null);

  useEffect(() => {
    loadTimeline();
    loadPayments();
  }, [job.id]);

  useEffect(() => {
    if (job.status === JobStatus.IN_TRANSIT && job.workerId) {
      const poll = async () => {
        const coords = await locationService.getWorkerLiveLocation(job.workerId!);
        if (coords) setWorkerLiveCoords({ lat: coords.lat, lng: coords.lng });
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
    const code = await jobService.generateStartOTP(user.id);
    setActiveOTP(code);
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
    const confirm = window.confirm("Terminate deployment? Cancellation fees may apply.");
    if (!confirm) return;
    await jobService.updateJobStatus(job.id, JobStatus.CANCELLED);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
      <div className="bg-[#F8FAFC] w-full max-w-6xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in duration-500">
        
        {/* Left Column: Logs & Tracking */}
        <div className="flex-1 p-10 sm:p-14 overflow-y-auto space-y-10">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:-translate-x-1 transition-transform">← Deployment Grid</button>
            <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${STATUS_COLORS[job.status]} animate-pulse`}>{job.status.replace(/_/g, ' ')}</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{SERVICE_CATEGORIES.find(c => c.id === job.categoryId)?.name || 'Service'} Hub</h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed flex items-center gap-2"><MapPin size={20} className="text-indigo-600" /> {job.location.address}</p>
          </div>

          {job.status === JobStatus.MATCHING && (
             <div className="bg-indigo-50 p-12 rounded-[4rem] border border-indigo-100 flex flex-col items-center text-center space-y-8 animate-in zoom-in">
                <div className="relative">
                   <div className="absolute -inset-10 bg-indigo-200/50 rounded-full animate-ping"></div>
                   <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white relative shadow-2xl">
                      <Search size={40} className="animate-float" />
                   </div>
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Dispatcher Active</h3>
                   <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-sm mx-auto">
                      Our kernel is scanning for the most qualified specialists in your current geographic sector.
                   </p>
                </div>
                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-indigo-100 shadow-sm">
                   <Sparkles className="text-indigo-600" size={18} />
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Autonomous Matching Protocol v2.1</span>
                </div>
             </div>
          )}

          {job.status === JobStatus.IN_TRANSIT && (
            <div className="relative h-[400px] rounded-[3rem] overflow-hidden border border-indigo-100 shadow-2xl group">
              {workerLiveCoords ? (
                <MapView 
                  center={workerLiveCoords} 
                  zoom={15}
                  showRouteTo={{ lat: job.location.lat, lng: job.location.lng }}
                  className="h-full w-full"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-50 gap-4">
                  <Navigation size={48} className="text-indigo-600 animate-float" />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Handshaking with Technician...</p>
                </div>
              )}
              <div className="absolute bottom-6 left-6 right-6 z-[400] flex justify-between items-center bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Live Telemetry Synchronized</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Buffer: 15s</p>
              </div>
            </div>
          )}

          {job.status === JobStatus.DISPUTED && (
            <div className="bg-red-950 text-white p-10 rounded-[3.5rem] space-y-6 shadow-2xl animate-pulse">
               <div className="flex items-center gap-3 text-red-400 font-black text-[10px] uppercase tracking-widest">
                  <ShieldAlert size={18} /> Judicial Audit Active
               </div>
               <h4 className="text-2xl font-black tracking-tight">Escrow Locked • Review Pending</h4>
               <p className="text-red-200/80 font-medium leading-relaxed">
                  The Governance Engine has flagged this deployment. All ledger activity is paused until human review completes.
               </p>
            </div>
          )}

          {job.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
            <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-100 shadow-2xl animate-in fade-in duration-700 space-y-8">
              <div className="flex items-center gap-4 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                <CreditCard size={18} /> Payment Gateway Active
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-2xl font-black text-gray-900">Authorize Settlement</h4>
                  <div className="space-y-3">
                    {paymentMethods.map(pm => (
                      <button 
                        key={pm.id}
                        onClick={() => setSelectedMethod(pm.id)}
                        className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${selectedMethod === pm.id ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <CardIcon size={20} className="text-gray-400" />
                          <div className="text-left">
                            <p className="text-sm font-black text-gray-900">{pm.brand} •••• {pm.last4}</p>
                          </div>
                        </div>
                        {selectedMethod === pm.id && <CheckCircle2 size={18} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                      <span>Deployment Charge</span>
                      <span>₹{job.price - 49}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                      <span>Convenience Layer</span>
                      <span>₹49</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-sm font-black text-gray-900 uppercase">Total Net</span>
                      <span className="text-3xl font-black text-indigo-600">₹{job.price}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                  >
                    {isPaying ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                    {isPaying ? 'Processing...' : 'Confirm Settlement'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><History size={14}/> Event Chain Pipeline</h4>
            <div className="space-y-0 relative">
              {loadingTimeline ? (
                <div className="flex items-center gap-4 p-8 text-gray-400 animate-pulse"><Loader2 className="animate-spin" size={20} /><span className="font-bold text-sm uppercase tracking-widest italic">Decrypting Logs...</span></div>
              ) : timeline.length > 0 ? timeline.map((ev, i) => (
                <div key={ev.id} className="relative pl-12 pb-10 group">
                  {i !== timeline.length - 1 && (<div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-gray-200"></div>)}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${i === 0 ? 'bg-indigo-600 animate-pulse' : 'bg-gray-300'}`}></div>
                  <div className="space-y-1">
                    <p className={`font-black uppercase tracking-widest text-[10px] ${i === 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{ev.to_status.replace(/_/g, ' ')}</p>
                    <p className="text-gray-500 text-xs font-bold">{new Date(ev.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              )) : null}
            </div>
          </div>
        </div>

        {/* Interaction Hub */}
        <div className="w-full md:w-[420px] bg-white border-l border-gray-100 p-10 sm:p-14 flex flex-col gap-10">
          {job.workerId ? (
            <div className="space-y-8 animate-in slide-in-from-right-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-100 rounded-[3rem] overflow-hidden border-4 border-white shadow-xl">
                    <img src={`https://picsum.photos/seed/${job.workerId}/300`} alt="Technician" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-900 tracking-tighter">Elite Partner Assigned</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Tier 1 Certified Specialist</p>
                </div>
              </div>

              {(job.status === JobStatus.ASSIGNED || job.status === JobStatus.IN_TRANSIT) && (
                <div className="bg-indigo-950 p-8 rounded-[3rem] text-white space-y-6 shadow-3xl">
                  <div className="flex items-center gap-3 text-indigo-300 font-black text-[10px] uppercase tracking-widest"><ShieldCheck size={18} /> Secure Handshake Protocol</div>
                  {activeOTP ? (
                    <div className="text-center bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] text-indigo-300 font-black uppercase mb-2">Show to Partner on Arrival</p>
                      <p className="text-5xl font-black tracking-[0.3em]">{activeOTP}</p>
                    </div>
                  ) : (
                    <button onClick={generateOTP} className="w-full bg-white text-indigo-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-500 hover:text-white transition-all">Generate Secure Token</button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-pulse"><div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><Navigation size={40} className="animate-float" /></div><div><h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Matching Algorithm Active</h4><p className="text-gray-400 font-medium text-sm mt-2">Optimizing logistics for the nearest available specialist.</p></div></div>
          )}

          <div className="mt-auto space-y-4">
            {job.status !== JobStatus.PAID && job.status !== JobStatus.CANCELLED && job.status !== JobStatus.DISPUTED && (
              <>
                {(job.status === JobStatus.COMPLETED_PENDING_PAYMENT || job.status === JobStatus.STARTED) && (
                  <button onClick={() => setShowDispute(true)} className="w-full py-5 bg-red-50 text-red-600 rounded-[2rem] font-black text-sm uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-3"><Gavel size={18} /> Resolve Incident</button>
                )}
                {job.status !== JobStatus.STARTED && (
                  <button onClick={cancelJob} className="w-full py-5 border-2 border-gray-100 text-gray-400 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all">Terminate Deployment</button>
                )}
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
