
import React, { useState } from 'react';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';
import { Key, User, Sparkles, ArrowRight, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase';
import { createClient } from '@supabase/supabase-js';

const SetupPassword: React.FC = () => {
    const { workspaceUsers, updateWorkspaceUser } = useApp();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [magicCode, setMagicCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Le password non coincidono');
            return;
        }

        if (password.length < 6) {
            setError('La password deve essere di almeno 6 caratteri');
            return;
        }

        setLoading(true);

        try {
            // 1. Find the user in the database
            const { data: userData, error: fetchError } = await supabase
                .from('workspace_users')
                .select('*')
                .eq('username', username)
                .eq('magic_code', magicCode.toUpperCase())
                .maybeSingle();

            if (fetchError || !userData) {
                throw new Error('ID Collaboratore o Magic Code non validi');
            }

            if (userData.invite_status === 'active') {
                throw new Error('Questo account è già stato attivato');
            }

            // 2. Create the Auth user
            // We use a temporary client to avoid session conflicts
            const tempClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            // Use a system email for the auth
            const authEmail = `${username.toLowerCase().replace(/\s+/g, '')}@aloe.system`;

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: authEmail,
                password: password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Errore creazione account di sistema");

            // 3. Update the database record
            const { error: updateError } = await supabase
                .from('workspace_users')
                .update({
                    user_id: authData.user.id,
                    password: password,
                    invite_status: 'active'
                })
                .eq('id', userData.id);

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Si è verificato un errore durante la configurazione');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
                <div className="bg-white rounded-[3rem] p-12 max-w-md w-full text-slate-900">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Password impostata!</h1>
                    <p className="text-slate-500 font-medium mb-8">Il tuo account è ora attivo. Verrai reindirizzato al login...</p>
                    <button onClick={() => navigate('/login')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Vai al Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-600 rounded-full blur-[150px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-blue-100">
                                <Sparkles className="text-blue-500" size={32} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Attiva Account</h1>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Collaboratore Esterno</p>
                        </div>

                        <form onSubmit={handleSetup} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Collaboratore</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        required
                                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        placeholder="Il tuo username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Magic Code</label>
                                <div className="relative">
                                    <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        required
                                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono uppercase"
                                        placeholder="E.G. ABCXYZ"
                                        value={magicCode}
                                        onChange={e => setMagicCode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scegli Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input
                                            required
                                            type="password"
                                            className="w-full pl-14 pr-5 py-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conferma Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input
                                            required
                                            type="password"
                                            className="w-full pl-14 pr-5 py-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !username || !magicCode || !password}
                                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Attiva Account <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupPassword;
