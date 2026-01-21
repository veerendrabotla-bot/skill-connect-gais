
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { SERVICE_CATEGORIES } from '../../constants';
import { WorkerApplication } from '../../types';
import { 
  ShieldCheck, Loader2, CheckCircle2, XCircle, 
  Clock, ArrowRight, FileText, BadgeCheck, 
  Briefcase, Wrench, AlertTriangle, RefreshCcw 
} from 'lucide-react';

const WorkerOnboarding: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<WorkerApplication | null>(null);

  // Form State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [step, setStep] = useState<'WELCOME' | 'SKILLS' | 'EXPERIENCE'>('WELCOME');

  useEffect(() => {
    loadApplication();
  }, [user]);

  const loadApplication = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const app = await workerService.getMyApplication(user.id);
      setApplication(app);
    } catch (err) {
      console.error("Failed to load application status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    if (!user || selectedSkills.length === 0 || !summary) return;
    setSubmitting(true);
    try {
      await workerService.submitApplication(user.id, selectedSkills, summary);
      await loadApplication();
    } catch (err) {
      alert("Application submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Querying Onboarding Node</p>
      </div>
    );
  }

  // Application in Review
  if (application && application.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6">
        <div className="bg-white rounded-[4rem] p-16 shadow-2xl border border-gray-100 text-center space-y-10 animate-in zoom-in duration-500">
           <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
              <Clock size={56} className="animate-pulse" />
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Audit in Progress</h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">
                Your professional profile is currently being reviewed by our governance team. We typically finalize audits within 24-48 hours.
              </p>
           </div>
           <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-400">
                 <span>Identity Verification</span>
                 <span className="text-indigo-600">Complete</span>
              </div>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden shadow-sm">
                 <div className="bg-indigo-600 h-full w-[65%] rounded-full"></div>
              </div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase text-left">Professional Background Check Pending...</p>
           </div>
           <button 
             onClick={loadApplication}
             className="flex items-center justify-center gap-3 w-full py-5 bg-gray-900 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
           >
             <RefreshCcw size={16} /> Sync Status
           </button>
        </div>
      </div>
    );
  }

  // Application Rejected
  if (application && application.status === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6">
        <div className="bg-white rounded-[4rem] p-16 shadow-2xl border border-red-50 text-center space-y-10 animate-in slide-in-from-bottom-5">
           <div className="w-32 h-32 bg-red-50 rounded-[3rem] flex items-center justify-center mx-auto text-red-600">
              <XCircle size={56} />
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Action Required</h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">
                Our governance audit detected discrepancies in your submission.
              </p>
           </div>
           <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 text-left space-y-4">
              <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-widest">
                 <AlertTriangle size={18} /> Governance Feedback
              </div>
              <p className="text-red-800 font-bold leading-relaxed italic">
                "{application.admin_reason || 'Insufficient professional documentation provided.'}"
              </p>
           </div>
           <button 
             onClick={() => setApplication(null)}
             className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3"
           >
             <RefreshCcw size={20} /> Restart Onboarding
           </button>
        </div>
      </div>
    );
  }

  // Standard Onboarding Steps
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-[4rem] shadow-3xl border border-gray-100 overflow-hidden animate-in fade-in duration-700">
        
        {/* Header Progress */}
        <div className="bg-blue-600 p-12 text-white flex justify-between items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3 px-3 py-1 bg-white/20 rounded-lg text-white font-black text-[10px] uppercase tracking-widest border border-white/10 w-fit">
                <ShieldCheck size={14} /> Partner Gateway
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">Elite Onboarding</h1>
              <p className="text-blue-100 font-medium text-sm">Level 1: Professional Verification Protocol</p>
           </div>
           <div className="relative z-10 flex gap-2">
              {(['WELCOME', 'SKILLS', 'EXPERIENCE'] as const).map((s, idx) => (
                <div key={s} className={`w-3 h-3 rounded-full ${step === s ? 'bg-white scale-125' : 'bg-white/30'} transition-all`} />
              ))}
           </div>
        </div>

        <div className="p-12 sm:p-20">
          
          {step === 'WELCOME' && (
            <div className="space-y-12 animate-in slide-in-from-right-10">
               <div className="space-y-6">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">The Future of Skilled Labor</h2>
                  <p className="text-gray-500 font-medium text-lg leading-relaxed">
                    SkillConnect is an enterprise-grade service ecosystem. To maintain quality across our mesh, all partners undergo a rigorous professional audit.
                  </p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-4">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <BadgeCheck size={24} />
                     </div>
                     <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Certified Leads</h3>
                     <p className="text-sm text-gray-400 font-medium">Access high-value infrastructure projects in real-time.</p>
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-4">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                        <Briefcase size={24} />
                     </div>
                     <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Instant Settlement</h3>
                     <p className="text-sm text-gray-400 font-medium">Automated ledger payments with instant bank withdrawal.</p>
                  </div>
               </div>
               <button 
                onClick={() => setStep('SKILLS')}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-4 group"
               >
                 Initialize Protocol <ArrowRight className="group-hover:translate-x-2 transition-transform" />
               </button>
            </div>
          )}

          {step === 'SKILLS' && (
            <div className="space-y-12 animate-in slide-in-from-right-10">
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                     <Wrench size={18} /> Skill Matrix Selection
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Define Your Expertise</h2>
                  <p className="text-gray-500 font-medium">Select the specialized service categories you are certified to deploy.</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {SERVICE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleToggleSkill(cat.name)}
                      className={`p-10 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 ${
                        selectedSkills.includes(cat.name) 
                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-50/50' 
                        : 'border-gray-50 bg-gray-50 hover:bg-white'
                      }`}
                    >
                       <span className="text-5xl">{cat.icon}</span>
                       <span className={`font-black uppercase tracking-widest text-[10px] ${selectedSkills.includes(cat.name) ? 'text-blue-600' : 'text-gray-400'}`}>{cat.name}</span>
                    </button>
                  ))}
               </div>

               <button 
                disabled={selectedSkills.length === 0}
                onClick={() => setStep('EXPERIENCE')}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-4 group disabled:opacity-30"
               >
                 Review Skillsets <ArrowRight className="group-hover:translate-x-2 transition-transform" />
               </button>
            </div>
          )}

          {step === 'EXPERIENCE' && (
            <div className="space-y-12 animate-in slide-in-from-right-10">
               <div className="space-y-6">
                  <div className="flex items-center gap-3 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                     <FileText size={18} /> Professional Manifest
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Audit Documentation</h2>
                  <p className="text-gray-500 font-medium">Provide a concise summary of your professional background and certifications.</p>
               </div>

               <textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ex: 5 years experience in commercial plumbing, certified by Delhi Skills Board. Specialist in high-pressure systems..."
                rows={6}
                className="w-full p-10 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-[3.5rem] font-bold text-gray-900 outline-none resize-none transition-all placeholder:text-gray-300 shadow-inner"
               />

               <div className="bg-yellow-50 p-8 rounded-[2.5rem] border border-yellow-100 flex items-start gap-4">
                  <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
                  <p className="text-sm font-medium text-yellow-800 leading-relaxed">
                     By submitting, you authorize SkillConnect to perform professional background verification and audit your submitted manifests.
                  </p>
               </div>

               <button 
                disabled={submitting || summary.length < 50}
                onClick={handleSubmit}
                className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] shadow-2xl shadow-blue-100 hover:bg-black transition-all flex items-center justify-center gap-4 group disabled:opacity-30"
               >
                 {submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />}
                 {submitting ? 'Authenticating...' : 'Submit Audit Request'}
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default WorkerOnboarding;
