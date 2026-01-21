
import React, { useState, useEffect } from 'react';
import { Job } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { adminService, PlatformKPIs } from '../../services/adminService';
import OverviewView from './OverviewView';
import SystemHealthView from './SystemHealthView';
import WorkerReviewView from './WorkerReviewView';
import JobManagementView from './JobManagementView';
import FinancialAdminView from './FinancialAdminView';
import DisputeResolutionView from './DisputeResolutionView';
import AuditComplianceView from './AuditComplianceView';
import { 
  Shield, Activity, Database, Zap, RefreshCcw,
  LayoutDashboard, Fingerprint, Gavel, History, Loader2,
  Wrench, Landmark, Scale, FileText
} from 'lucide-react';

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const AdminDashboard: React.FC<Props> = ({ jobs, setJobs }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HEALTH' | 'WORKERS' | 'JOBS' | 'FINANCE' | 'DISPUTES' | 'AUDIT'>('OVERVIEW');
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlatformData();
    const interval = setInterval(loadPlatformData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const loadPlatformData = async () => {
    try {
      const data = await adminService.getKPIs();
      setKpis(data);
    } catch (err) {
      console.error("Admin Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white animate-pulse">
           <Shield size={32} />
        </div>
        <div className="text-center">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Governance Layer Initializing</p>
           <p className="text-xs font-bold text-indigo-600 mt-1 uppercase italic">Authenticating Administrative Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pb-20 animate-in fade-in duration-700">
      
      {/* Platform Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
               <Fingerprint size={28} />
            </div>
            <div>
               <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Platform OS</h1>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-md text-[9px] font-black text-green-600 uppercase tracking-widest border border-green-100">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                     System Online
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Version: 4.2.1-stable</span>
               </div>
            </div>
          </div>
        </div>

        {/* Global Navigation */}
        <div className="flex flex-wrap bg-white p-2 rounded-[2.5rem] border border-gray-100 shadow-sm gap-2">
           <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
           >
             <LayoutDashboard size={14} /> Intelligence
           </button>
           <button 
            onClick={() => setActiveTab('HEALTH')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HEALTH' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
           >
             <Activity size={14} /> Health
           </button>
           <button 
            onClick={() => setActiveTab('JOBS')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'JOBS' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
           >
             <Wrench size={14} /> Mesh
           </button>
           <button 
            onClick={() => setActiveTab('FINANCE')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'FINANCE' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
           >
             <Landmark size={14} /> Fiscal
           </button>
           <button 
            onClick={() => setActiveTab('DISPUTES')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'DISPUTES' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
           >
             <Scale size={14} /> Judicial
           </button>
           <button 
            onClick={() => setActiveTab('WORKERS')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'WORKERS' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
           >
             <Gavel size={14} /> KYC
           </button>
           <button 
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'AUDIT' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'}`}
           >
             <FileText size={14} /> Compliance
           </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
           <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                 <Zap size={22} />
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase">Live</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Deployments</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{kpis?.active_deployments || 0}</h3>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
           <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                 <Shield size={22} />
              </div>
              <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg uppercase">Action</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending KYC Audits</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{kpis?.pending_kyc || 0}</h3>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
           <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                 <Database size={22} />
              </div>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg uppercase">30D</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Settlement Volume</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">₹{(kpis?.monthly_volume || 0).toLocaleString()}</h3>
           </div>
        </div>

        <div className="bg-indigo-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
           <div className="flex justify-between items-start relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-300">
                 <Activity size={22} />
              </div>
              <button onClick={loadPlatformData} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                 <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Platform Standing</p>
              <h3 className="text-4xl font-black tracking-tighter uppercase">{kpis?.system_status}</h3>
           </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
         {activeTab === 'OVERVIEW' && <OverviewView />}
         {activeTab === 'HEALTH' && <SystemHealthView />}
         {activeTab === 'JOBS' && <JobManagementView />}
         {activeTab === 'FINANCE' && <FinancialAdminView />}
         {activeTab === 'DISPUTES' && <DisputeResolutionView />}
         {activeTab === 'WORKERS' && <WorkerReviewView />}
         {activeTab === 'AUDIT' && <AuditComplianceView />}
      </div>

    </div>
  );
};

export default AdminDashboard;