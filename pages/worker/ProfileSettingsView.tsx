
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { SERVICE_CATEGORIES } from '../../constants';
import { 
  User, Phone, ShieldCheck, BadgeCheck, Star, 
  Briefcase, Wrench, Save, Loader2, Camera, 
  MapPin, AlertTriangle, ChevronRight, Info
} from 'lucide-react';

const ProfileSettingsView: React.FC = () => {
  const { user, workerStats, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    skills: workerStats?.skills || []
  });

  const handleToggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill) 
        : [...prev.skills, skill]
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await workerService.updateProfile(user.id, formData);
      await refreshProfile();
      alert("Professional Identity Synced Successfully.");
    } catch (err) {
      alert("Profile update failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5">
      
      {/* Profile Header Card */}
      <div className="bg-white p-10 sm:p-14 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-10">
         <div className="relative group">
            <div className="w-40 h-40 bg-gray-100 rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl relative">
               <img src={user?.avatar || `https://picsum.photos/seed/${user?.id}/400`} alt="Avatar" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={32} />
               </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-green-500 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
               <ShieldCheck size={28} />
            </div>
         </div>
         
         <div className="text-center lg:text-left flex-1 space-y-4">
            <div className="space-y-1">
               <h2 className="text-5xl font-black text-gray-900 tracking-tighter">{user?.name}</h2>
               <p className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center lg:justify-start gap-2">
                 <BadgeCheck size={14} className="text-blue-600" /> Professional Node • Tier 1 Specialist
               </p>
            </div>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
               <div className="px-5 py-2 bg-yellow-50 rounded-xl text-yellow-700 font-black text-xs flex items-center gap-2 border border-yellow-100">
                  <Star size={14} className="fill-yellow-400" /> {workerStats?.rating || '5.0'} Rating
               </div>
               <div className="px-5 py-2 bg-blue-50 rounded-xl text-blue-700 font-black text-xs flex items-center gap-2 border border-blue-100">
                  <Briefcase size={14} /> {workerStats?.total_jobs || 0} Missions
               </div>
               <div className="px-5 py-2 bg-green-50 rounded-xl text-green-700 font-black text-xs flex items-center gap-2 border border-green-100">
                  <ShieldCheck size={14} /> Identity Verified
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Identity Editor */}
         <div className="lg:col-span-7 space-y-10">
            <div className="bg-white p-10 sm:p-14 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Identity Hub</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol: PII_MGMT_V4</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Legal Label</label>
                     <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                           type="text"
                           value={formData.fullName}
                           onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                           className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-3xl font-bold text-gray-900 outline-none transition-all shadow-inner"
                        />
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Phone</label>
                     <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                           type="text"
                           value={formData.phone}
                           onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-3xl font-bold text-gray-900 outline-none transition-all shadow-inner"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between ml-1">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Skill Matrix Coverage</label>
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{formData.skills.length} Specializations Active</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {SERVICE_CATEGORIES.map(cat => (
                        <button 
                           key={cat.id}
                           onClick={() => handleToggleSkill(cat.name)}
                           className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${
                              formData.skills.includes(cat.name) 
                              ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-50/50' 
                              : 'border-gray-50 bg-gray-50 hover:bg-white'
                           }`}
                        >
                           <span className="text-3xl">{cat.icon}</span>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${formData.skills.includes(cat.name) ? 'text-blue-600' : 'text-gray-400'}`}>{cat.name}</span>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="pt-6">
                  <button 
                     disabled={loading}
                     onClick={handleSave}
                     className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95"
                  >
                     {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                     {loading ? 'Syncing...' : 'Authorize Updates'}
                  </button>
               </div>
            </div>
         </div>

         {/* Sidebar Panels */}
         <div className="lg:col-span-5 space-y-10">
            <div className="bg-indigo-900 text-white p-10 sm:p-12 rounded-[4rem] shadow-3xl space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="space-y-2">
                  <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.4em]">Service Area Protocol</p>
                  <h4 className="text-3xl font-black tracking-tight">Geographic Radius</h4>
               </div>
               <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                           <MapPin size={24} />
                        </div>
                        <div>
                           <p className="font-bold text-lg">Central Zone</p>
                           <p className="text-xs text-indigo-300 uppercase font-black">25km Active Sector</p>
                        </div>
                     </div>
                     <ChevronRight className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="flex items-start gap-4 p-4">
                     <Info className="text-indigo-300 shrink-0" size={20} />
                     <p className="text-[10px] text-indigo-200 font-medium leading-relaxed uppercase tracking-tight">
                        Your radar pulse is currently locked to your GPS fix. Adjusting your service area requires tier 2 verification.
                     </p>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 sm:p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
               <div className="flex items-center gap-4 text-red-600 font-black text-[10px] uppercase tracking-widest">
                  <AlertTriangle size={18} /> Governance & Security
               </div>
               <div className="space-y-6">
                  <div className="flex justify-between items-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                     <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Status</span>
                     <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase tracking-widest">Optimal Standing</span>
                  </div>
                  <button className="w-full py-5 border-2 border-gray-100 text-gray-700 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-all shadow-sm">
                     Security Terminal
                  </button>
                  <button className="w-full py-5 border-2 border-gray-100 text-gray-700 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-all shadow-sm">
                     Request Credentials Audit
                  </button>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default ProfileSettingsView;
