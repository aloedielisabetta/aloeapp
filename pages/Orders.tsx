
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { Order, OrderItem } from '../types';
import {
  Plus, ShoppingBag, ExternalLink, Calendar, Search,
  Trash2, Layers, ChevronLeft, ChevronRight, Info,
  Truck, Gift, FilterX, RefreshCw, Database, AlertCircle, User, Loader2, XCircle, Check, X, ChevronDown, Sparkles, Briefcase, Edit2
} from 'lucide-react';

const Orders: React.FC = () => {
  const {
    orders, addOrder, updateOrder, deleteOrder, patients, products,
    cities, modifierGroups, salespersons, currentUser,
    currentWorkspace, syncData, isSyncing
  } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isExternal, setIsExternal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | 'Tutte'>('Tutte');
  const [viewDate, setViewDate] = useState(new Date());

  const [uiError, setUiError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const [orderData, setOrderData] = useState<{
    patientId: string;
    items: OrderItem[];
    commission: number;
    salespersonId: string;
    isShipping: boolean;
    isFree: boolean;
  }>({
    patientId: '',
    items: [],
    commission: 0,
    salespersonId: isAdmin ? '' : (currentUser?.salespersonId || ''),
    isShipping: false,
    isFree: false
  });

  // Calcolo automatico provvigione basato sui prodotti selezionati
  useEffect(() => {
    // Calcoliamo la provvigione automatica solo se è un ordine esterno
    // ed è in fase di creazione (non sovrascriviamo se stiamo caricando un ordine per modifica, 
    // a meno che l'utente non cambi i prodotti)
    if (isExternal) {
      const totalAutoCommission = orderData.items.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        return acc + (product?.externalCommission || 0) * item.quantity;
      }, 0);

      // Aggiorniamo lo stato solo se il valore calcolato è diverso da quello attuale
      // per evitare loop infiniti di render
      if (orderData.commission !== totalAutoCommission && !editingOrder) {
        setOrderData(prev => ({ ...prev, commission: totalAutoCommission }));
      }
    } else {
      // Se non è esterno, la provvigione deve essere 0
      if (orderData.commission !== 0 && !editingOrder) {
        setOrderData(prev => ({ ...prev, commission: 0 }));
      }
    }
  }, [orderData.items, isExternal, products, editingOrder]);

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsExternal(order.isExternal);
    setOrderData({
      patientId: order.patientId,
      items: order.items,
      commission: order.commission,
      salespersonId: order.salespersonId || '',
      isShipping: !!order.isShipping,
      isFree: !!order.isFree
    });
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!orderData.patientId || orderData.items.length === 0 || !currentWorkspace) {
      alert("Dati ordine incompleti. Seleziona un paziente e almeno un prodotto.");
      return;
    }

    const cleanedItems = orderData.items.map(item => {
      const filteredModifiers = Object.fromEntries(
        Object.entries(item.selectedModifiers).filter(([_, val]) => val !== '')
      );
      return { ...item, selectedModifiers: filteredModifiers };
    });

    try {
      if (editingOrder) {
        await updateOrder({
          ...editingOrder,
          patientId: orderData.patientId,
          items: cleanedItems.filter(item => item.quantity > 0),
          isExternal: isAdmin ? isExternal : true,
          isShipping: orderData.isShipping,
          isFree: orderData.isFree,
          commission: (isAdmin ? isExternal : true) ? orderData.commission : 0,
          salespersonId: isAdmin ? (isExternal ? orderData.salespersonId : undefined) : currentUser?.salespersonId,
        });
      } else {
        await addOrder({
          patientId: orderData.patientId,
          items: cleanedItems.filter(item => item.quantity > 0),
          date: new Date().toISOString(),
          isExternal: isAdmin ? isExternal : true,
          isShipping: orderData.isShipping,
          isFree: orderData.isFree,
          commission: (isAdmin ? isExternal : true) ? orderData.commission : 0,
          salespersonId: isAdmin ? (isExternal ? orderData.salespersonId : undefined) : currentUser?.salespersonId,
          status: 'In attesa'
        });
      }
      setShowAdd(false);
      resetAddForm();
    } catch (error) {
      console.error("Errore salvataggio ordine:", error);
    }
  };

  const resetAddForm = () => {
    setOrderData({
      patientId: '',
      items: [],
      commission: 0,
      salespersonId: isAdmin ? '' : (currentUser?.salespersonId || ''),
      isShipping: false,
      isFree: false
    });
    setEditingOrder(null);
    setIsExternal(false);
  };

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const initialModifiers: Record<string, string> = {};
    product.modifierGroupIds.forEach(mgId => {
      initialModifiers[mgId] = '';
    });

    setOrderData({
      ...orderData,
      items: [...orderData.items, { productId, quantity: 1, selectedModifiers: initialModifiers }]
    });
  };

  const removeItem = (index: number) => {
    setOrderData({
      ...orderData,
      items: orderData.items.filter((_, i) => i !== index)
    });
  };

  const updateItemQty = (index: number, qty: number) => {
    const newItems = [...orderData.items];
    newItems[index].quantity = Math.max(1, qty);
    setOrderData({ ...orderData, items: newItems });
  };

  const updateItemModifier = (itemIndex: number, groupId: string, option: string) => {
    const newItems = [...orderData.items];
    newItems[itemIndex].selectedModifiers = {
      ...newItems[itemIndex].selectedModifiers,
      [groupId]: option
    };
    setOrderData({ ...orderData, items: newItems });
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = order.date ? new Date(order.date) : null;
    if (!orderDate) return false;
    const matchesMonth = orderDate.getMonth() === viewDate.getMonth() && orderDate.getFullYear() === viewDate.getFullYear();
    if (!matchesMonth) return false;
    if (!isAdmin && order.salespersonId !== currentUser?.salespersonId) return false;
    const patient = patients.find(p => p.id === order.patientId);
    if (!patient) return !search && selectedCity === 'Tutte';
    const nameMatch = `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(search.toLowerCase());

    // Robust city matching: handles both city names and IDs stored in the patient record
    const cityMatch = selectedCity === 'Tutte' || (() => {
      if (!patient.city) return false;
      const normalizedSelected = selectedCity.trim().toLowerCase();
      const normalizedPatientCity = patient.city.trim().toLowerCase();

      // 1. Direct name match
      if (normalizedPatientCity === normalizedSelected) return true;

      // 3. ID match: check if patient.city is an ID that belongs to a city with the selected name
      const cityById = cities.find(c => c.id === patient.city);
      if (cityById && cityById.name.trim().toLowerCase() === normalizedSelected) return true;

      return false;
    })();

    return nameMatch && cityMatch;
  });

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    setUiError(null);
    try {
      await deleteOrder(id);
      setConfirmDeleteId(null);
    } catch (error: any) {
      setUiError(`ERRORE: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-6 relative">
      {/* BANNER ERRORE FISSO */}
      {uiError && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-lg">
          <div className="bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl border-4 border-red-400 flex flex-col items-center gap-4 text-center">
            <XCircle size={48} />
            <p className="font-black uppercase tracking-tighter text-xl">Errore Sistema</p>
            <p className="font-bold text-sm opacity-90">{uiError}</p>
            <button onClick={() => setUiError(null)} className="bg-white text-red-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest">Chiudi</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Gestione Ordini</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-slate-500 font-medium">Visualizzazione mensile.</span>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-sm shadow-green-100/50">
              <Database size={12} className="text-green-600" />
              <span className="text-green-700 text-[10px] font-black uppercase tracking-tighter">{orders.length} ordini</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={isSyncing} onClick={() => syncData()} className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
            <RefreshCw size={18} className={isSyncing ? "animate-spin text-blue-500" : ""} /> Aggiorna
          </button>
          <button onClick={() => { setIsExternal(true); setShowAdd(true); }} className="bg-orange-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-orange-700 transition-all font-bold text-sm shadow-xl shadow-orange-100">
            <ExternalLink size={18} /> Nuovo Esterno
          </button>
          {isAdmin && (
            <button onClick={() => { setIsExternal(false); setShowAdd(true); }} className="bg-green-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-green-700 transition-all font-bold text-sm shadow-xl shadow-green-100">
              <Plus size={18} /> Nuovo Interno
            </button>
          )}
        </div>
      </div>

      {/* FILTRI */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-green-600 transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-xs font-black text-slate-700 min-w-[150px] text-center uppercase tracking-widest">
            {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-green-600 transition-colors"><ChevronRight size={20} /></button>
        </div>

        <div className="flex flex-1 w-full md:w-auto gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Filtra pazienti..." className="pl-12 pr-4 py-3 w-full bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/10 text-sm font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 overflow-x-auto bg-slate-50 p-1.5 rounded-2xl shrink-0 border border-slate-100 shadow-inner">
            <button onClick={() => setSelectedCity('Tutte')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCity === 'Tutte' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}>Tutte</button>
            {cities.map(c => (
              <button key={c.id} onClick={() => setSelectedCity(c.name)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCity === c.name ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}>{c.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* TABELLA ORDINI */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Data / ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Paziente / Collaboratore</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Prodotti</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Stato</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(order => {
                const patient = patients.find(p => p.id === order.patientId);
                const salesperson = salespersons.find(s => s.id === order.salespersonId);
                const isMyOrder = currentUser?.salespersonId && order.salespersonId === currentUser.salespersonId;
                const canModify = isAdmin || isMyOrder;
                const isDeleting = deletingId === order.id;
                const isConfirming = confirmDeleteId === order.id;

                return (
                  <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${isDeleting ? 'opacity-50 animate-pulse bg-red-50' : ''}`}>
                    <td className="px-8 py-5">
                      <p className="text-[10px] text-slate-700 font-black flex items-center gap-1 uppercase tracking-tight"><Calendar size={10} /> {order.date ? new Date(order.date).toLocaleDateString('it-IT') : '---'}</p>
                      <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">ID: {order.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-8 py-5">
                      {patient ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 text-sm uppercase">{patient.firstName} {patient.lastName}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient.city}</p>
                            {order.isExternal ? (
                              <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-orange-100 flex items-center gap-1">
                                <User size={8} /> {salesperson?.name || 'Agente Esterno'}
                              </span>
                            ) : (
                              <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-green-100 flex items-center gap-1">
                                <Sparkles size={8} /> Interno
                              </span>
                            )}
                            {order.isShipping && (
                              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-blue-100 flex items-center gap-1">
                                <Truck size={8} /> Spedizione
                              </span>
                            )}
                            {order.isFree && (
                              <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-purple-100 flex items-center gap-1">
                                <Gift size={8} /> Omaggio
                              </span>
                            )}
                          </div>
                        </div>
                      ) : <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Paziente Non Trovato</p>}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2 max-w-md">
                        {(order.items || []).map((item, idx) => {
                          const product = products.find(p => p.id === item.productId);
                          const activeModifiers = Object.entries(item.selectedModifiers).filter(([_, val]) => val !== '');

                          return (
                            <div key={idx} className="bg-white text-slate-700 border border-slate-100 p-2.5 rounded-2xl text-[10px] shadow-sm flex flex-col gap-1">
                              <div><span className="font-black text-green-700 mr-2">{item.quantity}x</span><span className="font-black text-slate-800">{product?.name || 'Prodotto'}</span></div>
                              {activeModifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {activeModifiers.map(([mgId, opt]) => {
                                    const mg = modifierGroups.find(g => g.id === mgId);
                                    return <span key={mgId} className="bg-emerald-50 px-1.5 py-0.5 rounded-md text-[8px] font-black text-emerald-600 uppercase border border-emerald-100">{mg?.name}: {opt}</span>;
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">{order.status}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {canModify && (
                        <div className="flex items-center justify-end gap-2">
                          {!isConfirming && (
                            <button onClick={() => handleEdit(order)} className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all">
                              <Edit2 size={20} />
                            </button>
                          )}

                          {isConfirming ? (
                            <div className="flex items-center gap-2 animate-in zoom-in duration-200">
                              <button onClick={() => executeDelete(order.id)} disabled={isDeleting} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg">
                                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {isDeleting ? "Elimino..." : "SÌ, ELIMINA"}
                              </button>
                              <button onClick={() => setConfirmDeleteId(null)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300"><X size={12} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(order.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUOVO/MODIFICA ORDINE */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
            <div className={`p-8 border-b border-slate-50 flex justify-between items-center shrink-0 ${isExternal ? 'bg-orange-50/50' : 'bg-green-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl text-white shadow-lg ${isExternal ? 'bg-orange-600' : 'bg-green-600'}`}>
                  {editingOrder ? <Edit2 size={24} /> : (isExternal ? <ExternalLink size={24} /> : <ShoppingBag size={24} />)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
                    {editingOrder ? 'Modifica Ordine' : `Nuovo Ordine ${isExternal ? 'Esterno' : 'Interno'}`}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configura i prodotti e il paziente</p>
                </div>
              </div>
              <button onClick={() => { setShowAdd(false); resetAddForm(); }} className="p-3 bg-white hover:bg-slate-50 rounded-2xl text-slate-400 transition-all border border-slate-100"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
              {/* Paziente */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleziona Paziente</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <select className="w-full pl-14 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 outline-none appearance-none focus:ring-4 focus:ring-green-500/10" value={orderData.patientId} onChange={e => setOrderData({ ...orderData, patientId: e.target.value })}>
                    <option value="">Scegli Paziente...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.city})</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                </div>
              </div>

              {/* Prodotti */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prodotti nel carrello</label>
                  <div className="flex gap-2">
                    <select className="p-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-lg active:scale-95" onChange={e => { if (e.target.value) addItem(e.target.value); e.target.value = ''; }}>
                      <option value="">+ Aggiungi Prodotto</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} - €{p.price}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {orderData.items.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 group transition-all hover:border-green-200 shadow-inner">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-white rounded-xl flex items-center justify-center font-black text-xs text-green-700 border border-slate-100 shadow-sm">{idx + 1}</span>
                            <p className="font-black text-slate-800 text-sm uppercase">{product?.name}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm">
                              <button onClick={() => updateItemQty(idx, item.quantity - 1)} className="text-slate-400 hover:text-green-600 font-black px-2">-</button>
                              <span className="font-black text-xs min-w-[20px] text-center">{item.quantity}</span>
                              <button onClick={() => updateItemQty(idx, item.quantity + 1)} className="text-slate-400 hover:text-green-600 font-black px-2">+</button>
                            </div>
                            <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                          </div>
                        </div>

                        {product?.modifierGroupIds && product.modifierGroupIds.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200/50">
                            {product.modifierGroupIds.map(mgId => {
                              const mg = modifierGroups.find(g => g.id === mgId);
                              if (!mg) return null;
                              return (
                                <div key={mgId} className="space-y-1.5">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1 flex items-center gap-1.5">
                                    <Sparkles size={10} className="text-emerald-500" /> {mg.name} (Opzionale)
                                  </label>
                                  <select
                                    className={`w-full p-3 border rounded-2xl text-[10px] font-black outline-none transition-all ${item.selectedModifiers[mgId]
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-white border-slate-200 text-slate-400'
                                      }`}
                                    value={item.selectedModifiers[mgId] || ''}
                                    onChange={e => updateItemModifier(idx, mgId, e.target.value)}
                                  >
                                    <option value="">Standard / Nessuna</option>
                                    {mg.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {orderData.items.length === 0 && (
                    <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem]">
                      <ShoppingBag className="mx-auto text-slate-200 mb-2 opacity-30" size={32} />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Il carrello è vuoto</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sezione Esterna */}
              {isExternal && (
                <div className="bg-orange-50/50 p-6 rounded-[2.5rem] border border-orange-100 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Collaboratore Esterno</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-300" size={20} />
                      <select className="w-full pl-14 pr-5 py-5 bg-white border border-orange-100 rounded-3xl font-black text-slate-700 outline-none appearance-none focus:ring-4 focus:ring-orange-500/10" value={orderData.salespersonId} onChange={e => setOrderData({ ...orderData, salespersonId: e.target.value })} disabled={!isAdmin}>
                        <option value="">Scegli Collaboratore...</option>
                        {salespersons.filter(s => !s.isHidden).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-300 pointer-events-none" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Sparkles size={12} className="text-orange-400" /> Provvigione Totale (€)
                    </label>
                    <input type="number" step="0.01" className="w-full p-5 bg-white border border-orange-100 rounded-3xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-orange-500/10" value={orderData.commission || ''} onChange={e => setOrderData({ ...orderData, commission: parseFloat(e.target.value) || 0 })} />
                    <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest ml-1">Valore calcolato automaticamente dai prezzi prodotto.</p>
                  </div>
                </div>
              )}

              {/* Opzioni */}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setOrderData({ ...orderData, isShipping: !orderData.isShipping })} className={`p-5 rounded-3xl border flex items-center justify-between transition-all group ${orderData.isShipping ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                  <div className="flex items-center gap-3">
                    <Truck size={20} className={orderData.isShipping ? "text-blue-600" : "text-slate-200"} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Spedizione</span>
                  </div>
                  {orderData.isShipping && <Check size={16} />}
                </button>
                <button onClick={() => setOrderData({ ...orderData, isFree: !orderData.isFree })} className={`p-5 rounded-3xl border flex items-center justify-between transition-all group ${orderData.isFree ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                  <div className="flex items-center gap-3">
                    <Gift size={20} className={orderData.isFree ? "text-purple-600" : "text-slate-200"} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Omaggio</span>
                  </div>
                  {orderData.isFree && <Check size={16} />}
                </button>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 shrink-0 flex gap-4 bg-slate-50/50">
              <button onClick={() => { setShowAdd(false); resetAddForm(); }} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Annulla</button>
              <button onClick={handleAdd} disabled={!orderData.patientId || orderData.items.length === 0} className={`flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-30 ${isExternal ? 'bg-orange-600 shadow-orange-100' : 'bg-green-600 shadow-green-100'}`}>
                {editingOrder ? 'Salva Modifiche' : 'Crea Ordine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
