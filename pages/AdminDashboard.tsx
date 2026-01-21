
import React, { useState, useEffect } from 'react';
import { Job, JobStatus, User } from '../types';
import { STATUS_COLORS, SERVICE_CATEGORIES } from '../constants';
import { verifyWorkerDocument } from '../services/geminiService';
import { auditService, AuditLog } from '../services/auditService';
import { Shield, Activity, Users, AlertCircle, Search, Filter, Eye, CheckCircle, XCircle, Loader2, Sparkles, History, Terminal } from 'lucide-react';

interface Props {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const AdminDashboard: React.FC<Props> = ({ jobs, setJobs }) => {
  const [activeView, setActiveView] = useState<'overview' | 'workers' | 'jobs' | 'logs'>('overview');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [systemLogs, setSystemLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeView === 'overview' || activeView === 'logs') {
      loadLogs();
    }
  }, [activeView]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await auditService.getRecentLogs(10);
      setSystemLogs(logs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const pendingApps = [
    { id: 'app1', name: 'James Wilson', skill: 'Plumbing', docs: 'Experienced plumber with 5 years in residential repairs. Certified by State Board.' },
    { id: 'app2', name: 'Sarah Lee', skill: 'Cleaning', docs: 'Specialist in eco-friendly deep cleaning. Previously worked with premium cleaning agencies.' },
  ];

  const handleVerifyApp = async (text: string) => {
    setVerifying(true);
    const result = await verifyWorkerDocument(text);
    setVerificationResult(result);
    setVerifying(false);
  };

  const StatsCard = ({ title, value, color, icon: Icon }: any) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Platform OS</h1>
          <p className="text-gray-500 font-medium">Real-time governance and automated audit trails.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          {(['overview', 'workers', 'jobs', 'logs'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                activeView === view ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Live Pipeline" value={jobs.filter(j => j.status !== JobStatus.PAID && j.status !== JobStatus.CANCELLED).length} color="bg-blue-600" icon={Activity} />
            <StatsCard title="KYC Pending" value={pendingApps.length} color="bg-indigo-600" icon={Shield} />
            <StatsCard title="On-Duty Fleet" value="482" color="bg-green-600" icon={Users} />
            <StatsCard title="System Alerts" value="0" color="bg-red-600" icon={AlertCircle} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={18} className="text-indigo-600" />
                  System Audit Trail
                </h3>
                <button onClick={loadLogs} className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">
                  Refresh
                </button>
              </div>
              
              <div className="space-y-4">
                {loadingLogs ? (
                  <div className="py-20 flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="animate-spin" />
                    <span className="text-xs font-bold uppercase">Decrypting Logs...</span>
                  </div>
                ) : systemLogs.length > 0 ? (
                  systemLogs.map(log => (
                    <div key={log.id} className="group p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black ${
                            log.action === 'INSERT' ? 'bg-green-500' : log.action === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'
                          }`}>
                            {log.action[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">
                              {(log as any).actor?.full_name || 'System Auto'} 
                              <span className="text-gray-400 font-medium ml-2">modified {log.entity_type}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Entity ID: {log.entity_id.slice(0, 12)}...</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-gray-300 uppercase">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-gray-400 italic">No automated logs recorded yet.</p>
                )}
              </div>
            </div>

            <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <Shield size={20} />
                KYC Verification
              </h3>
              <div className="space-y-4">
                {pendingApps.map(app => (
                  <div key={app.id} className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-4 backdrop-blur-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-white">{app.name}</h4>
                        <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">{app.skill}</p>
                      </div>
                      <button 
                        onClick={() => handleVerifyApp(app.docs)}
                        className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all"
                        title="AI Analyze"
                      >
                        {verifying ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      </button>
                    </div>
                    {verificationResult && (
                      <div className="bg-white/10 p-3 rounded-xl border border-white/5 text-[10px]">
                         <p className="font-black text-indigo-200 mb-1 uppercase tracking-widest">AI Result: {verificationResult.confidenceScore}%</p>
                         <p className="text-white/70 line-clamp-2">{verificationResult.analysis}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-white text-indigo-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50">Approve</button>
                      <button className="flex-1 py-2 bg-red-500/20 text-red-200 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500/30">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Logs View (Expanded Audit) */}
      {activeView === 'logs' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-2xl tracking-tighter uppercase">Full System Logs</h3>
              <button onClick={loadLogs} className="flex items-center gap-2 px-6 py-2 bg-gray-50 rounded-xl font-black text-xs uppercase tracking-widest text-gray-600 hover:bg-gray-100">
                <History size={14} /> Sync History
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actor</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Entity</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Change Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {systemLogs.map(log => (
                    <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-8 py-5 text-xs font-bold text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-[10px]">
                            {(log as any).actor?.full_name?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900">{(log as any).actor?.full_name || 'System'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{(log as any).actor?.email || 'automated@skillconnect.os'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          log.action === 'INSERT' ? 'bg-green-100 text-green-700' : 
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-black text-gray-900 uppercase tracking-wider">{log.entity_type}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {log.entity_id.slice(0, 8)}</p>
                      </td>
                      <td className="px-8 py-5 max-w-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <span className="text-[10px] text-gray-500 font-bold truncate">
                             {log.action === 'UPDATE' 
                               ? `Field modifications detected in ${Object.keys(log.new_data || {}).length} columns`
                               : `Complete record ${log.action.toLowerCase()}d into kernel.`
                             }
                           </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
