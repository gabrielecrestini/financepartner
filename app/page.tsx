import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      
      {/* MOTORE ANIMAZIONI E TEXTURE HIGH-END */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes floatSlow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(1deg); } }
        @keyframes floatFast { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(12px) rotate(-1deg); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
        
        .animate-fade-up { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        
        .animate-float-slow { animation: floatSlow 8s ease-in-out infinite; }
        .animate-float-fast { animation: floatFast 6s ease-in-out infinite; }
        
        .marquee-container { display: flex; width: 200%; animation: scroll 50s linear infinite; }
        
        /* Effetto Vetro Ultra-Premium */
        .glass-card { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 4px 30px rgba(0,0,0,0.1); }
        .glass-card-hover:hover { border-color: rgba(59, 130, 246, 0.3); background: rgba(255, 255, 255, 0.04); transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(59,130,246,0.15); }
        
        .bg-grid-tech { background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; }
        @media (min-width: 768px) { .bg-grid-tech { background-size: 50px 50px; } }
        
        .text-gradient-blue { background: linear-gradient(135deg, #ffffff 0%, #3B82F6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 bg-grid-tech opacity-60 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-20%] md:left-[-10%] w-[100%] md:w-[60%] h-[50%] md:h-[70%] bg-blue-600/20 rounded-full blur-[100px] md:blur-[160px] pointer-events-none" style={{animation: 'pulseGlow 10s infinite'}}></div>
      <div className="absolute bottom-[-10%] right-[-20%] md:right-[-10%] w-[90%] md:w-[50%] h-[40%] md:h-[60%] bg-indigo-900/30 rounded-full blur-[90px] md:blur-[150px] pointer-events-none" style={{animation: 'pulseGlow 12s infinite reverse'}}></div>

      {/* TOP NAVIGATION */}
      <nav className="fixed w-full z-50 bg-[#02040A]/85 backdrop-blur-2xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-[0.8rem] flex items-center justify-center font-black text-white text-base sm:text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)]">P</div>
            <span className="font-black text-white text-lg sm:text-xl tracking-tight">Partner<span className="text-blue-500">Vest</span></span>
          </div>
          
          <div className="hidden md:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <a href="#infrastruttura" className="hover:text-white transition-colors">Protocollo S2S</a>
            <a href="#compliance" className="hover:text-white transition-colors">Compliance</a>
            <a href="#network" className="hover:text-white transition-colors">Marketplace</a>
          </div>
          
          <div className="flex gap-3 sm:gap-5 items-center">
            <Link href="/login" className="text-[10px] sm:text-[11px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors hidden min-[400px]:block">
              Login
            </Link>
            <Link href="/signup" className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/20 border border-white/10 px-4 sm:px-7 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all active:scale-95">
              Candidati
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION HIGH-CONVERSION */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 lg:pt-56 lg:pb-32 flex-1 flex flex-col justify-center">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* TESTI (Sinistra su Desktop, Centro su Mobile) */}
          <div className="lg:col-span-7 max-w-3xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-6 sm:mb-8 animate-fade-up">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span> Accesso B2B a Numero Chiuso
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.15] sm:leading-[1.1] tracking-tight mb-6 sm:mb-8 animate-fade-up delay-100">
              L'Infrastruttura di <br className="hidden sm:block"/>Acquisizione <span className="text-gradient-blue">Definitiva.</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 mb-8 sm:mb-10 leading-relaxed animate-fade-up delay-200 font-medium px-2 sm:px-0">
              Non siamo un semplice network di affiliazione. Siamo i tuoi soci tecnologici. Tracciamento Server-to-Server, zero cookie loss e le CPA finanziarie più alte del mercato europeo.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-fade-up delay-300 w-full sm:w-auto px-2 sm:px-0">
              <Link href="/signup" className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[12px] uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95">
                Richiedi Approvazione
              </Link>
              <Link href="/login" className="flex items-center justify-center glass-card hover:bg-white/10 border border-white/10 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-[11px] sm:text-[12px] text-white uppercase tracking-widest transition-all active:scale-95">
                Login Terminale S2S
              </Link>
            </div>

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 animate-fade-up delay-400">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#02040A] bg-slate-800 flex items-center justify-center text-[10px] sm:text-xs shadow-lg">📈</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#02040A] bg-indigo-800 flex items-center justify-center text-[10px] sm:text-xs shadow-lg">💶</div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#02040A] bg-blue-800 flex items-center justify-center text-[10px] sm:text-xs shadow-lg">🔒</div>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left max-w-[250px] leading-relaxed">
                Centinaia di migliaia di Euro in commissioni processate ogni mese.
              </p>
            </div>
          </div>

          {/* MOCKUP VISUALE "STATUS-DRIVEN" (Destra - Nascosto su Mobile per pulizia visiva) */}
          <div className="lg:col-span-5 relative animate-fade-up delay-300 hidden lg:block h-[500px]">
            {/* Sfera luminosa centrale dietro le carte */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>

            {/* Card 1: Payout */}
            <div className="absolute top-[10%] right-[5%] z-30 animate-float-fast">
              <div className="glass-card p-6 rounded-[1.5rem] border border-emerald-500/20 bg-black/40 shadow-2xl flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl">💶</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPA Approved</p>
                  <p className="text-2xl font-black text-emerald-400">+ €150.00</p>
                </div>
              </div>
            </div>

            {/* Card 2: Terminale Principale */}
            <div className="absolute top-[35%] left-[0%] z-20 animate-float-slow w-[380px]">
              <div className="glass-card p-8 rounded-[2rem] border border-blue-500/20 bg-[#0B1120]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live S2S Sync</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">ID: 8F92A</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Liquidità Esigibile Mensile</p>
                <p className="text-5xl font-black text-white mb-6">€24,850<span className="text-2xl text-slate-500">.00</span></p>
                
                {/* Finto Grafico a Barre */}
                <div className="flex items-end gap-2 h-12 mt-4">
                  {[40, 60, 45, 80, 50, 90, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-500/20 rounded-t-sm" style={{height: `${h}%`}}>
                      <div className="bg-blue-500 w-full rounded-t-sm transition-all" style={{height: `${h === 100 ? '100' : h-10}%`}}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: EPC Stat */}
            <div className="absolute bottom-[10%] right-[15%] z-30 animate-float-fast" style={{animationDelay: '1s'}}>
              <div className="glass-card p-5 rounded-[1.2rem] border border-indigo-500/20 bg-black/60 shadow-2xl flex items-center gap-4">
                <div className="text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Media Rete (EPC)</p>
                  <p className="text-xl font-black text-indigo-400">€3.42 / Click</p>
                </div>
                <div className="w-8 h-8 rounded-full border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs">↑</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SEZIONE BRAND AUTHORITY (MARQUEE) */}
      <section className="py-10 sm:py-12 border-y border-white/5 bg-black/40 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#02040A] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#02040A] to-transparent z-10 pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-6 sm:mb-8 text-center">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Accesso privilegiato alle campagne ufficiali dei top istituti</p>
        </div>

        <div className="flex overflow-hidden opacity-60 hover:opacity-100 transition-opacity duration-500">
          <div className="marquee-container gap-12 sm:gap-24 items-center px-4 sm:px-10">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-12 sm:gap-24 items-center shrink-0">
                <span className="text-xl sm:text-3xl font-black text-slate-300 tracking-tighter uppercase">N26</span>
                <span className="text-lg sm:text-2xl font-black text-slate-300 tracking-widest uppercase">REVOLUT</span>
                <span className="text-xl sm:text-3xl font-black text-slate-300 tracking-tight uppercase">eTORO</span>
                <span className="text-base sm:text-xl font-bold text-slate-300 tracking-widest uppercase">TRADE REPUBLIC</span>
                <span className="text-xl sm:text-3xl font-black text-slate-300 tracking-tighter uppercase">BBVA</span>
                <span className="text-lg sm:text-2xl font-black text-slate-300 tracking-widest uppercase">XTB</span>
                <span className="text-xl sm:text-3xl font-bold text-slate-300 tracking-tight uppercase">SCALABLE</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES / VALUE PROPOSITION */}
      <section id="infrastruttura" className="py-20 sm:py-32 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight px-2">Il Vantaggio Competitivo sleale.</h2>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed font-medium px-2 sm:px-4">Risolviamo chirurgicamente i problemi del performance marketing amatoriale: blocchi dei cookie, ban improvvisi e margini ridotti all'osso dagli intermediari.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Box 1: S2S */}
            <div className="glass-card glass-card-hover p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600/10 border border-blue-500/20 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center text-xl sm:text-3xl mb-5 sm:mb-8 relative z-10 shadow-[0_0_20px_rgba(37,99,235,0.1)]">🔌</div>
              <h3 className="text-lg sm:text-2xl font-black text-white mb-3 sm:mb-4 tracking-tight relative z-10">Connessione S2S</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed relative z-10">Le vecchie piattaforme perdono il 30% dei dati su iOS. Noi utilizziamo Postback Server-to-Server: i server della banca ci comunicano l'avvenuta conversione in tempo reale e in modo blindato.</p>
            </div>
            
            {/* Box 2: Hub */}
            <div className="glass-card glass-card-hover p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center text-xl sm:text-3xl mb-5 sm:mb-8 relative z-10 shadow-[0_0_20px_rgba(79,70,229,0.1)]">🖥️</div>
              <h3 className="text-lg sm:text-2xl font-black text-white mb-3 sm:mb-4 tracking-tight relative z-10">Deploy Hub B2B</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed relative z-10">Non possiedi infrastrutture ad alta conversione? Nessun problema. Il nostro dipartimento tecnico ospita e programma per te "Hub di Comparazione" gratuiti, massimizzando il tuo Conversion Rate.</p>
            </div>

            {/* Box 3: Compliance */}
            <div id="compliance" className="glass-card glass-card-hover p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-600/10 border border-emerald-500/20 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center text-xl sm:text-3xl mb-5 sm:mb-8 relative z-10 shadow-[0_0_20px_rgba(16,185,129,0.1)]">⚖️</div>
              <h3 className="text-lg sm:text-2xl font-black text-white mb-3 sm:mb-4 tracking-tight relative z-10">Compliance Totale</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed relative z-10">Lavoriamo alla luce del sole. Le tue sorgenti di traffico vengono autorizzate preventivamente. Questo ci garantisce partnership stabili e ti assicura pagamenti liquidati su circuito SEPA.</p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA FINALE */}
      <section id="network" className="py-20 sm:py-32 relative overflow-hidden border-t border-white/5 bg-black/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#02040A] to-[#02040A]"></div>
        
        <div className="max-w-[800px] mx-auto px-6 text-center relative z-10">
          <div className="inline-block px-4 sm:px-5 py-2 bg-blue-950/30 border border-blue-500/20 rounded-full text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6 sm:mb-8 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            Ammissione a Numero Chiuso
          </div>
          
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-5 sm:mb-8 tracking-tight">Entra nell'Elite.</h2>
          <p className="text-slate-400 mb-8 sm:mb-12 text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-2xl mx-auto px-2">
            PartnerVest è un circolo riservato a Media Buyer, Creator e Arbitraggisti del traffico. Se sai muovere volumi, noi ti diamo gli strumenti per non perdere nemmeno un centesimo.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-5 w-full px-2 sm:px-0">
            <Link href="/signup" className="w-full sm:w-auto bg-white hover:bg-slate-200 text-black font-black text-[11px] sm:text-[12px] uppercase tracking-widest px-8 sm:px-12 py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95 text-center">
              Candidati per l'Accesso
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER B2B CORPORATE */}
      <footer className="bg-[#010205] py-10 sm:py-16 border-t border-white/5 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-0 text-center lg:text-left">
          
          {/* Brand Info */}
          <div className="flex flex-col items-center lg:items-start gap-3 sm:gap-5 max-w-sm">
            <div className="flex items-center gap-2 sm:gap-3 opacity-60">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 rounded-[0.4rem] flex items-center justify-center font-black text-white text-[10px] sm:text-xs border border-white/10">P</div>
              <span className="font-black text-white text-base sm:text-lg tracking-tight">PartnerVest</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono leading-relaxed px-4 lg:px-0">
              Infrastruttura tecnologica indipendente B2B per il performance marketing. Tutte le campagne sono gestite in rigorosa osservanza delle normative finanziarie europee.
            </p>
          </div>
          
          {/* Link & Contatti */}
          <div className="flex flex-col items-center lg:items-end gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-2">
              <Link href="/login" className="hover:text-white transition-colors">Terminale Operativo</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Policy & Privacy</Link>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 sm:px-5 py-2.5 rounded-lg flex flex-col sm:flex-row items-center gap-1 sm:gap-3 w-full sm:w-auto justify-center mt-2 sm:mt-0">
              <span className="text-slate-400">Direct Support:</span>
              <a href="mailto:finance.partnerr@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors lowercase font-bold tracking-normal text-[10px] sm:text-xs break-all">finance.partnerr@gmail.com</a>
            </div>
            <p className="mt-4 sm:mt-6 text-slate-700 opacity-60 font-mono">© 2026 B2B Financial Network. All rights reserved.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}