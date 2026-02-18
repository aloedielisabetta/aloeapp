
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, User, Key, Plus, ArrowRight, Lock, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

const Login: React.FC = () => {
  const { createWorkspace } = useApp();
  const navigate = useNavigate();

  // State simplification
  const [step, setStep] = useState<'workspace' | 'create-workspace'>('workspace');
  const [wsName, setWsName] = useState('');
  const [newWsPassword, setNewWsPassword] = useState('');

  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const { currentUser, isLoadingProfile } = useApp();

  // Only auto-redirect once we know for sure who the user is
  useEffect(() => {
    if (!isLoadingProfile && currentUser) {
      navigate('/');
    }
  }, [currentUser, isLoadingProfile, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    const baseUser = username.toLowerCase().replace(/\s+/g, '');
    const domains = ['@gmail.com', '@aloe.system'];
    let success = false;
    let lastError = null;

    // Try domains sequentially if no @ present
    if (!username.includes('@')) {
      for (const dom of domains) {
        const { error } = await supabase.auth.signInWithPassword({
          email: `${baseUser}${dom}`,
          password: password,
        });
        if (!error) {
          success = true;
          break;
        }
        lastError = error;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      if (!error) success = true;
      lastError = error;
    }

    setLoading(false);
    if (success) {
      navigate('/');
    } else {
      setError(lastError?.message === "Invalid login credentials" ? "Credenziali non valide" : (lastError?.message || "Errore di accesso"));
    }
  };

  const handleCreateWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      // Auto-append domain
      const emailToUse = username.includes('@') ? username : `${username.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

      // 1. Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailToUse,
        password: newWsPassword,
      });

      if (signUpError) throw signUpError;
      if (!data.session) {
        // If session is missing, it usually means email confirm is ON. 
        // With fake emails, this blocks login. 
        // We assume the user has disabled it as requested.
        throw new Error('Conferma email richiesta. Disabilita "Confirm Email" in Supabase.');
      }

      // 2. Create Workspace (handled by store, but we need session active)
      // Since we just signed up and got a session (if email confirm is off or auto-sign-in enabled), we can proceed.
      // Wait a moment for session propagation in store
      await new Promise(r => setTimeout(r, 500));

      const newWs = await createWorkspace(wsName.trim(), newWsPassword); // adminPassword legacy
      navigate('/');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Errore creazione account.');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
        <p className="font-black uppercase tracking-[0.2em] text-xs">Connessione al Cloud...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner group transition-all">
                <span className="text-5xl group-hover:scale-110 transition-transform">🌱</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Aloe System</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Workspace Access Control</p>
            </div>

            {step === 'workspace' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      autoFocus
                      className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                      placeholder="Il tuo username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && password && handleLogin()}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="password"
                      className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 justify-center py-3 bg-red-50 rounded-2xl border border-red-100">
                    <Lock size={14} className="text-red-500" />
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={!username || !password || loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 group relative overflow-hidden"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Entra <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>

                <button
                  onClick={() => setStep('create-workspace')}
                  className="w-full text-center text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-emerald-600 mt-4 transition-colors"
                >
                  Nuovo Workspace? Registrati
                </button>
              </div>
            )}

            {step === 'create-workspace' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setStep('workspace')} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-600">
                    <ArrowRight className="rotate-180" size={16} />
                  </button>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Creazione Account</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Azienda</label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input
                        className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        placeholder="Nome Workspace..."
                        value={wsName}
                        onChange={e => setWsName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username Admin</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input
                        className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        placeholder="Scegli il tuo username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input
                        type="password"
                        className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        placeholder="Scegli password..."
                        value={newWsPassword}
                        onChange={e => setNewWsPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 justify-center py-3 bg-red-50 rounded-2xl border border-red-100">
                      <Lock size={14} className="text-red-500" />
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleCreateWorkspace}
                    disabled={!newWsPassword || !wsName || !username || loading}
                    className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Registra e Crea'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-50">
          Aloe Intelligence System © 2025
        </p>
      </div>
    </div>
  );
};

export default Login;
