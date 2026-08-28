import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { ModifierGroup, Recipe, IngredientRequirement } from '../types';
import {
  Layers, Settings2, Plus, Edit2, Trash2, X,
  Coins, Beaker, Info, AlertCircle, Trash
} from 'lucide-react';

const Variants: React.FC = () => {
  const {
    modifierGroups, addModifierGroup, updateModifierGroup, deleteModifierGroup,
    recipes, addRecipe, updateRecipe, deleteRecipe, rawMaterials, currentWorkspace
  } = useApp();

  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', options: [] as string[] });
  const [newOption, setNewOption] = useState('');

  // Recipe editing states for variant option
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeGroupId, setRecipeGroupId] = useState('');
  const [recipeOption, setRecipeOption] = useState('');
  const [editingIngredients, setEditingIngredients] = useState<IngredientRequirement[]>([]);
  const [ingForm, setIngForm] = useState({ name: '', qty: 0, unit: 'gr', cost: 0, rawMaterialId: '' });

  const CONVERSIONS: Record<string, Record<string, number>> = {
    'kg': { 'gr': 1000, 'g': 1000, 'grammi': 1000 },
    'kg.': { 'gr': 1000, 'g': 1000, 'grammi': 1000 },
    'g': { 'kg': 0.001, 'gr': 1, 'grammi': 1 },
    'gr': { 'kg': 0.001, 'g': 1, 'grammi': 1 },
    'grammi': { 'kg': 0.001, 'g': 1, 'gr': 1 },
    'lit': { 'ml': 1000, 'l': 1, 'litro': 1 },
    'l': { 'ml': 1000, 'lit': 1, 'litro': 1 },
    'litro': { 'ml': 1000, 'lit': 1, 'l': 1 },
    'ml': { 'lit': 0.001, 'l': 0.001, 'litro': 0.001 },
  };

  const getConversionFactor = (from: string, to: string) => {
    const f = from.toLowerCase().trim();
    const t = to.toLowerCase().trim();
    if (f === t) return 1;
    if (CONVERSIONS[f]?.[t]) return CONVERSIONS[f][t];
    if ((f === 'kg' || f === 'kg.') && (t === 'gr' || t === 'g' || t === 'grammi')) return 1000;
    if ((t === 'kg' || t === 'kg.') && (f === 'gr' || f === 'g' || f === 'grammi')) return 0.001;
    if ((f === 'lit' || f === 'l' || f === 'litro') && t === 'ml') return 1000;
    if ((t === 'lit' || t === 'l' || t === 'litro') && f === 'ml') return 0.001;
    return 1;
  };

  const getIngredientDynamicCostValue = (ing: IngredientRequirement) => {
    if (ing.rawMaterialId) {
      const rm = rawMaterials.find(r => r.id === ing.rawMaterialId);
      if (rm && rm.totalQuantity > 0) {
        const baseCostPerUnit = rm.totalPrice / rm.totalQuantity;
        const factor = getConversionFactor(ing.unit, rm.unit);
        return (ing.quantity * factor) * baseCostPerUnit;
      }
    }
    return ing.quantity * ing.costPerUnit;
  };

  const sessionTotalCost = useMemo(() => {
    return editingIngredients.reduce((sum, ing) => sum + getIngredientDynamicCostValue(ing), 0);
  }, [editingIngredients, rawMaterials]);

  // Variant Group Actions
  const handleOpenEditGroup = (group: ModifierGroup) => {
    setEditingGroup(group);
    setGroupFormData({ name: group.name, options: [...group.options] });
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name || groupFormData.options.length === 0) return;

    try {
      if (editingGroup) {
        await updateModifierGroup({ ...editingGroup, ...groupFormData });
        setEditingGroup(null);
      } else {
        await addModifierGroup(groupFormData);
      }
      setGroupFormData({ name: '', options: [] });
    } catch (err: any) {
      alert(`Errore varianti: ${err.message}`);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Eliminare questo gruppo di varianti?')) {
      await deleteModifierGroup(id);
    }
  };

  // Recipe Actions for Variant Options
  const openOptionRecipeEditor = (groupId: string, option: string) => {
    const existing = recipes.find(r => r.modifierGroupId === groupId && r.modifierOption === option);
    setRecipeGroupId(groupId);
    setRecipeOption(option);
    setEditingIngredients(existing ? [...existing.ingredients] : []);
    setIngForm({ name: '', qty: 0, unit: 'gr', cost: 0, rawMaterialId: '' });
    setShowRecipeModal(true);
  };

  const handleRMSelectInForm = (rmId: string) => {
    const rm = rawMaterials.find(r => r.id === rmId);
    if (rm) {
      const unitCost = rm.totalQuantity > 0 ? (rm.totalPrice / rm.totalQuantity) : 0;
      setIngForm({
        ...ingForm,
        rawMaterialId: rmId,
        name: rm.name,
        unit: rm.unit,
        cost: unitCost
      });
    } else {
      setIngForm({ ...ingForm, rawMaterialId: '', name: '', cost: 0 });
    }
  };

  const handleSaveRecipe = async () => {
    if (!currentWorkspace) return;

    const existing = recipes.find(r => r.modifierGroupId === recipeGroupId && r.modifierOption === recipeOption);

    if (existing) {
      await updateRecipe({ ...existing, ingredients: editingIngredients });
    } else {
      await addRecipe({
        modifierGroupId: recipeGroupId,
        modifierOption: recipeOption,
        ingredients: editingIngredients
      });
    }

    setShowRecipeModal(false);
  };

  const handleTopNewRecipe = () => {
    // Open editor with empty selections but let them select in the modal
    setRecipeGroupId('');
    setRecipeOption('');
    setEditingIngredients([]);
    setIngForm({ name: '', qty: 0, unit: 'gr', cost: 0, rawMaterialId: '' });
    setShowRecipeModal(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestisci varianti</h2>
          <p className="text-slate-500 font-medium">Gestisci i gruppi di varianti (es. dolcificanti, formati) e le formule associate alle singole opzioni.</p>
        </div>
        <button
          onClick={handleTopNewRecipe}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all font-bold text-sm shadow-xl"
        >
          <Beaker size={18} className="text-emerald-400" /> Nuova Variante Ricetta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create / Edit Group Form */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black flex items-center gap-3 text-slate-700 uppercase tracking-widest text-xs">
            {editingGroup ? 'Modifica Gruppo Varianti' : 'Crea Nuovo Gruppo Varianti'}
          </h3>
          <form onSubmit={handleAddGroup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Nome Gruppo</label>
              <input
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                placeholder="e.g. Tipo Dolcificante"
                value={groupFormData.name}
                onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Aggiungi Opzioni</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  placeholder="Nome opzione..."
                  value={newOption}
                  onChange={e => setNewOption(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const btn = document.getElementById('addOptBtn');
                      if (btn) btn.click();
                    }
                  }}
                />
                <button
                  id="addOptBtn"
                  type="button"
                  onClick={() => {
                    if (newOption.trim() && !groupFormData.options.includes(newOption.trim())) {
                      setGroupFormData({ ...groupFormData, options: [...groupFormData.options, newOption.trim()] });
                      setNewOption('');
                    }
                  }}
                  className="bg-slate-900 text-white px-6 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {groupFormData.options.map(opt => (
                <span key={opt} className="bg-slate-50 border border-slate-150 px-4 py-2 rounded-xl text-[10px] font-black text-slate-700 flex items-center gap-3 shadow-sm uppercase tracking-tight">
                  {opt}
                  <button
                    type="button"
                    onClick={() => setGroupFormData({ ...groupFormData, options: groupFormData.options.filter(o => o !== opt) })}
                    className="text-red-400 hover:text-red-600 transition-colors font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-100"
                disabled={!groupFormData.name || groupFormData.options.length === 0}
              >
                {editingGroup ? 'Aggiorna Gruppo' : 'Aggiungi Gruppo'}
              </button>
              {editingGroup && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupFormData({ name: '', options: [] });
                  }}
                  className="px-6 py-4 bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl"
                >
                  Annulla
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Variant Groups & Recipe Status */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black flex items-center gap-3 text-slate-700 uppercase tracking-widest text-xs">
            <Layers size={20} className="text-emerald-500" /> Elenco Gruppi Attivi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modifierGroups.map(group => (
              <div key={group.id} className="p-6 border border-slate-100 rounded-[2rem] bg-white shadow-sm flex flex-col gap-4 relative group hover:border-emerald-250 transition-all">
                <div className="absolute top-4 right-4 flex gap-1 z-10">
                  <button onClick={() => handleOpenEditGroup(group)} className="text-slate-300 hover:text-blue-500 p-2 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteGroup(group.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                </div>
                <h5 className="font-black text-slate-800 text-xs uppercase tracking-widest">{group.name}</h5>
                <div className="space-y-2 mt-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Opzioni e Formule (Clicca per modificare la ricetta)</p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map(o => {
                      const hasRecipe = recipes.some(r => r.modifierGroupId === group.id && r.modifierOption === o);
                      return (
                        <button
                          key={o}
                          onClick={() => openOptionRecipeEditor(group.id, o)}
                          className={`text-[9px] px-3 py-2 rounded-xl border font-black uppercase tracking-tight flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                            hasRecipe
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <Beaker size={10} className={hasRecipe ? 'text-emerald-600' : 'text-slate-400'} />
                          <span>{o}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {modifierGroups.length === 0 && (
              <div className="col-span-full py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem]">
                <Layers className="mx-auto text-slate-200 mb-3 opacity-20" size={48} />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nessuna variante configurata</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECIPE MODAL FOR VARIANT OPTIONS */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Beaker size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Formula Variante</h3>
              </div>
              <button onClick={() => setShowRecipeModal(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-smooth hide-scrollbar">
              <div className="space-y-6">
                {/* Selezione Variante */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gruppo Varianti</label>
                    <select
                      className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none bg-slate-50"
                      value={recipeGroupId}
                      onChange={e => {
                        setRecipeGroupId(e.target.value);
                        setRecipeOption('');
                        setEditingIngredients([]);
                      }}
                      disabled={!!(recipeGroupId && recipeOption)}
                    >
                      <option value="">Scegli Gruppo...</option>
                      {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  {recipeGroupId && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opzione Specifica</label>
                      <select
                        className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none bg-slate-50"
                        value={recipeOption}
                        onChange={e => openOptionRecipeEditor(recipeGroupId, e.target.value)}
                        disabled={!!(recipeGroupId && recipeOption)}
                      >
                        <option value="">Scegli Opzione...</option>
                        {modifierGroups.find(g => g.id === recipeGroupId)?.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  )}
                  {recipeGroupId && recipeOption && (
                    <div className="flex justify-between items-center text-xs font-black uppercase text-slate-500 bg-slate-100 p-4 rounded-2xl">
                      <span>Bloccato su: {modifierGroups.find(g => g.id === recipeGroupId)?.name} / {recipeOption}</span>
                      <button
                        onClick={() => {
                          setRecipeGroupId('');
                          setRecipeOption('');
                          setEditingIngredients([]);
                        }}
                        className="text-[10px] font-bold bg-white text-slate-600 px-3 py-1 rounded-xl shadow-sm border border-slate-200 hover:text-red-500 transition-all"
                      >
                        Sblocca
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Ingrediente */}
                <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-inner">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Coins size={10} /> Usa Materia Prima (Facoltativo)
                    </label>
                    <select
                      className="w-full p-3 border border-rose-100 bg-white rounded-xl text-xs font-bold text-rose-800 outline-none focus:ring-4 focus:ring-rose-500/10"
                      value={ingForm.rawMaterialId}
                      onChange={e => handleRMSelectInForm(e.target.value)}
                    >
                      <option value="">-- Nessuna Materia Prima --</option>
                      {rawMaterials.map(rm => (
                        <option key={rm.id} value={rm.id}>
                          {rm.name} (€{(rm.totalPrice / (rm.totalQuantity || 1)).toFixed(3)}/{rm.unit})
                        </option>
                      ))}
                    </select>
                    {ingForm.rawMaterialId && (
                      <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Info size={10} /> Dati bloccati e sincronizzati dal magazzino
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Ingrediente</label>
                    <input
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="E.g. Zucchero di Canna"
                      value={ingForm.name}
                      onChange={e => setIngForm({ ...ingForm, name: e.target.value })}
                      disabled={!!ingForm.rawMaterialId}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtà</label>
                      <input
                        type="number"
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black"
                        placeholder="0"
                        value={ingForm.qty || ''}
                        onChange={e => setIngForm({ ...ingForm, qty: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unità</label>
                      <select
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-black uppercase"
                        value={ingForm.unit}
                        onChange={e => setIngForm({ ...ingForm, unit: e.target.value })}
                      >
                        <option value="gr">gr</option>
                        <option value="Kg">Kg</option>
                        <option value="ml">ml</option>
                        <option value="lit">lit</option>
                        <option value="Unità">Unità</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Unit.</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="0.00"
                        value={ingForm.cost || ''}
                        onChange={e => setIngForm({ ...ingForm, cost: parseFloat(e.target.value) || 0 })}
                        disabled={!!ingForm.rawMaterialId}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (ingForm.name && ingForm.qty !== 0) {
                        setEditingIngredients([...editingIngredients, {
                          name: ingForm.name,
                          quantity: ingForm.qty,
                          unit: ingForm.unit,
                          costPerUnit: ingForm.cost,
                          rawMaterialId: ingForm.rawMaterialId || undefined
                        }]);
                        setIngForm({ name: '', qty: 0, unit: 'gr', cost: 0, rawMaterialId: '' });
                      } else {
                        alert("Inserisci nome e una quantità valida (diversa da zero) dell'ingrediente.");
                      }
                    }}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Aggiungi alla formula
                  </button>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-inner">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Costo Totale Formula</p>
                  <p className="text-2xl font-black text-slate-800">€{sessionTotalCost.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] pr-2 hide-scrollbar">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Composizione Attuale</h4>
                  {editingIngredients.map((ing, idx) => {
                    const totalLineCost = getIngredientDynamicCostValue(ing);

                    return (
                      <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all">
                        <div className="flex items-center gap-3">
                          {ing.rawMaterialId ? (
                            <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shadow-inner"><Coins size={14} /></div>
                          ) : (
                            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg"><Beaker size={14} /></div>
                          )}
                          <div>
                            <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{ing.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              {ing.quantity} {ing.unit} • €{totalLineCost.toFixed(2)} totali
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setEditingIngredients(editingIngredients.filter((_, i) => i !== idx))} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash size={18} />
                        </button>
                      </div>
                    );
                  })}
                  {editingIngredients.length === 0 && (
                    <div className="py-20 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem]">
                      <Beaker className="mx-auto text-slate-200 mb-3 opacity-20" size={48} />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nessun ingrediente inserito</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4 bg-white mt-auto">
                  <button onClick={() => setShowRecipeModal(false)} className="flex-1 py-5 font-black text-xs text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Annulla</button>
                  <button
                    onClick={handleSaveRecipe}
                    disabled={!recipeGroupId || !recipeOption || editingIngredients.length === 0}
                    className="flex-[2] py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl text-white bg-slate-900 shadow-slate-100 hover:bg-slate-800 transition-all disabled:opacity-30 disabled:shadow-none"
                  >
                    Salva Formula Variante
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Variants;
