"use client";

import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-500/20 py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Intestazione Corporate */}
      <div className="max-w-5xl mx-auto mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl font-black text-white text-xl shadow-lg hover:scale-105 transition-transform">
            F
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Accordo di Rete B2B</h1>
            <p className="text-sm text-slate-500 font-medium">Compliance & Legal Framework • Revisione 2026.1</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Salva PDF
          </button>
          <Link href="/signup" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md transition-colors">
            Torna alla Candidatura
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10">
        
        {/* Indice Laterale */}
        <aside className="md:w-64 shrink-0 hidden md:block">
          <div className="sticky top-10 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Indice Documento</h4>
            <ul className="space-y-3 text-xs font-medium text-slate-600">
              <li className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-blue-600 rounded-full"></span> 1. Oggetto</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> 2. Profilazione KYC</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> 3. Regole Antifrode</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> 4. Tracking S2S</li>
              <li className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> 5. Commissioni e Storni</li>
            </ul>
          </div>
        </aside>

        {/* Corpo del Contratto */}
        <main className="flex-1 bg-white border border-slate-200 p-8 sm:p-12 rounded-[2rem] shadow-sm space-y-10 text-slate-600 text-sm leading-relaxed">
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
            <p className="text-blue-900 font-medium">Il presente accordo costituisce un contratto vincolante tra la piattaforma di affiliazione (di seguito "Network") e l'utente registrato ("Publisher"). L'utilizzo dei servizi implica l'accettazione incondizionata delle presenti clausole.</p>
          </div>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold">1</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Oggetto del Contratto e Natura B2B</h2>
            </div>
            <p>Il Network mette a disposizione del Publisher un'infrastruttura SaaS per la generazione di link tracciati, al fine di promuovere servizi finanziari (CPA/CPL) forniti da istituti terzi (Advertiser). Il Publisher agisce come soggetto indipendente e si fa carico dei costi pubblicitari (Media Buying), senza alcun vincolo di agenzia o dipendenza dal Network.</p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold">2</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Compliance, KYC e Traffico</h2>
            </div>
            <ul className="space-y-2 list-disc pl-5">
              <li>L'accesso al Network è soggetto ad <strong>approvazione manuale</strong>.</li>
              <li>Il Publisher è obbligato a dichiarare preventivamente ogni singolo URL (Sito Web) o Canale Social utilizzato per la promozione.</li>
              <li>L'uso di fonti di traffico nascoste, non dichiarate o modificate in corso d'opera tramite <em>Cloaking</em> o <em>Iframe</em> comporterà l'espulsione immediata dalla piattaforma.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center font-bold">3</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Politica Zero Tolleranza (Antifrode)</h2>
            </div>
            <p className="mb-4">Per tutelare gli istituti bancari partner e le normative CONSOB/ESMA, sono <strong>rigorosamente vietate</strong> le seguenti pratiche:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Traffico Incentivato</h4>
                <p className="text-xs text-slate-500">Offrire compensi in denaro, rimborsi o regali fisici all'utente finale per convincerlo ad aprire un conto.</p>
              </div>
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Brand Bidding</h4>
                <p className="text-xs text-slate-500">Acquistare keyword su Google Ads contenenti il nome protetto della banca (es. "N26 Login").</p>
              </div>
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Promesse Ingannevoli</h4>
                <p className="text-xs text-slate-500">Garantire rendimenti certi o promuovere il trading come metodo per arricchirsi rapidamente.</p>
              </div>
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Furto d'Identità</h4>
                <p className="text-xs text-slate-500">Compilare moduli a nome di terzi o utilizzare bot/script per simulare iscrizioni (Fraud Lead).</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold">4</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tracciamento e Discrepanze</h2>
            </div>
            <p>Il sistema utilizza una tecnologia di tracciamento Server-to-Server (Postback/Webhook). Il Publisher accetta che per il calcolo delle commissioni faranno fede <strong>esclusivamente i dati registrati dal Network</strong> e convalidati in via definitiva dagli istituti finanziari. Eventuali discrepanze nei tracker di terze parti del Publisher non saranno prese in considerazione.</p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">5</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Liquidazione e Diritto di Storno (Chargeback)</h2>
            </div>
            <p className="mb-3">Il Network opera come intermediario di pagamenti. Le seguenti regole sono insindacabili:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>I compensi indicati come "In Valutazione" non sono liquidabili. Diventano esigibili ("Saldo Netto") solo quando l'Advertiser salda materialmente la fattura al Network.</li>
              <li><strong>Clausola di Storno:</strong> Qualora l'Advertiser annulli una conversione (es. cliente non verificato, frode, carta rubata), il Network applicherà un <span className="font-bold text-rose-600">Chargeback automatico</span> decurtando l'importo dal saldo del Publisher.</li>
              <li>I pagamenti avvengono entro 30 giorni dalla ricezione della fattura (o ricevuta di prestazione occasionale) sul circuito SEPA (IBAN).</li>
            </ul>
          </section>

        </main>
      </div>
    </div>
  );
}