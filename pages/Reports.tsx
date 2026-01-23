
import React, { useState } from 'react';
import { useApp } from '../store';
import { FileText, UserCheck, DollarSign, ArrowUpRight, ArrowDownRight, Printer, Filter, Gift } from 'lucide-react';

const Reports: React.FC = () => {
  const { orders, products, patients, salespersons } = useApp();
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string | 'Tutti'>('Tutti');

  const externalOrders = orders.filter(o => 
    o.isExternal && (selectedSalespersonId === 'Tutti' || o.salespersonId === selectedSalespersonId)
  );

  let totalExternalSales = 0;
  let totalCommissionsOwed = 0;

  externalOrders.forEach(order => {
    let orderValue = 0;
    let orderCalculatedCommission = 0;

    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (!order.isFree) {
          orderValue += product.price * item.quantity;
        }
        // Utilizziamo il valore della provvigione impostato nel prodotto × quantità
        orderCalculatedCommission += (product.externalCommission || 0) * item.quantity;
      }
    });

    totalExternalSales += orderValue;
    // Se l'amministratore ha inserito un valore manuale diverso da 0 nell'ordine, 
    // potremmo voler usare quello, ma la richiesta specifica di "assicurarsi che i dati siano presi dal prodotto"
    // quindi usiamo il valore calcolato dai prodotti.
    totalCommissionsOwed += orderCalculatedCommission;
  });

  const netBusinessRetention = totalExternalSales - totalCommissionsOwed;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Report Vendite Esterne</h2>
          <p className="text-slate-500">Monitora le performance dei venditori e le provvigioni calcolate sui prodotti.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
        >
          <Printer size={18} /> Stampa Report
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:hidden flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600 font-bold">
          <Filter size={18} />
          <span>Filtra per Venditore:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={() => setSelectedSalespersonId('Tutti')} 
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${selectedSalespersonId === 'Tutti' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Tutti
          </button>
          {salespersons.map(s => (
            <button 
              key={s.id} 
              onClick={() => setSelectedSalespersonId(s.id)} 
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${selectedSalespersonId === s.id ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden print:block mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Report Provvigioni Vendite</h1>
        <p className="text-slate-500">Filtrato per: {selectedSalespersonId === 'Tutti' ? 'Tutti i venditori' : salespersons.find(s => s.id === selectedSalespersonId)?.name}</p>
        <p className="text-slate-500">Generato il: {new Date().toLocaleDateString('it-IT')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm print:border-slate-300 print:shadow-none">
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Totale Vendite Esterne</p>
           <h3 className="text-4xl font-black text-slate-800">€{totalExternalSales.toFixed(2)}</h3>
           <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
              <ArrowUpRight size={16} /> Fatturato Lordo
           </div>
        </div>

        <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 shadow-sm print:bg-white print:border-slate-300 print:shadow-none">
           <p className="text-orange-600 text-xs font-bold uppercase tracking-widest mb-1">Totale Provvigioni (da Prodotti)</p>
           <h3 className="text-4xl font-black text-orange-700">€{totalCommissionsOwed.toFixed(2)}</h3>
           <div className="mt-4 flex items-center gap-2 text-orange-600 text-sm font-bold">
              <UserCheck size={16} /> Calcolo su listino prodotti
           </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl print:bg-white print:text-slate-900 print:border-slate-300 print:shadow-none">
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 print:text-slate-500">Netto Aziendale</p>
           <h3 className="text-4xl font-black">€{netBusinessRetention.toFixed(2)}</h3>
           <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-bold print:text-green-600">
              <ArrowUpRight size={16} /> Al netto delle provvigioni
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print:border-slate-300 print:shadow-none">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center print:p-4">
           <h4 className="text-xl font-bold text-slate-800">Dettaglio per Venditore</h4>
           <FileText className="text-slate-200 print:hidden" size={24} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 print:bg-white print:border-slate-300">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-600">Data</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-600">Venditore</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-600">Paziente</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right print:text-slate-600">Tot. Vendita</th>
                <th className="px-8 py-4 text-xs font-bold text-orange-400 uppercase tracking-wider text-right print:text-slate-600">Provvigione</th>
                <th className="px-8 py-4 text-xs font-bold text-green-400 uppercase tracking-wider text-right print:text-slate-600">Netto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 print:divide-slate-300">
              {externalOrders.map(order => {
                const patient = patients.find(p => p.id === order.patientId);
                const salesperson = salespersons.find(s => s.id === order.salespersonId);
                let orderValue = 0;
                let orderProductCommission = 0;
                
                order.items.forEach(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (product) {
                    if (!order.isFree) orderValue += product.price * item.quantity;
                    orderProductCommission += (product.externalCommission || 0) * item.quantity;
                  }
                });
                
                const net = orderValue - orderProductCommission;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors print:hover:bg-white">
                    <td className="px-8 py-4 text-sm font-medium text-slate-500">
                      {new Date(order.date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-8 py-4 font-bold text-slate-700 capitalize">
                      <div className="flex flex-col">
                        <span>{salesperson?.name || 'Agente Sconosciuto'}</span>
                        {order.isFree && <span className="text-[9px] text-purple-600 font-black uppercase flex items-center gap-1"><Gift size={8} /> Omaggio</span>}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-600">
                      {patient ? `${patient.firstName} ${patient.lastName}` : 'Sconosciuto'}
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-slate-700">
                      €{orderValue.toFixed(2)}
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-orange-600">
                      -€{orderProductCommission.toFixed(2)}
                    </td>
                    <td className="px-8 py-4 text-right font-black text-green-700">
                      €{net.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {externalOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 italic">
                    Nessuna vendita esterna trovata per questo filtro.
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

export default Reports;
