
import React, { useState } from 'react';
import { Job, JobStatus } from '../../types';
import { STATUS_COLORS } from '../../constants';
import JobExecutionHub from './JobExecutionHub';
import { 
  MapPin, Navigation, ShieldCheck, CheckCircle2, 
  Wrench, MessageSquare, Phone, AlertTriangle, ArrowRight
} from 'lucide-react';

interface Props {
  jobs: Job[];
  onStatusUpdate: (jobId: string, next: JobStatus) => Promise<void>;
}

const ActiveJobsView: React.FC<Props> = ({ jobs, onStatusUpdate }) => {
  const [focusedJob, setFocusedJob] = useState<Job | null>(null);

  if (focusedJob) {
    const liveJob = jobs.find(j => j.id === focusedJob.id) || focusedJob;
    return (
      <JobExecutionHub 
        job={liveJob} 
        onBack={() => setFocusedJob(null)} 
        onStatusUpdate={onStatusUpdate}
      />
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Assigned Deployments</h2>
        <div className="flex items-center gap-3 text-[10px] font-black text-green-600 bg-green-50 px-5 py-2.5 rounded-full uppercase tracking-widest border border-green-100 shadow-sm">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          Synchronized Lead Grid
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-10">
        {jobs.map(job => (
          <div 
            key={job.id} 
            onClick={() => setFocusedJob(job)}
            className="bg-white p-10 sm:p-14 rounded-[4rem] border border-gray-100 shadow-sm space-y-12 animate-in slide-in-from-bottom-5 hover:shadow-2xl transition-all duration-500 group cursor-pointer"
          >
            <div className="flex flex-col lg:flex-row justify-between gap-12">
               <div className="flex gap-10">
                  <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center text-6xl shadow-inner border border-gray-100 group-hover:scale-110 transition-transform duration-700">
                    🛠️
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Priority Command</p>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Site Intervention</h3>
                    </div>
                    <p className="text-gray-500 font-bold text-lg flex items-center gap-2 max-w-md">
                       <MapPin size={22} className="text-blue-600 shrink-0"/> 
                       <span className="line-clamp-1">{job.location.address}</span>
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                      <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${STATUS_COLORS[job.status]}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                      <span className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-gray-50 text-gray-400 border border-gray-100">
                        DEPLOY_ID: #{job.id.slice(0,8)}
                      </span>
                    </div>
                  </div>
               </div>

               <div className="flex flex-col gap-5 min-w-[320px] justify-center">
                  <button 
                    className="bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-4 group/btn active:scale-95"
                  >
                    Enter Execution Hub <ArrowRight className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-gray-100">
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Wrench size={14} /> Briefing Dossier
                  </h4>
                  <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner">
                     <p className="text-gray-700 leading-relaxed font-bold italic text-2xl">"{job.description}"</p>
                  </div>
               </div>
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <MessageSquare size={14} /> Protocol Awareness
                  </h4>
                  <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 flex items-center gap-3">
                     <AlertTriangle size={18} className="text-blue-600" />
                     <p className="text-[10px] text-blue-800 font-bold leading-tight uppercase tracking-tight">Access execution hub to initialize transit and secure the handshake token.</p>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-40 bg-white rounded-[5rem] border-4 border-dashed border-gray-100 flex flex-col items-center animate-in fade-in zoom-in duration-700">
           <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-200">
              <CheckCircle2 size={80} />
           </div>
           <h3 className="font-black text-4xl text-gray-900 tracking-tighter uppercase">Operations Optimized</h3>
           <p className="text-gray-500 font-medium mt-4 max-w-sm text-lg leading-relaxed">
             All active deployments are completed. Revert to Radar Discovery to monitor new network leads.
           </p>
        </div>
      )}
    </div>
  );
};

export default ActiveJobsView;
