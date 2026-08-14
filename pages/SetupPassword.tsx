
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
            const formattedUsername = username.trim().toLowerCase().replace(/\s+/g, '');
            const authEmail = `${formattedUsername}@aloe.system`;
            const cleanCode = magicCode.trim().toUpperCase();

            // 1. Authenticate with Supabase Auth using magic code as password
            let authUser: any = null;
            const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: cleanCode,
            });

            if (!signErr && signData?.user) {
                authUser = signData.user;
            } else {
                // Fallback for legacy invitations created before pre-signup
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

                const { data: signUpData, error: signUpErr } = await tempClient.auth.signUp({
                    email: authEmail,
                    password: cleanCode,
                });

                if (signUpErr) {
                    throw new Error('ID Collaboratore o Magic Code non validi');
                }

                // Now sign in with magic code
                const { data: retryAuth, error: retryErr } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: cleanCode,
                });

                if (retryErr || !retryAuth?.user) {
                    throw new Error('ID Collaboratore o Magic Code non validi');
                }

                authUser = retryAuth.user;
            }

            // 2. User is now authenticated! Update password in Supabase Auth
            const { error: updatePassErr } = await supabase.auth.updateUser({
                password: password
            });

            if (updatePassErr) throw updatePassErr;

            // 3. Update database record in workspace_users
            const { error: updateDbErr } = await supabase
                .from('workspace_users')
                .update({
                    user_id: authUser.id,
                    password: password,
                    invite_status: 'active'
                })
                .or(`user_id.eq.${authUser.id},username.ilike.${formattedUsername}`);

            if (updateDbErr) console.warn("DB record update warning:", updateDbErr);

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
