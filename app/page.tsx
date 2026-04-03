"use client";

import Link from 'next/link';
import { useEffect, useRef, useState, ReactNode } from 'react';

// =======================================================================
// TIPI TYPESCRIPT PER IL MOTORE DI ANIMAZIONE (Evita l'errore di Netlify)
// =======================================================================
interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  id?: string;
}

// =======================================================================
// MOTORE DI ANIMAZIONE ALLO SCORRIMENTO (Scroll Reveal Engine)
// =======================================================================
const RevealOnScroll = ({ children, className = "", delay = 0, threshold = 0.1, id }: RevealOnScrollProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      id={id}
      ref={ref}
      className={`${className} transition-all duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-[0.98]"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#000000] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden relative flex flex-col w-full">
      
      {/* STILI GLOBALI E ANIMAZIONI INFINITE */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        body { font-family: 'Inter', sans-serif; background-color: #000000; margin: 0; padding: 0; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        @keyframes glowPulse { 0%, 100% { opacity: 0.15; transform: scale(1) rotate(0deg); } 50% { opacity: 0.35; transform: scale(1.05) rotate(2deg); } }
        @keyframes dataStream { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
        
        /* Glassmorphism Dinamico (Bento Box) */
        .bento-box { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 1.5rem; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; position: relative; }
        @media (min-width: 768px) { 
          .bento-box:hover { border-color: rgba(59, 130, 246, 0.4); background: rgba(255, 255, 255, 0.04); transform: translateY(-5px) scale(1.01); box-shadow: 0 30px 60px -15px rgba(59, 130, 246, 0.15); z-index: 10; } 
          .bento-box:hover .bento-glow { opacity: 1; }
        }
        .bento-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, transparent 70%); opacity: 0; transition: opacity 0.4s ease; pointer-events: none; }
        
        .text-glow { background: linear-gradient(180deg, #ffffff 0%, #60A5FA 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        /* Tasto Primary Premium */
        .btn-beam { position: relative; display: inline-flex; align-items: center; justify-content: center; background: #000; color: white; padding: 2px; border-radius: 1.2rem; overflow: hidden; transition: transform 0.2s ease; }
        .btn-beam::before { content: ''; position: absolute; inset: -50%; background: conic-gradient(from 0deg, transparent 70%, #3B82F6 80%, #ffffff 100%); animation: spin 3s linear infinite; }
        .btn-beam-inner { position: relative; background: #000; border-radius: 1.1rem; padding: 1rem 2rem; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transition: background 0.2s ease; }
        .btn-beam:hover .btn-beam-inner { background: rgba(59, 130, 246, 0.1); }
        .btn-beam:active { transform: scale(0.96); }
        @keyframes spin { to { transform: rotate(360deg); } }

        .bg-grid-fine { background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 24px 24px; }
      `}} />

      {/* SFONDI AMBIENTALI ASSOLUTI */}
      <div className="absolute inset-0 bg-grid-fine pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 5%, transparent 95%)', WebkitMaskImage: 'linear-gradient(to bottom, black 5%, transparent 95%)' }}></div>
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[150vw] md:w-[80vw] h-[50vh] bg-blue-700/20 rounded-full blur-[100px] pointer-events-none" style={{animation: 'glowPulse 8s infinite alternate'}}></div>

      {/* TOP NAVBAR */}
      <nav className="fixed w-full z-50 bg-[#000000]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-base sm:text-lg shadow-[0_0_20px_rgba(37,99,235,0.5)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] transition-all duration-300">P</div>
            <span className="font-black text-white text-lg sm:text-xl tracking-tight">Partner<span className="text-blue-500">Vest</span></span>
          </div>
          
          <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <a href="#sistema" className="hover:text-white transition-colors">Sistema S2S</a>
            <a href="#compliance" className="hover:text-white transition-colors">Traffico</a>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="text-[10px] sm:text-[11px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors hidden sm:block">Login S2S</Link>
            <Link href="/signup" className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-lg transition-all active:scale-95">Applica Ora</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 px-4 flex flex-col justify-center items-center z-10 w-full max-w-[1200px] mx-auto text-center min-h-[90vh]">
        
        <RevealOnScroll delay={0}>
          <div className="mb-6 sm:mb-8 px-4 py-2 rounded-full bg-blue-950/40 border border-blue-500/30 text-blue-300 text-[9px] sm:text-[10px] font-mono tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.2)] max-w-fit mx-auto">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            </div>
            <span>[S2S] API.LISTENING: ONLINE</span>
          </div>
        </RevealOnScroll>
        
        <RevealOnScroll delay={100}>
          <h1 className="text-[2.5rem] leading-[1.1] sm:text-5xl md:text-7xl lg:text-[6rem] font-black text-white tracking-tighter mb-6 max-w-5xl mx-auto px-2">
            Dominio <br className="hidden sm:block" />
            <span className="text-glow">Finanziario.</span>
          </h1>
        </RevealOnScroll>
        
        <RevealOnScroll delay={200}>
          <p className="text-sm sm:text-base md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto font-medium px-2">
            L'infrastruttura B2B che garantisce il <strong className="text-white">100% di tracciamento</strong>. Niente cookie persi. Payout netti erogati via protocollo Server-to-Server.
          </p>
        </RevealOnScroll>
        
        <RevealOnScroll delay={300} className="w-full sm:w-auto px-4">
          <Link href="/signup" className="btn-beam w-full sm:w-auto">
            <div className="btn-beam-inner font-black text-[11px] sm:text-[13px] uppercase tracking-widest">
              Inizializza Terminale
            </div>
          </Link>
        </RevealOnScroll>

        {/* Floating Mini-Stats */}
        <RevealOnScroll delay={400} className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl px-2">
           {[{l: 'CPA Media', v: '€45 - €150', c: 'text-emerald-400'}, {l: 'Tracking', v: 'Server-Side', c: 'text-blue-400'}, {l: 'Pagamenti', v: 'Bonifico SEPA', c: 'text-indigo-400'}, {l: 'Ammissione', v: 'Su Invito', c: 'text-rose-400'}].map((s,i) => (
             <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-md">
                <p className="text-[8px] sm:text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1">{s.l}</p>
                <p className={`font-mono font-black text-sm sm:text-base tracking-tight ${s.c}`}>{s.v}</p>
             </div>
           ))}
        </RevealOnScroll>
      </section>

      {/* BENTO BOX GRID SECTION */}
      <section id="sistema" className="py-16 sm:py-24 relative z-10 w-full px-4">
        <div className="max-w-[1200px] mx-auto">
          
          <RevealOnScroll className="text-center mb-12 sm:mb-16 px-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Tecnologia Asimmetrica.</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">Progettato per superare chirurgicamente i limiti tecnici dell'affiliate marketing convenzionale.</p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 auto-rows-auto md:auto-rows-[280px]">
            
            {/* Box 1: S2S */}
            <RevealOnScroll delay={0} className="md:col-span-2 md:row-span-2">
              <div className="bento-box h-full p-6 sm:p-10 flex flex-col justify-between group">
                <div className="bento-glow"></div>
                <div>
                   <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-6 shadow-lg">⚡</div>
                   <h3 className="text-2xl sm:text-4xl font-black text-white mb-3 sm:mb-4 tracking-tight">Postback S2S</h3>
                   <p className="text-slate-400 text-sm sm:text-base max-w-md leading-relaxed">Il browser dell'utente non gestisce i dati critici. Le conversioni vengono inviate direttamente dai server bancari ai nostri server. Drop rate ridotto a zero assoluto.</p>
                </div>
                {/* Fake Code Block */}
                <div className="mt-8 bg-[#050B14] border border-blue-500/20 rounded-xl p-4 sm:p-5 font-mono text-[9px] sm:text-xs text-blue-300/80 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-4 w-px bg-blue-500/30">
                     <div className="w-1 h-8 bg-blue-400 -ml-[1.5px] rounded-full" style={{animation: 'dataStream 2s linear infinite'}}></div>
                  </div>
                  <p className="pl-6"><span className="text-pink-500">const</span> <span className="text-blue-400">conversion</span> = <span className="text-pink-500">await</span> <span className="text-green-400">supabase</span>.from(<span className="text-yellow-300">'conversions'</span>)</p>
                  <p className="pl-6 mt-1">  .insert(&#123; partner_id: <span className="text-yellow-300">'{'{subid}'}'</span>, amount: <span className="text-emerald-400">payout</span> &#125;)</p>
                  <p className="pl-6 mt-2 text-slate-500">// 200 OK - Wallet Aggiornato Istantaneamente</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Box 2: Hub IT */}
            <RevealOnScroll delay={100} className="h-full">
              <div className="bento-box h-full p-6 sm:p-8 flex flex-col justify-between group">
                <div className="bento-glow"></div>
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-xl mb-4">🖥️</div>
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-white mb-2">Deploy Hub IT</h4>
                  <p className="text-xs sm:text-sm text-slate-400">Forniamo landing page e funnel ad alta conversione pronti all'uso sui nostri domini trust.</p>
                </div>
              </div>
            </RevealOnScroll>

            {/* Box 3: Payout */}
            <RevealOnScroll delay={200} className="h-full">
              <div className="bento-box h-full p-6 sm:p-8 flex flex-col justify-center items-center text-center group bg-gradient-to-b from-emerald-900/10 to-transparent">
                <div className="bento-glow"></div>
                <h3 className="text-5xl sm:text-6xl font-black text-emerald-400 mb-2 font-mono tracking-tighter">100%</h3>
                <h4 className="text-base sm:text-lg font-black text-white mb-2">Payout Netto</h4>
                <p className="text-xs sm:text-sm text-slate-400">Zero commissioni nascoste. Quello che la banca paga, tu lo ricevi.</p>
              </div>
            </RevealOnScroll>

            {/* Box 4: TRAFFICO BLINDATO E COMPLIANCE */}
            <RevealOnScroll delay={0} className="md:col-span-3" id="compliance">
              <div className="bento-box h-full p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 group bg-gradient-to-r from-slate-900/40 to-transparent border-t-blue-500/20">
                <div className="bento-glow"></div>
                <div className="w-16 h-16 shrink-0 bg-slate-800 border border-slate-600 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Traffico Blindato.</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-4xl">
                    Lavorare nel settore finanziario richiede partnership solide. Autorizziamo preventivamente le tue sorgenti di traffico (Meta, Google, TikTok, Native) per garantirti un business model scalabile e totalmente al riparo da ban o sospensioni improvvise da parte degli istituti bancari.
                  </p>
                </div>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* CALL TO ACTION MASSIVA */}
      <section className="py-20 sm:py-32 relative z-10 w-full text-center px-4 mt-8 sm:mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-[#000000] to-[#000000] -z-10"></div>
        
        <RevealOnScroll>
          <div className="max-w-[800px] mx-auto border border-blue-500/20 bg-[#0B1221]/50 backdrop-blur-2xl p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_0_80px_rgba(37,99,235,0.15)] relative overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_70%,rgba(59,130,246,0.1)_80%,transparent_100%)] animate-[spin_6s_linear_infinite] -z-10"></div>
            
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-black border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-2xl relative z-10">🔒</div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight relative z-10 px-2">Il Terminale Ti Aspetta.</h2>
            <p className="text-slate-400 mb-8 sm:mb-10 text-sm sm:text-base font-medium leading-relaxed max-w-lg mx-auto relative z-10 px-2">
              Ammissione a numero chiuso. L'approvazione è manuale e dedicata a chi sa muovere volumi di traffico reali.
            </p>
            <Link href="/signup" className="inline-block w-full sm:w-auto px-10 sm:px-12 py-4 sm:py-5 rounded-xl sm:rounded-2xl bg-white text-black font-black text-[11px] sm:text-[13px] uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] relative z-10">
              Richiedi Accesso B2B
            </Link>
          </div>
        </RevealOnScroll>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#000000] py-10 sm:py-12 border-t border-white/5 w-full z-10 relative">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2 opacity-80 group">
              <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center font-black text-white text-[10px] border border-white/10 group-hover:bg-blue-600 transition-colors">P</div>
              <span className="font-black text-white text-sm tracking-tight">PartnerVest</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono max-w-[250px]">
              Infrastruttura B2B indipendente.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3 text-[9px] font-black text-slate-500 uppercase tracking-widest w-full md:w-auto">
            <div className="flex gap-6">
              <Link href="/login" className="hover:text-white transition-colors">Terminale S2S</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Legal Policy</Link>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center mt-2 hover:bg-white/10 transition-colors">
              <span>Supporto:</span>
              <a href="mailto:finance.partnerr@gmail.com" className="text-blue-400 hover:text-blue-300 lowercase font-bold tracking-normal text-[10px]">finance.partnerr@gmail.com</a>
            </div>
            <p className="mt-2 text-slate-700 opacity-60 font-mono">© 2026 PartnerVest. Tutti i diritti riservati.</p>
          </div>

        </div>
      </footer>

    </main>
  );
}