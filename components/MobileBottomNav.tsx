
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
// Fix: ESM import for router location logic
import { useLocation, useNavigate } from 'https://esm.sh/react-router-dom@6';
import { 
  Home, Radar, Wallet, User, Bell, 
  Search, Briefcase, LayoutDashboard, Fingerprint
} from 'lucide-react';

interface Props {
  unreadCount: number;
  onOpenNotifs: () => void;
}

const MobileBottomNav: React.FC<Props> = ({ unreadCount, onOpenNotifs }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isActive = (path: string) => location.pathname.includes(path);

  const customerItems = [
    { icon: Search, label: 'Explore', path: '/customer' },
    { icon: Briefcase, label: 'My Jobs', path: '/customer' }, // Filtering logic in dashboard handles views
    { icon: Bell, label: 'Signals', action: onOpenNotifs },
    { icon: User, label: 'Account', path: '/customer' }
  ];

  const workerItems = [
    { icon: Radar, label: 'Radar', path: '/worker' },
    { icon: Wallet, label: 'Vault', path: '/worker' },
    { icon: Bell, label: 'Signals', action: onOpenNotifs },
    { icon: Fingerprint, label: 'Node', path: '/worker' }
  ];

  const adminItems = [
    { icon: LayoutDashboard, label: 'Dash', path: '/admin' },
    { icon: Bell, label: 'Signals', action: onOpenNotifs },
    { icon: User, label: 'Admin', path: '/admin' }
  ];

  const items = user.role === UserRole.CUSTOMER ? customerItems 
                : user.role === UserRole.WORKER ? workerItems 
                : adminItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50 flex items-center justify-around px-6 pb-2 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => item.action ? item.action() : navigate(item.path)}
          className="flex flex-col items-center gap-1.5 transition-all relative group"
        >
          <div className={`p-2 rounded-xl transition-all ${
            (item.path && isActive(item.path)) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 group-active:scale-90'
          }`}>
            <item.icon size={22} strokeWidth={isActive(item.path || '') ? 2.5 : 2} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${
            (item.path && isActive(item.path)) ? 'text-indigo-600' : 'text-gray-400'
          }`}>
            {item.label}
          </span>
          
          {item.label === 'Signals' && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in">
              {unreadCount > 9 ? '!' : unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default MobileBottomNav;
