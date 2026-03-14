"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Blocco di sicurezza se non accetta i termini
    if (!acceptedTerms) {
      setErrorMessage('Devi accettare i Termini e Condizioni per accedere al Network.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // Generazione del Magic Link direzionato al nostro Gateway di Sicurezza
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      setStatus('success');
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-500/30">
      
      {/* MOTORE CSS E ANIMAZIONI */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmerBtn { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.05); } }
        
        .glass-panel { background: rgba(11, 18, 33, 0.6); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 40px 80px rgba(0,0,0,0.8); border-radius: 2rem; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .input-premium { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 18px 20px; border-radius: 1rem; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.95rem; font-weight: 500; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.7); box-shadow: inset 0 0 0 1px #3B82F6, 0 0 20px rgba(59,130,246,0.15); }
        
        .btn-shimmer { position: relative; overflow: hidden; background-size: 200% auto; transition: all 0.3s ease; background-image: linear-gradient(90deg, rgba(37,99,235,1) 0%, rgba(96,165,250,0.8) 50%, rgba(37,99,235,1) 100%); }
        .btn-shimmer:hover { animation: shimmerBtn 2.5s linear infinite; transform: translateY(-2px); box-shadow: 0 15px 30px -10px rgba(59,130,246,0.8); }
        
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        
        /* Checkbox Custom God-Tier */
        .custom-checkbox { appearance: none; background-color: rgba(0,0,0,0.5); margin: 0; font: inherit; color: currentColor; width: 20px; height: 20px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; }
        .custom-checkbox::before { content: ""; width: 10px; height: 10px; transform: scale(0); transition: 120ms transform ease-in-out; box-shadow: inset 1em 1em white; transform-origin: center; clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
        .custom-checkbox:checked { background-color: #3B82F6; border-color: #3B82F6; box-shadow: 0 0 15px rgba(59,130,246,0.5); }
        .custom-checkbox:checked::before { transform: scale(1); }
      `}} />

      {/* SFONDI E LUCI */}
      <div className="absolute inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" style={{ animation: 'pulseGlow 8s infinite' }}></div>

      {/* TASTO BACK */}
      <Link href="/" className="absolute top-8 left-8 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="text-sm">←</span> Ritorna
      </Link>

      <div className="w-full max-w-md z-10">
        
        {/* LOGO */}
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center font-black text-white text-3xl shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-white/10">
            F
          </div>
        </div>

        <div className="glass-panel p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 text-center">Candidatura B2B</h2>
          <p className="text-sm text-slate-400 text-center font-medium mb-10">Inserisci un indirizzo email aziendale o primario. Riceverai un link crittografato per l'accesso.</p>

          {/* STATO SUCCESSO */}
          {status === 'success' ? (
            <div className="text-center animate-[fadeUp_0.5s_ease-out_forwards]">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                ✓
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Terminale Autorizzato</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                Abbiamo inviato un pacchetto di accesso sicuro a <strong className="text-white">{email}</strong>.<br/>Controlla la tua casella di posta (anche nello spam) e clicca sul pulsante per entrare nel network.
              </p>
              <button onClick={() => setStatus('idle')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors underline underline-offset-4">
                Usa un'altra email
              </button>
            </div>
          ) : (
            /* FORM DI REGISTRAZIONE */
            <form onSubmit={handleSignUp} className="space-y-6">
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Email Operativa</label>
                <input 
                  type="email" 
                  required
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="input-premium font-mono text-blue-200" 
                  placeholder="nome@azienda.com" 
                  disabled={status === 'loading'}
                />
              </div>

              {/* CHECKBOX TERMINI E CONDIZIONI (COLLEGATO ALLA PAGINA /terms) */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-black/30 border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => setAcceptedTerms(!acceptedTerms)}>
                <div className="pt-0.5">
                  <input 
                    type="checkbox" 
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="custom-checkbox"
                    onClick={(e) => e.stopPropagation()} // Previene il doppio click
                  />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed select-none">
                  Dichiaro di aver letto e compreso i <Link href="/terms" onClick={(e) => e.stopPropagation()} className="text-blue-400 font-bold hover:text-blue-300 underline underline-offset-2 transition-colors">Termini e Condizioni</Link> e la Policy per l'acquisizione di traffico finanziario.
                </p>
              </div>

              {/* ERRORE ANIMATO */}
              {status === 'error' && (
                <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_forwards]">
                  <span className="text-rose-500 text-xl">⚠️</span>
                  <p className="text-[11px] font-bold text-rose-200/80">{errorMessage}</p>
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={status === 'loading'} 
                  className="w-full btn-shimmer text-white font-black text-[12px] px-8 py-5 rounded-2xl active:scale-95 uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {status === 'loading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Generazione Chiave...
                    </>
                  ) : 'Richiedi Accesso Secure'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Hai già un account approvato? <Link href="/login" className="text-blue-500 hover:text-blue-400 ml-1 transition-colors">Esegui il Login</Link>
        </p>

      </div>
    </div>
  );
}