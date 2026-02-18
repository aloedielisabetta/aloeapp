
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import Layout from './components/Layout';
import Patients from './pages/Patients';
import Products from './pages/Products';
import GeneralCosts from './pages/GeneralCosts';
import Orders from './pages/Orders';
import Production from './pages/Production';
import Recipes from './pages/Recipes';
import Materials from './pages/Materials';
import Profits from './pages/Profits';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import UsersPage from './pages/Users';
import MySales from './pages/MySales';
import LinkPage from './pages/Link';
import Profile from './pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { currentUser, isLoadingProfile } = useApp();

  // Show a blank loading screen while we determine who the user is.
  // This prevents the race condition where ProtectedRoute redirects to /login
  // before the profile has finished loading from Supabase.
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-pulse">🌱</span>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && currentUser.role !== 'admin') return <Navigate to="/" replace />;

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />

          <Route path="/my-sales" element={<ProtectedRoute><MySales /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/products" element={<ProtectedRoute adminOnly><Products /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute adminOnly><Recipes /></ProtectedRoute>} />
          <Route path="/general-costs" element={<ProtectedRoute adminOnly><GeneralCosts /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute adminOnly><Materials /></ProtectedRoute>} />
          <Route path="/profits" element={<ProtectedRoute adminOnly><Profits /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
          <Route path="/link" element={<ProtectedRoute adminOnly><LinkPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
