import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { Recipe, IngredientRequirement } from '../types';
import { Plus, Beaker, Trash2, Droplets, Edit3, X, Coins, Info } from 'lucide-react';

const Recipes: React.FC = () => {
  const {
    products, updateProduct, recipes, addRecipe, updateRecipe, deleteRecipe,
    currentWorkspace, rawMaterials
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
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

  const resetState = () => {
    setSelectedProductId('');
    setEditingIngredients([]);
    setIngForm({ name: '', qty: 0, unit: 'gr', cost: 0, rawMaterialId: '' });
  };

  const openRecipeEditor = (productId: string) => {
    const existing = recipes.find(r => r.productId === productId);
    setSelectedProductId(productId);
    setEditingIngredients(existing ? [...existing.ingredients] : []);
    setShowModal(true);
  };

  const handleSaveRecipe = async () => {
    if (!currentWorkspace || !selectedProductId) return;

    const existing = recipes.find(r => r.productId === selectedProductId);

    if (existing) {
      await updateRecipe({ ...existing, ingredients: editingIngredients });
    } else {
      await addRecipe({
        productId: selectedProductId,
        ingredients: editingIngredients
      });
    }

    setShowModal(false);
    resetState();
  };

  const syncProductCost = async (calculatedCost: number) => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    await updateProduct({ ...product, costPerItem: calculatedCost });
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

  // Only show recipes that are linked to a product
  const productRecipes = recipes.filter(r => r.productId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Prodotti / ricette</h2>
          <p className="text-slate-500 font-medium">Gestisci la composizione e le formule dei prodotti base.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { resetState(); setShowModal(true); }}
            className="bg-green-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all font-bold shadow-lg shadow-green-100 uppercase text-[10px] tracking-widest"
          >
            <Plus size={18} /> nuovo prodotto Ricetta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productRecipes.map(recipe => {
          const product = products.find(p => p.id === recipe.productId);
          const totalCost = recipe.ingredients.reduce((sum, ing) => sum + getIngredientDynamicCostValue(ing), 0);

          return (
            <div key={recipe.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm bg-green-50 text-green-600 border-green-100">
                      <Droplets size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 leading-tight uppercase">{product?.name || 'Prodotto'}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ricetta Prodotto</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openRecipeEditor(recipe.productId!)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
                    <button onClick={() => deleteRecipe(recipe.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="space-y-1 mb-4">
                  {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                      <span className="font-bold text-slate-600 flex items-center gap-1.5">
                        {ing.rawMaterialId && <Coins size={10} className="text-rose-400" />}
                        {ing.name}
                      </span>
                      <span className="text-slate-400 font-black">{ing.quantity}{ing.unit}</span>
                    </div>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest ml-1">...e altri {recipe.ingredients.length - 3}</p>
                  )}
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-xl font-black text-green-600">€{totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          );
        })}
        {productRecipes.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem] text-slate-400">
            <Beaker className="mx-auto text-slate-200 mb-3 opacity-20" size={48} />
            <p className="text-[10px] font-black text-slate-350 uppercase tracking-widest">Nessuna ricetta prodotto creata</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-100 text-green-600">
                  <Droplets size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Formula Prodotto</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-smooth hide-scrollbar">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prodotto Associato</label>
                  <select
                    className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none bg-slate-50"
                    value={selectedProductId}
                    onChange={e => openRecipeEditor(e.target.value)}
                    disabled={!!selectedProductId}
                  >
                    <option value="">Scegli Prodotto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {selectedProductId && (
                  <div className="flex justify-between items-center text-xs font-black uppercase text-slate-500 bg-slate-100 p-4 rounded-2xl">
                    <span>Bloccato su: {products.find(p => p.id === selectedProductId)?.name}</span>
                    <button
                      onClick={() => {
                        setSelectedProductId('');
                        setEditingIngredients([]);
                      }}
                      className="text-[10px] font-bold bg-white text-slate-600 px-3 py-1 rounded-xl shadow-sm border border-slate-200 hover:text-red-500 transition-all"
                    >
                      Sblocca
                    </button>
                  </div>
                )}

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
                    <input className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold disabled:bg-slate-100 disabled:text-slate-400" placeholder="E.g. Aloe Arborescens" value={ingForm.name} onChange={e => setIngForm({ ...ingForm, name: e.target.value })} disabled={!!ingForm.rawMaterialId} />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtà</label>
                      <input type="number" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black" placeholder="0" value={ingForm.qty || ''} onChange={e => setIngForm({ ...ingForm, qty: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unità</label>
                      <select className="w-full p-3 border border-slate-200 rounded-xl text-xs font-black uppercase" value={ingForm.unit} onChange={e => setIngForm({ ...ingForm, unit: e.target.value })}>
                        <option value="gr">gr</option>
                        <option value="Kg">Kg</option>
                        <option value="ml">ml</option>
                        <option value="lit">lit</option>
                        <option value="Unità">Unità</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Unit.</label>
                      <input type="number" step="0.0001" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black disabled:bg-slate-100 disabled:text-slate-400" placeholder="0.00" value={ingForm.cost || ''} onChange={e => setIngForm({ ...ingForm, cost: parseFloat(e.target.value) || 0 })} disabled={!!ingForm.rawMaterialId} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (ingForm.name && ingForm.qty > 0) {
                        setEditingIngredients([...editingIngredients, {
                          name: ingForm.name,
                          quantity: ingForm.qty,
                          unit: ingForm.unit,
                          costPerUnit: ingForm.cost,
                          rawMaterialId: ingForm.rawMaterialId || undefined
                        }]);
                        setIngForm({ name: '', qty: 0, unit: 'gr', cost: 0, rawMaterialId: '' });
                      } else {
                        alert("Inserisci nome e quantità dell'ingrediente.");
                      }
                    }}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Aggiungi alla formula
                  </button>
                </div>

                {selectedProductId && (
                  <div className="bg-green-50 p-6 rounded-[2.5rem] border border-green-100 flex flex-col gap-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Costo Calcolato Formula</p>
                      <p className="text-2xl font-black text-green-800">€{sessionTotalCost.toFixed(2)}</p>
                    </div>
                    <button onClick={() => syncProductCost(sessionTotalCost)} className="w-full py-4 bg-white text-green-700 border border-green-200 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-green-100 transition-colors">Sincronizza Costo Prodotto</button>
                  </div>
                )}
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
                          <Trash2 size={18} />
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
                  <button onClick={() => setShowModal(false)} className="flex-1 py-5 font-black text-xs text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Annulla</button>
                  <button
                    onClick={handleSaveRecipe}
                    disabled={!selectedProductId || editingIngredients.length === 0}
                    className="flex-[2] py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl text-white bg-green-600 shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-30 disabled:shadow-none"
                  >
                    Salva Formula Completa
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

export default Recipes;
