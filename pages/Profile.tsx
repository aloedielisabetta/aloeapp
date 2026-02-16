
import React, { useState } from 'react';
import { useApp } from '../store';
import { User, Mail, ShieldCheck, Check, Loader2, Sparkles } from 'lucide-react';

const Profile: React.FC = () => {
    const { currentUser, workspaceUsers, updateWorkspaceUser } = useApp();
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Find the workspace user record for the current user
    const userRecord = workspaceUsers.find(u => u.userId === currentUser?.id);

    React.useEffect(() => {
        if (userRecord?.email) {
            setEmail(userRecord.email);
        }
    }, [userRecord]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userRecord) return;

        setIsSaving(true);
        setSuccess(false);

        try {
            await updateWorkspaceUser({
                ...userRecord,
                email: email.trim()
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Errore durante il salvataggio');
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-32 translate-x-32 blur-3xl group-hover:bg-emerald-100 transition-all duration-700"></div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
                        <User size={48} className="text-white" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{currentUser.name || currentUser.role}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{currentUser.role === 'admin' ? 'Amministratore' : 'Collaboratore Workspace'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 mt-1">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Impostazioni Notifiche</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Configura il tuo Calendario Google</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Gmail per Promemoria</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                                className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                                placeholder="la_tua_email@gmail.com"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase ml-2">
                            Questa email verrà usata per generare i link di Google Calendar quando imposti una fine cura per un paziente.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving || email === (userRecord?.email || '')}
                        className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-30 flex items-center justify-center gap-3"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : (success ? <Check size={18} className="text-emerald-400" /> : <Sparkles size={18} />)}
                        {success ? 'Profilo Aggiornato!' : (isSaving ? 'Salvataggio...' : 'Salva Impostazioni')}
                    </button>
                </form>
            </div>

            <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                    <Sparkles size={24} />
                </div>
                <p className="text-xs font-bold text-blue-800 leading-relaxed uppercase">
                    Assicurati di inserire un indirizzo Gmail attivo per poter aggiungere i promemoria direttamente sul tuo calendario personale o aziendale.
                </p>
            </div>
        </div>
    );
};

export default Profile;
