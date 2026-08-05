
import React from 'react';
import { useApp } from '../store';
import { TrendingUp, Wallet, ArrowUpRight, Receipt, PieChart, RefreshCw, Users } from 'lucide-react';

const Profits: React.FC = () => {
  const { orders, products, generalCosts, recipes, rawMaterials, salespersons, workspaceUsers } = useApp();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];


  // Safe date parsing that avoids UTC timezone off-by-one errors
  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00';
    return new Date(s);
  };

  // Filter orders for selected month/year
  const monthlyOrders = orders.filter(o => {
    const d = parseDate(o.date);
    return d && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // ── 1. FATTURATO LORDO: sum of prices for all non-free orders this month ──
  let grossRevenue = 0;
  monthlyOrders.forEach(order => {
    if (!order.isFree) {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) grossRevenue += product.price * item.quantity;
      });
    }
  });

  // ── 2. COSTI PRODUZIONE: material cost + labour for monthly orders ──
  let totalMaterialsCost = 0;
  let totalLabourCost = 0;

  monthlyOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;

      // Simply multiply the product's saved material cost by the ordered quantity
      totalMaterialsCost += (product.costPerItem || 0) * item.quantity;
      // Multiply the product's saved labour cost by the ordered quantity
      totalLabourCost += (product.labourCost || 0) * item.quantity;
    });
  });

  const totalProductionCost = totalMaterialsCost + totalLabourCost;

  // ── 3. SPESE RICORRENTI: only recurring expenses from Costi Generali ──
  const recurringExpenses = generalCosts.filter(c => c.isRecurring === true);
  const totalRecurringExpenses = recurringExpenses.reduce((sum, c) => sum + c.amount, 0);

  // ── 4. COLLABORATORI PROVVIGIONE: commission per order salesperson this month ──
  // For each order this month that has a salespersonId, sum commission field or
  // calculate from product's externalCommission × quantity
  const collaboratorBreakdown: Record<string, { name: string; commission: number }> = {};

  monthlyOrders.forEach(order => {
    if (!order.salespersonId) return;

    let orderCommission = 0;
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        orderCommission += (product.externalCommission || 0) * item.quantity;
      }
    });

    // Also include the flat commission field if set
    if (order.commission > 0) {
      orderCommission = order.commission;
    }

    if (orderCommission > 0) {
      const spId = order.salespersonId;
      if (!collaboratorBreakdown[spId]) {
        const sp = salespersons.find(s => s.id === spId);
        const wu = workspaceUsers.find(u => u.salespersonId === spId);
        collaboratorBreakdown[spId] = {
          name: wu?.name || wu?.username || sp?.name || 'Collaboratore',
          commission: 0
        };
      }
      collaboratorBreakdown[spId].commission += orderCommission;
    }
  });

  const totalCollaboratorCommissions = Object.values(collaboratorBreakdown).reduce((s, c) => s + c.commission, 0);
  const collaboratorEntries = Object.values(collaboratorBreakdown);

  // ── 5. GUADAGNO NETTO ──
  const netProfit = grossRevenue - totalProductionCost - totalRecurringExpenses - totalCollaboratorCommissions;
  const netGP = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Profitti e Guadagni</h2>
          <p className="text-slate-500 font-medium">Analisi basata sui costi reali di produzione e spese mensili.</p>
        </div>

        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Fatturato Lordo */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Fatturato Lordo</p>
            <h3 className="text-3xl font-black">€{grossRevenue.toFixed(2)}</h3>
            <div className="mt-3 flex items-center gap-2 text-green-400 text-xs font-bold">
              <ArrowUpRight size={14} /> {monthlyOrders.filter(o => !o.isFree).length} ordini • {months[selectedMonth]}
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-10"><Wallet size={120} /></div>
        </div>

        {/* Costi Produzione */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Costi Produzione</p>
          <h3 className="text-3xl font-black text-slate-800">€{totalProductionCost.toFixed(2)}</h3>
          <div className="mt-3 flex flex-col gap-1 text-[9px] font-black text-slate-400 uppercase">
            <span>Materie: €{totalMaterialsCost.toFixed(2)}</span>
            <span>Lavoro: €{totalLabourCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Spese Ricorrenti */}
        <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 shadow-sm">
          <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-1">Spese Ricorrenti</p>
          <h3 className="text-3xl font-black text-amber-700">€{totalRecurringExpenses.toFixed(2)}</h3>
          <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs font-bold">
            <RefreshCw size={14} /> {recurringExpenses.length} voci fisse/mese
          </div>
        </div>

        {/* Collaboratori Provvigione */}
        <div className="bg-purple-50 p-6 rounded-[2.5rem] border border-purple-100 shadow-sm">
          <p className="text-purple-600 text-[10px] font-bold uppercase tracking-widest mb-1">Collaboratori</p>
          <h3 className="text-3xl font-black text-purple-700">€{totalCollaboratorCommissions.toFixed(2)}</h3>
          <div className="mt-3 flex items-center gap-2 text-purple-500 text-xs font-bold">
            <Users size={14} /> {collaboratorEntries.length} collaboratori attivi
          </div>
        </div>

        {/* Guadagno Netto */}
        <div className={`p-6 rounded-[2.5rem] shadow-sm border ${netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className={`${netProfit >= 0 ? 'text-green-600' : 'text-red-600'} text-[10px] font-bold uppercase tracking-widest mb-1`}>Guadagno Netto</p>
          <h3 className={`text-3xl font-black ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>€{netProfit.toFixed(2)}</h3>
          <div className="mt-3">
            <span className={`${netProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-0.5 rounded uppercase text-[9px] font-black`}>{netGP.toFixed(1)}% Margine</span>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ripartizione Costi */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <PieChart className="text-blue-500" />
              Ripartizione Costi
            </h4>
            <TrendingUp className="text-slate-200" size={24} />
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {[
                { label: 'Materie Prime (Ricette)', value: totalMaterialsCost, color: 'bg-green-500' },
                { label: 'Manodopera Diretta', value: totalLabourCost, color: 'bg-blue-500' },
                { label: 'Spese Ricorrenti', value: totalRecurringExpenses, color: 'bg-amber-500' },
                { label: 'Provvigioni Collaboratori', value: totalCollaboratorCommissions, color: 'bg-purple-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-800">€{value.toFixed(2)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                    <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${grossRevenue > 0 ? Math.min(100, (value / grossRevenue) * 100) : 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dettaglio Spese Ricorrenti */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Receipt className="text-amber-500" />
              Spese Ricorrenti
            </h4>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 hide-scrollbar">
              {recurringExpenses.map(cost => (
                <div key={cost.id} className="flex justify-between items-center p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <div>
                    <p className="font-black text-slate-700 text-xs uppercase tracking-tight flex items-center gap-2">
                      {cost.name} <RefreshCw size={10} className="text-amber-600" />
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cost.category} • Ogni Mese</p>
                  </div>
                  <p className="font-black text-slate-900">€{cost.amount.toFixed(2)}</p>
                </div>
              ))}
              {recurringExpenses.length === 0 && (
                <div className="py-16 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">
                  Nessuna spesa ricorrente<br/>
                  <span className="text-[9px] normal-case">Aggiungile in Costi Generali</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dettaglio Collaboratori */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Users className="text-purple-500" />
              Provvigioni {months[selectedMonth]}
            </h4>
          </div>
          <div className="p-8">
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 hide-scrollbar">
              {collaboratorEntries.map((entry, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-purple-50 border border-purple-100">
                  <div>
                    <p className="font-black text-slate-700 text-xs uppercase tracking-tight">{entry.name}</p>
                    <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest">Collaboratore</p>
                  </div>
                  <p className="font-black text-purple-700">€{entry.commission.toFixed(2)}</p>
                </div>
              ))}
              {collaboratorEntries.length === 0 && (
                <div className="py-16 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">
                  Nessuna provvigione<br/>
                  <span className="text-[9px] normal-case">Nessun ordine da collaboratori</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profits;
