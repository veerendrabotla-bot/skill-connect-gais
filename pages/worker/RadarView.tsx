
import React from 'react';
import { Job } from '../../types';
import { locationService } from '../../services/locationService';
import MapView from '../../components/MapView';
import { 
  Navigation, Power, Zap, MapPin, 
  Wallet, Star, Clock, AlertTriangle 
} from 'lucide-react';

interface Props {
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  leads: Job[];
  userLocation: {lat: number, lng: number} | null;
  onClaim: (jobId: string) => Promise<void>;
  workerStats: any;
  userAvatar?: string;
}

const RadarView: React.FC<Props> = ({ 
  isOnline, 
  setIsOnline, 
  leads, 
  userLocation, 
  onClaim,
  workerStats,
  userAvatar
}) => {
  const mapMarkers = leads.map(l => ({
    id: l.id,
    lat: l.location.lat,
    lng: l.location.lng,
    title: `₹${l.price} - ${l.description.slice(0, 20)}...`,
    icon: '🛠️'
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Main Radar Display */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[600px] flex flex-col transition-all duration-700">
          {!isOnline ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6 p-10 max-w-md animate-in fade-in slide-in-from-bottom-5">
                 <div className="w-28 h-28 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto text-gray-300 shadow-inner">
                    <Power size={48} />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Radar Suspended</h2>
                 <p className="text-gray-500 font-medium leading-relaxed">
                   Your geolocation beacon is currently disabled. Activate the signal to start receiving high-priority leads in your sector.
                 </p>
                 <button 
                  onClick={() => setIsOnline(true)}
                  className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-black transition-all"
                 >
                   Initialize Signal
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative flex flex-col">
              {userLocation ? (
                <MapView 
                   center={userLocation}
                   markers={mapMarkers}
                   radarRadius={25000}
                   onMarkerClick={onClaim}
                   className="flex-1"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
                   <Navigation size={48} className="text-indigo-600 animate-float" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Acquiring Spatial Beacon...</p>
                </div>
              )}
              
              {/* Floating Discovery Deck (Bottom Mobile / Side Desktop) */}
              <div className="absolute bottom-6 left-6 right-6 z-[400] pointer-events-none">
                 <div className="max-w-md mx-auto space-y-3 pointer-events-auto">
                    {leads.length > 0 && (
                       <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl animate-in slide-in-from-bottom-10">
                          <div className="flex justify-between items-start mb-6">
                             <div>
                                <h4 className="font-black text-gray-900 uppercase tracking-tight">Lead Discovered</h4>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Nearest Node Detected</p>
                             </div>
                             <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{leads[0].price}</span>
                          </div>
                          <button 
                            onClick={() => onClaim(leads[0].id)}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3"
                          >
                            <Zap size={14} /> Accept Deployment
                          </button>
                       </div>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Stats */}
      <div className="lg:col-span-4 space-y-10">
         <div className="bg-indigo-900 text-white p-12 rounded-[4rem] shadow-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10 space-y-8">
               <div className="flex justify-between items-start">
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em]">Vault Balance</p>
                  <Wallet size={20} className="text-indigo-400" />
               </div>
               <h3 className="text-5xl font-black tracking-tighter">₹{workerStats?.wallet_balance || '0.00'}</h3>
               <div className="flex flex-col gap-4">
                  <button className="w-full bg-white text-indigo-900 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95">Withdraw Protocol</button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-indigo-300 font-bold uppercase tracking-widest">
                     <Clock size={12} /> Cycle Reset: 24h
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-2">
                 <Star className="text-yellow-400 fill-yellow-400" size={18} />
                 Performance Core
               </h3>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Index</span>
            </div>
            <div className="space-y-8">
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">Completion KPI</span>
                     <span className="text-green-600">98.4%</span>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                     <div className="bg-green-500 h-full w-[98%] rounded-full shadow-lg"></div>
                  </div>
               </div>
               <div className="flex justify-between items-center border-t border-gray-50 pt-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Feedback</span>
                     <span className="text-3xl font-black text-gray-900 tracking-tighter">{workerStats?.rating || '5.0'}</span>
                  </div>
                  <div className="flex gap-1">
                     {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RadarView;