
import React, { useState } from 'react';
import { useApp } from '../store';
import { Salesperson } from '../types';
import { Plus, Trash2, Briefcase, User } from 'lucide-react';

const Salespersons: React.FC = () => {
  const { salespersons, addSalesperson, deleteSalesperson, orders } = useApp();
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (newName.trim()) {
      await addSalesperson(newName.trim());
      setNewName('');
    }
  };

  const removeSalesperson = async (id: string) => {
    const hasOrders = orders.some(o => o.salespersonId === id);
    if (hasOrders) {
      alert("Impossibile eliminare questo venditore perché è collegato ad alcuni ordini.");
      return;
    }
    if (confirm('Sei sicuro di voler eliminare questo venditore?')) {
      await deleteSalesperson(id);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Venditori Esterni</h2>
        <p className="text-slate-500 font-medium">Gestisci la lista dei tuoi agenti di vendita esterni.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-black flex items-center gap-2 text-slate-700 uppercase tracking-widest text-[10px]">
            <Briefcase size={16} className="text-emerald-600" />
            Nuovo Venditore
          </h3>
          <div className="flex gap-2">
            <input 
              className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10" 
              placeholder="Inserisci nome e cognome..." 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button 
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="bg-slate-900 text-white px-8 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg active:scale-95"
            >
              Aggiungi
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {salespersons.map(person => {
            const personOrdersCount = orders.filter(o => o.salespersonId === person.id).length;
            return (
              <div key={person.id} className="flex justify-between items-center p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <User size={20} />
                  </div>
                  <div>
                    <span className="font-black text-slate-800 block uppercase text-xs tracking-tight">{person.name}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{personOrdersCount} ordini associati</span>
                  </div>
                </div>
                <button 
                  onClick={() => removeSalesperson(person.id)} 
                  className="text-slate-200 hover:text-red-500 transition-colors p-3 bg-slate-50 rounded-xl"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            );
          })}
          {salespersons.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center">
              <User size={40} className="opacity-10 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nessun venditore registrato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salespersons;
