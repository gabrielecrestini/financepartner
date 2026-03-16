"use client";

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // Accesso con Password Standard
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setErrorMessage('Devi prima confermare la tua identità cliccando sul link che ti abbiamo inviato via email.');
      } else if (error.message.includes('Invalid login')) {
        setErrorMessage('Email o password non corretti. Riprova.');
      } else {
        setErrorMessage(error.message);
      }
      setStatus('error');
      setTimeout(() => setStatus('idle'), 6000);
    } else if (data?.user) {
      setStatus('success');
      
      // INIEZIONE DATI POST-CANDIDATURA:
      // Se l'utente si è appena registrato, prendiamo i dati dal localStorage e li salviamo nel DB
      const pendingData = localStorage.getItem('fp_pending_application');
      if (pendingData) {
        try {
          const parsedData = JSON.parse(pendingData);
          await supabase.from('profiles').update(parsedData).eq('id', data.user.id);
          localStorage.removeItem('fp_pending_application'); // Pulizia
        } catch (err) { console.error('Errore sincronizzazione dati candidatura', err); }
      }

      // Trasferimento al Terminale (che mostrerà la Sala d'Attesa se non è ancora approvato)
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .glass-panel { background: rgba(11, 18, 33, 0.6); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 40px 80px rgba(0,0,0,0.8); border-radius: 2rem; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .input-premium { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 18px 20px; border-radius: 1rem; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.95rem; font-weight: 500; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.7); box-shadow: inset 0 0 0 1px #3B82F6, 0 0 20px rgba(59,130,246,0.15); }
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        .btn-shimmer { position: relative; overflow: hidden; background-image: linear-gradient(90deg, rgba(37,99,235,1) 0%, rgba(96,165,250,0.8) 50%, rgba(37,99,235,1) 100%); background-size: 200% auto; transition: all 0.3s ease; }
        .btn-shimmer:hover { background-position: right center; box-shadow: 0 10px 30px -10px rgba(59,130,246,0.8); transform: translateY(-2px); }
      `}} />

      <div className="absolute inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>

      <Link href="/" className="absolute top-8 left-8 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
        <span className="text-sm">←</span> Home
      </Link>

      <div className="w-full max-w-md z-10">
        
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center font-black text-white text-3xl shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-white/10">F</div>
        </div>

        <div className="glass-panel p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 text-center">Accesso Secure</h2>
          <p className="text-sm text-slate-400 text-center font-medium mb-10">Inserisci le tue credenziali crittografate.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Email Operativa</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium font-mono text-blue-200" placeholder="nome@azienda.com" disabled={status === 'loading' || status === 'success'} />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium font-mono" placeholder="••••••••••••" disabled={status === 'loading' || status === 'success'} />
            </div>

            {status === 'error' && (
              <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 animate-[fadeUp_0.3s_ease-out_forwards]">
                <span className="text-rose-500 text-xl">⚠️</span>
                <p className="text-[11px] font-bold text-rose-200/80 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-center gap-3 animate-[fadeUp_0.3s_ease-out_forwards]">
                <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></span>
                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Handshake Completato...</p>
              </div>
            )}

            {status !== 'success' && (
              <div className="pt-4">
                <button type="submit" disabled={status === 'loading'} className="w-full btn-shimmer text-white font-black text-[12px] px-8 py-5 rounded-2xl active:scale-95 uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {status === 'loading' ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Connessione...</>) : 'Inizializza Terminale'}
                </button>
              </div>
            )}
          </form>
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Non hai un account? <Link href="/signup" className="text-blue-500 hover:text-blue-400 ml-1 transition-colors">Invia Candidatura B2B</Link>
        </p>
      </div>
    </div>
  );
}