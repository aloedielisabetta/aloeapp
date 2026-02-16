
import React, { useState } from 'react';
import { useApp } from '../store';
import { Product, ModifierGroup, RawMaterial } from '../types';
import {
  Plus, Tag, DollarSign, Trash2, Layers, CheckSquare,
  Settings2, X, Edit2, UserCheck, Beaker, RefreshCw,
  Package, Coins, ChevronRight, Loader2, ArrowRight
} from 'lucide-react';

const Products: React.FC = () => {
  const {
    products, addProduct, updateProduct, deleteProduct,
    modifierGroups, addModifierGroup, updateModifierGroup, deleteModifierGroup,
    rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial,
    recipes, isSyncing
  } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [showManageRawMaterials, setShowManageRawMaterials] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [editingRM, setEditingRM] = useState<RawMaterial | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', price: 0, costPerItem: 0, labourCost: 0, externalCommission: 0, modifierGroupIds: []
  });

  const [groupFormData, setGroupFormData] = useState({ name: '', options: [] as string[] });
  const [newOption, setNewOption] = useState('');

  const [rmFormData, setRMFormData] = useState<Partial<RawMaterial>>({
    name: '', unit: 'gr', totalQuantity: 0, totalPrice: 0
  });

  const CONVERSIONS: Record<string, Record<string, number>> = {
    'kg': { 'gr': 1000, 'g': 1000 },
    'Kg': { 'gr': 1000, 'g': 1000 },
    'gr': { 'kg': 0.001, 'Kg': 0.001, 'g': 1 },
    'g': { 'kg': 0.001, 'Kg': 0.001, 'gr': 1 },
    'lit': { 'ml': 1000 },
    'l': { 'ml': 1000 },
    'ml': { 'lit': 0.001, 'l': 0.001 },
  };

  const getIngredientDynamicCostValue = (ing: any) => {
    if (ing.rawMaterialId) {
      const rm = rawMaterials.find(r => r.id === ing.rawMaterialId);
      if (rm && rm.totalQuantity > 0) {
        const baseCostPerUnit = rm.totalPrice / rm.totalQuantity;
        const factor = CONVERSIONS[ing.unit]?.[rm.unit] || 1;
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

  const toggleGroupSelection = (groupId: string) => {
    const current = formData.modifierGroupIds || [];
    if (current.includes(groupId)) {
      setFormData({ ...formData, modifierGroupIds: current.filter(id => id !== groupId) });
    } else {
      setFormData({ ...formData, modifierGroupIds: [...current, groupId] });
    }
  };

  const handleOpenEditRM = (rm: RawMaterial) => {
    setEditingRM(rm);
    setRMFormData({
      name: rm.name,
      unit: rm.unit,
      totalQuantity: rm.totalQuantity,
      totalPrice: rm.totalPrice
    });
    const modalContent = document.getElementById('rm-modal-scroll');
    if (modalContent) modalContent.scrollTop = 0;
  };

  const handleSaveRM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmFormData.name || (rmFormData.totalQuantity || 0) <= 0) return;

    try {
      if (editingRM) {
        await updateRawMaterial({
          ...editingRM,
          name: rmFormData.name!,
          unit: rmFormData.unit!,
          totalQuantity: rmFormData.totalQuantity!,
          totalPrice: rmFormData.totalPrice || 0
        });
        setEditingRM(null);
      } else {
        await addRawMaterial(rmFormData as Omit<RawMaterial, 'id' | 'workspaceId'>);
      }
      setRMFormData({ name: '', unit: 'gr', totalQuantity: 0, totalPrice: 0 });
    } catch (err: any) {
      alert(`Errore materia prima: ${err.message}`);
    }
  };

  const handleDeleteRM = async (id: string) => {
    if (confirm('Eliminare questa materia prima?')) {
      await deleteRawMaterial(id);
    }
  };

  const generateSku = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Space to dash
      .slice(0, 15);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    // Auto-generate SKU only if we are creating new or SKU was manually cleared/empty
    // And don't overwrite if user might have typed a custom one? 
    // Let's just do it if SKU is empty OR matches the previous auto-generated version.
    // Simpler: Just do it if SKU is empty or user is typing.

    // We will auto-fill if the current SKU box is empty or matches a simple slug of the OLD name.
    // For simplicity in this interaction: Update SKU if it's not "locked" - but we don't have lock state.
    // UX Decision: Only auto-fill if SKU is empty.
    if (!formData.name && !formData.sku) {
      // First char typing
      setFormData({ ...formData, name: newName, sku: generateSku(newName) });
    } else if (formData.sku === generateSku(formData.name || '')) {
      // Updating name and SKU was auto-generated before (matches pattern), so update SKU too
      setFormData({ ...formData, name: newName, sku: generateSku(newName) });
    } else {
      // Just update name
      setFormData({ ...formData, name: newName });
    }
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

  const handleExportSkus = () => {
    if (products.length === 0) {
      alert("Nessun prodotto da esportare.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Product Name,SKU,Variant Combination,Generated Variant SKU,Price\n";

    products.forEach(product => {
      const baseSku = product.sku || generateSku(product.name);

      // Get linked modifier groups
      const linkedGroups = modifierGroups.filter(g => product.modifierGroupIds.includes(g.id));

      if (linkedGroups.length === 0) {
        // Simple product
        csvContent += `"${product.name}","${baseSku}","N/A","${baseSku}","${product.price}"\n`;
      } else {
        // Complex product - generate combinations
        // Prepare arrays of options: [ ["Small", "Large"], ["Mint", "Lemon"] ]
        const groupOptions = linkedGroups.map(g => g.options);

        // If there are options, calculate combinations
        if (groupOptions.length > 0 && groupOptions.every(o => o.length > 0)) {
          const combinations = cartesian(groupOptions);

          combinations.forEach(combo => {
            // Combo is ["Small", "Mint"]
            const variantSuffix = combo.map(c => c.toUpperCase().replace(/\s+/g, '').slice(0, 3)).join('-');
            const variantSku = `${baseSku}-${variantSuffix}`;
            const variantName = combo.join(' / ');

            csvContent += `"${product.name}","${baseSku}","${variantName}","${variantSku}","${product.price}"\n`;
          });
        } else {
          // Groups exist but explicit options might be empty? Fallback
          csvContent += `"${product.name}","${baseSku}","Varianti non configurate","${baseSku}","${product.price}"\n`;
        }
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ALOE_SKU_EXPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestione Prodotti</h2>
          <p className="text-slate-500 font-medium">Gestisci il listino, i margini e le varianti disponibili.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowManageRawMaterials(true)}
            className="bg-rose-50 text-rose-700 px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-rose-100 transition-all font-bold text-sm shadow-sm border border-rose-100"
          >
            <Package size={18} /> Crea/Gestisci Materie Prime
          </button>
          <button
            onClick={() => setShowManageGroups(true)}
            className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-slate-200 transition-all font-bold text-sm shadow-sm"
          >
            <Settings2 size={18} /> Crea/Gestisci Varianti
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-green-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all font-bold text-sm shadow-xl shadow-green-100"
          >
            <Plus size={18} /> Crea Prodotto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.map(product => {
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
                          <Layers size={10} />
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
                              // In a real implementation, we'd have a UI to select the modifier values here
                              // For now, we'll initialize an empty record and explain to the user
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

      {showManageGroups && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center shrink-0 bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Varianti Prodotti</h3>
              <button onClick={() => { setShowManageGroups(false); setEditingGroup(null); }} className="p-3 bg-white hover:bg-slate-50 rounded-2xl text-slate-400 transition-all border border-slate-100">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  {editingGroup ? 'Modifica Gruppo' : 'Crea Nuovo Gruppo Varianti'}
                </h4>
                <form onSubmit={handleAddGroup} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Nome Gruppo</label>
                    <input
                      className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      placeholder="e.g. Tipo Dolcificante"
                      value={groupFormData.name}
                      onChange={e => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Aggiungi Opzioni</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 p-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        placeholder="Nome opzione..."
                        value={newOption}
                        onChange={e => setNewOption(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); (document.getElementById('addOptBtn') as HTMLButtonElement).click(); } }}
                      />
                      <button
                        id="addOptBtn"
                        type="button"
                        onClick={() => {
                          if (newOption && !groupFormData.options.includes(newOption)) {
                            setGroupFormData({ ...groupFormData, options: [...groupFormData.options, newOption] });
                            setNewOption('');
                          }
                        }}
                        className="bg-slate-900 text-white px-6 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg"
                      ><Plus size={20} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupFormData.options.map(opt => (
                      <span key={opt} className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-700 flex items-center gap-3 shadow-sm uppercase tracking-tight">
                        {opt}
                        <button type="button" onClick={() => setGroupFormData({ ...groupFormData, options: groupFormData.options.filter(o => o !== opt) })} className="text-red-300 hover:text-red-500 transition-colors">×</button>
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
                      <button type="button" onClick={() => { setEditingGroup(null); setGroupFormData({ name: '', options: [] }); }} className="px-6 py-4 bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl">Annulla</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Elenco Gruppi Attivi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modifierGroups.map(group => (
                    <div key={group.id} className="p-6 border border-slate-100 rounded-[2rem] bg-white shadow-sm flex flex-col gap-4 relative group hover:border-emerald-200 transition-all">
                      <div className="absolute top-4 right-4 flex gap-1">
                        <button onClick={() => handleOpenEditGroup(group)} className="text-slate-200 hover:text-blue-500 p-2 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteGroup(group.id)} className="text-slate-200 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                      </div>
                      <h5 className="font-black text-slate-800 text-xs uppercase tracking-widest">{group.name}</h5>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {group.options.map(o => (
                          <span key={o} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100 font-black uppercase tracking-tight">{o}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageRawMaterials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center shrink-0 bg-rose-50/50">
              <div className="flex items-center gap-3">
                <Package className="text-rose-600" size={28} />
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestione Materie Prime</h3>
              </div>
              <button onClick={() => { setShowManageRawMaterials(false); setEditingRM(null); setRMFormData({ name: '', unit: 'gr', totalQuantity: 0, totalPrice: 0 }); }} className="p-3 bg-white hover:bg-slate-50 rounded-2xl text-slate-400 transition-all border border-slate-100">×</button>
            </div>

            <div id="rm-modal-scroll" className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
              <div className={`p-6 rounded-[2rem] border transition-all shadow-inner ${editingRM ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${editingRM ? 'text-amber-600' : 'text-slate-400'}`}>
                  {editingRM ? `Stai Modificando: ${editingRM.name}` : 'Registra Nuova Materia Prima'}
                </h4>
                <form onSubmit={handleSaveRM} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Nome Ingrediente</label>
                      <input
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all"
                        placeholder="e.g. Miele di Acacia Bio"
                        value={rmFormData.name}
                        onChange={e => setRMFormData({ ...rmFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Prezzo Totale (€)</label>
                      <input
                        type="number" step="0.01"
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all"
                        placeholder="0.00"
                        value={rmFormData.totalPrice || ''}
                        onChange={e => setRMFormData({ ...rmFormData, totalPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Dimensione Confezione</label>
                      <div className="flex gap-2">
                        <input
                          type="number" step="0.01"
                          className="flex-1 p-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all"
                          placeholder="1000"
                          value={rmFormData.totalQuantity || ''}
                          onChange={e => setRMFormData({ ...rmFormData, totalQuantity: parseFloat(e.target.value) || 0 })}
                          required
                        />
                        <select className="p-4 bg-white border border-slate-100 rounded-2xl font-black text-slate-700 uppercase text-[10px] w-24" value={rmFormData.unit} onChange={e => setRMFormData({ ...rmFormData, unit: e.target.value })}>
                          <option value="gr">gr</option>
                          <option value="Kg">Kg</option>
                          <option value="ml">ml</option>
                          <option value="lit">lit</option>
                          <option value="Unità">Unità</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full p-4 bg-rose-100/30 border border-rose-100 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Costo Unitario</p>
                          <p className="text-xl font-black text-rose-800">
                            €{(rmFormData.totalPrice && rmFormData.totalQuantity ? rmFormData.totalPrice / rmFormData.totalQuantity : 0).toFixed(4)}
                            <span className="text-[10px] ml-1 font-bold">/ {rmFormData.unit}</span>
                          </p>
                        </div>
                        <Coins className="text-rose-300" size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className={`flex-1 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${editingRM ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'} disabled:opacity-50`}
                      disabled={!rmFormData.name || (rmFormData.totalQuantity || 0) <= 0}
                    >
                      {editingRM ? 'Applica Modifiche' : 'Registra'}
                    </button>
                    {editingRM && (
                      <button type="button" onClick={() => { setEditingRM(null); setRMFormData({ name: '', unit: 'gr', totalQuantity: 0, totalPrice: 0 }); }} className="px-6 py-4 bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl">Annulla</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Stock Materie Prime</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                  {rawMaterials.map(rm => (
                    <div key={rm.id} className={`p-5 border rounded-[2rem] shadow-sm flex items-center justify-between group transition-all ${editingRM?.id === rm.id ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 hover:border-rose-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all ${editingRM?.id === rm.id ? 'bg-amber-600 text-white' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-600 group-hover:text-white'}`}>
                          <Package size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-black text-slate-800 text-xs uppercase tracking-tight truncate">{rm.name}</h5>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {rm.totalQuantity} {rm.unit} • €{rm.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenEditRM(rm)} className={`p-2 rounded-xl transition-colors ${editingRM?.id === rm.id ? 'text-amber-600' : 'text-slate-200 hover:text-blue-500'}`}><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteRM(rm.id)} className="text-slate-200 hover:text-red-500 p-2 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {rawMaterials.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem]">
                      <Package className="mx-auto text-slate-200 mb-3 opacity-20" size={48} />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nessuna materia prima in magazzino</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
