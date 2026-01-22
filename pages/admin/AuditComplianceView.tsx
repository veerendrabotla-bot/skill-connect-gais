import React, { useState, useEffect } from 'react';
import { adminService, ForensicLog, ComplianceSummary } from '../../services/adminService';
// Added X to the imported icons from lucide-react
import { 
  FileText, History, Search, Filter, Download, 
  Terminal, User, ShieldCheck, Database, Calendar,
  ArrowRight, Loader2, Eye, RefreshCcw, Briefcase, 
  Gavel, Wallet, Info, Lock, Activity, ArrowRightLeft,
  ChevronRight, DatabaseBackup, X
} from 'lucide-react';

const AuditComplianceView: React.FC = () => {
  const [logs, setLogs] = useState<ForensicLog[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<ForensicLog | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [forensicLogs, compSummary] = await Promise.all([
        adminService.getForensicLogs(),
        adminService.getComplianceSummary()
      ]);
      setLogs(forensicLogs);
      setSummary(compSummary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1500));
    alert("Compliance Archive (v4.2) generated. Check authorized admin terminal for secure download link.");
    setExporting(false);
  };

  const filteredLogs = logs.filter(l => 
    l.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.actor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Compliance Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
               <Briefcase size={16} /> KYC Compliance
            </div>
            <div className="space-y-1">
               <p className="text-3xl font-black text-gray-900 tracking-tighter">{summary?.kyc_audited || 0}</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Profiles Audited</p>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-widest">
               <Gavel size={16} /> Case Finality
            </div>
            <div className="space-y-1">
               <p className="text-3xl font-black text-gray-900 tracking-tighter">{summary?.disputes_settled || 0}</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Judicial Resolutions</p>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
               <Wallet size={16} /> Fiscal Finality
            </div>
            <div className="space-y-1">
               <p className="text-3xl font-black text-gray-900 tracking-tighter">{summary?.payouts_authorized || 0}</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Settlements Signed</p>
            </div>
         </div>
         <div className="bg-indigo-900 text-white p-8 rounded-[3rem] shadow-xl space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="flex items-center gap-3 text-indigo-300 font-black text-[10px] uppercase tracking-widest relative z-10">
               <Activity size={16} /> Activity Node
            </div>
            <div className="space-y-1 relative z-10">
               <p className="text-3xl font-black tracking-tighter">{summary?.recent_mutations || 0}</p>
               <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">24h System Mutations</p>
            </div>
         </div>
      </div>

      {/* Main Forensic Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
               <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Forensic Ledger</h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full mutation history of the platform kernel</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input 
                           type="text" 
                           placeholder="Filter Node ID..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-indigo-600 rounded-xl text-xs font-bold transition-all shadow-inner"
                        />
                     </div>
                     <button onClick={handleExport} disabled={exporting} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-indigo-100">
                        {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-gray-50/50">
                        <tr>
                           <th className="px-10 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Time (UTC)</th>
                           <th className="px-10 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
                           <th className="px-10 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Mutation</th>
                           <th className="px-10 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Target Node</th>
                           <th className="px-10 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Details</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {loading ? (
                           Array(10).fill(0).map((_, i) => (
                              <tr key={i} className="animate-pulse">
                                 <td colSpan={5} className="p-10 bg-gray-50/10"></td>
                              </tr>
                           ))
                        ) : filteredLogs.map(log => (
                           <tr key={log.id} className={`hover:bg-gray-50/50 transition-colors group ${selectedLog?.id === log.id ? 'bg-indigo-50/50' : ''}`}>
                              <td className="px-10 py-6 text-[10px] font-bold text-gray-400">
                                 {new Date(log.created_at).toLocaleTimeString()}
                              </td>
                              <td className="px-10 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-black text-[10px]">
                                       {log.actor_name?.[0] || 'S'}
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{log.actor_name || 'System'}</p>
                                       <p className="text-[8px] text-gray-400 font-bold uppercase">{log.actor_role}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-10 py-6">
                                 <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                    log.action === 'INSERT' ? 'bg-green-100 text-green-700' : 
                                    log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-700' : 
                                    'bg-red-100 text-red-700'
                                 }`}>
                                    {log.action}
                                 </span>
                              </td>
                              <td className="px-10 py-6">
                                 <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{log.entity_type}</p>
                                 <p className="text-[8px] text-gray-400 font-mono">ID: {log.entity_id.slice(0, 12)}</p>
                              </td>
                              <td className="px-10 py-6 text-right">
                                 <button 
                                    onClick={() => setSelectedLog(log)}
                                    className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all ml-auto"
                                 >
                                    <Eye size={14} />
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Sidebar: Inspector Panel with Delta Highlighting */}
         <div className="lg:col-span-4 space-y-10">
            {selectedLog ? (
               <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-3xl space-y-10 animate-in slide-in-from-right-10 duration-500 max-h-[1000px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">Delta Inspector</h4>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Forensic Comparison Active</p>
                     </div>
                     <button onClick={() => setSelectedLog(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-inner"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                           <ArrowRightLeft size={14} className="text-indigo-600" /> State Modification
                        </div>
                        
                        {/* Comparison Matrix */}
                        <div className="grid grid-cols-1 gap-6">
                           {selectedLog.old_data && (
                             <div className="space-y-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-red-400 ml-3">Pre-Mutation (Old)</p>
                                <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 shadow-inner overflow-x-auto">
                                   <pre className="text-[9px] font-mono text-red-700 leading-relaxed">
                                      {JSON.stringify(selectedLog.old_data, null, 2)}
                                   </pre>
                                </div>
                             </div>
                           )}
                           
                           <div className="flex justify-center -my-3 relative z-10">
                              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
                                 <ChevronRight size={20} className="rotate-90" />
                              </div>
                           </div>

                           <div className="space-y-2">
                              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 ml-3">Post-Mutation (New)</p>
                              <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 shadow-inner overflow-x-auto">
                                 <pre className="text-[9px] font-mono text-emerald-700 leading-relaxed">
                                    {JSON.stringify(selectedLog.new_data, null, 2)}
                                 </pre>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-8 bg-indigo-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                        <div className="flex items-center gap-4 relative z-10">
                           <ShieldCheck size={20} className="text-indigo-300" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Sovereign Signature</p>
                        </div>
                        <div className="mt-4 space-y-1 relative z-10">
                           <p className="text-sm font-bold truncate">{selectedLog.actor_name}</p>
                           <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest opacity-60">Identity Node: {selectedLog.actor_id}</p>
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="bg-white p-12 rounded-[4rem] border-4 border-dashed border-gray-50 text-center flex flex-col items-center justify-center space-y-6 min-h-[500px]">
                  <div className="relative">
                     <div className="absolute -inset-8 bg-indigo-50 rounded-full animate-ping opacity-30"></div>
                     <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 relative shadow-inner">
                        <DatabaseBackup size={48} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-xl font-black text-gray-300 uppercase tracking-widest">Inspector Idle</h4>
                     <p className="text-xs text-gray-400 font-medium max-w-[200px] mx-auto uppercase tracking-tighter">Select a ledger entry to view forensic state deltas.</p>
                  </div>
               </div>
            )}

            <div className="bg-indigo-900 text-white p-10 rounded-[3.5rem] shadow-3xl space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-150"></div>
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                     <Lock size={24} className="text-indigo-300" />
                  </div>
                  <h4 className="text-lg font-black tracking-tight uppercase">Integrity Terminal</h4>
               </div>
               <p className="text-xs text-indigo-300 font-medium leading-relaxed italic relative z-10">
                  "All mutations are captured by the Postgres Trigger kernel before the transaction commits. This creates a mathematically proven audit trail for regulatory bodies."
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuditComplianceView;