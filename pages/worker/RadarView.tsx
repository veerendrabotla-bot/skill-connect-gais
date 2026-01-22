
import React, { useState, useEffect } from 'react';
import { Job } from '../../types';
import { locationService } from '../../services/locationService';
import MapView from '../../components/MapView';
import { 
  Navigation, Power, Zap, MapPin, 
  Wallet, Star, Clock, AlertTriangle, Search,
  Radar as RadarIcon, ChevronRight, Activity, Sparkles
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
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      setPulseScale(s => s === 1 ? 1.1 : 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const mapMarkers = leads.map(l => ({
    id: l.id,
    lat: l.location.lat,
    lng: l.location.lng,
    title: `₹${l.price}`,
    icon: '🛠️'
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 page-transition">
      {/* Main Radar Display */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[650px] flex flex-col group">
          {!isOnline ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50/50">
              <div className="text-center space-y-8 p-10 max-w-md animate-in fade-in slide-in-from-bottom-5">
                 <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse"></div>
                    <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center text-gray-300 shadow-xl relative border-4 border-white">
                       <Power size={56} />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Beacon Suspended</h2>
                    <p className="text-gray-400 font-medium leading-relaxed uppercase text-xs tracking-widest">
                      Your spatial coordinates are currently hidden from the dispatcher node. Activate signal to receive leads.
                    </p>
                 </div>
                 <button 
                  onClick={() => setIsOnline(true)}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:bg-black transition-all active:scale-95"
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
                <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-gray-900 text-white">
                   <div className="relative">
                      <div className="absolute -inset-10 bg-indigo-500/20 rounded-full animate-ping"></div>
                      <Navigation size={48} className="text-indigo-400 animate-float" />
                   </div>
                   <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse">Acquiring Spatial Fix...</p>
                      <p className="text-xs text-gray-500 font-bold uppercase">Dispatcher Handshake in Progress</p>
                   </div>
                </div>
              )}
              
              {/* Tactical Discovery Overlay */}
              <div className="absolute top-8 left-8 z-[400] flex flex-col gap-3">
                 <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl border border-white flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping"></div>
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Radar Pulse: Active</span>
                 </div>
                 <div className="bg-indigo-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl border border-white/10 text-white flex items-center gap-4">
                    <Search size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Scanning 25km Sector</span>
                 </div>
              </div>

              {/* Discovery Deck (Scrollable Lead Stack) */}
              <div className="absolute bottom-8 left-8 right-8 z-[400] pointer-events-none">
                 <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar pointer-events-auto">
                    {leads.length > 0 ? leads.map(lead => {
                       const isPrimeMatch = (lead.metadata as any)?.candidate_count > 0;
                       return (
                         <div key={lead.id} className={`min-w-[320px] bg-white p-8 rounded-[3rem] border shadow-3xl animate-in slide-in-from-bottom-10 space-y-6 group/card relative overflow-hidden transition-all ${isPrimeMatch ? 'border-indigo-600 ring-2 ring-indigo-600/10' : 'border-gray-100'}`}>
                            {isPrimeMatch && (
                               <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1.5 rounded-bl-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
                                  <Sparkles size={10} className="animate-pulse" />
                                  <span className="text-[8px] font-black uppercase tracking-widest">Prime Match</span>
                               </div>
                            )}
                            
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-4">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-all duration-500 ${isPrimeMatch ? 'bg-indigo-600 text-white' : 'bg-gray-50 group-hover/card:bg-indigo-600 group-hover/card:text-white'}`}>
                                     🛠️
                                  </div>
                                  <div>
                                     <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm">Deployment Lead</h4>
                                     <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">
                                        {lead.distance ? `Dist: ${locationService.formatDistance(lead.distance)}` : 'Spatial Lock...'}
                                     </p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <span className="text-2xl font-black text-indigo-600 tracking-tighter">₹{lead.price}</span>
                                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Auth Yield</p>
                               </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 italic text-[10px] text-gray-500 font-bold line-clamp-1">
                               "{lead.description}"
                            </div>

                            <button 
                              onClick={() => onClaim(lead.id)}
                              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                              <Zap size={14} /> Accept Mission
                            </button>
                         </div>
                       );
                    }) : (
                       <div className="w-full bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-white text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Sector Clear • Monitoring Leads...</p>
                       </div>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: Performance & Fiscal Vault */}
      <div className="lg:col-span-4 space-y-10">
         <div className="bg-indigo-950 text-white p-12 rounded-[4rem] shadow-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10 space-y-10">
               <div className="flex justify-between items-center">
                  <div className="space-y-1">
                     <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Secure Vault</p>
                     <h3 className="text-5xl font-black tracking-tighter uppercase">Earnings</h3>
                  </div>
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Wallet size={24} className="text-indigo-300" />
                  </div>
               </div>
               
               <div className="space-y-1">
                  <h4 className="text-6xl font-black tracking-tighter">₹{workerStats?.wallet_balance?.toLocaleString() || '0'}</h4>
                  <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                     <Activity size={12} /> Live Settlement Active
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <button className="w-full bg-white text-indigo-950 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95">Initiate Payout</button>
                  <p className="text-[9px] text-indigo-400/60 text-center font-bold uppercase tracking-widest italic">Standard 24h auditing cycle applied.</p>
               </div>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs flex items-center gap-3">
                 <Star className="text-yellow-500 fill-yellow-500" size={20} />
                 Partner Rating
               </h3>
               <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase">Tier 1</span>
            </div>
            
            <div className="space-y-10">
               <div className="flex justify-between items-end border-b border-gray-50 pb-8">
                  <div className="space-y-1">
                     <p className="text-4xl font-black text-gray-900 tracking-tighter">{workerStats?.rating || '5.0'}</p>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Feedback</p>
                  </div>
                  <div className="flex gap-1 mb-2">
                     {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-yellow-500 text-yellow-500" />)}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-gray-400">Mission Success</span>
                     <span className="text-emerald-600">98.4%</span>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                     <div className="bg-emerald-500 h-full w-[98%] rounded-full shadow-lg"></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Missions</p>
                     <p className="text-xl font-black text-gray-900">{workerStats?.total_jobs || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RadarView;
