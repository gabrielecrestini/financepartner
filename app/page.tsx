"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, Activity, Lock, CheckCircle, ArrowRight, Settings, Unlock, RefreshCw, AlertTriangle, LineChart, Shield, Users, Repeat, TrendingUp, Send, Database, Check, X, LogOut, BookOpen, MessageCircle, PhoneCall } from 'lucide-react';

const LinkedinIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '') as string;
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '') as string;
const supabase = createClient(supabaseUrl, supabaseKey);
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;

export default function ProtocolloSoftware() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [capital, setCapital] = useState(5000);
  const [email, setEmail] = useState('');
  const [progress, setProgress] = useState(0);

  const [anni, setAnni] = useState(5);
  const [versamentoMensile, setVersamentoMensile] = useState(100);

  const [node1Clicked, setNode1Clicked] = useState(false);
  const [node2Clicked, setNode2Clicked] = useState(false);
  const [userStatus, setUserStatus] = useState('unregistered'); 
  const [isChecking, setIsChecking] = useState(false);
  
  const [vipTab, setVipTab] = useState('dashboard');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const isAdmin = email === ADMIN_EMAIL && email !== undefined && email !== '';
  const [leads, setLeads] = useState<any[]>([]);

  const LINK_ETORO = "https://www.financeads.net/tc.php?t=80001C110660650T";
  const LINK_YOUHODLER = "https://www.financeads.net/tc.php?t=80001C324060796T";

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

  useEffect(() => {
    if (isAdmin && step === 4) fetchLeads();
  }, [isAdmin, step]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('finance_leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const approveUser = async (userEmail: string) => {
    await supabase.from('finance_leads').update({ status: 'verified' }).eq('email', userEmail);
    fetchLeads(); 
  };

  const checkVerification = async (userEmail: string, showLoading = true) => {
    if (showLoading) setIsChecking(true);
    const { data } = await supabase.from('finance_leads').select('status').eq('email', userEmail).single();
    
    if (data && data.status === 'verified') {
      setUserStatus('verified');
      localStorage.setItem('ps_status', 'verified');
    }
    if (showLoading) setTimeout(() => setIsChecking(false), 800);
  };

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

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from('finance_chat').insert([{ user_email: email, message: newMessage }]);
    setNewMessage('');
  };

  useEffect(() => {
    if (node1Clicked && node2Clicked && userStatus === 'unregistered' && !isAdmin) {
      setUserStatus('pending');
      localStorage.setItem('ps_status', 'pending');
      supabase.from('finance_leads').update({ status: 'pending' }).eq('email', email).then();
    }
  }, [node1Clicked, node2Clicked, userStatus, email, isAdmin]);

  const handleNodeClick = (nodeNumber: number) => {
    if (nodeNumber === 1) { setNode1Clicked(true); localStorage.setItem('ps_node1', 'true'); } 
    else { setNode2Clicked(true); localStorage.setItem('ps_node2', 'true'); }
  };

  const handleAnalysis = async (e: React.FormEvent) => {
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

  const renditaYouHodler = 0.10; 
  const totaleBancaTradizionale = capital + (versamentoMensile * 12 * anni);
  let totaleProtocollo = capital;
  for (let i = 0; i < anni; i++) {
    totaleProtocollo = (totaleProtocollo + (versamentoMensile * 12)) * (1 + renditaYouHodler);
  }
  const guadagnoNetto = totaleProtocollo - totaleBancaTradizionale;

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans relative flex flex-col items-center py-6 sm:py-10 px-4 sm:px-6">
      <div className="absolute top-0 w-full max-w-[800px] h-[400px] bg-indigo-900/20 blur-[100px] pointer-events-none"></div>

      {/* WIDGET ASSISTENZA H24 FLUTTUANTE */}
      <a href="https://wa.me/393520390606" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-110 transition-transform z-50 flex items-center gap-3 group animate-in fade-in slide-in-from-bottom-8 duration-700">
        <MessageCircle size={24} className="animate-pulse" />
        <div className="hidden group-hover:flex flex-col pr-2">
          <span className="font-black text-[10px] uppercase tracking-widest opacity-80">Supporto Diretto</span>
          <span className="font-bold text-sm">+39 352 039 0606</span>
        </div>
      </a>

      <div className="max-w-6xl w-full z-10">
        
        {/* HEADER */}
        <div className="text-center mb-8 sm:mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-4 sm:mb-6 shadow-xl text-[10px] sm:text-xs font-semibold tracking-widest text-slate-300 uppercase">
            <Shield size={14} className="text-emerald-500" />
            Infrastruttura di Livello Istituzionale
          </div>
          {step < 4 && (
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight px-2">
               Ingegnerizza la tua <span className="block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Rendita Asimmetrica</span>.
             </h1>
          )}
        </div>

        {/* STEPS 1-3 */}
        {step === 1 && (
          <div className="bg-slate-900/80 p-6 sm:p-12 rounded-3xl border border-slate-800 max-w-xl mx-auto text-center animate-in zoom-in-95 duration-500 shadow-2xl backdrop-blur-sm">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Parametro di Liquidità</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1000, 2500, 5000, 10000].map(val => (
                <button key={val} onClick={() => { setCapital(val); setStep(2); }} className="p-5 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-cyan-500 hover:bg-cyan-500/10 font-bold text-xl transition-all shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:-translate-y-1">€ {val.toLocaleString('it-IT')}</button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-slate-900/80 p-6 sm:p-12 rounded-3xl border border-slate-800 max-w-xl mx-auto text-center animate-in slide-in-from-right-8 duration-500 shadow-2xl backdrop-blur-sm">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Chiave di Sicurezza</h3>
            <p className="text-slate-400 mb-6 text-sm">Inserisci l'email operativa. Il sistema creerà un ambiente crittografato per i tuoi dati.</p>
            <form onSubmit={handleAnalysis} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Inserisci Email..." className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all" />
              <button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg">GENERA AMBIENTE OPERATIVO</button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-slate-900/80 p-8 sm:p-10 rounded-3xl border border-cyan-500/30 max-w-md mx-auto text-center animate-in fade-in duration-500 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
            <Settings size={48} className="text-cyan-400 mx-auto mb-6 animate-spin-slow" />
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Compilazione Ambiente...</h3>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-4"><div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
            <p className="text-xs text-slate-500 font-mono text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
              {progress < 40 && "&gt; Costruzione matrice di calcolo..."}
              {progress >= 40 && progress < 80 && "&gt; Collegamento API Nodi di ancoraggio..."}
              {progress >= 80 && <span className="text-emerald-400 font-bold">&gt; Sicurezza stabilita. Sblocco in corso.</span>}
            </p>
          </div>
        )}

        {/* PANNELLO ADMIN */}
        {step === 4 && isAdmin && (
          <div className="bg-slate-900 rounded-3xl border border-cyan-500/50 p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-800 pb-6 gap-4">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3"><Database className="text-cyan-400" size={24} /> Centrale Admin</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">Gestione accessi Piattaforma VIP</p>
              </div>
              <div className="flex w-full sm:w-auto gap-3">
                <button onClick={fetchLeads} className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none text-sm">
                  <RefreshCw size={16}/> Aggiorna
                </button>
                <button onClick={handleLogout} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none text-sm">
                  <X size={16}/> Esci
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300 min-w-[700px]">
                <thead className="bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="p-3 sm:p-4 font-bold">Utente (Email)</th>
                    <th className="p-3 sm:p-4 font-bold">Origine</th>
                    <th className="p-3 sm:p-4 font-bold">Data</th>
                    <th className="p-3 sm:p-4 font-bold">Status</th>
                    <th className="p-3 sm:p-4 font-bold text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 sm:p-4 font-medium text-white">{lead.email}</td>
                      <td className="p-3 sm:p-4 text-slate-400">{lead.lead_magnet}</td>
                      <td className="p-3 sm:p-4 text-slate-400">{new Date(lead.created_at).toLocaleDateString('it-IT')}</td>
                      <td className="p-3 sm:p-4">
                        {lead.status === 'verified' && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] sm:text-xs font-bold border border-emerald-500/20">APPROVATO</span>}
                        {lead.status === 'pending' && <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded text-[10px] sm:text-xs font-bold border border-amber-500/20">IN ATTESA</span>}
                        {lead.status === 'unregistered' && <span className="bg-slate-500/10 text-slate-400 px-2 py-1 rounded text-[10px] sm:text-xs font-bold border border-slate-500/20">INCOMPLETO</span>}
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        {lead.status === 'pending' ? (
                          <button onClick={() => approveUser(lead.email)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ml-auto transition-all text-xs sm:text-sm">
                            <Check size={14}/> Sblocca
                          </button>
                        ) : (
                           <span className="text-slate-600 text-[10px] sm:text-xs uppercase font-bold tracking-wider">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nessun utente registrato nel database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FUNNEL UTENTI NORMALI */}
        {step === 4 && !isAdmin && (
          <div className="animate-in zoom-in-95 duration-700">
            
            {/* STATO 1: Unregistered (Marketing Avanzato) */}
            {userStatus === 'unregistered' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <AlertTriangle size={56} className="text-amber-400 mx-auto mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Ultimo Step: Attivazione Nodi</h2>
                  <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Per separare i curiosi da chi agisce, l'accesso alla Piattaforma VIP (dal valore di mercato di 10.000€) richiede l'inizializzazione gratuita della tua architettura finanziaria. <strong>Nessun costo, solo azione.</strong>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  
                  {/* NODO 1 - Marketing */}
                  <div className={`bg-slate-900/80 p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${node1Clicked ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-slate-700 hover:border-cyan-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(6,182,212,0.15)]'}`}>
                    <div className={`absolute top-0 right-0 text-[10px] font-black tracking-widest px-4 py-1.5 rounded-bl-xl ${node1Clicked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>STEP 1 OBBLIGATORIO</div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-2xl ${node1Clicked ? 'bg-emerald-500/10' : 'bg-cyan-500/10'}`}>
                        {node1Clicked ? <CheckCircle className="text-emerald-400" size={32}/> : <Lock className="text-cyan-400" size={32}/>}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Nodo YouHodler</h3>
                        <p className="text-sm font-semibold text-cyan-400">Generatore al 10% APY</p>
                      </div>
                    </div>
                    <div className="space-y-4 mb-8">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Perché registrarsi?</span>
                        <p className="text-sm text-slate-300">Sterilizza i tuoi risparmi dalla volatilità. Converti euro in stablecoin e bloccali per farli lavorare al sicuro dall'inflazione.</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Cosa Sblocchi?</span>
                        <p className="text-sm text-emerald-400 font-semibold">Il Calcolatore 2.0 e il modulo "Leva Patrimoniale Avanzata".</p>
                      </div>
                    </div>
                    <a href={LINK_YOUHODLER} target="_blank" rel="noreferrer" onClick={() => handleNodeClick(1)} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${node1Clicked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'}`}>
                      {node1Clicked ? "NODO 1 VERIFICATO" : "INIZIALIZZA NODO 1"} {!node1Clicked && <ArrowRight size={18}/>}
                    </a>
                  </div>

                  {/* NODO 2 - Marketing */}
                  <div className={`bg-slate-900/80 p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${node2Clicked ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-slate-700 hover:border-indigo-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(99,102,241,0.15)]'}`}>
                    <div className={`absolute top-0 right-0 text-[10px] font-black tracking-widest px-4 py-1.5 rounded-bl-xl ${node2Clicked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>STEP 2 OBBLIGATORIO</div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-2xl ${node2Clicked ? 'bg-emerald-500/10' : 'bg-indigo-500/10'}`}>
                        {node2Clicked ? <CheckCircle className="text-emerald-400" size={32}/> : <Lock className="text-indigo-400" size={32}/>}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Nodo eToro</h3>
                        <p className="text-sm font-semibold text-indigo-400">Esposizione Equity Zero-Fee</p>
                      </div>
                    </div>
                    <div className="space-y-4 mb-8">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Perché registrarsi?</span>
                        <p className="text-sm text-slate-300">Qui verserai *esclusivamente* gli interessi gratuiti generati dal Nodo 1 per acquistare azioni senza pagare commissioni al broker.</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest block mb-1">Cosa Sblocchi?</span>
                        <p className="text-sm text-emerald-400 font-semibold">Accesso esclusivo alla War Room (Chat privata) e Modulo CopyTrading.</p>
                      </div>
                    </div>
                    <a href={LINK_ETORO} target="_blank" rel="noreferrer" onClick={() => handleNodeClick(2)} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${node2Clicked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02]'}`}>
                      {node2Clicked ? "NODO 2 VERIFICATO" : "INIZIALIZZA NODO 2"} {!node2Clicked && <ArrowRight size={18}/>}
                    </a>
                  </div>

                </div>

                {node1Clicked && node2Clicked && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-emerald-400 text-sm sm:text-base font-bold flex flex-col items-center justify-center gap-3 animate-in slide-in-from-bottom-4">
                    <RefreshCw size={24} className="animate-spin"/>
                    <span>Ottimo. Sincronizzazione API dei Nodi in corso. Non chiudere la pagina...</span>
                  </div>
                )}
              </div>
            )}

            {/* STATO 2: Pending (Attesa) */}
            {userStatus === 'pending' && (
              <div className="max-w-2xl mx-auto bg-slate-900/80 p-8 sm:p-12 rounded-3xl border border-indigo-500/30 text-center shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden animate-in zoom-in-95">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
                <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock size={40} className="text-indigo-400" />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tight">Auditing in Corso</h2>
                <p className="text-sm sm:text-base text-slate-400 mb-8 leading-relaxed">
                  I nodi sono stati rilevati in locale. Il nostro team di conformità sta verificando manualmente l'handshake delle API per garantirti l'accesso alla Piattaforma Istituzionale. Questo passaggio blocca i bot e protegge la community.
                </p>
                
                <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
                  <div className="text-slate-400 text-xs sm:text-sm mb-6 flex flex-col gap-2">
                    <span>L'attivazione manuale richiede solitamente <strong>24-48h</strong>.</span>
                    <span>Torna qui o forza l'aggiornamento se credi di essere già stato approvato.</span>
                  </div>
                  <button onClick={() => checkVerification(email, true)} disabled={isChecking} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 sm:px-10 rounded-xl flex items-center justify-center gap-3 transition-all w-full shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 text-sm sm:text-base">
                    {isChecking ? <RefreshCw className="animate-spin" size={20}/> : <Shield size={20}/>}
                    {isChecking ? "CONTROLLO DATABASE IN CORSO..." : "VERIFICA STATO APPROVAZIONE"}
                  </button>
                </div>
              </div>
            )}

            {/* STATO 3: PIATTAFORMA VIP */}
            {userStatus === 'verified' && (
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 animate-in slide-in-from-bottom-8 duration-700">
                
                {/* Sidebar VIP (Menu Orizzontale su Mobile) */}
                <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 sm:p-6 rounded-2xl border border-emerald-500/30 mb-2 lg:mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full"></div>
                    <div className="text-[10px] sm:text-xs text-emerald-400 font-bold tracking-widest mb-1 uppercase">Status</div>
                    <div className="text-white font-black flex items-center gap-2 text-base sm:text-lg"><CheckCircle size={18} className="text-emerald-400"/> ACCESSO VIP</div>
                  </div>
                  
                  <div className="flex overflow-x-auto lg:flex-col gap-2 pb-2 lg:pb-0 hide-scrollbar snap-x">
                    <button onClick={() => setVipTab('dashboard')} className={`p-3 sm:p-4 rounded-xl flex items-center justify-center lg:justify-start gap-2 sm:gap-3 font-bold transition-all shrink-0 snap-center text-sm sm:text-base ${vipTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                      <LineChart size={18}/> Calcolatore
                    </button>
                    <button onClick={() => setVipTab('copytrading')} className={`p-3 sm:p-4 rounded-xl flex items-center justify-center lg:justify-start gap-2 sm:gap-3 font-bold transition-all shrink-0 snap-center text-sm sm:text-base ${vipTab === 'copytrading' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                      <TrendingUp size={18}/> CopyTrading
                    </button>
                    <button onClick={() => setVipTab('loans')} className={`p-3 sm:p-4 rounded-xl flex items-center justify-center lg:justify-start gap-2 sm:gap-3 font-bold transition-all shrink-0 snap-center text-sm sm:text-base ${vipTab === 'loans' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                      <Repeat size={18}/> Leva
                    </button>
                    <button onClick={() => setVipTab('chat')} className={`p-3 sm:p-4 rounded-xl flex items-center justify-center lg:justify-start gap-2 sm:gap-3 font-bold transition-all shrink-0 snap-center text-sm sm:text-base ${vipTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>
                      <Users size={18}/> War Room
                    </button>
                  </div>

                  <div className="mt-2 lg:mt-auto pt-2 lg:pt-6 flex flex-row lg:flex-col gap-2 sm:gap-3">
                    <a href="TUO_LINK_LINKEDIN" target="_blank" className="flex-1 lg:flex-none p-3 sm:p-4 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] font-bold flex items-center justify-center gap-2 hover:bg-[#0A66C2]/20 transition-all text-xs sm:text-sm">
                      <LinkedinIcon size={18}/> Linkedin
                    </a>
                    <button onClick={handleLogout} className="flex-1 lg:flex-none p-3 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-slate-300 transition-all text-xs sm:text-sm">
                      <LogOut size={16}/> Disconnetti
                    </button>
                  </div>
                </div>

                {/* Contenuto VIP */}
                <div className="flex-grow bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-8 md:p-10 min-h-[500px] shadow-2xl relative overflow-hidden">
                  
                  {vipTab === 'dashboard' && (
                    <div className="animate-in fade-in">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><LineChart className="text-indigo-400" size={28}/> Proiezione & Automazione</h2>
                      
                      <div className="bg-slate-950 p-5 sm:p-8 rounded-2xl border border-slate-800 mb-6 sm:mb-8 shadow-inner">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                           <div className="space-y-3">
                             <label className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">Capitale Protettivo (€)</label>
                             <input type="range" min="1000" max="50000" step="1000" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full accent-cyan-500" />
                             <div className="text-xl sm:text-2xl font-black text-white">€ {capital.toLocaleString()}</div>
                           </div>
                           <div className="space-y-3">
                             <label className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">Orizzonte (Anni)</label>
                             <input type="range" min="1" max="10" step="1" value={anni} onChange={(e) => setAnni(Number(e.target.value))} className="w-full accent-cyan-500" />
                             <div className="text-xl sm:text-2xl font-black text-white">{anni} Anni</div>
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700">
                           <div className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Rendimento Generato (10% APY):</div>
                           <div className="text-3xl sm:text-4xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">+ € {guadagnoNetto.toLocaleString('it-IT', {maximumFractionDigits:0})}</div>
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Il Setup "Ghost" Operativo</h3>
                      <div className="bg-slate-950 p-5 sm:p-6 rounded-xl border border-slate-800">
                        <ul className="list-disc pl-4 text-xs sm:text-sm text-slate-400 space-y-4 leading-relaxed">
                          <li><strong>Alimentazione:</strong> Imposta un bonifico ricorrente dalla tua banca verso YouHodler il giorno 2 del mese (Zero Commissioni).</li>
                          <li><strong>Sterilizzazione:</strong> Su YouHodler, attiva la conversione automatica da EUR a EURS per avviare la rendita anti-inflazione.</li>
                          <li><strong>Asimmetria:</strong> Su eToro, usa l'Addebito Diretto (SEPA). Imposta un prelievo automatico il giorno 5 equivalente agli interessi per acquistare quote S&P 500.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {vipTab === 'copytrading' && (
                    <div className="animate-in fade-in">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><TrendingUp className="text-indigo-400" size={28}/> CopyTrading Asimmetrico</h2>
                      <p className="text-sm sm:text-base text-slate-300 mb-6 sm:mb-8 leading-relaxed">Sfrutta l'intelligenza collettiva del Nodo 2 (eToro) mettendo a leva i profitti generati dal Nodo 1. Affida le tue plusvalenze ai migliori trader senza ansia, perché il capitale base è al sicuro.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-slate-950 p-6 sm:p-8 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-colors">
                          <div className="text-sm sm:text-base text-indigo-400 font-black uppercase tracking-widest mb-3">Il Filtro Alpha</div>
                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Evita i giocatori d'azzardo. Nella ricerca di eToro imposta severamente: Rischio Max 3, Storicità oltre i 2 anni, e Drawdown (perdita massima) inferiore al 10% annuo.</p>
                        </div>
                        <div className="bg-slate-950 p-6 sm:p-8 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-colors">
                          <div className="text-sm sm:text-base text-indigo-400 font-black uppercase tracking-widest mb-3">Pac Mensile (DCA)</div>
                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Non versare tutto in una volta. Aggiungendo liquidità al copytrader ogni mese, i suoi fisiologici mesi negativi diventeranno sconti per acquistare nuovi asset a prezzo ribassato.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {vipTab === 'loans' && (
                    <div className="animate-in fade-in">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"><Repeat className="text-indigo-400" size={28}/> Leva via Prestiti</h2>
                      <div className="bg-rose-500/10 border border-rose-500/30 p-5 sm:p-6 rounded-xl mb-4 sm:mb-8">
                        <h4 className="text-rose-400 font-bold flex items-center gap-2 mb-2 text-sm sm:text-base"><ShieldAlert size={18}/> Solo per Capitali &gt; 10.000€</h4>
                        <p className="text-xs sm:text-sm text-rose-300 mt-2 leading-relaxed">Modulo ad alto rischio e alto rendimento. Usa i prestiti collaterali per estrarre contanti senza vendere gli asset principali che stanno maturando il 10%.</p>
                      </div>
                      <div className="bg-slate-950 p-6 sm:p-8 rounded-xl border border-slate-800">
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-bold">
                          Su YouHodler usa i tuoi EURS come collaterale per ottenere contanti istantanei in Euro.
                        </p>
                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                          <strong className="text-indigo-400">Strategia Base:</strong> Prendi in prestito il 30% del collaterale (LTV Sicuro). Invialo su eToro per sfruttare un crollo azionario improvviso (es. un flash crash del -15%). Quando il mercato recupera la settimana successiva, vendi le azioni su eToro, estingui il prestito su YouHodler e intasca la plusvalenza netta.
                        </p>
                      </div>
                    </div>
                  )}

                  {vipTab === 'chat' && (
                    <div className="absolute inset-0 p-4 sm:p-6 md:p-10 flex flex-col animate-in fade-in bg-slate-900">
                      <div className="flex-shrink-0 mb-4 sm:mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3"><Users className="text-indigo-400" size={28}/> La War Room</h2>
                        <p className="text-slate-500 text-xs sm:text-sm">Spazio di confronto riservato esclusivamente all'elite verificata.</p>
                      </div>
                      
                      <div className="flex-grow bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-6 mb-4 overflow-y-auto flex flex-col gap-4 min-h-[250px] shadow-inner">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-slate-500 my-auto text-sm">Nessun messaggio presente. Fai la prima mossa.</div>
                        ) : (
                          chatMessages.map((msg, i) => (
                            <div key={i} className={`p-4 sm:p-5 rounded-2xl max-w-[90%] sm:max-w-[80%] ${msg.user_email === email ? 'bg-indigo-600/20 border-indigo-500/30 ml-auto rounded-br-sm' : 'bg-slate-800 border-slate-700 rounded-bl-sm'} border shadow-sm`}>
                              <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 sm:gap-2">
                                <Shield size={12}/> {msg.user_email.split('@')[0]}
                              </div>
                              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">{msg.message}</div>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={sendChatMessage} className="flex-shrink-0 flex gap-2 sm:gap-3">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Condividi un'analisi tattica..." className="flex-grow p-4 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500 shadow-inner text-sm transition-all" />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 sm:px-8 rounded-xl transition-all flex items-center justify-center font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95"><Send size={20}/></button>
                      </form>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}