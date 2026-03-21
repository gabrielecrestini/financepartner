"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  // Stati di Base
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Stati di Business B2B
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState('');
  const [wantsHub, setWantsHub] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Stati UI
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Controlli di sicurezza lato Client
    if (!acceptedTerms) {
      setErrorMessage('Devi accettare i Termini e Condizioni per accedere al Network.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La password di sicurezza deve avere almeno 6 caratteri.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // 1. Creazione dell'Utente (Auth)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setErrorMessage(authError.message);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }

    // 2. Salvataggio Dati Business nel Profilo (se l'utente è stato creato)
    if (authData?.user) {
      // Costruiamo il briefing per l'Admin
      let cleanUrl = url.trim();
      if (cleanUrl && !cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
      const adminBriefing = `CANDIDATURA:\nSorgente: ${cleanUrl}\nStrategia: ${strategy}\nRichiesta Hub Gestito IT: ${wantsHub ? 'SÌ' : 'NO'}`;

      // Diamo un secondo di tempo a Supabase per creare la riga base del profilo tramite il suo trigger interno, poi la aggiorniamo.
      setTimeout(async () => {
        await supabase.from('profiles').update({
          registered_website: cleanUrl,
          traffic_volume: strategy,
          traffic_notes: adminBriefing,
          traffic_status: 'pending' // Lo mette direttamente in Sala d'Attesa!
        }).eq('id', authData.user.id);
      }, 1000);
    }

    // 3. Reindirizzamento Immediato
    // Dato che le email di conferma sono disabilitate, lo portiamo dentro. 
    // Il Gatekeeper della Dashboard vedrà il "pending" e gli mostrerà la Sala d'Attesa.
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden selection:bg-blue-500/30">
      
      {/* MOTORE CSS E ANIMAZIONI */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .glass-panel { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 40px 80px rgba(0,0,0,0.8); border-radius: 2rem; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .input-premium { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 18px 22px; border-radius: 1rem; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.95rem; font-weight: 500; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.7); box-shadow: inset 0 0 0 1px #3B82F6, 0 0 20px rgba(59,130,246,0.15); }
        .custom-checkbox { appearance: none; background-color: rgba(0,0,0,0.5); margin: 0; font: inherit; color: currentColor; width: 22px; height: 22px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; shrink-0; }
        .custom-checkbox::before { content: ""; width: 12px; height: 12px; transform: scale(0); transition: 120ms transform ease-in-out; box-shadow: inset 1em 1em white; transform-origin: center; clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
        .custom-checkbox:checked { background-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 15px rgba(59,130,246,0.5); }
        .custom-checkbox:checked::before { transform: scale(1); }
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      {/* SFONDI E LUCI */}
      <div className="absolute inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* TASTO BACK */}
      <Link href="/" className="absolute top-6 left-6 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="text-sm">←</span> Ritorna
      </Link>

      {/* CONTENITORE PRINCIPALE (Allargato per ospitare i campi) */}
      <div className="w-full max-w-2xl z-10 pt-16 pb-8">
        
        {/* LOGO */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center font-black text-white text-3xl shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-white/10">F</div>
        </div>

        <div className="glass-panel p-6 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 text-center">Candidatura B2B</h2>
          <p className="text-sm text-slate-400 text-center font-medium mb-10">L'accesso al network richiede l'approvazione del canale di traffico.</p>

          <form onSubmit={handleSignUp} className="space-y-6">
            
            {/* SEZIONE 1: CREEDENZIALI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="sm:col-span-2">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">1. Credenziali di Accesso</h3>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Operativa</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium font-mono text-blue-200" placeholder="nome@azienda.com" disabled={status === 'loading'} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password Sicura</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium font-mono text-blue-200 tracking-widest" placeholder="Min. 6 caratteri" disabled={status === 'loading'} />
              </div>
            </div>

            {/* SEZIONE 2: BUSINESS E TRAFFICO */}
            <div className="grid grid-cols-1 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">2. Modello di Acquisizione</h3>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sorgente di Traffico (URL o Social Profilo)</label>
                <input type="text" required value={url} onChange={(e) => setUrl(e.target.value)} className="input-premium font-mono text-blue-200" placeholder="Es. https://tiktok.com/@tuoprofilo" disabled={status === 'loading'} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrivi la tua Strategia e i Volumi (KPI)</label>
                <textarea required rows="3" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="input-premium resize-none hide-scrollbar text-sm" placeholder="Es. Porto traffico organico su TikTok parlando di risparmio e converto tramite il link in bio..." disabled={status === 'loading'}></textarea>
              </div>
              
              {/* TOGGLE HUB GESTITO */}
              <div className="flex items-center justify-between p-5 rounded-xl bg-indigo-900/10 border border-indigo-500/20 cursor-pointer hover:bg-indigo-900/20 transition-colors" onClick={() => setWantsHub(!wantsHub)}>
                <div>
                  <h4 className="text-sm font-black text-indigo-300 mb-1">Richiedi Hub Operativo (Incluso)</h4>
                  <p className="text-[11px] text-indigo-200/60 leading-relaxed max-w-sm">Seleziona questa casella se desideri che il nostro IT ti sviluppi un sito/landing page di comparazione ad alta conversione.</p>
                </div>
                <div className="pt-1">
                  <input type="checkbox" checked={wantsHub} onChange={(e) => setWantsHub(e.target.checked)} className="custom-checkbox border-indigo-500/50" onClick={(e) => e.stopPropagation()} />
                </div>
              </div>
            </div>

            {/* SEZIONE 3: POLICY */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:border-white/10 transition-colors" onClick={() => setAcceptedTerms(!acceptedTerms)}>
              <div className="pt-0.5">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="custom-checkbox" onClick={(e) => e.stopPropagation()} />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed select-none font-medium">
                Confermo l'esattezza dei dati inseriti e accetto i <Link href="/terms" onClick={(e) => e.stopPropagation()} className="text-blue-400 font-bold hover:text-blue-300 underline underline-offset-2 transition-colors">Termini e Condizioni</Link>. Sono consapevole che traffico fraudolento o incentivato comporterà il blocco immediato.
              </p>
            </div>

            {/* ERRORI */}
            {status === 'error' && (
              <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_forwards]">
                <span className="text-rose-500 text-xl">⚠️</span>
                <p className="text-[11px] font-bold text-rose-200/80">{errorMessage}</p>
              </div>
            )}

            {/* SUBMIT */}
            <div className="pt-2">
              <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[13px] px-8 py-5 rounded-2xl active:scale-95 uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(37,99,235,0.3)]">
                {status === 'loading' ? 'Trasmissione Dati...' : 'Sottoponi Candidatura'}
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