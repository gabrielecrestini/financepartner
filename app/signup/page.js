"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Form State Avanzato
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    taxId: '', // Codice Fiscale
    hasVat: false,
    vatNumber: '',
    paymentInfo: '', // IBAN
    needsWebsite: true, // Vuole il sito da noi?
    existingWebsite: '', // Se ha già un sito
    adSpend: '', // Budget Ads
    expectedTraffic: '' // Traffico Stimato
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Registrazione su Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Formattazione Dati per il Profilo
      if (authData.user) {
        const entityType = formData.hasVat ? 'azienda' : 'privato';
        const formattedIban = formData.paymentInfo.replace(/\s+/g, '').toUpperCase();
        const registeredWeb = formData.needsWebsite ? 'Richiesto Hub IT PartnerVest' : formData.existingWebsite;
        
        // Assembliamo un briefing pulito per te (Admin)
        const trafficBriefing = `BUDGET ADS MENSILE: ${formData.adSpend} | TRAFFICO STIMATO: ${formData.expectedTraffic} | SITO: ${formData.needsWebsite ? 'Richiede Sviluppo Hub' : 'Sito Proprietario'}`;

        const profileData = {
          full_name: formData.fullName,
          tax_id: formData.taxId.toUpperCase(),
          entity_type: entityType,
          vat_number: formData.hasVat ? formData.vatNumber : '',
          payment_info: formattedIban, // IBAN salvato
          registered_website: registeredWeb, // Sito salvato
          traffic_volume: formData.expectedTraffic, // Traffico salvato
          traffic_status: 'pending', // Stato in attesa
          traffic_notes: trafficBriefing // Note strategiche per admin
        };

        // Aggiorniamo il profilo generato dal trigger o lo inseriamo
        const { error: profileError } = await supabase.from('profiles').update(profileData).eq('id', authData.user.id);

        if (profileError) {
          await supabase.from('profiles').insert({ id: authData.user.id, ...profileData });
        }

        setSuccessMsg(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (error) {
      setErrorMsg(error.message || 'Errore durante la registrazione. Controlla i dati e riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <div className="bg-[#0B1221] border border-blue-500/30 p-10 rounded-[2rem] max-w-md w-full text-center shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-[slideUpFade_0.5s_ease-out_forwards]">
          <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
          <h2 className="text-2xl font-black text-white mb-2">Audit Inviato.</h2>
          <p className="text-slate-400 text-sm mb-6">I tuoi dati sono stati crittografati e inviati al team Compliance. Reindirizzamento al Terminale...</p>
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#000000] text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col lg:flex-row w-full">
      
      {/* STILI E ANIMAZIONI */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #000000; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        @keyframes slideRight { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideLeft { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        
        .animate-slide-right { animation: slideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-left { animation: slideLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Input Premium */
        .input-premium { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); padding: 1.2rem 1rem; border-radius: 0.75rem; color: white; width: 100%; transition: all 0.3s ease; outline: none; font-size: 0.875rem; }
        .input-premium:focus { border-color: rgba(59,130,246,0.6); box-shadow: 0 0 20px rgba(59,130,246,0.15); background: rgba(0,0,0,0.6); }
        .input-premium::placeholder { color: rgba(255,255,255,0.3); }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />

      {/* PANNELLO SINISTRO (Info Contrattuali e Value Prop) */}
      <div className="w-full lg:w-5/12 p-6 sm:p-12 lg:p-16 flex flex-col justify-center relative border-b lg:border-b-0 lg:border-r border-white/5 bg-[#02040A] z-10 animate-slide-right min-h-[40vh] lg:min-h-screen lg:fixed lg:left-0 lg:top-0 lg:bottom-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>
        
        <Link href="/" className="inline-flex items-center gap-3 mb-10 group w-fit relative z-10">
          <div className="w-8 h-8 bg-white/5 border border-white/10 rounded flex items-center justify-center font-black text-white text-xs group-hover:bg-blue-600 transition-colors">←</div>
          <span className="font-black text-white tracking-widest text-[10px] uppercase">Torna alla Home</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span> Onboarding B2B
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-6 leading-tight">
            Compliance e <br />Trasparenza Fiscale.
          </h1>
          <p className="text-sm text-slate-400 mb-10 leading-relaxed">
            PartnerVest opera nel rigoroso rispetto delle normative. Scegli l'inquadramento adatto a te: i tuoi dati bancari saranno criptati e pronti per l'erogazione delle commissioni S2S.
          </p>

          <div className="space-y-4">
            {/* Contratto Occasionale */}
            <div className="bg-black/50 border border-white/5 p-5 sm:p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-lg shrink-0">📄</div>
                <div>
                  <h3 className="font-black text-white mb-1 tracking-tight">Privati (Senza P.IVA)</h3>
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Prestazione Occasionale</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Gestiamo noi la burocrazia applicando la <strong>ritenuta d'acconto del 20%</strong> sui compensi (max 5.000€ netti annui). Le tasse vengono versate automaticamente per te allo Stato.
                  </p>
                </div>
              </div>
            </div>

            {/* Contratto Aziendale */}
            <div className="bg-blue-950/10 border border-blue-500/20 p-5 sm:p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-lg shrink-0">🏢</div>
                <div>
                  <h3 className="font-black text-white mb-1 tracking-tight">Aziende (Con P.IVA)</h3>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Nessun Limite</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Accredito rapido del 100% del Payout tramite Bonifico SEPA a fronte della tua emissione di fattura elettronica. Il setup per chi vuole scalare i volumi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANNELLO DESTRO (Form di Registrazione) */}
      <div className="w-full lg:w-7/12 p-4 sm:p-8 lg:p-12 xl:p-16 flex flex-col justify-start lg:ml-[41.666667%] relative min-h-screen animate-slide-left">
        <div className="absolute inset-0 bg-grid-fine opacity-30 pointer-events-none" style={{ maskImage: 'radial-gradient(circle_at_center, black 0%, transparent 80%)', WebkitMaskImage: 'radial-gradient(circle_at_center, black 0%, transparent 80%)' }}></div>
        
        <div className="w-full max-w-[500px] mx-auto relative z-10 my-auto py-10">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Application Form</h2>
            <p className="text-sm text-slate-400">Inserisci i dati con precisione per l'audit tecnico e fiscale.</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs p-4 rounded-xl mb-6 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            
            {/* 1. Credenziali di Accesso */}
            <div className="space-y-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-lg">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-3">1. Credenziali Terminale</h4>
              <div className="grid grid-cols-1 gap-4">
                <input type="email" required placeholder="Email Operativa" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input-premium" />
                <input type="password" required placeholder="Password Criptata (min. 6 car.)" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="input-premium" minLength={6} />
              </div>
            </div>

            {/* 2. Dati KYC e Bancari */}
            <div className="space-y-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-lg">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-3">2. KYC & Erogazione Pagamenti</h4>
              <div className="grid grid-cols-1 gap-4">
                <input type="text" required placeholder="Nome e Cognome (Intestatario Conti)" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="input-premium" />
                <input type="text" required placeholder="Codice Fiscale (Obbligatorio)" value={formData.taxId} onChange={(e) => setFormData({...formData, taxId: e.target.value.toUpperCase()})} className="input-premium uppercase font-mono" maxLength={16} />
                
                {/* IBAN Evidenziato */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="text-emerald-500 text-lg">🏦</span>
                  </div>
                  <input type="text" required placeholder="IBAN per accredito SEPA (es. IT00...)" value={formData.paymentInfo} onChange={(e) => setFormData({...formData, paymentInfo: e.target.value.toUpperCase()})} className="input-premium pl-12 uppercase font-mono border-emerald-500/30 focus:border-emerald-500/60 bg-emerald-950/10" />
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Possiedi una Partita IVA?</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setFormData({...formData, hasVat: false, vatNumber: ''})} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.hasVat ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-black border border-white/10 text-slate-500'}`}>
                    No (Occasionale)
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, hasVat: true})} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.hasVat ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-black border border-white/10 text-slate-500'}`}>
                    Sì (Azienda/Prof.)
                  </button>
                </div>
              </div>

              {formData.hasVat && (
                <div className="animate-[slideRight_0.2s_ease-out_forwards]">
                  <input type="text" required placeholder="Inserisci Partita IVA" value={formData.vatNumber} onChange={(e) => setFormData({...formData, vatNumber: e.target.value})} className="input-premium font-mono" />
                </div>
              )}
            </div>

            {/* 3. Set-Up Traffico (Hub IT e Strategia) */}
            <div className="space-y-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-lg">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-3">3. Infrastruttura e Traffico</h4>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Infrastruttura di Atterraggio</label>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <button type="button" onClick={() => setFormData({...formData, needsWebsite: true, existingWebsite: ''})} className={`flex-1 py-3.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all leading-tight ${formData.needsWebsite ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-black border border-white/10 text-slate-500'}`}>
                    Voglio un HUB generato da voi
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, needsWebsite: false})} className={`flex-1 py-3.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all leading-tight ${!formData.needsWebsite ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-black border border-white/10 text-slate-500'}`}>
                    Uso un mio sito / landing
                  </button>
                </div>
              </div>

              {!formData.needsWebsite && (
                <div className="animate-[slideRight_0.2s_ease-out_forwards]">
                  <input type="url" required placeholder="Inserisci l'URL del tuo sito (es. https://...)" value={formData.existingWebsite} onChange={(e) => setFormData({...formData, existingWebsite: e.target.value})} className="input-premium mb-4" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" required placeholder="Budget Ads Mensile (es. €1.000)" value={formData.adSpend} onChange={(e) => setFormData({...formData, adSpend: e.target.value})} className="input-premium" />
                <input type="text" required placeholder="Traffico/Click Stimato Mensile" value={formData.expectedTraffic} onChange={(e) => setFormData({...formData, expectedTraffic: e.target.value})} className="input-premium" />
              </div>

            </div>

            {/* Pulsante Invia */}
            <div className="pt-6">
              <button type="submit" disabled={loading} className="w-full bg-white text-black font-black text-[13px] py-5 rounded-xl uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50 flex justify-center items-center gap-2">
                {loading ? <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : 'Sottoponi Candidatura'}
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-500 mt-6 max-w-sm mx-auto leading-relaxed">
              Cliccando su "Sottoponi Candidatura" accetti implicitamente i nostri <Link href="/terms" className="text-blue-400 hover:underline">Termini di Servizio B2B</Link> e autorizzi il trattamento dei dati secondo la <Link href="/terms" className="text-blue-400 hover:underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </div>

    </main>
  );
}