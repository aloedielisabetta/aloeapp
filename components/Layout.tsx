
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, Package, ShoppingBag, TrendingUp,
  Settings, ClipboardList, Database, Thermometer,
  ChevronLeft, ChevronRight, FileText, UserPlus, LogOut, ShieldCheck, CloudLightning, Check, Share2, Receipt, User,
  Settings2, Tag, Lock, Sparkles, Loader2, Key
} from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../supabase';

const FirstTimePasswordModal: React.FC<{ userRecord: any }> = ({ userRecord }) => {
  const { updateWorkspaceUser } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono. Riscrivi la password per verificare.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update Auth password
      const { error: authErr } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authErr) console.warn("Auth password update warning:", authErr);

      // 2. Update workspace_users database profile
      await updateWorkspaceUser({
        ...userRecord,
        password: newPassword,
        inviteStatus: 'active'
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Primo Accesso</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
            Sei entrato con il Magic Code. Scegli la tua password personale prima di proseguire.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scegli Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                required
                type="password"
                className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conferma Password (Scrivi 2 volte)</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                required
                type="password"
                className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Crea Password e Attiva Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, currentWorkspace, isSyncing, workspaceUsers } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const isAdmin = currentUser?.role === 'admin';
  const userRecord = workspaceUsers.find(u => u.userId === currentUser?.id || u.id === currentUser?.id);

  const navItems = [
    { to: '/', icon: <Users size={20} />, label: 'Pazienti' },
    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'Ordini' },
    { to: '/production', icon: <ClipboardList size={20} />, label: 'Produzione' },
  ];

  if (isAdmin) {
    navItems.push(
      { to: '/products', icon: <Tag size={20} />, label: 'Prodotti/Crea' },
      { to: '/recipes', icon: <Thermometer size={20} />, label: 'Prodotti / ricette' },
      { to: '/cambusa', icon: <Package size={20} />, label: 'Cambusa/Materie Prime' },
      { to: '/variants', icon: <Settings2 size={20} />, label: 'Gestisci varianti' },
      { to: '/general-costs', icon: <Receipt size={20} />, label: 'Costi Generali' },
      { to: '/materials', icon: <Database size={20} />, label: 'Ordini per produzione' },
      { to: '/profits', icon: <TrendingUp size={20} />, label: 'Profitti' },
      { to: '/reports', icon: <FileText size={20} />, label: 'Report' },
      { to: '/users', icon: <UserPlus size={20} />, label: 'Accesso Collaboratori' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Crea Città e Collaboratori' },
      { to: '/link', icon: <Share2 size={20} />, label: 'Condivisione App' },
      { to: '/profile', icon: <User size={20} />, label: 'Il Mio Profilo' }
    );
  } else {
    navItems.push(
      { to: '/my-sales', icon: <TrendingUp size={20} />, label: 'Mie Vendite' },
      { to: '/profile', icon: <User size={20} />, label: 'Il Mio Profilo' }
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {!isAdmin && userRecord?.inviteStatus === 'pending' && (
        <FirstTimePasswordModal userRecord={userRecord} />
      )}
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-64'
          } bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out relative`}
      >
        <div className={`p-6 border-b border-slate-100 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          <div className="flex items-center justify-between w-full mb-2">
            {!isCollapsed && (
              <h1 className="text-lg font-bold text-green-700 flex items-center gap-2">
                <span className="text-xl">🌱</span>
                <span>Aloe</span>
              </h1>
            )}
            {isCollapsed && <span className="text-xl">🌱</span>}
          </div>
          {!isCollapsed && (
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{currentWorkspace?.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {isAdmin ? <ShieldCheck size={12} className="text-blue-500" /> : <Users size={12} className="text-orange-500" />}
                <p className="text-[10px] font-bold text-slate-600 truncate">{isAdmin ? 'Amministratore' : currentUser?.name}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-green-600 shadow-sm z-10 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto hide-scrollbar mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl transition-all ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
                } ${isActive
                  ? 'bg-green-50 text-green-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && (
                <span className="overflow-hidden whitespace-nowrap text-sm font-black uppercase tracking-tight text-[10px]">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isSyncing ? (
                <>
                  <CloudLightning size={12} className="animate-pulse text-blue-500" />
                  <span>Sincronizzazione...</span>
                </>
              ) : (
                <>
                  <Check size={12} className="text-green-500" />
                  <span>Cloud Attivo</span>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Esci</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
