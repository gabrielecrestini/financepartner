"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  // 1. Credenziali
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2. Dati Fiscali / KYC
  const [entityType, setEntityType] = useState('privato');
  const [fullName, setFullName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');

  // 3. Traffico e Infrastruttura
  const [hasWebsite, setHasWebsite] = useState(true);
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState('');
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setErrorMessage('Devi accettare i Termini e Condizioni per accedere al Network.');
      setStatus('error'); setTimeout(() => setStatus('idle'), 4000); return;
    }

    if (password.length < 6) {
      setErrorMessage('La password deve avere almeno 6 caratteri.');
      setStatus('error'); setTimeout(() => setStatus('idle'), 4000); return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        setErrorMessage(`ERRORE AUTH: ${authError.message}`);
        setStatus('error'); setTimeout(() => setStatus('idle'), 8000); return; 
      }

      if (authData?.user) {
        let cleanUrl = url.trim();
        if (cleanUrl && !cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
        
        // Costruiamo il briefing per l'Admin
        const adminBriefing = `CANDIDATURA NUOVA:\nModello: ${hasWebsite ? 'Sito Proprietario' : 'Richiesta Hub Gestito'}\nSorgente: ${hasWebsite ? cleanUrl : 'Da definire tramite Hub'}\nStrategia Operativa: ${strategy}`;

        // Salviamo tutto: Credenziali, KYC e Traffico in un colpo solo
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: email,
          // Dati KYC
          entity_type: entityType,
          full_name: fullName,
          tax_id: taxId.toUpperCase(),
          vat_number: entityType === 'azienda' ? vatNumber : null,
          address: address,
          kyc_status: 'pending', // Mette subito il KYC in attesa di tua approvazione
          // Dati Traffico
          registered_website: hasWebsite ? cleanUrl : 'Richiesta Hub',
          traffic_volume: strategy,
          traffic_notes: adminBriefing,
          traffic_status: 'pending' // Mette subito il traffico in attesa
        });

        if (profileError) {
          setErrorMessage(`ERRORE DATABASE: ${profileError.message}`);
          setStatus('error'); setTimeout(() => setStatus('idle'), 10000); return; 
        }
      }
      
      // Entrata istantanea nella Sala d'Attesa della Dashboard
      router.push('/dashboard');
      
    } catch (err) {
      setErrorMessage(`ERRORE DI RETE: ${err.message}`);
      setStatus('error'); setTimeout(() => setStatus('idle'), 8000); 
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .glass-panel { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 40px 80px rgba(0,0,0,0.8); border-radius: 2rem; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .input-premium { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 16px 20px; border-radius: 1rem; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.9rem; font-weight: 500; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.7); box-shadow: inset 0 0 0 1px #3B82F6, 0 0 20px rgba(59,130,246,0.15); }
        .custom-checkbox { appearance: none; background-color: rgba(0,0,0,0.5); margin: 0; font: inherit; color: currentColor; width: 22px; height: 22px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; }
        .custom-checkbox::before { content: ""; width: 12px; height: 12px; transform: scale(0); transition: 120ms transform ease-in-out; box-shadow: inset 1em 1em white; transform-origin: center; clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
        .custom-checkbox:checked { background-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 15px rgba(59,130,246,0.5); }
        .custom-checkbox:checked::before { transform: scale(1); }
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        .tab-button { flex: 1; padding: 12px; text-align: center; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border-radius: 12px; transition: all 0.3s ease; border: 1px solid transparent; }
        .tab-button.active { background: white; color: black; box-shadow: 0 4px 15px rgba(255,255,255,0.2); }
        .tab-button:not(.active) { color: #64748b; background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.05); }
      `}} />

      <div className="absolute inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <Link href="/" className="absolute top-6 left-6 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="text-sm">←</span> Ritorna
      </Link>

      <div className="w-full max-w-3xl z-10 pt-16 pb-8">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center font-black text-white text-3xl shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-white/10">F</div>
        </div>

        <div className="glass-panel p-6 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 text-center">Onboarding Affiliato</h2>
          <p className="text-sm text-slate-400 text-center font-medium mb-10">Completa il profilo fiscale e operativo per accedere al network B2B.</p>

          <form onSubmit={handleSignUp} className="space-y-8">
            
            {/* SEZIONE 1: CREDENZIALI */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
              <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest border-b border-white/5 pb-3">1. Credenziali di Accesso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Operativa</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium font-mono text-blue-200" placeholder="nome@azienda.com" disabled={status === 'loading'} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password Sicura</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium font-mono text-blue-200 tracking-widest" placeholder="Min. 6 caratteri" disabled={status === 'loading'} />
                </div>
              </div>
            </div>

            {/* SEZIONE 2: DATI FISCALI KYC */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">2. Profilo Fiscale (KYC)</h3>
                <div className="flex p-1 bg-black/40 rounded-xl w-max border border-white/5">
                  <button type="button" onClick={() => setEntityType('privato')} className={`px-6 py-2 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all ${entityType === 'privato' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>Privato</button>
                  <button type="button" onClick={() => setEntityType('azienda')} className={`px-6 py-2 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all ${entityType === 'azienda' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>P.IVA</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Intestatario / Ragione Sociale</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-premium" disabled={status === 'loading'} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Codice Fiscale</label>
                  <input type="text" required value={taxId} onChange={(e) => setTaxId(e.target.value)} className="input-premium uppercase font-mono" disabled={status === 'loading'} />
                </div>
                {entityType === 'azienda' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Partita IVA</label>
                    <input type="text" required value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className="input-premium font-mono" disabled={status === 'loading'} />
                  </div>
                )}
                <div className={entityType === 'privato' ? "sm:col-span-2" : "sm:col-span-2"}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Indirizzo di Residenza / Sede Legale</label>
                  <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="input-premium" disabled={status === 'loading'} placeholder="Via, Numero, CAP, Città" />
                </div>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-2">I dati sono crittografati e necessari esclusivamente per l'emissione dei bonifici SEPA a norma di legge.</p>
            </div>

            {/* SEZIONE 3: INFRASTRUTTURA */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
              <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest border-b border-white/5 pb-3">3. Infrastruttura di Rete</h3>
              
              <div className="flex p-1 bg-black/40 rounded-[14px] border border-white/5">
                <button type="button" onClick={() => setHasWebsite(true)} className={`tab-button ${hasWebsite ? 'active' : ''}`}>Ho un Sito / Profilo Social</button>
                <button type="button" onClick={() => setHasWebsite(false)} className={`tab-button ${!hasWebsite ? 'active' : ''}`}>Non ho un sito (Richiedi Hub)</button>
              </div>

              {hasWebsite ? (
                <div className="animate-[fadeUp_0.3s_ease-out_forwards]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">URL del tuo Sito o Profilo</label>
                  <input type="text" required value={url} onChange={(e) => setUrl(e.target.value)} className="input-premium font-mono text-blue-200 mb-5" placeholder="Es. https://tiktok.com/@tuoprofilo" disabled={status === 'loading'} />
                  
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Strategia Operativa</label>
                  <textarea required rows="3" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="input-premium resize-none hide-scrollbar text-sm" placeholder="Descrivi il tuo traffico e come promuoverai i link..." disabled={status === 'loading'}></textarea>
                </div>
              ) : (
                <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-xl animate-[fadeUp_0.3s_ease-out_forwards]">
                  <h4 className="text-sm font-black text-indigo-300 mb-3 flex items-center gap-2"><span>🖥️</span> Creeremo noi l'Hub per te.</h4>
                  <p className="text-xs text-indigo-200/80 leading-relaxed mb-6">Il network fornisce gratuitamente lo sviluppo di una Landing Page (Hub di comparazione) ottimizzata per le conversioni bancarie.</p>
                  
                  <div className="space-y-3 mb-6 bg-black/40 p-4 rounded-lg border border-white/5">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Istruzioni Post-Registrazione:</p>
                    <p className="text-xs text-slate-300"><span className="text-blue-400 font-bold mr-2">1.</span> Completa questa iscrizione e attendi l'approvazione.</p>
                    <p className="text-xs text-slate-300"><span className="text-blue-400 font-bold mr-2">2.</span> Accedi al <strong>Marketplace</strong> nella Dashboard per vedere le offerte.</p>
                    <p className="text-xs text-slate-300"><span className="text-blue-400 font-bold mr-2">3.</span> Vai in <strong>Infrastruttura</strong> e invia la richiesta ufficiale indicando quali banche vuoi inserire nell'Hub.</p>
                  </div>

                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Inizia a descrivere la tua strategia di traffico:</label>
                  <textarea required rows="2" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="input-premium resize-none hide-scrollbar text-sm bg-black/50 border-indigo-500/30 focus:border-indigo-500" placeholder="Es. Farò Ads su Meta / Porterò traffico organico da TikTok..." disabled={status === 'loading'}></textarea>
                </div>
              )}
            </div>

            {/* POLICY */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-white/10 transition-colors" onClick={() => setAcceptedTerms(!acceptedTerms)}>
              <div className="pt-0.5"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="custom-checkbox" onClick={(e) => e.stopPropagation()} /></div>
              <p className="text-[11px] text-slate-400 leading-relaxed select-none font-medium">Confermo la veridicità dei dati fiscali inseriti e accetto i <Link href="/terms" onClick={(e) => e.stopPropagation()} className="text-blue-400 font-bold hover:text-blue-300 underline underline-offset-2">Termini e Condizioni</Link>. Sono consapevole che il traffico fraudolento comporta l'espulsione dal network.</p>
            </div>

            {status === 'error' && (<div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3"><span className="text-rose-500 text-xl">⚠️</span><p className="text-[11px] font-bold text-rose-200/80">{errorMessage}</p></div>)}

            <div className="pt-2">
              <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[13px] px-8 py-5 rounded-2xl active:scale-95 uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(37,99,235,0.3)]">
                {status === 'loading' ? 'Cifratura Dati in Corso...' : 'Sottoponi Candidatura'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center mt-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Sei già un nostro partner? <Link href="/login" className="text-white hover:text-blue-400 ml-1 transition-colors underline underline-offset-4">Esegui il Login</Link>
        </p>
      </div>
    </div>
  );
}