
import React from 'react';
import { ServiceCategory, Job, JobStatus } from '../../types';
import { LayoutGrid, Search, MapPin, Activity, ChevronRight, Zap } from 'lucide-react';
import { STATUS_COLORS } from '../../constants';

interface Props {
  categories: ServiceCategory[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeJobs: Job[];
  onSelectCategory: (cat: ServiceCategory) => void;
  onFocusJob: (job: Job) => void;
}

const ServiceDiscoveryView: React.FC<Props> = ({ 
  categories, 
  searchQuery, 
  setSearchQuery, 
  activeJobs, 
  onSelectCategory,
  onFocusJob
}) => {
  return (
    <div className="space-y-16">
      {/* Active Deployments Section - Immersive Cards */}
      {activeJobs.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">Live Deployments</h2>
             </div>
             <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{activeJobs.length} Node{activeJobs.length > 1 ? 's' : ''} Active</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeJobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => onFocusJob(job)}
                className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-gray-100 flex flex-col gap-8 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gray-50 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                       <Zap size={24} className={job.status === JobStatus.STARTED ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg">Mission Hub</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: #{job.id.slice(0,8)}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${STATUS_COLORS[job.status]}`}>
                    {job.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-gray-500 bg-gray-50 p-4 rounded-2xl border border-gray-100 group-hover:bg-indigo-50/30 transition-colors">
                     <MapPin size={18} className="text-indigo-500 shrink-0" />
                     <span className="truncate text-xs font-bold uppercase tracking-tight">{job.location.address}</span>
                   </div>
                   <div className="flex items-center justify-between pt-2">
                      <div className="flex -space-x-3">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                         ))}
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">+4</div>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{job.price}</span>
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Auth Amount</span>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between group-hover:text-indigo-600 transition-colors">
                   <span className="text-[10px] font-black uppercase tracking-widest">Manage Deployment</span>
                   <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Service Marketplace - The Primary Grid */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
               <LayoutGrid size={24} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Infrastructure Core</h2>
          </div>
          <div className="relative w-full md:w-80">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
             <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routines..."
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-transparent focus:border-indigo-600 rounded-[2rem] outline-none text-sm font-bold shadow-sm transition-all"
             />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className="group flex flex-col items-center gap-8 p-12 rounded-[4rem] bg-white border-2 border-transparent hover:border-indigo-100 shadow-sm hover:shadow-3xl hover:-translate-y-3 transition-all duration-500"
            >
              <div className="w-32 h-32 bg-gray-50 rounded-[3.5rem] flex items-center justify-center text-8xl shadow-inner group-hover:scale-110 transition-all duration-700">
                {cat.icon}
              </div>
              <div className="text-center space-y-2">
                <span className="block text-sm font-black text-gray-900 uppercase tracking-widest">{cat.name}</span>
                <span className="block text-[9px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">From ₹{cat.basePrice}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Trust & Policy Badge */}
      <div className="bg-gray-900 text-white p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-3xl">
         <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
               <Activity size={40} className="text-indigo-400" />
            </div>
            <div className="space-y-1">
               <h4 className="text-2xl font-black tracking-tight uppercase">SkillConnect Guarantee</h4>
               <p className="text-indigo-300 font-medium text-sm">All deployments are covered by our Level-1 Protection Protocol.</p>
            </div>
         </div>
         <div className="flex gap-6">
            <div className="text-center">
               <p className="text-3xl font-black">100%</p>
               <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Verified Fleet</p>
            </div>
            <div className="h-12 w-px bg-white/10"></div>
            <div className="text-center">
               <p className="text-3xl font-black">24/7</p>
               <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Safety Support</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ServiceDiscoveryView;
