
import React, { useState } from 'react';
import { useApp } from '../store';
import { GeneralCost } from '../types';
import { Receipt, DollarSign, Trash2, Home, Lightbulb, Users, Tag, Truck, Plus, X, Calendar, RefreshCw } from 'lucide-react';

const GeneralCosts: React.FC = () => {
  const { generalCosts, addGeneralCost, deleteGeneralCost } = useApp();

  const [showModal, setShowModal] = useState<'single' | 'recurring' | null>(null);
  const [form, setForm] = useState<Partial<GeneralCost>>({
    name: '', amount: 0, category: 'Altro'
  });

  const categories = [
    { name: 'Affitto', icon: <Home size={14} /> },
    { name: 'Utenze', icon: <Lightbulb size={14} /> },
    { name: 'Manutenzione', icon: <Receipt size={14} /> },
    { name: 'Manodopera Tot.', icon: <Users size={14} /> },
    { name: 'Regali', icon: <Tag size={14} /> },
    { name: 'Spedizione', icon: <Truck size={14} /> },
    { name: 'Altro', icon: <DollarSign size={14} /> }
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    await addGeneralCost({
      name: form.name,
      amount: form.amount || 0,
      category: form.category || 'Altro',
      isRecurring: showModal === 'recurring'
    });

    setForm({ name: '', amount: 0, category: 'Altro' });
    setShowModal(null);
  };

  const handleRemove = async (id: string) => {
    if (confirm('Eliminare questa spesa?')) {
      await deleteGeneralCost(id);
    }
  };

  const recurringCosts = generalCosts.filter(c => c.isRecurring);
  const singleCosts = generalCosts.filter(c => !c.isRecurring);

  const totalMonthlyLoad = generalCosts.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Costi Generali Aziendali</h2>
          <p className="text-slate-500 font-medium">Gestione spese fisse e ricorrenti del tuo business.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex-1 md:min-w-[200px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Carico Mensile Totale</p>
            <p className="text-3xl font-black text-amber-600">€{totalMonthlyLoad.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setForm({ name: '', amount: 0, category: 'Altro' }); setShowModal('single'); }}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              <Plus size={16} /> Spesa Mensile
            </button>
            <button
              onClick={() => { setForm({ name: '', amount: 0, category: 'Altro' }); setShowModal('recurring'); }}
              className="bg-amber-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-amber-700 transition-all shadow-xl shadow-amber-100"
            >
              <RefreshCw size={16} /> Spesa Ricorrente
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recurring Costs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <RefreshCw size={14} /> Spese Mensili Ricorrenti
            </h4>
            <span className="text-[10px] font-black text-slate-300 uppercase">{recurringCosts.length} items</span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
            {recurringCosts.map(cost => (
              <div key={cost.id} className="p-6 bg-amber-50/30 border border-amber-100/50 rounded-[2.5rem] shadow-sm flex justify-between items-center group hover:border-amber-300 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all">
                    {categories.find(c => c.name === cost.category)?.icon || <DollarSign size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{cost.name}</p>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <RefreshCw size={10} /> Ogni Mese • {cost.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <p className="text-xl font-black text-slate-900">€{cost.amount.toFixed(2)}</p>
                  <button onClick={() => handleRemove(cost.id)} className="p-3 text-slate-300 hover:text-red-500 bg-white rounded-xl transition-colors border border-slate-50">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {recurringCosts.length === 0 && (
              <div className="py-20 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem] text-slate-300">
                <p className="text-[10px] font-black uppercase tracking-widest">Nessuna spesa ricorrente</p>
              </div>
            )}
          </div>
        </div>

        {/* Single Costs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Calendar size={14} /> Spese Mensili (Non Ricorrenti)
            </h4>
            <span className="text-[10px] font-black text-slate-300 uppercase">{singleCosts.length} items</span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
            {singleCosts.map(cost => (
              <div key={cost.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex justify-between items-center group hover:border-slate-300 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-all">
                    {categories.find(c => c.name === cost.category)?.icon || <DollarSign size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{cost.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{cost.category} • {new Date(cost.date).toLocaleDateString('it-IT')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <p className="text-xl font-black text-slate-900">€{cost.amount.toFixed(2)}</p>
                  <button onClick={() => handleRemove(cost.id)} className="p-3 text-slate-300 hover:text-red-500 bg-slate-50 rounded-xl transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {singleCosts.length === 0 && (
              <div className="py-20 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem] text-slate-300">
                <p className="text-[10px] font-black uppercase tracking-widest">Nessuna spesa mensile</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 flex flex-col">
            <div className={`p-8 border-b border-slate-50 flex justify-between items-center ${showModal === 'recurring' ? 'bg-amber-50/50' : 'bg-slate-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl text-white shadow-lg ${showModal === 'recurring' ? 'bg-amber-600' : 'bg-slate-900'}`}>
                  {showModal === 'recurring' ? <RefreshCw size={24} /> : <Receipt size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                    {showModal === 'recurring' ? 'Spese Mensili Ricorrenti' : 'Spese Mensili (Non Ricorrenti)'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registra una nuova uscita</p>
                </div>
              </div>
              <button onClick={() => setShowModal(null)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <form onSubmit={handleAdd} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fornitore / Nome Spesa</label>
                  <input
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                    placeholder="e.g. Affitto Laboratorio"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importo (€)</label>
                  <input
                    type="number" step="0.01"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                    placeholder="0.00"
                    value={form.amount || ''}
                    onChange={e => setForm({ ...form, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleziona Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.name })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${form.category === cat.name
                        ? (showModal === 'recurring' ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'bg-slate-900 border-slate-900 text-white shadow-lg')
                        : 'bg-white text-slate-500 border-slate-100 hover:border-amber-300'
                        }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest transition-colors">Annulla</button>
                <button
                  type="submit"
                  disabled={!form.name || !form.amount}
                  className={`flex-[2] py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs text-white shadow-xl transition-all active:scale-95 disabled:opacity-30 ${showModal === 'recurring' ? 'bg-amber-600 shadow-amber-100' : 'bg-slate-900 shadow-slate-100'
                    }`}
                >
                  Registra {showModal === 'recurring' ? 'Spesa Ricorrente' : 'Spesa Mensile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralCosts;
