
import React, { useState } from 'react';
import { useApp } from '../store';
import {
  MapPin, Plus, Trash2, Briefcase, Eye, EyeOff
} from 'lucide-react';

const Settings: React.FC = () => {
  const {
    cities, addCity, deleteCity,
    salespersons, addSalesperson, deleteSalesperson, updateSalesperson, workspaceUsers
  } = useApp();

  const [newCityName, setNewCityName] = useState('');
  const [newSalespersonName, setNewSalespersonName] = useState('');
  const [pendingCityDelete, setPendingCityDelete] = useState<string | null>(null);
  const [showHiddenCollaborators, setShowHiddenCollaborators] = useState(false);

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

  const toggleHideSalesperson = async (person: any) => {
    await updateSalesperson({
      ...person,
      isHidden: !person.isHidden
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Rea Città e Collaboratori</h2>
          <p className="text-slate-500 font-medium">Gestione configurazione locale del workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* City Folders */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black flex items-center gap-3 text-slate-700 uppercase tracking-widest text-xs">
            <MapPin size={20} className="text-emerald-500" /> Cartelle Città
          </h3>
          <div className="flex gap-3">
            <input
              className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700"
              placeholder="e.g. Roma"
              value={newCityName}
              onChange={e => setNewCityName(e.target.value)}
            />
            <button onClick={handleAddCity} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Aggiungi</button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
            {cities.map(city => (
              <div key={city.id} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <span className="font-black text-slate-600 uppercase text-[10px] tracking-widest">{city.name}</span>
                <button onClick={() => setPendingCityDelete(city.id)} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
              </div>
            ))}
            {pendingCityDelete && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center space-y-3">
                <p className="text-[10px] font-black text-red-600 uppercase">Eliminare questa cartella?</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => confirmRemoveCity(pendingCityDelete)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Sì</button>
                  <button onClick={() => setPendingCityDelete(null)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase">No</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collaborators */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black flex items-center gap-3 text-slate-700 uppercase tracking-widest text-xs">
              <Briefcase size={20} className="text-blue-500" /> Collaboratori Esterni
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showHidden"
                checked={showHiddenCollaborators}
                onChange={e => setShowHiddenCollaborators(e.target.checked)}
                className="w-4 h-4 text-slate-900 bg-slate-100 border-slate-300 rounded focus:ring-slate-500"
              />
              <label htmlFor="showHidden" className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none">Mostra Nascosti</label>
            </div>
          </div>
          <div className="flex gap-3">
            <input className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700" placeholder="e.g. Mario Rossi" value={newSalespersonName} onChange={e => setNewSalespersonName(e.target.value)} />
            <button onClick={handleAddSalesperson} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Aggiungi</button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
            {salespersons
              .filter(p => showHiddenCollaborators || p.isHidden !== true)
              .map(person => (
                <div key={person.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${person.isHidden ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50/50 border-slate-50'}`}>
                  <span className={`font-black uppercase text-[10px] tracking-widest ${person.isHidden ? 'text-slate-400 line-through' : 'text-slate-600'}`}>{person.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleHideSalesperson(person)}
                      className={`p-3 transition-all ${person.isHidden ? 'text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50'} rounded-2xl`}
                      title={person.isHidden ? "Riattiva Collaboratore" : "Nascondi Collaboratore (Non elimina dati passati)"}
                    >
                      {person.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Eliminare definitivamente ${person.name}? Questa operazione è irreversibile.`)) {
                          await deleteSalesperson(person.id);
                        }
                      }}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
