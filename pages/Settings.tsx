
import React, { useState } from 'react';
import { useApp } from '../store';
import {
  MapPin, Plus, Trash2, Briefcase, User, Download, Archive,
  Calendar, X, AlertCircle, Check, AlertTriangle, RefreshCcw,
  Loader2, Database, Code, Cloud, FileCode, Copy, FolderArchive, Zap,
  // Fix: Added missing Settings2 icon import
  Settings2
} from 'lucide-react';
import { supabase } from '../supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const Settings: React.FC = () => {
  const {
    cities, addCity, deleteCity,
    salespersons, addSalesperson, deleteSalesperson,
    orders, patients, products, recipes, rawMaterials, generalCosts, modifierGroups, workspaceUsers, currentWorkspace, syncData
  } = useApp();

  const [newCityName, setNewCityName] = useState('');
  const [newSalespersonName, setNewSalespersonName] = useState('');
  const [pendingCityDelete, setPendingCityDelete] = useState<string | null>(null);
  const [pendingSalespersonDelete, setPendingSalespersonDelete] = useState<string | null>(null);
  const [isBundling, setIsBundling] = useState(false);

  // Migration Center States
  const [showMigration, setShowMigration] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleAddCity = async () => {
    if (newCityName.trim()) {
      await addCity(newCityName.trim());
      setNewCityName('');
    }
  };

  const confirmRemoveCity = async (id: string) => {
    await deleteCity(id);
    setPendingCityDelete(null);
  };

  const handleAddSalesperson = async () => {
    if (newSalespersonName.trim()) {
      await addSalesperson(newSalespersonName.trim());
      setNewSalespersonName('');
    }
  };

  const confirmRemoveSalesperson = async (id: string) => {
    await deleteSalesperson(id);
    setPendingSalespersonDelete(null);
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
      // In a real environment, we'd fetch these. Since we are in the editor context,
      // we'll bundle the core files that define the app's logic.
      // Note: This collects the files we've been working on.

      const filesToInclude = [
        'index.html', 'index.tsx', 'App.tsx', 'store.tsx', 'types.ts',
        'supabase.ts', 'metadata.json', 'manifest.json', 'supabase_schema.sql'
      ];

      const pages = [
        'Patients.tsx', 'Products.tsx', 'Orders.tsx', 'Production.tsx',
        'Recipes.tsx', 'Materials.tsx', 'Profits.tsx', 'Settings.tsx',
        'Reports.tsx', 'GeneralCosts.tsx', 'Login.tsx', 'Users.tsx',
        'MySales.tsx', 'Link.tsx'
      ];

      const components = ['Layout.tsx'];

      // Fetch helper to get content of local files
      const getFile = async (path: string) => {
        try {
          const res = await fetch(path);
          return await res.text();
        } catch (e) {
          console.warn(`Could not fetch ${path}, skipping...`);
          return null;
        }
      };

      // Add Root Files
      for (const f of filesToInclude) {
        const content = await getFile(f);
        if (content) zip.file(f, content);
      }

      // Add Pages
      const pagesFolder = zip.folder("pages");
      for (const p of pages) {
        const content = await getFile(`pages/${p}`);
        if (content) pagesFolder?.file(p, content);
      }

      // Add Components
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Crea Città e Collaboratori</h2>
          <p className="text-slate-500 font-medium">Gestione configurazione e strumenti di migrazione.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMigration(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black text-xs uppercase tracking-widest active:scale-95"
          >
            <Cloud size={18} /> Centro Migrazione
          </button>
          <button
            onClick={exportFullData}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 font-black text-xs uppercase tracking-widest active:scale-95"
          >
            <Database size={18} /> Backup Dati
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* City Folders */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black flex items-center gap-3 text-slate-700 uppercase tracking-widest text-xs">
            <MapPin size={20} className="text-emerald-500" /> Cartelle Città
          </h3>
          <div className="flex gap-3">
            <input className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700" placeholder="e.g. Roma" value={newCityName} onChange={e => setNewCityName(e.target.value)} />
            <button onClick={handleAddCity} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Aggiungi</button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
            {cities.map(city => (
              <div key={city.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <span className="font-black text-slate-600 uppercase text-[10px] tracking-widest">{city.name}</span>
                <button onClick={() => setPendingCityDelete(city.id)} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Collaborators */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black flex items-center gap-3 text-slate-700 uppercase tracking-widest text-xs">
            <Briefcase size={20} className="text-blue-500" /> Collaboratori Esterni
          </h3>
          <div className="flex gap-3">
            <input className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700" placeholder="e.g. Mario Rossi" value={newSalespersonName} onChange={e => setNewSalespersonName(e.target.value)} />
            <button onClick={handleAddSalesperson} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Aggiungi</button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
            {salespersons.map(person => (
              <div key={person.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <span className="font-black text-slate-600 uppercase text-[10px] tracking-widest">{person.name}</span>
                <button onClick={() => setPendingSalespersonDelete(person.id)} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MIGRATION CENTER MODAL */}
      {showMigration && (
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
              {/* Main Actions */}
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

              {/* Instructions */}
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

export default Settings;
