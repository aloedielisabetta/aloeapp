
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { Patient, MedicalState, JournalEntry } from '../types';
import {
  Plus, Search, ChevronRight, UserPlus, Trash2, History,
  X, Calendar, Tag, Layers, Edit2, FileText, Download,
  Loader2, Activity, Scale, Clipboard, Save, MessageSquare, UploadCloud, Smartphone
} from 'lucide-react';

const Patients: React.FC = () => {
  const { patients, addPatient, updatePatient, deletePatient, cities } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [showJournal, setShowJournal] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | 'Tutte'>('Tutte');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

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
    city: cities[0]?.name || '', medicalCondition: '',
    conditionType: '', medicalState: 'Buono', aloeTweak: '',
    formMonth: '', testResults: '', testResults2: '', worsening: '', improvement: '', stability: ''
  });

  const handleOpenEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setShowAdd(true);
  };

  const closePatientModal = () => {
    setShowAdd(false);
    setEditingPatient(null);
    setFormData({
      firstName: '', lastName: '', phone: '', address: '',
      city: cities[0]?.name || '', medicalCondition: '',
      conditionType: '', medicalState: 'Buono', aloeTweak: '',
      formMonth: '', testResults: '', testResults2: '', worsening: '', improvement: '', stability: ''
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      await updatePatient({ ...editingPatient, ...formData as Patient });
    } else {
      await addPatient({ ...formData, journal: [] } as Omit<Patient, 'id' | 'workspaceId'>);
    }
    closePatientModal();
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
    setActiveProtocolPatient(patient);

    setTimeout(async () => {
      if (!protocolRef.current) return;

      const opt = {
        margin: 0, // Zero margin for full bleed or custom CSS margin
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

  const handleImportInitialList = async () => {
    if (!confirm('Vuoi davvero importare la lista iniziale di ~56 pazienti?')) return;

    let count = 0;
    for (const p of initialPatients) {
      await addPatient({
        ...p,
        city: p.city || cities[0]?.name || 'Altro',
        address: p.address || '',
        conditionType: 'Cronico',
        medicalState: 'Buono',
        journal: []
      } as any);
      count++;
    }
    alert(`Importati ${count} pazienti iniziali con successo!`);
  };

  const filtered = patients.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesCity = selectedCity === 'Tutte' || p.city === selectedCity;
    return matchesSearch && matchesCity;
  }).sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestione Pazienti <span className="text-xs bg-red-500 text-white px-2 py-1 rounded ml-2">v2.0</span></h2>
          <p className="text-slate-500 font-medium">Onboarding, protocolli e monitoraggio mensile.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-green-600 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-green-100 font-black text-xs uppercase tracking-widest active:scale-95"
        >
          <UserPlus size={18} /> Registra Paziente
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm text-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Cerca paziente per nome..."
            className="pl-14 pr-5 py-4 w-full border border-slate-50 bg-slate-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 font-bold text-slate-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide bg-slate-50/50 p-2 rounded-2xl">
          <button
            onClick={() => setSelectedCity('Tutte')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCity === 'Tutte' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Tutte
          </button>
          {cities.map(city => (
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(patient => (
          <div key={patient.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
            <div className="absolute top-6 right-6 flex gap-1">
              <button
                onClick={() => handleDownloadProtocol(patient)}
                className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                title="Scarica Scheda Tecnica"
              >
                {isGenerating === patient.id ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              </button>
              <button
                onClick={() => setShowJournal(patient)}
                className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Diario Salute"
              >
                <Activity size={18} />
              </button>
              <button
                onClick={() => handleOpenEdit(patient)}
                className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                title="Modifica"
              >
                <Edit2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 pt-2">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-300 text-xl shadow-inner uppercase">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight leading-none">{patient.firstName} {patient.lastName}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <Tag size={10} className="text-green-500" /> {patient.city}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-y border-slate-50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stato Recente</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${patient.medicalState === 'Critico' ? 'bg-red-50 text-red-600' :
                  patient.medicalState === 'Grave' ? 'bg-orange-50 text-orange-600' :
                    patient.medicalState === 'Discreto' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>{patient.medicalState}</span>
              </div>

              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocollo Base</p>
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
              {/* Add Entry Form */}
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

              {/* History Timeline */}
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

      {/* CUSTOM PDF TEMPLATE */}
      <div className="hidden">
        <div ref={protocolRef} className="bg-white" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-red-600 mb-1">Elisabetta 3620871005</h1>
            <p className="text-sm text-red-500 font-medium">contattabile via telefono o messaggio: Dal Lunedi al Venerdi 17.00-20.00</p>
          </div>

          {/* Logo (Placeholder/Actual) */}
          <div className="absolute top-10 right-10">
            {/* Using a simple placeholder if no image available, or generic icon */}
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-emerald-500">
              <span className="text-2xl">🌱</span>
            </div>
          </div>

          {/* Main Data Table */}
          <table className="w-full border-collapse border border-black mb-8">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold w-1/4 align-top text-sm">Mese</td>
                <td className="border border-black p-2 bg-slate-50 align-top text-sm">{activeProtocolPatient?.formMonth || ''}&nbsp;</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Nome & telefono</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.firstName} {activeProtocolPatient?.lastName} - {activeProtocolPatient?.phone}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Patologia</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.medicalCondition}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm h-64">Cura</td>
                <td className="border border-black p-4 align-top text-sm relative">
                  <div className="mb-4 whitespace-pre-wrap">{activeProtocolPatient?.aloeTweak}</div>

                  <div className="bg-green-400 p-2 font-bold text-xs border border-green-600 text-center mt-auto w-full absolute bottom-4 left-0 right-0 max-w-[90%] mx-auto">
                    ALLA FINE DELLA CURA INIZIALE,PER MANTENERE IL BENESSERE
                    RAGGIUNTO E SEMPRE ALTE LE DIFESE IMMUNITARIE,CONSIGLIO 2
                    BARATTOLI IN PRIMAVERA E 2 BARATTOLI IN AUTUNNO.
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Controllo Esami</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.testResults}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Aggravamento</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.worsening}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Miglioramento</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.improvement}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Controllo Esami dopo Aloe</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.testResults2}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top text-sm">Periodo Stabilità</td>
                <td className="border border-black p-2 align-top text-sm">{activeProtocolPatient?.stability}</td>
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

          {/* Dosage Table */}
          <table className="w-full border-collapse border border-black text-sm mb-6">
            <tbody>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50 w-1/3">Assunzione iniziale:</td>
                <td className="border border-black p-3">assumere l'aloe sempre almeno mezz'ora prima dei pasti principali in luce soffusa</td>
              </tr>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50">Per 3 giorni:</td>
                <td className="border border-black p-3">1 cucchiaio a colazione</td>
              </tr>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50">Dal 4° giorno al 6° giorno:</td>
                <td className="border border-black p-3">1 cucchiaio a colazione, 1 cucchiaio a cena (o prima di coricarsi)</td>
              </tr>
              <tr>
                <td className="border border-black p-3 font-bold bg-slate-50">Dal 7° giorno:</td>
                <td className="border border-black p-3">1 cucchiaio e ½ a colazione, 1 cucchiaio e ½  a cena (o prima di coricarsi). Continuare con queste assunzioni fino al termine del barattolo</td>
              </tr>
            </tbody>
          </table>

          <p className="text-[10px] text-blue-700 leading-relaxed text-justify">
            Per alcune patologie si deve attendere alcuni giorni per iniziare l'assunzione del barattolo
            successivo;<span className="text-blue-500 underline">dal 2° mese per una settimana,si rimane sempre senza del preparato di aloe:</span>
            questo <span className="underline">perché</span> come dice Padre Romano Zago"se quella settimana senza,si sta bene
            significa che non ne avete <span className="underline">più bisogno,</span> al contrario se la situazione fisica tende a
            <span className="text-blue-500"> peggiorare,ne avete ancora bisogno";</span>generalmente equivale ai mesi che vi ho prescritto.
          </p>

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
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingPatient ? 'Modifica Scheda' : 'Nuovo Onboarding'}</h3>
              </div>
              <button onClick={closePatientModal} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <form onSubmit={handleAdd} className="space-y-8">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indirizzo per Spedizione</label>
                    <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cartella Città</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none appearance-none" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}>
                      {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patologia Principale</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.medicalCondition} onChange={e => setFormData({ ...formData, medicalCondition: e.target.value })} placeholder="E.g. Diabete di tipo 2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stato Clinico Attuale</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none" value={formData.medicalState} onChange={e => setFormData({ ...formData, medicalState: e.target.value as MedicalState })}>
                      <option value="Buono">Ottimo / Buono</option>
                      <option value="Discreto">Discreto</option>
                      <option value="Grave">Grave</option>
                      <option value="Critico">Critico</option>
                    </select>
                  </div>
                </div>

                {/* NEW FIELDS SECTION */}
                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dettagli Scheda PDF</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mese (Header)</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={formData.formMonth} onChange={e => setFormData({ ...formData, formMonth: e.target.value })} placeholder="E.g. Marzo 2024" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Controllo Esami (1)</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={formData.testResults} onChange={e => setFormData({ ...formData, testResults: e.target.value })} placeholder="Valori o note inziali..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aggravamento</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={formData.worsening} onChange={e => setFormData({ ...formData, worsening: e.target.value })} placeholder="Sintomi peggiorati..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Miglioramento</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={formData.improvement} onChange={e => setFormData({ ...formData, improvement: e.target.value })} placeholder="Miglioramenti notati..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Controllo Esami dopo Aloe</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={formData.testResults2} onChange={e => setFormData({ ...formData, testResults2: e.target.value })} placeholder="Esami successivi..." />
                    </div>
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Periodo di Stabilità</label>
                      <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={formData.stability} onChange={e => setFormData({ ...formData, stability: e.target.value })} placeholder="Durata stabilità..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Clipboard size={12} /> Indicazioni Protocollo Aloe (Cura)
                  </label>
                  <textarea rows={4} className="w-full p-5 bg-white border border-emerald-100 rounded-[2rem] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner" value={formData.aloeTweak} onChange={e => setFormData({ ...formData, aloeTweak: e.target.value })} placeholder="Dettaglia la cura e frequenza di assunzione consigliata..." />
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button type="button" onClick={closePatientModal} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Annulla</button>
                  <button type="submit" className="flex-[2] bg-green-600 text-white py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95">
                    {editingPatient ? 'Aggiorna Paziente' : 'Finalizza Registrazione'}
                  </button>
                </div>
              </form>
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
