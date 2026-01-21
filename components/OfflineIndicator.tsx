
import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, Loader2 } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100 animate-in fade-in slide-in-from-right-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Kernel Synced</span>
      </div>
    );
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5">
      <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-red-500/20 backdrop-blur-md">
        <WifiOff size={16} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">Node Offline • Reconnecting to Mesh...</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
