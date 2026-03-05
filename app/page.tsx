import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#02040A] text-[#E2E8F0] font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      
      {/* MOTORE ANIMAZIONI AVANZATE (Blur, Scale, Slide) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blurSlideUp {
          0% { opacity: 0; transform: translateY(30px); filter: blur(12px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        @keyframes scaleInReveal {
          0% { opacity: 0; transform: scale(0.95) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideDownHeader {
          0% { opacity: 0; transform: translateY(-100%); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .anim-blur-up { animation: blurSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .anim-scale-in { animation: scaleInReveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .anim-header { animation: slideDownHeader 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-float { animation: subtleFloat 6s ease-in-out infinite; }
        
        /* Timings Chirurgici */
        .d-100 { animation-delay: 100ms; }
        .d-200 { animation-delay: 200ms; }
        .d-300 { animation-delay: 300ms; }
        .d-400 { animation-delay: 400ms; }
        .d-500 { animation-delay: 500ms; }
        .d-600 { animation-delay: 600ms; }
      `}} />

      {/* BACKGROUND GLOBALE E LUCI AMBIENTALI */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#02040A] to-[#02040A] pointer-events-none"></div>
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      {/* HEADER (Slide in dall'alto) */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.03] bg-[#02040A]/60 backdrop-blur-2xl anim-header">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-to-b from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <span className="text-white text-lg font-bold leading-none">F</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white hidden sm:block">
              Finance<span className="text-blue-500">Partner</span>
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/login" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Log in
            </Link>
            <Link href="/signup" className="relative rounded-full bg-white px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold text-black transition-transform hover:scale-105">
              Inizia Ora
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        
        {/* HERO SECTION: Entrata Teatrale a Cascata */}
        <section className="relative px-4 pt-36 pb-20 sm:px-6 sm:pt-48 sm:pb-32 lg:px-8 lg:pt-56">
          <div className="mx-auto max-w-5xl text-center">
            
            <div className="anim-blur-up d-100 mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-blue-300 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              Piattaforma S2S Live
            </div>
            
            <h1 className="anim-blur-up d-200 mb-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.05]">
              Monetizzazione <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-300 via-indigo-300 to-blue-600">
                Senza Attriti.
              </span>
            </h1>
            
            <p className="anim-blur-up d-300 mx-auto mb-10 max-w-2xl text-base sm:text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
              Il network B2B che trasforma il tuo traffico finance in liquidità immediata. Landing page auto-generate, cookie-less tracking e payout istituzionali.
            </p>
            
            <div className="anim-blur-up d-400 flex flex-col items-center justify-center gap-4 sm:flex-row w-full sm:w-auto px-4 sm:px-0">
              <Link href="/signup" className="w-full sm:w-auto rounded-full bg-blue-600 px-8 py-4 text-sm sm:text-base font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                Accedi al Network
              </Link>
              <Link href="#tecnologia" className="w-full sm:w-auto rounded-full border border-white/10 bg-transparent px-8 py-4 text-sm sm:text-base font-bold text-white transition-all hover:bg-white/5">
                Vedi come funziona
              </Link>
            </div>
          </div>
        </section>

        {/* 3D DASHBOARD PREVIEW (Scale In Effect) */}
        <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 hidden md:block anim-scale-in d-500 pb-32">
          {/* Outer Glow */}
          <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/20 to-transparent blur-2xl opacity-50 rounded-[3rem]"></div>
          
          {/* Gradient Border Wrapper */}
          <div className="relative anim-float p-[1px] rounded-[2rem] bg-gradient-to-b from-white/15 via-white/5 to-transparent shadow-2xl">
            <div className="rounded-[2rem] bg-[#0A0D14]/90 backdrop-blur-xl p-6 sm:p-8">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Entrate Mensili</p>
                  <p className="text-3xl font-black text-white">€ 12.840<span className="text-slate-500 text-xl">,00</span></p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold">
                  Sync Attiva
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">↗</div>
                  <div>
                    <p className="font-bold text-sm text-white">Apertura Conto eToro</p>
                    <p className="text-xs text-slate-500 mt-1">Confermato • +€ 60.00</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-400">↻</div>
                  <div>
                    <p className="font-bold text-sm text-white">Carta Revolut Standard</p>
                    <p className="text-xs text-slate-500 mt-1">In Attesa • +€ 25.00</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* BENTO GRID: Funzionalità con ingresso scaglionato */}
        <section id="tecnologia" className="relative py-24 sm:py-32 border-t border-white/[0.03] bg-[#02040A]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            <div className="mb-16 sm:mb-20 text-center sm:text-left">
              <h2 className="anim-blur-up mb-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                Progettato per l'Elite.
              </h2>
              <p className="anim-blur-up d-100 text-base sm:text-lg text-slate-400 max-w-2xl">
                Ogni strumento è ingegnerizzato per azzerare i tempi morti e scalare le tue campagne Ads dal giorno zero.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 - Entra per prima */}
              <div className="anim-scale-in d-200 md:col-span-2 group relative p-[1px] rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent hover:from-blue-500/30 transition-all">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative h-full rounded-[2rem] bg-[#0A0D14] p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-2xl">🌐</div>
                  <div className="relative z-10">
                    <h3 className="mb-4 text-2xl sm:text-3xl font-bold text-white">Siti Auto-Deploy</h3>
                    <p className="text-base text-slate-400 leading-relaxed max-w-md">
                      Dimentica WordPress. Il nostro motore estrae l'offerta e genera una landing page fulminea, già approvata legalmente e con i tuoi link tracciati nascosti nel codice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 - Entra per seconda */}
              <div className="anim-scale-in d-300 md:col-span-1 group relative p-[1px] rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent hover:from-emerald-500/30 transition-all">
                <div className="relative h-full rounded-[2rem] bg-[#0A0D14] p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-2xl">⚡</div>
                  <div className="relative z-10">
                    <h3 className="mb-3 text-xl sm:text-2xl font-bold text-white">Sync S2S</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      L'approvazione del conto bancario innesca un webhook che aggiorna il tuo saldo in 0.04 secondi. Nessun cookie perso.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3 - Entra per terza */}
              <div className="anim-scale-in d-400 md:col-span-1 group relative p-[1px] rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent hover:from-purple-500/30 transition-all">
                <div className="relative h-full rounded-[2rem] bg-[#0A0D14] p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-2xl">🏦</div>
                  <div className="relative z-10">
                    <h3 className="mb-3 text-xl font-bold text-white">Cassa Sicura</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Tracking chiaro dei rifiuti (es. documenti invalidi) e sblocco immediato dei fondi appena la banca liquida.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4 - Entra per quarta */}
              <div className="anim-scale-in d-500 md:col-span-2 group relative p-[1px] rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent hover:from-indigo-500/30 transition-all">
                <div className="relative h-full rounded-[2rem] bg-[#0A0D14] p-8 sm:p-10 flex flex-col justify-between overflow-hidden">
                  {/* Griglia architettonica di sfondo al box */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-2xl relative z-10">📈</div>
                  <div className="relative z-10">
                    <h3 className="mb-3 text-2xl font-bold text-white">Payout Insuperabili</h3>
                    <p className="text-base text-slate-400 leading-relaxed max-w-xl">
                      Tagliando gli intermediari obsoleti e fornendoti l'infrastruttura diretta, ti garantiamo margini sulle aperture di conti e carte che nessun network pubblico può eguagliare.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA FINALE: Blur Reveal dal basso */}
        <section className="relative overflow-hidden py-24 sm:py-40 border-t border-white/[0.03]">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
           
           <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
              <h2 className="anim-blur-up mb-6 text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">Il Network ti aspetta.</h2>
              <p className="anim-blur-up d-100 mb-10 sm:mb-12 text-lg sm:text-xl text-slate-400">
                Unisciti alla cerchia di affiliati che usano la nostra tecnologia. Setup in 30 secondi.
              </p>
              <div className="anim-blur-up d-200">
                <Link href="/signup" className="inline-flex w-full sm:w-auto justify-center rounded-full bg-white px-10 sm:px-12 py-4 sm:py-5 text-base sm:text-lg font-bold text-black transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                  Crea Account Gratuito
                </Link>
              </div>
           </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.03] bg-[#02040A] py-8 sm:py-12 relative z-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">Finance<span className="text-blue-500">Partner</span></span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">© 2026. L'Infrastruttura B2B Definitiva.</p>
        </div>
      </footer>
    </div>
  );
}
