
import React from 'react';
import { useApp } from '../store';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, UserCheck, Receipt, PieChart, RefreshCw } from 'lucide-react';

const Profits: React.FC = () => {
  const { orders, products, generalCosts, recipes, rawMaterials } = useApp();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const getIngredientDynamicCost = (ing: any) => {
    if (ing.rawMaterialId) {
      const rm = rawMaterials.find(r => r.id === ing.rawMaterialId);
      if (rm) return (rm.totalPrice / rm.totalQuantity) * ing.quantity;
    }
    return ing.quantity * ing.costPerUnit;
  };

  let grossRevenue = 0;
  let totalMaterialsCost = 0;
  let totalLabourCost = 0;
  let totalCommissions = 0;

  // Filter orders for the selected month/year
  const monthlyOrders = orders.filter(o => {
    const d = new Date(o.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  monthlyOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (!order.isFree) {
          grossRevenue += product.price * item.quantity;
        }

        let itemMaterialCost = 0;
        const baseRecipe = recipes.find(r => r.productId === item.productId);
        if (baseRecipe) {
          itemMaterialCost += baseRecipe.ingredients.reduce((s, ing) => s + getIngredientDynamicCost(ing), 0);
        } else {
          itemMaterialCost += product.costPerItem;
        }

        Object.entries(item.selectedModifiers).forEach(([gid, opt]) => {
          const modRecipe = recipes.find(r => r.modifierGroupId === gid && r.modifierOption === opt);
          if (modRecipe) {
            itemMaterialCost += modRecipe.ingredients.reduce((s, ing) => s + getIngredientDynamicCost(ing), 0);
          }
        });

        totalMaterialsCost += itemMaterialCost * item.quantity;
        totalLabourCost += product.labourCost * item.quantity;

        // Calcolo della provvigione basato sul valore nel prodotto se l'ordine è esterno
        if (order.isExternal) {
          totalCommissions += (product.externalCommission || 0) * item.quantity;
        }
      }
    });
  });

  // General Costs: Include ALL recurring + One-time costs of the selected month
  const monthlyCosts = generalCosts.filter(c => {
    if (c.isRecurring) return true;
    const d = new Date(c.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalMonthlyGeneralCosts = monthlyCosts.reduce((sum, c) => sum + c.amount, 0);
  const operatingProfit = grossRevenue - totalMaterialsCost - totalLabourCost - totalCommissions;
  const netProfit = operatingProfit - totalMonthlyGeneralCosts;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Fatturato Lordo</p>
            <h3 className="text-3xl font-black">€{grossRevenue.toFixed(2)}</h3>
            <div className="mt-3 flex items-center gap-2 text-green-400 text-xs font-bold">
              <ArrowUpRight size={14} /> Totale Vendite
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-10"><Wallet size={120} /></div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Costi Produzione</p>
          <h3 className="text-3xl font-black text-slate-800">€{(totalMaterialsCost + totalLabourCost).toFixed(2)}</h3>
          <div className="mt-3 flex items-center gap-2 text-slate-400 text-xs font-bold">
            <span className="bg-slate-50 px-2 py-0.5 rounded uppercase text-[9px]">Materiali (Ricette) + Lavoro</span>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 shadow-sm">
          <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-1">Spese {months[selectedMonth]}</p>
          <h3 className="text-3xl font-black text-amber-700">€{totalMonthlyGeneralCosts.toFixed(2)}</h3>
          <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs font-bold">
            <Receipt size={14} /> Fissi + Ricorrenti
          </div>
        </div>

        <div className={`p-6 rounded-[2.5rem] shadow-sm border ${netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className={`${netProfit >= 0 ? 'text-green-600' : 'text-red-600'} text-[10px] font-bold uppercase tracking-widest mb-1`}>Guadagno Netto</p>
          <h3 className={`text-3xl font-black ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>€{netProfit.toFixed(2)}</h3>
          <div className="mt-3 flex items-center gap-2 font-bold text-xs">
            <span className={`${netProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-0.5 rounded uppercase text-[9px]`}>{netGP.toFixed(1)}% Margine Finale</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Materiali (Base + Varianti)</span>
                  <span className="text-slate-800">€{totalMaterialsCost.toFixed(2)}</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                  <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${grossRevenue > 0 ? Math.min(100, (totalMaterialsCost / grossRevenue) * 100) : 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Manodopera Diretta</span>
                  <span className="text-slate-800">€{totalLabourCost.toFixed(2)}</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${grossRevenue > 0 ? Math.min(100, (totalLabourCost / grossRevenue) * 100) : 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-amber-500">Spese Mensili (+Ricorrenti)</span>
                  <span className="text-amber-600 font-black">€{totalMonthlyGeneralCosts.toFixed(2)}</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                  <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${grossRevenue > 0 ? Math.min(100, (totalMonthlyGeneralCosts / grossRevenue) * 100) : 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-orange-400">Provvigioni Esterne</span>
                  <span className="text-slate-800">€{totalCommissions.toFixed(2)}</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                  <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${grossRevenue > 0 ? Math.min(100, (totalCommissions / grossRevenue) * 100) : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Receipt className="text-amber-500" />
              Dettaglio Spese Aziendali
            </h4>
          </div>
          <div className="p-8">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
              {monthlyCosts.map(cost => (
                <div key={cost.id} className={`flex justify-between items-center p-4 rounded-2xl border ${cost.isRecurring ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div>
                    <p className="font-black text-slate-700 text-xs uppercase tracking-tight flex items-center gap-2">
                      {cost.name} {cost.isRecurring && <RefreshCw size={10} className="text-amber-600" />}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cost.category} • {cost.isRecurring ? 'Ogni Mese' : new Date(cost.date).toLocaleDateString('it-IT')}</p>
                  </div>
                  <p className="font-black text-slate-900">€{cost.amount.toFixed(2)}</p>
                </div>
              ))}
              {monthlyCosts.length === 0 && (
                <div className="py-20 text-center text-slate-400 italic text-sm font-bold uppercase tracking-widest opacity-30">Nessuna spesa generale</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profits;
