import React from 'react';
import { useApp } from '../store';
import { TrendingUp, UserCheck, ArrowUpRight, FileText, ShoppingBag, Gift } from 'lucide-react';

const MySales: React.FC = () => {
  const { orders, products, currentUser, patients } = useApp();

  if (!currentUser?.salespersonId) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest">Accesso non autorizzato</p>
      </div>
    );
  }

  const myOrders = orders.filter(o => o.isExternal && o.salespersonId === currentUser.salespersonId);

  let totalSales = 0;
  let totalCommissions = 0;

  myOrders.forEach(order => {
    let orderValue = 0;
    if (!order.isFree) {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) orderValue += product.price * item.quantity;
      });
    }
    totalSales += orderValue;
    totalCommissions += order.commission;
  });

  const netSales = totalSales - totalCommissions;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Le Mie Vendite</h2>
        <p className="text-slate-500 font-medium">Tracciamento delle tue performance e provvigioni.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Totale Venduto</p>
           <h3 className="text-4xl font-black text-slate-800">€{totalSales.toFixed(2)}</h3>
           <div className="mt-4 flex items-center gap-2 text-green-600 text-[10px] font-black uppercase">
              <ArrowUpRight size={14} /> Valore Lordo
           </div>
        </div>

        <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100">
           <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-1">Mie Provvigioni</p>
           <h3 className="text-4xl font-black text-orange-700">€{totalCommissions.toFixed(2)}</h3>
           <div className="mt-4 flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase">
              <UserCheck size={14} /> Credito Maturato
           </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Netto Aziendale</p>
           <h3 className="text-4xl font-black">€{netSales.toFixed(2)}</h3>
           <div className="mt-4 flex items-center gap-2 text-green-400 text-[10px] font-black uppercase">
              <ArrowUpRight size={14} /> Ritenuta Azienda
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
           <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Elenco Ordini Personali</h4>
           <FileText className="text-slate-200" size={24} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paziente</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valore Ordine</th>
                <th className="px-8 py-4 text-[10px] font-black text-orange-400 uppercase tracking-widest text-right">Provvigione</th>
                <th className="px-8 py-4 text-[10px] font-black text-green-400 uppercase tracking-widest text-right">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myOrders.map(order => {
                const patient = patients.find(p => p.id === order.patientId);
                const orderValue = order.isFree ? 0 : order.items.reduce((sum, item) => {
                  const product = products.find(p => p.id === item.productId);
                  return sum + (product?.price || 0) * item.quantity;
                }, 0);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 text-xs font-bold text-slate-500 uppercase">
                      {new Date(order.date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-bold text-slate-700">{patient?.firstName} {patient?.lastName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{patient?.city}</p>
                        {order.isFree && <span className="text-[9px] text-purple-600 font-black uppercase flex items-center gap-1"><Gift size={8} /> Omaggio</span>}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-slate-700">
                      €{orderValue.toFixed(2)}
                    </td>
                    <td className="px-8 py-4 text-right font-black text-orange-600">
                      €{order.commission.toFixed(2)}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {myOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <ShoppingBag size={48} className="mb-2" />
                      <p className="text-xs font-black uppercase tracking-widest">Nessuna vendita registrata</p>
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

export default MySales;