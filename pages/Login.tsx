
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, User, Key, Plus, ArrowRight, Lock, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

const Login: React.FC = () => {
  const { workspaces, setCurrentWorkspace, setCurrentUser, createWorkspace } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<'workspace' | 'role' | 'admin-login' | 'user-login' | 'create-workspace'>('workspace');
  const [wsName, setWsName] = useState('');
  const [newWsPassword, setNewWsPassword] = useState('');
  const [selectedWs, setSelectedWs] = useState<any>(null);
  
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Monitora il caricamento dei workspace dallo store
  useEffect(() => {
    if (workspaces.length > 0) {
      setInitializing(false);
    } else {
      // Diamo un timeout piccolo per casi in cui il DB è vuoto ma caricato
      const timer = setTimeout(() => setInitializing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [workspaces]);

  // Dati temporanei scaricati al volo per il login
  const [tempUsers, setTempUsers] = useState<any[]>([]);
  const [tempSalespersons, setTempSalespersons] = useState<any[]>([]);

  const fetchWorkspaceLoginData = async (wsId: string) => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        supabase.from('workspace_users').select('*').eq('workspace_id', wsId),
        supabase.from('salespersons').select('*').eq('workspace_id', wsId)
      ]);
      setTempUsers(uRes.data || []);
      setTempSalespersons(sRes.data || []);
    } catch (e) {
      console.error("Failed to fetch login data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSubmit = () => {
    if (initializing) return;
    const existing = workspaces.find(w => w.name.toLowerCase() === wsName.trim().toLowerCase());
    if (existing) {
      setSelectedWs(existing);
      fetchWorkspaceLoginData(existing.id);
      setStep('role');
    } else {
      setStep('create-workspace');
    }
  };

  const handleCreateWorkspace = async () => {
    if (!wsName || !newWsPassword) return;
    setLoading(true);
    setError('');
    try {
      const newWs = await createWorkspace(wsName.trim(), newWsPassword);
      setSelectedWs(newWs);
      setStep('role');
    } catch (e) {
      console.error(e);
      setError('Impossibile creare il workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (password === (selectedWs.adminPassword || 'admin')) {
      setCurrentWorkspace(selectedWs);
      setCurrentUser({ role: 'admin', name: 'Elisabetta' });
      navigate('/');
    } else {
      setError('Password Amministratore Errata');
    }
  };

  const handleUserLogin = () => {
    const user = tempUsers.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    if (user) {
      const salesperson = tempSalespersons.find(s => s.id === user.salesperson_id);
      setCurrentWorkspace(selectedWs);
      setCurrentUser({ 
        role: 'user', 
        id: user.id, 
        name: user.username, 
        salespersonId: user.salesperson_id 
      });
      navigate('/');
    } else {
      setError('Username o Password Errate');
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entra nel tuo Workspace</label>
                  <div className="relative">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      autoFocus
                      className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                      placeholder="Nome Azienda"
                      value={wsName}
                      onChange={e => setWsName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleWorkspaceSubmit()}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleWorkspaceSubmit}
                  disabled={!wsName}
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 group"
                >
                  Continua <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {step === 'create-workspace' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setStep('workspace')} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-600">
                    <ArrowRight className="rotate-180" size={16} />
                  </button>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Inizializzazione</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 leading-relaxed text-center">
                    Il workspace <span className="font-black">"{wsName}"</span> non esiste. Crealo impostando la password Admin.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Amministratore</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="password"
                        className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        placeholder="Crea password..."
                        value={newWsPassword}
                        onChange={e => setNewWsPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleCreateWorkspace}
                    disabled={!newWsPassword || loading}
                    className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Inizializza Workspace'}
                  </button>
                </div>
              </div>
            )}

            {step === 'role' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sei nel Workspace</p>
                  <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">{selectedWs.name}</p>
                </div>
                <button 
                  onClick={() => setStep('admin-login')}
                  className="group flex items-center gap-5 p-6 rounded-[2rem] border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-left w-full shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                    <Shield size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Elisabetta</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Admin Access</p>
                  </div>
                </button>
                <div className="relative flex items-center py-4">
                   <div className="flex-grow border-t border-slate-100"></div>
                   <span className="flex-shrink mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">O</span>
                   <div className="flex-grow border-t border-slate-100"></div>
                </div>
                <button 
                  disabled={loading}
                  onClick={() => setStep('user-login')}
                  className="group flex items-center gap-5 p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left w-full shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <User size={28} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Collaboratore</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Limited Access</p>
                  </div>
                </button>
                <button onClick={() => setStep('workspace')} className="w-full text-center text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 mt-6 underline decoration-slate-200 underline-offset-8">Cambia Workspace</button>
              </div>
            )}

            {(step === 'admin-login' || step === 'user-login') && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setStep('role')} className="p-2.5 bg-slate-100 text-slate-400 rounded-2xl hover:text-slate-600 transition-colors">
                    <ArrowRight className="rotate-180" size={16} />
                  </button>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Login {step === 'admin-login' ? 'Elisabetta' : 'Collaboratore'}
                  </p>
                </div>

                {step === 'user-login' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        autoFocus
                        className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      autoFocus={step === 'admin-login'}
                      type="password"
                      className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (step === 'admin-login' ? handleAdminLogin() : handleUserLogin())}
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
                  onClick={step === 'admin-login' ? handleAdminLogin : handleUserLogin}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    step === 'admin-login' 
                      ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' 
                      : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
                  }`}
                >
                  Entra <Lock size={18} />
                </button>
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
