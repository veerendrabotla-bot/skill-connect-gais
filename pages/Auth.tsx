
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, User as UserIcon, ShieldCheck, ShoppingBag, UserCheck, ArrowRight, CheckCircle, RefreshCcw } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { needsEmailVerification, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isLogin) {
        await authService.signIn(email, password);
      } else {
        await authService.signUp(email, password, fullName, role);
        setMessage({ 
          text: "Registration successful! A verification link has been dispatched to your email address.", 
          type: 'success' 
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      setMessage({ text: error.message || "Authentication failed.", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2.1 Verification Gate UI
  if (needsEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 text-center space-y-8 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-inner">
            <Mail size={48} className="animate-float" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Verify Email</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              We've sent a secure verification token to your inbox. Please confirm your identity to activate your account.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              <RefreshCcw size={18} /> I've Verified
            </button>
            <button 
              onClick={logout}
              className="text-sm font-black text-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors"
            >
              Cancel & Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Left Side: Illustration & Branding */}
        <div className="lg:col-span-5 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl mb-8 shadow-lg">S</div>
            <h1 className="text-4xl font-black tracking-tighter mb-4">SkillConnect</h1>
            <p className="text-blue-100 text-lg font-medium leading-relaxed">
              Empowering the world's workforce with enterprise-grade service infrastructure.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-all">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="font-bold">Verified Partners</p>
                <p className="text-sm text-blue-100">100% background checked professionals.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-all">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="font-bold">Seamless Payments</p>
                <p className="text-sm text-blue-100">Enterprise escrow and instant settlements.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-7 p-12 lg:p-20">
          <div className="max-w-md mx-auto space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-gray-500 font-medium">
                {isLogin ? "Enter your credentials to access your dashboard." : "Join our network of elite service professionals and customers."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Your Role</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole(UserRole.CUSTOMER)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          role === UserRole.CUSTOMER ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <UserCheck size={20} className={role === UserRole.CUSTOMER ? 'text-blue-600' : 'text-gray-400'} />
                        <span className={`text-xs font-black uppercase ${role === UserRole.CUSTOMER ? 'text-blue-600' : 'text-gray-400'}`}>Customer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole(UserRole.WORKER)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          role === UserRole.WORKER ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <UserCheck size={20} className={role === UserRole.WORKER ? 'text-blue-600' : 'text-gray-400'} />
                        <span className={`text-xs font-black uppercase ${role === UserRole.WORKER ? 'text-blue-600' : 'text-gray-400'}`}>Worker</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 rounded-2xl outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold border animate-in fade-in slide-in-from-top-2 flex items-center gap-3 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {message.type === 'success' && <CheckCircle size={16} />}
                  {message.text}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
                {!isSubmitting && <ArrowRight size={20} />}
              </button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
                className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
