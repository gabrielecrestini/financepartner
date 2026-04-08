"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// ATTENZIONE: 'Linkedin' rimosso dall'importazione di lucide-react
import { ShieldAlert, Activity, Lock, CheckCircle, ArrowRight, Settings, Unlock, RefreshCw, AlertTriangle, LineChart, Shield, Users, Repeat, TrendingUp, Send, Database, Check, X, LogOut, BookOpen } from 'lucide-react';

// Il nostro componente Custom SVG per bypassare la rimozione dei brand da Lucide
const LinkedinIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// La TUA email segreta per sbloccare il pannello Admin (dal file .env)
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;

export default function ProtocolloSoftware() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [capital, setCapital] = useState(5000);
  const [email, setEmail] = useState('');
  const [progress, setProgress] = useState(0);

  // Variabili Calcolatore
  const [anni, setAnni] = useState(5);
  const [versamentoMensile, setVersamentoMensile] = useState(100);

  // Stati Nodi e Verifica
  const [node1Clicked, setNode1Clicked] = useState(false);
  const [node2Clicked, setNode2Clicked] = useState(false);
  const [userStatus, setUserStatus] = useState('unregistered'); // unregistered, pending, verified
  const [isChecking, setIsChecking] = useState(false);
  
  // Piattaforma VIP
  const [vipTab, setVipTab] = useState('dashboard');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Stato Admin
  const isAdmin = email === ADMIN_EMAIL && email !== undefined && email !== '';
  const [leads, setLeads] = useState([]);

  // Link Affiliati Reali
  const LINK_ETORO = "https://www.financeads.net/tc.php?t=80001C110660650T";
  const LINK_YOUHODLER = "https://www.financeads.net/tc.php?t=80001C324060796T";

  // HYDRATION: Recupero Sessione
  useEffect(() => {
    const savedStep = localStorage.getItem('ps_step');
    const savedEmail = localStorage.getItem('ps_email');
    const savedStatus = localStorage.getItem('ps_status');
    const savedNode1 = localStorage.getItem('ps_node1') === 'true';
    const savedNode2 = localStorage.getItem('ps_node2') === 'true';

    if (savedStep === '4') {
      setStep(4);
      if (savedEmail) setEmail(savedEmail);
      if (savedStatus) setUserStatus(savedStatus);
      if (savedNode1) setNode1Clicked(true);
      if (savedNode2) setNode2Clicked(true);
      
      if (savedEmail && savedStatus === 'pending') {
        checkVerification(savedEmail, false);
      }
    }
    setIsHydrated(true);
  }, []);

  // Fetch Leads per Admin
  useEffect(() => {
    if (isAdmin && step === 4) {
      fetchLeads();
    }
  }, [isAdmin, step]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('finance_leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const approveUser = async (userEmail) => {
    await supabase.from('finance_leads').update({ status: 'verified' }).eq('email', userEmail);
    fetchLeads(); 
  };

  const checkVerification = async (userEmail, showLoading = true) => {
    if (showLoading) setIsChecking(true);
    const { data } = await supabase.from('finance_leads').select('status').eq('email', userEmail).single();
    
    if (data && data.status === 'verified') {
      setUserStatus('verified');
      localStorage.setItem('ps_status', 'verified');
    }
    if (showLoading) {
      setTimeout(() => setIsChecking(false), 800);
    }
  };

  // Fetch Chat
  useEffect(() => {
    if (userStatus === 'verified' && vipTab === 'chat' && !isAdmin) {
      fetchChat();
      const channel = supabase.channel('realtime_chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'finance_chat' }, payload => {
          setChatMessages(prev => [...prev, payload.new]);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [userStatus, vipTab, isAdmin]);

  const fetchChat = async () => {
    const { data } = await supabase.from('finance_chat').select('*').order('created_at', { ascending: true }).limit(50);
    if (data) setChatMessages(data);
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from('finance_chat').insert([{ user_email: email, message: newMessage }]);
    setNewMessage('');
  };

  // Autosalvataggio Nodi completati
  useEffect(() => {
    if (node1Clicked && node2Clicked && userStatus === 'unregistered' && !isAdmin) {
      setUserStatus('pending');
      localStorage.setItem('ps_status', 'pending');
      supabase.from('finance_leads').update({ status: 'pending' }).eq('email', email).then();
    }
  }, [node1Clicked, node2Clicked, userStatus, email, isAdmin]);

  const handleNodeClick = (nodeNumber) => {
    if (nodeNumber === 1) { setNode1Clicked(true); localStorage.setItem('ps_node1', 'true'); } 
    else { setNode2Clicked(true); localStorage.setItem('ps_node2', 'true'); }
  };

  const handleAnalysis = async (e) => {
    e.preventDefault();
    setStep(3);
    
    if (email === ADMIN_EMAIL) {
      setTimeout(() => setStep(4), 1000);
      return;
    }

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 5;
      setProgress(currentProgress > 100 ? 100 : currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        supabase.from('finance_leads').select('email').eq('email', email).single().then(({data}) => {
          if(!data) {
             supabase.from('finance_leads').insert([{ email, lead_magnet: `Piattaforma 10k - Cap: ${capital}`, status: 'unregistered' }]).then();
          }
        });

        localStorage.setItem('ps_step', '4');
        localStorage.setItem('ps_email', email);
        setTimeout(() => setStep(4), 500);
      }
    }, 250);
  };

  // IL TASTO DI EVACUAZIONE (RESET COMPLETO)
  const handleLogout = () => {
    localStorage.removeItem('ps_step');
    localStorage.removeItem('ps_email');
    localStorage.removeItem('ps_status');
    localStorage.removeItem('ps_node1');
    localStorage.removeItem('ps_node2');
    localStorage.removeItem('ps_unlocked');
    
    setStep(1);
    setEmail('');
    setCapital(5000);
    setUserStatus('unregistered');
    setNode1Clicked(false);
    setNode2Clicked(false);
    setVipTab('dashboard');
  };

  // Calcolo Matematico
  const renditaYouHodler = 0.10; 
  const totaleBancaTradizionale = capital + (versamentoMensile * 12 * anni);
  let totaleProtocollo = capital;
  for (let i = 0; i < anni; i++) {
    totaleProtocollo = (totaleProtocollo + (versamentoMensile * 12)) * (1 + renditaYouHodler);
  }
  const guadagnoNetto = totaleProtocollo - totaleBancaTradizionale;

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans relative flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="absolute top-0 w-[800px] h-[400px] bg-indigo-900/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl w-full z-10">
        
        {/* HEADER PUBBLICO */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-6 shadow-xl">
            <Shield size={14} className="text-emerald-500" />
            <span className="text-xs font-semibold tracking-widest text-slate-300 uppercase">Infrastruttura di Livello Istituzionale</span>
          </div>
          {step < 4 && (
             <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
               Ingegnerizza la tua <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Rendita Asimmetrica</span>.
             </h1>
          )}
        </div>

        {/* STEPS 1-3 */}
        {step === 1 && (
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 max-w-xl mx-auto text-center animate-in zoom-in-95">
            <h3 className="text-2xl font-bold text-white mb-6">Parametro di Liquidità</h3>
            <div className="grid grid-cols-2 gap-4">
              {[1000, 2500, 5000, 10000].map(val => (
                <button key={val} onClick={() => { setCapital(val); setStep(2); }} className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-cyan-500 font-bold text-lg transition-all shadow-md hover:shadow-cyan-500/20">€ {val.toLocaleString('it-IT')}</button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 max-w-xl mx-auto text-center animate-in slide-in-from-right-8">
            <h3 className="text-2xl font-bold text-white mb-6">Chiave di Sicurezza</h3>
            <p className="text-slate-400 mb-6 text-sm">Inserisci l'email operativa. Il sistema creerà un ambiente crittografato per i tuoi dati.</p>
            <form onSubmit={handleAnalysis} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Inserisci Email..." className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 transition-colors" />
              <button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold py-4 rounded-xl transition-all">GENERA AMBIENTE OPERATIVO</button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-slate-900/80 p-10 rounded-3xl border border-cyan-500/20 max-w-md mx-auto text-center animate-in fade-in">
            <Settings size={48} className="text-cyan-400 mx-auto mb-6 animate-spin-slow" />
            <h3 className="text-xl font-bold text-white mb-4">Compilazione Ambiente...</h3>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-4"><div className="bg-cyan-500 h-full" style={{ width: `${progress}%` }}></div></div>
            <p className="text-xs text-slate-500 font-mono text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
              {progress < 40 && "&gt; Costruzione matrice di calcolo..."}
              {progress >= 40 && progress < 80 && "&gt; Collegamento API Nodi di ancoraggio..."}
              {progress >= 80 && <span className="text-emerald-400">&gt; Sicurezza stabilita. Sblocco in corso.</span>}
            </p>
          </div>
        )}

        {/* =========================================================
            PANNELLO ADMIN SEGRETO
            ========================================================= */}
        {step === 4 && isAdmin && (
          <div className="bg-slate-900 rounded-3xl border border-cyan-500/50 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><Database className="text-cyan-400"/> Centrale Admin</h2>
                <p className="text-slate-400 text-sm mt-1">Gestione accessi Piattaforma VIP</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={fetchLeads} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none">
                  <RefreshCw size={16}/> Aggiorna
                </button>
                <button onClick={handleLogout} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none">
                  <X size={16}/> Esci
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-sm text-slate-300 min-w-[800px]">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Utente (Email)</th>
                    <th className="p-4 font-bold">Origine/Capital</th>
                    <th className="p-4 font-bold">Data</th>
                    <th className="p-4 font-bold">Status Nodi</th>
                    <th className="p-4 font-bold text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 font-medium text-white">{lead.email}</td>
                      <td className="p-4 text-slate-400">{lead.lead_magnet}</td>
                      <td className="p-4 text-slate-400">{new Date(lead.created_at).toLocaleDateString('it-IT')}</td>
                      <td className="p-4">
                        {lead.status === 'verified' && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1.5 rounded-md text-xs font-bold border border-emerald-500/20">APPROVATO</span>}
                        {lead.status === 'pending' && <span className="bg-amber-500/10 text-amber-400 px-2 py-1.5 rounded-md text-xs font-bold border border-amber-500/20">ATTENDE VERIFICA</span>}
                        {lead.status === 'unregistered' && <span className="bg-slate-500/10 text-slate-400 px-2 py-1.5 rounded-md text-xs font-bold border border-slate-500/20">INCOMPLETO</span>}
                      </td>
                      <td className="p-4 text-right">
                        {lead.status === 'pending' ? (
                          <button onClick={() => approveUser(lead.email)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ml-auto transition-all shadow-md hover:shadow-emerald-500/20">
                            <Check size={16}/> Sblocca Accesso
                          </button>
                        ) : (
                           <span className="text-slate-600 text-xs uppercase font-bold tracking-wider">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nessun utente registrato nel database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            FUNNEL UTENTI NORMALI
            ========================================================= */}
        {step === 4 && !isAdmin && (
          <div className="animate-in zoom-in-95 duration-500">
            
            {/* STATO 1: Unregistered (Deve cliccare i Nodi) */}
            {userStatus === 'unregistered' && (
              <div className="max-w-3xl mx-auto bg-slate-900/80 p-8 sm:p-12 rounded-3xl border border-slate-800 text-center shadow-2xl">
                <AlertTriangle size={48} className="text-amber-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Inizializzazione Nodi Richiesta</h2>
                <p className="text-slate-400 mb-8 text-lg">Per accedere all'Accademia Istituzionale e ai calcolatori avanzati, il sistema deve verificare la connessione attiva con i due broker a zero fee.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
                  <a href={LINK_YOUHODLER} target="_blank" rel="noreferrer" onClick={() => handleNodeClick(1)} className={`p-6 rounded-2xl border transition-all ${node1Clicked ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-950 border-slate-700 hover:border-cyan-500'}`}>
                    <div className="text-xs font-black tracking-widest text-cyan-400 mb-2">STEP 1 - OBBLIGATORIO</div>
                    <div className="text-white font-bold text-lg mb-4">Nodo YouHodler (10%)</div>
                    <div className="flex justify-end">{node1Clicked ? <CheckCircle className="text-emerald-400"/> : <ArrowRight className="text-slate-500"/>}</div>
                  </a>
                  <a href={LINK_ETORO} target="_blank" rel="noreferrer" onClick={() => handleNodeClick(2)} className={`p-6 rounded-2xl border transition-all ${node2Clicked ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-950 border-slate-700 hover:border-indigo-500'}`}>
                    <div className="text-xs font-black tracking-widest text-indigo-400 mb-2">STEP 2 - OBBLIGATORIO</div>
                    <div className="text-white font-bold text-lg mb-4">Nodo eToro (Equity)</div>
                    <div className="flex justify-end">{node2Clicked ? <CheckCircle className="text-emerald-400"/> : <ArrowRight className="text-slate-500"/>}</div>
                  </a>
                </div>
                {node1Clicked && node2Clicked && (
                  <div className="text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 animate-pulse"><RefreshCw size={16} className="animate-spin"/> Sincronizzazione in corso...</div>
                )}
              </div>
            )}

            {/* STATO 2: Pending (Attesa approvazione manuale Admin) */}
            {userStatus === 'pending' && (
              <div className="max-w-2xl mx-auto bg-slate-900/80 p-12 rounded-3xl border border-indigo-500/30 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
                <Lock size={56} className="text-indigo-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Auditing di Sicurezza in Corso</h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  I nodi sono stati rilevati in locale. Il nostro team di conformità sta verificando manualmente l'handshake delle API con i broker per garantirti l'accesso alla piattaforma privata (Valore 10.000€).
                </p>
                
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center flex flex-col items-center">
                  <div className="text-slate-500 text-sm mb-4">L'attivazione manuale può richiedere 24-48h. Se hai ricevuto l'email di conferma, forza l'aggiornamento.</div>
                  <button onClick={() => checkVerification(email, true)} disabled={isChecking} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all w-full sm:w-auto shadow-lg shadow-indigo-500/20">
                    {isChecking ? <RefreshCw className="animate-spin" size={20}/> : <Shield size={20}/>}
                    {isChecking ? "CONTROLLO DATABASE..." : "VERIFICA STATO APPROVAZIONE"}
                  </button>
                </div>
              </div>
            )}

            {/* STATO 3: PIATTAFORMA VIP VERIFICATA */}
            {userStatus === 'verified' && (
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Sidebar Navigazione Utente */}
                <div className="w-full lg:w-64 flex flex-col gap-2">
                  <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/30 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                    <div className="text-xs text-emerald-400 font-bold tracking-widest mb-1 uppercase">Stato Account</div>
                    <div className="text-white font-black flex items-center gap-2"><CheckCircle size={16}/> ACCESSO VIP</div>
                  </div>
                  
                  <button onClick={() => setVipTab('dashboard')} className={`p-4 rounded-xl text-left flex items-center gap-3 font-bold transition-all ${vipTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                    <LineChart size={20}/> Calcolatore 2.0
                  </button>
                  <button onClick={() => setVipTab('copytrading')} className={`p-4 rounded-xl text-left flex items-center gap-3 font-bold transition-all ${vipTab === 'copytrading' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                    <TrendingUp size={20}/> CopyTrading
                  </button>
                  <button onClick={() => setVipTab('loans')} className={`p-4 rounded-xl text-left flex items-center gap-3 font-bold transition-all ${vipTab === 'loans' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                    <Repeat size={20}/> Leva Patrimoniale
                  </button>
                  <button onClick={() => setVipTab('chat')} className={`p-4 rounded-xl text-left flex items-center gap-3 font-bold transition-all ${vipTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                    <Users size={20}/> War Room (Chat)
                  </button>

                  {/* Pulsante Linkedin Custom e Disconnessione */}
                  <div className="mt-auto pt-8 flex flex-col gap-3">
                    <a href="TUO_LINK_LINKEDIN" target="_blank" className="p-4 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] font-bold flex items-center justify-center gap-2 hover:bg-[#0A66C2]/20 transition-all">
                      <LinkedinIcon size={20}/> Rete Ufficiale
                    </a>
                    <button onClick={handleLogout} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-slate-300 transition-all text-sm">
                      <LogOut size={16}/> Disconnetti
                    </button>
                  </div>
                </div>

                {/* Contenuto Dinamico Piattaforma VIP */}
                <div className="flex-grow bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-10 min-h-[600px] shadow-2xl relative">
                  
                  {vipTab === 'dashboard' && (
                    <div className="animate-in fade-in">
                      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><LineChart className="text-indigo-400"/> Proiezione & Automazione</h2>
                      
                      {/* Mini Calcolatore */}
                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                           <div className="space-y-2">
                             <label className="text-xs text-slate-500 font-bold uppercase">Capitale (€)</label>
                             <input type="range" min="1000" max="50000" step="1000" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full accent-cyan-500" />
                             <div className="text-xl font-bold text-white">€ {capital.toLocaleString()}</div>
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs text-slate-500 font-bold uppercase">Anni</label>
                             <input type="range" min="1" max="10" step="1" value={anni} onChange={(e) => setAnni(Number(e.target.value))} className="w-full accent-cyan-500" />
                             <div className="text-xl font-bold text-white">{anni} Anni</div>
                           </div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl border border-slate-800">
                           <div className="text-slate-400">Rendimento Stimato (10%):</div>
                           <div className="text-2xl font-black text-emerald-400">€ {guadagnoNetto.toLocaleString('it-IT', {maximumFractionDigits:0})}</div>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-4">Il Setup "Ghost" Operativo</h3>
                      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                        <ul className="list-disc pl-5 text-sm text-slate-400 space-y-3 leading-relaxed">
                          <li>Imposta un bonifico ricorrente dalla tua banca principale verso YouHodler il giorno 2 di ogni mese (Zero Commissioni).</li>
                          <li>Nelle impostazioni di YouHodler, attiva la conversione automatica da EUR a EURS per avviare istantaneamente la rendita composta al 10%.</li>
                          <li>Su eToro, collega il conto bancario tramite Addebito Diretto (SEPA). Imposta un prelievo automatico il giorno 5 equivalente agli interessi mensili generati per acquistare quote di SPY (Indice S&P 500) senza intaccare il tuo capitale.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {vipTab === 'copytrading' && (
                    <div className="animate-in fade-in">
                      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><TrendingUp className="text-indigo-400"/> CopyTrading Asimmetrico</h2>
                      <p className="text-slate-300 mb-6 leading-relaxed">Sfrutta l'intelligenza collettiva del Nodo 2 (eToro) mettendo a leva i profitti generati dal Nodo 1. Affida le tue plusvalenze ai migliori trader del mondo.</p>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                          <div className="text-indigo-400 font-bold mb-2">Il Filtro Alpha</div>
                          <p className="text-sm text-slate-400 leading-relaxed">Evita i giocatori d'azzardo. Nella ricerca di eToro imposta: Rischio Max 3, Storicità oltre i 2 anni, e Drawdown (perdita massima) inferiore al 10% annuo.</p>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                          <div className="text-indigo-400 font-bold mb-2">Pac Mensile (DCA)</div>
                          <p className="text-sm text-slate-400 leading-relaxed">Non versare tutto in una volta. Aggiungendo liquidità al copytrader ogni mese, i suoi mesi negativi diventeranno sconti per acquistare nuovi asset a prezzo ribassato.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {vipTab === 'loans' && (
                    <div className="animate-in fade-in">
                      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><Repeat className="text-indigo-400"/> Leva via Prestiti (Avanzato)</h2>
                      <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-xl mb-6">
                        <h4 className="text-rose-400 font-bold flex items-center gap-2 mb-2"><ShieldAlert size={18}/> Solo per Capitali &gt; 10.000€</h4>
                        <p className="text-sm text-rose-300 mt-2">Modulo ad alto rischio. Usa i prestiti collaterali per estrarre contanti senza vendere gli asset principali che stanno maturando il 10%.</p>
                      </div>
                      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                          Su YouHodler usa i tuoi EURS come collaterale per ottenere contanti istantanei in Euro.
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          <strong>Strategia Base:</strong> Prendi in prestito il 30% del collaterale (LTV Sicuro). Invialo su eToro per sfruttare un crollo azionario improvviso (es. un flash crash del -15%). Quando il mercato recupera, vendi le azioni su eToro, estingui il prestito su YouHodler e intasca la plusvalenza netta senza aver mai toccato i tuoi fondi di garanzia.
                        </p>
                      </div>
                    </div>
                  )}

                  {vipTab === 'chat' && (
                    <div className="absolute inset-0 p-6 sm:p-10 flex flex-col animate-in fade-in">
                      <div className="flex-shrink-0">
                        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Users className="text-indigo-400"/> La War Room</h2>
                        <p className="text-slate-500 text-sm mb-6">Spazio riservato esclusivamente agli utenti istituzionali verificati.</p>
                      </div>
                      
                      <div className="flex-grow bg-slate-950 rounded-xl border border-slate-800 p-4 mb-4 overflow-y-auto flex flex-col gap-3 min-h-0">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-slate-500 my-auto">Nessun messaggio presente. Avvia la discussione.</div>
                        ) : (
                          chatMessages.map((msg, i) => (
                            <div key={i} className={`p-4 rounded-xl max-w-[85%] ${msg.user_email === email ? 'bg-indigo-600/20 border-indigo-500/30 ml-auto' : 'bg-slate-800 border-slate-700'} border shadow-sm`}>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Shield size={12}/> {msg.user_email.split('@')[0]}
                              </div>
                              <div className="text-sm text-slate-200 leading-relaxed">{msg.message}</div>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={sendChatMessage} className="flex-shrink-0 flex gap-2">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Scrivi al gruppo..." className="flex-grow p-4 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500 shadow-inner" />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl transition-all flex items-center justify-center font-bold shadow-lg"><Send size={20}/></button>
                      </form>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}