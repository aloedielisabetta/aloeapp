
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users, Package, ShoppingBag, TrendingUp,
  Settings, ClipboardList, Database, Thermometer,
  ChevronLeft, ChevronRight, FileText, UserPlus, LogOut, ShieldCheck, CloudLightning, Check, Share2, Receipt
} from 'lucide-react';
import { useApp } from '../store';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, currentWorkspace, isSyncing } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { to: '/', icon: <Users size={20} />, label: 'Pazienti' },
    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'Ordini' },
    { to: '/production', icon: <ClipboardList size={20} />, label: 'Produzione' },
  ];

  if (isAdmin) {
    navItems.push(
      { to: '/products', icon: <Package size={20} />, label: 'Prodotti' },
      { to: '/recipes', icon: <Thermometer size={20} />, label: 'Ricette' },
      { to: '/general-costs', icon: <Receipt size={20} />, label: 'Costi Generali' },
      { to: '/materials', icon: <Database size={20} />, label: 'Materiali' },
      { to: '/profits', icon: <TrendingUp size={20} />, label: 'Profitti' },
      { to: '/reports', icon: <FileText size={20} />, label: 'Report' },
      { to: '/users', icon: <UserPlus size={20} />, label: 'Accesso Collaboratori' },
      { to: '/settings', icon: <Settings size={20} />, label: 'Crea Città e Collaboratori' },
      { to: '/link', icon: <Share2 size={20} />, label: 'Condivisione App' }
    );
  } else {
    navItems.push(
      { to: '/my-sales', icon: <TrendingUp size={20} />, label: 'Mie Vendite' }
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
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
