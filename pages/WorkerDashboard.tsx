
import React, { useState, useEffect } from 'react';
// Fix: Import useAuth from the correct context location
import { useAuth } from '../context/AuthContext';
import { Job, JobStatus, WalletTransaction } from '../types';
import { jobService } from '../services/jobService';
import { locationService } from '../services/locationService';
import { STATUS_COLORS } from '../constants';
import { canTransition } from '../services/stateMachine';
import { MapPin, Navigation, Wallet, Star, CheckCircle2, History, ArrowUpRight, ArrowDownLeft, Power, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const WorkerDashboard: React.FC<Props> = ({ jobs, setJobs }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'radar' | 'earnings' | 'jobs'>('radar');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        let loc = null;
        if (isOnline) {
          loc = await locationService.getCurrentPosition();
          setUserLocation(loc);
        }

        const [myJobs, availableJobs] = await Promise.all([
          jobService.getMyJobs(user.id),
          jobService.getAvailableLeads(loc?.lat, loc?.lng)
        ]);
        
        setJobs([...myJobs, ...availableJobs]);
      } catch (err) {
        console.error("Worker Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, isOnline]);

  const assignedJobs = jobs.filter(j => j.workerId === user?.id && j.status !== JobStatus.PAID && j.status !== JobStatus.CANCELLED);
  const availableJobs = jobs.filter(j => j.status === JobStatus.REQUESTED);

  const updateJobStatus = async (jobId: string, nextStatus: JobStatus) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && canTransition(job.status, nextStatus)) {
      try {
        await jobService.updateJobStatus(jobId, nextStatus);
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: nextStatus, updatedAt: new Date().toISOString() } : j));
      } catch (err) {
        setTransitionError("Platform Sync Failed. Try again.");
      }
    } else {
      setTransitionError(`Invalid state transition requested.`);
      setTimeout(() => setTransitionError(null), 3000);
    }
  };

  const claimJob = async (jobId: string) => {
    if (!user) return;
    try {
      const success = await jobService.claimJob(jobId, user.id);
      if (!success) throw new Error("Already claimed");
      
      const myUpdatedJobs = await jobService.getMyJobs(user.id);
      setJobs(prev => {
        const others = prev.filter(j => j.id !== jobId);
        return [...others, ...myUpdatedJobs.filter(j => j.id === jobId)];
      });
      setActiveTab('jobs');
    } catch (err) {
      alert("Lead already claimed by another partner.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-gray-500 font-bold">Connecting to Lead Network...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 animate-in fade-in duration-500">
      {transitionError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in zoom-in">
          <AlertTriangle size={20} />
          <span className="font-black text-sm uppercase tracking-wider">{transitionError}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Command Center</h1>
          <div className="flex items-center gap-2 mt-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Enterprise Verified Hub</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black text-lg transition-all shadow-xl ${
            isOnline ? 'bg-green-600 text-white shadow-green-100' : 'bg-white text-gray-700 border-2 border-gray-100'
          }`}
        >
          <Power size={20} />
          {isOnline ? 'Online' : 'Go Online'}
        </button>
      </div>

      <div className="flex bg-white p-2 rounded-[2rem] mb-10 border border-gray-100 shadow-sm w-fit">
        {(['radar', 'jobs', 'earnings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-10 py-3 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[600px] flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              
              {!isOnline ? (
                <div className="text-center space-y-4 p-10">
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <Power size={48} />
                   </div>
                   <h2 className="text-2xl font-black text-gray-900">Radar Offline</h2>
                   <p className="text-gray-500 font-medium">Toggle "Go Online" to start discovering high-value leads in your zone.</p>
                </div>
              ) : (
                <div className="relative z-10 text-center w-full h-full p-10">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                     <div className="w-[400px] h-[400px] border-4 border-blue-600 rounded-full animate-ping"></div>
                  </div>
                  
                  <div className="relative inline-block mb-10">
                    <div className="absolute -inset-16 bg-blue-100 rounded-full animate-pulse opacity-30"></div>
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl relative border-8 border-white animate-float">
                      <Navigation size={40} />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Active Pulse</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Searching leads within 25km radius...</p>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableJobs.map(job => (
                      <div key={job.id} className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-2xl flex flex-col gap-4 text-left group hover:scale-105 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                              🏠
                            </div>
                            <div>
                              <h4 className="font-black text-gray-900">Service Request</h4>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                {job.distance ? `Est. ${locationService.formatDistance(job.distance)} away` : 'Calculating distance...'}
                              </p>
                            </div>
                          </div>
                          <span className="font-black text-2xl text-blue-600">₹{job.price}</span>
                        </div>
                        <button 
                          onClick={() => claimJob(job.id)}
                          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                          Accept Lead
                        </button>
                      </div>
                    ))}
                    {availableJobs.length === 0 && (
                      <div className="col-span-full py-20 text-gray-400 font-bold italic">
                        No active leads within range. Pulse is steady.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-blue-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <p className="text-blue-300 text-xs font-black uppercase tracking-[0.2em] mb-2">Partner Wallet</p>
                <h3 className="text-5xl font-black mb-8">₹12,450</h3>
                <div className="flex flex-col gap-3">
                   <button className="w-full bg-white text-blue-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:shadow-xl transition-all">Pledge Payout</button>
                   <p className="text-[10px] text-blue-400 text-center font-bold">Standard 24h settlement logic applied.</p>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={20} />
                  Tier Metrics
                </h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                         <span className="text-gray-400">Success Rate</span>
                         <span className="text-green-600">98%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                         <div className="bg-green-500 h-full w-[98%] rounded-full shadow-inner"></div>
                      </div>
                   </div>
                   <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Global Rating</span>
                      <span className="text-xl font-black text-gray-900">4.8 / 5.0</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Assignments</h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-full uppercase tracking-widest border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Grid Active
            </div>
          </div>
          
          {assignedJobs.map(job => (
            <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10 animate-in slide-in-from-bottom-5">
              <div className="flex flex-col md:flex-row justify-between gap-10">
                 <div className="flex gap-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border border-gray-100">
                      🛠️
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Priority Service</h3>
                      <p className="text-gray-500 font-bold flex items-center gap-1.5 mt-2"><MapPin size={16} className="text-blue-600"/> {job.location.address}</p>
                      <div className="mt-5 flex gap-3">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-sm ${STATUS_COLORS[job.status]}`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                        <span className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] bg-gray-50 text-gray-400 border border-gray-100">
                          ID: #{job.id.slice(0,8)}
                        </span>
                      </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-4 min-w-[280px]">
                    {job.status === JobStatus.ASSIGNED && (
                      <button 
                        onClick={() => updateJobStatus(job.id, JobStatus.IN_TRANSIT)}
                        className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 group"
                      >
                        <Navigation size={22} className="group-hover:translate-x-1 transition-transform" /> Start Transit
                      </button>
                    )}
                    {job.status === JobStatus.IN_TRANSIT && (
                      <button 
                        onClick={() => updateJobStatus(job.id, JobStatus.STARTED)}
                        className="bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-orange-100 hover:bg-orange-700 transition-all"
                      >
                        Verify OTP & Start
                      </button>
                    )}
                    {job.status === JobStatus.STARTED && (
                      <button 
                        onClick={() => updateJobStatus(job.id, JobStatus.COMPLETED_PENDING_PAYMENT)}
                        className="bg-green-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-3"
                      >
                        <CheckCircle2 size={22} /> Request Payout
                      </button>
                    )}
                    {job.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
                      <div className="bg-blue-50 p-6 rounded-[2rem] text-center border-2 border-dashed border-blue-200 animate-pulse">
                         <p className="text-xs text-blue-600 font-black uppercase tracking-widest">Awaiting Escrow Release</p>
                         <p className="font-black text-3xl text-blue-900 mt-2">₹{job.price}</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Incident Brief</h4>
                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                       <p className="text-gray-700 leading-relaxed font-bold italic text-lg">"{job.description}"</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Secure Communications</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <button className="flex items-center justify-center gap-3 py-5 bg-white border-2 border-gray-100 rounded-[1.5rem] font-black text-sm uppercase tracking-widest text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm">
                          Masked Call
                       </button>
                       <button className="flex items-center justify-center gap-3 py-5 bg-white border-2 border-gray-100 rounded-[1.5rem] font-black text-sm uppercase tracking-widest text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm">
                          Enterprise Chat
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          ))}

          {assignedJobs.length === 0 && (
            <div className="text-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-gray-100 flex flex-col items-center">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-200">
                  <CheckCircle2 size={56} />
               </div>
               <h3 className="font-black text-3xl text-gray-900 tracking-tighter">Queue is Optimized</h3>
               <p className="text-gray-500 font-medium mt-3 max-w-sm">You have zero pending assignments. Use the Radar tab to discover high-priority leads.</p>
               <button 
                 onClick={() => setActiveTab('radar')}
                 className="mt-10 px-12 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
               >
                 Discover Leads
               </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-10">
           <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                 <div>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-3">Escrow Balance Available</p>
                    <h3 className="text-6xl font-black text-gray-900 tracking-tighter">₹12,450</h3>
                 </div>
                 <div className="flex gap-4">
                    <button className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all">Instant Payout</button>
                    <button className="px-8 py-5 bg-gray-50 text-gray-600 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all">History</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
