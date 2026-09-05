import React, { useState } from 'react';
import { useApp } from '../store';
import { Coins, Clock, ShoppingBag, Wallet, TrendingUp, DollarSign } from 'lucide-react';

const GuadagnoMensile: React.FC = () => {
  const { orders, products, patients, laborRecords, currentUser, salespersons } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00';
    return new Date(s);
  };

  const isAdmin = currentUser?.role === 'admin';
  const mySalespersonId = currentUser?.salespersonId || '';

  // Get collaborator name
  const collaboratorName = salespersons.find(s => s.id === mySalespersonId)?.name || 'Collaboratore';

  // 1. FILTER ORDERS
  const monthlyOrders = orders.filter(o => {
    // Must belong to current salesperson (or if admin, show salespersonId matching if one is selected, but if we're in the collaborator portal we filter by collaborator's ID)
    const isUserSalesperson = (o.isExternal || !!o.salespersonId) && o.salespersonId === mySalespersonId;
    if (!isUserSalesperson) return false;

    const d = parseDate(o.date);
    return d && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Calculate order commissions & sales value
  let monthlyCommissions = 0;
  let monthlySalesValue = 0;

  monthlyOrders.forEach(order => {
    let orderValue = 0;
    if (!order.isFree) {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) orderValue += product.price * item.quantity;
      });
    }
    monthlySalesValue += orderValue;
    monthlyCommissions += order.commission;
  });


  // 2. FILTER LABOR RECORDS
  const monthlyLaborRecords = laborRecords.filter(r => {
    if (r.salespersonId !== mySalespersonId) return false;
    const d = parseDate(r.date);
    return d && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const monthlyLaborEarnings = monthlyLaborRecords.reduce((sum, r) => sum + (r.hours * r.hourlyRate), 0);

  // 3. TOTAL COLLABORATOR EARNINGS
  const totalCollaboratorEarnings = monthlyCommissions + monthlyLaborEarnings;

  // 4. NET TO WORKSPACE (Total sold - commissions - labor earnings)
  const monthlyNetSales = monthlySalesValue - monthlyCommissions - monthlyLaborEarnings;

  if (!currentUser?.salespersonId) {
    return (
      <div className="py-20 text-center space-y-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm max-w-xl mx-auto mt-10">
        <AlertCircle size={48} className="mx-auto text-amber-500 animate-bounce" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nessun Collaboratore collegato a questa utenza.</p>
        <p className="text-slate-400 text-xs px-10">Assicurati che il tuo account utente sia associato a un collaboratore in Accesso Collaboratori.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section with Date selectors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Guadagno Mensile</h2>
          <p className="text-slate-500 font-medium">Visualizza il riepilogo complessivo dei tuoi guadagni mensili.</p>
        </div>

        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest p-2 outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest p-2 outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Main Total Highlight Card */}
      <div className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-3 z-10">
          <p className="text-sky-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Wallet size={16} /> Guadagno Collaboratore Totale
          </p>
          <h3 className="text-5xl md:text-6xl font-black">€{totalCollaboratorEarnings.toFixed(2)}</h3>
          <p className="text-slate-400 text-xs font-medium">
            Somma calcolata per {months[selectedMonth]} {selectedYear} per {collaboratorName}.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto z-10">
          <div className="flex justify-between md:justify-start items-center gap-6 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Provvigioni</span>
            <span className="text-lg font-black text-amber-400">€{monthlyCommissions.toFixed(2)}</span>
          </div>
          <div className="flex justify-between md:justify-start items-center gap-6 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Manodopera</span>
            <span className="text-lg font-black text-rose-400">€{monthlyLaborEarnings.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Provvigioni card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-200 transition-all">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Mie Provvigioni</p>
            <h4 className="text-3xl font-black text-slate-800">€{monthlyCommissions.toFixed(2)}</h4>
          </div>
          <div className="mt-6 flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase">
            <Coins size={14} className="text-amber-500" /> Crediti da vendite
          </div>
        </div>

        {/* Manodopera card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-rose-200 transition-all">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Guadagno Manodopera</p>
            <h4 className="text-3xl font-black text-slate-800">€{monthlyLaborEarnings.toFixed(2)}</h4>
          </div>
          <div className="mt-6 flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase">
            <Clock size={14} className="text-rose-500" /> Ore di produzione
          </div>
        </div>

        {/* Netto aziendale card */}
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between group hover:border-slate-800 transition-all">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Netto Aziendale</p>
            <h4 className="text-3xl font-black text-white">€{monthlyNetSales.toFixed(2)}</h4>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-400 text-[10px] font-black uppercase">
            <TrendingUp size={14} className="text-green-400" /> Spettanza Azienda
          </div>
        </div>
      </div>

      {/* Orders breakdown table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dettaglio Vendite e Provvigioni</h4>
          <ShoppingBag className="text-slate-200" size={24} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paziente</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valore Ordine</th>
                <th className="px-8 py-4 text-[10px] font-black text-amber-400 uppercase tracking-widest text-right">Provvigione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthlyOrders.map(order => {
                const patient = patients.find(p => p.id === order.patientId);
                const orderValue = order.isFree ? 0 : order.items.reduce((sum, item) => {
                  const product = products.find(p => p.id === item.productId);
                  return sum + (product?.price || 0) * item.quantity;
                }, 0);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">
                      {new Date(order.createdAt || order.date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-bold text-slate-700">{patient?.firstName} {patient?.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{patient?.city}</p>
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-slate-700">
                      €{orderValue.toFixed(2)}
                    </td>
                    <td className="px-8 py-4 text-right font-black text-amber-600">
                      €{order.commission.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {monthlyOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <ShoppingBag size={32} className="mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nessuna vendita registrata in questo mese</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuadagnoMensile;
