
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Job, JobStatus, ServiceCategory, ServiceType } from '../types';
import { STATUS_COLORS, SERVICE_CATEGORIES } from '../constants';
import { jobService } from '../services/jobService';
import { locationService } from '../services/locationService';
import { systemService } from '../services/systemService';
import { paymentService, PaymentMethod } from '../services/paymentService';
import { diagnoseServiceIssue } from '../services/geminiService';
import { 
  Search, MapPin, Clock, CreditCard, Sparkles, Loader2, Info, AlertCircle, 
  LayoutGrid, ShieldCheck, ChevronRight, Filter, Star, Zap, TrendingUp, X, 
  Calculator, CheckCircle2, ShieldEllipsis, Navigation, History,
  Phone, MessageSquare, AlertTriangle, ArrowRight, User as UserIcon, Receipt, 
  Wallet, Plus, CreditCard as CardIcon, Lock, Check, Download, ShieldAlert,
  Gavel, FileText, Scale, Map as MapIcon, Share2, MessageCircle
} from 'lucide-react';

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

type BookingStep = 'SERVICE' | 'LOCATION' | 'DETAILS' | 'REVIEW';
type DisputeCategory = 'PRICING' | 'QUALITY' | 'BEHAVIOR' | 'INCOMPLETE';

const CustomerDashboard: React.FC<Props> = ({ jobs, setJobs }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'history'>('active');
  
  // Focused Job State (Mission Control)
  const [focusedJob, setFocusedJob] = useState<Job | null>(null);
  const [jobTimeline, setJobTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Dispute State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>('QUALITY');
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Payment State
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('pm_1');
  const [showReceipt, setShowReceipt] = useState<Job | null>(null);

  // Booking State
  const [bookingStep, setBookingStep] = useState<BookingStep>('SERVICE');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  
  // Intelligence State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Security
  const [activeOTP, setActiveOTP] = useState<{ jobId: string, code: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [cats, myJobs, methods] = await Promise.all([
          jobService.getCategories(),
          jobService.getMyJobs(user.id),
          paymentService.getSavedMethods()
        ]);
        const enrichedCats = SERVICE_CATEGORIES.map(c => {
          const dbCat = cats.find(dc => dc.id === c.id);
          return dbCat ? { ...c, ...dbCat, serviceTypes: c.serviceTypes } : c;
        });
        setCategories(enrichedCats);
        setJobs(myJobs);
        setPaymentMethods(methods);
      } catch (err) {
        setCategories(SERVICE_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const loadJobHistory = async (job: Job) => {
    setFocusedJob(job);
    setLoadingTimeline(true);
    try {
      const data = await systemService.getJobHistory(job.id);
      if (data?.events) {
        setJobTimeline(data.events);
      }
    } catch (err) {
      console.error("Timeline retrieval failed:", err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const activeJobs = jobs.filter(j => j.status !== JobStatus.PAID && j.status !== JobStatus.CANCELLED);
  const pastJobs = jobs.filter(j => j.status === JobStatus.PAID || j.status === JobStatus.CANCELLED);

  const filteredCategories = useMemo(() => {
    let result = categories;
    if (searchQuery) {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.serviceTypes?.some(st => st.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return result;
  }, [categories, searchQuery]);

  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await locationService.getCurrentPosition();
      setCoords(pos);
      setAddress("Detected Current Location");
      await new Promise(r => setTimeout(r, 800));
    } finally {
      setIsLocating(false);
    }
  };

  const handleDiagnose = async () => {
    if (!issueDescription || !selectedCategory) return;
    setIsDiagnosing(true);
    const result = await diagnoseServiceIssue(issueDescription, selectedCategory.name);
    setDiagnosis(result);
    setIsDiagnosing(false);
  };

  const executeBooking = async () => {
    if (!selectedCategory || !user || !coords) return;
    setIsBooking(true);
    try {
      const basePrice = selectedServiceType?.basePrice || selectedCategory.basePrice;
      const fullDesc = selectedServiceType ? `[${selectedServiceType.name}] ${issueDescription}` : issueDescription;
      const newJob = await jobService.createJob(
        user.id, 
        selectedCategory.id, 
        fullDesc, 
        basePrice, 
        address, 
        coords.lat, 
        coords.lng
      );
      setJobs([newJob, ...jobs]);
      resetBooking();
    } catch (err) {
      alert("Booking system unavailable.");
    } finally {
      setIsBooking(false);
    }
  };

  const handlePayment = async () => {
    if (!focusedJob) return;
    setIsPaying(true);
    try {
      const result = await paymentService.processPayment(focusedJob, selectedMethod);
      if (result.success) {
        await jobService.updateJobStatus(focusedJob.id, JobStatus.PAID);
        setJobs(prev => prev.map(j => j.id === focusedJob.id ? { ...j, status: JobStatus.PAID } : j));
        setPaymentSuccess(true);
        setTimeout(() => {
          setPaymentSuccess(false);
          setFocusedJob(null);
        }, 3000);
      }
    } catch (err) {
      alert("Payment failed. Please check your bank status.");
    } finally {
      setIsPaying(false);
    }
  };

  const initiateDispute = async () => {
    if (!focusedJob || !disputeReason) return;
    setIsSubmittingDispute(true);
    try {
      await jobService.updateJobStatus(focusedJob.id, JobStatus.DISPUTED);
      await systemService.logEvent('DISPUTE_INITIATED', 'JOB', focusedJob.id, {
        category: disputeCategory,
        reason: disputeReason,
        timestamp: new Date().toISOString()
      });
      setJobs(prev => prev.map(j => j.id === focusedJob.id ? { ...j, status: JobStatus.DISPUTED } : j));
      setShowDisputeModal(false);
      setDisputeReason('');
      setFocusedJob(null);
      alert("Dispute filed. Platform Governance team will contact you shortly.");
    } catch (err) {
      alert("Dispute submission failed.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    const confirm = window.confirm("Are you sure? Cancellation after worker assignment may incur a convenience fee.");
    if (!confirm) return;
    try {
      await jobService.updateJobStatus(jobId, JobStatus.CANCELLED);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: JobStatus.CANCELLED } : j));
      setFocusedJob(null);
    } catch (err) {
      alert("Cancellation failed.");
    }
  };

  const resetBooking = () => {
    setSelectedCategory(null);
    setSelectedServiceType(null);
    setBookingStep('SERVICE');
    setIssueDescription('');
    setAddress('');
    setCoords(null);
    setDiagnosis(null);
  };

  const generateOTP = async (jobId: string) => {
    if (!user) return;
    const code = await jobService.generateStartOTP(user.id);
    setActiveOTP({ jobId, code });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Syncing Service Mesh</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 animate-in fade-in duration-700 pb-20">
      
      {/* Dashboard Top Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">My Network</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Managing {jobs.length} total deployments</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
          <button 
            onClick={() => setView('active')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400'}`}
          >
            Active Pipeline
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400'}`}
          >
            Audit History
          </button>
        </div>
      </div>

      {view === 'active' ? (
        <>
          {/* Active Job Grid */}
          {activeJobs.length > 0 && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeJobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => loadJobHistory(job)}
                    className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col gap-6 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-50">
                          {categories.find(c => c.id === job.categoryId)?.icon || '🛠️'}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">{categories.find(c => c.id === job.categoryId)?.name || 'Service'}</h3>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Node ID: #{job.id.slice(0,8)}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${STATUS_COLORS[job.status]}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs pt-6 border-t border-gray-50 mt-auto">
                      <div className="flex items-center gap-2 text-gray-400 font-bold">
                        <MapPin size={16} className="text-blue-500" />
                        <span className="truncate max-w-[150px] font-medium">{job.location.address}</span>
                      </div>
                      <span className="text-gray-900 font-black tracking-tight text-lg">₹{job.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Service Marketplace */}
          <section className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <LayoutGrid className="text-blue-600" size={28} />
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Infrastructure Services</h2>
              </div>
              <div className="hidden sm:block relative w-72">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                 <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query services..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-blue-600 text-sm font-bold shadow-sm"
                 />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat); setBookingStep('SERVICE'); }}
                  className="group flex flex-col items-center gap-6 p-10 rounded-[3.5rem] bg-white border-2 border-transparent hover:border-blue-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500"
                >
                  <div className="w-28 h-28 bg-gray-50 rounded-[3rem] flex items-center justify-center text-7xl shadow-inner group-hover:scale-110 transition-all">
                    {cat.icon}
                  </div>
                  <div className="text-center space-y-1">
                    <span className="block text-sm font-black text-gray-900 uppercase tracking-widest">{cat.name}</span>
                    <span className="block text-[9px] text-gray-400 font-black uppercase tracking-widest">Base Rate: ₹{cat.basePrice}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* Audit History Table */
        <section className="space-y-8 animate-in slide-in-from-bottom-5">
           {pastJobs.length > 0 ? (
             <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-gray-50/50">
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Log Index</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Core Service</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifecycle Status</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Final Price</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {pastJobs.map(job => (
                           <tr key={job.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-10 py-6 font-mono text-xs text-gray-400">#{job.id.slice(0,8)}</td>
                              <td className="px-10 py-6">
                                 <div className="flex items-center gap-4">
                                    <span className="text-2xl">{categories.find(c => c.id === job.categoryId)?.icon}</span>
                                    <span className="font-black text-gray-900">{categories.find(c => c.id === job.categoryId)?.name}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-6">
                                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${STATUS_COLORS[job.status]}`}>
                                    {job.status}
                                 </span>
                              </td>
                              <td className="px-10 py-6 font-black text-gray-900">₹{job.price}</td>
                              <td className="px-10 py-6">
                                 <div className="flex items-center gap-3">
                                   {job.status === JobStatus.PAID && (
                                     <button 
                                      onClick={() => setShowReceipt(job)}
                                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                     >
                                       <Receipt size={14} /> Receipt
                                     </button>
                                   )}
                                   <button className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Share Transaction">
                                      <Share2 size={16} />
                                   </button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="text-center py-40 flex flex-col items-center">
                <History className="text-gray-100 mb-6" size={80} />
                <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Zero Historical Records</h3>
                <p className="text-gray-400 font-medium mt-2">All your completed deployments will be archived here.</p>
             </div>
           )}
        </section>
      )}

      {/* --- MODAL SYSTEM --- */}

      {/* Dispute Modal */}
      {showDisputeModal && focusedJob && (
        <div className="fixed inset-0 bg-red-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
              <div className="p-12 border-b border-gray-50 flex justify-between items-center bg-red-50/50">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-red-100">
                       <Gavel size={36} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Initiate Resolution</h3>
                       <p className="text-red-600 font-black text-[10px] uppercase tracking-widest">Governance ID: {focusedJob.id.slice(0,12)}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDisputeModal(false)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100"><X size={20} /></button>
              </div>
              <div className="p-12 space-y-10">
                 <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Incident Category</label>
                    <div className="grid grid-cols-2 gap-4">
                       {(['QUALITY', 'PRICING', 'BEHAVIOR', 'INCOMPLETE'] as DisputeCategory[]).map(cat => (
                         <button 
                            key={cat}
                            onClick={() => setDisputeCategory(cat)}
                            className={`p-6 rounded-3xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${disputeCategory === cat ? 'border-red-600 bg-red-50 text-red-600 shadow-lg shadow-red-50' : 'border-gray-50 bg-gray-50 text-gray-400 hover:bg-white'}`}
                         >
                            {cat}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Statement of Facts</label>
                    <textarea 
                       value={disputeReason}
                       onChange={(e) => setDisputeReason(e.target.value)}
                       placeholder="Detail the issue for our governance audit team..."
                       rows={5}
                       className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none transition-all"
                    />
                 </div>

                 <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 flex items-start gap-4">
                    <AlertTriangle className="text-orange-600 shrink-0" size={24} />
                    <p className="text-sm font-medium text-orange-800 leading-relaxed">
                       Escrow will be frozen immediately. Admin investigation will follow strict SLA protocols.
                    </p>
                 </div>

                 <button 
                    onClick={initiateDispute}
                    disabled={isSubmittingDispute || !disputeReason}
                    className="w-full py-6 bg-red-600 text-white rounded-[2.5rem] font-black text-lg shadow-3xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                 >
                    {isSubmittingDispute ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
                    {isSubmittingDispute ? 'Finalizing Case...' : 'Submit Resolution Request'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-blue-600 p-12 text-center text-white space-y-4">
                 <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                    <CheckCircle2 size={48} className="text-white" />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">Settlement Receipt</h3>
                 <p className="text-blue-100 text-sm font-medium">Log Entry #{showReceipt.id.slice(0,8)}</p>
              </div>
              <div className="p-12 space-y-8">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
                       <span>Node Execution Charge</span>
                       <span className="text-gray-900">₹{showReceipt.price - 49}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
                       <span>Platform Convenience</span>
                       <span className="text-gray-900">₹49</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-black text-gray-900 pt-2">
                       <span>Net Settlement</span>
                       <span className="text-blue-600 text-2xl">₹{showReceipt.price}</span>
                    </div>
                 </div>
                 <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Authorization Matrix</p>
                    <p className="font-bold text-gray-900 flex items-center justify-center gap-2">
                       <Lock size={16} /> Encrypted Transaction Logged
                    </p>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setShowReceipt(null)} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Close Archive</button>
                    <button className="flex items-center justify-center w-14 h-14 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all"><Download size={20} /></button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Mission Control: The "Master View" for active jobs */}
      {focusedJob && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-4">
           <div className="bg-[#F8FAFC] w-full max-w-6xl rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in duration-500">
              
              {/* Left Column: Log Pipeline & Geographic Awareness */}
              <div className="flex-1 p-10 sm:p-14 overflow-y-auto space-y-10">
                 <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setFocusedJob(null)}
                      className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:-translate-x-1 transition-transform"
                    >
                       ← Deployment Grid
                    </button>
                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${STATUS_COLORS[focusedJob.status]}`}>
                       {focusedJob.status.replace(/_/g, ' ')}
                    </span>
                 </div>

                 <div className="space-y-4">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
                       {categories.find(c => c.id === focusedJob.categoryId)?.name} Hub
                    </h2>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed flex items-center gap-2">
                       <MapPin size={20} className="text-blue-600" /> {focusedJob.location.address}
                    </p>
                 </div>

                 {/* Real-time Tracking Layer (Mock Visual) */}
                 {focusedJob.status === JobStatus.IN_TRANSIT && (
                    <div className="relative h-64 bg-blue-50 rounded-[3rem] overflow-hidden border border-blue-100 shadow-inner group">
                       <div className="absolute inset-0 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                          <div className="relative w-20 h-20">
                             <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20"></div>
                             <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white relative border-4 border-white shadow-xl">
                                <Navigation size={32} className="animate-float" />
                             </div>
                          </div>
                       </div>
                       <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Technician In Transit</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. ETA: 8 Mins</p>
                       </div>
                    </div>
                 )}

                 {/* Dispute Governance Active View */}
                 {focusedJob.status === JobStatus.DISPUTED && (
                    <div className="bg-red-950 text-white p-10 rounded-[3.5rem] space-y-6 shadow-2xl animate-pulse">
                       <div className="flex items-center gap-3 text-red-400 font-black text-[10px] uppercase tracking-widest">
                          <Scale size={18} /> Judicial Audit Active
                       </div>
                       <h4 className="text-2xl font-black tracking-tight">Escrow Locked • Review Pending</h4>
                       <p className="text-red-200/80 font-medium leading-relaxed">
                          The Governance Engine has flagged this deployment. All ledger activity is paused until human review completes.
                       </p>
                    </div>
                 )}

                 {/* Payment Escrow View */}
                 {focusedJob.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
                    <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-100 shadow-2xl animate-in fade-in duration-700 space-y-8">
                       <div className="flex items-center gap-4 text-blue-600 font-black text-[10px] uppercase tracking-widest">
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
                                      className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${selectedMethod === pm.id ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-50/50' : 'border-gray-50 bg-gray-50 hover:bg-white'}`}
                                   >
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                                            <CardIcon size={20} className="text-gray-400" />
                                         </div>
                                         <div className="text-left">
                                            <p className="text-sm font-black text-gray-900">{pm.brand} •••• {pm.last4}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Exp {pm.expiry}</p>
                                         </div>
                                      </div>
                                      {selectedMethod === pm.id && <CheckCircle2 size={18} className="text-blue-600" />}
                                   </button>
                                ))}
                             </div>
                          </div>
                          <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-6 flex flex-col justify-between">
                             <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                   <span>Deployment Charge</span>
                                   <span className="text-gray-900">₹{focusedJob.price - 49}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                   <span>Convenience Layer</span>
                                   <span className="text-gray-900">₹49</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                   <span className="text-sm font-black text-gray-900 uppercase">Total Net</span>
                                   <span className="text-3xl font-black text-blue-600">₹{focusedJob.price}</span>
                                </div>
                             </div>
                             <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                   <Lock size={12} className="text-green-500" /> AES-256 Protocol Enabled
                                </div>
                                <button 
                                  onClick={handlePayment}
                                  disabled={isPaying}
                                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                                >
                                   {isPaying ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                                   {isPaying ? 'Processing Protocol...' : 'Confirm Settlement'}
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Pipeline History: Vertical Timeline */}
                 {focusedJob.status !== JobStatus.COMPLETED_PENDING_PAYMENT && focusedJob.status !== JobStatus.DISPUTED && (
                    <div className="space-y-8">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                          <History size={14}/> Event Chain Pipeline
                       </h4>
                       <div className="space-y-0 relative">
                          {loadingTimeline ? (
                            <div className="flex items-center gap-4 p-8 text-gray-400 animate-pulse">
                               <Loader2 className="animate-spin" size={20} />
                               <span className="font-bold text-sm uppercase tracking-widest italic">Decrypting Logs...</span>
                            </div>
                          ) : jobTimeline.length > 0 ? jobTimeline.map((ev, i) => (
                            <div key={ev.id} className="relative pl-12 pb-10 group">
                               {i !== jobTimeline.length - 1 && (
                                 <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-gray-200 group-last:hidden"></div>
                               )}
                               <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${i === 0 ? 'bg-blue-600 animate-pulse scale-110' : 'bg-gray-300'}`}></div>
                               <div className="space-y-1">
                                  <p className={`font-black uppercase tracking-widest text-[10px] ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                     {ev.to_status.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-gray-500 text-xs font-bold">{new Date(ev.created_at).toLocaleTimeString()} • {new Date(ev.created_at).toLocaleDateString()}</p>
                                  {ev.metadata?.method && <p className="text-[9px] font-black text-indigo-400 uppercase mt-1 italic">Source: {ev.metadata.method}</p>}
                               </div>
                            </div>
                          )) : (
                            <div className="p-8 text-center text-gray-300 font-bold uppercase text-[10px] border-2 border-dashed border-gray-50 rounded-3xl">
                               Genesis Node Initializing...
                            </div>
                          )}
                       </div>
                    </div>
                 )}
              </div>

              {/* Interaction Hub: Worker Stats & Actions */}
              <div className="w-full md:w-[420px] bg-white border-l border-gray-100 p-10 sm:p-14 flex flex-col gap-10">
                 
                 {focusedJob.workerId ? (
                    <div className="space-y-8 animate-in slide-in-from-right-10">
                       <div className="flex flex-col items-center text-center space-y-4">
                          <div className="relative">
                             <div className="w-32 h-32 bg-gray-100 rounded-[3rem] overflow-hidden border-4 border-white shadow-xl">
                                <img src={`https://picsum.photos/seed/${focusedJob.workerId}/300`} alt="Technician" className="w-full h-full object-cover" />
                             </div>
                             <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                                <ShieldCheck size={20} />
                             </div>
                          </div>
                          <div>
                             <h4 className="text-2xl font-black text-gray-900 tracking-tight">Elite Partner Assigned</h4>
                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Tier 1 Certified Specialist</p>
                          </div>
                          <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full text-yellow-700 font-black text-xs">
                             <Star size={16} className="fill-yellow-400" /> 4.9 Verified Performance
                          </div>
                       </div>

                       {focusedJob.status !== JobStatus.PAID && focusedJob.status !== JobStatus.DISPUTED && (
                          <div className="grid grid-cols-2 gap-4">
                             <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-[2rem] hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 group">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                   <Phone size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Comm Node</span>
                             </button>
                             <button className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded-[2rem] hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 group">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                   <MessageCircle size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Chat Log</span>
                             </button>
                          </div>
                       )}

                       {/* Verification Token (Handshake) */}
                       {(focusedJob.status === JobStatus.ASSIGNED || focusedJob.status === JobStatus.IN_TRANSIT) && (
                         <div className="bg-indigo-950 p-8 rounded-[3rem] text-white space-y-6 shadow-3xl">
                            <div className="flex items-center gap-3 text-indigo-300 font-black text-[10px] uppercase tracking-widest">
                               <ShieldCheck size={18} /> Secure Handshake Protocol
                            </div>
                            {activeOTP?.jobId === focusedJob.id ? (
                               <div className="text-center bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                                  <p className="text-[10px] text-indigo-300 font-black uppercase mb-2">Show to Partner on Arrival</p>
                                  <p className="text-5xl font-black tracking-[0.3em]">{activeOTP.code}</p>
                               </div>
                            ) : (
                               <button 
                                 onClick={() => generateOTP(focusedJob.id)}
                                 className="w-full bg-white text-indigo-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-indigo-500/50 transition-all"
                               >
                                 Generate Secure Token
                               </button>
                            )}
                         </div>
                       )}
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                       <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                          <Navigation size={40} className="animate-float" />
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Matching Algorithm Active</h4>
                          <p className="text-gray-400 font-medium text-sm mt-2">Optimizing logistics for the nearest available specialist.</p>
                       </div>
                    </div>
                 )}

                 {/* Danger/Governance Zone */}
                 <div className="mt-auto space-y-4">
                    {focusedJob.status !== JobStatus.PAID && focusedJob.status !== JobStatus.CANCELLED && focusedJob.status !== JobStatus.DISPUTED && (
                       <>
                          <div className="flex items-center gap-3 text-red-500/80 font-black text-[9px] uppercase tracking-widest px-4">
                             <AlertTriangle size={14} /> Governance Controls
                          </div>
                          
                          {(focusedJob.status === JobStatus.COMPLETED_PENDING_PAYMENT || focusedJob.status === JobStatus.STARTED) && (
                             <button 
                                onClick={() => setShowDisputeModal(true)}
                                className="w-full py-5 bg-red-50 text-red-600 rounded-[2rem] font-black text-sm uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                             >
                                <Gavel size={18} /> Resolve Incident
                             </button>
                          )}

                          {focusedJob.status !== JobStatus.STARTED && (
                             <button 
                                onClick={() => cancelJob(focusedJob.id)}
                                className="w-full py-5 border-2 border-gray-100 text-gray-400 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                             >
                                Terminate Deployment
                             </button>
                          )}
                       </>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Booking Wizard (Standard) */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[95vh] flex flex-col">
            
            <div className="h-2 bg-gray-100 w-full shrink-0 flex">
              {(['SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'] as BookingStep[]).map((s, i) => {
                const steps = ['SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'];
                const currentIndex = steps.indexOf(bookingStep);
                const isActive = i <= currentIndex;
                return (
                  <div key={s} className={`flex-1 transition-all duration-1000 ${isActive ? 'bg-blue-600' : 'bg-transparent'}`}></div>
                );
              })}
            </div>

            <div className="p-8 sm:p-12 border-b border-gray-50 flex justify-between items-center shrink-0 bg-gray-50/50">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-xl">
                    {selectedCategory.icon}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{selectedCategory.name}</h3>
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Protocol Step {bookingStep === 'SERVICE' ? '1' : bookingStep === 'LOCATION' ? '2' : bookingStep === 'DETAILS' ? '3' : '4'}</p>
                  </div>
               </div>
               <button onClick={resetBooking} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100"><X size={20} /></button>
            </div>

            <div className="p-10 sm:p-14 overflow-y-auto flex-1">
              {bookingStep === 'SERVICE' && (
                <div className="space-y-8 animate-in slide-in-from-right-10">
                   <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><Zap className="text-blue-600" size={20} /> Select Sub-Routine</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedCategory.serviceTypes?.map(st => (
                        <button
                          key={st.id}
                          onClick={() => { setSelectedServiceType(st); setBookingStep('LOCATION'); }}
                          className={`flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all text-left ${selectedServiceType?.id === st.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-white'}`}
                        >
                          <div className="space-y-2">
                             <h5 className="font-black text-gray-900 text-lg">{st.name}</h5>
                             <span className="text-[10px] font-black uppercase text-gray-400">{st.avgDuration} Cycle</span>
                          </div>
                          <p className="text-xl font-black text-blue-600">₹{st.basePrice}</p>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {bookingStep === 'LOCATION' && (
                <div className="space-y-10 animate-in slide-in-from-right-10">
                   <div className="space-y-4">
                      <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><MapPin className="text-blue-600" size={20} /> Deployment Coordinates</h4>
                      <div className="relative">
                        <input 
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Search for landmark..."
                          className="w-full pl-8 pr-32 py-6 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-3xl font-bold text-gray-900 outline-none"
                        />
                        <button 
                          onClick={handleDetectLocation}
                          disabled={isLocating}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-blue-600 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 flex items-center gap-2 shadow-sm"
                        >
                          {isLocating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                          GPS Fix
                        </button>
                      </div>
                   </div>
                   {coords && (
                     <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 flex items-center gap-4 text-green-700">
                        <CheckCircle2 size={24} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Geo-Lock Verified</p>
                          <p className="text-sm font-bold">Latency Adjusted Position Recorded</p>
                        </div>
                     </div>
                   )}
                   <button 
                    disabled={!address || !coords}
                    onClick={() => setBookingStep('DETAILS')}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all hover:bg-blue-700"
                   >Lock Position & Proceed</button>
                </div>
              )}

              {bookingStep === 'DETAILS' && (
                <div className="space-y-8 animate-in slide-in-from-right-10">
                   <div className="space-y-4">
                      <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><Info className="text-blue-600" size={20} /> Manifest Details</h4>
                      <textarea 
                        value={issueDescription}
                        onChange={(e) => setIssueDescription(e.target.value)}
                        placeholder="Detail the issue for the automated triage..."
                        rows={5}
                        className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none"
                      />
                   </div>
                   {issueDescription.length > 10 && !diagnosis && (
                      <button onClick={handleDiagnose} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-blue-50">
                        {isDiagnosing ? <Loader2 className="animate-spin" /> : <Sparkles />} Gemini Diagnostic Engine
                      </button>
                   )}
                   {diagnosis && (
                      <div className="bg-indigo-950 text-white p-10 rounded-[3rem] space-y-4 shadow-2xl animate-in zoom-in">
                        <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest flex items-center gap-2"><ShieldEllipsis size={14}/> Node Inference Results</p>
                        <p className="text-xl font-bold">{diagnosis.diagnosis}</p>
                        <div className="flex flex-wrap gap-2">
                          {diagnosis.tools?.map((t: string) => <span key={t} className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">{t}</span>)}
                        </div>
                      </div>
                   )}
                   <button 
                    disabled={issueDescription.length < 5}
                    onClick={() => setBookingStep('REVIEW')}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 hover:bg-blue-700 transition-all"
                   >Review Summary</button>
                </div>
              )}

              {bookingStep === 'REVIEW' && (
                <div className="space-y-10 animate-in slide-in-from-right-10">
                   <div className="bg-gray-50 p-10 rounded-[3.5rem] space-y-8 border border-gray-100">
                      <div className="flex justify-between items-start border-b border-gray-100 pb-8">
                         <div className="flex items-center gap-4 text-xs font-black text-blue-600 uppercase tracking-widest">
                            <CheckCircle2 size={16} /> Pre-Authorized Payload
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Net Rate</p>
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{(selectedServiceType?.basePrice || 0) + 49}</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100">
                            <div>
                               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Selected Sub-Routine</p>
                               <p className="font-black text-gray-900">{selectedServiceType?.name}</p>
                            </div>
                            <ArrowRight className="text-gray-200" />
                         </div>
                      </div>
                   </div>
                   <button 
                    onClick={executeBooking}
                    disabled={isBooking}
                    className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95"
                   >
                     {isBooking ? <Loader2 className="animate-spin" /> : <Calculator />} Initialize Deployment
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
