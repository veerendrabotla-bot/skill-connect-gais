
import React, { useState, useRef, useEffect } from 'react';
import { ServiceCategory, ServiceType } from '../../types';
import { 
  X, Zap, MapPin, Navigation, Loader2, CheckCircle2, 
  Info, Sparkles, ShieldEllipsis, ArrowRight, Calculator,
  Camera, ImageIcon, RefreshCcw, AlertTriangle, ChevronRight,
  Tag, Ticket, Mic, Square, Volume2, ShieldAlert
} from 'lucide-react';
import { locationService } from '../../services/locationService';
import { jobService } from '../../services/jobService';
import { diagnoseServiceIssue, analyzeIssueImage, diagnoseAudioIssue } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';

interface Props {
  category: ServiceCategory;
  onClose: () => void;
  onSuccess: () => void;
}

type BookingStep = 'SERVICE' | 'LOCATION' | 'DETAILS' | 'REVIEW';

const BookingWizard: React.FC<Props> = ({ category, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<BookingStep>('SERVICE');
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [description, setDescription] = useState('');
  
  // Promotion State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Audio Triage State
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isAudioAnalyzing, setIsAudioAnalyzing] = useState(false);
  
  // AI Feature State
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) setAudioChunks(prev => [...prev, e.data]);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await handleAudioAnalysis(base64);
        };
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied. Required for Neural Voice Triage.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      audioStream?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleAudioAnalysis = async (base64: string) => {
    setIsAudioAnalyzing(true);
    try {
      const result = await diagnoseAudioIssue(base64, category.name);
      if (result) {
        setDiagnosis(result);
        setDescription(result.transcription || description);
        setShowAiPanel(true);
        if (category.serviceTypes) {
           const match = category.serviceTypes.find(st => 
              st.name.toLowerCase().includes(result.suggestedService?.toLowerCase() || '')
           );
           if (match) setServiceType(match);
        }
      }
    } catch (err) {
      console.error("Audio Analysis Failed", err);
    } finally {
      setIsAudioAnalyzing(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode || !user) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const promo = await jobService.applyPromotion(promoCode, user.id);
      setAppliedPromo(promo);
    } catch (err: any) {
      setPromoError(err.message || "Invalid Protocol.");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setVisionImage(base64);
      setShowAiPanel(true);
      
      setIsVisionScanning(true);
      try {
        const aiResult = await analyzeIssueImage(base64, category.name);
        if (aiResult) {
          setDiagnosis(aiResult);
          if (!description) {
             setDescription(`[AI Diagnostic]: ${aiResult.diagnosis}`);
          }
          if (category.serviceTypes) {
            const match = category.serviceTypes.find(st => 
              st.name.toLowerCase().includes(aiResult.suggestedService?.toLowerCase() || '')
            );
            if (match && !serviceType) setServiceType(match);
          }
        }
      } catch (err) {
        console.error("AI Feature unavailable.");
      } finally {
        setIsVisionScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDetectLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await locationService.getCurrentPosition();
      setCoords(pos);
      setAddress("Verified Current Location");
    } finally {
      setIsLocating(false);
    }
  };

  const handleManualDiagnose = async () => {
    if (!description || description.length < 10) return;
    setIsDiagnosing(true);
    try {
      const result = await diagnoseServiceIssue(description, category.name);
      setDiagnosis(result);
      setShowAiPanel(true);
    } catch (err) {
      console.error("AI Diagnosis Error", err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const calculateTotal = () => {
     const base = serviceType?.basePrice || category.basePrice;
     const tax = Math.round(base * 0.18);
     const fee = 49;
     let total = base + tax + fee;
     
     if (appliedPromo) {
        const discount = Math.min((base * appliedPromo.discount_percent) / 100, appliedPromo.max_discount || Infinity);
        total -= discount;
     }
     
     return Math.round(total);
  };

  const executeBooking = async () => {
    if (!user || !coords) return;
    setIsBooking(true);
    try {
      const finalPrice = calculateTotal();
      const fullDesc = serviceType ? `[${serviceType.name}] ${description}` : description;
      
      await jobService.createJob(
        user.id, 
        category.id, 
        fullDesc, 
        finalPrice, 
        address, 
        coords.lat, 
        coords.lng
      );
      onSuccess();
    } catch (err) {
      alert("Deployment system offline.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 max-h-[95vh] flex flex-col">
        
        <div className="h-2 bg-gray-100 w-full shrink-0 flex">
          {(['SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'] as BookingStep[]).map((s, i) => {
            const steps = ['SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'];
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
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
                  {step} • Step {['SERVICE', 'LOCATION', 'DETAILS', 'REVIEW'].indexOf(step) + 1} of 4
                </p>
              </div>
           </div>
           <button onClick={onClose} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-all"><X size={20} /></button>
        </div>

        <div className="p-10 sm:p-14 overflow-y-auto flex-1">
          
          {step === 'SERVICE' && (
            <div className="space-y-10 animate-in slide-in-from-right-10">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-gray-900 flex items-center gap-3">
                      <Zap className="text-indigo-600" size={20} /> Select Routine
                    </h4>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                    >
                      <Camera size={16} /> AI Vision
                      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageCapture} />
                    </button>
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm ${
                        isRecording 
                        ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                        : 'bg-indigo-900 text-white border-indigo-800 hover:bg-black'
                      }`}
                    >
                      {isRecording ? <Square size={16} /> : <Mic size={16} />}
                      {isRecording ? 'Capturing...' : 'Neural Voice Link'}
                    </button>
                  </div>
               </div>

               {(isRecording || isAudioAnalyzing) && (
                 <div className="bg-indigo-950 text-white p-12 rounded-[3.5rem] flex flex-col items-center justify-center space-y-8 animate-in zoom-in">
                    <div className="flex items-center gap-4">
                       {[1,2,3,4,5].map(i => (
                         <div key={i} className={`w-1.5 bg-indigo-400 rounded-full transition-all duration-150 ${isRecording ? 'animate-bounce h-12' : 'h-2 opacity-20'}`} style={{animationDelay: `${i * 0.1}s`}}></div>
                       ))}
                    </div>
                    <div className="text-center">
                       <p className="text-xs font-black uppercase tracking-[0.4em] text-indigo-300">
                          {isRecording ? 'Handshaking with Neural Node...' : 'Analyzing Voice Pattern...'}
                       </p>
                       <p className="text-[10px] font-bold text-indigo-500 mt-2 italic">"Speak naturally about the failure event"</p>
                    </div>
                    {isRecording && (
                       <button onClick={stopRecording} className="px-8 py-3 bg-white text-indigo-900 rounded-xl font-black text-[10px] uppercase tracking-widest">Seal Transmission</button>
                    )}
                 </div>
               )}

               {showAiPanel && diagnosis && (
                 <div className="bg-indigo-950 text-white p-8 rounded-[3.5rem] space-y-4 animate-in zoom-in border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center justify-between relative z-10">
                       <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                         <Sparkles size={12} className="animate-pulse"/> Node Inference Report
                       </span>
                       <button onClick={() => setShowAiPanel(false)} className="text-indigo-400 hover:text-white transition-all"><X size={14}/></button>
                    </div>
                    <div className="space-y-4 relative z-10">
                       <p className="text-lg font-bold leading-relaxed">"{diagnosis.diagnosis || diagnosis.transcription}"</p>
                       {diagnosis.toolsNeeded && (
                          <div className="flex flex-wrap gap-2 pt-2">
                             {diagnosis.toolsNeeded.map((t: string) => (
                               <span key={t} className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">{t}</span>
                             ))}
                          </div>
                       )}
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                       <span className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.3em]">AI Advisory Node v4.2</span>
                       <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Confidence: {Math.round((diagnosis.confidence || 0.9) * 100)}%</span>
                       </div>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.serviceTypes?.map(st => {
                    const isSuggested = diagnosis?.suggestedService?.toLowerCase().includes(st.name.toLowerCase());
                    return (
                      <button
                        key={st.id}
                        onClick={() => { setServiceType(st); setStep('LOCATION'); }}
                        className={`flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all text-left relative group ${
                          serviceType?.id === st.id ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200'
                        }`}
                      >
                        {isSuggested && (
                           <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-xl">AI Pick</div>
                        )}
                        <div className="space-y-2">
                           <h5 className="font-black text-gray-900 text-xl tracking-tight">{st.name}</h5>
                           <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><RefreshCcw size={10} /> {st.avgDuration} Cycle</span>
                        </div>
                        <p className="text-2xl font-black text-indigo-600 tracking-tighter">₹{st.basePrice}</p>
                      </button>
                    );
                  })}
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
                      placeholder="Street, Block, Landmark..."
                      className="w-full pl-8 pr-32 py-7 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-3xl font-bold text-gray-900 outline-none shadow-inner"
                    />
                    <button 
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 flex items-center gap-2 shadow-lg hover:bg-indigo-50 transition-all"
                    >
                      {isLocating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                      GPS Fix
                    </button>
                  </div>
               </div>
               {coords && (
                 <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 flex items-center gap-6 text-emerald-700 animate-in zoom-in">
                    <CheckCircle2 size={32} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em]">Geo-Lock Finalized</p>
                      <p className="text-sm font-bold opacity-70">Spatial Sector Verified</p>
                    </div>
                 </div>
               )}
               <button 
                disabled={!address || !coords}
                onClick={() => setStep('DETAILS')}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all hover:bg-black"
               >Lock Position & Proceed</button>
            </div>
          )}

          {step === 'DETAILS' && (
            <div className="space-y-10 animate-in slide-in-from-right-10">
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h4 className="text-xl font-black text-gray-900 flex items-center gap-3"><Info className="text-indigo-600" size={20} /> Mission Manifest</h4>
                     {!diagnosis && description.length > 20 && (
                        <button onClick={handleManualDiagnose} disabled={isDiagnosing} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase hover:underline">
                           {isDiagnosing ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                           Consult AI Advisor
                        </button>
                     )}
                  </div>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the failure in plain language..."
                    rows={6}
                    className="w-full p-10 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[3.5rem] font-bold text-gray-900 outline-none resize-none shadow-inner"
                  />
               </div>
               
               {diagnosis && (
                  <div className="bg-indigo-950 text-white p-10 rounded-[3.5rem] space-y-4 animate-in zoom-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                    <p className="text-[10px] text-indigo-300 font-black uppercase flex items-center gap-2"><ShieldEllipsis size={14}/> Node Inference</p>
                    <p className="text-xl font-bold leading-relaxed">"{diagnosis.diagnosis}"</p>
                    <div className="pt-4 border-t border-white/5 space-y-2">
                       <p className="text-[8px] text-indigo-400 font-black uppercase">Preparation Required:</p>
                       <div className="flex flex-wrap gap-2">
                          {(diagnosis.toolsNeeded || diagnosis.tools || []).map((t: string) => (
                            <span key={t} className="px-2 py-1 bg-white/5 rounded text-[8px] font-black uppercase tracking-widest text-indigo-100">{t}</span>
                          ))}
                       </div>
                    </div>
                  </div>
               )}

               <button 
                disabled={description.length < 10}
                onClick={() => setStep('REVIEW')}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl disabled:opacity-30 hover:bg-black transition-all"
               >Compile Review Summary</button>
            </div>
          )}

          {step === 'REVIEW' && (
            <div className="space-y-10 animate-in slide-in-from-right-10">
               <div className="bg-gray-50 p-12 rounded-[4rem] space-y-10 border border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-200 pb-10 gap-10">
                     <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-4 text-xs font-black text-indigo-600 uppercase tracking-widest bg-white px-4 py-2 rounded-xl w-fit shadow-sm border border-indigo-50">
                           <CheckCircle2 size={16} /> Secure Escrow Payload
                        </div>
                        
                        <div className="pt-4 space-y-3">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Marketing Protocol (Optional)</label>
                           <div className="flex gap-3">
                              <div className="relative flex-1">
                                 <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                 <input 
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="Enter Code..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-600 text-xs font-bold transition-all"
                                 />
                              </div>
                              <button 
                                 onClick={handleApplyPromo}
                                 disabled={applyingPromo || !promoCode || appliedPromo}
                                 className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-black transition-all disabled:opacity-30"
                              >
                                 {applyingPromo ? <Loader2 className="animate-spin" size={14} /> : 'Apply'}
                              </button>
                           </div>
                           {appliedPromo && (
                              <div className="flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase animate-in slide-in-from-left-2">
                                 <Tag size={12} /> Protocol Applied: {appliedPromo.discount_percent}% Yield Cut
                              </div>
                           )}
                           {promoError && <p className="text-red-500 font-black text-[9px] uppercase ml-1">{promoError}</p>}
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Auth Amount</p>
                        <p className="text-6xl font-black text-gray-900 tracking-tighter">₹{calculateTotal()}</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase mt-2 italic">Incl. GST + Node Fee {appliedPromo && '(-Promo Applied)'}</p>
                     </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-200 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">
                           {category.icon}
                        </div>
                        <div>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Selected Protocol</p>
                           <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{serviceType?.name || category.name}</p>
                        </div>
                     </div>
                     <p className="text-indigo-600 font-black text-xl">₹{serviceType?.basePrice || category.basePrice}</p>
                  </div>

                  {diagnosis && (
                    <div className="flex items-start gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                       <ShieldAlert className="text-indigo-600 shrink-0" size={20} />
                       <p className="text-[10px] text-indigo-900 font-bold uppercase leading-relaxed tracking-tight">
                          AI Advisory: Diagnostic inference attached to mission manifest. Professional technician will verify requirements upon sector arrival.
                       </p>
                    </div>
                  )}
               </div>

               <button 
                onClick={executeBooking}
                disabled={isBooking}
                className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-3xl shadow-3xl hover:bg-black transition-all flex items-center justify-center gap-6 active:scale-95"
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
