"use client";

import { useState, useEffect } from 'react';

export default function UltimateWealthEcosystem() {
  // ==========================================================
  // STATE MANAGEMENT CON "DATABASE" LOCALE
  // ==========================================================
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'wealthy' | 'starter'>('wealthy');
  
  // Parametri eToro (Parto da zero)
  const [capitaleIniziale, setCapitaleIniziale] = useState<number>(0);
  const [deposito, setDeposito] = useState<number>(200);
  const [frequenza, setFrequenza] = useState<number>(12); // 12 = Mensile
  const [anni, setAnni] = useState<number>(10);
  const [apyEtoro, setApyEtoro] = useState<number>(15.0);

  // Parametri YouHodler (Ho dei risparmi)
  const [spesa, setSpesa] = useState<number>(2500);
  const [capitale, setCapitale] = useState<number>(8000);
  const [maxLtv, setMaxLtv] = useState<number>(90); 
  const [apyYouHodler, setApyYouHodler] = useState<number>(12.0); 
  const [aprYouHodler, setAprYouHodler] = useState<number>(10.0); 

  // Caricamento Dati Salvati
  useEffect(() => {
    setIsMounted(true);
    const savedData = localStorage.getItem('partnerVestWealthDataV3');
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
  }, []);

  // Salvataggio Automatico
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('partnerVestWealthDataV3', JSON.stringify({
        capitaleIniziale, deposito, frequenza, anni, apyEtoro, spesa, capitale, maxLtv, apyYouHodler, aprYouHodler, activeTab
      }));
    }
  }, [capitaleIniziale, deposito, frequenza, anni, apyEtoro, spesa, capitale, maxLtv, apyYouHodler, aprYouHodler, activeTab, isMounted]);

  // ==========================================================
  // LOGICA MATEMATICA: eToro
  // ==========================================================
  const n_periodi = anni * frequenza;
  const tasso_periodo = (apyEtoro / 100) / frequenza;
  
  const FV_iniziale = capitaleIniziale * Math.pow(1 + tasso_periodo, n_periodi);
  const FV_depositi = deposito * ((Math.pow(1 + tasso_periodo, n_periodi) - 1) / tasso_periodo);
  
  const capitaleFinaleEtoro = FV_iniziale + FV_depositi;
  const totaleVersatoEtoro = capitaleIniziale + (deposito * n_periodi);
  const profittoGeneratoEtoro = capitaleFinaleEtoro - totaleVersatoEtoro;

  // ==========================================================
  // LOGICA MATEMATICA: YouHodler
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

  // I TUOI LINK AFFILIATO S2S
  const LINK_ETORO = "https://www.financeads.net/tc.php?t=80001C110660650T";
  const LINK_YOUHODLER = "https://www.financeads.net/tc.php?t=80001C324060796T";

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#030303] text-slate-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden pb-40 relative">
      
      {/* CSS AGGIORNATO E BLINDATO */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; background: #030303; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        html { scroll-behavior: smooth; }
        
        .hero-bg { position: absolute; top: -10%; left: 50%; transform: translateX(-50%); width: 120vw; height: 60vh; background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15) 0%, transparent 60%); pointer-events: none; z-index: 0; }
        
        .glass-box { background: rgba(12, 12, 12, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 1.5rem; transition: border-color 0.3s ease; }
        .glass-box:hover { border-color: rgba(16, 185, 129, 0.2); }
        
        .input-pro { width: 100%; background: transparent; border: none; border-bottom: 2px solid rgba(255,255,255,0.1); color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 800; padding: 0.5rem 0 0.5rem 2rem; outline: none; transition: all 0.3s ease; }
        .input-pro:focus { border-bottom-color: #10B981; }
        .input-small { font-size: 1.1rem; padding-left: 0.5rem; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

        /* Bottoni In-Line SEMPRE visibili */
        .btn-green { position: relative; z-index: 40; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #000; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.2s ease; box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.6); border: none; cursor: pointer; text-align: center; }
        .btn-green:hover { transform: translateY(-3px); box-shadow: 0 15px 40px -10px rgba(16, 185, 129, 0.8); }
        
        .btn-blue { position: relative; z-index: 40; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.2s ease; box-shadow: 0 10px 30px -10px rgba(59, 130, 246, 0.6); border: none; cursor: pointer; text-align: center; }
        .btn-blue:hover { transform: translateY(-3px); box-shadow: 0 15px 40px -10px rgba(59, 130, 246, 0.8); }

        .select-pro { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 0.5rem; padding: 0.5rem; font-size: 0.8rem; outline: none; }

        .tab-btn { flex: 1; padding: 1rem; border-radius: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: 1px solid transparent; }
        .tab-active { background: #fff; color: #000; box-shadow: 0 0 30px rgba(255,255,255,0.2); transform: scale(1.02); z-index: 10; }
        .tab-inactive { background: rgba(255,255,255,0.03); color: #666; border-color: rgba(255,255,255,0.05); }
      `}} />

      <div className="hero-bg"></div>

      {/* ========================================================================= */}
      {/* HOOK INIZIALE */}
      {/* ========================================================================= */}
      <section className="relative z-10 w-full px-4 pt-10 sm:pt-16 pb-10 max-w-[1000px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-6 bg-emerald-500/10">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1"></span> Software Attivo
        </div>
        
        <h1 className="text-4xl sm:text-7xl font-black text-white mb-6 tracking-tighter leading-[1.05]">
          Batti le Banche. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">Gioca con le loro regole.</span>
        </h1>
        
        <p className="text-sm sm:text-lg text-slate-400 font-light leading-relaxed mb-10 max-w-2xl mx-auto">
          Se non hai soldi, automatizza l'accumulo. Se li hai già, usa il debito per proteggerli. Seleziona il tuo profilo qui sotto e sblocca l'algoritmo corretto.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-2xl mx-auto bg-black/40 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div onClick={() => setActiveTab('starter')} className={`tab-btn ${activeTab === 'starter' ? 'tab-active' : 'tab-inactive'}`}>
            <div className="text-lg mb-1">🌱</div>
            <div className="text-[10px] sm:text-xs">Parto da Zero</div>
          </div>
          <div onClick={() => setActiveTab('wealthy')} className={`tab-btn ${activeTab === 'wealthy' ? 'tab-active' : 'tab-inactive'}`}>
            <div className="text-lg mb-1">🛡️</div>
            <div className="text-[10px] sm:text-xs">Ho dei Risparmi</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PATH A: ETORO */}
      {/* ========================================================================= */}
      {activeTab === 'starter' && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <section className="relative z-10 max-w-[1200px] mx-auto px-4 pb-16">
            <div className="glass-box p-5 sm:p-10 border-t-4 border-t-blue-500">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Terminale di Costruzione</h2>
                <p className="text-sm text-slate-400 font-light">Accumula in automatico senza farti condizionare dalle emozioni del mercato.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-black/40 p-5 sm:p-8 rounded-2xl border border-white/5 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">Versamento Ricorrente</label>
                        <div className="relative">
                          <span className="absolute left-0 bottom-3 text-white/30 font-mono text-xl">€</span>
                          <input type="number" value={deposito || ''} onChange={(e) => setDeposito(Number(e.target.value))} className="input-pro" placeholder="200" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-white font-black uppercase tracking-widest mb-2">Frequenza</label>
                        <select value={frequenza} onChange={(e) => setFrequenza(Number(e.target.value))} className="select-pro w-full mt-2 text-base py-3">
                          <option value={52}>Settimanale</option>
                          <option value={12}>Mensile</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        <div className="text-right text-white font-mono mt-1 font-bold text-xs">{anni} Anni</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OUTPUT & CPA ETORO */}
                <div className="lg:col-span-5 relative z-20">
                  <div className="bg-[#050810] border border-blue-500/20 rounded-2xl p-5 sm:p-8 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 text-center border-b border-blue-500/10 pb-4">Proiezione Patrimonio Totale</h3>
                      <div className="font-mono text-4xl sm:text-5xl font-black text-white text-center mb-6 py-2">
                        {"€" + capitaleFinaleEtoro.toFixed(0)}
                      </div>
                      <div className="space-y-3 text-xs font-mono">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded">
                          <span className="text-slate-400">TOTALE VERSATO DA TE:</span>
                          <span className="font-bold text-white">{"€" + totaleVersatoEtoro.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-500/10 p-3 rounded border border-blue-500/20">
                          <span className="text-blue-400">PROFITTO COPYTRADING:</span>
                          <span className="font-bold text-blue-400">{"+ €" + profittoGeneratoEtoro.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center pt-6 border-t border-white/10 relative z-40">
                      
                      {/* TASTO CPA - ORA SEMPRE VISIBILE IN-LINE SU TUTTI I DISPOSITIVI */}
                      <a href={LINK_ETORO} target="_blank" rel="noopener noreferrer" className="btn-blue w-full py-5 rounded-xl text-sm mb-5 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        Attiva Accumulo su eToro
                      </a>
                      
                      <div className="text-left bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Come massimizzare:</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-light leading-relaxed">
                          <strong className="text-white">1. Il segreto del DCA:</strong> Imposta un deposito ricorrente. Acquistando sia quando il mercato sale che quando crolla, abbatti il rischio.<br/><br/>
                          <strong className="text-white">2. Usa il CopyTrading:</strong> Cerca un investitore d'élite e clicca "Copia". Il tuo conto replicherà in automatico le sue mosse.
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
      {/* PATH B: YOUHODLER */}
      {/* ========================================================================= */}
      {activeTab === 'wealthy' && (
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <section className="relative z-10 max-w-[1200px] mx-auto px-4 pb-16">
            <div className="glass-box p-5 sm:p-10 border-t-4 border-t-emerald-500">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Terminale di Estrazione</h2>
                <p className="text-sm text-slate-400 font-light">Usa il tuo capitale come scudo per farti prestare i contanti istantaneamente, senza controlli CRIF.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-black/40 p-5 sm:p-8 rounded-2xl border border-white/5 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
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

                    <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10">
                      <div>
                        <label className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mb-2">Max LTV</label>
                        <div className="relative">
                          <input type="number" value={maxLtv || ''} onChange={(e) => setMaxLtv(Number(e.target.value))} className="input-pro input-small pr-4" />
                          <span className="absolute right-0 bottom-2 text-slate-500 font-mono">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase mb-2">Rendita (APY)</label>
                        <div className="relative">
                          <input type="number" value={apyYouHodler || ''} onChange={(e) => setApyYouHodler(Number(e.target.value))} className="input-pro input-small pr-4" />
                          <span className="absolute right-0 bottom-2 text-slate-500 font-mono">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] sm:text-[10px] text-rose-400 font-bold uppercase mb-2">Costo (APR)</label>
                        <div className="relative">
                          <input type="number" value={aprYouHodler || ''} onChange={(e) => setAprYouHodler(Number(e.target.value))} className="input-pro input-small pr-4" />
                          <span className="absolute right-0 bottom-2 text-slate-500 font-mono">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OUTPUT YOUHODLER CON OVERLAY CORRETTO */}
                <div className="lg:col-span-5 relative z-20">
                  <div className="bg-[#050810] border border-emerald-500/20 rounded-2xl p-5 sm:p-8 h-full flex flex-col justify-between relative overflow-hidden">
                    
                    <div className="relative flex-1">
                      {!isLombardFattibile && (
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center rounded-xl border border-rose-500/30">
                          <p className="text-rose-500 font-black text-xl mb-1">Collaterale Basso</p>
                          <p className="text-slate-300 text-xs">Aumenta "I Tuoi Risparmi" a min <strong className="text-white">{"€" + collateraleRichiesto.toFixed(0)}</strong> per abilitare l'estrazione.</p>
                        </div>
                      )}

                      <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 text-center border-b border-emerald-500/10 pb-4">Report Algoritmico (12 Mesi)</h3>
                      <div className="space-y-3 text-xs font-mono">
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
                      
                      <div className="mt-6 pt-4 border-t border-white/10 mb-4">
                        <div className="flex justify-between items-end text-left">
                          <span className="font-black text-white text-[11px] uppercase tracking-widest">Saldo Netto Annuo</span>
                          <span className={`font-mono font-black text-3xl sm:text-4xl ${deltaNettoYouHodler >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(deltaNettoYouHodler > 0 ? "+" : "") + "€" + deltaNettoYouHodler.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-40 mt-2">
                      {/* TASTO CPA - ORA SEMPRE VISIBILE IN-LINE SU TUTTI I DISPOSITIVI */}
                      <a 
                        href={isLombardFattibile && deltaNettoYouHodler >= 0 ? LINK_YOUHODLER : "#"} 
                        target={isLombardFattibile && deltaNettoYouHodler >= 0 ? "_blank" : "_self"}
                        className={`btn-green w-full py-5 rounded-xl text-sm mb-5 shadow-[0_0_30px_rgba(16,185,129,0.3)] ${(!isLombardFattibile || deltaNettoYouHodler < 0) && 'opacity-40 grayscale cursor-not-allowed'}`}
                      >
                        Avvia Estrazione YouHodler
                      </a>

                      <div className="text-left bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Come gestire il prestito:</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-light leading-relaxed">
                          <strong className="text-white">1. Evita la Liquidazione:</strong> Mantenendo un LTV più basso del 90%, il tuo collaterale è al sicuro anche se il mercato crolla improvvisamente.<br/><br/>
                          <strong className="text-white">2. Rate Invisibili:</strong> Non estinguere mai la rata mensile con i tuoi soldi dal conto corrente! Lascia che la rendita del collaterale copra il prestito in automatico al posto tuo.
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
      {/* BARRA STICKY EXTRA PER SICUREZZA (OPZIONALE MA EFFICACE) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-[#030303]/95 border-t border-white/10 z-[9999] md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-8 backdrop-blur-md">
        <div className="w-full max-w-md mx-auto flex gap-3 items-center justify-between">
          <div className="text-[10px] text-slate-400 font-mono leading-tight">
            Strategia Calcolata: <br/>
            <span className="text-white font-bold">{activeTab === 'starter' ? 'Accumulo' : 'Estrazione'}</span>
          </div>
          {activeTab === 'starter' ? (
            <a href={LINK_ETORO} target="_blank" rel="noopener noreferrer" className="btn-blue px-6 py-3 rounded-lg text-xs w-2/3">
              Applica Ora
            </a>
          ) : (
            <a 
              href={isLombardFattibile && deltaNettoYouHodler >= 0 ? LINK_YOUHODLER : "#"} 
              target={isLombardFattibile && deltaNettoYouHodler >= 0 ? "_blank" : "_self"}
              className={`btn-green px-6 py-3 rounded-lg text-xs w-2/3 ${(!isLombardFattibile || deltaNettoYouHodler < 0) && 'opacity-40 grayscale cursor-not-allowed'}`}
            >
              Applica Ora
            </a>
          )}
        </div>
      </div>

    </main>
  );
}