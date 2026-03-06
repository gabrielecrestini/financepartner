"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // 1. Tenta l'autenticazione
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. Controllo Sicurezza IP (Gatekeeper)
        const res = await fetch('https://api.ipify.org?format=json');
        const { ip: current_ip } = await res.json();

        const { data: profile } = await supabase
          .from('profiles')
          .select('last_ip')
          .eq('id', data.user.id)
          .single();

        // Se ha già un IP registrato ed è DIVERSO da quello attuale
        if (profile && profile.last_ip && profile.last_ip !== current_ip) {
          
          // DISTRUGGE LA SESSIONE (Non lo fa entrare)
          await supabase.auth.signOut();

          // INVIA IL LINK DI CONFERMA ALL'EMAIL (Magic Link)
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: formData.email,
          });

          if (otpError) throw otpError;

          setMessage({ 
            text: '⚠️ Rilevato accesso da un nuovo IP. Per sicurezza, ti abbiamo inviato un Link di Conferma via email. Cliccalo per autorizzare questo dispositivo.', 
            type: 'error' 
          });
          setLoading(false);
          return; // Ferma il codice, non va alla dashboard
        }

        // Se l'IP è corretto o è il primo accesso: Aggiorna l'IP fidato e fallo entrare
        await supabase.from('profiles').update({ last_ip: current_ip }).eq('id', data.user.id);
        router.push('/dashboard');
      }
    } catch (error) {
      setMessage({ text: 'Credenziali non valide o errore di rete.', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#F4F7FA] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        .light-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 1); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); }
        .data-input { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; width: 100%; outline: none; transition: all 0.3s ease; }
        .data-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
      `}} />

      {/* Sfondo Animato */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] bg-blue-200/60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] bg-indigo-200/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md light-panel rounded-[2.5rem] p-8 sm:p-12">
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
            <span className="text-white text-2xl font-black">F</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Accedi al Network</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Infrastruttura B2B privata per affiliati finance.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <input type="email" required name="email" value={formData.email} onChange={handleChange} className="data-input text-sm" placeholder="Email Operativa" />
            <input type="password" required name="password" value={formData.password} onChange={handleChange} className="data-input text-sm" placeholder="Password" />
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-xs font-bold leading-relaxed ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-4 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest mt-4">
            {loading ? 'Autenticazione...' : 'Accedi al Terminale'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-8">
          Non hai ancora l'accesso? <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest">Invia Candidatura</Link>
        </p>
      </div>
    </div>
  );
}