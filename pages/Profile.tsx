
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import {
    User, Mail, ShieldCheck, Check, Loader2, Sparkles,
    Cloud, Database, FolderArchive, Zap, X, AlertTriangle,
    Settings2, Download, Archive, RefreshCcw, FileCode, Copy,
    Smartphone, Clock
} from 'lucide-react';
import { supabase } from '../supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const Profile: React.FC = () => {
    const {
        currentUser, workspaceUsers, updateWorkspaceUser,
        currentWorkspace, updateWorkspace, patients, products,
        orders, recipes, rawMaterials, generalCosts,
        modifierGroups, cities, salespersons, syncData
    } = useApp();

    // Notification Section State (Local Profile Email)
    const [localEmail, setLocalEmail] = useState('');
    const [localName, setLocalName] = useState('');
    const [localPhone, setLocalPhone] = useState('');
    const [localAvailability, setLocalAvailability] = useState('');
    const [showAvailability, setShowAvailability] = useState(false);
    const [isSavingLocal, setIsSavingLocal] = useState(false);
    const [localSuccess, setLocalSuccess] = useState(false);

    // Admin Profile Section State (Workspace Owner Email)
    const [adminEmail, setAdminEmail] = useState(currentWorkspace?.ownerEmail || '');
    const [adminName, setAdminName] = useState(currentWorkspace?.ownerName || '');
    const [adminPhone, setAdminPhone] = useState(currentWorkspace?.ownerPhone || '');
    const [isSavingAdmin, setIsSavingAdmin] = useState(false);
    const [adminSuccess, setAdminSuccess] = useState(false);

    // Migration Center States
    const [showMigration, setShowMigration] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isBundling, setIsBundling] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

    // Find the workspace user record for the current user (checks both Supabase auth ID and mapping row ID)
    const userRecord = useMemo(() => workspaceUsers.find(u => u.userId === currentUser?.id || u.id === currentUser?.id), [workspaceUsers, currentUser]);

    React.useEffect(() => {
        if (userRecord) {
            setLocalEmail(userRecord.email || '');
            setLocalName(userRecord.name || '');
            setLocalPhone(userRecord.phone || '');
            setLocalAvailability(userRecord.availability || '');
        }
    }, [userRecord]);

    React.useEffect(() => {
        if (currentWorkspace) {
            setAdminEmail(currentWorkspace.ownerEmail || '');
            setAdminName(currentWorkspace.ownerName || '');
            setAdminPhone(currentWorkspace.ownerPhone || '');
        }
    }, [currentWorkspace]);

    const handleSaveLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userRecord) return;

        setIsSavingLocal(true);
        setLocalSuccess(false);

        try {
            await updateWorkspaceUser({
                ...userRecord,
                email: localEmail.trim(),
                name: localName.trim(),
                phone: localPhone.trim(),
                availability: localAvailability.trim()
            });
            setLocalSuccess(true);
            setTimeout(() => setLocalSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Errore durante il salvataggio');
        } finally {
            setIsSavingLocal(false);
        }
    };

    const handleSaveAdminProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWorkspace) return;

        setIsSavingAdmin(true);
        setAdminSuccess(false);

        try {
            await updateWorkspace({
                ...currentWorkspace,
                ownerEmail: adminEmail.trim(),
                ownerName: adminName.trim(),
                ownerPhone: adminPhone.trim()
            });
            setAdminSuccess(true);
            setTimeout(() => setAdminSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Errore durante il salvataggio');
        } finally {
            setIsSavingAdmin(false);
        }
    };

    const handleFullReset = async () => {
        if (!currentWorkspace?.id) return;
        setIsResetting(true);
        const tables = ['orders', 'patients', 'products', 'recipes', 'raw_materials', 'general_costs', 'modifier_groups', 'city_folders', 'salespersons', 'workspace_users'];
        try {
            for (const table of tables) {
                await supabase.from(table).delete().eq('workspace_id', currentWorkspace.id);
            }
            await syncData();
            setShowResetConfirm(false);
            alert("Database resettato.");
            window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setIsResetting(false);
        }
    };

    const exportFullData = () => {
        const backup = {
            timestamp: new Date().toISOString(),
            workspace: currentWorkspace,
            data: { patients, products, orders, recipes, rawMaterials, generalCosts, modifierGroups, cityFolders: cities, salespersons, workspaceUsers }
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ALOE_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const downloadProjectZip = async () => {
        setIsBundling(true);
        const zip = new JSZip();

        try {
            const filesToInclude = [
                'index.html', 'index.tsx', 'App.tsx', 'store.tsx', 'types.ts',
                'supabase.ts', 'metadata.json', 'manifest.json', 'supabase_schema.sql'
            ];

            const pages = [
                'Patients.tsx', 'Products.tsx', 'Orders.tsx', 'Production.tsx',
                'Recipes.tsx', 'Materials.tsx', 'Profits.tsx', 'Settings.tsx',
                'Reports.tsx', 'GeneralCosts.tsx', 'Login.tsx', 'Users.tsx',
                'MySales.tsx', 'Link.tsx', 'Profile.tsx'
            ];

            const components = ['Layout.tsx'];

            const getFile = async (path: string) => {
                try {
                    const res = await fetch(path);
                    return await res.text();
                } catch (e) {
                    console.warn(`Could not fetch ${path}, skipping...`);
                    return null;
                }
            };

            for (const f of filesToInclude) {
                const content = await getFile(f);
                if (content) zip.file(f, content);
            }

            const pagesFolder = zip.folder("pages");
            for (const p of pages) {
                const content = await getFile(`pages/${p}`);
                if (content) pagesFolder?.file(p, content);
            }

            const compFolder = zip.folder("components");
            for (const c of components) {
                const content = await getFile(`components/${c}`);
                if (content) compFolder?.file(c, content);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "aloe_di_elisabetta_project.zip");
        } catch (error) {
            console.error("Bundling failed:", error);
            alert("Errore durante la creazione del pacchetto. Assicurati di essere connesso.");
        } finally {
            setIsBundling(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* 1. Header Card */}
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-32 translate-x-32 blur-3xl group-hover:bg-emerald-100 transition-all duration-700"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200 shrink-0">
                        <User size={48} className="text-white" />
                    </div>

                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                            {isAdmin ? (currentWorkspace?.ownerName || 'Amministratore') : (userRecord?.name || currentUser.name || 'Collaboratore')}
                        </h2>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mt-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{isAdmin ? 'Amministratore' : 'Collaboratore Workspace'}</p>
                            </div>
                            {((isAdmin && currentWorkspace?.ownerPhone) || (!isAdmin && userRecord?.phone)) && (
                                <>
                                    <span className="hidden md:inline text-slate-300">•</span>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                        <Smartphone size={14} className="text-slate-400" />
                                        <span>{isAdmin ? currentWorkspace?.ownerPhone : userRecord?.phone}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Admin Sections (Only for Admin) */}
            {isAdmin && (
                <div className="space-y-8">
                    {/* Admin Email/Profile Black Box */}
                    <form onSubmit={handleSaveAdminProfile} className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group space-y-6">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center border-b border-slate-800 pb-6">
                            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 shrink-0">
                                <ShieldCheck size={32} />
                            </div>
                            <div className="flex-1 space-y-2 text-center md:text-left">
                                <h3 className="text-xl font-black uppercase tracking-tight text-white">Profilo Business (Admin)</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    Configura le tue informazioni di contatto e l'email master per i promemoria di fine cura dei pazienti.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Titolare</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Nome Titolare"
                                        className="w-full bg-slate-800 border border-slate-700 pl-12 pr-5 py-4 rounded-2xl font-black text-sm text-white outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefono Titolare</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="tel"
                                        placeholder="Telefono Titolare"
                                        className="w-full bg-slate-800 border border-slate-700 pl-12 pr-5 py-4 rounded-2xl font-black text-sm text-white outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                                        value={adminPhone}
                                        onChange={(e) => setAdminPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email per Notifiche (GCal)</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="email"
                                        placeholder="tua_email@gmail.com"
                                        className="w-full bg-slate-800 border border-slate-700 pl-12 pr-5 py-4 rounded-2xl font-black text-sm text-blue-400 outline-none focus:ring-4 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingAdmin}
                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-900/30 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSavingAdmin ? <Loader2 size={16} className="animate-spin" /> : (adminSuccess ? <Check size={16} className="text-emerald-400" /> : <Sparkles size={16} />)}
                                {adminSuccess ? 'Impostazioni Salvate!' : 'Salva Profilo Admin'}
                            </button>
                        </div>
                    </form>

                    {/* Growth & Safety Tools */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Strumenti Business</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Migrazione e Salvataggio Dati</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={() => setShowMigration(true)}
                                className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black text-xs uppercase tracking-widest active:scale-95"
                            >
                                <Cloud size={18} /> Centro Migrazione
                            </button>
                            <button
                                onClick={exportFullData}
                                className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 font-black text-xs uppercase tracking-widest active:scale-95"
                            >
                                <Database size={18} /> Backup Dati
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Personal Profile Section (For Collaborators) */}
            {!isAdmin && userRecord && (
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Il Mio Profilo</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Gestisci i tuoi contatti e la tua disponibilità</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAvailability(true)}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-emerald-100 transition-all font-black text-xs uppercase tracking-widest active:scale-95 shadow-sm shadow-emerald-50 shrink-0"
                        >
                            <Clock size={16} /> Disponibilità
                        </button>
                    </div>

                    <form onSubmit={handleSaveLocal} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                        placeholder="Nome Cognome"
                                        type="text"
                                        value={localName}
                                        onChange={e => setLocalName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numero di Telefono</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                        placeholder="+39 333 1234567"
                                        type="tel"
                                        value={localPhone}
                                        onChange={e => setLocalPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Gmail per Promemoria Personali</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input
                                    className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                                    placeholder="la_tua_email@gmail.com"
                                    type="email"
                                    value={localEmail}
                                    onChange={e => setLocalEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase ml-2">
                                Questa email verrà usata per generare i link di Google Calendar quando imposti una fine cura per un paziente.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSavingLocal}
                            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-30 flex items-center justify-center gap-3 active:scale-95"
                        >
                            {isSavingLocal ? <Loader2 size={18} className="animate-spin" /> : (localSuccess ? <Check size={18} className="text-emerald-400" /> : <Sparkles size={18} />)}
                            {localSuccess ? 'Profilo Aggiornato!' : (isSavingLocal ? 'Salvataggio...' : 'Salva Impostazioni')}
                        </button>
                    </form>
                </div>
            )}

            {/* Disponibilità Modal */}
            {!isAdmin && showAvailability && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl flex flex-col border border-white/20">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Disponibilità</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Imposta i giorni e gli orari in cui sei disponibile</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAvailability(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <textarea
                                rows={8}
                                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-medium text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none text-sm leading-relaxed"
                                placeholder="Scrivi qui la tua disponibilità (es: Lun-Ven 9:00 - 18:00, Sabato mattina)..."
                                value={localAvailability}
                                onChange={e => setLocalAvailability(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAvailability(false)}
                                    className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!userRecord) return;
                                        setIsSavingLocal(true);
                                        try {
                                            await updateWorkspaceUser({
                                                ...userRecord,
                                                availability: localAvailability.trim()
                                            });
                                            setShowAvailability(false);
                                        } catch (err: any) {
                                            alert(`Errore: ${err.message}`);
                                        } finally {
                                            setIsSavingLocal(false);
                                        }
                                    }}
                                    className="flex-[2] bg-emerald-600 text-white py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isSavingLocal ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Salva Disponibilità
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Migration Modal */}
            {isAdmin && showMigration && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 md:p-10">
                    <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl h-full flex flex-col overflow-hidden">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-100">
                                    <Cloud size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Centro Migrazione</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Pronto per Google Antigravity</p>
                                </div>
                            </div>
                            <button onClick={() => setShowMigration(false)} className="p-4 hover:bg-white rounded-[1.5rem] text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-10 scrollbar-hide">
                            <div className="lg:col-span-1 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Passo 1: Esportazione</h4>
                                    <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100 space-y-6 shadow-sm">
                                        <p className="text-xs text-blue-900 leading-relaxed font-bold uppercase">Scarica l'intero codice sorgente e la struttura per il nuovo server.</p>

                                        <button
                                            onClick={downloadProjectZip}
                                            disabled={isBundling}
                                            className="w-full bg-blue-600 text-white py-5 rounded-2xl flex items-center justify-between px-6 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isBundling ? <Loader2 className="animate-spin" size={20} /> : <FolderArchive size={20} />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{isBundling ? 'Generazione...' : 'Scarica Sorgenti (.ZIP)'}</span>
                                            </div>
                                            {!isBundling && <Zap size={16} className="text-blue-200" />}
                                        </button>

                                        <button
                                            onClick={exportFullData}
                                            className="w-full bg-white border-2 border-blue-100 text-blue-600 py-5 rounded-2xl flex items-center justify-between px-6 hover:bg-blue-100/50 transition-all font-black uppercase tracking-widest text-[10px]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Database size={20} />
                                                <span>Esporta Dati JSON</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[3rem] space-y-4">
                                    <div className="flex items-center gap-2 text-rose-700">
                                        <AlertTriangle size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Pulisci Ambiente</span>
                                    </div>
                                    <p className="text-[10px] text-rose-600 font-bold leading-relaxed uppercase">Rimuovi tutti i dati correnti se vuoi iniziare da zero nella nuova installazione.</p>
                                    {!showResetConfirm ? (
                                        <button onClick={() => setShowResetConfirm(true)} className="w-full bg-rose-600 text-white py-4 rounded-xl text-[10px] font-black shadow-lg shadow-rose-100">Svuota Workspace</button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <button onClick={handleFullReset} className="bg-red-700 text-white py-4 rounded-xl text-[10px] font-black">CONFERMA ELIMINAZIONE</button>
                                            <button onClick={() => setShowResetConfirm(false)} className="text-rose-400 text-[10px] font-black text-center py-2">Annulla</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-8">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Passo 2: Istruzioni per Google Antigravity</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4 shadow-2xl">
                                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                                            <Database className="text-white" size={24} />
                                        </div>
                                        <h5 className="font-black uppercase text-sm tracking-tight">1. Database</h5>
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                            Crea un nuovo progetto su **Supabase**. Apri il SQL Editor e incolla il contenuto di <code className="text-blue-400">supabase_schema.sql</code> (che trovi nello ZIP). Esegui lo script per creare le tabelle.
                                        </p>
                                    </div>

                                    <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-4 shadow-sm">
                                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                            <Cloud className="text-white" size={24} />
                                        </div>
                                        <h5 className="font-black uppercase text-sm tracking-tight text-slate-800">2. Hosting</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            Estrai i file dello ZIP. Carica l'intero contenuto sul tuo bucket **Google Antigravity** o qualsiasi server di file statici. Assicurati che <code className="text-emerald-600 font-black">index.html</code> sia nella root.
                                        </p>
                                    </div>

                                    <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-4 shadow-sm md:col-span-2">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                <Settings2 size={24} className="text-white" />
                                            </div>
                                            <h5 className="font-black uppercase text-sm tracking-tight text-slate-800">3. Configurazione Finale</h5>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            Una volta caricati i file, apri <code className="text-amber-600 font-black">supabase.ts</code> e sostituisci l'URL e la Anon Key con quelli del tuo nuovo progetto Supabase. L'app si connetterà istantaneamente e sarà pronta all'uso.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                                    <Check className="text-emerald-600" size={24} />
                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                                        Tutti i file nello ZIP sono configurati per funzionare immediatamente dopo l'estrazione.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
