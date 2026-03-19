"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Componente Logo Cristallo
const SafeImage = ({ src, alt, fallbackIcon = "🏦", className }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#020617] border border-white/5 rounded-xl shadow-inner ${className}`}>
        <span className="opacity-30 text-xl">{fallbackIcon}</span>
      </div>
    );
  }
  return (
    <div className={`bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center p-2 shadow-lg border border-white/10 ${className}`}>
      <img src={src} alt={alt} onError={() => setError(true)} className="w-full h-full object-contain filter drop-shadow-md" />
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Dati
  const [offers, setOffers] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [stats, setStats] = useState({ clicks: 0, epc: 0, cr: 0 });
  const [chartData, setChartData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // UI
  const [activeTab, setActiveTab] = useState('overview'); 
  const [animKey, setAnimKey] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [securityLock, setSecurityLock] = useState(false);
  const [detectedIp, setDetectedIp] = useState('');
  
  // Form
  const [billing, setBilling] = useState({ full_name: '', entity_type: 'privato', vat_number: '', tax_id: '', address: '', payment_info: '', registered_website: '', traffic_volume: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });
  
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [siteForm, setSiteForm] = useState({ whereToPromote: '', goals: '' });
  
  const [gateForm, setGateForm] = useState({ url: '', strategy: '' });
  const [isSubmittingGate, setIsSubmittingGate] = useState(false);

  const router = useRouter();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    setIsMounted(true);
    const savedTab = localStorage.getItem('fp_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setAnimKey(prev => prev + 1); 
    localStorage.setItem('fp_active_tab', tab);
  };

  const fetchDashboardData = async (currentUser) => {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    setProfile(profileData);
    
    if (profileData?.traffic_status === 'approved') {
      setBilling({ full_name: profileData.full_name || '', entity_type: profileData.entity_type || 'privato', vat_number: profileData.vat_number || '', tax_id: profileData.tax_id || '', address: profileData.address || '', payment_info: profileData.payment_info || '', registered_website: profileData.registered_website || '', traffic_volume: profileData.traffic_volume || '' });

      const [{ data: notifs }, { data: offersData }, { data: convData }, { data: clickData }] = await Promise.all([
        supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('offers').select('*'),
        supabase.from('conversions').select('*').eq('partner_id', currentUser.id).order('created_at', { ascending: false }),
        supabase.from('clicks').select('created_at').eq('affiliate_id', currentUser.id)
      ]);

      setNotifications(notifs || []);
      setOffers(offersData || []);
      setConversions(convData || []);

      const clicks = clickData || [];
      const totalClicks = clicks.length;
      const convs = convData || [];
      const totalApproved = profileData?.wallet_approved || 0;
      const totalConversions = convs.filter(c => c.status === 'approved').length;

      setStats({ clicks: totalClicks, epc: totalClicks > 0 ? (totalApproved / totalClicks) : 0, cr: totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0 });

      // Generazione Chart 7 Giorni
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const dailyData = last7Days.map(date => {
        const dayClicks = clicks.filter(c => c.created_at.startsWith(date)).length;
        const dayConvs = convs.filter(c => c.created_at.startsWith(date)).length;
        return { date: date.split('-').slice(1).join('/'), clicks: dayClicks, conversions: dayConvs };
      });
      setChartData(dailyData);
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const initApp = async () => {
      // 1. Forza Supabase a leggere i token dall'URL prima di fare qualsiasi cosa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // 2. Scudo Anti-Espulsione: Se non c'è l'utente, controlla se c'è un token in elaborazione
      if (!session?.user) {
        if (!window.location.hash.includes('access_token')) {
           // Se non c'è proprio niente, allora sbattilo fuori al login
           return router.push('/login');
        }
        // Se c'è un token ma Supabase sta ancora caricando, aspetta mezzo secondo e riprova
        setTimeout(() => initApp(), 500);
        return;
      }

      const user = session.user;
      setUser(user);

      // Rilevamento Dispositivo e IP
      const isDeviceAuthorized = localStorage.getItem('fp_device_auth_v1');
      let ip = 'Sconosciuto';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        ip = (await res.json()).ip;
        setDetectedIp(ip);
      } catch (e) {}

      const { data: profileData } = await supabase.from('profiles').select('traffic_status').eq('id', user.id).single();

      if (!isDeviceAuthorized && profileData?.traffic_status === 'approved') {
        setSecurityLock(true);
      }

      await fetchDashboardData(user);
      setLoading(false);

      // SUPABASE REALTIME (WebSockets per dati in diretta)
      setIsLive(true);
      const realtimeChannel = supabase.channel('dashboard-metrics')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clicks', filter: `affiliate_id=eq.${user.id}` }, () => {
           fetchDashboardData(user); // Aggiorna silenziosamente in background
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversions', filter: `partner_id=eq.${user.id}` }, () => {
           fetchDashboardData(user);
           showToast('💰 Nuova Transazione S2S Rilevata', 'success');
        })
        .subscribe();

      return () => { supabase.removeChannel(realtimeChannel); setIsLive(false); };
    };

    initApp();
  }, [isMounted, router]);

  const authorizeDevice = async () => {
    localStorage.setItem('fp_device_auth_v1', 'true');
    await supabase.from('notifications').insert([{ user_id: user.id, title: '📱 Dispositivo Verificato', message: `Autorizzazione concessa da IP: ${detectedIp}.`, type: 'success' }]);
    setSecurityLock(false);
    showToast("Dispositivo Autorizzato.", "success");
    if (stats.clicks === 0) setTimeout(() => setIsStrategyModalOpen(true), 800);
  };

  const lockAccountAndLogout = async () => {
    await supabase.from('notifications').insert([{ user_id: user.id, title: '🚨 INTRUSIONE RESPINTA', message: `Accesso negato all'IP ${detectedIp}.`, type: 'error' }]);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

  const showToast = (text, type) => {
    setSettingsMsg({ text, type });
    setTimeout(() => setSettingsMsg({ text: '', type: '' }), 3500);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setIsSubmittingGate(true);
    let cleanWebsite = gateForm.url.trim();
    if (cleanWebsite && !cleanWebsite.startsWith('http')) cleanWebsite = `https://${cleanWebsite}`;
    const adminBriefing = `CANDIDATURA:\nSorgente: ${cleanWebsite}\nStrategia: ${gateForm.strategy}`;
    const { error } = await supabase.from('profiles').update({ registered_website: cleanWebsite, traffic_volume: gateForm.strategy, traffic_status: 'pending', traffic_notes: adminBriefing }).eq('id', user.id);
    setIsSubmittingGate(false);
    if (!error) setProfile({...profile, traffic_status: 'pending'});
  };

  const handleGetLink = (offer, e) => {
    if (e) e.stopPropagation();
    if (profile?.traffic_status !== 'approved') return showToast("Anomalia Compliance. Valida il traffico.", "error");
    const trackingLink = `https://financepartner.netlify.app/api/click?offer_id=${offer.id}&subid=${user.id}`;
    navigator.clipboard.writeText(trackingLink);
    showToast("🔗 Tracker copiato in memoria", 'success');
  };

  const handleRequestSiteSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const targetName = selectedOffer ? selectedOffer.name : "Hub Globale";
    const trackingLinkToProvide = selectedOffer ? `https://financepartner.netlify.app/api/click?offer_id=${selectedOffer.id}&subid=${user.id}` : `Hub. SubID: ${user.id}`;
    const timestamp = new Date().toLocaleString('it-IT');
    const newBriefing = `\n[${timestamp}] TARGET: ${targetName} | STRATEGIA: ${siteForm.whereToPromote} | KPI: ${siteForm.goals}`;
    
    const updatedNotes = (profile.traffic_notes || '') + newBriefing;
    const newStatus = profile.traffic_status === 'approved' ? 'approved' : 'pending';

    const { error } = await supabase.from('profiles').update({ traffic_status: newStatus, traffic_notes: updatedNotes }).eq('id', user.id);
    setSavingSettings(false);
    if (!error) {
      setProfile({...profile, traffic_status: newStatus, traffic_notes: updatedNotes});
      setIsSiteModalOpen(false);
      showToast("✅ Architettura in compilazione.", 'success');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from('profiles').update({...billing, payment_info: billing.payment_info.replace(/\s+/g, '').toUpperCase()}).eq('id', user.id);
    setSavingSettings(false);
    if (!error) { showToast('Dati crittografati e sincronizzati.', 'success'); setProfile({...profile, ...billing}); }
  };

  const markNotificationsAsRead = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      }
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></span> Auth</span>;
    if (status === 'pending') return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Audit</span>;
    if (status === 'rejected') return <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span> Ban</span>;
    return <span className="bg-white/5 text-slate-400 border border-white/10 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">Required</span>;
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  // =======================================================================
  // 🔴 DEVICE AUTHORIZATION (IL TERMINALE ROSSO)
  // =======================================================================
  if (securityLock) {
    return (
      <div className="min-h-screen bg-[#02040A] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; }
          .modal-animate { animation: scaleInModal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes scaleInModal { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        `}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="bg-[#0B1221] p-8 rounded-[2rem] max-w-lg w-full relative z-10 border border-rose-500/30 modal-animate shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-2xl mx-auto mb-6"><span className="animate-pulse">⚠️</span></div>
          <h2 className="text-2xl font-black text-white mb-2 text-center">Dispositivo Sconosciuto</h2>
          <p className="text-slate-400 text-center text-sm mb-6">Accesso rilevato da un nuovo IP: <strong className="text-rose-400 font-mono block mt-1">{detectedIp}</strong></p>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <button onClick={authorizeDevice} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] py-4 rounded-xl uppercase tracking-widest transition-all">✓ Autorizza e Procedi</button>
            <button onClick={lockAccountAndLogout} className="w-full text-rose-400 font-black text-[10px] py-4 rounded-xl uppercase tracking-widest transition-all hover:bg-white/5">✕ Blocca Account</button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // GATEKEEPER: COMPLIANCE
  // =======================================================================
  if (profile && profile.traffic_status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; }
          .gate-glass { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(50px); border: 1px solid rgba(255, 255, 255, 0.05); }
          .input-gate { background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 18px; border-radius: 12px; width: 100%; outline: none; font-size: 0.9rem; }
          .input-gate:focus { border-color: #3B82F6; }
        `}} />
        <button onClick={handleLogout} className="absolute top-6 right-6 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">Log Out</button>

        {(!profile.traffic_status || profile.traffic_status === 'none') && (
          <div className="gate-glass p-8 sm:p-12 rounded-[2rem] max-w-lg w-full relative z-10 border-t-2 border-t-blue-500 shadow-2xl">
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6"><span className="text-xl">🔐</span></div>
            <h2 className="text-3xl font-black text-white mb-2">Accesso Privato</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">B2B Network ad alto rendimento. L'operatività è soggetta ad approvazione manuale.</p>
            <form onSubmit={submitApplication} className="space-y-5">
              <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sorgente (Social o Web)</label><input type="text" value={gateForm.url} onChange={e => setGateForm({...gateForm, url: e.target.value})} className="input-gate font-mono text-blue-200" placeholder="https://" /></div>
              <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Strategia Operativa</label><textarea required rows="2" value={gateForm.strategy} onChange={e => setGateForm({...gateForm, strategy: e.target.value})} className="input-gate resize-none" placeholder="Descrivi il traffico..."></textarea></div>
              <div className="pt-2"><button type="submit" disabled={isSubmittingGate} className="w-full bg-blue-600 text-white font-black text-[11px] py-4 rounded-xl active:scale-95 uppercase tracking-widest disabled:opacity-50">{isSubmittingGate ? 'Invio...' : 'Sottoponi a Compliance'}</button></div>
            </form>
          </div>
        )}

        {profile.traffic_status === 'pending' && (
          <div className="gate-glass p-10 rounded-[2rem] max-w-md w-full relative z-10 text-center border-t-2 border-t-amber-500">
            <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-black text-white mb-2">Verifica in Corso</h2>
            <p className="text-sm text-slate-400 mb-6">Analisi impronta digitale. Richiede solitamente 12-24h.</p>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Trace ID: {user.id.substring(0,12)}</p>
          </div>
        )}
      </div>
    );
  }

  // =======================================================================
  // CHART COMPONENT DENSE
  // =======================================================================
  const maxClicks = Math.max(...chartData.map(d => d.clicks), 1);
  const ChartComponent = () => (
    <div className="card-glass p-6 sm:p-8 relative overflow-hidden mt-6 stagger-3">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          {isLive ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>}
          Volume Traffico (7G)
        </h3>
        <span className="text-[9px] font-mono text-slate-500">{stats.clicks} EVENTI TOTALI</span>
      </div>
      <div className="h-40 flex items-end gap-2 sm:gap-4 pt-2 relative w-full">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 z-0">
          <div className="w-full h-px bg-slate-400"></div><div className="w-full h-px bg-slate-400"></div><div className="w-full h-px bg-slate-400"></div>
        </div>
        {chartData.map((data, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 relative group z-10 h-full justify-end cursor-pointer">
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-[#020617] border border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-mono z-20 whitespace-nowrap shadow-xl flex items-center gap-2">
              <span className="text-blue-400">{data.clicks} Click</span> <span className="w-px h-2 bg-white/10"></span> <span className="text-emerald-400">{data.conversions} Lead</span>
            </div>
            <div className="w-full sm:w-[50%] relative flex justify-center items-end h-full">
              <div className="w-full bg-blue-500/20 group-hover:bg-blue-500/40 rounded-t-sm transition-all duration-500 relative overflow-hidden" style={{height: `${(data.clicks / maxClicks) * 100}%`, minHeight: '4px'}}>
                <div className="absolute bottom-0 w-full bg-blue-500" style={{height: '2px'}}></div>
              </div>
            </div>
            <span className="text-[8px] font-bold text-slate-600 uppercase">{data.date.split('/')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-blue-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stagger-1 { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards; opacity: 0; }
        .stagger-2 { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; }
        .stagger-3 { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards; opacity: 0; }
        .stagger-4 { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; opacity: 0; }
        .modal-animate { animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .card-glass { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.03); border-radius: 1.2rem; }
        .input-premium { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.05); color: white; padding: 16px 20px; border-radius: 1rem; width: 100%; outline: none; font-size: 0.9rem; }
        .input-premium:focus { border-color: #3B82F6; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .tab-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 18px; border-radius: 0.8rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; transition: all 0.2s ease; border: 1px solid transparent; }
        .tab-btn.active { background: rgba(59, 130, 246, 0.1); color: #60A5FA; border-color: rgba(59, 130, 246, 0.2); }
        .tab-btn:not(.active):hover { background: rgba(255, 255, 255, 0.02); color: white; }
      `}} />

      <div className="fixed inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* TOAST */}
      {settingsMsg.text && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl modal-animate border backdrop-blur-xl ${settingsMsg.type === 'error' ? 'bg-rose-950/90 text-rose-200 border-rose-500/50' : 'bg-[#0B1221]/90 text-blue-300 border-blue-500/50'}`}>
          {settingsMsg.text}
        </div>
      )}

      {/* OVERLAY NOTIFICHE MOBILE/DESKTOP */}
      {showNotifications && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={() => setShowNotifications(false)}></div>
          <div className="fixed top-20 left-4 right-4 md:absolute md:top-24 md:left-auto md:right-10 z-[100] md:w-[380px] bg-[#0B1221] shadow-2xl rounded-3xl overflow-hidden modal-animate border border-white/10 flex flex-col max-h-[70vh]">
            <div className="p-4 bg-white/5 border-b border-white/5 font-black text-white uppercase tracking-widest text-[9px] flex justify-between items-center shrink-0">
              <span>System Log</span><button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto p-2 hide-scrollbar flex-1">
              {notifications.length === 0 ? (<p className="p-8 text-[10px] text-slate-500 text-center font-bold">Vuoto</p>) : notifications.map(n => (
                <div key={n.id} className={`p-4 mb-2 rounded-2xl text-sm ${n.is_read ? 'bg-white/[0.02]' : 'bg-blue-600/10 border border-blue-500/20'}`}>
                  <h4 className="font-black text-white mb-1 text-[11px]">{n.title}</h4>
                  <p className="text-[10px] text-slate-400">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#020617] z-40 relative">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm">F</div>
           <span className="font-black text-white text-lg">FinancePartner</span>
        </div>
        <button onClick={markNotificationsAsRead} className="relative text-xl text-slate-400">
          🔔 {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#020617]"></span>}
        </button>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-white/5 bg-[#020617] p-6 relative z-40 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg">F</div>
          <div>
            <span className="font-black text-white text-lg block leading-none">FinancePartner</span>
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">B2B Terminal</span>
          </div>
        </div>
        
        <nav className="space-y-1 flex-1">
          {[ {id: 'overview', icon: '📊', label: 'Terminale'}, {id: 'marketplace', icon: '🏦', label: 'Offerte'}, {id: 'assets', icon: '🖥️', label: 'Infrastruttura'}, {id: 'kyc', icon: '🛡️', label: 'Dati & KYC'} ].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
              <span className="text-lg opacity-80">{tab.icon}</span> <span>{tab.label}</span>
              {(tab.id === 'assets' || tab.id === 'kyc') && profile?.[tab.id + '_status'] === 'pending' && <span className="w-2 h-2 rounded-full bg-amber-500 ml-auto"></span>}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto border-t border-white/5 pt-4 space-y-3">
          <Link href="/terms" className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest block text-center">Termini e Condizioni</Link>
          <button onClick={handleLogout} className="text-[9px] font-bold text-rose-500/70 hover:text-rose-400 uppercase tracking-widest w-full text-center bg-white/[0.02] py-3 rounded-xl">Disconnetti</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8 lg:p-10 pb-32 relative z-10 hide-scrollbar bg-[#020617]">
        <div key={animKey} className="max-w-5xl mx-auto">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-end pb-4 border-b border-white/5 stagger-1">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight mb-1">Terminale</h1>
                  <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    {isLive ? <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> : <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                    {isLive ? 'S2S CONNECTION: LIVE' : 'CONNECTING...'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsStrategyModalOpen(true)} className="bg-white/[0.05] hover:bg-white/10 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Playbook</button>
                  <button onClick={markNotificationsAsRead} className="hidden md:flex relative w-10 h-10 bg-white/[0.05] hover:bg-white/10 rounded-xl items-center justify-center text-lg transition-all text-white">
                    🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-[#020617]"></span>}
                  </button>
                </div>
              </div>

              {profile?.assigned_site_link && (
                <div className="card-glass p-6 border-l-4 border-l-blue-500 flex flex-col md:flex-row justify-between gap-6 stagger-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white mb-1">🚀 Asset Operativi</h3>
                    <p className="text-[11px] text-slate-400">Hub compilato. Incolla questi URL nelle campagne.</p>
                  </div>
                  <div className="w-full md:w-[400px] bg-black/50 border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-slate-500 uppercase">Endpoint</span>
                      <button onClick={() => {navigator.clipboard.writeText(profile.assigned_site_link); showToast("Copiato", 'success');}} className="text-[9px] text-blue-400 font-black uppercase hover:text-blue-300">Copia</button>
                    </div>
                    <textarea readOnly value={profile.assigned_site_link} className="bg-transparent text-blue-300 font-mono text-[11px] w-full outline-none resize-none hide-scrollbar" rows={2} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-2">
                {[
                  { label: "Esigibile", value: `€${profile?.wallet_approved?.toFixed(2) || '0.00'}`, color: "text-white" },
                  { label: "In Valutazione", value: `€${profile?.wallet_pending?.toFixed(2) || '0.00'}`, color: "text-amber-400" },
                  { label: "Conversion Rate", value: `${stats.cr.toFixed(2)}%`, color: "text-blue-400" },
                  { label: "EPC", value: `€${stats.epc.toFixed(2)}`, color: "text-emerald-400" }
                ].map((stat, i) => (
                  <div key={i} className="card-glass p-5 flex flex-col justify-between h-[100px]">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    <p className={`text-2xl font-black ${stat.color} font-mono tracking-tight`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <ChartComponent />

              <div className="card-glass p-6 sm:p-8 mt-6 stagger-4">
                  <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Postback Log (S2S)</h3>
                  </div>
                  <div className="space-y-2">
                    {conversions.slice(0, 5).map((conv) => (
                      <div key={conv.id} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02]">
                        <div>
                          <p className="text-sm font-black text-white mb-0.5">{conv.program_id}</p>
                          <p className="text-[9px] font-mono text-slate-500">{new Date(conv.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black font-mono mb-0.5 ${conv.status === 'approved' ? 'text-emerald-400' : conv.status === 'rejected' ? 'text-rose-500' : 'text-amber-400'}`}>+€{conv.amount?.toFixed(2)}</p>
                          <p className={`text-[8px] uppercase font-black ${conv.status === 'approved' ? 'text-emerald-500' : 'text-slate-500'}`}>{conv.status}</p>
                        </div>
                      </div>
                    ))}
                    {conversions.length === 0 && <div className="py-10 text-center"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nessun log in entrata</p></div>}
                  </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
             <div className="space-y-6">
                <div className="pb-4 border-b border-white/5 stagger-1">
                  <h1 className="text-3xl font-black text-white tracking-tight mb-2">Marketplace B2B</h1>
                  <p className="text-xs text-slate-400">Payout Netti per l'affiliato (Senza intermediari).</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {offers.map((offer, i) => (
                    <div key={offer.id} className="card-glass p-6 flex flex-col relative group" style={{animation: `slideUpFade 0.4s ease-out ${0.1 + (i*0.05)}s forwards`, opacity: 0}}>
                      <div className="flex items-start gap-4 mb-6 border-b border-white/5 pb-6">
                        <SafeImage src={offer.image_url} alt="" className="w-12 h-12 bg-white" />
                        <div className="flex-1">
                          <h4 className="font-black text-white text-lg leading-tight mb-2 truncate">{offer.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400">{offer.payout_type || 'CPA'}</span>
                            <button onClick={() => {setSelectedOffer(offer); setIsOfferModalOpen(true);}} className="text-[8px] text-slate-500 hover:text-white uppercase font-black">Policy</button>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1">Margine Netto</p>
                        <p className="font-black font-mono text-emerald-400 text-3xl">€{offer.partner_payout?.toFixed(2)}</p>
                      </div>

                      <div className="mt-auto flex gap-2">
                        <button onClick={(e) => openSiteModal(offer, e)} className="flex-1 text-[9px] font-black text-slate-300 bg-white/5 px-3 py-3 rounded-xl hover:bg-white/10 uppercase tracking-widest">Hub</button>
                        <button onClick={(e) => handleGetLink(offer, e)} className="flex-[2] text-[9px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 px-3 py-3 rounded-xl">Link S2S</button>
                      </div>
                    </div>
                  ))}
                  {offers.length === 0 && <div className="col-span-full py-10 text-center stagger-2"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Sync Inventario...</p></div>}
                </div>
             </div>
          )}
          
          {/* TAB 3 E 4 CON DESIGN DENSE */}
          {activeTab === 'assets' && (
            <div className="space-y-6 max-w-3xl">
              <div className="pb-4 border-b border-white/5 stagger-1">
                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Infrastruttura</h1>
                <p className="text-xs text-slate-400">Deploy Hub o validazione sorgenti.</p>
              </div>
              
              <div className="card-glass p-8 stagger-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black text-white">Audit Sorgente</h2>
                  <StatusBadge status={profile?.traffic_status} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">URL Principale</label>
                    <input type="url" value={billing.registered_website} onChange={e => setBilling({...billing, registered_website: e.target.value})} className="input-premium font-mono text-blue-300" placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Strategia & Budget</label>
                    <input type="text" value={billing.traffic_volume} onChange={e => setBilling({...billing, traffic_volume: e.target.value})} className="input-premium" placeholder="Meta Ads / 1000€" />
                  </div>
                </div>
                <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-blue-600 text-white font-black text-[10px] py-3.5 rounded-xl uppercase tracking-widest hover:bg-blue-500">{savingSettings ? 'Invio...' : 'Salva e Sottoponi'}</button>
              </div>

              <div className="card-glass p-8 border border-indigo-500/30 stagger-3">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-white">Deploy Hub (B2B)</h2>
                  <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest">Incluso</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">L'IT progetterà per te Hub di comparazione ottimizzati per i link S2S.</p>
                <button onClick={() => {setSelectedOffer(null); setIsSiteModalOpen(true);}} className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-slate-200">Avvia Richiesta IT</button>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
             <div className="space-y-6 max-w-3xl">
               <div className="pb-4 border-b border-white/5 stagger-1">
                 <h1 className="text-3xl font-black text-white tracking-tight mb-2">Dati & KYC</h1>
                 <p className="text-xs text-slate-400">Coordinate criptate per erogazione pagamenti S2S.</p>
               </div>
               
               <div className="card-glass p-8 stagger-2">
                 <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                   <h2 className="text-lg font-black text-white">Profilo Fiscale</h2>
                   <StatusBadge status={profile?.kyc_status} />
                 </div>

                  <div className="flex p-1 bg-black/40 rounded-xl w-max mb-6">
                    <button onClick={() => setBilling({...billing, entity_type: 'privato'})} className={`px-8 py-2.5 text-[9px] font-black rounded-lg uppercase tracking-widest ${billing.entity_type === 'privato' ? 'bg-white text-black' : 'text-slate-500'}`}>Privato</button>
                    <button onClick={() => setBilling({...billing, entity_type: 'azienda'})} className={`px-8 py-2.5 text-[9px] font-black rounded-lg uppercase tracking-widest ${billing.entity_type === 'azienda' ? 'bg-white text-black' : 'text-slate-500'}`}>P.IVA</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Intestatario</label>
                      <input type="text" value={billing.full_name} onChange={e => setBilling({...billing, full_name: e.target.value})} className="input-premium" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">C.Fiscale</label>
                      <input type="text" value={billing.tax_id} onChange={e => setBilling({...billing, tax_id: e.target.value.toUpperCase()})} className="input-premium uppercase font-mono" />
                    </div>
                    {billing.entity_type === 'azienda' && (
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">P.IVA</label>
                        <input type="text" value={billing.vat_number} onChange={e => setBilling({...billing, vat_number: e.target.value})} className="input-premium font-mono" />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Indirizzo</label>
                      <input type="text" value={billing.address} onChange={e => setBilling({...billing, address: e.target.value})} className="input-premium" />
                    </div>
                    
                    <div className="md:col-span-2 pt-4 border-t border-white/5">
                      <label className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">🔒 IBAN (SEPA)</label>
                      <input type="text" value={billing.payment_info} onChange={e => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} className="input-premium font-mono text-emerald-400 bg-emerald-500/5 text-lg" placeholder="IT00X..." />
                    </div>
                  </div>

                  <button onClick={handleSaveSettings} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] py-4 rounded-xl uppercase tracking-widest transition-all">Sincronizza Dati</button>
               </div>

               {/* Sezione Termini Visibile su Mobile */}
               <div className="md:hidden mt-10 text-center">
                 <Link href="/terms" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest underline underline-offset-4">Leggi Termini e Condizioni</Link>
               </div>
             </div>
          )}
        </div>
      </main>

      {/* BOTTOM NAV MOBILE */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-center">
        <nav className="bg-[#0B1221]/90 backdrop-blur-xl w-full max-w-sm rounded-[1.5rem] shadow-2xl border border-white/10">
          <div className="flex justify-around p-1.5">
            {[ {id: 'overview', icon: '📊', label: 'Home'}, {id: 'marketplace', icon: '🏦', label: 'Offerte'}, {id: 'assets', icon: '🖥️', label: 'Hub'}, {id: 'kyc', icon: '🛡️', label: 'Dati'} ].map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex flex-col items-center justify-center w-full py-2.5 rounded-xl transition-all relative ${activeTab === tab.id ? 'text-blue-400 bg-white/10' : 'text-slate-500'}`}>
                <span className="text-xl mb-0.5">{tab.icon}</span>
                <span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
                {(tab.id === 'kyc') && profile?.[tab.id + '_status'] === 'pending' && <span className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* MODALI */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-sm">
          <div className="card-glass p-8 rounded-3xl max-w-2xl w-full modal-animate">
            <h2 className="text-2xl font-black text-white mb-2">Protocollo Operativo</h2>
            <p className="text-xs text-slate-400 mb-6">Tracciamento S2S attivo. I server bancari comunicano in background. Zero click persi su iOS.</p>
            <div className="bg-rose-900/10 border border-rose-500/20 p-4 rounded-xl mb-6">
              <h3 className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">⚠️ Policy Zero Tolleranza</h3>
              <p className="text-[11px] text-rose-200/70">Vietato traffico Incentivato e Brand Bidding. Rischio storno istantaneo.</p>
            </div>
            <button onClick={() => setIsStrategyModalOpen(false)} className="w-full bg-white text-black font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl">Inizializza Terminale</button>
          </div>
        </div>
      )}

      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm">
          <div className="card-glass p-8 rounded-3xl max-w-md w-full modal-animate">
            <h2 className="text-xl font-black text-white mb-1">Deploy IT</h2>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-6">Target: {selectedOffer ? selectedOffer.name : "Hub Globale"}</p>
            <form onSubmit={handleRequestSiteSubmit} className="space-y-4">
              <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sorgente Traffico</label><textarea required rows="2" value={siteForm.whereToPromote} onChange={e=>setSiteForm({...siteForm, whereToPromote: e.target.value})} className="input-premium resize-none text-sm"></textarea></div>
              <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Budget KPI</label><input type="text" required value={siteForm.goals} onChange={e=>setSiteForm({...siteForm, goals: e.target.value})} className="input-premium text-sm" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="flex-1 text-[9px] font-black uppercase text-slate-400 bg-white/5 py-3.5 rounded-xl">Annulla</button>
                <button type="submit" disabled={savingSettings} className="flex-[2] text-[9px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl">Invia Briefing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm" onClick={() => setIsOfferModalOpen(false)}>
          <div className="card-glass p-8 rounded-3xl max-w-xl w-full modal-animate" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <SafeImage src={selectedOffer.image_url} alt="" className="w-12 h-12 bg-white" />
                <div>
                  <h2 className="text-xl font-black text-white mb-1">{selectedOffer.name}</h2>
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded uppercase tracking-widest">Netto: €{selectedOffer.partner_payout?.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} className="text-slate-500">✕</button>
            </div>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto hide-scrollbar text-sm text-slate-300">
              <div className="bg-[#020617] p-4 rounded-xl border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Geo & Traffico</p>
                <p className="font-mono text-[11px] text-blue-200">{selectedOffer.allowed_countries || 'Italia (IT)'} • {selectedOffer.allowed_traffic || 'Social, Native, SEO'}</p>
              </div>
              <p className="font-mono text-[11px] leading-relaxed opacity-80">{selectedOffer.description}</p>
              {selectedOffer.restrictions && (
                <div className="bg-rose-900/10 border border-rose-500/20 p-4 rounded-xl">
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Divieti Assoluti</p>
                  <p className="text-[11px] font-mono text-rose-200/80">{selectedOffer.restrictions}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
              <button onClick={(e) => handleGetLink(selectedOffer, e)} className="flex-[2] text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white py-3.5 rounded-xl">Link S2S</button>
              <button onClick={(e) => {setIsOfferModalOpen(false); openSiteModal(selectedOffer, e);}} className="flex-1 text-[10px] font-black uppercase tracking-widest bg-white/5 text-white py-3.5 rounded-xl">Hub</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}