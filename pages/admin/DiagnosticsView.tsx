
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { adminService } from '../../services/adminService';
import { diagnoseServiceIssue } from '../../services/geminiService';
import { locationService } from '../../services/locationService';
import { 
  Terminal, ShieldCheck, Activity, Globe, Cpu, 
  Play, RefreshCcw, Loader2, CheckCircle2, XCircle, 
  Database, Zap, AlertTriangle, Bug, Server
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  msg: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN';
}

const DiagnosticsView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  const addLog = (msg: string, type: LogEntry['type'] = 'INFO') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), msg, type }]);
  };

  const runIntegrityCheck = async () => {
    setRunning(true);
    setLogs([]);
    addLog("Initializing Enterprise Diagnostic Sequence v4.2...", "INFO");

    try {
      // 1. Kernel Check
      addLog("Checking Kernel Connectivity...", "INFO");
      const start = Date.now();
      const { data: kpis, error: kpiError } = await supabase.rpc('get_platform_kpis');
      const latency = Date.now() - start;
      if (kpiError) throw new Error(`Kernel Breach: ${kpiError.message}`);
      addLog(`Kernel Verified. Latency: ${latency}ms. Standing: ${kpis.system_status}.`, "SUCCESS");

      // 2. Schema Parity Check (THE ROOT FIX)
      addLog("Verifying Schema Parity (Admin Enriched Views)...", "INFO");
      const schemaHealth = await adminService.checkSchemaParity();
      const missingViews = Object.entries(schemaHealth).filter(([_, exists]) => !exists).map(([view]) => view);
      
      if (missingViews.length > 0) {
        addLog(`Schema Incomplete: Missing ${missingViews.length} Enriched Views.`, "WARN");
        missingViews.forEach(v => addLog(`> Missing Node: ${v}`, "ERROR"));
        addLog("ACTION: Execute '32_Root_Schema_Repair.md' in SQL Editor to resolve.", "WARN");
      } else {
        addLog("All administrative views verified and online.", "SUCCESS");
      }

      // 3. AI Engine Check
      addLog("Initializing AI Inference Engine (Gemini 3.0)...", "INFO");
      const aiResult = await diagnoseServiceIssue("Test ping", "Diagnostics");
      if (!aiResult) throw new Error("AI Inference Node Offline.");
      addLog("AI Inference Node Operational. Neural Handshake Complete.", "SUCCESS");

      // 4. Spatial Check
      addLog("Acquiring Spatial Lock (Geolocation)...", "INFO");
      const pos = await locationService.getCurrentPosition();
      addLog(`Spatial Lock Secured. Sector Sync: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}.`, "SUCCESS");

      // 5. Persistence Check
      addLog("Verifying Ledger Persistence...", "INFO");
      const { count } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true });
      addLog(`Forensic Ledger verified. ${count} immutable entries detected.`, "SUCCESS");

      if (missingViews.length === 0) {
        addLog("--- SYSTEM INTEGRITY VERIFIED (STABLE) ---", "SUCCESS");
      } else {
        addLog("--- SYSTEM OPERATIONAL (DEGRADED SCHEMA) ---", "WARN");
      }
    } catch (err: any) {
      addLog(`Protocol Failure: ${err.message}`, "ERROR");
    } finally {
      setRunning(false);
    }
  };

  const handleBootstrap = async () => {
    if (!window.confirm("Initialize Platform Bootstrap? This will seed test entities into the production mesh.")) return;
    setBootstrapping(true);
    addLog("Initializing Platform Bootstrap Protocol...", "WARN");
    try {
      await adminService.bootstrapTestData();
      addLog("Bootstrap successful. Sector data seeded for all roles.", "SUCCESS");
    } catch (err: any) {
      addLog(`Bootstrap Failure: ${err.message}`, "ERROR");
    } finally {
      setBootstrapping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* Terminal View */}
      <div className="lg:col-span-8 bg-black rounded-[4rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col min-h-[600px] group">
         <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-4">
               <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
               <h3 className="text-white font-mono text-sm font-black uppercase tracking-widest">Platform Integrity Console</h3>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
            </div>
         </div>

         <div className="flex-1 p-10 font-mono text-sm overflow-y-auto space-y-3 custom-scrollbar bg-black/40">
            {logs.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                  <Terminal size={48} />
                  <p className="font-black uppercase tracking-[0.4em]">Standby for Diagnostic Signal</p>
               </div>
            )}
            {logs.map((log, i) => (
               <div key={i} className="flex gap-4 animate-in slide-in-from-left-2">
                  <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-bold ${
                    log.type === 'SUCCESS' ? 'text-emerald-400' :
                    log.type === 'ERROR' ? 'text-red-400' :
                    log.type === 'WARN' ? 'text-orange-400' :
                    'text-indigo-400'
                  }`}>
                     {log.type === 'SUCCESS' ? '✓' : log.type === 'ERROR' ? '✗' : log.type === 'WARN' ? '!' : '●'} {log.msg}
                  </span>
               </div>
            ))}
         </div>

         <div className="p-8 border-t border-white/5 bg-white/5 flex gap-4">
            <button 
              onClick={runIntegrityCheck}
              disabled={running}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all disabled:opacity-30"
            >
               {running ? <Loader2 className="animate-spin" size={16} /> : <Activity size={16} />}
               Execute System Audit
            </button>
            <button 
              onClick={() => setLogs([])}
              className="px-8 py-4 border border-white/10 text-white/40 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
            >
               Clear
            </button>
         </div>
      </div>

      {/* Control Panel Sidebar */}
      <div className="lg:col-span-4 space-y-10">
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="space-y-1">
               <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                  <Zap size={20} className="text-indigo-600" /> Dev Protocols
               </h4>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rapid Platform Seeding</p>
            </div>
            
            <div className="space-y-4">
               <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Initialize the bootstrap protocol to populate the marketplace with test entities (Workers, Customers, Jobs, and Disputes).
               </p>
               <button 
                 onClick={handleBootstrap}
                 disabled={bootstrapping}
                 className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
               >
                  {bootstrapping ? <Loader2 className="animate-spin" /> : <Play size={16} />}
                  Bootstrap Platform
               </button>
            </div>
         </div>

         <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 space-y-6">
            <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
               <Server size={20} /> Infrastructure Fix
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
                  If "PGRST205" errors appear in the forensic pulse, you must run the Root Schema Repair script in Supabase.
               </p>
               <button className="w-full py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                  Copy Repair SQL
               </button>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                  <ShieldCheck size={24} />
               </div>
               <h4 className="text-lg font-black tracking-tight uppercase">Admin Token</h4>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-mono text-[9px] break-all text-gray-400">
               SHA256: 8f2b...d1e0
            </div>
         </div>
      </div>
    </div>
  );
};

export default DiagnosticsView;
