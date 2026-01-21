
import React, { useState, useEffect } from 'react';
import { adminService, LiveJobEnriched } from '../../services/adminService';
import { systemService } from '../../services/systemService';
import { useAuth } from '../../context/AuthContext';
import { STATUS_COLORS } from '../../constants';
import { 
  Wrench, User, Clock, MapPin, Search, Filter, 
  ArrowLeft, History, AlertTriangle, ShieldCheck, 
  XCircle, CheckCircle2, Loader2, ExternalLink,
  Phone, Mail, Fingerprint, RefreshCcw
} from 'lucide-react';

const JobManagementView: React.FC = () => {
  const { user: admin } = useAuth();
  const [jobs, setJobs] = useState<LiveJobEnriched[]>([]);
  const [selectedJob, setSelectedJob] = useState<LiveJobEnriched | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Intervention State
  const [adminReason, setAdminReason] = useState('');
  const [intervening, setIntervening] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLiveJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = async (job: LiveJobEnriched) => {
    setSelectedJob(job);
    setLoadingDetails(true);
    try {
      const data = await systemService.getJobHistory(job.id);
      setTimeline(data?.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleIntervention = async (action: 'TERMINATE' | 'FORCE_COMPLETE') => {
    if (!selectedJob || !admin || !adminReason) {
      alert("A signed administrative reason is required for intervention protocols.");
      return;
    }
    setIntervening(true);
    try {
      await adminService.executeIntervention(selectedJob.id, admin.id, action, adminReason);
      setSelectedJob(null);
      setAdminReason('');
      loadJobs();
    } catch (err) {
      alert("Intervention protocol failed.");
    } finally {
      setIntervening(false);
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          j.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.worker_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTimeInState = (updatedAt: string) => {
    const diff = new Date().getTime() - new Date(updatedAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return { hours, mins, isStale: hours >= 4 };
  };

  if (selectedJob) {
    return (
      <div className="animate-in slide-in-from-right-10 duration-500">
        <button onClick={() => setSelectedJob(null)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-10 hover:-translate-x-1 transition-transform">
          <ArrowLeft size={14} /> Back to Live Mesh
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
             <div className="bg-white p-10 sm:p-14 rounded-[4.5rem] border border-gray-100 shadow-sm space-y-12">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-xl">
                        {selectedJob.category_icon}
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{selectedJob.category_name} Intervention</h3>
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1">NODE_ID: #{selectedJob.id.slice(0, 16)}</p>
                      </div>
                   </div>
                   <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[selectedJob.status]}`}>
                      {selectedJob.status.replace(/_/g, ' ')}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6 bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User size={14} /> Customer Node
                      </h4>
                      <div className="space-y-1">
                         <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedJob.customer_name}</p>
                         <p className="text-xs text-gray-500 font-bold">{selectedJob.customer_email}</p>
                      </div>
                   </div>
                   <div className="space-y-6 bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Fingerprint size={14} /> Worker Node
                      </h4>
                      {selectedJob.worker_name ? (
                        <div className="space-y-1">
                           <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedJob.worker_name}</p>
                           <p className="text-xs text-gray-500 font-bold">{selectedJob.worker_email}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-gray-400 italic">Matching Algorithm Active...</p>
                      )}
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} /> Deployment Event Chain
                   </h4>
                   <div className="space-y-6 pl-4 border-l-2 border-gray-50">
                      {loadingDetails ? (
                        <div className="py-10 flex items-center gap-4 text-gray-400">
                           <Loader2 className="animate-spin" size={20} />
                           <span className="text-xs font-black uppercase tracking-widest">Decrypting Timeline...</span>
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
                        <p className="text-sm font-bold text-gray-300 uppercase">Genesis Initializing...</p>
                      )}
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
             <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                     <AlertTriangle size={14} className="text-red-600" /> Intervention Protocol
                   </h4>
                   <textarea 
                     value={adminReason}
                     onChange={(e) => setAdminReason(e.target.value)}
                     placeholder="State the emergency reason for this override..."
                     rows={5}
                     className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none transition-all"
                   />
                </div>

                <div className="space-y-4">
                   <button 
                     onClick={() => handleIntervention('TERMINATE')}
                     disabled={intervening || !adminReason}
                     className="w-full py-6 bg-red-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {intervening ? <Loader2 className="animate-spin" /> : <XCircle size={18} />}
                     Terminate Deployment
                   </button>
                   <button 
                     onClick={() => handleIntervention('FORCE_COMPLETE')}
                     disabled={intervening || !adminReason}
                     className="w-full py-6 border-2 border-gray-100 text-emerald-600 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-100 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                     {intervening ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                     Force Settlement
                   </button>
                </div>
             </div>

             <div className="bg-indigo-900 text-white p-10 rounded-[3.5rem] shadow-3xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ShieldCheck size={24} />
                   </div>
                   <h4 className="text-lg font-black tracking-tight uppercase">Control Note</h4>
                </div>
                <p className="text-xs text-indigo-300 font-medium leading-relaxed italic relative z-10">
                   "Administrative overrides bypass standard customer/worker handshakes. Use only when site communication has broken down or an anomaly is detected."
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Mesh Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
         <div className="space-y-1">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Live Service Mesh</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time telemetry of all active deployments</p>
         </div>
         <div className="flex gap-4">
            <div className="relative w-72">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search Node ID or Identity..."
                 className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:border-indigo-600 text-xs font-bold"
               />
            </div>
            <button onClick={loadJobs} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all">
               <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
         </div>
      </div>

      {/* Deployment Grid */}
      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Node</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deployment Identity</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status Heartbeat</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Time in State</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-10 py-10 bg-gray-50/20 border-b border-gray-50"></td>
                      </tr>
                    ))
                  ) : filteredJobs.length > 0 ? filteredJobs.map(job => {
                    const time = getTimeInState(job.updated_at);
                    return (
                      <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  {job.category_icon}
                               </div>
                               <div>
                                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{job.category_name}</p>
                                  <p className="text-[10px] font-mono text-gray-400 uppercase font-bold">NODE: #{job.id.slice(0, 8)}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className="space-y-1">
                               <p className="text-xs font-black text-gray-900 uppercase">C: {job.customer_name}</p>
                               <p className="text-xs font-bold text-gray-400">W: {job.worker_name || 'PENDING'}</p>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_COLORS[job.status]}`}>
                               {job.status.replace(/_/g, ' ')}
                            </span>
                         </td>
                         <td className="px-10 py-8">
                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${time.isStale ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                               <Clock size={12} /> {time.hours}h {time.mins}m
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <button 
                              onClick={() => handleSelectJob(job)}
                              className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all ml-auto"
                            >
                               <ExternalLink size={16} />
                            </button>
                         </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                       <td colSpan={5} className="p-20 text-center">
                          <Wrench size={64} className="text-gray-100 mx-auto mb-6" />
                          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No active deployments detected in current filter</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default JobManagementView;
