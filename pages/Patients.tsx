import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { Patient, MedicalState, JournalEntry } from '../types';
import {
  Plus, Search, ChevronRight, UserPlus, Trash2, History,
  X, Calendar, Tag, Layers, Edit2, FileText, Download,
  Loader2, Activity, Scale, Clipboard, Save, MessageSquare, UploadCloud, Smartphone, User, ScrollText, Check
} from 'lucide-react';

const Patients: React.FC = () => {
  const { patients, addPatient, updatePatient, deletePatient, cities, currentUser, salespersons, currentWorkspace, updateWorkspace, workspaceUsers } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [showJournal, setShowJournal] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | 'Tutte'>('Tutte');
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string | 'Tutti'>('Tutti');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerText, setDisclaimerText] = useState('');
  const [isSavingDisclaimer, setIsSavingDisclaimer] = useState(false);

  const DEFAULT_DOSAGE_INITIAL = "Assumere l'aloe sempre almeno mezz'ora prima dei pasti principali in luce soffusa.";
  const DEFAULT_DOSAGE_EARLY = "1 cucchiaio a colazione";
  const DEFAULT_DOSAGE_MID = "1 cucchiaio a colazione e 1 cucchiaio a cena ( o prima di coricarsi)";
  const DEFAULT_DOSAGE_LATE = "1 e 1/2 cucchiaio a colazione, 1 e 1/2 cucchiaio a cena ( o prima di coricarsi). Continuare con questa assunzione fino al termine del barattolo";

  const openSomministrazione = () => {
    setFormData(prev => ({
      ...prev,
      dosageInitial: prev.dosageInitial || DEFAULT_DOSAGE_INITIAL,
      dosageEarlyDays: prev.dosageEarlyDays || DEFAULT_DOSAGE_EARLY,
      dosageMidDays: prev.dosageMidDays || DEFAULT_DOSAGE_MID,
      dosageLateDays: prev.dosageLateDays || DEFAULT_DOSAGE_LATE,
    }));
    setShowSomministrazione(true);
  };

  const [showSomministrazione, setShowSomministrazione] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Journal form state
  const [newJournal, setNewJournal] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    healthStatus: '',
    aloeDosage: '',
    weight: ''
  });

  const protocolRef = useRef<HTMLDivElement>(null);
  const [activeProtocolPatient, setActiveProtocolPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState<Partial<Patient>>({
    firstName: '', lastName: '', phone: '', address: '',
    city: '', medicalCondition: '',
    aloeTweak: '', testResults: '',
    dosageMorningWhole: '1', dosageMorningFraction: '½',
    dosageEveningWhole: '1', dosageEveningFraction: '½',
    dosageInitial: "Assumere l'aloe sempre almeno mezz'ora prima dei pasti principali in luce soffusa.",
    dosageEarlyDays: "1 cucchiaio a colazione",
    dosageMidDays: "1 cucchiaio a colazione e 1 cucchiaio a cena ( o prima di coricarsi)",
    dosageLateDays: "1 e 1/2 cucchiaio a colazione, 1 e 1/2 cucchiaio a cena ( o prima di coricarsi). Continuare con questa assunzione fino al termine del barattolo",
    showMaintenance: true,
    showWhatsappText: true
  });

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      ...patient,
      dosageInitial: patient.dosageInitial || "Assumere l'aloe sempre almeno mezz'ora prima dei pasti principali in luce soffusa.",
      dosageEarlyDays: patient.dosageEarlyDays || "1 cucchiaio a colazione",
      dosageMidDays: patient.dosageMidDays || "1 cucchiaio a colazione e 1 cucchiaio a cena ( o prima di coricarsi)",
      dosageLateDays: patient.dosageLateDays || "1 e 1/2 cucchiaio a colazione, 1 e 1/2 cucchiaio a cena ( o prima di coricarsi). Continuare con questa assunzione fino al termine del barattolo",
      showMaintenance: patient.showMaintenance ?? true,
      showWhatsappText: patient.showWhatsappText ?? true
    });
    setShowAdd(true);
  };

  const closePatientModal = () => {
    setShowAdd(false);
    setEditingPatient(null);
    setFormData({
      firstName: '', lastName: '', phone: '', address: '',
      city: [...cities].sort((a, b) => a.name.localeCompare(b.name))[0]?.name || '',
      medicalCondition: '',
      aloeTweak: '', testResults: '',
      dosageMorningWhole: '1', dosageMorningFraction: '½',
      dosageEveningWhole: '1', dosageEveningFraction: '½',
      salespersonId: currentUser?.role === 'collaborator' ? currentUser.salespersonId : '',
      dosageInitial: "Assumere l'aloe sempre almeno mezz'ora prima dei pasti principali in luce soffusa.",
      dosageEarlyDays: "1 cucchiaio a colazione",
      dosageMidDays: "1 cucchiaio a colazione e 1 cucchiaio a cena ( o prima di coricarsi)",
      dosageLateDays: "1 e 1/2 cucchiaio a colazione, 1 e 1/2 cucchiaio a cena ( o prima di coricarsi). Continuare con questa assunzione fino al termine del barattolo",
      showMaintenance: true,
      showWhatsappText: true
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await updatePatient({ ...editingPatient, ...formData as Patient });
      } else {
        await addPatient({ ...formData, journal: [] } as Omit<Patient, 'id' | 'workspaceId'>);
      }
      closePatientModal();
    } catch (error: any) {
      alert(`Errore nel salvataggio: ${error.message || 'Contattare supporto'}`);
      console.error(error);
    }
  };

  const handleAddJournal = async () => {
    if (!showJournal || !newJournal.healthStatus) return;

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: newJournal.date || new Date().toISOString(),
      healthStatus: newJournal.healthStatus,
      aloeDosage: newJournal.aloeDosage || '',
      weight: newJournal.weight || ''
    };

    const updatedJournal = [entry, ...(showJournal.journal || [])];
    const updatedPatient = { ...showJournal, journal: updatedJournal };

    await updatePatient(updatedPatient);
    setShowJournal(updatedPatient);
    setNewJournal({
      date: new Date().toISOString().split('T')[0],
      healthStatus: '',
      aloeDosage: '',
      weight: ''
    });
  };

  const removeJournalEntry = async (entryId: string) => {
    if (!showJournal) return;
    const updatedJournal = (showJournal.journal || []).filter(e => e.id !== entryId);
    const updatedPatient = { ...showJournal, journal: updatedJournal };
    await updatePatient(updatedPatient);
    setShowJournal(updatedPatient);
  };

  const removePatient = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo paziente e tutta la sua storia clinica?')) {
      await deletePatient(id);
    }
  };

  const handleDownloadProtocol = async (patient: Patient) => {
    setIsGenerating(patient.id);
    setActiveProtocolPatient({
      ...patient,
      dosageInitial: patient.dosageInitial || "Assumere l'aloe sempre almeno mezz'ora prima dei pasti principali in luce soffusa.",
      dosageEarlyDays: patient.dosageEarlyDays || "1 cucchiaio a colazione",
      dosageMidDays: patient.dosageMidDays || "1 cucchiaio a colazione e 1 cucchiaio a cena ( o prima di coricarsi)",
      dosageLateDays: patient.dosageLateDays || "1 e 1/2 cucchiaio a colazione, 1 e 1/2 cucchiaio a cena ( o prima di coricarsi). Continuare con questa assunzione fino al termine del barattolo",
      showMaintenance: patient.showMaintenance ?? true,
      showWhatsappText: patient.showWhatsappText ?? true
    });

    setTimeout(async () => {
      if (!protocolRef.current) return;

      const opt = {
        margin: 0,
        filename: `Scheda_Paziente_${patient.firstName}_${patient.lastName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        // @ts-ignore
        await html2pdf().set(opt).from(protocolRef.current).save();
      } catch (err) {
        console.error("PDF generation failed", err);
      } finally {
        setIsGenerating(null);
        setActiveProtocolPatient(null);
      }
    }, 200);
  };

  const generateCalendarLink = (patient: Patient) => {
    if (!patient.treatmentDuration) return null;

    const durationMonths = parseInt(patient.treatmentDuration);
    const now = new Date();

    // Logic: Order in Month X (now.getMonth())
    // Treatment starts in Month X + 1
    // Cycle is D months long (durationMonths)
    // Reminder is for the 1st day of the LAST month of the cycle: X + D
    const reminderDate = new Date(now.getFullYear(), now.getMonth() + durationMonths, 1);

    const year = reminderDate.getFullYear();
    const month = String(reminderDate.getMonth() + 1).padStart(2, '0');
    const day = "01";

    const dateStr = `${year}${month}${day}`;
    const title = encodeURIComponent(`*Ultimo mese cura - ${patient.firstName} ${patient.lastName}, ${patient.city || ''}, ${patient.phone || ''}`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=Promemoria+automatico+fine+cura+Aloe+di+Elisabetta.`;
  };

  // For collaborators, only show their own patients
  const visiblePatients = isAdmin
    ? patients
    : patients.filter(p => p.salespersonId === currentUser?.salespersonId);

  const filtered = visiblePatients.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());

    // Robust city matching: handles both city names and IDs stored in the patient record
    const matchesCity = selectedCity === 'Tutte' || (() => {
      if (!p.city) return false;
      const normalizedSelected = selectedCity.trim().toLowerCase();
      const normalizedPatientCity = p.city.trim().toLowerCase();

      // 1. Direct name match
      if (normalizedPatientCity === normalizedSelected) return true;

      // 2. ID match: check if p.city is an ID that belongs to a city with the selected name
      // This handles cases where the city might have been stored as a UUID
      const cityById = cities.find(c => c.id === p.city);
      if (cityById && cityById.name.trim().toLowerCase() === normalizedSelected) return true;

      return false;
    })();

    const matchesSalesperson = selectedSalespersonId === 'Tutti' || p.salespersonId === selectedSalespersonId;

    return matchesSearch && matchesCity && matchesSalesperson;
  }).sort((a, b) => {
    // Alphabetical order: Last Name, then First Name
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const handleSaveDisclaimer = async () => {
    if (!currentWorkspace) return;
    setIsSavingDisclaimer(true);
    try {
      await updateWorkspace({ ...currentWorkspace, disclaimer: disclaimerText });
      setShowDisclaimer(false);
    } catch (err: any) {
      alert(`Errore nel salvataggio: ${err.message}`);
    } finally {
      setIsSavingDisclaimer(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestione Pazienti <span className="text-xs bg-red-500 text-white px-2 py-1 rounded ml-2">v2.0</span></h2>
          <p className="text-slate-500 font-medium">Onboarding, protocolli e monitoraggio mensile.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => {
                setDisclaimerText(currentWorkspace?.disclaimer || '');
                setShowDisclaimer(true);
              }}
              className="bg-slate-100 text-slate-600 px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95 border border-slate-200"
            >
              <ScrollText size={16} /> Privacy
            </button>
          )}
          <button
            onClick={() => {
              setFormData({
                firstName: '', lastName: '', phone: '', address: '',
                city: [...cities].sort((a, b) => a.name.localeCompare(b.name))[0]?.name || '',
                medicalCondition: '',
                aloeTweak: '', testResults: '',
                dosageMorningWhole: '1', dosageMorningFraction: '½',
                dosageEveningWhole: '1', dosageEveningFraction: '½'
              });
              setShowAdd(true);
            }}
            className="bg-green-600 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-100 font-black text-xs uppercase tracking-widest active:scale-95"
          >
            <UserPlus size={18} /> Registra Paziente
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
        <div className="relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400/50" size={22} />
          <input
            type="text"
            placeholder="Cerca paziente per nome o cognome..."
            className="pl-16 pr-8 py-5 w-full border border-slate-50 bg-slate-50 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-green-500/10 font-black text-slate-700 text-lg shadow-inner transition-all placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide bg-slate-50/30 p-2 rounded-2xl border border-slate-50/50">
          <button
            onClick={() => setSelectedCity('Tutte')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCity === 'Tutte' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Tutte
          </button>
          {[...cities].sort((a, b) => a.name.localeCompare(b.name)).map(city => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.name)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCity === city.name ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide bg-orange-50/30 p-2 rounded-2xl border border-orange-50/50">
            <button
              onClick={() => setSelectedSalespersonId('Tutti')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedSalespersonId === 'Tutti' ? 'bg-orange-600 text-white shadow-lg' : 'text-orange-400 hover:text-orange-600'}`}
            >
              Tutti Pazienti
            </button>
            {salespersons.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSalespersonId(s.id)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedSalespersonId === s.id ? 'bg-orange-600 text-white shadow-lg' : 'text-orange-400 hover:text-orange-600'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(patient => (
          <div key={patient.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative flex flex-col">
            {/* Header Section with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-300 text-xl shadow-inner uppercase shrink-0">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight leading-none">{patient.firstName} {patient.lastName}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5"><Tag size={10} className="text-green-500" /> {patient.city}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <User size={10} className="text-orange-500" />
                      {salespersons.find(s => s.id === patient.salespersonId)?.name || 'Elisabetta'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 shrink-0 shadow-inner">
                {/* Top Row: Download & Edit */}
                <button
                  onClick={() => handleDownloadProtocol(patient)}
                  className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-sm rounded-xl transition-all flex items-center justify-center"
                  title="Scarica Scheda Tecnica"
                >
                  {isGenerating === patient.id ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                </button>
                <button
                  onClick={() => handleOpenEdit(patient)}
                  className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-xl transition-all flex items-center justify-center"
                  title="Modifica"
                >
                  <Edit2 size={16} />
                </button>

                {/* Bottom Row: Diario & Delete (or Calendar) */}
                <button
                  onClick={() => setShowJournal(patient)}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all flex items-center justify-center"
                  title="Diario Salute"
                >
                  <Activity size={16} />
                </button>
                <button
                  onClick={() => removePatient(patient.id)}
                  className="p-2.5 text-red-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-xl transition-all flex items-center justify-center"
                  title="Elimina Paziente"
                >
                  <Trash2 size={16} />
                </button>

                {patient.treatmentDuration && (
                  <a
                    href={generateCalendarLink(patient) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-center flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider"
                    title="Aggiungi Promemoria Fine Cura a Google Calendar"
                  >
                    <Calendar size={12} /> Google Calendar
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Cura</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 italic">
                  {patient.aloeTweak || 'Nessuna nota specifica.'}
                </p>
              </div>

              {(patient.journal?.length || 0) > 0 && (
                <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                  <History size={12} />
                  <span>{patient.journal?.length} aggiornamenti clinici</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowJournal(patient)}
              className="w-full mt-6 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2"
            >
              Apri Diario Salute <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* JOURNAL MODAL */}
      {showJournal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Diario Salute</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{showJournal.firstName} {showJournal.lastName}</p>
                </div>
              </div>
              <button onClick={() => setShowJournal(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 scrollbar-hide">
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Plus size={16} className="text-blue-500" /> Nuovo Check-up Mensile
                </h4>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                      <input type="date" className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none" value={newJournal.date} onChange={e => setNewJournal({ ...newJournal, date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (kg)</label>
                      <div className="relative">
                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="text" placeholder="70.5" className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none" value={newJournal.weight} onChange={e => setNewJournal({ ...newJournal, weight: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stato di Salute / Sintomi</label>
                    <textarea rows={3} className="w-full p-5 border border-slate-200 rounded-[1.5rem] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Come si sente il paziente questo mese?" value={newJournal.healthStatus} onChange={e => setNewJournal({ ...newJournal, healthStatus: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Dosaggio Aloe Applicato</label>
                    <input className="w-full p-5 border border-blue-100 bg-white rounded-2xl font-bold text-blue-800 outline-none" placeholder="E.g. 2 cucchiai x 3 volte al dì" value={newJournal.aloeDosage} onChange={e => setNewJournal({ ...newJournal, aloeDosage: e.target.value })} />
                  </div>
                  <button onClick={handleAddJournal} disabled={!newJournal.healthStatus} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30">Registra Aggiornamento</button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                  <History size={16} className="text-slate-400" /> Cronologia Progressi
                </h4>
                <div className="space-y-4">
                  {(showJournal.journal || []).map((entry, idx) => (
                    <div key={entry.id} className="relative pl-8 group">
                      <div className="absolute left-0 top-2 bottom-0 w-0.5 bg-slate-100 group-last:bg-transparent"></div>
                      <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                      <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all space-y-3 relative">
                        <button
                          onClick={() => removeJournalEntry(entry.id)}
                          className="absolute top-4 right-4 text-slate-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> {new Date(entry.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {entry.weight && (
                            <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-[9px] font-black border border-slate-100">{entry.weight} KG</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{entry.healthStatus}</p>
                        {entry.aloeDosage && (
                          <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{entry.aloeDosage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(showJournal.journal || []).length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <Clipboard size={40} className="mx-auto text-slate-200 mb-3 opacity-30" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nessuno storico presente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        <div ref={protocolRef} className="bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>
          {(() => {
            const salespersonId = activeProtocolPatient?.salespersonId;
            const assocUser = workspaceUsers.find(u => u.salespersonId === salespersonId);
            const salesperson = salespersons.find(s => s.id === salespersonId);

            const name = salespersonId
              ? (assocUser?.name || assocUser?.username || salesperson?.name || 'Collaboratore')
              : (currentWorkspace?.ownerName || 'Elisabetta');

            const phone = salespersonId
              ? (assocUser?.phone || '')
              : (currentWorkspace?.ownerPhone || '3620871005');

            const availability = salespersonId
              ? (assocUser?.availability || 'contattabile via telefono o messaggio')
              : (currentWorkspace?.ownerAvailability || 'contattabile via telefono o messaggio');

            return (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-red-600 mb-1">{name} {phone ? `- ${phone}` : ''}</h1>
                <p className="text-sm text-red-500 font-medium">{availability}</p>
              </div>
            );
          })()}

          <div className="absolute top-10 right-10">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-emerald-500">
              <span className="text-2xl">🌱</span>
            </div>
          </div>

          <table className="w-full border-collapse border border-black mb-8">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Nome & telefono</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.firstName} {activeProtocolPatient?.lastName} - {activeProtocolPatient?.phone}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Patologia</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.medicalCondition}</td>
              </tr>
              {activeProtocolPatient?.treatmentDuration && (
                <tr>
                  <td className="border border-black p-2 font-bold align-top text-sm">Durata Cura</td>
                  <td className="border border-black p-2 align-top text-sm font-bold text-red-600">{activeProtocolPatient?.treatmentDuration}</td>
                </tr>
              )}
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm h-64">Cura</td>
                <td className="border border-black p-4 align-top text-sm relative">
                  <div className="mb-4 whitespace-pre-wrap">{activeProtocolPatient?.aloeTweak}</div>

                  <div className="w-full absolute bottom-4 left-0 right-0 max-w-[90%] mx-auto flex flex-col gap-2">
                    {activeProtocolPatient?.showMaintenance !== false && (
                      <div className="bg-green-400 p-2 font-bold text-xs border border-green-600 text-center w-full">
                        ALLA FINE DELLA CURA INIZIALE,PER MANTENERE IL BENESSERE
                        RAGGIUNTO E SEMPRE ALTE LE DIFESE IMMUNITARIE,CONSIGLIO 2
                        BARATTOLI IN PRIMAVERA E 2 BARATTOLI IN AUTUNNO.
                      </div>
                    )}

                    {activeProtocolPatient?.showWhatsappText !== false && (
                      <div className="bg-pink-100 p-2 font-bold text-xs border border-pink-300 text-pink-700 text-center w-full">
                        Rispettando la vostra privacy vi aggiungero' al gruppo Whatapp 'Aloe di Elisabetta' per ricordarvi i richiami primaverili e autunnali.
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Controllo Esami</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.testResults}</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-orange-400 text-black font-bold p-2 text-center text-sm mb-2 uppercase">
            Ricorda di ordinarmi l’Aloe entro il 26 per il mese successivo
          </div>

          <div className="text-center font-bold text-md mb-6">
            L’Aloe lo preparo sempre la prima settimana di ogni mese.
            <p className="text-xs font-normal mt-1 text-slate-500">Il barattolo va sempre tenuto in frigo e sbattuto.</p>
          </div>

          <table className="w-full border-collapse border border-black text-sm mb-6">
            <tbody>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50 w-1/3">Assunzione iniziale:</td>
                <td className="border border-black p-3" style={{ whiteSpace: 'pre-wrap' }}>{activeProtocolPatient?.dosageInitial}</td>
              </tr>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50">Per 3 giorni:</td>
                <td className="border border-black p-3" style={{ whiteSpace: 'pre-wrap' }}>{activeProtocolPatient?.dosageEarlyDays}</td>
              </tr>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50">Dal 4° al 6° giorno:</td>
                <td className="border border-black p-3" style={{ whiteSpace: 'pre-wrap' }}>{activeProtocolPatient?.dosageMidDays}</td>
              </tr>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50">Dal 7° giorno:</td>
                <td className="border border-black p-3" style={{ whiteSpace: 'pre-wrap' }}>{activeProtocolPatient?.dosageLateDays}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-[11px] text-blue-800 leading-relaxed text-justify border-t border-blue-50 pt-4">
            <strong>Un consiglio importante:</strong> tra un mese e l'altro, <u>specialmente dal 2° mese in poi, ti chiedo di sospendere l'assunzione per una settimana.</u>
            <br /><br />
            Questo serve a verificare la risposta del tuo organismo. Come insegnava Padre Romano Zago, se in quella settimana di pausa ti senti in forze, il beneficio è consolidato.
            Se invece i sintomi tendono a ripresentarsi, è segno che è necessario continuare la cura per il periodo che abbiamo stabilito insieme.
          </p>

          {currentWorkspace?.disclaimer && (
            <div style={{ pageBreakBefore: 'always', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '8px' }}>Privacy</p>
              <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{currentWorkspace.disclaimer}</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-100">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingPatient ? 'Modifica Scheda' : 'Nuovo Onboarding (v3.0)'}</h3>
              </div>
              <button onClick={closePatientModal} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                    <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cognome</label>
                    <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefono</label>
                    <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indirizzo</label>
                    <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Città</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none appearance-none" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}>
                      {[...cities].sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patologie</label>
                    <textarea rows={4} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all resize-none" value={formData.medicalCondition} onChange={e => setFormData({ ...formData, medicalCondition: e.target.value })} placeholder="E.g. Diabete di tipo 2, Ipertensione..." />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Clipboard size={12} /> Indicazioni Protocollo Aloe (Base)
                  </label>
                  <textarea rows={4} className="w-full p-5 bg-white border border-emerald-100 rounded-[2rem] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner" value={formData.aloeTweak} onChange={e => setFormData({ ...formData, aloeTweak: e.target.value })} placeholder="Dettaglia la cura e frequenza di assunzione consigliata..." />
                </div>

                <div className="space-y-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Somministrazione e Dosaggi</label>
                    <button
                      type="button"
                      onClick={openSomministrazione}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-100 flex items-center gap-1.5 shrink-0"
                    >
                      <Layers size={12} /> Personalizza Somministrazione
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100/80">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">1. Assunzione Iniziale</p>
                      <p className="text-[11px] font-medium text-slate-600 line-clamp-2">{formData.dosageInitial}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100/80">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">2. Per 3 Giorni</p>
                      <p className="text-[11px] font-medium text-slate-600 line-clamp-2">{formData.dosageEarlyDays}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100/80">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">3. Dal 4° al 6° Giorno</p>
                      <p className="text-[11px] font-medium text-slate-600 line-clamp-2">{formData.dosageMidDays}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100/80">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">4. Dal 7° Giorno</p>
                      <p className="text-[11px] font-medium text-slate-600 line-clamp-2">{formData.dosageLateDays}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durata Cura</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none appearance-none" value={formData.treatmentDuration} onChange={e => setFormData({ ...formData, treatmentDuration: e.target.value })}>
                      <option value="">Scegli durata...</option>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={`${m} ${m === 1 ? 'mese' : 'mesi'}`}>{m} {m === 1 ? 'mese' : 'mesi'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Controllo Esami</label>
                    <textarea rows={1} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.testResults} onChange={e => setFormData({ ...formData, testResults: e.target.value })} placeholder="Note esami..." />
                  </div>
                  {isAdmin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Titolare (Collaboratore)</label>
                      <select className="w-full p-4 bg-white border border-orange-100 rounded-2xl font-black text-slate-700 outline-none appearance-none" value={formData.salespersonId} onChange={e => setFormData({ ...formData, salespersonId: e.target.value })}>
                        <option value="">Elisabetta</option>
                        {salespersons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-3 bg-green-50/50 p-6 rounded-3xl border border-green-100 mt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <label className="text-[11px] font-black text-green-700 uppercase tracking-widest leading-relaxed">
                      Mostrare il testo nel PDF?<br/>
                      <span className="text-green-600/70 text-[9px] normal-case tracking-normal">Mantenere il benessere raggiunto 2 barattoli primavera, 2 barattoli autunno</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showMaintenance: true })}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          formData.showMaintenance !== false
                            ? 'bg-green-500 text-white shadow-md shadow-green-200 scale-105'
                            : 'bg-white text-green-400 border border-green-100 hover:bg-green-50'
                        }`}
                      >
                        SI
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showMaintenance: false })}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          formData.showMaintenance === false
                            ? 'bg-slate-400 text-white shadow-md shadow-slate-200 scale-105'
                            : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-pink-50 p-6 rounded-3xl border border-pink-100 mt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <label className="text-[11px] font-black text-pink-700 uppercase tracking-widest leading-relaxed">
                      Mostrare il testo nel PDF?<br/>
                      <span className="text-pink-600/70 text-[9px] normal-case tracking-normal">Rispettando la vostra privacy vi aggiungero' al gruppo Whatapp 'Aloe di Elisabetta' per ricordarvi i richiami primaverili e autunnali.</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showWhatsappText: true })}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          formData.showWhatsappText !== false
                            ? 'bg-pink-500 text-white shadow-md shadow-pink-200 scale-105'
                            : 'bg-white text-pink-400 border border-pink-100 hover:bg-pink-50'
                        }`}
                      >
                        SI
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, showWhatsappText: false })}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          formData.showWhatsappText === false
                            ? 'bg-slate-400 text-white shadow-md shadow-slate-200 scale-105'
                            : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4">
                  <button type="button" onClick={closePatientModal} className="flex-1 min-w-[100px] py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Annulla</button>

                  {editingPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        removePatient(editingPatient.id);
                        closePatientModal();
                      }}
                      className="px-5 py-4 bg-red-50 text-red-600 border border-red-100 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      title="Elimina Paziente"
                    >
                      <Trash2 size={14} /> Elimina
                    </button>
                  )}
                  
                  {isAdmin && editingPatient && (
                    <button
                      type="button"
                      onClick={() => handleDownloadProtocol({ ...editingPatient, ...formData } as Patient)}
                      className="flex-1 min-w-[150px] bg-emerald-600 text-white py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isGenerating === editingPatient.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      Scarica Scheda
                    </button>
                  )}

                  <button type="submit" className="flex-[2] min-w-[180px] bg-green-600 text-white py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95">
                    {editingPatient ? 'Aggiorna Paziente' : 'Finalizza Registrazione'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DISCLAIMER MODAL */}
      {/* PRIVACY MODAL */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
                  <ScrollText size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Informativa Privacy PDF</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configura il testo dell'informativa privacy</p>
                </div>
              </div>
              <button onClick={() => setShowDisclaimer(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Testo dell'Informativa</label>
                <textarea
                  rows={10}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-slate-500/10 transition-all text-sm"
                  placeholder="Scrivi qui il testo dell'informativa privacy che apparirà in fondo al PDF del paziente..."
                  value={disclaimerText}
                  onChange={e => setDisclaimerText(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowDisclaimer(false)}
                  className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveDisclaimer}
                  disabled={isSavingDisclaimer}
                  className="flex-[2] bg-slate-900 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-100 hover:bg-slate-850 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingDisclaimer ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salva Privacy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOMMINISTRAZIONE MODAL */}
      {showSomministrazione && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Somministrazione</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configura le fasi di dosaggio dell'Aloe</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowSomministrazione(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Assunzione Iniziale</label>
                <textarea
                  rows={2}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none text-sm"
                  value={formData.dosageInitial || DEFAULT_DOSAGE_INITIAL}
                  onChange={e => setFormData({ ...formData, dosageInitial: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Per 3 Giorni</label>
                <textarea
                  rows={2}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none text-sm"
                  value={formData.dosageEarlyDays || DEFAULT_DOSAGE_EARLY}
                  onChange={e => setFormData({ ...formData, dosageEarlyDays: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Dal 4° al 6° Giorno</label>
                <textarea
                  rows={2}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none text-sm"
                  value={formData.dosageMidDays || DEFAULT_DOSAGE_MID}
                  onChange={e => setFormData({ ...formData, dosageMidDays: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">4. Dal 7° Giorno</label>
                <textarea
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none text-sm"
                  value={formData.dosageLateDays || DEFAULT_DOSAGE_LATE}
                  onChange={e => setFormData({ ...formData, dosageLateDays: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSomministrazione(false)}
                  className="w-full bg-emerald-600 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Conferma Somministrazione
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {patients.length === 0 && (
        <div className="col-span-full py-40 text-center bg-white border-2 border-dashed border-slate-100 rounded-[4rem] flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <UserPlus size={40} className="text-slate-200" />
          </div>
          <p className="text-lg font-black uppercase tracking-widest text-slate-300">Nessun paziente in anagrafica</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 text-[10px] font-black text-green-600 uppercase underline underline-offset-8">Aggiungi il primo paziente</button>
        </div>
      )}
    </div>
  );
};

export default Patients;
