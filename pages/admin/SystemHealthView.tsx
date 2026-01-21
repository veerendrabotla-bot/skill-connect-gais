
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { 
  Activity, Database, Globe, 
  ShieldCheck, AlertTriangle, Clock, RefreshCcw,
  Loader2, Cpu, HardDrive, Wifi
} from 'lucide-react';

const SystemHealthView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await adminService.getHealthLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ComponentCard = ({ name, icon: Icon, status, latency }: any) => (
    <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8 hover:shadow-xl transition-all group">
       <div className="flex justify-between items-start">
          <div className="w-16 h-16 bg-gray-50 rounded-[1.8rem] flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
             <Icon size={32} />
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
            status === 'OPTIMAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
             {status}
          </div>
       </div>
       <div className="space-y-2">
          <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{name}</h4>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Clock size={12} /> {latency}ms Latency
             </div>
          </div>
       </div>
       <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${status === 'OPTIMAL' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: '100%' }}></div>
       </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Infrastructure Core Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
         <ComponentCard name="Database Cluster" icon={Database} status="OPTIMAL" latency={12} />
         <ComponentCard name="Auth Protocol" icon={ShieldCheck} status="OPTIMAL" latency={42} />
         <ComponentCard name="Edge Network" icon={Globe} status="OPTIMAL" latency={8} />
         <ComponentCard name="AI Inference" icon={Cpu} status="OPTIMAL" latency={1204} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Heartbeat Logs */}
         <div className="lg:col-span-8 bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Activity className="text-indigo-600" size={24} />
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Platform Heartbeat</h3>
               </div>
               <button onClick={loadHealth} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
               </button>
            </div>
            
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                     <tr>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Component</th>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ping</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {loading ? (
                        <tr>
                           <td colSpan={4} className="p-20 text-center">
                              <Loader2 className="animate-spin text-gray-200 mx-auto" size={48} />
                           </td>
                        </tr>
                     ) : logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-10 py-6 text-xs font-bold text-gray-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                           <td className="px-10 py-6 font-black text-gray-900 uppercase text-xs tracking-wider">{log.component}</td>
                           <td className="px-10 py-6">
                              <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 log.status === 'OPTIMAL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                 {log.status}
                              </span>
                           </td>
                           <td className="px-10 py-6 text-right font-bold text-gray-900 text-xs">{log.latency_ms}ms</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Resource Monitor */}
         <div className="lg:col-span-4 space-y-10">
            <div className="bg-indigo-900 text-white p-12 rounded-[4rem] shadow-3xl space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="space-y-2 relative z-10">
                  <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.4em]">Kernel Metrics</p>
                  <h4 className="text-3xl font-black tracking-tight">Resource Utilization</h4>
               </div>
               <div className="space-y-8 relative z-10">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <HardDrive size={24} />
                     </div>
                     <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                           <span>Disk Storage</span>
                           <span>1.2TB / 5.0TB</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className="bg-white h-full w-[24%] rounded-full"></div>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Wifi size={24} />
                     </div>
                     <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                           <span>Network Throughput</span>
                           <span>428 Mbps</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className="bg-emerald-400 h-full w-[65%] rounded-full"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
               <div className="flex items-center gap-4 text-orange-600 font-black text-[10px] uppercase tracking-widest">
                  <AlertTriangle size={20} /> Infrastructure Alerting
               </div>
               <p className="text-xs text-gray-500 font-medium leading-relaxed uppercase tracking-tight">
                  Thresholds for critical alerts are configured in the platform control group. Automated failover is enabled for the database cluster.
               </p>
               <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                  Configure Alerts
               </button>
            </div>
         </div>

      </div>
    </div>
  );
};

export default SystemHealthView;
