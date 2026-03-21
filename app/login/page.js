"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // MOTORE PASSWORD STANDARD
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage('Credenziali non valide. Controlla email e password.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      // Login riuscito! Entrata istantanea in Dashboard
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-500/30">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .glass-panel { background: rgba(11, 18, 33, 0.6); backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 40px 80px rgba(0,0,0,0.8); border-radius: 2rem; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .input-premium { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 16px 20px; border-radius: 1rem; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.95rem; font-weight: 500; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.7); }
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
      `}} />

      <div className="absolute inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>

      <Link href="/" className="absolute top-8 left-8 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="text-sm">←</span> Home
      </Link>

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center font-black text-white text-3xl shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-white/10">F</div>
        </div>

        <div className="glass-panel p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 text-center">Bentornato</h2>
          <p className="text-sm text-slate-400 text-center font-medium mb-10">Accedi al Terminale Operativo.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Account</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium font-mono text-blue-200" placeholder="nome@azienda.com" disabled={status === 'loading'} />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password Operativa</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium font-mono text-blue-200 tracking-widest" placeholder="••••••••" disabled={status === 'loading'} />
            </div>

            {status === 'error' && (
              <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_forwards]">
                <span className="text-rose-500 text-xl">⚠️</span>
                <p className="text-[11px] font-bold text-rose-200/80 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="pt-4">
              <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[12px] px-8 py-5 rounded-2xl active:scale-95 uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                {status === 'loading' ? 'Connessione...' : 'Accesso Secure S2S'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Nuovo partner? <Link href="/signup" className="text-blue-500 hover:text-blue-400 ml-1 transition-colors">Invia Candidatura</Link>
        </p>
      </div>
    </div>
  );
}