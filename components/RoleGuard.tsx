
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  requireVerified?: boolean;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  requireVerified = false,
  fallback 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      fallback ? <>{fallback}</> : (
        <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[3rem] border border-gray-100 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Access Restricted</h2>
          <p className="text-gray-500 font-medium">Your account role does not have authorization to view this secure administrative sector.</p>
        </div>
      )
    );
  }

  if (requireVerified && !user.verified) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 bg-indigo-900 text-white rounded-[3rem] shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto">
          <Loader2 className="animate-spin" size={40} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Verification Pending</h2>
        <p className="text-indigo-200 font-medium">Your professional profile is currently under review by our governance team. Most features will unlock shortly.</p>
      </div>
    );
  }

  return <>{children}</>;
};
