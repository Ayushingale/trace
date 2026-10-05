import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('auditor@compliance.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState('Compliance Specialist');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isRegister ? 'Create TRACE Account' : 'Sign in to TRACE'}
            </h3>
            <p className="text-xs text-slate-400">
              Audit-grade verification workspace and review credentials
            </p>
          </div>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-emerald-300">Authentication Verified</h4>
            <p className="text-xs text-slate-400">Session loaded with compliance auditor privileges.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Persona</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Compliance Specialist">Compliance Specialist</option>
                    <option value="Paralegal / Legal Analyst">Paralegal / Legal Analyst</option>
                    <option value="ML Researcher">ML Researcher</option>
                    <option value="Hackathon Judge">Hackathon Judge</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all mt-2"
            >
              <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="hover:text-blue-400 transition-colors"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
              <span className="text-[10px] text-slate-500 font-mono">Demo Mode</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
