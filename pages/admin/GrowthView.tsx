
import React, { useState, useEffect } from 'react';
import { adminService, Promotion } from '../../services/adminService';
import { 
  TrendingUp, Tag, Plus, Calendar, 
  Trash2, Search, Loader2, Sparkles,
  Zap, Users, Star, Gift
} from 'lucide-react';

const GrowthView: React.FC = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', percent: 10, expiry: '' });

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPromotions();
      setPromos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newPromo.code || !newPromo.expiry) return;
    try {
      await adminService.createPromotion(newPromo.code, newPromo.percent, newPromo.expiry);
      loadPromos();
      setShowAdd(false);
    } catch (err) {
      alert("Promotion protocol failure.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* Promotion Engine */}
      <div className="lg:col-span-8 space-y-8">
         <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Growth Terminal</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Promotion & Discount Management</p>
               </div>
               <button 
                 onClick={() => setShowAdd(true)}
                 className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
               >
                 <Plus size={14} /> New Campaign
               </button>
            </div>

            {showAdd && (
              <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 space-y-6 animate-in zoom-in">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Auth Code</label>
                       <input 
                         type="text" 
                         value={newPromo.code}
                         onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                         placeholder="SAVE50"
                         className="w-full px-5 py-3 rounded-xl border border-indigo-200 outline-none focus:border-indigo-600 font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Yield Cut (%)</label>
                       <input 
                         type="number" 
                         value={newPromo.percent}
                         onChange={(e) => setNewPromo({...newPromo, percent: parseInt(e.target.value)})}
                         className="w-full px-5 py-3 rounded-xl border border-indigo-200 outline-none focus:border-indigo-600 font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Cycle</label>
                       <input 
                         type="date" 
                         value={newPromo.expiry}
                         onChange={(e) => setNewPromo({...newPromo, expiry: e.target.value})}
                         className="w-full px-5 py-3 rounded-xl border border-indigo-200 outline-none focus:border-indigo-600 font-bold"
                       />
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={handleAdd} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase">Commit Campaign</button>
                    <button onClick={() => setShowAdd(false)} className="px-6 py-3 text-gray-400 font-black text-[10px] uppercase">Abort</button>
                 </div>
              </div>
            )}

            <div className="space-y-4">
               {loading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-200" size={32} /></div>
               ) : promos.length > 0 ? promos.map(p => (
                 <div key={p.id} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                          <Tag size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-gray-900 tracking-tight">{p.code}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">-{p.discount_percent}% Yield</span>
                             <span className="text-[10px] text-gray-400 font-bold uppercase">Used: {p.used_count}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Expires</p>
                       <p className="text-[10px] font-black text-gray-900">{new Date(p.expires_at).toLocaleDateString()}</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">No Active Campaigns</div>
               )}
            </div>
         </div>
      </div>

      {/* CRM Insights */}
      <div className="lg:col-span-4 space-y-10">
         <div className="bg-indigo-900 text-white p-10 rounded-[3.5rem] shadow-3xl space-y-10">
            <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-3">
               <Gift size={18} className="text-indigo-400" /> Retention Pulse
            </h4>
            <div className="space-y-8">
               <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <Users size={24} />
                  </div>
                  <div>
                     <p className="text-2xl font-black tracking-tighter">1,204</p>
                     <p className="text-[9px] text-indigo-300 font-black uppercase">VIP Customers</p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <Star size={24} />
                  </div>
                  <div>
                     <p className="text-2xl font-black tracking-tighter">14%</p>
                     <p className="text-[9px] text-indigo-300 font-black uppercase">Referral Conversion</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
               <TrendingUp size={20} /> Revenue Prediction
            </div>
            <p className="text-xs text-gray-400 leading-relaxed italic">
               "Current growth trajectory suggests a 12.5% yield increase in the next settlement cycle based on campaign SAVE50."
            </p>
         </div>
      </div>
    </div>
  );
};

export default GrowthView;
