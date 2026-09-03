import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('khurram@apis.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      await switchDemoRole(role);
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/20 mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            APIS <span className="text-brand-400">Enterprise</span>
          </h1>
          <p className="text-xs text-slate-400">
            Project Management & Executive Staff Intelligence System
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@apis.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to APIS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Role Switcher Section for Pair Programming & Testing */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Instant Demo Logins</span>
              <span className="text-[10px] text-brand-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 1-Click
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[
                { role: 'CEO' as UserRole, name: 'Khurram Jaffrani', title: 'Chief Executive Officer', avatar: '/avatars/khurram_jaffrani.png' },
                { role: 'DEPARTMENT_HEAD' as UserRole, name: 'Naeem Ahmed', title: 'Head Of Media Buying & Planning', avatar: '/avatars/naeem_ahmed.png' },
                { role: 'ACCOUNT_MANAGER' as UserRole, name: 'Kashif Aghani', title: 'Manager Business Development', avatar: '/avatars/kashif_aghani.png' },
                { role: 'STAFF' as UserRole, name: 'Syeda Musfira', title: 'Client Service & Operations Executive', avatar: '/avatars/syeda_musfira.png' },
                { role: 'VIEWER' as UserRole, name: 'Syed Abeel Ahmed', title: 'Head Of Design & Digital', avatar: '/avatars/syed_abeel_ahmed.png' },
                { role: 'PROJECT_MANAGER' as UserRole, name: 'Adnan Karim', title: 'Creative Manager (AI)', avatar: '/avatars/adnan_karim.png' },
              ].map(({ role, name, title, avatar }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleQuickLogin(role)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left text-xs text-slate-200 transition-all group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img src={avatar} alt={name} className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow-sm" />
                    <div className="truncate">
                      <div className="font-bold text-white group-hover:text-brand-300">{name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{title}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-brand-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          APIS Management Platform • Secured with PostgreSQL & JWT RBAC
        </div>
      </div>
    </div>
  );
};
