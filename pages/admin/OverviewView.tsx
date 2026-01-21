
import React, { useState, useEffect } from 'react';
import { auditService, AuditLog } from '../../services/auditService';
import { 
  Terminal, History, ExternalLink, 
  AlertTriangle, ShieldCheck, Zap, Loader2
} from 'lucide-react';

const OverviewView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await auditService.getRecentLogs(12);
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* Intelligence Pulse: System Audit Trail */}
      <div className="lg:col-span-8 space-y-8">
         <div className="bg-white p-10 sm:p-14 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Intelligence Pulse</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time mutation monitoring</p>
               </div>
               <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Live Stream</span>
               </div>
            </div>

            <div className="space-y-6">
               {loading ? (
                 <div className="py-20 flex flex-col items-center gap-4 text-gray-400">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Decrypting Ledger...</p>
                 </div>
               ) : logs.length > 0 ? logs.map(log => (
                 <div key={log.id} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-indigo-200 transition-all group cursor-default">
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                         log.action === 'INSERT' ? 'bg-green-500 shadow-green-100' : 
                         log.action === 'UPDATE' ? 'bg-blue-500 shadow-blue-100' : 
                         'bg-red-500 shadow-red-100'
                       }`}>
                          <Terminal size={24} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
                             {(log as any).actor?.full_name || 'System Auto'} 
                             <span className="text-gray-400 font-bold ml-2">modified {log.entity_type}</span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest font-mono">NODE_REF: #{log.entity_id.slice(0, 12)}</p>
                             <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                             <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</p>
                          </div>
                       </div>
                    </div>
                    <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-300 group-hover:text-indigo-600 group-hover:shadow-md transition-all">
                       <ExternalLink size={16} />
                    </button>
                 </div>
               )) : (
                 <div className="py-20 text-center text-gray-400">
                    <History size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Genesis Block: No system mutations detected</p>
                 </div>
               )}
            </div>

            <button className="w-full py-5 border-2 border-dashed border-gray-100 text-gray-400 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:border-indigo-600 hover:text-indigo-600 transition-all">
               Mount Full Audit Archive
            </button>
         </div>
      </div>

      {/* Sidebar: Sector Analysis */}
      <div className="lg:col-span-4 space-y-10">
         
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
            <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-3">
               <Zap size={18} className="text-indigo-600" /> Infrastructure Saturation
            </h4>
            <div className="space-y-8">
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">Worker Utilization</span>
                     <span className="text-indigo-600">82.4%</span>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                     <div className="bg-indigo-600 h-full w-[82%] rounded-full shadow-lg"></div>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">Escrow Liquidity</span>
                     <span className="text-green-600">Optimal</span>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                     <div className="bg-green-500 h-full w-[100%] rounded-full shadow-lg"></div>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-red-50 p-10 rounded-[3.5rem] border border-red-100 space-y-6">
            <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-widest">
               <AlertTriangle size={20} /> Anomaly Detection
            </div>
            <div className="space-y-4">
               <div className="bg-white p-5 rounded-2xl border border-red-50 shadow-sm">
                  <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Stuck Deployment Detected</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">NODE_ID: #ae821 • Status: IN_TRANSIT (4h+)</p>
               </div>
               <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-black transition-all">
                  Initialize Intervention
               </button>
            </div>
         </div>

         <div className="bg-indigo-900 text-white p-10 rounded-[3.5rem] shadow-3xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} />
               </div>
               <h4 className="text-lg font-black tracking-tight uppercase">Governance Note</h4>
            </div>
            <p className="text-xs text-indigo-300 font-medium leading-relaxed italic relative z-10">
               "All administrative actions are logged to the immutable ledger. Misuse of the intervention protocol will trigger an automatic security audit."
            </p>
         </div>

      </div>
    </div>
  );
};

export default OverviewView;
