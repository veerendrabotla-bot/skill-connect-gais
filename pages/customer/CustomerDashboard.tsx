
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Job, ServiceCategory } from '../../types';
import { jobService } from '../../services/jobService';
import ServiceDiscoveryView from './ServiceDiscoveryView';
import JobHistoryView from './JobHistoryView';
import BookingWizard from './BookingWizard';
import MissionControl from './MissionControl';
import ReceiptModal from '../../components/customer/ReceiptModal';
import { Loader2 } from 'lucide-react';

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const CustomerDashboard: React.FC<Props> = ({ jobs, setJobs }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  
  // Modals & Focused State
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [focusedJob, setFocusedJob] = useState<Job | null>(null);
  const [showReceipt, setShowReceipt] = useState<Job | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [cats, myJobs] = await Promise.all([
          jobService.getCategories(),
          jobService.getMyJobs(user.id)
        ]);
        setCategories(cats);
        setJobs(myJobs);
      } catch (err) {
        console.error("Data Load Failure", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    if (user) {
      const channel = jobService.subscribeToMyJobs(user.id, (updatedJob) => {
        setJobs(prev => {
          const exists = prev.some(j => j.id === updatedJob.id);
          if (exists) {
            return prev.map(j => j.id === updatedJob.id ? updatedJob : j);
          }
          return [updatedJob, ...prev];
        });
        if (focusedJob?.id === updatedJob.id) setFocusedJob(updatedJob);
      });
      return () => { channel.unsubscribe(); };
    }
  }, [user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Syncing Service Mesh</span>
    </div>
  );

  const activeJobs = jobs.filter(j => j.status !== 'PAID' && j.status !== 'CANCELLED');
  const pastJobs = jobs.filter(j => j.status === 'PAID' || j.status === 'CANCELLED');
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 animate-in fade-in duration-700 pb-20">
      
      {/* View Switcher Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">My Network</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Managing {jobs.length} total deployments</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
          <button 
            onClick={() => setView('active')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}
          >
            Active Pipeline
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}
          >
            Audit History
          </button>
        </div>
      </div>

      {view === 'active' ? (
        <ServiceDiscoveryView 
          categories={filteredCategories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeJobs={activeJobs}
          onSelectCategory={setSelectedCategory}
          onFocusJob={setFocusedJob}
        />
      ) : (
        <JobHistoryView 
          pastJobs={pastJobs}
          onShowReceipt={setShowReceipt}
        />
      )}

      {/* Sub-UI Components */}
      {selectedCategory && (
        <BookingWizard 
          category={selectedCategory} 
          onClose={() => setSelectedCategory(null)} 
          onSuccess={() => setSelectedCategory(null)} 
        />
      )}

      {focusedJob && (
        <MissionControl 
          job={focusedJob} 
          onClose={() => setFocusedJob(null)} 
        />
      )}

      {showReceipt && (
        <ReceiptModal 
          job={showReceipt} 
          onClose={() => setShowReceipt(null)} 
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
