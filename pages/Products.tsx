import React, { useState } from 'react';
import { useApp } from '../store';
import { Product } from '../types';
import {
  Plus, Tag, Trash2, CheckSquare, Edit2, UserCheck,
  Beaker, RefreshCw, Package, ArrowRight, X
} from 'lucide-react';

const Products: React.FC = () => {
  const {
    products, addProduct, updateProduct, deleteProduct,
    modifierGroups, rawMaterials, recipes
  } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', price: 0, costPerItem: 0, labourCost: 0, externalCommission: 0, modifierGroupIds: []
  });

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

  const getIngredientDynamicCostValue = (ing: any) => {
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

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowAdd(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct({ ...editingProduct, ...formData as Product });
      } else {
        await addProduct(formData as Omit<Product, 'id' | 'workspaceId'>);
      }
      closeProductModal();
    } catch (err: any) {
      alert(`Errore nel salvataggio: ${err.message}`);
    }
  };

  const closeProductModal = () => {
    setShowAdd(false);
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: 0, costPerItem: 0, labourCost: 0, externalCommission: 0, modifierGroupIds: [] });
  };

  const removeProduct = async (id: string) => {
    if (!id) return;
    if (window.confirm('Eliminando il prodotto cancellerai anche la sua formula associata. Procedere?')) {
      try {
        await deleteProduct(id);
      } catch (err: any) {
        alert(`Impossibile eliminare: ${err.message || 'Errore database. Verifica se il prodotto è presente in qualche ordine.'}`);
      }
    }
  };

  const syncWithRecipe = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    const recipe = recipes.find(r => r.productId === productId);
    if (!recipe || !product) return;

    const calculatedCost = recipe.ingredients.reduce((sum, ing) => sum + getIngredientDynamicCostValue(ing), 0);
    await updateProduct({ ...product, costPerItem: calculatedCost });
  };

  const toggleGroupSelection = (groupId: string) => {
    const current = formData.modifierGroupIds || [];
    if (current.includes(groupId)) {
      setFormData({ ...formData, modifierGroupIds: current.filter(id => id !== groupId) });
    } else {
      setFormData({ ...formData, modifierGroupIds: [...current, groupId] });
    }
  };

  const generateSku = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Space to dash
      .slice(0, 15);
  };

  // Helper to generate Cartesian product of arrays
  const cartesian = (args: any[][]): any[][] => {
    const r: any[][] = [];
    const max = args.length - 1;
    function helper(arr: any[], i: number) {
      for (let j = 0, l = args[i].length; j < l; j++) {
        const a = arr.slice(0); // clone arr
        a.push(args[i][j]);
        if (i === max) r.push(a);
        else helper(a, i + 1);
      }
    }
    helper([], 0);
    return r;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Prodotti/Crea</h2>
          <p className="text-slate-500 font-medium">Gestisci il listino, i prezzi, la manodopera e le provvigioni dei prodotti.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="bg-green-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all font-bold text-sm shadow-xl shadow-green-100"
          >
            <Plus size={18} /> Crea Prodotto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...products].sort((a, b) => a.name.localeCompare(b.name)).map(product => {
          const totalCostInternal = product.costPerItem + product.labourCost;
          const totalCostExternal = totalCostInternal + (product.externalCommission || 0);

          const profitInternal = product.price - totalCostInternal;
          const profitExternal = product.price - totalCostExternal;

          const gpInternal = product.price > 0 ? (profitInternal / product.price) * 100 : 0;
          const gpExternal = product.price > 0 ? (profitExternal / product.price) * 100 : 0;

          const linkedGroups = modifierGroups.filter(g => product.modifierGroupIds.includes(g.id));
          const productRecipe = recipes.find(r => r.productId === product.id);
          const recipeCost = productRecipe?.ingredients.reduce((sum, ing) => sum + getIngredientDynamicCostValue(ing), 0) || 0;
          const isCostMisaligned = productRecipe && Math.abs(product.costPerItem - recipeCost) > 0.01;

          return (
            <div key={product.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{product.name}</h3>
                      {productRecipe && (
                        <span className="bg-green-50 text-green-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                          <Beaker size={10} /> RICETTA
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{linkedGroups.length} gruppi varianti collegati</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-black text-green-600">€{product.price.toFixed(2)}</p>
                      <div className="flex flex-col items-end gap-1 mt-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${gpInternal > 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          INT: {gpInternal.toFixed(0)}% MARGINE
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${gpExternal > 40 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          EST: {gpExternal.toFixed(0)}% MARGINE
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenEditProduct(product)}
                        className="text-slate-400 hover:text-blue-600 p-4 bg-slate-50 rounded-2xl transition-all shadow-sm flex items-center justify-center active:scale-95"
                        title="Modifica"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="text-slate-400 hover:text-red-600 p-4 bg-slate-50 rounded-2xl transition-all shadow-sm flex items-center justify-center active:scale-95 group/del"
                        title="Elimina"
                      >
                        <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 py-6 border-y border-slate-50 bg-slate-50/50 rounded-3xl px-4">
                  <div className="text-center group/cost relative">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Materiali</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <p className={`font-black text-sm ${isCostMisaligned ? 'text-amber-600' : 'text-slate-700'}`}>
                        €{product.costPerItem.toFixed(2)}
                      </p>
                      {isCostMisaligned && (
                        <button
                          onClick={() => syncWithRecipe(product.id)}
                          className="text-amber-500 hover:text-green-600 transition-colors"
                          title={`Ricetta indica €${recipeCost.toFixed(2)}. Clicca per sincronizzare.`}
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Lavoro</p>
                    <p className="font-black text-slate-700 text-sm">€{product.labourCost.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-2">Provv. Est.</p>
                    <p className="font-black text-orange-600 text-sm">€{(product.externalCommission || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-center border-l border-slate-200">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Utile Est.</p>
                    <p className="font-black text-green-600 text-sm">€{profitExternal.toFixed(2)}</p>
                  </div>
                </div>

                {linkedGroups.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Varianti Attive</p>
                    <div className="flex flex-wrap gap-2">
                      {linkedGroups.map(group => (
                        <div key={group.id} className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2 font-black uppercase tracking-tight">
                          <Package size={10} />
                          {group.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
            <Package size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-black uppercase tracking-widest">Nessun prodotto a catalogo</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 text-[10px] font-black text-green-600 uppercase underline underline-offset-4">Aggiungi il tuo primo prodotto</button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
            <div className="p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black mb-8 text-slate-800 uppercase tracking-tight">{editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
              <form onSubmit={handleAddProduct} className="space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome del Prodotto</label>
                    <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Codice SKU</label>
                    <div className="relative">
                      <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        className="w-full pl-12 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-slate-300"
                        placeholder="ALOE-001"
                        value={formData.sku || ''}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prezzo Vendita (€)</label>
                    <input type="number" step="0.01" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Materiali (€)</label>
                    <input type="number" step="0.01" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.costPerItem || ''} onChange={e => setFormData({ ...formData, costPerItem: e.target.value === '' ? 0 : parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manodopera (€)</label>
                    <input type="number" step="0.01" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-green-500/10 transition-all" value={formData.labourCost || ''} onChange={e => setFormData({ ...formData, labourCost: e.target.value === '' ? 0 : parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <UserCheck size={12} /> Provv. Esterna (€)
                    </label>
                    <input type="number" step="0.01" className="w-full p-5 bg-orange-50/30 border border-orange-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all" value={formData.externalCommission || ''} onChange={e => setFormData({ ...formData, externalCommission: e.target.value === '' ? 0 : parseFloat(e.target.value) })} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Associa Varianti (Facoltativo)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {modifierGroups.map(group => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroupSelection(group.id)}
                        className={`p-4 text-left rounded-2xl border transition-all flex items-center justify-between group ${formData.modifierGroupIds?.includes(group.id)
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                          }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight">{group.name}</span>
                        {formData.modifierGroupIds?.includes(group.id) && <CheckSquare size={16} className="text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SKU Mapping for Shopify - ONLY show if variants are selected */}
                {(formData.modifierGroupIds || []).length > 0 && (
                  <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-blue-500" />
                      <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Mappatura SKU Varianti (Shopify)</h4>
                    </div>
                    <p className="text-[9px] font-medium text-blue-500 uppercase tracking-tight">Definisci SKU specifici per combinazioni di varianti. Gli ordini esterni verranno mappati automaticamente.</p>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase ml-1">SKU su Shopify</label>
                          <input id="vsku-code" className="w-full p-3 bg-white border border-blue-100 rounded-xl text-[10px] font-black" placeholder="ex: ALOE-500ML-MINT" />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Azioni</label>
                          <button
                            type="button"
                            onClick={() => {
                              const sku = (document.getElementById('vsku-code') as HTMLInputElement).value;
                              if (!sku) return;
                              const currentMap = formData.variantMap || {};
                              setFormData({ ...formData, variantMap: { ...currentMap, [sku]: {} } });
                              (document.getElementById('vsku-code') as HTMLInputElement).value = '';
                            }}
                            className="w-full bg-blue-600 text-white p-3 rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-all"
                          >Aggiungi</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Object.keys(formData.variantMap || {}).map(sku => (
                          <div key={sku} className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-700">{sku}</span>
                              <ArrowRight size={10} className="text-slate-300" />
                              <span className="text-[9px] text-blue-500 font-bold uppercase">Configura su Shopify</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newMap = { ...formData.variantMap };
                                delete newMap[sku];
                                setFormData({ ...formData, variantMap: newMap });
                              }}
                              className="text-red-300 hover:text-red-500"
                            ><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                  <button type="button" onClick={closeProductModal} className="px-8 py-3 rounded-2xl font-black text-xs text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Annulla</button>
                  <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-100 transition-all">
                    {editingProduct ? 'Aggiorna Prodotto' : 'Salva Prodotto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
