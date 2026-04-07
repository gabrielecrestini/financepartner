"use client";

import { useState, useEffect } from 'react';

export default function UltimateWealthEcosystem() {
  // ==========================================================
  // STATE MANAGEMENT CON "DATABASE" LOCALE (localStorage)
  // ==========================================================
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'wealthy' | 'starter'>('wealthy');
  
  // Parametri eToro (Per chi parte da zero)
  const [capitaleIniziale, setCapitaleIniziale] = useState<number>(0);
  const [deposito, setDeposito] = useState<number>(200);
  const [frequenza, setFrequenza] = useState<number>(12); // 12 = Mensile, 52 = Settimanale
  const [anni, setAnni] = useState<number>(10);
  const [apyEtoro, setApyEtoro] = useState<number>(15.0); // Modificabile dall'utente

  // Parametri YouHodler (Per chi ha capitali)
  const [spesa, setSpesa] = useState<number>(2500);
  const [capitale, setCapitale] = useState<number>(8000);
  const [maxLtv, setMaxLtv] = useState<number>(90); // Modificabile
  const [apyYouHodler, setApyYouHodler] = useState<number>(12.0); // Modificabile
  const [aprYouHodler, setAprYouHodler] = useState<number>(10.0); // Modificabile

  // Caricamento Dati Salvati
  useEffect(() => {
    setIsMounted(true);
    const savedData = localStorage.getItem('partnerVestWealthDataV2');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setCapitaleIniziale(parsed.capitaleIniziale || 0);
      setDeposito(parsed.deposito || 200);
      setFrequenza(parsed.frequenza || 12);
      setAnni(parsed.anni || 10);
      setApyEtoro(parsed.apyEtoro || 15.0);
      setSpesa(parsed.spesa || 2500);
      setCapitale(parsed.capitale || 8000);
      setMaxLtv(parsed.maxLtv || 90);
      setApyYouHodler(parsed.apyYouHodler || 12.0);
      setAprYouHodler(parsed.aprYouHodler || 10.0);
      setActiveTab(parsed.activeTab || 'wealthy');
    }
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  // Salvataggio Automatico
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('partnerVestWealthDataV2', JSON.stringify({
        capitaleIniziale, deposito, frequenza, anni, apyEtoro, spesa, capitale, maxLtv, apyYouHodler, aprYouHodler, activeTab
      }));
    }
  }, [capitaleIniziale, deposito, frequenza, anni, apyEtoro, spesa, capitale, maxLtv, apyYouHodler, aprYouHodler, activeTab, isMounted]);

  // ==========================================================
  // LOGICA MATEMATICA: eToro (Interesse Composto Variabile)
  // ==========================================================
  const n_periodi = anni * frequenza;
  const tasso_periodo = (apyEtoro / 100) / frequenza;
  
  const FV_iniziale = capitaleIniziale * Math.pow(1 + tasso_periodo, n_periodi);
  const FV_depositi = deposito * ((Math.pow(1 + tasso_periodo, n_periodi) - 1) / tasso_periodo);
  
  const capitaleFinaleEtoro = FV_iniziale + FV_depositi;
  const totaleVersatoEtoro = capitaleIniziale + (deposito * n_periodi);
  const profittoGeneratoEtoro = capitaleFinaleEtoro - totaleVersatoEtoro;

  // ==========================================================
  // LOGICA MATEMATICA: YouHodler (Prestiti Variabili)
  // ==========================================================
  const LTV_DECIMAL = maxLtv / 100;
  const APY_Y_DECIMAL = apyYouHodler / 100;
  const APR_Y_DECIMAL = aprYouHodler / 100;

  const collateraleRichiesto = spesa / LTV_DECIMAL;
  const capitaleLibero = capitale - collateraleRichiesto;
  const costoPrestitoAnnuo = spesa * APR_Y_DECIMAL;
  const renditaAnnua = capitaleLibero > 0 ? capitaleLibero * APY_Y_DECIMAL : 0;
  const deltaNettoYouHodler = renditaAnnua - costoPrestitoAnnuo;
  const isLombardFattibile = (spesa / capitale) <= LTV_DECIMAL && capitale > 0 && spesa > 0;

  // I TUOI LINK AFFILIATO (Ricorda che puoi gestirli anche tramite .env per maggiore sicurezza)
  const LINK_ETORO = "https://www.financeads.net/tc.php?t=80001C110660650T";
  const LINK_YOUHODLER = "https://www.financeads.net/tc.php?t=80001C324060796T";

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#030303] text-slate-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden pb-24">
      
      {/* CSS: IMPATTO VISIVO DEVASTANTE */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; background: #030303; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .hero-bg { position: absolute; top: -10%; left: 50%; transform: translateX(-50%); width: 120vw; height: 60vh; background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15) 0%, transparent 60%); pointer-events: none; z-index: 0; }
        
        .glass-box { background: rgba(12, 12, 12, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 1.5rem; transition: border-color 0.3s ease; }
        .glass-box:hover { border-color: rgba(16, 185, 129, 0.2); }
        
        .input-pro { width: 100%; background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.1); color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 800; padding: 0.5rem 0 0.5rem 2rem; outline: none; transition: all 0.3s ease; }
        .input-pro:focus { border-bottom-color: #10B981; }
        .input-small { font-size: 1.1rem; padding-left: 0.5rem; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

        .btn-green { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #000; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.2s ease; box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.6); border: none; cursor: pointer; }
        .btn-green:hover { transform: translateY(-3px); box-shadow: 0 15px 40px -10px rgba(16, 185, 129, 0.8); }
        
        .btn-blue { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.2s ease; box-shadow: 0 10px 30px -10px rgba(59, 130, 246, 0.6); border: none; cursor: pointer; }
        .btn-blue:hover { transform: translateY(-3px); box-shadow: 0 15px 40px -10px rgba(59, 130, 246, 0.8); }

        .select-pro { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 0.5rem; padding: 0.5rem; font-size: 0.8rem; outline: none; }

        .tab-btn { flex: 1; padding: 1.25rem 1rem; border-radius: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: 1px solid transparent; }
        .tab-active { background: #fff; color: #000; box-shadow: 0 0 30px rgba(255,255,255,0.2); transform: scale(1.02); z-index: 10; }
        .tab-inactive { background: rgba(255,255,255,0.03); color: #666; border-color: rgba(255,255,255,0.05); }
        .tab-inactive:hover { background: rgba(255,255,255,0.08); color: #fff; }
      `}} />

      <div className="hero-bg"></div>

      {/* ========================================================================= */}
      {/* 1. HOOK (PRIMI 3 SECONDI) */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full px-4 pt-16 pb-12 max-w-[1000px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-8 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1"></span> Software Attivo (Dati Salvati)
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tighter leading-[1.05]">
          Batti le Banche. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">Gioca con le loro regole.</span>
        </h1>
        
        <p className="text-sm sm:text-lg text-slate-400 font-light leading-relaxed mb-12 max-w-2xl mx-auto">
          Esistono solo due regole: se non hai soldi, automatizza l'accumulo. Se li hai già, usa il debito per proteggerli. Seleziona il tuo profilo qui sotto e sblocca l'algoritmo corretto.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-2xl mx-auto bg-black/40 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div onClick={() => setActiveTab('starter')} className={`tab-btn ${activeTab === 'starter' ? 'tab-active' : 'tab-inactive'}`}>
            <div className="text-xl mb-1">🌱</div>
            <div className="text-xs">Parto da Zero</div>
          </div>
          <div onClick={() => setActiveTab('wealthy')} className={`tab-btn ${activeTab === 'wealthy' ? 'tab-active' : 'tab-inactive'}`}>
            <div className="text-xl mb-1">🛡️</div>
            <div className="text-xs">Ho dei Risparmi</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PATH A: PARTO DA ZERO (ETORO - DCA & COPYTRADING) */}
      {/* ========================================================================= */}
      {activeTab === 'starter' && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <section className="relative z-10 max-w-[1200px] mx-auto px-4 pb-16">
            <div className="glass-box p-6 sm:p-10 border-t-4 border-t-blue-500">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-white mb-2">Terminale di Costruzione</h2>
                <p className="text-sm text-slate-400 font-light">Se parti da zero, il tuo obiettivo è accumulare in automatico senza farti condizionare dalle emozioni del mercato.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* INPUTS ETORO */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-black/40 p-6 sm:p-8 rounded-2xl border border-white/5 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                      <div>
                        <label className="block text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">Versamento Ricorrente</label>
                        <div className="relative">
                          <span className="absolute left-0 bottom-3 text-white/30 font-mono text-xl">€</span>
                          <input type="number" value={deposito || ''} onChange={(e) => setDeposito(Number(e.target.value))} className="input-pro" placeholder="200" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-white font-black uppercase tracking-widest mb-2">Frequenza</label>
                        <select value={frequenza} onChange={(e) => setFrequenza(Number(e.target.value))} className="select-pro w-full mt-2 text-lg py-3">
                          <option value={52}>Settimanale</option>
                          <option value={12}>Mensile</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-2">Rendimento Annuo Stimato (APY)</label>
                        <div className="relative">
                          <input type="number" value={apyEtoro || ''} onChange={(e) => setApyEtoro(Number(e.target.value))} className="input-pro input-small pr-6" />
                          <span className="absolute right-0 bottom-3 text-white/50 font-mono">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-2">Orizzonte Temporale</label>
                        <input type="range" min="1" max="30" step="1" value={anni} onChange={(e) => setAnni(Number(e.target.value))} className="w-full accent-blue-500 h-2 bg-white/10 rounded-full appearance-none mt-4" />
                        <div className="text-right text-white font-mono mt-2 font-bold">{anni} Anni</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OUTPUT & CPA ETORO */}
                <div className="lg:col-span-5 relative">
                  <div className="bg-[#050810] border border-blue-500/20 rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 text-center border-b border-blue-500/10 pb-4">Proiezione Patrimonio Totale</h3>
                      <div className="font-mono text-5xl font-black text-white text-center mb-8 py-4">
                        {"€" + capitaleFinaleEtoro.toFixed(0)}
                      </div>
                      <div className="space-y-3 text-xs font-mono">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded">
                          <span className="text-slate-400">TOTALE VERSATO DA TE:</span>
                          <span className="font-bold text-white">{"€" + totaleVersatoEtoro.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-500/10 p-3 rounded border border-blue-500/20">
                          <span className="text-blue-400">INTERESSE COMPOSTO:</span>
                          <span className="font-bold text-blue-400">{"+ €" + profittoGeneratoEtoro.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 text-center pt-6 border-t border-white/10">
                      {/* BOTTONE CPA PRIMA */}
                      <a href={LINK_ETORO} target="_blank" rel="noopener noreferrer" className="btn-blue inline-block px-10 py-5 rounded-xl w-full text-sm mb-6">
                        Attiva Accumulo su eToro
                      </a>
                      
                      {/* SPIEGAZIONE SOTTO IL BOTTONE */}
                      <div className="text-left bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Come massimizzare la strategia:</h4>
                        <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                          <strong className="text-white">1. Il segreto del DCA:</strong> Impostando un deposito ricorrente (settimanale o mensile), acquisti quote sia quando il mercato sale che quando crolla, abbattendo matematicamente il rischio di ingresso (Dollar Cost Averaging).<br/><br/>
                          <strong className="text-white">2. Usa il CopyTrading:</strong> Non hai tempo per studiare i grafici? Su eToro puoi copiare automaticamente il portafoglio degli investitori d'élite. Loro analizzano il mercato, tu incassi le stesse percentuali di profitto sui tuoi depositi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PATH B: HO DEI RISPARMI (YOUHODLER - LOMBARD HACK) */}
      {/* ========================================================================= */}
      {activeTab === 'wealthy' && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <section className="relative z-10 max-w-[1200px] mx-auto px-4 pb-16">
            <div className="glass-box p-6 sm:p-10 border-t-4 border-t-emerald-500">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-white mb-2">Terminale di Estrazione</h2>
                <p className="text-sm text-slate-400 font-light">Vuoi fare un acquisto importante? Non vendere i tuoi asset. Usa il capitale come scudo per farti prestare i contanti istantaneamente.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* INPUTS YOUHODLER */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-black/40 p-6 sm:p-8 rounded-2xl border border-white/5 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                      <div>
                        <label className="block text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">Contanti Richiesti (Spesa)</label>
                        <div className="relative">
                          <span className="absolute left-0 bottom-3 text-emerald-500/50 font-mono text-xl">€</span>
                          <input type="number" value={spesa || ''} onChange={(e) => setSpesa(Number(e.target.value))} className="input-pro" placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-white font-black uppercase tracking-widest mb-2">I Tuoi Risparmi (Collaterale)</label>
                        <div className="relative">
                          <span className="absolute left-0 bottom-3 text-white/30 font-mono text-xl">€</span>
                          <input type="number" value={capitale || ''} onChange={(e) => setCapitale(Number(e.target.value))} className="input-pro" placeholder="0" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-2">Max LTV</label>
                        <div className="relative">
                          <input type="number" value={maxLtv || ''} onChange={(e) => setMaxLtv(Number(e.target.value))} className="input-pro input-small pr-4" />
                          <span className="absolute right-0 bottom-2 text-slate-500 font-mono">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] text-emerald-400 font-bold uppercase mb-2">Rendita (APY)</label>
                        <div className="relative">
                          <input type="number" value={apyYouHodler || ''} onChange={(e) => setApyYouHodler(Number(e.target.value))} className="input-pro input-small pr-4" />
                          <span className="absolute right-0 bottom-2 text-slate-500 font-mono">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] text-rose-400 font-bold uppercase mb-2">Costo (APR)</label>
                        <div className="relative">
                          <input type="number" value={aprYouHodler || ''} onChange={(e) => setAprYouHodler(Number(e.target.value))} className="input-pro input-small pr-4" />
                          <span className="absolute right-0 bottom-2 text-slate-500 font-mono">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OUTPUT & CPA YOUHODLER */}
                <div className="lg:col-span-5 relative">
                  <div className="bg-[#050810] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between">
                    {!isLombardFattibile && (
                      <div className="absolute inset-0 bg-black/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-8 text-center z-20 border border-rose-500/40">
                        <p className="text-rose-500 font-black text-2xl mb-2">Collaterale Insufficiente</p>
                        <p className="text-slate-300 text-xs leading-relaxed">Per avere {"€" + spesa} oggi con un LTV del {maxLtv}%, devi depositare almeno <strong className="text-white">{"€" + collateraleRichiesto.toFixed(0)}</strong> a garanzia. Aumenta "I Tuoi Risparmi".</p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 text-center border-b border-emerald-500/10 pb-4">Report Algoritmico a 12 Mesi</h3>
                      <div className="space-y-4 text-xs font-mono">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded">
                          <span className="text-slate-400">CAPITALE A RENDITA:</span>
                          <span className="font-bold text-emerald-400">{"€" + capitaleLibero.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-rose-400/70">COSTO PRESTITO (Da Pagare):</span>
                          <span className="font-bold text-rose-400">{"- €" + costoPrestitoAnnuo.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
                          <span className="text-emerald-400">INTERESSI (Incassati):</span>
                          <span className="font-bold text-emerald-400">{"+ €" + renditaAnnua.toFixed(0)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-white/10 text-center mb-6">
                        <div className="flex justify-between items-end text-left">
                          <span className="font-black text-white text-[11px] uppercase tracking-widest">Saldo Netto Annuo</span>
                          <span className={`font-mono font-black text-4xl ${deltaNettoYouHodler >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(deltaNettoYouHodler > 0 ? "+" : "") + "€" + deltaNettoYouHodler.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      {/* BOTTONE CPA PRIMA */}
                      <a 
                        href={isLombardFattibile && deltaNettoYouHodler >= 0 ? LINK_YOUHODLER : "#"} 
                        target={isLombardFattibile && deltaNettoYouHodler >= 0 ? "_blank" : "_self"}
                        className={`btn-green inline-block px-10 py-5 rounded-xl w-full text-sm mb-6 ${(!isLombardFattibile || deltaNettoYouHodler < 0) && 'opacity-50 grayscale cursor-not-allowed'}`}
                      >
                        Avvia Estrazione su YouHodler
                      </a>

                      {/* SPIEGAZIONE SOTTO IL BOTTONE */}
                      <div className="text-left bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Come gestire il prestito in sicurezza:</h4>
                        <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                          <strong className="text-white">1. Evita la Liquidazione:</strong> Anche se la piattaforma permette un LTV fino al 90%, è consigliabile usare un capitale maggiore per tenere il margine intorno al 70%. In questo modo, se il mercato crypto subisce un "flash crash", il tuo collaterale è al sicuro.<br/><br/>
                          <strong className="text-white">2. Rate Invisibili:</strong> Non estinguere il prestito usando il tuo stipendio. Lascia che la rendita generata (l'APY) dal tuo collaterale vada a coprire e abbattere il costo del debito (APR) in automatico mese dopo mese. Tu goditi la liquidità.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-10 text-center px-4 relative z-10 border-t border-white/5 pt-10">
        <p className="text-[10px] text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
          I calcolatori utilizzano stime dinamiche. I tassi APY/APR e le policy LTV sulle piattaforme partner (YouHodler/eToro) possono variare in base alle condizioni di mercato reali. L'investimento in asset digitali comporta rischio di volatilità e perdita del capitale. Strumento ad esclusivo uso didattico.
        </p>
      </footer>

    </main>
  );
}