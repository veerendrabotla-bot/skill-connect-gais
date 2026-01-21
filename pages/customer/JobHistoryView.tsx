
import React from 'react';
import { Job, JobStatus } from '../../types';
import { History, Receipt, Share2 } from 'lucide-react';
import { STATUS_COLORS, SERVICE_CATEGORIES } from '../../constants';

interface Props {
  pastJobs: Job[];
  onShowReceipt: (job: Job) => void;
}

const JobHistoryView: React.FC<Props> = ({ pastJobs, onShowReceipt }) => {
  return (
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
                    <td className="px-10 py-6 font-mono text-xs text-gray-400">#{job.id.slice(0, 8)}</td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{SERVICE_CATEGORIES.find(c => c.id === job.categoryId)?.icon || '🛠️'}</span>
                        <span className="font-black text-gray-900">{SERVICE_CATEGORIES.find(c => c.id === job.categoryId)?.name || 'Service'}</span>
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
                            onClick={() => onShowReceipt(job)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            <Receipt size={14} /> Receipt
                          </button>
                        )}
                        <button className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
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
  );
};

export default JobHistoryView;
