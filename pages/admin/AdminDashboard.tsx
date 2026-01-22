
import React, { useState, useEffect, useMemo } from 'react';
import { AdminLevel, Job } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { adminService, PlatformKPIs } from '../../services/adminService';

// Module Imports
import OverviewView from './OverviewView';
import SystemHealthView from './SystemHealthView';
import WorkerReviewView from './WorkerReviewView';
import JobManagementView from './JobManagementView';
import FinancialAdminView from './FinancialAdminView';
import DisputeResolutionView from './DisputeResolutionView';
import AuditComplianceView from './AuditComplianceView';
import DiagnosticsView from './DiagnosticsView';
import GrowthView from './GrowthView';
import SafetyView from './SafetyView';
import AgilityView from './AgilityView';

import { 
  Shield, Activity, Zap, RefreshCcw, LayoutDashboard, Fingerprint, 
  Gavel, History, Loader2, Wrench, Landmark, Scale, FileText, Bug,
  TrendingUp, LifeBuoy, Settings, ShieldAlert, ChevronRight, Lock, 
  UserCheck, BarChart3, Menu, X, Eye, MonitorSmartphone, AlertTriangle, ArrowRight
} from 'lucide-react';

type TabType = 'OVERVIEW' | 'HEALTH' | 'WORKERS' | 'JOBS' | 'FINANCE' | 'DISPUTES' | 'AUDIT' | 'DIAGNOSTICS' | 'GROWTH' | 'SAFETY' | 'AGILITY';

interface NavItem {
  id: TabType;
  label: string;
  icon: any;
  color: string;
}

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const AdminDashboard: React.FC<Props> = ({ jobs, setJobs }) => {
  const { user, adminLevel, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [pulse, setPulse] = useState({ sos_active: 0, disputes_pending: 0 });

  // 1. Live Sync
  useEffect(() => {
    loadPlatformData();
    const subscription = adminService.subscribeToAllChanges(loadPlatformData);
    return () => subscription.unsubscribe();
  }, []);

  const loadPlatformData = async () => {
    try {
      const [data, livePulse] = await Promise.all([
         adminService.getKPIs(),
         adminService.getLivePulse()
      ]);
      setKpis(data);
      setPulse(livePulse);
    } catch (err) {
      console.error("Admin KPI Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  const navGroups = useMemo(() => {
    const allItems: NavItem[] = [
      { id: 'OVERVIEW', label: 'Intelligence Pulse', icon: LayoutDashboard, color: 'text-indigo-600' },
      { id: 'HEALTH', label: 'Infrastructure Kernel', icon: Activity, color: 'text-indigo-600' },
      { id: 'JOBS', label: 'Service Mesh', icon: Wrench, color: 'text-blue-600' },
      { id: 'GROWTH', label: 'Growth Terminal', icon: TrendingUp, color: 'text-emerald-600' },
      { id: 'SAFETY', label: 'Safety Monitor', icon: LifeBuoy, color: 'text-red-600' },
      { id: 'FINANCE', label: 'Fiscal Oversight', icon: Landmark, color: 'text-indigo-600' },
      { id: 'WORKERS', label: 'KYC Triage', icon: UserCheck, color: 'text-orange-600' },
      { id: 'DISPUTES', label: 'Judicial Docket', icon: Gavel, color: 'text-red-600' },
      { id: 'AUDIT', label: 'Compliance Vault', icon: FileText, color: 'text-indigo-600' },
      { id: 'AGILITY', label: 'Agility Terminal', icon: Settings, color: 'text-slate-600' },
      { id: 'DIAGNOSTICS', label: 'Diagnostic Node', icon: Bug, color: 'text-slate-600' },
    ];

    switch (adminLevel) {
      case AdminLevel.SUPER_ADMIN:
        return [
           { title: 'Core Sovereignty', items: allItems.filter(i => ['OVERVIEW', 'HEALTH', 'DIAGNOSTICS'].includes(i.id)) },
           { title: 'Business & Ops', items: allItems.filter(i => ['JOBS', 'AGILITY', 'SAFETY', 'FINANCE'].includes(i.id)) },
           { title: 'Governance & Legal', items: allItems.filter(i => ['WORKERS', 'DISPUTES', 'AUDIT'].includes(i.id)) },
           { title: 'Revenue & Growth', items: allItems.filter(i => ['GROWTH'].includes(i.id)) }
        ];
      case AdminLevel.OPS_MANAGER:
        return [
           { title: 'Operations', items: allItems.filter(i => ['OVERVIEW', 'JOBS', 'AGILITY', 'SAFETY'].includes(i.id)) }
        ];
      case AdminLevel.GROWTH_LEAD:
        return [
           { title: 'Sales & Growth', items: allItems.filter(i => ['OVERVIEW', 'GROWTH'].includes(i.id)) }
        ];
      case AdminLevel.COMPLIANCE_OFFICER:
        return [
           { title: 'Judiciary', items: allItems.filter(i => ['OVERVIEW', 'DISPUTES', 'WORKERS', 'AUDIT'].includes(i.id)) }
        ];
      default:
        return [{ title: 'Standard', items: [allItems[0]] }];
    }
  }, [adminLevel]);

  const handleSimulate = async (tier: AdminLevel | null) => {
    setIsSimulating(true);
    try {
       await adminService.simulateTier(tier);
       await refreshProfile();
       setActiveTab('OVERVIEW');
    } catch (err) {
       alert("Sovereign Simulation Fault.");
    } finally {
       setIsSimulating(false);
    }
  };

  if (loading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-slate-50">
        <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white animate-pulse shadow-2xl shadow-indigo-100">
           <Shield size={32} />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Handshaking with Kernel...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden selection:bg-indigo-100">
      
      {/* Sovereign Sidebar */}
      <aside className={`bg-white border-r border-gray-100 transition-all duration-500 ease-in-out flex flex-col z-[60] shadow-sm ${sidebarOpen ? 'w-80' : 'w-24'}`}>
         <div className="h-24 flex items-center justify-between px-8 shrink-0">
            <div className={`flex items-center gap-4 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible w-0'}`}>
               <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
               <div className="space-y-0.5">
                  <p className="text-sm font-black text-gray-900 tracking-tight uppercase">SkillConnect</p>
                  <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest leading-none">Sovereign OS</p>
               </div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
               {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
         </div>

         <div className={`px-6 py-6 border-b border-gray-50 transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible h-0 overflow-hidden'}`}>
            <div className="p-5 bg-gray-50 rounded-[2rem] space-y-4">
               <div className="flex items-center gap-4">
                  <img src={user?.avatar || `https://picsum.photos/seed/admin/100`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" alt="Admin" />
                  <div>
                     <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[120px]">{user?.name}</p>
                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{adminLevel?.replace('_', ' ')}</p>
                  </div>
               </div>
               
               {user?.adminLevel === AdminLevel.SUPER_ADMIN && (
                 <div className="pt-2 border-t border-gray-100">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Sovereign Simulator</label>
                    <select 
                      onChange={(e) => handleSimulate(e.target.value === 'NONE' ? null : e.target.value as AdminLevel)}
                      value={adminLevel || 'SUPER_ADMIN'}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 transition-all cursor-pointer"
                    >
                       <option value="SUPER_ADMIN">View As Architect</option>
                       <option value="OPS_MANAGER">View As Operations</option>
                       <option value="GROWTH_LEAD">View As Growth</option>
                       <option value="COMPLIANCE_OFFICER">View As Compliance</option>
                    </select>
                 </div>
               )}
            </div>
         </div>

         <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-10 custom-scrollbar">
            {navGroups.map((group, gIdx) => (
               <div key={gIdx} className="space-y-3">
                  <p className={`text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] ml-4 mb-4 transition-all ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                     {sidebarOpen ? group.title : '•••'}
                  </p>
                  <div className="space-y-1.5">
                     {group.items.map(item => {
                        const hasPulse = (item.id === 'SAFETY' && pulse.sos_active > 0) || (item.id === 'DISPUTES' && pulse.disputes_pending > 0);
                        return (
                          <button
                             key={item.id}
                             onClick={() => setActiveTab(item.id)}
                             className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group relative ${
                                activeTab === item.id 
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.02]' 
                                : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                             }`}
                          >
                             <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl transition-all ${
                                   activeTab === item.id ? 'bg-white/20' : 'bg-gray-50 text-gray-400 group-hover:bg-white'
                                }`}>
                                   <item.icon size={18} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 invisible w-0'}`}>
                                   {item.label}
                                </span>
                             </div>
                             {hasPulse && (
                                <div className="w-2 h-2 bg-red-500 rounded-full border-2 border-white absolute top-4 right-4 animate-pulse"></div>
                             )}
                             {(activeTab === item.id && sidebarOpen) && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
                          </button>
                        );
                     })}
                  </div>
               </div>
            ))}
         </nav>

         <div className="p-8 border-t border-gray-50 bg-gray-50/50">
            <div className={`flex items-center gap-4 transition-all ${sidebarOpen ? 'opacity-100' : 'opacity-0 scale-50'}`}>
               <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Bug size={16} className="text-gray-400" />
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-gray-900 uppercase">Version 4.2-Final</p>
                  <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Node Stable</p>
               </div>
            </div>
         </div>
      </aside>

      {/* Main OS Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
         
         {/* Persistent Global Alert Hub */}
         {pulse.sos_active > 0 && activeTab !== 'SAFETY' && (
            <div className="h-14 bg-red-600 text-white flex items-center justify-between px-10 animate-in slide-in-from-top duration-500 z-50 shadow-2xl">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                     <AlertTriangle size={20} className="animate-pulse" />
                     <p className="text-[11px] font-black uppercase tracking-widest leading-none">CRITICAL: Active SOS Signal Detected in Fleet</p>
                  </div>
                  <span className="w-px h-6 bg-white/20"></span>
                  <p className="text-[9px] font-bold text-red-100 uppercase tracking-tight italic">Action Required: Sector Safety Protocol bypass active.</p>
               </div>
               <button 
                onClick={() => setActiveTab('SAFETY')}
                className="flex items-center gap-2 bg-white text-red-600 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl"
               >
                  Triage Signal <ArrowRight size={14} />
               </button>
            </div>
         )}

         <header className="h-24 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                     {navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Console'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">Operational Node: SK_PRIME_X2</p>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-8">
               <div className="hidden lg:flex items-center gap-4 px-6 py-2.5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                  <Activity size={16} className="text-indigo-600" />
                  <div className="text-left">
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Kernel Health</p>
                     <p className="text-[10px] font-black text-gray-900 uppercase">{kpis?.system_status || 'OPTIMAL'}</p>
                  </div>
               </div>
               
               <div className="h-10 w-px bg-gray-100"></div>

               <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-white shadow-lg ${
                    adminLevel === AdminLevel.SUPER_ADMIN ? 'bg-indigo-600' : 
                    adminLevel === AdminLevel.OPS_MANAGER ? 'bg-blue-600' :
                    adminLevel === AdminLevel.GROWTH_LEAD ? 'bg-emerald-600' :
                    'bg-red-600'
                  }`}>
                     <Shield size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">{adminLevel?.replace('_', ' ')}</span>
                  </div>
               </div>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
            <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
               {activeTab === 'OVERVIEW' && <OverviewView />}
               {activeTab === 'HEALTH' && <SystemHealthView />}
               {activeTab === 'JOBS' && <JobManagementView />}
               {activeTab === 'GROWTH' && <GrowthView />}
               {activeTab === 'SAFETY' && <SafetyView />}
               {activeTab === 'FINANCE' && <FinancialAdminView />}
               {activeTab === 'WORKERS' && <WorkerReviewView />}
               {activeTab === 'DISPUTES' && <DisputeResolutionView />}
               {activeTab === 'AUDIT' && <AuditComplianceView />}
               {activeTab === 'DIAGNOSTICS' && <DiagnosticsView />}
               {activeTab === 'AGILITY' && <AgilityView />}
            </div>
         </div>

         {isSimulating && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-[100] flex items-center justify-center transition-all animate-in fade-in">
               <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl animate-spin-slow">
                     <Shield size={32} />
                  </div>
                  <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.5em]">Reconfiguring Perspective...</p>
               </div>
            </div>
         )}
      </main>
    </div>
  );
};

export default AdminDashboard;
