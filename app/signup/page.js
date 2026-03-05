"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Stato completo di tutto il form di iscrizione
  const [formData, setFormData] = useState({
    email: '', password: '',
    full_name: '', entity_type: 'privato', tax_id: '', vat_number: '', address: '', payment_info: '', // KYC
    experience_level: 'expert', registered_website: '', traffic_volume: '', // Traffico
    acceptedTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!formData.acceptedTerms) {
      setMessage({ text: 'Devi accettare i Termini e Condizioni per registrarti.', type: 'error' });
      setLoading(false); return;
    }

    // 1. Crea l'utente nel sistema di Auth
    const { data, error } = await supabase.auth.signUp({ 
      email: formData.email, 
      password: formData.password 
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
      setLoading(false); return;
    } 
    
    if (data.user) {
      // 2. Salva tutti i dati nel Profilo
      const needsSite = formData.experience_level === 'beginner';
      const cleanWebsite = needsSite ? 'Richiesta Creazione Sito da Admin' : formData.registered_website;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{ 
          id: data.user.id, 
          email: formData.email, 
          full_name: formData.full_name,
          entity_type: formData.entity_type,
          tax_id: formData.tax_id.toUpperCase(),
          vat_number: formData.vat_number,
          address: formData.address,
          payment_info: formData.payment_info.toUpperCase(),
          experience_level: formData.experience_level,
          registered_website: cleanWebsite,
          traffic_volume: formData.traffic_volume,
          needs_website: needsSite,
          traffic_status: 'pending', 
          kyc_status: 'pending',
          wallet_pending: 0, 
          wallet_approved: 0
        }]);

      if (profileError) {
        setMessage({ text: `Errore salvataggio dati: ${profileError.message}`, type: 'error' });
      } else {
        // Messaggio chiaro per la conferma Email
        setMessage({ text: '✅ Candidatura Inviata! Abbiamo inviato un LINK DI ACCESSO alla tua email. Cliccalo per attivare l\'account.', type: 'success' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0A0D16] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel { background: rgba(15, 20, 31, 0.8); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px 0 rgba(0, 0, 0, 0.5); }
        .data-input { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); color: white; transition: all 0.3s ease; }
        .data-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); outline: none; }
        .custom-checkbox { appearance: none; background-color: rgba(255,255,255,0.05); margin: 0; width: 1.2em; height: 1.2em; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.3em; display: grid; place-content: center; cursor: pointer; flex-shrink: 0;}
        .custom-checkbox:checked { background-color: #3B82F6; border-color: #3B82F6; }
        .custom-checkbox:checked::before { content: "✔"; font-size: 0.8em; font-weight: bold; color: white; transform: scale(1); }
      `}} />

      <div className="relative z-10 w-full max-w-4xl glass-panel rounded-[2rem] p-6 sm:p-12">
        <div className="text-center mb-10 border-b border-white/5 pb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <span className="text-white text-2xl font-black">F</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Candidatura Partner B2B</h2>
          <p className="text-sm text-slate-400 mt-2">Compila il modulo per l'approvazione al network e l'emissione dei pagamenti.</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-8">
          
          {/* 1. CREDENZIALI */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">1. Credenziali di Accesso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="email" required name="email" value={formData.email} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm" placeholder="Email Operativa" />
              <input type="password" required name="password" minLength="6" value={formData.password} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm" placeholder="Password Sicura" />
            </div>
          </div>

          {/* 2. TRAFFICO E SITO */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">2. Setup Asset Web & Traffico</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div onClick={() => setFormData({...formData, experience_level: 'expert'})} className={`cursor-pointer p-4 rounded-xl border transition-all ${formData.experience_level === 'expert' ? 'bg-blue-500/20 border-blue-500' : 'bg-black/20 border-white/10 hover:border-white/30'}`}>
                <p className="text-sm font-bold text-white mb-1">Ho i miei Asset (Sito/Social)</p>
                <p className="text-[10px] text-slate-400">Possiedo già piattaforme per generare traffico.</p>
              </div>
              <div onClick={() => setFormData({...formData, experience_level: 'beginner'})} className={`cursor-pointer p-4 rounded-xl border transition-all ${formData.experience_level === 'beginner' ? 'bg-blue-500/20 border-blue-500' : 'bg-black/20 border-white/10 hover:border-white/30'}`}>
                <p className="text-sm font-bold text-white mb-1">Richiedo Creazione Sito</p>
                <p className="text-[10px] text-slate-400">Non ho un sito. Chiedo l'infrastruttura al team tecnico.</p>
              </div>
            </div>

            {formData.experience_level === 'expert' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="url" required name="registered_website" value={formData.registered_website} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm" placeholder="URL Sito o Pagina IG/TikTok" />
                <input type="text" required name="traffic_volume" value={formData.traffic_volume} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm" placeholder="Budget Ads o Follower Stimati" />
              </div>
            ) : (
              <input type="text" required name="traffic_volume" value={formData.traffic_volume} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm" placeholder="Budget Mensile Stimato per le tue Ads (es. 500€/mese)" />
            )}
          </div>

          {/* 3. FATTURAZIONE E KYC */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">3. Dati Fatturazione (Per ricevere i bonifici)</h3>
            <div className="flex gap-2 p-1 bg-black/30 rounded-xl w-full sm:w-max mb-4">
              <button type="button" onClick={() => setFormData({...formData, entity_type: 'privato'})} className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${formData.entity_type === 'privato' ? 'bg-white text-black' : 'text-slate-400'}`}>Privato</button>
              <button type="button" onClick={() => setFormData({...formData, entity_type: 'azienda'})} className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${formData.entity_type === 'azienda' ? 'bg-white text-black' : 'text-slate-400'}`}>Azienda / P.IVA</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" required name="full_name" value={formData.full_name} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm sm:col-span-2" placeholder="Nome Completo o Ragione Sociale" />
              <input type="text" required name="tax_id" value={formData.tax_id} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm uppercase" placeholder="Codice Fiscale" />
              {formData.entity_type === 'azienda' && <input type="text" required name="vat_number" value={formData.vat_number} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm" placeholder="Partita IVA" />}
              <input type="text" required name="address" value={formData.address} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm sm:col-span-2" placeholder="Indirizzo Completo di Residenza / Sede" />
              <input type="text" required name="payment_info" value={formData.payment_info} onChange={handleChange} className="data-input w-full rounded-xl px-4 py-3.5 text-sm sm:col-span-2 font-mono uppercase tracking-widest text-emerald-400 placeholder-slate-500" placeholder="IBAN Bancario (IT00X...)" />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-white/5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <input type="checkbox" id="terms" name="acceptedTerms" checked={formData.acceptedTerms} onChange={handleChange} className="custom-checkbox mt-0.5" />
              <label htmlFor="terms" className="text-[11px] leading-relaxed text-slate-400 cursor-pointer">
                Dichiaro che i dati inseriti sono reali. Accetto i <Link href="#" className="text-blue-400 font-bold">Termini del Network</Link> e autorizzo il controllo incrociato del traffico.
              </label>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-bold tracking-wide text-center ${message.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-6 py-5 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50">
              {loading ? 'Invio Dati Server...' : 'Invia Candidatura per Approvazione'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-8">
          Hai già effettuato l'accesso? <Link href="/login" className="font-bold text-blue-400 hover:text-white uppercase tracking-widest">Login</Link>
        </p>
      </div>
    </div>
  );
}