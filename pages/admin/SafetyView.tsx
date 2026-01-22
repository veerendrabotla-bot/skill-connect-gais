
import React, { useState, useEffect } from 'react';
import { adminService, SOSAlert } from '../../services/adminService';
import MapView from '../../components/MapView';
import { 
  LifeBuoy, AlertTriangle, Phone, 
  MapPin, Clock, ShieldAlert,
  Loader2, RefreshCcw, Navigation,
  Activity, XCircle, CheckCircle2
} from 'lucide-react';

const SafetyView: React.FC = () => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);

  useEffect(() => {
    loadAlerts();
    const sub = adminService.subscribeToTable('sos_alerts', loadAlerts);
    return () => sub.unsubscribe();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getActiveSOS();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!window.confirm("Confirm SOS Resolution? Personnel must be verified safe.")) return;
    try {
      await adminService.updateSOSStatus(id, 'RESOLVED');
      loadAlerts();
      setSelectedAlert(null);
    } catch (err) {
      alert("Resolution protocol failed.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* Crisis Queue */}
      <div className="lg:col-span-4 space-y-8">
         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10 max-h-[800px] overflow-y-auto">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-red-600 uppercase tracking-tight">SOS Queue</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Life-Safety Alerts</p>
               </div>
               <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 animate-pulse">
                  <LifeBuoy size={20} />
               </div>
            </div>

            <div className="space-y-4">
               {loading && alerts.length === 0 ? (
                 <div className="py-10 text-center"><Loader2 className="animate-spin text-red-200 mx-auto" /></div>
               ) : alerts.length > 0 ? alerts.map(alert => (
                 <div 
                   key={alert.id} 
                   onClick={() => setSelectedAlert(alert)}
                   className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                     selectedAlert?.id === alert.id ? 'border-red-600 bg-red-50' : 'border-gray-50 bg-gray-50'
                   }`}
                 >
                    <div className="flex justify-between items-start mb-4">
                       <span className="px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded-lg animate-pulse">Critical</span>
                       <span className="text-[10px] text-gray-400 font-bold">{new Date(alert.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Node Alert: #{alert.job_id.slice(0, 8)}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-1">Personnel: Anonymous Worker</p>
                 </div>
               )) : (
                 <div className="py-20 text-center flex flex-col items-center gap-4">
                    <CheckCircle2 size={48} className="text-green-200" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Fleet Status: Secure</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Command Center View */}
      <div className="lg:col-span-8 space-y-10">
         {selectedAlert ? (
           <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
              <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-12">
                 <div className="flex flex-col md:flex-row justify-between gap-10">
                    <div className="space-y-4">
                       <h2 className="text-4xl font-black text-red-600 tracking-tighter uppercase">Crisis Deployment</h2>
                       <div className="flex items-center gap-3 text-gray-500 font-bold text-lg">
                          <MapPin size={24} className="text-red-500" />
                          <span>Sector Coordinates: {selectedAlert.location_lat.toFixed(4)}, {selectedAlert.location_lng.toFixed(4)}</span>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3">
                          <Phone size={18} /> Call Personnel
                       </button>
                    </div>
                 </div>

                 <div className="h-[400px] rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative">
                    <MapView 
                      center={{ lat: selectedAlert.location_lat, lng: selectedAlert.location_lng }}
                      zoom={17}
                      className="h-full w-full"
                    />
                    <div className="absolute inset-0 bg-red-600/5 pointer-events-none animate-pulse"></div>
                 </div>

                 <div className="flex gap-6">
                    <button 
                      onClick={() => handleResolve(selectedAlert.id)}
                      className="flex-1 py-6 bg-green-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                    >
                       <CheckCircle2 size={18} /> Resolve Alert
                    </button>
                    <button className="flex-1 py-6 border-2 border-red-100 text-red-600 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-3">
                       <ShieldAlert size={18} /> Signal Authorities
                    </button>
                 </div>
              </div>
           </div>
         ) : (
           <div className="bg-white rounded-[4rem] border-4 border-dashed border-gray-100 h-[600px] flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                 <div className="absolute -inset-10 bg-indigo-50 rounded-full animate-ping"></div>
                 <Activity size={80} className="text-gray-100 relative" />
              </div>
              <div className="text-center space-y-2">
                 <h4 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Tactical Monitor Standby</h4>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Select an active SOS alert to begin resolution protocol.</p>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default SafetyView;
