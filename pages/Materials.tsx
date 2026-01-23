
import React from 'react';
import { useApp } from '../store';
import { Database, AlertCircle, Coins } from 'lucide-react';

const Materials: React.FC = () => {
  const { orders, recipes, rawMaterials } = useApp();

  const getDynamicCostPerUnit = (ing: any) => {
    if (ing.rawMaterialId) {
      const rm = rawMaterials.find(r => r.id === ing.rawMaterialId);
      if (rm && rm.totalQuantity > 0) {
        return rm.totalPrice / rm.totalQuantity;
      }
    }
    return ing.costPerUnit;
  };

  const materialTotals: Record<string, { quantity: number; unit: string; cost: number; isRawMaterial: boolean }> = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      // 1. Ingredienti dalla ricetta base del prodotto
      const productRecipe = recipes.find(r => r.productId === item.productId);
      if (productRecipe) {
        productRecipe.ingredients.forEach(ing => {
          const key = `${ing.name}-${ing.unit}`;
          if (!materialTotals[key]) {
            materialTotals[key] = { quantity: 0, unit: ing.unit, cost: 0, isRawMaterial: !!ing.rawMaterialId };
          }
          const cpu = getDynamicCostPerUnit(ing);
          materialTotals[key].quantity += ing.quantity * item.quantity;
          materialTotals[key].cost += cpu * (ing.quantity * item.quantity);
        });
      }

      // 2. Ingredienti dalle ricette delle varianti selezionate
      Object.entries(item.selectedModifiers).forEach(([groupId, option]) => {
        const modifierRecipe = recipes.find(r => r.modifierGroupId === groupId && r.modifierOption === option);
        if (modifierRecipe) {
          modifierRecipe.ingredients.forEach(ing => {
            const key = `${ing.name}-${ing.unit}`;
            if (!materialTotals[key]) {
              materialTotals[key] = { quantity: 0, unit: ing.unit, cost: 0, isRawMaterial: !!ing.rawMaterialId };
            }
            const cpu = getDynamicCostPerUnit(ing);
            materialTotals[key].quantity += ing.quantity * item.quantity;
            materialTotals[key].cost += cpu * (ing.quantity * item.quantity);
          });
        }
      });
    });
  });

  const materialList = Object.entries(materialTotals).map(([key, data]) => ({
    name: key.split('-')[0],
    ...data
  }));

  const totalProcurementCost = materialList.reduce((sum, m) => sum + m.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Fabbisogno Materiali</h2>
          <p className="text-slate-500 font-medium">Inventario da acquistare in base agli ordini correnti (incluse varianti).</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-right shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spesa Stimata Acquisti</p>
          <p className="text-3xl font-black text-slate-900">€{totalProcurementCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materialList.map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl shadow-inner transition-colors ${m.isRawMaterial ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400 group-hover:bg-green-50 group-hover:text-green-600'}`}>
                {m.isRawMaterial ? <Coins size={24} /> : <Database size={24} />}
              </div>
              <div className="text-right">
                 <p className="text-2xl font-black text-slate-800">{m.quantity.toFixed(1)} <span className="text-xs text-slate-400 uppercase tracking-widest">{m.unit}</span></p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Qtà Totale Richiesta</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-lg text-slate-700 capitalize tracking-tight truncate">{m.name}</h3>
              {m.isRawMaterial && (
                <span className="bg-rose-50 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-rose-100">Warehouse</span>
              )}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Costo Stimato</span>
               <span className="text-lg font-black text-green-600">€{m.cost.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {materialList.length === 0 && (
           <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[3rem] text-slate-300">
              <AlertCircle size={64} className="mb-4 opacity-10" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Nessun ordine attivo trovato</p>
              <p className="text-[10px] font-medium mt-2">Aggiungi ordini e ricette per generare l'inventario.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Materials;
