import React, { useState, useEffect } from 'react';
import { Copy, MessageCircle, Check, Smartphone, Download, Info, Globe, AlertCircle, Link2, ExternalLink } from 'lucide-react';

const LinkPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState('');
  const [autoLink, setAutoLink] = useState('');
  const [isManual, setIsManual] = useState(false);

  // Funzione per estrarre il link "Puro" che serve per l'installazione
  const sanitizeUrl = (url: string) => {
    if (!url) return '';
    let clean = url.trim();
    
    // 1. Rimuoviamo la parte del router (#/...) 
    // Fondamentale: se il link è https://sito.goog/id-app#/link, noi vogliamo solo https://sito.goog/id-app
    clean = clean.split('#')[0];
    
    // 2. Rimuoviamo i parametri di ricerca (?showPreview=true ecc)
    clean = clean.split('?')[0];
    
    // 3. Rimuoviamo index.html se presente
    if (clean.endsWith('index.html')) {
      clean = clean.substring(0, clean.lastIndexOf('index.html'));
    }
    
    // 4. Pulizia slash finali
    clean = clean.replace(/\/+$/, '');
    
    return clean;
  };

  useEffect(() => {
    // Catturiamo l'indirizzo ESATTO in cui si trova l'app adesso
    const detected = sanitizeUrl(window.location.href);
    setAutoLink(detected);
  }, []);

  const currentLink = isManual ? sanitizeUrl(manualLink) : autoLink;

  const shareMessage = `🌱 ALOE DI ELISABETTA\n\nCiao! Clicca sul link qui sotto per installare l'app sul tuo telefono.\n\nIMPORTANTE: Una volta aperto, clicca sui tre puntini (Android) o sul tasto condividi (iPhone) e seleziona "AGGIUNGI A HOME".\n\nLink: ${currentLink}`;

  const copyToClipboard = () => {
    if (!currentLink) return;
    navigator.clipboard.writeText(currentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Condivisione App</h2>
          <p className="text-slate-500 font-medium">Usa questo strumento per distribuire l'app ai collaboratori.</p>
        </div>
        <div className="bg-emerald-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-100">
          <Smartphone size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Pronta per Mobile</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Generatore Link */}
        <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-slate-50 rounded-full opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Link2 size={14} className="text-emerald-500" /> Il Tuo Link Personale
               </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative group">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Globe size={10} /> Link Rilevato (Anti-404):
                </p>
                <p className="text-xs font-mono font-bold text-white break-all leading-relaxed">
                  {currentLink || 'Rilevamento...'}
                </p>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check size={14} />
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-blue-600" />
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Se il link sopra non funziona:</p>
                </div>
                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                  Copia l'indirizzo che vedi nella barra in alto del browser e incollalo qui:
                </p>
                <input 
                  className="w-full p-4 bg-white border border-blue-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Incolla qui l'URL..."
                  value={manualLink}
                  onChange={(e) => {
                    setManualLink(e.target.value);
                    setIsManual(true);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button 
                onClick={copyToClipboard}
                disabled={!currentLink}
                className={`flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all font-black uppercase text-xs tracking-widest ${
                  copied 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm'
                } disabled:opacity-30`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copiato!' : 'Copia Link'}
              </button>

              <button 
                onClick={shareWhatsApp}
                disabled={!currentLink}
                className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-30"
              >
                <MessageCircle size={18} className="text-emerald-400" />
                Invia WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Istruzioni Rapide */}
        <div className="space-y-6">
          <div className="bg-emerald-600 text-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                <Download size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Istruzioni</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="font-black text-emerald-200 text-2xl">01</span>
                <p className="text-sm font-bold leading-snug">Invia il link al collaboratore via WhatsApp.</p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-black text-emerald-200 text-2xl">02</span>
                <p className="text-sm font-bold leading-snug">Lui lo apre sul telefono e clicca "Aggiungi a Home".</p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-black text-emerald-200 text-2xl">03</span>
                <p className="text-sm font-bold leading-snug">L'app apparirà come un'icona 🌱 sul suo cellulare.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
            <Info size={24} className="text-slate-400 shrink-0" />
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
              Nota: I link di anteprima sono personali. Se rigeneri l'app, dovrai inviare un nuovo link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkPage;