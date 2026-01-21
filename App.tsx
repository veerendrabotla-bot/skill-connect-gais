
import React, { useState, useEffect } from 'react';
// Fix: Use the direct ESM import for react-router-dom to resolve "no exported member" errors in this environment
import { HashRouter as Router, Routes, Route, Navigate } from 'https://esm.sh/react-router-dom@6';
import { UserRole, Job } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import { RoleGuard } from './components/RoleGuard';
import NotificationCenter from './components/NotificationCenter';
import MobileBottomNav from './components/MobileBottomNav';
import OfflineIndicator from './components/OfflineIndicator';
import { LogOut, Bell, Loader2, Smartphone } from 'lucide-react';

const Navbar = ({ onOpenNotifs, unreadCount }: { onOpenNotifs: () => void, unreadCount: number }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50 px-6 flex items-center justify-between transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">S</div>
        <div className="hidden sm:block">
          <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">SkillConnect</span>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest -mt-1">Enterprise Service OS</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <OfflineIndicator />
        
        <button 
          onClick={onOpenNotifs}
          className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all relative group"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center group-hover:scale-110 transition-transform animate-in zoom-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        
        <div className="h-10 w-px bg-gray-100 hidden sm:block"></div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 tracking-tight">{user.name}</p>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
              user.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' : 
              user.role === UserRole.WORKER ? 'bg-green-100 text-green-700' : 
              'bg-indigo-100 text-indigo-700'
            }`}>
              {user.role}
            </span>
          </div>
          <button 
            onClick={logout} 
            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
            title="Secure Logout"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { user, loading, isInitializing } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // PWA Install logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  if (isInitializing || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
          <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-100 animate-pulse">S</div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={20} />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Establishing Secure Node</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20 md:pb-0">
        <Navbar onOpenNotifs={() => setIsNotifOpen(true)} unreadCount={unreadCount} />
        
        {/* PWA Install Banner */}
        {deferredPrompt && (
          <div className="fixed bottom-24 left-6 right-6 md:left-auto md:right-10 md:w-80 z-40 bg-white border border-indigo-100 p-6 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0">
                <Smartphone size={24} />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">SkillConnect Native</h4>
                <p className="text-xs text-gray-400 font-medium">Install our mobile client for a better service experience.</p>
                <button 
                  onClick={handleInstall}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-black transition-all"
                >
                  Install Profile
                </button>
              </div>
            </div>
          </div>
        )}

        <main className={`flex-1 transition-all duration-500 ${user ? 'pt-24 sm:pt-28 pb-10' : ''}`}>
          <Routes>
            <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />
            
            <Route path="/" element={
              user ? (
                user.role === UserRole.CUSTOMER ? (
                  <Navigate to="/customer" replace />
                ) : user.role === UserRole.WORKER ? (
                  <Navigate to="/worker" replace />
                ) : (
                  <Navigate to="/admin" replace />
                )
              ) : <Navigate to="/auth" replace />
            } />

            <Route path="/customer" element={
              <RoleGuard allowedRoles={[UserRole.CUSTOMER]}>
                <CustomerDashboard jobs={jobs} setJobs={setJobs} />
              </RoleGuard>
            } />

            <Route path="/worker" element={
              <RoleGuard allowedRoles={[UserRole.WORKER]}>
                <WorkerDashboard jobs={jobs} setJobs={setJobs} />
              </RoleGuard>
            } />

            <Route path="/admin" element={
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard jobs={jobs} setJobs={setJobs} />
              </RoleGuard>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <NotificationCenter 
          isOpen={isNotifOpen} 
          onClose={() => setIsNotifOpen(false)} 
          onUnreadCountChange={setUnreadCount}
        />

        <MobileBottomNav unreadCount={unreadCount} onOpenNotifs={() => setIsNotifOpen(true)} />
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
