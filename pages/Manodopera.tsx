import React, { useState } from 'react';
import { useApp } from '../store';
import { Clock, Plus, Trash2, X, Calendar as CalendarIcon, DollarSign, AlertCircle } from 'lucide-react';
import { LaborRecord } from '../types';

const Manodopera: React.FC = () => {
  const { laborRecords, addLaborRecord, deleteLaborRecord, currentUser, salespersons } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    hourlyRate: 0,
    salespersonId: currentUser?.salespersonId || ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const isAdmin = currentUser?.role === 'admin';

  // Filters records for the selected month and year
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00';
    return new Date(s);
  };

  const monthlyRecords = laborRecords.filter(r => {
    const d = parseDate(r.date);
    if (!d) return false;
    
    // Filter by date
    const dateMatch = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    
    // If collaborator, show only their own records
    if (!isAdmin && currentUser?.salespersonId) {
      return dateMatch && r.salespersonId === currentUser.salespersonId;
    }
    
    return dateMatch;
  });

  const totalLaborCost = monthlyRecords.reduce((sum, r) => sum + (r.hours * r.hourlyRate), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.salespersonId) {
      setErrorMsg('Seleziona un collaboratore');
      return;
    }
    if (form.hours <= 0) {
      setErrorMsg('Inserisci un numero di ore maggiore di zero');
      return;
    }
    if (form.hourlyRate <= 0) {
      setErrorMsg("Inserisci una tariffa oraria maggiore di zero");
      return;
    }

    try {
      // Set to 12:00:00 on the selected date to avoid timezone issues
      const finalDate = new Date(form.date + 'T12:00:00').toISOString();
      await addLaborRecord({
        salespersonId: form.salespersonId,
        hours: form.hours,
        hourlyRate: form.hourlyRate,
        date: finalDate
      });

      // Reset
      setForm({
        date: new Date().toISOString().split('T')[0],
        hours: 0,
        hourlyRate: 0,
        salespersonId: currentUser?.salespersonId || ''
      });
      setShowModal(false);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Errore durante il salvataggio');
    }
  };

  const handleRemove = async (id: string) => {
    if (confirm('Eliminare questa registrazione di manodopera?')) {
      await deleteLaborRecord(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Manodopera</h2>
          <p className="text-slate-500 font-medium">
            {isAdmin 
              ? 'Visualizza e registra le ore di manodopera lavorate dai collaboratori.' 
              : 'Registra le tue ore lavorate e monitora il tuo guadagno manodopera.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
          {/* Month selector */}
          <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start md:self-auto">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest p-2 outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest p-2 outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex-1 md:min-w-[200px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Guadagno Manodopera</p>
            <p className="text-3xl font-black text-rose-600">€{totalLaborCost.toFixed(2)}</p>
          </div>

          <button
            onClick={() => {
              setForm(prev => ({ ...prev, salespersonId: currentUser?.salespersonId || '' }));
              setShowModal(true);
            }}
            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 self-stretch md:self-auto justify-center"
          >
            <Plus size={16} /> Registra Ore
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registro Ore di Lavoro</h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{monthlyRecords.length} registrazioni</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Lavoro</th>
                {isAdmin && <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaboratore</th>}
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ore Lavorate</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tariffa Oraria</th>
                <th className="px-8 py-4 text-[10px] font-black text-rose-400 uppercase tracking-widest text-right">Totale Guadagno</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthlyRecords.map(record => {
                const sp = salespersons.find(s => s.id === record.salespersonId);
                const recordTotal = record.hours * record.hourlyRate;
                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">
                      {new Date(record.date).toLocaleDateString('it-IT')}
                    </td>
                    {isAdmin && (
                      <td className="px-8 py-4 text-xs font-black text-slate-700 uppercase">
                        {sp?.name || 'Collaboratore'}
                      </td>
                    )}
                    <td className="px-8 py-4 text-right font-bold text-slate-700">
                      {record.hours.toFixed(2)} ore
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-slate-500">
                      €{record.hourlyRate.toFixed(2)}/ora
                    </td>
                    <td className="px-8 py-4 text-right font-black text-rose-600">
                      €{recordTotal.toFixed(2)}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button
                        onClick={() => handleRemove(record.id)}
                        className="p-3 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-slate-100 hover:border-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {monthlyRecords.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Clock size={48} className="mb-2 text-rose-500" />
                      <p className="text-xs font-black uppercase tracking-widest">Nessuna registrazione per questo mese</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to log hours */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-rose-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-100">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Registra Ore</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inserisci la tua manodopera</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setErrorMsg('');
                  setShowModal(false);
                }} 
                className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-8 space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {isAdmin ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Collaboratore</label>
                  <select
                    value={form.salespersonId}
                    onChange={e => setForm({ ...form, salespersonId: e.target.value })}
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all text-sm uppercase tracking-widest"
                    required
                  >
                    <option value="">-- Seleziona Collaboratore --</option>
                    {salespersons.filter(s => !s.isHidden).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Collaboratore</label>
                  <div className="w-full p-5 bg-slate-100 border border-slate-200 rounded-3xl font-black text-slate-500 text-sm uppercase tracking-widest">
                    {salespersons.find(s => s.id === currentUser?.salespersonId)?.name || 'Io'}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Lavoro</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all text-sm"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ore Lavorate</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all"
                    placeholder="0.0"
                    value={form.hours || ''}
                    onChange={e => setForm({ ...form, hours: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tariffa (€/ora)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all"
                      placeholder="0.00"
                      value={form.hourlyRate || ''}
                      onChange={e => setForm({ ...form, hourlyRate: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Total preview */}
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Guadagno stimato</span>
                <span className="text-2xl font-black text-rose-600">€{(form.hours * form.hourlyRate).toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                Salva registrazione
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manodopera;
