
import React, { useState } from 'react';
import { useApp } from '../store';
import { GeneralCost } from '../types';
import { Receipt, DollarSign, Trash2, Home, Lightbulb, Users, Tag, Truck, Plus } from 'lucide-react';

const GeneralCosts: React.FC = () => {
  const { generalCosts, addGeneralCost, deleteGeneralCost } = useApp();

  const [generalCostForm, setGeneralCostForm] = useState<Partial<GeneralCost>>({
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

  const handleAddGeneralCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalCostForm.name || !generalCostForm.amount) return;
    
    await addGeneralCost({
      name: generalCostForm.name,
      amount: generalCostForm.amount || 0,
      category: generalCostForm.category || 'Altro'
    });
    
    setGeneralCostForm({ name: '', amount: 0, category: 'Altro' });
  };

  const handleRemoveGeneralCost = async (id: string) => {
    if (confirm('Eliminare questa spesa generale?')) {
      await deleteGeneralCost(id);
    }
  };

  const totalGeneralCosts = generalCosts.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Costi Generali Aziendali</h2>
          <p className="text-slate-500 font-medium">Gestisci le spese fisse e i costi di gestione del laboratorio.</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale Spese Fisse</p>
          <p className="text-3xl font-black text-amber-600">€{totalGeneralCosts.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center border border-amber-100 shadow-inner">
               <Receipt size={28} />
             </div>
             <div>
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nuova Spesa</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Registra un'uscita fissa</p>
             </div>
          </div>

          <form onSubmit={handleAddGeneralCost} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fornitore / Nome Spesa</label>
                <input 
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all" 
                  placeholder="e.g. Affitto Laboratorio"
                  value={generalCostForm.name}
                  onChange={e => setGeneralCostForm({...generalCostForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importo (€)</label>
                <input 
                  type="number" step="0.01"
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all" 
                  placeholder="0.00"
                  value={generalCostForm.amount || ''}
                  onChange={e => setGeneralCostForm({...generalCostForm, amount: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
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
                    onClick={() => setGeneralCostForm({...generalCostForm, category: cat.name})}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      generalCostForm.category === cat.name 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-lg' 
                        : 'bg-white text-slate-500 border-slate-100 hover:border-amber-300'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!generalCostForm.name || !generalCostForm.amount}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-100"
            >
              Registra Spesa Generale
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Storico Spese Correnti</h4>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 hide-scrollbar">
            {generalCosts.map(cost => (
              <div key={cost.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex justify-between items-center group hover:border-amber-200 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-all">
                    {categories.find(c => c.name === cost.category)?.icon || <DollarSign size={24} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase text-xs tracking-tight">{cost.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{cost.category} • {new Date(cost.date).toLocaleDateString('it-IT')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <p className="text-xl font-black text-slate-900">€{cost.amount.toFixed(2)}</p>
                  <button onClick={() => handleRemoveGeneralCost(cost.id)} className="p-3 text-slate-200 hover:text-red-500 bg-slate-50 rounded-xl transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {generalCosts.length === 0 && (
              <div className="py-32 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
                <Receipt size={40} className="opacity-20 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nessuna spesa registrata</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralCosts;
