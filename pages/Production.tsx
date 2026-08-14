
import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { 
  ClipboardList, User, Download, Layers, Truck, 
  MapPin, Droplets, Loader2, FileCheck, ChevronLeft, 
  ChevronRight, Calendar, Search, Home, FlaskConical, Users
} from 'lucide-react';

const Production: React.FC = () => {
  const { orders, products, patients, modifierGroups, salespersons, cities } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadType, setDownloadType] = useState<'production' | 'shipping' | 'delivery' | 'home' | 'lab' | 'collaborators' | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  
  const productionRef = useRef<HTMLDivElement>(null);
  const shippingRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const labRef = useRef<HTMLDivElement>(null);
  const collaboratorsRef = useRef<HTMLDivElement>(null);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const s = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00';
    return new Date(s);
  };

  // 1. Filtriamo gli ordini per il mese e anno selezionati
  const selectedMonthOrders = orders.filter(order => {
    const orderDate = parseDate(order.date);
    if (!orderDate) return false;
    return orderDate.getMonth() === viewDate.getMonth() && orderDate.getFullYear() === viewDate.getFullYear();
  });

  // 2. Costruiamo il riepilogo di produzione partendo dagli ORDINI (non dai prodotti)
  const getProductionSummary = () => {
    const summaryMap: Record<string, any> = {};

    selectedMonthOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;

        if (!summaryMap[product.id]) {
          summaryMap[product.id] = {
            id: product.id,
            name: product.name,
            totalQty: 0,
            activeModifierGroupIds: product.modifierGroupIds || [],
            breakdown: []
          };
        }

        const patient = patients.find(p => p.id === order.patientId);
        const salesperson = salespersons.find(s => s.id === order.salespersonId);

        summaryMap[product.id].totalQty += item.quantity;
        summaryMap[product.id].breakdown.push({
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Sconosciuto',
          selectedModifiers: item.selectedModifiers,
          quantity: item.quantity,
          salespersonName: order.isExternal ? (salesperson?.name || 'Esterno') : 'Interno',
          isHome: !!order.isHome,
          isLab: !!order.isLab,
          isShipping: !!order.isShipping,
          isDelivery: !!order.isDelivery
        });
      });
    });

    return Object.values(summaryMap).sort((a, b) => a.name.localeCompare(b.name));
  };

  const productionSummary = getProductionSummary();

  const shippingList = selectedMonthOrders
    .filter(o => o.isShipping)
    .map(order => {
      const patient = patients.find(p => p.id === order.patientId);
      const salesperson = salespersons.find(s => s.id === order.salespersonId);
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        id: order.id,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Sconosciuto',
        address: patient ? `${patient.address}, ${patient.city}` : 'N/A',
        totalItems,
        salespersonName: order.isExternal ? (salesperson?.name || 'Esterno') : 'Interno',
        items: order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          const variants = Object.values(item.selectedModifiers)
            .flat()
            .filter(v => v && v !== '');
          
          return {
            name: product?.name || 'Sconosciuto',
            quantity: item.quantity,
            variants: variants
          };
        })
      };
    });

  const deliveryList = selectedMonthOrders
    .filter(o => o.isDelivery)
    .map(order => {
      const patient = patients.find(p => p.id === order.patientId);
      const salesperson = salespersons.find(s => s.id === order.salespersonId);
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      const patientCityIdOrName = patient ? patient.city : 'Sconosciuta';
      const cityObj = cities.find(c => c.id === patientCityIdOrName);
      const rawCityName = cityObj ? cityObj.name : patientCityIdOrName;
      // Normalize to Title Case for consistent grouping regardless of how city was entered
      const cityName = rawCityName
        ? rawCityName.trim().replace(/\b\w/g, c => c.toUpperCase())
        : 'Sconosciuta';

      return {
        id: order.id,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Sconosciuto',
        address: patient ? `${patient.address}, ${cityName}` : 'N/A',
        cityName,
        totalItems,
        salespersonName: order.isExternal ? (salesperson?.name || 'Esterno') : 'Interno',
        items: order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          const variants = Object.values(item.selectedModifiers)
            .flat()
            .filter(v => v && v !== '');
          
          return {
            name: product?.name || 'Sconosciuto',
            quantity: item.quantity,
            variants: variants
          };
        })
      };
    });

  // Group by normalized city name (already Title Case, so grouping is consistent)
  const deliveryGroups = deliveryList.reduce((acc, order) => {
    const city = order.cityName || 'Altro';
    if (!acc[city]) acc[city] = [];
    acc[city].push(order);
    return acc;
  }, {} as Record<string, typeof deliveryList>);

  const homeList = selectedMonthOrders
    .filter(o => o.isHome)
    .map(order => {
      const patient = patients.find(p => p.id === order.patientId);
      const salesperson = salespersons.find(s => s.id === order.salespersonId);
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        id: order.id,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Sconosciuto',
        address: patient ? `${patient.address}, ${patient.city}` : 'N/A',
        totalItems,
        salespersonName: order.isExternal ? (salesperson?.name || 'Esterno') : 'Interno',
        items: order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          const variants = Object.values(item.selectedModifiers)
            .flat()
            .filter(v => v && v !== '');
          
          return {
            name: product?.name || 'Sconosciuto',
            quantity: item.quantity,
            variants: variants
          };
        })
      };
    });

  const labList = selectedMonthOrders
    .filter(o => o.isLab)
    .map(order => {
      const patient = patients.find(p => p.id === order.patientId);
      const salesperson = salespersons.find(s => s.id === order.salespersonId);
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        id: order.id,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Sconosciuto',
        address: patient ? `${patient.address}, ${patient.city}` : 'N/A',
        totalItems,
        salespersonName: order.isExternal ? (salesperson?.name || 'Esterno') : 'Interno',
        items: order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          const variants = Object.values(item.selectedModifiers)
            .flat()
            .filter(v => v && v !== '');
          
          return {
            name: product?.name || 'Sconosciuto',
            quantity: item.quantity,
            variants: variants
          };
        })
      };
    });

  const collaboratorList = selectedMonthOrders
    .filter(o => o.isExternal || !!o.salespersonId)
    .map(order => {
      const patient = patients.find(p => p.id === order.patientId);
      const salesperson = salespersons.find(s => s.id === order.salespersonId);
      const collaboratorName = salesperson ? salesperson.name : 'Collaboratore Sconosciuto';
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        id: order.id,
        collaboratorName,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Sconosciuto',
        address: patient ? `${patient.address}, ${patient.city}` : 'N/A',
        totalItems,
        salespersonName: collaboratorName,
        items: order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          const variants = Object.values(item.selectedModifiers)
            .flat()
            .filter(v => v && v !== '');
          
          return {
            name: product?.name || 'Sconosciuto',
            quantity: item.quantity,
            variants: variants
          };
        })
      };
    });

  const collaboratorGroups = collaboratorList.reduce((acc, order) => {
    const name = order.collaboratorName || 'Altro';
    if (!acc[name]) acc[name] = [];
    acc[name].push(order);
    return acc;
  }, {} as Record<string, typeof collaboratorList>);

  const handleDownload = async (type: 'production' | 'shipping' | 'delivery' | 'home' | 'lab' | 'collaborators') => {
    const targetRef = 
      type === 'production' ? productionRef :
      type === 'shipping' ? shippingRef :
      type === 'delivery' ? deliveryRef :
      type === 'home' ? homeRef :
      type === 'lab' ? labRef :
      collaboratorsRef;

    if (!targetRef.current) return;

    setIsGenerating(true);
    setDownloadType(type);

    const monthName = viewDate.toLocaleDateString('it-IT', { month: 'long' }).toUpperCase();
    const year = viewDate.getFullYear();
    const filename = `${type.toUpperCase()}_ALOE_${monthName}_${year}.pdf`;

    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(targetRef.current).save();
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Errore nella generazione del PDF.");
    } finally {
      setIsGenerating(false);
      setDownloadType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Programma Produzione</h2>
          <p className="text-slate-500 font-medium">Visualizza e scarica i dati per la produzione mensile.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button 
            disabled={isGenerating}
            onClick={() => handleDownload('production')}
            className="bg-slate-900 text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {isGenerating && downloadType === 'production' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isGenerating && downloadType === 'production' ? 'Generazione...' : 'Produzione'}
          </button>
          <button 
            disabled={isGenerating}
            onClick={() => handleDownload('home')}
            className="bg-green-600 text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-md font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {isGenerating && downloadType === 'home' ? <Loader2 size={16} className="animate-spin" /> : <Home size={16} />}
            {isGenerating && downloadType === 'home' ? 'Generazione...' : 'Casa'}
          </button>
          <button 
            disabled={isGenerating}
            onClick={() => handleDownload('lab')}
            className="bg-orange-600 text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-700 transition-all shadow-md font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {isGenerating && downloadType === 'lab' ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
            {isGenerating && downloadType === 'lab' ? 'Generazione...' : 'Laboratorio'}
          </button>
          <button 
            disabled={isGenerating}
            onClick={() => handleDownload('shipping')}
            className="bg-blue-600 text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {isGenerating && downloadType === 'shipping' ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
            {isGenerating && downloadType === 'shipping' ? 'Generazione...' : 'Spedizioni'}
          </button>
          <button 
            disabled={isGenerating}
            onClick={() => handleDownload('delivery')}
            className="bg-purple-600 text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-md font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {isGenerating && downloadType === 'delivery' ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            {isGenerating && downloadType === 'delivery' ? 'Generazione...' : 'Consegne'}
          </button>
          <button 
            disabled={isGenerating}
            onClick={() => handleDownload('collaborators')}
            className="bg-amber-600 text-white px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-md font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {isGenerating && downloadType === 'collaborators' ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
            {isGenerating && downloadType === 'collaborators' ? 'Generazione...' : 'Ordini Collaboratori'}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center gap-4">
        <button onClick={() => changeMonth(-1)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3 px-6 py-2 bg-slate-900 text-white rounded-2xl shadow-lg">
          <Calendar size={18} className="text-emerald-400" />
          <span className="text-sm font-black uppercase tracking-widest min-w-[140px] text-center">
            {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <button onClick={() => changeMonth(1)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Hidden Templates for html2pdf */}
      <div className="hidden">
        {/* Production PDF Template */}
        <div ref={productionRef} style={{ padding: '20px', fontFamily: 'Inter, sans-serif', color: '#000' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px' }}>Lista di Produzione Aloe</h1>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {productionSummary.map((prod) => (
            <div key={prod.id} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #000', paddingBottom: '5px', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>{prod.name}</h2>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>TOTALE PEZZI: {prod.totalQty}</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Paziente</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Prodotto</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '40px' }}>Qtà</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 1</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 2</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 3</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'right', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '100px' }}>Origine Ordine</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '40px' }}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {prod.breakdown.map((item: any, idx: number) => {
                    const variants = Object.values(item.selectedModifiers)
                      .flat()
                      .filter(v => v && v !== '');

                    const tipoLabel = item.isHome ? 'C' : item.isLab ? 'L' : item.isShipping ? 'S' : item.isDelivery ? 'CNSG' : '';
                    const tipoColor = item.isHome ? '#16a34a' : item.isLab ? '#ea580c' : item.isShipping ? '#2563eb' : item.isDelivery ? '#7c3aed' : '#94a3b8';

                    return (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.patientName}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{prod.name}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '900' }}>{item.quantity}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>{variants[0] || ''}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>{variants[1] || ''}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>{variants[2] || ''}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'right', fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>{item.salespersonName}</td>
                        <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center' }}>
                          {tipoLabel && (
                            <span style={{ color: tipoColor, fontWeight: '900', fontSize: '13px', letterSpacing: '0.5px' }}>{tipoLabel}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
          <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'right', fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Generato da Aloe System • {new Date().toLocaleString('it-IT')}
          </div>
        </div>

        {/* Home PDF Template */}
        <div ref={homeRef} style={{ padding: '20px', fontFamily: 'Inter, sans-serif', color: '#000' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px' }}>Lista Ordini Casa Aloe</h1>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {homeList.map((order, idx) => (
            <div key={idx} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
               <div style={{ borderBottom: '3px solid #16a34a', paddingBottom: '10px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>{order.patientName}</h2>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#444', marginTop: '3px' }}>{order.address}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>TOTALE ARTICOLI: {order.totalItems}</p>
                      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Agente: {order.salespersonName}</p>
                    </div>
                  </div>
               </div>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Prodotto</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '40px' }}>Qtà</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 1</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 2</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 3</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, iIdx: number) => (
                    <tr key={iIdx}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.name}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '10px', fontWeight: '900' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[0] || ''}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[1] || ''}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[2] || ''}</td>
                    </tr>
                  ))}
                </tbody>
               </table>
            </div>
          ))}
          <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'right', fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Generato da Aloe System • {new Date().toLocaleString('it-IT')}
          </div>
        </div>

        {/* Lab PDF Template */}
        <div ref={labRef} style={{ padding: '20px', fontFamily: 'Inter, sans-serif', color: '#000' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px' }}>Lista Ordini Laboratorio Aloe</h1>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {labList.map((order, idx) => (
            <div key={idx} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
               <div style={{ borderBottom: '3px solid #ea580c', paddingBottom: '10px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>{order.patientName}</h2>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#444', marginTop: '3px' }}>{order.address}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>TOTALE ARTICOLI: {order.totalItems}</p>
                      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Agente: {order.salespersonName}</p>
                    </div>
                  </div>
               </div>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Prodotto</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '40px' }}>Qtà</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 1</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 2</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 3</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, iIdx: number) => (
                    <tr key={iIdx}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.name}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '10px', fontWeight: '900' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[0] || ''}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[1] || ''}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[2] || ''}</td>
                    </tr>
                  ))}
                </tbody>
               </table>
            </div>
          ))}
          <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'right', fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Generato da Aloe System • {new Date().toLocaleString('it-IT')}
          </div>
        </div>

        {/* Shipping PDF Template */}
        <div ref={shippingRef} style={{ padding: '20px', fontFamily: 'Inter, sans-serif', color: '#000' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px' }}>Lista di Spedizione Aloe</h1>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {shippingList.map((order, idx) => (
            <div key={idx} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
               <div style={{ borderBottom: '3px solid #3b82f6', paddingBottom: '10px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>{order.patientName}</h2>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#444', marginTop: '3px' }}>{order.address}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>TOTALE ARTICOLI: {order.totalItems}</p>
                      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Agente: {order.salespersonName}</p>
                    </div>
                  </div>
               </div>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Prodotto</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '40px' }}>Qtà</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 1</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 2</th>
                    <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 3</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, iIdx: number) => (
                    <tr key={iIdx}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.name}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '10px', fontWeight: '900' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[0] || ''}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[1] || ''}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[2] || ''}</td>
                    </tr>
                  ))}
                </tbody>
               </table>
            </div>
          ))}
          <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'right', fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Generato da Aloe System • {new Date().toLocaleString('it-IT')}
          </div>
        </div>

        {/* Delivery PDF Template */}
        <div ref={deliveryRef} style={{ padding: '20px', fontFamily: 'Inter, sans-serif', color: '#000' }}>
          {Object.entries(deliveryGroups).map(([city, orders], groupIdx) => (
            <div key={city} style={{ pageBreakBefore: groupIdx === 0 ? 'auto' : 'always' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px' }}>Lista di Consegna Aloe - {city}</h1>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {orders.map((order, idx) => (
                <div key={idx} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                   <div style={{ borderBottom: '3px solid #4f46e5', paddingBottom: '10px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h2 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>{order.patientName}</h2>
                          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#444', marginTop: '3px' }}>{order.address}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>TOTALE ARTICOLI: {order.totalItems}</p>
                          <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Agente: {order.salespersonName}</p>
                        </div>
                      </div>
                   </div>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Prodotto</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '40px' }}>Qtà</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 1</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 2</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item: any, iIdx: number) => (
                        <tr key={iIdx}>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.name}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '10px', fontWeight: '900' }}>{item.quantity}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[0] || ''}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[1] || ''}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[2] || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              ))}
              {groupIdx === Object.entries(deliveryGroups).length - 1 && (
                <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'right', fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Generato da Aloe System • {new Date().toLocaleString('it-IT')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Collaborators PDF Template */}
        <div ref={collaboratorsRef} style={{ padding: '20px', fontFamily: 'Inter, sans-serif', color: '#000' }}>
          {Object.entries(collaboratorGroups).map(([collaboratorName, orders], groupIdx) => (
            <div key={collaboratorName} style={{ pageBreakBefore: groupIdx === 0 ? 'auto' : 'always' }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px' }}>Lista Ordini Collaboratore - {collaboratorName}</h1>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {orders.map((order, idx) => (
                <div key={idx} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                   <div style={{ borderBottom: '3px solid #d97706', paddingBottom: '10px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h2 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>{order.patientName}</h2>
                          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#444', marginTop: '3px' }}>{order.address}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>TOTALE ARTICOLI: {order.totalItems}</p>
                          <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Agente: {order.salespersonName}</p>
                        </div>
                      </div>
                   </div>
                   <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Prodotto</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900', width: '40px' }}>Qtà</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 1</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 2</th>
                        <th style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'left', fontSize: '9px', textTransform: 'uppercase', fontWeight: '900' }}>Variante 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item: any, iIdx: number) => (
                        <tr key={iIdx}>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.name}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontSize: '10px', fontWeight: '900' }}>{item.quantity}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[0] || ''}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[1] || ''}</td>
                          <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{item.variants[2] || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              ))}
              {groupIdx === Object.entries(collaboratorGroups).length - 1 && (
                <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', textAlign: 'right', fontSize: '9px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Generato da Aloe System • {new Date().toLocaleString('it-IT')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {productionSummary.map(prod => (
          <div key={prod.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-100">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{prod.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fabbisogno per il mese scelto</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unità Totali</p>
                <p className="text-3xl font-black text-emerald-700">{prod.totalQty}</p>
              </div>
            </div>
            <div className="p-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FileCheck size={14} className="text-emerald-500" /> Dettaglio Pazienti
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prod.breakdown.map((item: any, idx: number) => {
                  const variants = Object.values(item.selectedModifiers)
                    .flat()
                    .filter(v => v && v !== '');

                  return (
                    <div key={idx} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-3 group/card hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                          <User size={18} />
                        </div>
                        <span className="font-black text-slate-700 uppercase text-xs truncate">{item.patientName}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map((val, vIdx) => (
                          <span key={vIdx} className="text-[9px] px-2.5 py-1 rounded-xl font-black uppercase tracking-tight bg-white border border-slate-200 text-slate-500">
                            {val}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Qtà: {item.quantity}</span>
                          {item.isHome && <span className="text-[9px] font-black text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-lg">C</span>}
                          {item.isLab && <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg">L</span>}
                          {item.isShipping && <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">S</span>}
                          {item.isDelivery && <span className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg">CNSG</span>}
                        </div>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{item.salespersonName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {productionSummary.length === 0 && (
          <div className="py-32 text-center text-slate-400 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <ClipboardList size={64} className="mb-6 opacity-10" />
            <p className="text-xl font-black uppercase tracking-widest text-slate-300">Nulla da produrre per questo mese</p>
            <p className="text-xs font-bold text-slate-400 mt-2">Gli ordini appariranno qui automaticamente se filtrati correttamente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Production;
