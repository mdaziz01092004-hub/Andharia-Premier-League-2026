/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, LogIn, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AppUser } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AppUser) => void;
  registeredUsers: AppUser[];
  onRegisterUser: (user: AppUser) => Promise<void>;
  isMandatory?: boolean;
}

export default function UserAuthModal({
  isOpen,
  onClose,
  onLogin,
  registeredUsers,
  onRegisterUser,
  isMandatory = false
}: UserAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(isMandatory ? 'signup' : 'login');
  
  // Set default activeTab to 'signup' if triggered as mandatory
  useEffect(() => {
    if (isOpen && isMandatory) {
      setActiveTab('signup');
    }
  }, [isOpen, isMandatory]);
  
  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const phone = loginPhone.trim();
    if (!phone) {
      setLoginError('Mobile number is required.');
      return;
    }

    // Lookup user
    const found = registeredUsers.find(
      u => u.mobileNumber.replace(/\s+/g, '') === phone.replace(/\s+/g, '')
    );

    if (found) {
      onLogin(found);
      onClose();
    } else {
      setLoginError('No account registered with this mobile number. Please sign up.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setIsSubmitting(true);

    const name = signupName.trim();
    const phone = signupPhone.trim();

    if (!name || !phone) {
      setSignupError('Both name and mobile number are required.');
      setIsSubmitting(false);
      return;
    }

    if (phone.length < 8) {
      setSignupError('Please enter a valid mobile number.');
      setIsSubmitting(false);
      return;
    }

    // Check for existing
    const exists = registeredUsers.some(
      u => u.mobileNumber.replace(/\s+/g, '') === phone.replace(/\s+/g, '')
    );

    if (exists) {
      setSignupError('This mobile number is already registered. Try logging in.');
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser: AppUser = {
        fullName: name,
        mobileNumber: phone
      };
      
      await onRegisterUser(newUser);
      onLogin(newUser);
      onClose();
    } catch (err: any) {
      setSignupError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isMandatory ? undefined : onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Background Ambient glows */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          {!isMandatory && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl font-display font-black text-white uppercase tracking-wider">
              APL <span className="text-blue-400">2026</span> Portal
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 font-sans leading-relaxed">
              {isMandatory ? (
                <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-[11px] font-semibold">
                  🔐 Mandatory Registration is required to access the tournament portal
                </span>
              ) : (
                "Access the popularity poll and player registrations"
              )}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 mb-6">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`flex-1 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setSignupError('');
              }}
              className={`flex-1 py-2 text-xs font-display font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-sans">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter registered mobile number"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all font-mono"
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-300 text-[11px] leading-relaxed font-sans">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-[0.98]"
                >
                  Sign In
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSignupSubmit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-sans">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-sans">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter your mobile number"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all font-mono"
                  />
                </div>

                {signupError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-300 text-[11px] leading-relaxed font-sans">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{signupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register & Log In'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-5 pt-4 border-t border-white/5 text-center">
            <span className="text-[10px] text-slate-500 font-sans">
              Andharia Premier League 2026 player and team fan database.
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
