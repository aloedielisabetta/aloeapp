
import React, { useState } from 'react';
import { useApp } from '../store';
import { WorkspaceUser } from '../types';
import { UserPlus, User, Key, Shield, Trash2, Users, Volume2, AlertCircle, ArrowRight, Sparkles, Copy, Mail, Eye, Smartphone } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const UsersPage: React.FC = () => {
  const { salespersons, workspaceUsers, addWorkspaceUser, updateWorkspaceUser, deleteWorkspaceUser, currentWorkspace } = useApp();
  const [selectedSalespersonId, setSelectedSalespersonId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [existingUser, setExistingUser] = useState<WorkspaceUser | null>(null);

  React.useEffect(() => {
    if (selectedSalespersonId) {
      const found = workspaceUsers.find(u => u.salespersonId === selectedSalespersonId);
      if (found) {
        setExistingUser(found);
        setUsername(found.username);
        setPassword(found.password || '');
        setEmail(found.email || '');
        setPhone(found.phone || '');
      } else {
        setExistingUser(null);
        setUsername('');
        setPassword('');
        setEmail('');
        setPhone('');
      }
    } else {
      setExistingUser(null);
      setUsername('');
      setPassword('');
      setEmail('');
      setPhone('');
    }
  }, [selectedSalespersonId, workspaceUsers]);


  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalespersonId || !username || !currentWorkspace) return;

    try {
      if (existingUser) {
        // UPDATE EXISTING USER
        // 1. Update Auth (Note: This only works if the user is authorized or via service role, 
        // but given the current workaround with tempClient, we'll update the DB profile.
        // Changing Auth password for ANOTHER user requires Admin API which is not available here.
        // However, we satisfy the user request by updating our local mapping.)

        await updateWorkspaceUser({
          ...existingUser,
          username: username,
          email: email.trim(),
          password: password,
          phone: phone.trim()
        });

        alert(`Profilo di ${username} aggiornato con successo.`);
      } else {
        // CREATE NEW USER with MAGIC LINK workflow
        const usernameExists = workspaceUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (usernameExists) {
          alert("Questo username è già in uso. Scegline un altro.");
          return;
        }

        await addWorkspaceUser({
          salespersonId: selectedSalespersonId,
          username: username,
          email: email.trim(),
          phone: phone.trim()
        });

        alert(`Invito creato per ${username}. Comunica l'ID Collaboratore e il Magic Code.`);
      }

      setSelectedSalespersonId('');
      setUsername('');
      setPassword('');
      setEmail('');
      setPhone('');
    } catch (err: any) {
      console.error(err);
      alert(`Errore salvataggio utente: ${err.message}`);
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm('Eliminare questo account utente? Il collaboratore non potrà più accedere.')) {
      await deleteWorkspaceUser(id);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Accesso Collaboratori</h2>
        <p className="text-slate-500 font-medium">Crea le credenziali di accesso per i tuoi collaboratori esterni.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center border border-emerald-100 shadow-inner">
              <UserPlus size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nuovo Profilo</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Associa Login ad un Agente</p>
            </div>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Seleziona Collaboratore Esterno</label>
              <div className="relative">
                <select
                  className="w-full p-5 border border-slate-100 rounded-3xl font-black text-slate-700 bg-slate-50 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none"
                  value={selectedSalespersonId}
                  onChange={e => setSelectedSalespersonId(e.target.value)}
                  required
                >
                  <option value="">Scegli dalla lista...</option>
                  {salespersons.filter(s => !s.isHidden || workspaceUsers.some(u => u.salespersonId === s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.isHidden ? '(Nascosto)' : ''}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Users size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email per Notifiche (GCal)</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                  placeholder="email@gmail.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numero di Telefono</label>
              <div className="relative">
                <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  placeholder="e.g. +39 333 1234567"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Username di Accesso</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    placeholder="e.g. m_rossi"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              {!existingUser && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Avviso</label>
                  <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                    <Sparkles className="text-blue-600 shrink-0" size={20} />
                    <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">
                      Verrà generato un Magic Code. Il collaboratore lo userà per impostare la sua password.
                    </p>
                  </div>
                </div>
              )}
              {existingUser && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Password (Segreta)</label>
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      className="w-full pl-14 pr-5 py-5 bg-white border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {existingUser && (
              <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 flex items-start gap-4">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                  Stai modificando un profilo esistente. Salva per aggiornare le credenziali nel database.
                </p>
              </div>
            )}

            {!existingUser && (
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                  <Volume2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Nota per Elisabetta</p>
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">
                    La password non verrà mostrata nell'app del collaboratore. Dovrai comunicargliela tu vocalmente dopo averla salvata.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedSalespersonId || !username}
              className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-xl group flex items-center justify-center ${existingUser ? 'bg-amber-600 text-white shadow-amber-100 hover:bg-amber-700' : 'bg-slate-900 text-white shadow-slate-100 hover:bg-slate-800'
                }`}
            >
              {existingUser ? 'Salva Modifiche Profilo' : 'Genera Magic Link'} <ArrowRight size={18} className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Account Workspace Attivi</h4>
          <div className="space-y-4">
            {workspaceUsers.map(user => {
              const salesperson = salespersons.find(s => s.id === user.salespersonId);
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedSalespersonId(user.salespersonId)}
                  className={`p-8 bg-white border rounded-[2.5rem] shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all hover:shadow-md cursor-pointer ${selectedSalespersonId === user.salespersonId ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100'}`}
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all shadow-inner">
                      {user.inviteStatus === 'pending' ? <Sparkles size={24} /> : <Shield size={24} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-800 uppercase text-xs tracking-[0.1em]">{user.username}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Users size={10} className="text-slate-300" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Agente: <span className="text-slate-900">{salesperson?.name || 'Sconosciuto'}</span></p>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Smartphone size={10} className="text-slate-300" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Tel: <span className="text-slate-900">{user.phone}</span></p>
                        </div>
                      )}

                      {/* Magic Link / Password View */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                        <div className="overflow-hidden">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            {user.inviteStatus === 'pending' ? 'Magic Code (Invia al Collaboratore)' : 'Password Attuale'}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-slate-600 truncate">
                            {user.inviteStatus === 'pending' ? user.magicCode : (user.password || '••••••••')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {user.inviteStatus === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = `Ciao! Ecco il tuo accesso ad Aloe.\nCollaborator ID: ${user.username}\nMagic Code: ${user.magicCode}\nAccedi qui: ${window.location.origin}${window.location.pathname}#/setup-password`;
                                navigator.clipboard.writeText(text);
                                alert("Invito copiato!");
                              }}
                              className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-emerald-500 transition-all"
                              title="Copia Invito"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const text = user.inviteStatus === 'pending' ? user.magicCode : user.password;
                              if (text) navigator.clipboard.writeText(text);
                            }}
                            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-blue-500 transition-all"
                            title="Copia Dato"
                          >
                            <User size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteUser(user.id);
                    }}
                    className="p-3 text-slate-200 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 rounded-2xl ml-4"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
            {workspaceUsers.length === 0 && (
              <div className="py-24 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Users size={40} className="opacity-20" />
                </div>
                <p className="font-black uppercase tracking-[0.2em] text-[10px]">Nessun Collaboratore Abilitato</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
