"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Componente per gestire loghi corrotti o mancanti con fallback elegante
const SafeImage = ({ src, alt, fallbackIcon = "🏦", className }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 border border-white/5 rounded-2xl text-3xl shadow-inner ${className}`}>
        <span className="opacity-40">{fallbackIcon}</span>
      </div>
    );
  }
  return (
    <div className={`bg-white rounded-2xl flex items-center justify-center p-3 shadow-lg shrink-0 border border-white/10 ${className}`}>
      <img src={src} alt={alt} onError={() => setError(true)} className="w-full h-full object-contain" />
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [stats, setStats] = useState({ clicks: 0, epc: 0, cr: 0 });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); 
  
  const [billing, setBilling] = useState({ full_name: '', entity_type: 'privato', vat_number: '', tax_id: '', address: '', payment_info: '', registered_website: '', traffic_volume: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });
  
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [siteForm, setSiteForm] = useState({ whereToPromote: '', goals: '' });
  
  const router = useRouter();
  const mainContentRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const savedTab = localStorage.getItem('fp_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    // Animazione di transizione tab
    if (mainContentRef.current) {
      mainContentRef.current.style.opacity = 0;
      mainContentRef.current.style.transform = 'translateY(10px)';
    }
    setTimeout(() => {
      setActiveTab(tab);
      localStorage.setItem('fp_active_tab', tab);
      if (mainContentRef.current) {
        mainContentRef.current.style.opacity = 1;
        mainContentRef.current.style.transform = 'translateY(0px)';
      }
    }, 200);
  };

  useEffect(() => {
    if (!isMounted) return;

    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setUser(user);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const { ip } = await res.json();
        if (profileData && profileData.last_ip !== ip) {
           await supabase.from('profiles').update({ last_ip: ip }).eq('id', user.id);
        }
      } catch (e) { console.log("Network Secured"); }

      setProfile(profileData);
      if (profileData) {
        setBilling({ full_name: profileData.full_name || '', entity_type: profileData.entity_type || 'privato', vat_number: profileData.vat_number || '', tax_id: profileData.tax_id || '', address: profileData.address || '', payment_info: profileData.payment_info || '', registered_website: profileData.registered_website || '', traffic_volume: profileData.traffic_volume || '' });
      }

      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications(notifs || []);

      const { data: offersData } = await supabase.from('offers').select('*');
      setOffers(offersData || []);

      const { data: convData } = await supabase.from('conversions').select('*').eq('partner_id', user.id).order('created_at', { ascending: false });
      setConversions(convData || []);

      const { count: totalClicks } = await supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('affiliate_id', user.id);
      
      const convs = convData || [];
      const totalApproved = profileData?.wallet_approved || 0;
      const totalConversions = convs.filter(c => c.status === 'approved').length;

      setStats({ clicks: totalClicks || 0, epc: totalClicks > 0 ? (totalApproved / totalClicks) : 0, cr: totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0 });

      if (totalClicks === 0 && (!profileData || !profileData.assigned_site_link)) {
        setTimeout(() => setIsStrategyModalOpen(true), 1000);
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, [isMounted, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleGetLink = (offer, e) => {
    if (e) e.stopPropagation();
    if (profile?.traffic_status !== 'approved') {
      alert("🔒 PROTOCOLLO SICUREZZA: Accesso ai link negato.\nLa tua sorgente di traffico non è stata ancora validata dal dipartimento Compliance.");
      handleTabChange('assets'); return;
    }
    const trackingLink = `${window.location.origin}/api/click?offer_id=${offer.id}&subid=${user.id}`;
    navigator.clipboard.writeText(trackingLink);
    // Notifica custom invece di alert standard per fluidità
    setSettingsMsg({text: "🔗 Link copiato crittografato", type: 'success'});
    setTimeout(() => setSettingsMsg({text: '', type: ''}), 2500);
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

  const openSiteModal = (offer, e) => {
    if (e) e.stopPropagation();
    setSelectedOffer(offer);
    setIsSiteModalOpen(true);
  };

  const handleRequestSiteSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const isSingleOffer = selectedOffer && selectedOffer.id;
    const trackingLinkToProvide = isSingleOffer ? `${window.location.origin}/api/click?offer_id=${selectedOffer.id}&subid=${user.id}` : `Hub richiesto per SubID: ${user.id}`;
    const adminBriefing = `🎯 ASSET RICHIESTO: ${isSingleOffer ? selectedOffer.name : "Hub Globale"}\n🔗 LINK S2S: ${trackingLinkToProvide}\n📱 STRATEGIA: ${siteForm.whereToPromote}\n💰 KPI: ${siteForm.goals}`;

    const { error } = await supabase.from('profiles').update({ traffic_status: 'pending', traffic_volume: siteForm.goals, traffic_notes: adminBriefing }).eq('id', user.id);
    setSavingSettings(false);
    if (!error) {
      setProfile({...profile, traffic_status: 'pending'});
      setIsSiteModalOpen(false);
      setSettingsMsg({text: "✅ Richiesta infrastruttura inviata", type: 'success'});
      setTimeout(() => setSettingsMsg({text: '', type: ''}), 3000);
      setSiteForm({ whereToPromote: '', goals: '' });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMsg({ text: '', type: '' });
    if (billing.payment_info) {
      const ibanRegex = /^[a-zA-Z]{2}[0-9a-zA-Z]{13,32}$/;
      if (!ibanRegex.test(billing.payment_info.replace(/\s+/g, ''))) { setSettingsMsg({ text: 'IBAN SEPA non valido.', type: 'error' }); setSavingSettings(false); return; }
    }
    const { error } = await supabase.from('profiles').update({...billing, payment_info: billing.payment_info.replace(/\s+/g, '').toUpperCase()}).eq('id', user.id);
    setSavingSettings(false);
    if (!error) {
      setSettingsMsg({ text: 'Dati sincronizzati con successo.', type: 'success' });
      setProfile({...profile, ...billing}); 
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 4000);
    } else { setSettingsMsg({ text: 'Errore di sincronizzazione.', type: 'error' }); }
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-[#030509] flex items-center justify-center"><div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#030509] text-slate-300 font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-blue-600/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); } 50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.5); } }
        @keyframes glitch { 0% { text-shadow: 0.5px 0 0 #00f2fe, -0.5px 0 0 #4facfe; } 100% { text-shadow: -0.5px 0 0 #00f2fe, 0.5px 0 0 #4facfe; } }
        .pro-panel { background: rgba(13, 17, 28, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.03); box-shadow: 0 10px 40px -10px rgba(0,0,0,0.7); transition: all 0.3s ease; animation: fadeInUp 0.5s ease backwards; }
        .pro-panel:hover { border-color: rgba(59, 130, 246, 0.2); box-shadow: 0 15px 50px -10px rgba(0,0,0,0.8); }
        .data-input { background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.05); color: white; padding: 18px; border-radius: 14px; width: 100%; outline: none; transition: all 0.2s ease; font-size: 0.9rem; }
        .data-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); background: rgba(0, 0, 0, 0.7); }
        .data-input:disabled { opacity: 0.4; cursor: not-allowed; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .animate-view { animation: fadeInUp 0.4s ease backwards; }
        .glitch-text { animation: glitch 0.1s infinite alternate; }
        .status-badge { padding: 4px 12px; rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max border; }
        .accent-glow { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; opacity: 0.15; }
        .tab-btn { position: relative; width: 100%; text-left; px-5; py-4; rounded-xl; text-xs; uppercase; tracking-widest; font-bold; transition: all 0.2s ease; border: 1px solid transparent; }
        .tab-btn.active { bg-[#0D111C]; text-blue-400; border-color: rgba(59, 130, 246, 0.2); box-shadow: 0 0 15px rgba(59, 130, 246, 0.1); }
        .tab-btn:not(.active):hover { bg-white/5; text-white; }
      `}} />

      {/* SFONDO ACCENTI TECNOLOGICI */}
      <div className="accent-glow w-[600px] h-[600px] bg-blue-600 -top-40 -left-40"></div>
      <div className="accent-glow w-[500px] h-[500px] bg-indigo-600 -bottom-40 -right-40 opacity-10"></div>
      
      {/* --- NOTIFICHE FLOATMSG --- */}
      {settingsMsg.text && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] p-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-2xl animate-view border ${settingsMsg.type === 'error' ? 'bg-rose-900 text-rose-200 border-rose-700' : 'bg-blue-950 text-blue-200 border-blue-800'}`}>
          {settingsMsg.text}
        </div>
      )}

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-5 border-b border-white/5 bg-[#030509]/90 backdrop-blur-lg z-40 relative shadow-lg">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">F</div>
           <span className="font-black text-white text-xl tracking-tight glitch-text">Finance<span className="text-blue-500">Partner</span></span>
        </div>
      </header>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-white/5 bg-[#030509] p-6 relative z-40 shrink-0">
        <div className="flex items-center gap-4 mb-14 mt-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/30">F</div>
          <span className="font-black text-white text-2xl tracking-tight">Finance<span className="text-blue-500">Partner</span></span>
        </div>
        
        <div className="space-y-3 flex-1">
          {['overview', 'marketplace', 'assets', 'kyc'].map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
              {tab === 'overview' && '📊 Terminale'}
              {tab === 'marketplace' && '🏦 Offerte'}
              {tab === 'assets' && '📱 Infrastrutture'}
              {tab === 'kyc' && '🛡️ Dati Fiscali'}
              {(tab === 'assets' || tab === 'kyc') && profile?.[tab + '_status'] === 'pending' && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
            </button>
          ))}
        </div>
        
        <div className="mt-auto p-6 bg-[#0D111C] rounded-2xl border border-white/5 mb-4 text-center backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/5 pulse-glow pointer-events-none"></div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 relative z-10">Network Direct Support</p>
          <a href="mailto:financepartner@gmail.com" className="text-xs font-bold text-blue-400 break-words hover:text-blue-300 transition-colors relative z-10">financepartner@gmail.com</a>
        </div>
        <button onClick={handleLogout} className="text-[11px] font-bold text-slate-600 hover:text-rose-400 py-3 uppercase tracking-widest transition-colors w-full text-center">Termina Sessione</button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main ref={mainContentRef} className="flex-1 h-screen overflow-y-auto p-6 sm:p-12 pb-32 relative z-10 hide-scrollbar transition-all duration-300">
        <div className="max-w-[1200px] mx-auto">

          {/* VISTA 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-view">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5 relative">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Terminale Dati v3.0</h1>
                  <p className="text-sm text-slate-500 mt-2 font-mono">OPERATOR_ID: {user.id.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsStrategyModalOpen(true)} className="flex items-center gap-3 bg-[#0D111C] border border-emerald-900 hover:border-emerald-600 text-emerald-300 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg">
                    <span className="text-lg">🧠</span> Protocollo Operativo
                  </button>
                  <button onClick={markNotificationsAsRead} className="relative w-14 h-14 bg-[#0D111C] rounded-xl flex items-center justify-center text-xl hover:border-blue-700 transition-colors border border-white/5 text-white">
                    🔔
                    {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-blue-600/50 animate-pulse">{unreadCount}</span>}
                  </button>
                </div>
              </div>
              
              {profile?.assigned_site_link && (
                <div className="pro-panel p-9 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border-l-4 border-l-blue-600 relative overflow-hidden" style={{animationDelay: '0.1s'}}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 flex-1">
                    <h3 className="text-2xl font-black mb-3 flex items-center gap-3 glitch-text">🚀 Infrastruttura Online</h3>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-xl">L'IT ha rilasciato la tua infrastruttura di conversione crittografata con tracciamento S2S attivo. Usa questo URL ufficiale per l'acquisizione.</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto shrink-0 relative z-10">
                    <input type="text" readOnly value={profile.assigned_site_link} className="bg-black/40 border border-blue-500/30 text-blue-300 px-6 py-4 rounded-xl font-mono text-sm w-full md:w-[300px] outline-none" />
                    <button onClick={() => {navigator.clipboard.writeText(profile.assigned_site_link); alert("🔗 URL Infrastruttura Copiato!");}} className="bg-blue-600 text-white font-bold px-6 py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg active:scale-95 uppercase tracking-widest text-xs">Copia URL Ufficiale</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                <div className="pro-panel p-7 sm:p-8 rounded-[1.8rem]" style={{animationDelay: '0.1s'}}><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commissioni Nette</span><p className="text-3xl sm:text-4xl font-black text-white mt-3 group-hover:text-blue-400">€{profile?.wallet_approved?.toFixed(2)}</p></div>
                <div className="pro-panel p-7 sm:p-8 rounded-[1.8rem]" style={{animationDelay: '0.2s'}}><span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">In Valutazione</span><p className="text-3xl sm:text-4xl font-black text-amber-400 mt-3">€{profile?.wallet_pending?.toFixed(2)}</p></div>
                <div className="pro-panel p-7 sm:p-8 rounded-[1.8rem]" style={{animationDelay: '0.3s'}}><span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Conversion Rate</span><p className="text-3xl sm:text-4xl font-black text-blue-400 mt-3">{stats.cr.toFixed(2)}%</p></div>
                <div className="pro-panel p-7 sm:p-8 rounded-[1.8rem]" style={{animationDelay: '0.4s'}}><span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">EPC Totale (Click)</span><p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-3">€{stats.epc.toFixed(2)}</p></div>
              </div>

              <div className="pro-panel rounded-[2rem] p-9 relative overflow-hidden" style={{animationDelay: '0.5s'}}>
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-600/30 to-transparent"></div>
                  <div className="flex justify-between items-center mb-9 border-b border-white/5 pb-5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-3"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-600/50"></span> Live Conversion Feed (S2S)</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-600">Performance Monitor attico</span>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto hide-scrollbar pr-1">
                    {conversions.slice(0, 6).map((conv, index) => (
                      <div key={conv.id} className="flex justify-between items-center p-5 rounded-xl bg-black/40 border border-white/5 hover:bg-black/60 transition-colors animate-view" style={{animationDelay: `${index * 50}ms`}}>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">{conv.program_id || 'Offerta Privata B2B'}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1.5">{new Date(conv.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black ${conv.status === 'approved' ? 'text-emerald-400' : conv.status === 'rejected' ? 'text-rose-500' : 'text-amber-400'}`}>+€{conv.amount?.toFixed(2)}</p>
                          <p className={`text-[9px] uppercase tracking-widest font-bold mt-1.5 ${conv.status === 'approved' ? 'text-emerald-600' : 'text-slate-500'}`}>{conv.status}</p>
                        </div>
                      </div>
                    ))}
                    {conversions.length === 0 && <p className="text-xs font-bold text-slate-700 text-center py-16 uppercase tracking-widest">Sincronizzazione dei dati Server-to-Server in attesa...</p>}
                  </div>
              </div>
            </div>
          )}

          {/* VISTA 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
             <div className="space-y-10 animate-view relative">
                <div className="accent-glow w-[300px] h-[300px] bg-blue-600 top-20 right-0 opacity-10"></div>
                <div className="pb-6 border-b border-white/5">
                  <h1 className="text-4xl font-black text-white tracking-tight">Marketplace B2B</h1>
                  <p className="text-sm text-slate-400 mt-2">Accordi diretti con gli istituti. Commissioni nette per l'operatore.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
                  {offers.map((offer, index) => (
                    <div key={offer.id} className="pro-panel p-8 sm:p-9 rounded-[2rem] flex flex-col relative group" style={{animationDelay: `${index * 70}ms`}}>
                      <div className="absolute top-7 right-7 hidden sm:block"><span className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border ${offer.payout_type === 'CPL' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-indigo-950 text-indigo-300 border-indigo-800'}`}>{offer.payout_type || 'CPA'} Model</span></div>
                      
                      <div className="flex items-center gap-7 mb-9 pb-6 border-b border-white/5">
                        <SafeImage src={offer.image_url} alt={offer.name} className="w-20 h-20" />
                        <div>
                          <h4 className="font-black text-white text-2xl line-clamp-1 group-hover:text-blue-400 transition-colors tracking-tight">{offer.name}</h4>
                          <button onClick={() => {setSelectedOffer(offer); setIsOfferModalOpen(true);}} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest mt-2 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg transition-colors border border-white/5">📄 Protocollo Campagna</button>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-5">
                        <div className="w-full sm:w-auto bg-black/40 px-5 py-3 rounded-xl border border-white/5">
                          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">Commissione Netta</p>
                          <p className="font-black text-emerald-400 text-3xl tracking-tight">€{offer.partner_payout?.toFixed(2)}</p>
                        </div>
                        <div className="flex w-full sm:w-auto gap-3 shrink-0">
                          <button onClick={(e) => openSiteModal(offer, e)} className="flex-1 sm:flex-none text-xs font-bold text-slate-300 bg-white/5 border border-white/5 px-7 py-4 rounded-xl hover:bg-white/10 transition-colors uppercase tracking-widest active:scale-95">Sito</button>
                          <button onClick={(e) => handleGetLink(offer, e)} className="flex-[2] sm:flex-none text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 px-9 py-4 rounded-xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all">Genera Link S2S</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
          
          {/* VISTA 3: ASSET E SORGENTI */}
          {activeTab === 'assets' && (
            <div className="space-y-10 max-w-4xl animate-view">
              <div className="pb-6 border-b border-white/5">
                <h1 className="text-4xl font-black text-white tracking-tight">Audit Sorgenti & Asset</h1>
                <p className="text-sm text-slate-400 mt-2">Zero pubblicità, zero lentezza. Validiamo la qualità del traffico per payout massimi.</p>
              </div>
              
              <div className="pro-panel p-9 rounded-[2rem]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-9 border-b border-white/5 pb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">1. Validazione Canale Acquisizione Privato</h2>
                    <p className="text-xs text-slate-400 mt-1">Richiesto per abilitazione dei link manuali del Marketplace.</p>
                  </div>
                  <div className={`status-badge ${profile?.traffic_status === 'approved' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : profile?.traffic_status === 'pending' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-black/40 text-slate-500 border-white/5'}`}>{profile?.traffic_status === 'approved' ? '✅ Verificato' : profile?.traffic_status === 'pending' ? '⏳ In Revisione' : '⚠️ Candidatura'}</div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Dominio/Profilo Ufficiale (No Link Ads)</label>
                      <input type="url" value={billing.registered_website} onChange={(e) => setBilling({...billing, registered_website: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input text-blue-300 font-mono disabled:bg-slate-900" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">KPI Volume Fuoco Stimato (Es. 50 Lead/Giorno)</label>
                      <input type="text" value={billing.traffic_volume} onChange={(e) => setBilling({...billing, traffic_volume: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input text-slate-300 disabled:bg-slate-900" placeholder="Es. 1000€ budget Meta Ads" />
                    </div>
                  </div>
                  
                  {(!profile?.traffic_status || profile?.traffic_status === 'none') && (
                    <div className="pt-3 text-right">
                      <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-12 py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest border border-blue-400">
                        Invia a Dipartimento Compliance
                      </button>
                    </div>
                  )}
                </div>

                {profile?.traffic_status === 'pending' && profile?.traffic_notes && (
                  <div className="mt-9 p-7 rounded-2xl border border-amber-800 bg-amber-950/50">
                    <h3 className="text-sm font-bold text-amber-300 mb-3.5 flex items-center gap-2">⏳ Analisi Briefing Operativo</h3>
                    <p className="text-xs text-amber-100 leading-relaxed font-mono bg-black/50 p-6 rounded-xl border border-white/5">{profile.traffic_notes}</p>
                  </div>
                )}
              </div>

              <div className="pro-panel p-9 rounded-[2rem] border-l-4 border-l-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/5 pulse-glow pointer-events-none"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h2 className="text-2xl font-black text-white glitch-text tracking-tight">2. Richiedi Deploy Infrastruttura "Turn-Key"</h2>
                  <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold px-4 py-1.5 rounded-lg text-[9px] uppercase tracking-widest">Protocollo B2B</span>
                </div>
                <p className="text-sm text-slate-400 mb-9 leading-relaxed relative z-10 max-w-2xl">I nostri ingegneri IT costruiranno una Landing Page o un Hub di comparazione ottimizzato per la conversione. Riceverai un URL definitivo crittografato pronto per le campagne su Meta, Google o TikTok. Nessun costo di server o manutenzione.</p>
                <button onClick={() => {setSelectedOffer(null); setIsSiteModalOpen(true);}} className="w-full sm:w-auto bg-white hover:bg-slate-200 text-black font-black text-xs uppercase tracking-widest px-11 py-4.5 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-95 relative z-10">
                  Avvia Richiesta Deploy Hub
                </button>
              </div>
            </div>
          )}

          {/* VISTA 4: KYC E FATTURAZIONE */}
          {activeTab === 'kyc' && (
             <div className="space-y-10 max-w-4xl animate-view">
               <div className="pb-6 border-b border-white/5">
                 <h1 className="text-4xl font-black text-white tracking-tight">Administrative & Payout</h1>
                 <p className="text-sm text-slate-400 mt-2">Sincronizzazione dei dati fiscali. Ciclo pagamenti mensile al 15 di ogni mese.</p>
               </div>
               
               <div className="pro-panel p-9 rounded-[2rem]">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-9 border-b border-white/5 pb-6">
                   <h2 className="text-xl font-bold text-white tracking-tight">Anagrafica & IBAN</h2>
                   <div className={`status-badge ${profile?.kyc_status === 'approved' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : profile?.kyc_status === 'pending' ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-black/40 text-slate-500 border-white/5'}`}>{profile?.kyc_status === 'approved' ? '✅ Verificato' : profile?.kyc_status === 'pending' ? '⏳ Revisione' : '⚠️ Da Compilare'}</div>
                 </div>

                 <div className="space-y-7">
                  <div className="flex p-1.5 bg-black/50 rounded-xl w-full sm:w-max border border-white/5">
                    <button onClick={() => setBilling({...billing, entity_type: 'privato'})} disabled={profile?.kyc_status === 'approved'} className={`px-9 py-3.5 text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'privato' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Privato</button>
                    <button onClick={() => setBilling({...billing, entity_type: 'azienda'})} disabled={profile?.kyc_status === 'approved'} className={`px-9 py-3.5 text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'azienda' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}>Partita IVA</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-black/20 p-6 rounded-2xl border border-white/5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Intestatario Fiscale del Conto</label>
                      <input type="text" value={billing.full_name} onChange={(e) => setBilling({...billing, full_name: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input" placeholder="Nome Completo o Ragione Sociale" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Codice Fiscale</label>
                      <input type="text" value={billing.tax_id} onChange={(e) => setBilling({...billing, tax_id: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input uppercase font-mono disabled:bg-slate-900" placeholder="RSSMRA..." />
                    </div>
                    {billing.entity_type === 'azienda' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Partita IVA</label>
                        <input type="text" value={billing.vat_number} onChange={(e) => setBilling({...billing, vat_number: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input font-mono disabled:bg-slate-900" placeholder="IT0123..." />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Indirizzo di Residenza o Sede</label>
                      <input type="text" value={billing.address} onChange={(e) => setBilling({...billing, address: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input" placeholder="Via Roma 1, Milano" />
                    </div>
                    
                    <div className="sm:col-span-2 mt-4 pt-6 border-t border-white/10">
                      <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">IBAN Accredito SEPA (Sincronizzazione Crittografata)</label>
                      <input type="text" value={billing.payment_info} onChange={(e) => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input text-2xl font-mono uppercase tracking-[0.2em] border-emerald-700/60 focus:border-emerald-500 bg-emerald-950/10 text-emerald-300 disabled:bg-emerald-950/30" placeholder="IT00X00000000000000000" />
                    </div>
                  </div>

                  {(!profile?.kyc_status || profile?.kyc_status === 'none' || profile?.kyc_status === 'pending') && (
                    <div className="pt-4 text-right">
                      <button onClick={handleSaveSettings} disabled={savingSettings || profile?.kyc_status === 'approved'} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-12 py-4.5 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest disabled:opacity-40 border border-emerald-400">
                        {savingSettings ? 'Sincronizzazione AES-256...' : 'Sincronizza Dati Fiscali'}
                      </button>
                    </div>
                  )}
                </div>
               </div>
             </div>
          )}
        </div>
      </main>

      {/* BOTTOM BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#030509]/95 backdrop-blur-xl border-t border-white/5 z-50 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around p-3">
          {[ ['overview', '📊'], ['marketplace', '🏦'], ['assets', '📱'], ['kyc', '🛡️'] ].map(([tab, icon]) => (
            <button key={tab} onClick={() => handleTabChange(tab)} className={`flex flex-col items-center gap-1.5 w-full py-2.5 rounded-lg transition-colors relative ${activeTab === tab ? 'text-blue-400' : 'text-slate-500'}`}>
              <span className="text-xl">{icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {tab === 'overview' ? 'Home' : tab === 'marketplace' ? 'Offerte' : tab === 'assets' ? 'Asset' : 'KYC'}
              </span>
              {(tab === 'assets' || tab === 'kyc') && profile?.[tab + '_status'] === 'pending' && <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-amber-500 shadow-md"></span>}
            </button>
          ))}
        </div>
      </nav>

      {/* --- MODALE STRATEGIA ONBOARDING (Cyber-Fintech Style) --- */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#030509]/95 backdrop-blur-lg animate-view">
          <div className="pro-panel p-1 border border-white/10 rounded-[2.5rem] max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" style={{animation: 'none'}}>
            
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400"></div>
            
            <div className="p-8 sm:p-11 overflow-y-auto hide-scrollbar">
              <div className="flex justify-between items-start mb-10 border-b border-white/5 pb-6 relative">
                <div className="absolute -left-10 w-2 h-10 bg-blue-600 rounded-r-lg"></div>
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight mb-2.5 glitch-text">Network Operative Protocol</h2>
                  <p className="text-sm text-slate-400 max-w-lg">FinancePartner non è una piattaforma. È il tuo centro di comando. Abbiamo rimosso la pubblicità e la lentezza per garantirti dati puri al 100%.</p>
                </div>
                <button onClick={() => setIsStrategyModalOpen(false)} className="text-slate-500 hover:text-white bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors border border-white/5">✕</button>
              </div>

              <div className="space-y-7">
                
                {/* Section 1: Fiducia & S2S */}
                <div className="bg-[#0D111C] border border-white/5 p-7 rounded-2xl relative overflow-hidden transition-all hover:border-blue-500/20 group">
                  <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity">🔒</div>
                  <h3 className="text-xl font-bold text-white mb-2.5 flex items-center gap-3"><span className="text-blue-500 font-black">01 //</span> Infrastruttura Server-to-Server (S2S)</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Il 99% dei network usa cookie vulnerabili bloccati da iOS e browser moderni. Noi utilizziamo il **Protocollo FinancePartner Server-to-Server (Postback)**. Quando generi una conversione, il server dell'istituto comunica direttamente con le nostre API. Zero tracciamenti persi. Garanzia totale della conversione.
                  </p>
                </div>

                {/* Section 2: Strategia */}
                <div className="bg-[#0D111C] border border-white/5 p-7 rounded-2xl relative overflow-hidden transition-all hover:border-emerald-500/20 group">
                  <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:opacity-10 transition-opacity">🚀</div>
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-3"><span className="text-emerald-500 font-black">02 //</span> Strategia Acquisizione (ROI Focus)</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-5">
                    Le CPA finanziarie pagano molto perché acquisiscono utenti ad alto valore (LTV). Le strategie che generano fiducia (e ROI):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl text-sm border border-white/5"><strong className="text-white block mb-1">Social Edu-Fin</strong> Spiega come risparmiare o investire. Piazzati come un esperto. tasso di fiducia altissimo.</div>
                    <div className="bg-white/5 p-4 rounded-xl text-sm border border-white/5"><strong className="text-white block mb-1">Hub di Comparazione</strong> (Metodo Consigliato). Chiedi a noi il deploy del tuo Hub. L'utente sceglie l'offerta migliore per sé, il CR schizza al 25%+.</div>
                  </div>
                </div>

                {/* Section 3: Regole */}
                <div className="bg-rose-950/50 border border-rose-800 p-7 rounded-2xl">
                  <h3 className="text-lg font-bold text-rose-300 mb-2.5 flex items-center gap-2"><span className="text-rose-500 text-base">⚠️</span> Divieto Assoluto Traffico Incentivato</h3>
                  <p className="text-sm text-rose-100 leading-relaxed">
                    È vietato offrire soldi o premi agli utenti per farli registrare (Incent). È vietato fare Brand Bidding su Google Ads (es. usare il nome "N26"). Queste violazioni portano allo storno immediato del saldo e al ban. Trattiamo solo traffico di qualità.
                  </p>
                </div>
              </div>

              <div className="mt-10 pt-7 border-t border-white/5 text-center relative z-10">
                <button onClick={() => setIsStrategyModalOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest px-14 py-5 rounded-xl shadow-lg shadow-blue-600/50 hover:scale-105 transition-all active:scale-95">
                  Inizializza Terminale Operativo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE RICHIESTA SITO (Cyber-B2B Style) */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#030509]/95 backdrop-blur-md animate-view">
          <div className="pro-panel p-9 sm:p-11 rounded-[2.5rem] max-w-lg w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-transparent"></div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Deploy Infrastruttura B2B</h2>
            <p className="text-sm text-slate-400 mb-7 leading-relaxed">
              Briefing tecnico per: <strong className="text-blue-300">{selectedOffer ? selectedOffer.name : "Hub Globale (Tutto il catalogo)"}</strong>. Riceverai un URL definitivo crittografato dal team IT.
            </p>
            
            <form onSubmit={handleRequestSiteSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Posizionamento & Strategia Traffico</label>
                <textarea required rows="3" value={siteForm.whereToPromote} onChange={(e) => setSiteForm({...siteForm, whereToPromote: e.target.value})} className="data-input resize-none" placeholder="Es. Pagina TikTok Finanza con Ads mirate al risparmio..."></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">KPI / Obiettivi Volume (Es. Budget 50€/Giorno)</label>
                <input type="text" required value={siteForm.goals} onChange={(e) => setSiteForm({...siteForm, goals: e.target.value})} className="data-input" placeholder="Es. 100 Lead/Mese" />
              </div>
              
              <div className="bg-rose-950/50 border border-rose-800 p-5 rounded-2xl mt-5">
                <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-2.5 flex items-center gap-2"><span className="text-rose-500 text-lg">⚠️</span> Audit Preventivo Compliance</p>
                <p className="text-xs text-rose-100/80 leading-relaxed font-medium">L'infrastruttura web assegnata è monitorata. Traffico fraudolento, incentivato o ブランドビッディング (Brand Bidding) porteranno allo storno delle commissioni e al blocco irrevocabile dei fondi.</p>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="flex-1 text-xs font-bold uppercase tracking-widest text-slate-500 bg-white/5 hover:bg-white/10 py-4.5 rounded-xl transition-colors border border-white/5 active:scale-95">Annulla</button>
                <button type="submit" disabled={savingSettings} className="flex-[2] text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 py-4.5 rounded-xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all">
                  {savingSettings ? 'DEPLOY IN CORSO...' : 'INVIA BRIEFING AL TEAM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DETTAGLI OFFERTA COMPLETO */}
      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#030509]/95 backdrop-blur-md animate-view" onClick={() => setIsOfferModalOpen(false)}>
          <div className="pro-panel p-9 sm:p-11 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-9 border-b border-white/5 pb-6">
              <div className="flex items-center gap-6">
                <SafeImage src={selectedOffer.image_url} alt={selectedOffer.name} className="w-16 h-16" />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight glitch-text">{selectedOffer.name}</h2>
                  <div className="flex gap-2.5 mt-2.5">
                    <span className="text-[9px] font-bold border border-white/10 text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg uppercase tracking-widest">Modello {selectedOffer.payout_type || 'CPA'}</span>
                    <span className="text-[9px] font-bold border border-emerald-800 text-emerald-300 bg-emerald-950 px-3 py-1.5 rounded-lg uppercase tracking-widest">Payout Netto: €{selectedOffer.partner_payout?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white flex items-center justify-center font-bold transition-colors border border-white/5">✕</button>
            </div>

            <div className="space-y-7 max-h-[50vh] overflow-y-auto hide-scrollbar pr-3">
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3.5">Protocollo Campagna</h4>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-black/30 p-6 rounded-2xl border border-white/5 font-mono">{selectedOffer.description || 'Dettagli non forniti dal network.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                 <div className="bg-black/30 border border-white/5 p-6 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Geolocalizzazione Ammessa</p>
                   <p className="text-sm font-bold text-white tracking-tight">{selectedOffer.allowed_countries || 'Italia (IT)'}</p>
                 </div>
                 <div className="bg-black/30 border border-white/5 p-6 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Traffico Autorizzato Compliance</p>
                   <p className="text-sm font-bold text-emerald-400 tracking-tight">{selectedOffer.allowed_traffic || 'Meta, TikTok, SEO, Native'}</p>
                 </div>
              </div>
              {selectedOffer.restrictions && (
                <div className="bg-rose-950/50 p-6 rounded-2xl border border-rose-800">
                   <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-2.5 flex items-center gap-2"><span className="text-rose-500 text-base">⚠️</span> Divieti Assoluti e Restrizioni</p>
                   <p className="text-xs font-medium text-rose-100 leading-relaxed">{selectedOffer.restrictions}</p>
                </div>
              )}
            </div>

            <div className="mt-10 pt-7 border-t border-white/5 flex flex-col sm:flex-row gap-4">
              <button onClick={(e) => handleGetLink(selectedOffer, e)} className="flex-[2] text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white py-4.5 rounded-xl shadow-lg active:scale-95 transition-all">Ottieni Link S2S Crittografato</button>
              <button onClick={(e) => {setIsOfferModalOpen(false); openSiteModal(selectedOffer, e);}} className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 bg-white/5 border border-white/5 hover:bg-white/10 py-4.5 rounded-xl transition-all active:scale-95">Richiedi Deploy Hub</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}