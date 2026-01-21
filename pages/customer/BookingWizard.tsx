
import React, { useState, useRef } from 'react';
import { ServiceCategory, ServiceType } from '../../types';
// Added RefreshCcw to the imports
import { 
  X, Zap, MapPin, Navigation, Loader2, CheckCircle2, 
  Info, Sparkles, ShieldEllipsis, ArrowRight, Calculator,
  Camera, Upload, ImageIcon, Trash2, AlertCircle, RefreshCcw
} from 'lucide-react';
import { locationService } from '../../services/locationService';
import { jobService } from '../../services/jobService';
import { diagnoseServiceIssue, analyzeIssueImage } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  category: ServiceCategory;
  onClose: () => void;
  onSuccess: () => void;
}

type BookingStep = 'VISION' | 'SERVICE' | 'LOCATION' | 'DETAILS' | 'REVIEW';

const BookingWizard: React.FC<Props> = ({ category, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<BookingStep>('VISION');
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [description, setDescription] = useState('');
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setVisionImage(base64);
      
      // Automatic Vision Triage
      setIsVisionScanning(true);
      const aiResult = await analyzeIssueImage(base64, category.name);
      if (aiResult) {
        setDescription(`[AI Vision Triage] ${aiResult.diagnosis}`);
        // Try to auto-match service type
        if (category.serviceTypes) {
           const match = category.serviceTypes.find(st => 
             st.name.toLowerCase().includes(aiResult.suggestedService?.toLowerCase() || '')
           );
           if (match) setServiceType(match);
        }
        setDiagnosis(aiResult);
      }
      setIsVisionScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await locationService.getCurrentPosition();
      setCoords(pos);
      setAddress("Detected Current Location");
    } finally {
      setIsLocating(false);
    }
  };

  // Added handleDiagnose implementation
  const handleDiagnose = async () => {
    if (!description || !category) return;
    setIsDiagnosing(true);
    try {
      const result = await diagnoseServiceIssue(description, category.name);
      setDiagnosis(result);
    } catch (err) {
      console.error("Diagnosis failed", err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const executeBooking = async () => {
    if (!user || !coords) return;
    setIsBooking(true);
    try {
      const basePrice = serviceType?.basePrice || category.basePrice;
      const finalPrice = basePrice + (basePrice * 0.18) + 49;
      const fullDesc = serviceType ? `[${serviceType.name}] ${description}` : description;
      await jobService.createJob(user.id, category.id, fullDesc, finalPrice, address, coords.lat, coords.lng);
      onSuccess();
    } catch (err) {
      alert("Booking system unavailable.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[95vh] flex flex-col">
        
        <div className="h-2 bg-gray-100 w-full shrink-0 flex">
          {(['VISION', 'SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'] as BookingStep[]).map((s, i) => {
            const steps = ['VISION', 'SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'];
            const currentIndex = steps.indexOf(step);
            return (
              <div key={s} className={`flex-1 transition-all duration-1000 ${i <= currentIndex ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
            );
          })}
        </div>

        <div className="p-8 sm:p-12 border-b border-gray-50 flex justify-between items-center shrink-0 bg-gray-50/50">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-xl">
                {category.icon}
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{category.name}</h3>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Protocol Step {['VISION', 'SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'].indexOf(step) + 1}</p>
              </div>
           </div>
           <button onClick={onClose} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100"><X size={20} /></button>
        </div>

        <div className="p-10 sm:p-14 overflow-y-auto flex-1">
          
          {step === 'VISION' && (
            <div className="space-y-10 animate-in slide-in-from-right-10">
               <div className="space-y-4">
                  <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><Sparkles className="text-indigo-600" size={20} /> AI Visual Triage</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Capture a photo of the fault. SkillConnect's Gemini Vision engine will analyze the pattern to provide a more accurate briefing for our technicians.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-square md:aspect-video rounded-[3rem] border-4 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group overflow-hidden"
                  >
                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageCapture} />
                    
                    {visionImage ? (
                      <>
                        <img src={visionImage} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <RefreshCcw className="text-white" size={32} />
                        </div>
                        {isVisionScanning && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-900/60 backdrop-blur-sm animate-pulse">
                             <Loader2 className="animate-spin text-white mb-4" size={48} />
                             <span className="text-white font-black text-[10px] uppercase tracking-[0.4em]">Gemini Analyzing...</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-xl group-hover:scale-110 transition-transform">
                          <Camera size={36} />
                        </div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Capture or Upload Node Image</p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col justify-center space-y-6">
                     {diagnosis ? (
                        <div className="bg-indigo-950 text-white p-8 rounded-[3rem] space-y-4 shadow-2xl animate-in zoom-in">
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">AI Observation</span>
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${
                                 diagnosis.urgency === 'CRITICAL' || diagnosis.urgency === 'HIGH' ? 'bg-red-500' : 'bg-emerald-500'
                              }`}>{diagnosis.urgency}</span>
                           </div>
                           <p className="text-lg font-bold leading-relaxed">{diagnosis.diagnosis}</p>
                           <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-indigo-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Contextual Match Identified</span>
                           </div>
                        </div>
                     ) : (
                        <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 flex items-center gap-6">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm">
                              <ImageIcon size={24} />
                           </div>
                           <p className="text-xs font-medium text-gray-400 leading-relaxed uppercase tracking-tight">
                              Visual diagnostics improve matching accuracy by 40%. Highly recommended for complex infrastructure issues.
                           </p>
                        </div>
                     )}
                     <button 
                      onClick={() => setStep('SERVICE')}
                      className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                     >
                       Proceed to Routines
                     </button>
                  </div>
               </div>
            </div>
          )}

          {step === 'SERVICE' && (
            <div className="space-y-8 animate-in slide-in-from-right-10">
               <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><Zap className="text-indigo-600" size={20} /> Select Sub-Routine</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.serviceTypes?.map(st => (
                    <button
                      key={st.id}
                      onClick={() => { setServiceType(st); setStep('LOCATION'); }}
                      className={`flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all text-left ${serviceType?.id === st.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-gray-50 hover:bg-white'}`}
                    >
                      <div className="space-y-2">
                         <h5 className="font-black text-gray-900 text-lg">{st.name}</h5>
                         <span className="text-[10px] font-black uppercase text-gray-400">{st.avgDuration} Cycle</span>
                      </div>
                      <p className="text-xl font-black text-indigo-600">₹{st.basePrice}</p>
                    </button>
                  ))}
               </div>
            </div>
          )}

          {step === 'LOCATION' && (
            <div className="space-y-10 animate-in slide-in-from-right-10">
               <div className="space-y-4">
                  <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><MapPin className="text-indigo-600" size={20} /> Deployment Coordinates</h4>
                  <div className="relative">
                    <input 
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Search for landmark..."
                      className="w-full pl-8 pr-32 py-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-3xl font-bold text-gray-900 outline-none shadow-inner"
                    />
                    <button 
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-indigo-600 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 flex items-center gap-2 shadow-sm"
                    >
                      {isLocating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                      GPS Fix
                    </button>
                  </div>
               </div>
               {coords && (
                 <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-4 text-emerald-700">
                    <CheckCircle2 size={24} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Geo-Lock Verified</p>
                      <p className="text-sm font-bold">Latency Adjusted Position Recorded</p>
                    </div>
                 </div>
               )}
               <button 
                disabled={!address || !coords}
                onClick={() => setStep('DETAILS')}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all hover:bg-indigo-700"
               >Lock Position & Proceed</button>
            </div>
          )}

          {step === 'DETAILS' && (
            <div className="space-y-8 animate-in slide-in-from-right-10">
               <div className="space-y-4">
                  <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><Info className="text-indigo-600" size={20} /> Manifest Details</h4>
                  <div className="relative">
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail the issue for the automated triage..."
                      rows={5}
                      className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[3rem] font-bold text-gray-900 outline-none resize-none shadow-inner"
                    />
                    {diagnosis && (
                      <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-indigo-200">
                         <Sparkles size={10} /> Gemini Enhanced
                      </div>
                    )}
                  </div>
               </div>
               {description.length > 10 && !diagnosis && (
                  <button onClick={handleDiagnose} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
                    {isDiagnosing ? <Loader2 className="animate-spin" /> : <Sparkles />} Gemini Diagnostic Engine
                  </button>
               )}
               <button 
                disabled={description.length < 5}
                onClick={() => setStep('REVIEW')}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 hover:bg-indigo-700 transition-all"
               >Review Summary</button>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="space-y-10 animate-in slide-in-from-right-10">
               <div className="bg-gray-50 p-10 rounded-[3.5rem] space-y-8 border border-gray-100 shadow-inner">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-8">
                     <div className="flex items-center gap-4 text-xs font-black text-indigo-600 uppercase tracking-widest">
                        <CheckCircle2 size={16} /> Pre-Authorized Payload
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Net Rate</p>
                        <p className="text-4xl font-black text-gray-900 tracking-tighter">₹{(serviceType?.basePrice || category.basePrice) + 49}</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Selected Sub-Routine</p>
                           <p className="font-black text-gray-900">{serviceType?.name || category.name}</p>
                        </div>
                        <ArrowRight className="text-gray-200" />
                     </div>
                  </div>
               </div>
               <button 
                onClick={executeBooking}
                disabled={isBooking}
                className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95"
               >
                 {isBooking ? <Loader2 className="animate-spin" /> : <Calculator />} Initialize Deployment
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
