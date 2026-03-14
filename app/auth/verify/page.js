"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function AuthGateway() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [authStatus, setAuthStatus] = useState('processing'); // 'processing', 'success', 'error'

  // Sistema di animazione delle scritte a schermo (Stile Terminale Bloomberg)
  const addLog = (message, delay) => {
    setTimeout(() => {
      setLogs(prev => [...prev, { id: Date.now() + Math.random(), text: message }]);
    }, delay);
  };

  useEffect(() => {
    // Sequenza visiva per intrattenere l'utente e mascherare i tempi di caricamento
    addLog("[SYSTEM] Inizializzazione protocollo di sicurezza...", 300);
    addLog("[NETWORK] Scansione impronta IP e bypass anomalie...", 1200);
    addLog("[CRYPTO] Validazione Token S2S in corso...", 2200);

    // MOTORE LOGICO DI AUTENTICAZIONE
    const processAuth = async () => {
      try {
        // Supabase legge automaticamente il token dall'URL (#access_token=...)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // Se non c'è sessione (es. il bot ha bruciato il link)
          setTimeout(() => {
            addLog("[ERRORE] Il token è scaduto o è stato intercettato da un Firewall aziendale.", 3500);
            setAuthStatus('error');
          }, 3500);
          return;
        }

        // Se la sessione è valida (Successo!)
        setTimeout(() => {
          addLog("[SUCCESS] Handshake crittografico completato.", 3200);
          addLog("[REDIRECT] Trasferimento al Terminale Operativo...", 4200);
          setAuthStatus('success');
          
          // Reindirizza alla Dashboard dopo l'animazione
          setTimeout(() => {
            router.push('/dashboard');
          }, 5500);
        }, 1000);

      } catch (err) {
        setAuthStatus('error');
      }
    };

    // Ascolta i cambiamenti di stato (utile se il token ci mette qualche istante in più a essere processato dal client)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && authStatus !== 'success') {
        setAuthStatus('success');
        addLog("[SUCCESS] Identità confermata. Sincronizzazione dati in corso...", 100);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    });

    processAuth();

    return () => subscription.unsubscribe();
  }, [router, authStatus]);

  return (
    <div className="min-h-screen bg-[#02040A] text-emerald-400 font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* EFFETTI VISIVI DI SFONDO */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none animate-pulse"></div>

      <div className="max-w-2xl w-full z-10">
        
        {/* LOGO ANIMATO */}
        <div className="flex justify-center mb-10">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {authStatus === 'processing' && (
              <>
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
                <div className="absolute inset-2 border border-emerald-500/50 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-4 border border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              </>
            )}
            {authStatus === 'success' && (
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)]"></div>
            )}
            {authStatus === 'error' && (
              <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-pulse shadow-[0_0_30px_rgba(243,64,84,0.5)]"></div>
            )}
            <span className={`text-3xl relative z-10 ${authStatus === 'error' ? 'text-rose-500' : 'text-emerald-400'}`}>
              {authStatus === 'processing' ? '🛡️' : authStatus === 'success' ? '✓' : '⚠️'}
            </span>
          </div>
        </div>

        {/* TERMINALE DI DECRITTOGRAFIA */}
        <div className="bg-black/60 border border-white/5 rounded-2xl p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl min-h-[300px] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-transparent"></div>
          
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Auth_Gateway_v2.0</span>
          </div>

          <div className="space-y-3 flex-1">
            {logs.map((log) => (
              <div key={log.id} className="animate-[fadeUp_0.3s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                <span className={`${log.text.includes('[ERRORE]') ? 'text-rose-400' : log.text.includes('[SUCCESS]') ? 'text-emerald-300 font-bold' : 'text-emerald-500/70'}`}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>

          {/* PULSANTE DI RECUPERO IN CASO DI ERRORE ANTIVIRUS */}
          {authStatus === 'error' && (
            <div className="mt-8 animate-[fadeUp_0.5s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
              <button 
                onClick={() => router.push('/login')} 
                className="w-full bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 font-bold text-xs uppercase tracking-widest py-5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                <span>↻</span> Richiedi un nuovo link sicuro
              </button>
              <p className="text-[9px] text-slate-500 text-center mt-4 leading-relaxed">
                Suggerimento: Se stai usando un'email aziendale, il firewall potrebbe invalidare il link. Generane uno nuovo e copialo manualmente nel browser.
              </p>
            </div>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );