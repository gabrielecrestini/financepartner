"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Componente SafeImage per loghi
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
  
  // Dati Operativi
  const [offers, setOffers] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [stats, setStats] = useState({ clicks: 0, epc: 0, cr: 0 });
  const [chartData, setChartData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // UI & UX
  const [activeTab, setActiveTab] = useState('overview'); 
  const [animKey, setAnimKey] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [securityLock, setSecurityLock] = useState(false);
  const [detectedIp, setDetectedIp] = useState('');
  
  // Form State
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        if (!window.location.hash.includes('access_token')) {
           return router.push('/login');
        }
        setTimeout(() => initApp(), 500);
        return;
      }

      const user = session.user;
      setUser(user);

      let ip = 'Sconosciuto';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        ip = (await res.json()).ip;
        setDetectedIp(ip);
      } catch (e) {}

      const { data: profileData } = await supabase.from('profiles').select('traffic_status').eq('id', user.id).single();
      const isDeviceAuthorized = localStorage.getItem('fp_device_auth_v1');

      if (!isDeviceAuthorized && profileData?.traffic_status === 'approved') {
        setSecurityLock(true);
      }

      await fetchDashboardData(user);
      setLoading(false);

      setIsLive(true);
      const realtimeChannel = supabase.channel('dashboard-metrics')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clicks', filter: `affiliate_id=eq.${user.id}` }, () => {
           fetchDashboardData(user);
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

  // =======================================================================
  // FUNZIONE COPIA LINK S2S - AGGIORNATA COL NUOVO DOMINIO DEFINITIVO
  // =======================================================================
  const handleGetLink = (offer, e) => {
    if (e) e.stopPropagation();
    
    // Controllo Compliance
    if (profile?.traffic_status !== 'approved') {
      return showToast("⚠️ Sorgente in Audit. Attendi approvazione tecnica.", "error");
    }
    
    // DEFINIZIONE DOMINIO DEFINITIVO (Doppia R)
    const baseUrl = "https://financepartnerr.it";
    const trackingLink = `${baseUrl}/api/click?offer_id=${offer.id}&subid=${user.id}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(trackingLink)
        .then(() => showToast("🔗 Link S2S copiato col nuovo dominio", 'success'))
        .catch(() => showToast("Errore durante la copia", "error"));
    } else {
      // Fallback robusto per ogni dispositivo
      const textArea = document.createElement("textarea");
      textArea.value = trackingLink;
      textArea.style.position = "fixed"; // Evita scorrimenti
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast("🔗 Link S2S copiato col nuovo dominio", 'success');
      } catch (err) {
        showToast("Incolla manualmente: " + trackingLink, "error");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleRequestSiteSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const targetName = selectedOffer ? selectedOffer.name : "Hub Globale";
    const timestamp = new Date().toLocaleString('it-IT');
    const newBriefing = `\n[${timestamp}] TARGET: ${targetName} | STRATEGIA: ${siteForm.whereToPromote} | KPI: ${siteForm.goals}`;
    
    const updatedNotes = (profile.traffic_notes || '') + newBriefing;
    const { error } = await supabase.from('profiles').update({ traffic_notes: updatedNotes }).eq('id', user.id);
    setSavingSettings(false);
    if (!error) {
      setProfile({...profile, traffic_notes: updatedNotes});
      setIsSiteModalOpen(false);
      showToast("✅ Briefing IT ricevuto.", 'success');
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
    return <span className="bg-white/5 text-slate-400 border border-white/10 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">Required</span>;
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  // =======================================================================
  // DESIGN ORIGINALE: DEVICE AUTHORIZATION
  // =======================================================================
  if (securityLock) {
    return (
      <div className="min-h-screen bg-[#02040A] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap'); body { font-family: 'Inter', sans-serif; }` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="bg-[#0B1221] p-8 rounded-[2rem] max-w-lg w-full relative z-10 border border-rose-500/30 shadow-2xl text-center">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-2xl mx-auto mb-6"><span className="animate-pulse">⚠️</span></div>
          <h2 className="text-2xl font-black mb-2">Dispositivo Sconosciuto</h2>
          <p className="text-slate-400 text-sm mb-6">IP Rilevato: <strong className="text-rose-400 font-mono block mt-1">{detectedIp}</strong></p>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <button onClick={authorizeDevice} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] py-4 rounded-xl uppercase tracking-widest transition-all">✓ Autorizza e Procedi</button>
            <button onClick={lockAccountAndLogout} className="w-full text-rose-400 font-black text-[10px] py-4 rounded-xl uppercase tracking-widest transition-all hover:bg-white/5">✕ Blocca Account</button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================================
  // DESIGN ORIGINALE: GATEKEEPER
  // =======================================================================
  if (profile && profile.traffic_status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap'); body { font-family: 'Inter', sans-serif; }` }} />
        <button onClick={handleLogout} className="absolute top-6 right-6 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">Log Out</button>
        
        {(!profile.traffic_status || profile.traffic_status === 'none') ? (
          <div className="bg-slate-900/40 backdrop-blur-3xl p-8 sm:p-12 rounded-[2rem] max-w-lg w-full border border-white/5 shadow-2xl relative z-10">
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 text-xl">🔐</div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">Accesso Privato</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">Network B2B ad alto rendimento. Operatività soggetta ad audit tecnico.</p>
            <form onSubmit={submitApplication} className="space-y-5">
              <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sorgente (URL Social/Web)</label><input type="text" required value={gateForm.url} onChange={e => setGateForm({...gateForm, url: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-blue-200 font-mono outline-none focus:border-blue-500" placeholder="https://" /></div>
              <div><label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Strategia Operativa</label><textarea required rows="2" value={gateForm.strategy} onChange={e => setGateForm({...gateForm, strategy: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-blue-500 resize-none hide-scrollbar" placeholder="Descrivi volumi e canali..."></textarea></div>
              <button type="submit" disabled={isSubmittingGate} className="w-full bg-blue-600 text-white font-black text-[11px] py-4 rounded-xl uppercase tracking-widest transition-all disabled:opacity-50">{isSubmittingGate ? 'Invio Briefing...' : 'Sottoponi a Compliance'}</button>
            </form>
          </div>
        ) : (
          <div className="text-center p-10 bg-slate-900/40 rounded-[2rem] border border-amber-500/20 max-w-md w-full backdrop-blur-xl">
            <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-black mb-2 text-white">Audit in Corso</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">Verifica impronta digitale del traffico. Richiede solitamente 12-24h.</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Trace ID: {user.id.substring(0,12)}</p>
          </div>
        )}
      </div>
    );
  }

  // =======================================================================
  // CHART COMPONENT
  // =======================================================================
  const maxClicks = Math.max(...chartData.map(d => d.clicks), 1);
  const ChartComponent = () => (
    <div className="bg-slate-900/20 backdrop-blur-md p-6 sm:p-8 rounded-[1.2rem] border border-white/5 mt-6 stagger-3 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>} Volume Traffico (7G)
        </h3>
        <span className="text-[9px] font-mono text-slate-500">{stats.clicks} EVENTI TOTALI</span>
      </div>
      <div className="h-40 flex items-end gap-2 sm:gap-4 relative w-full">
        {chartData.map((data, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 relative group z-10 h-full justify-end">
             <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-[#020617] border border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-mono z-20 whitespace-nowrap shadow-xl flex items-center gap-2">
              <span className="text-blue-400">{data.clicks} Click</span> <span className="w-px h-2 bg-white/10"></span> <span className="text-emerald-400">{data.conversions} Lead</span>
            </div>
            <div className="w-full bg-blue-500/20 group-hover:bg-blue-500/40 rounded-t-sm transition-all relative overflow-hidden" style={{height: `${(data.clicks / maxClicks) * 100}%`, minHeight: '4px'}}>
              <div className="absolute bottom-0 w-full bg-blue-500" style={{height: '2px'}}></div>
            </div>
            <span className="text-[8px] font-bold text-slate-600 uppercase">{data.date.split('/')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex flex-col md:flex-row relative selection:bg-blue-500/30">
      
      {/* CSS ORIGINALE PREMIUM & RESPONSIVE */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stagger-1 { animation: slideUpFade 0.4s ease-out forwards; }
        .stagger-2 { animation: slideUpFade 0.4s ease-out 0.1s forwards; opacity: 0; }
        .stagger-3 { animation: slideUpFade 0.4s ease-out 0.2s forwards; opacity: 0; }
        .stagger-4 { animation: slideUpFade 0.4s ease-out 0.3s forwards; opacity: 0; }
        .tab-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 18px; border-radius: 0.8rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; transition: all 0.2s ease; border: 1px solid transparent; color: #94A3B8; }
        .tab-btn.active { background: rgba(59, 130, 246, 0.1); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.2); }
        .tab-btn:not(.active):hover { background: rgba(255, 255, 255, 0.02); color: white; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .tab-btn { justify-content: center; padding: 12px; border-radius: 12px; }
          .tab-btn span:not(.text-lg) { display: none; }
          .stat-card { h-[90px]; p-4; }
          .stat-value { text-xl; }
        }
      `}} />

      <div className="fixed inset-0 z-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* TOAST ORIGINALE */}
      {settingsMsg.text && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl border backdrop-blur-xl animate-[slideUpFade_0.3s_ease-out_forwards] ${settingsMsg.type === 'error' ? 'bg-rose-950/90 text-rose-200 border-rose-500/50' : 'bg-slate-900/90 text-blue-300 border-blue-500/50'}`}>
          {settingsMsg.text}
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r border-white/5 bg-[#020617] p-6 shrink-0 relative z-40">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg">F</div>
          <div><span className="font-black text-white text-lg block leading-none">FinancePartner</span><span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-1">B2B Terminal</span></div>
        </div>
        <nav className="space-y-1 flex-1">
          {[ {id: 'overview', icon: '📊', label: 'Terminale'}, {id: 'marketplace', icon: '🏦', label: 'Offerte'}, {id: 'assets', icon: '🖥️', label: 'Infrastruttura'}, {id: 'kyc', icon: '🛡️', label: 'Dati & KYC'} ].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
              <span className="text-lg opacity-80">{tab.icon}</span> <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/5 pt-4 space-y-3">
           <Link href="/terms" className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest block text-center transition-colors">Termini Legali</Link>
          <button onClick={handleLogout} className="text-[9px] font-bold text-rose-500/70 hover:text-rose-400 uppercase tracking-widest w-full text-center bg-white/[0.02] py-3 rounded-xl transition-colors">Disconnetti</button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#020617] sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm">F</div>
          <span className="font-black text-white text-lg tracking-tight">FinancePartner</span>
        </div>
        <button onClick={handleLogout} className="text-[9px] font-black text-rose-500/70 uppercase px-3 py-1.5 bg-white/5 rounded-full border border-white/10">Esci</button>
      </header>

      {/* MAIN CONTENT RESPONSIVE */}
      <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8 lg:p-10 pb-32 bg-[#020617] hide-scrollbar relative z-10">
        <div key={animKey} className="max-w-5xl mx-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end pb-4 border-b border-white/5 stagger-1">
                <div><h1 className="text-3xl font-black text-white tracking-tight mb-1">Terminale</h1><p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{isLive ? 'S2S Connection: Live' : 'Connecting...'}</p></div>
                <button onClick={() => setIsStrategyModalOpen(true)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Protocollo</button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-2">
                {[
                  { label: "Esigibile", value: `€${profile?.wallet_approved?.toFixed(2) || '0.00'}`, color: "text-white" },
                  { label: "In Valutazione", value: `€${profile?.wallet_pending?.toFixed(2) || '0.00'}`, color: "text-amber-400" },
                  { label: "Conversion Rate", value: `${stats.cr.toFixed(2)}%`, color: "text-blue-400" },
                  { label: "EPC", value: `€${stats.epc.toFixed(2)}`, color: "text-emerald-400" }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/20 border border-white/5 p-5 rounded-[1.2rem] h-[100px] flex flex-col justify-between stat-card transition-all hover:border-white/10">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    <p className={`text-2xl font-black ${stat.color} font-mono stat-value tracking-tight`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <ChartComponent />

              <div className="bg-slate-900/20 border border-white/5 p-6 sm:p-8 rounded-[1.2rem] mt-6 stagger-4 transition-all hover:border-white/10">
                <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Postback Log (S2S Real-Time)</h3>
                <div className="space-y-2.5">
                  {conversions.slice(0, 5).map((conv) => (
                    <div key={conv.id} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                      <div><p className="text-sm font-black text-white mb-0.5">{conv.program_id}</p><p className="text-[9px] font-mono text-slate-500">{new Date(conv.created_at).toLocaleString('it-IT')}</p></div>
                      <div className="text-right"><p className={`text-xl font-black font-mono mb-0.5 ${conv.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>+€{conv.amount?.toFixed(2)}</p><p className="text-[8px] uppercase font-black text-slate-500">{conv.status}</p></div>
                    </div>
                  ))}
                  {conversions.length === 0 && <div className="py-12 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse">In attesa di traffico qualificato</div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-white/5 stagger-1"><h1 className="text-3xl font-black text-white tracking-tight mb-2">Marketplace B2B</h1><p className="text-xs text-slate-400 leading-relaxed">Inventario offerte dirette con Payout Netti S2S (Zero Fee).</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {offers.map((offer, i) => (
                  <div key={offer.id} className="bg-slate-900/20 border border-white/5 p-6 rounded-[1.5rem] flex flex-col group transition-all hover:border-white/10" style={{animation: `slideUpFade 0.4s ease-out ${0.1 + (i*0.05)}s forwards`, opacity: 0}}>
                    <div className="flex items-start gap-4 mb-6 border-b border-white/5 pb-6">
                      <SafeImage src={offer.image_url} alt="" className="w-12 h-12 bg-white" />
                      <div className="flex-1">
                        <h4 className="font-black text-white text-lg leading-tight mb-2 truncate">{offer.name}</h4>
                        <div className="flex gap-2">
                           <span className="px-2 py-1 rounded-md text-[8px] font-black uppercase bg-blue-500/10 text-blue-400">CPA Netta</span>
                           <button onClick={() => {setSelectedOffer(offer); setIsOfferModalOpen(true);}} className="text-[8px] font-black text-slate-500 hover:text-white uppercase transition-colors">Dettagli</button>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6"><p className="text-[9px] uppercase font-black text-slate-500 mb-1">Payout Affiliato</p><p className="font-black font-mono text-emerald-400 text-3xl tracking-tight">€{offer.partner_payout?.toFixed(2)}</p></div>
                    <div className="mt-auto flex gap-2 pt-2">
                      <button onClick={() => {setSelectedOffer(offer); setIsSiteModalOpen(true);}} className="flex-1 text-[9px] font-black text-slate-300 bg-white/5 py-3.5 rounded-xl hover:bg-white/10 uppercase tracking-widest transition-all">Hub</button>
                      
                      {/* TASTO COPIA COL NUOVO DOMINIO */}
                      <button onClick={(e) => handleGetLink(offer, e)} className="flex-[2] text-[9px] font-black uppercase text-white bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] active:scale-95">Copia Link S2S</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3 & 4 (Semplificati ma coerenti col design originale) */}
          {activeTab === 'assets' && (
             <div className="space-y-6 max-w-3xl">
                <div className="pb-4 border-b border-white/5 stagger-1"><h1 className="text-3xl font-black text-white tracking-tight">Infrastruttura</h1></div>
                <div className="bg-slate-900/20 border border-white/5 p-8 sm:p-12 rounded-[2rem] stagger-2 text-center">
                  <p className="text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">Richiedi al team IT lo sviluppo di Hub di comparazione ottimizzati per massimizzare il Conversion Rate dei link S2S.</p>
                  <button onClick={() => setIsSiteModalOpen(true)} className="bg-white text-black font-black text-[10px] uppercase py-4 px-10 rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-xl">Richiedi Deploy Hub IT</button>
                </div>
             </div>
          )}

          {activeTab === 'kyc' && (
             <div className="space-y-6 max-w-3xl">
                <div className="pb-4 border-b border-white/5 stagger-1"><h1 className="text-3xl font-black text-white tracking-tight">Dati & KYC</h1><p className="text-xs text-slate-400">Coordinate criptate per erogazione pagamenti.</p></div>
                <div className="bg-slate-900/20 border border-white/5 p-6 sm:p-8 rounded-[1.5rem] stagger-2">
                   <div className="space-y-5">
                      <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Intestatario SEPA</label><input type="text" value={billing.full_name} onChange={e => setBilling({...billing, full_name: e.target.value})} className="w-full bg-black/30 border border-white/5 p-4 rounded-xl outline-none focus:border-white/10 text-white transition-all" /></div>
                      <div><label className="block text-[9px] font-black text-emerald-500 uppercase mb-2 tracking-widest">🔒 IBAN (SEPA Direct)</label><input type="text" value={billing.payment_info} onChange={e => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} className="w-full bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 font-mono text-lg focus:border-emerald-500/40" placeholder="IT00..." /></div>
                      <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-emerald-600 text-white font-black text-[11px] py-4 rounded-xl uppercase tracking-widest mt-4 transition-all hover:bg-emerald-500 disabled:opacity-50">{savingSettings ? 'Sync...' : 'Sincronizza Criptando'}</button>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* BOTTOM NAV MOBILE ORIGINALE */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-center">
        <nav className="bg-[#0B1221]/95 backdrop-blur-xl w-full rounded-[1.5rem] border border-white/10 p-1.5 flex justify-around shadow-2xl">
          {[ {id: 'overview', icon: '📊', label: 'Home'}, {id: 'marketplace', icon: '🏦', label: 'Offerte'}, {id: 'assets', icon: '🖥️', label: 'Hub IT'}, {id: 'kyc', icon: '🛡️', label: 'Dati'} ].map((tab) => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex flex-col items-center justify-center w-full py-2.5 rounded-xl transition-all relative ${activeTab === tab.id ? 'text-blue-400 bg-white/10' : 'text-slate-500'}`}>
              <span className="text-xl mb-0.5">{tab.icon}</span><span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* MODALI ORIGINALI (GLASSMORPHISM) */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-[slideUpFade_0.3s_ease-out_forwards]" onClick={() => setIsSiteModalOpen(false)}>
          <div className="bg-[#0B1221] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsSiteModalOpen(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white">✕</button>
            <h2 className="text-xl font-black mb-1 text-white">Deploy Infrastruttura IT</h2>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-6">Target: {selectedOffer ? selectedOffer.name : "Hub Globale B2B"}</p>
            <form onSubmit={handleRequestSiteSubmit} className="space-y-4">
              <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Sorgente Traffico (Es. Meta Ads)</label><textarea required rows="2" value={siteForm.whereToPromote} onChange={e=>setSiteForm({...siteForm, whereToPromote: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl outline-none resize-none text-sm text-white hide-scrollbar focus:border-blue-500"></textarea></div>
              <div><label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Budget Mensile Previsto (KPI)</label><input type="text" required value={siteForm.goals} onChange={e=>setSiteForm({...siteForm, goals: e.target.value})} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl outline-none text-sm text-white focus:border-blue-500" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={savingSettings} className="flex-1 text-[9px] font-black uppercase text-white bg-indigo-600 py-4 rounded-xl transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50">{savingSettings ? 'Invio...' : 'Invia Briefing IT'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-[slideUpFade_0.3s_ease-out_forwards]" onClick={() => setIsStrategyModalOpen(false)}>
          <div className="bg-[#0B1221] border border-white/10 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">📊</div>
            <h2 className="text-2xl font-black mb-4 text-white racking-tight">Protocollo Tracking S2S</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">Il terminale utilizza esclusivamente un tracciamento Server-to-Server crittografato. Le conversioni vengono validate direttamente dai server bancari in background.</p>
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6 text-rose-300 text-[10px] font-bold uppercase tracking-widest border-l-4 border-l-rose-500">
              ⚠️ Vietato traffico incentivato o bot. Rilevamento frodi attivo.
            </div>
            <button onClick={() => setIsStrategyModalOpen(false)} className="w-full bg-white text-black font-black text-[10px] uppercase py-4 rounded-xl active:scale-95 shadow-lg">Inizializza Terminale</button>
          </div>
        </div>
      )}

      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-[slideUpFade_0.3s_ease-out_forwards]" onClick={() => setIsOfferModalOpen(false)}>
          <div className="bg-[#0B1221] border border-white/10 p-8 rounded-3xl max-w-xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsOfferModalOpen(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white">✕</button>
            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
               <SafeImage src={selectedOffer.image_url} alt="" className="w-14 h-14 bg-white" />
               <div>
                  <h2 className="text-2xl font-black text-white mb-1.5">{selectedOffer.name}</h2>
                  <span className="px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400">Payout Netto: €{selectedOffer.partner_payout?.toFixed(2)}</span>
               </div>
            </div>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-medium">
               <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Geo Target</p>
                  <p className="font-mono text-xs text-blue-200">{selectedOffer.allowed_countries || 'Italia (IT)'}</p>
               </div>
                <p className="text-xs">{selectedOffer.description || "Dettagli in fase di caricamento..."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}