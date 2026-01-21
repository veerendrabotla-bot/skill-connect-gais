
import React, { useState, useEffect } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { 
  X, Bell, CheckCircle2, AlertTriangle, 
  Info, Clock, Trash2, ShieldCheck, 
  Zap, Loader2, ArrowRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

const NotificationCenter: React.FC<Props> = ({ isOpen, onClose, onUnreadCountChange }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    // Subscribe to real-time events
    const subscription = notificationService.subscribeToNotifications(user.id, (newNotif) => {
      setNotifications(prev => [newNotif as Notification, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    onUnreadCountChange(unreadCount);
  }, [notifications]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    setIsMarkingAll(true);
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                 <Bell size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Signal Feed</h3>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Platform Events</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
              <X size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-300">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Feed</span>
             </div>
           ) : notifications.length > 0 ? (
             notifications.map(notif => (
               <div 
                key={notif.id} 
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative group ${
                  notif.read 
                  ? 'bg-white border-gray-100 opacity-60' 
                  : 'bg-white border-indigo-100 shadow-xl shadow-indigo-50/50 scale-[1.02]'
                }`}
               >
                  {!notif.read && (
                    <div className="absolute top-6 right-6 w-2 h-2 bg-indigo-600 rounded-full"></div>
                  )}
                  
                  <div className="flex items-start gap-5">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.title.includes('Job') ? 'bg-blue-50 text-blue-600' :
                        notif.title.includes('Alert') ? 'bg-red-50 text-red-600' :
                        'bg-indigo-50 text-indigo-600'
                     }`}>
                        {notif.title.includes('Job') ? <Zap size={20} /> : <Info size={20} />}
                     </div>
                     <div className="space-y-1 pr-4">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{notif.title}</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{notif.body}</p>
                        <div className="flex items-center gap-2 pt-2">
                           <Clock size={10} className="text-gray-300" />
                           <span className="text-[9px] font-black text-gray-300 uppercase">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                     </div>
                  </div>
               </div>
             ))
           ) : (
             <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-100 shadow-sm">
                   <Bell size={48} />
                </div>
                <div>
                   <h4 className="text-xl font-black text-gray-300 uppercase tracking-tight">Signal Zero</h4>
                   <p className="text-xs text-gray-400 font-medium max-w-[200px] mx-auto">No telemetry updates detected in the current cycle.</p>
                </div>
             </div>
           )}
        </div>

        <div className="p-8 bg-white border-t border-gray-100 shrink-0">
           <button 
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || notifications.filter(n => !n.read).length === 0}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30"
           >
              {isMarkingAll ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={16} />}
              Clear Transmission Feed
           </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;