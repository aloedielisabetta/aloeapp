import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Package, ShoppingBag, TrendingUp,
  Settings, ClipboardList, Database, Thermometer,
  ChevronLeft, ChevronRight, FileText, UserPlus, LogOut, ShieldCheck, CloudLightning, Check, Share2, Receipt, User,
  Settings2, Tag, Lock, Sparkles, Loader2, Key, Clock, Coins
} from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../supabase';

const FirstTimePasswordModal: React.FC<{ userRecord: any }> = ({ userRecord }) => {
  const { updateWorkspaceUser, setWorkspaceUsers } = useApp();
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
      // 1. Update Auth password (works because we ARE the signed-in user)
      const { error: authErr } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authErr) throw authErr;

      // 2. Try to update workspace_users DB record (requires RLS UPDATE policy)
      const { error: dbErr } = await supabase
        .from('workspace_users')
        .update({ password: newPassword, invite_status: 'active' })
        .eq('user_id', userRecord.userId || userRecord.user_id);

      if (dbErr) {
        // DB update may fail if RLS UPDATE policy not set - log but don't block user
        console.warn('DB password update failed (RLS may need UPDATE policy):', dbErr.message);
      }

      // 3. Always update local state so the modal closes regardless of DB write success
      setWorkspaceUsers((prev: any[]) =>
        prev.map(u =>
          u.id === userRecord.id
            ? { ...u, password: newPassword, inviteStatus: 'active' }
            : u
        )
      );
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

  const location = useLocation();
  const isAdmin = currentUser?.role === 'admin';
  const userRecord = workspaceUsers.find(u => u.userId === currentUser?.id || u.id === currentUser?.id);

  const navItems = [
    { to: '/', icon: <Users size={20} />, label: 'Pazienti', color: 'green' },
    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'Ordini', color: 'green' },
    { to: '/production', icon: <ClipboardList size={20} />, label: 'Produzione', color: 'green' },
  ];

  if (isAdmin) {
    navItems.push(
      { to: '/products', icon: <Tag size={20} />, label: 'Prodotti/Crea', color: 'amber' },
      { to: '/recipes', icon: <Thermometer size={20} />, label: 'Prodotti / ricette', color: 'amber' },
      { to: '/cambusa', icon: <Package size={20} />, label: 'Cambusa/Materie Prime', color: 'rose' },
      { to: '/variants', icon: <Settings2 size={20} />, label: 'Gestisci varianti', color: 'rose' },
      { to: '/materials', icon: <Database size={20} />, label: 'Ordini per produzione', color: 'purple' },
      { to: '/general-costs', icon: <Receipt size={20} />, label: 'Costi Generali', color: 'sky' },
      { to: '/manodopera', icon: <Clock size={20} />, label: 'Manodopera', color: 'rose' },
      { to: '/profits', icon: <TrendingUp size={20} />, label: 'Profitti', color: 'sky' },
      { to: '/reports', icon: <FileText size={20} />, label: 'Report', color: 'slate' },
      { to: '/users', icon: <UserPlus size={20} />, label: 'Accesso Collaboratori', color: 'slate' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Crea Città e Collaboratori', color: 'slate' },
      { to: '/link', icon: <Share2 size={20} />, label: 'Condivisione App', color: 'slate' },
      { to: '/profile', icon: <User size={20} />, label: 'Il Mio Profilo', color: 'slate' }
    );
  } else {
    navItems.push(
      { to: '/my-sales', icon: <TrendingUp size={20} />, label: 'Mie Vendite', color: 'sky' },
      { to: '/manodopera', icon: <Clock size={20} />, label: 'Manodopera', color: 'rose' },
      { to: '/guadagno-mensile', icon: <Coins size={20} />, label: 'Guadagno Mensile', color: 'sky' },
      { to: '/profile', icon: <User size={20} />, label: 'Il Mio Profilo', color: 'slate' }
    );
  }

  const colorConfig: Record<string, { activeBg: string; iconActive: string; iconInactive: string }> = {
    green: {
      activeBg: 'bg-emerald-50/80 text-emerald-800 border-l-4 border-emerald-500 rounded-r-xl rounded-l-none font-bold shadow-sm',
      iconActive: 'text-emerald-600',
      iconInactive: 'text-emerald-500/80 group-hover:text-emerald-600'
    },
    amber: {
      activeBg: 'bg-amber-50/80 text-amber-800 border-l-4 border-amber-500 rounded-r-xl rounded-l-none font-bold shadow-sm',
      iconActive: 'text-amber-600',
      iconInactive: 'text-amber-500/80 group-hover:text-amber-600'
    },
    rose: {
      activeBg: 'bg-rose-50/80 text-rose-800 border-l-4 border-rose-500 rounded-r-xl rounded-l-none font-bold shadow-sm',
      iconActive: 'text-rose-600',
      iconInactive: 'text-rose-500/80 group-hover:text-rose-600'
    },
    purple: {
      activeBg: 'bg-purple-50/80 text-purple-855 border-l-4 border-purple-500 rounded-r-xl rounded-l-none font-bold shadow-sm',
      iconActive: 'text-purple-600',
      iconInactive: 'text-purple-500/80 group-hover:text-purple-600'
    },
    sky: {
      activeBg: 'bg-sky-50/80 text-sky-800 border-l-4 border-sky-500 rounded-r-xl rounded-l-none font-bold shadow-sm',
      iconActive: 'text-sky-600',
      iconInactive: 'text-sky-500/80 group-hover:text-sky-600'
    },
    slate: {
      activeBg: 'bg-slate-100 text-slate-700 border-l-4 border-slate-500 rounded-r-xl rounded-l-none font-bold shadow-sm',
      iconActive: 'text-slate-600',
      iconInactive: 'text-slate-400 group-hover:text-slate-500'
    }
  };

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
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            const config = colorConfig[item.color || 'slate'];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl transition-all group ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'
                } ${isActive
                  ? `${config.activeBg}`
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`shrink-0 transition-colors ${isActive ? config.iconActive : config.iconInactive}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="overflow-hidden whitespace-nowrap text-sm font-black uppercase tracking-tight text-[10px]">{item.label}</span>
                )}
              </NavLink>
            );
          })}
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

      {!isAdmin && userRecord && (userRecord.inviteStatus === 'pending' || !userRecord.inviteStatus) && (
        <FirstTimePasswordModal userRecord={userRecord} />
      )}
    </div>
  );
};

export default Layout;
