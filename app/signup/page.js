"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Stato Form Completo
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    entity_type: 'privato', full_name: '', tax_id: '', vat_number: '', iban: '',
    traffic_type: '', needs_hub: 'no', traffic_volume: '', accepted_terms: false
  });

  const handleNextStep = () => {
    if (step === 1 && form.password !== form.confirmPassword) {
      setErrorMessage('Le password non coincidono.');
      setStatus('error'); setTimeout(() => setStatus('idle'), 3000); return;
    }
    if (step === 1 && form.password.length < 6) {
      setErrorMessage('La password deve avere almeno 6 caratteri.');
      setStatus('error'); setTimeout(() => setStatus('idle'), 3000); return;
    }
    setStep(step + 1);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!form.accepted_terms) {
      setErrorMessage('Devi accettare i Termini e Condizioni e la Policy di Acquisizione.');
      setStatus('error'); setTimeout(() => setStatus('idle'), 4000); return;
    }

    setStatus('loading');
    setErrorMessage('');

    // 1. Creazione Account in Supabase (Manderà l'email di conferma in automatico)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      // 2. Salviamo i dati della candidatura in locale. 
      // Verranno iniettati nel database al primo login effettivo dell'utente.
      const applicationData = {
        full_name: form.full_name,
        entity_type: form.entity_type,
        tax_id: form.tax_id.toUpperCase(),
        vat_number: form.vat_number,
        payment_info: form.iban.replace(/\s+/g, '').toUpperCase(),
        traffic_status: 'pending', // FONDAMENTALE: Li blocca nella sala d'attesa
        traffic_volume: form.traffic_volume,
        registered_website: form.traffic_type,
        traffic_notes: `Richiesta HUB: ${form.needs_hub.toUpperCase()} | Sorgente: ${form.traffic_type}`
      };
      
      localStorage.setItem('fp_pending_application', JSON.stringify(applicationData));
      setStatus('success');
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .glass-panel { background: rgba(11, 18, 33, 0.6); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 40px 80px rgba(0,0,0,0.8); border-radius: 2rem; animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .input-premium { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 16px 20px; border-radius: 1rem; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.9rem; font-weight: 500; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.7); box-shadow: inset 0 0 0 1px #3B82F6; }
        .btn-shimmer { position: relative; overflow: hidden; background-image: linear-gradient(90deg, rgba(37,99,235,1) 0%, rgba(96,165,250,0.8) 50%, rgba(37,99,235,1) 100%); background-size: 200% auto; transition: all 0.3s ease; }
        .btn-shimmer:hover { background-position: right center; box-shadow: 0 10px 30px -10px rgba(59,130,246,0.8); transform: translateY(-2px); }
        .custom-checkbox { appearance: none; background-color: rgba(0,0,0,0.5); width: 20px; height: 20px; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; }
        .custom-checkbox::before { content: ""; width: 10px; height: 10px; transform: scale(0); transition: 120ms transform ease-in-out; box-shadow: inset 1em 1em white; transform-origin: center; clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
        .custom-checkbox:checked { background-color: #3B82F6; border-color: #3B82F6; }
        .custom-checkbox:checked::before { transform: scale(1); }
      `}} />

      <div className="absolute inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50 pointer-events-none"></div>

      <Link href="/" className="absolute top-8 left-8 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="text-sm">←</span> Ritorna
      </Link>

      <div className="w-full max-w-2xl z-10 pt-16 pb-10">
        
        <div className="glass-panel p-8 sm:p-14 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400"></div>
          
          <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Candidatura B2B</h2>
              <p className="text-sm text-slate-400 font-medium">Fase {step} di 3: {step === 1 ? 'Credenziali' : step === 2 ? 'Profilo Fiscale' : 'Strategia'}</p>
            </div>
            {status !== 'success' && (
              <div className="flex gap-2">
                <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-white/10'}`}></div>
                <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-white/10'}`}></div>
                <div className={`w-3 h-3 rounded-full transition-colors ${step >= 3 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-white/10'}`}></div>
              </div>
            )}
          </div>

          {status === 'success' ? (
            <div className="text-center animate-[fadeUp_0.5s_ease-out_forwards] py-10">
              <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">✓</div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Identità da Confermare</h3>
              <p className="text-base text-slate-400 leading-relaxed mb-10 max-w-lg mx-auto">
                La tua candidatura è stata registrata in locale. Abbiamo inviato un'email a <strong className="text-white">{form.email}</strong>. <br/><br/>
                Clicca sul link di conferma nell'email, effettua il primo login e il tuo profilo entrerà automaticamente nella Sala d'Attesa in attesa di approvazione manuale dell'Admin.
              </p>
              <Link href="/login" className="btn-shimmer text-white font-black text-[12px] px-10 py-5 rounded-2xl uppercase tracking-widest inline-block shadow-lg">
                Vai al Login
              </Link>
            </div>
          ) : (
            <form onSubmit={step === 3 ? handleSignUp : (e) => { e.preventDefault(); handleNextStep(); }} className="space-y-6">
              
              {/* STEP 1: CREDENZIALI */}
              {step === 1 && (
                <div className="space-y-5 animate-[fadeUp_0.3s_ease-out_forwards]">
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Operativa</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-premium font-mono text-blue-200" placeholder="nome@azienda.com" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                    <input type="password" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-premium font-mono" placeholder="Min. 6 caratteri" /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Conferma Password</label>
                    <input type="password" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="input-premium font-mono" placeholder="••••••" /></div>
                  </div>
                </div>
              )}

              {/* STEP 2: DATI FISCALI (KYC BASE) */}
              {step === 2 && (
                <div className="space-y-5 animate-[fadeUp_0.3s_ease-out_forwards]">
                  <div className="flex p-1 bg-black/40 rounded-xl w-max border border-white/5 shadow-inner mb-4">
                    <button type="button" onClick={() => setForm({...form, entity_type: 'privato'})} className={`px-8 py-3 text-[10px] font-black rounded-lg transition-colors uppercase tracking-widest ${form.entity_type === 'privato' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Privato</button>
                    <button type="button" onClick={() => setForm({...form, entity_type: 'azienda'})} className={`px-8 py-3 text-[10px] font-black rounded-lg transition-colors uppercase tracking-widest ${form.entity_type === 'azienda' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Azienda / P.IVA</button>
                  </div>
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Intestatario / Ragione Sociale</label>
                  <input type="text" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="input-premium" placeholder="Nome Completo" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Codice Fiscale</label>
                    <input type="text" required value={form.tax_id} onChange={e => setForm({...form, tax_id: e.target.value})} className="input-premium uppercase font-mono" placeholder="RSSMRA..." /></div>
                    {form.entity_type === 'azienda' && (
                      <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Partita IVA</label>
                      <input type="text" required value={form.vat_number} onChange={e => setForm({...form, vat_number: e.target.value})} className="input-premium font-mono" placeholder="IT0123..." /></div>
                    )}
                  </div>
                  <div><label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">IBAN Erogazione Pagamenti</label>
                  <input type="text" required value={form.iban} onChange={e => setForm({...form, iban: e.target.value})} className="input-premium font-mono text-emerald-400 bg-emerald-900/10 border-emerald-500/30" placeholder="IT00X000..." /></div>
                </div>
              )}

              {/* STEP 3: STRATEGIA E ASSET */}
              {step === 3 && (
                <div className="space-y-5 animate-[fadeUp_0.3s_ease-out_forwards]">
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sorgente di Traffico Principale</label>
                  <input type="text" required value={form.traffic_type} onChange={e => setForm({...form, traffic_type: e.target.value})} className="input-premium" placeholder="Es. Meta Ads, SEO, TikTok Bio..." /></div>
                  
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Budget o Volumi Stimati Mensili</label>
                  <input type="text" required value={form.traffic_volume} onChange={e => setForm({...form, traffic_volume: e.target.value})} className="input-premium" placeholder="Es. 1000€/mese o 50k Visitatori" /></div>

                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Necessiti di un Hub di Acquisizione Gratuito?</label>
                  <select value={form.needs_hub} onChange={e => setForm({...form, needs_hub: e.target.value})} className="input-premium appearance-none">
                    <option value="no">No, userò i Link S2S diretti nelle mie campagne</option>
                    <option value="si">Sì, ho bisogno che l'IT mi costruisca una Landing Page</option>
                  </select></div>

                  <div className="flex items-start gap-4 p-5 rounded-xl bg-black/30 border border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer mt-6" onClick={() => setForm({...form, accepted_terms: !form.accepted_terms})}>
                    <div className="pt-0.5"><input type="checkbox" checked={form.accepted_terms} readOnly className="custom-checkbox" /></div>
                    <p className="text-xs text-slate-400 leading-relaxed select-none">
                      Confermo la correttezza dei dati. Dichiaro di aver letto e compreso i <Link href="/terms" onClick={e=>e.stopPropagation()} className="text-emerald-400 font-bold hover:underline">Termini e Condizioni</Link> del Private Network.
                    </p>
                  </div>
                </div>
              )}

              {/* MESSAGGI ERRORE */}
              {status === 'error' && (
                <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_forwards]">
                  <span className="text-rose-500 text-xl">⚠️</span><p className="text-[11px] font-bold text-rose-200/80 leading-relaxed">{errorMessage}</p>
                </div>
              )}

              {/* PULSANTI NAVIGAZIONE */}
              <div className="flex gap-4 pt-6 border-t border-white/5">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="flex-1 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white/5 py-5 rounded-2xl hover:bg-white/10 transition-colors">Indietro</button>
                )}
                <button type="submit" disabled={status === 'loading'} className="flex-[2] btn-shimmer text-white font-black text-[12px] px-8 py-5 rounded-2xl active:scale-95 uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] disabled:opacity-50">
                  {status === 'loading' ? 'Crittografia...' : step === 3 ? 'Invia Candidatura' : 'Continua'}
                </button>
              </div>
            </form>
          )}
        </div>

        {status !== 'success' && (
          <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Hai già un account approvato? <Link href="/login" className="text-blue-500 hover:text-blue-400 ml-1 transition-colors">Esegui il Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}