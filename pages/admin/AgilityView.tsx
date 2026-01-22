
import React, { useState, useEffect } from 'react';
import { jobService } from '../../services/jobService';
import { adminService } from '../../services/adminService';
import { ServiceCategory } from '../../types';
import { 
  Settings, Wrench, Edit3, Save, 
  X, LayoutGrid, CheckCircle2, 
  RefreshCcw, Loader2, EyeOff, Eye, Plus
} from 'lucide-react';

const AgilityView: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await jobService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setIsSyncing(true);
    try {
      await adminService.updateCategory(editing.id, { 
        name: editing.name, 
        basePrice: editing.basePrice 
      });
      await loadCategories();
      setEditing(null);
    } catch (err) {
      alert("Agility sync failure.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* Category Manager */}
      <div className="lg:col-span-8 space-y-8">
         <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Content Hub</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dynamic Service & Schema Control</p>
               </div>
               <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-6 py-2 border-2 border-indigo-600 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">
                    <Plus size={14} /> New Routine
                  </button>
                  <button onClick={loadCategories} className="p-3 bg-gray-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {loading && categories.length === 0 ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse"></div>
                  ))
               ) : categories.map(cat => (
                 <div key={cat.id} className="p-8 bg-white border border-gray-100 rounded-[2.5rem] hover:border-indigo-200 transition-all flex items-center justify-between group shadow-sm hover:shadow-lg">
                    <div className="flex items-center gap-6">
                       <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{cat.icon}</span>
                       <div>
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{cat.name}</p>
                          <p className="text-[10px] text-indigo-500 font-black uppercase">Base Protocol: ₹{cat.basePrice}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setEditing(cat)}
                      className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-xl transition-all"
                    >
                       <Edit3 size={18} />
                    </button>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Editor Sidebar */}
      <div className="lg:col-span-4">
         {editing ? (
           <div className="bg-white p-10 rounded-[4rem] border border-indigo-100 shadow-3xl space-y-10 animate-in slide-in-from-right-10 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between relative z-10">
                 <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Modify Node</h4>
                 <button onClick={() => setEditing(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Routine Label</label>
                    <input 
                      type="text" 
                      value={editing.name}
                      onChange={(e) => setEditing({...editing, name: e.target.value})}
                      className="w-full px-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold text-gray-900 shadow-inner transition-all"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Base Rate (INR)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300">₹</span>
                       <input 
                         type="number" 
                         value={editing.basePrice}
                         onChange={(e) => setEditing({...editing, basePrice: parseInt(e.target.value)})}
                         className="w-full pl-12 pr-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-indigo-600 outline-none font-black text-2xl text-gray-900 shadow-inner transition-all"
                       />
                    </div>
                 </div>
                 
                 <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                       <LayoutGrid size={14} /> Propagation Alert
                    </p>
                    <p className="text-[9px] text-blue-500 font-bold leading-relaxed uppercase">Updates to the pricing matrix are pushed to the global dispatcher node instantly.</p>
                 </div>

                 <button 
                   onClick={handleSave}
                   disabled={isSyncing}
                   className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-3xl shadow-indigo-100 hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
                 >
                    {isSyncing ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                    {isSyncing ? 'Syncing Schema...' : 'Commit Changes'}
                 </button>
              </div>
           </div>
         ) : (
           <div className="bg-indigo-950 text-white p-12 rounded-[4.5rem] shadow-3xl space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="flex items-center gap-5 relative z-10">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                    <Settings size={32} className="text-indigo-400" />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black tracking-tight uppercase">Agility Terminal</h4>
                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.3em]">Kernel Logic Control</p>
                 </div>
              </div>
              <div className="space-y-6 relative z-10">
                 <p className="text-sm text-indigo-200 font-medium leading-relaxed italic">
                    "This interface manages the live schema of your marketplace. You can add routines, adjust pricing tiers, or toggle sector categories without a code deployment."
                 </p>
                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-indigo-400">
                       <span>Schema Status</span>
                       <span className="text-emerald-400">Locked & Stable</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="bg-emerald-400 h-full w-full"></div>
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default AgilityView;
