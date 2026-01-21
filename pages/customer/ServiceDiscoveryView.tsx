
import React from 'react';
import { ServiceCategory, Job, JobStatus } from '../../types';
import { LayoutGrid, Search, MapPin } from 'lucide-react';
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
    <>
      {/* Active Job Grid */}
      {activeJobs.length > 0 && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeJobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => onFocusJob(job)}
                className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col gap-6 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-[1.8rem] flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-50">
                      🛠️
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 uppercase tracking-tight">Active Node</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Node ID: #{job.id.slice(0,8)}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${STATUS_COLORS[job.status]}`}>
                    {job.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs pt-6 border-t border-gray-50 mt-auto">
                  <div className="flex items-center gap-2 text-gray-400 font-bold">
                    <MapPin size={16} className="text-indigo-500" />
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
            <LayoutGrid className="text-indigo-600" size={28} />
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Infrastructure Services</h2>
          </div>
          <div className="hidden sm:block relative w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
             <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query services..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-indigo-600 text-sm font-bold shadow-sm"
             />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className="group flex flex-col items-center gap-6 p-10 rounded-[3.5rem] bg-white border-2 border-transparent hover:border-indigo-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500"
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
  );
};

export default ServiceDiscoveryView;
