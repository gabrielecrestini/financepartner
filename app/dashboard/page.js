"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

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
  
  const [billing, setBilling] = useState({ 
    full_name: '', entity_type: 'privato', vat_number: '', tax_id: '', address: '', payment_info: '', registered_website: '', traffic_volume: '' 
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });
  
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  
  // STATO PER LA SCHERMATA STRATEGICA (FIDUCIA E MARKETING)
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  
  const [siteForm, setSiteForm] = useState({ whereToPromote: '', goals: '' });
  
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const savedTab = localStorage.getItem('fp_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('fp_active_tab', tab);
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
      } catch (e) { console.log("IP non rilevato", e); }

      setProfile(profileData);
      
      if (profileData) {
        setBilling({
          full_name: profileData.full_name || '', entity_type: profileData.entity_type || 'privato',
          vat_number: profileData.vat_number || '', tax_id: profileData.tax_id || '',
          address: profileData.address || '', payment_info: profileData.payment_info || '',
          registered_website: profileData.registered_website || '', traffic_volume: profileData.traffic_volume || ''
        });
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

      setStats({
        clicks: totalClicks || 0, 
        epc: totalClicks > 0 ? (totalApproved / totalClicks) : 0, 
        cr: totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0
      });

      // Se è un nuovo utente (nessun click), mostra automaticamente la strategia per fare onboarding e creare fiducia
      if (totalClicks === 0 && (!profileData || !profileData.assigned_site_link)) {
        setTimeout(() => setIsStrategyModalOpen(true), 1500);
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
      alert("🔒 AZIONE NEGATA DAL SISTEMA COMPLIANCE\n\nLa tua sorgente di traffico non è stata approvata. Vai nella sezione 'Asset & Sorgenti' per compilare la richiesta e sbloccare la generazione dei link.");
      handleTabChange('assets'); 
      return;
    }
    const trackingLink = `${window.location.origin}/api/click?offer_id=${offer.id}&subid=${user.id}`;
    navigator.clipboard.writeText(trackingLink);
    alert("🔗 Tracking Link Copiato negli appunti!\nPronto per essere inserito nelle tue campagne.");
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

  const openOfferDetails = (offer) => {
    setSelectedOffer(offer);
    setIsOfferModalOpen(true);
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
    const offerName = isSingleOffer ? selectedOffer.name : "HUB MULTI-OFFERTA (Intero Catalogo)";
    const trackingLinkToProvide = isSingleOffer ? `${window.location.origin}/api/click?offer_id=${selectedOffer.id}&subid=${user.id}` : `Hub Multilink richiesto. SubID utente: ${user.id}`;

    const adminBriefing = `🎯 RICHIESTA ASSET: ${offerName}\n🔗 LINK S2S: ${trackingLinkToProvide}\n📱 CANALI DI PROMOZIONE: ${siteForm.whereToPromote}\n💰 OBIETTIVI DICHIARATI: ${siteForm.goals}`;

    const { error } = await supabase.from('profiles').update({
      traffic_status: 'pending', traffic_volume: siteForm.goals, traffic_notes: adminBriefing
    }).eq('id', user.id);

    setSavingSettings(false);
    if (!error) {
      setProfile({...profile, traffic_status: 'pending'});
      setIsSiteModalOpen(false);
      alert("✅ Candidatura tecnica inviata con successo all'Amministrazione.\n\nRiceverai una notifica push in Dashboard non appena la tua infrastruttura sarà online.");
      setSiteForm({ whereToPromote: '', goals: '' });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMsg({ text: '', type: '' });

    if (billing.payment_info) {
      const ibanRegex = /^[a-zA-Z]{2}[0-9a-zA-Z]{13,32}$/;
      const cleanIban = billing.payment_info.replace(/\s+/g, '').toUpperCase();
      if (!ibanRegex.test(cleanIban)) {
        setSettingsMsg({ text: 'Formato IBAN non riconosciuto dai server SEPA.', type: 'error' });
        setSavingSettings(false); return;
      }
      billing.payment_info = cleanIban;
    }

    let cleanWebsite = billing.registered_website.trim();
    if (cleanWebsite && !cleanWebsite.startsWith('http')) cleanWebsite = `https://${cleanWebsite}`;

    const newTrafficStatus = profile?.traffic_status === 'approved' ? 'approved' : (cleanWebsite ? 'pending' : 'none');
    const newKycStatus = profile?.kyc_status === 'approved' ? 'approved' : (billing.full_name && billing.payment_info ? 'pending' : 'none');

    const { error } = await supabase.from('profiles').update({
      full_name: billing.full_name, entity_type: billing.entity_type, vat_number: billing.vat_number,
      tax_id: billing.tax_id, address: billing.address, payment_info: billing.payment_info,
      registered_website: cleanWebsite, traffic_volume: billing.traffic_volume,
      traffic_status: newTrafficStatus, kyc_status: newKycStatus
    }).eq('id', user.id);
      
    setSavingSettings(false);
    if (!error) {
      setSettingsMsg({ text: 'Record sincronizzati. In attesa di validazione.', type: 'success' });
      setProfile({...profile, traffic_status: newTrafficStatus, kyc_status: newKycStatus, registered_website: cleanWebsite}); 
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 4000);
    } else {
      setSettingsMsg({ text: 'Errore di connessione.', type: 'error' });
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Approvato</span>;
    if (status === 'pending') return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> In Analisi</span>;
    if (status === 'rejected') return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max"><span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span> Bloccato</span>;
    return <span className="bg-white/5 text-slate-400 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-max">Azione Richiesta</span>;
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-[#070B14] flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-300 font-sans flex flex-col md:flex-row relative selection:bg-blue-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
        .glass-panel:hover { border-color: rgba(255, 255, 255, 0.1); }
        .data-input { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 16px; border-radius: 12px; width: 100%; outline: none; transition: all 0.3s ease; }
        .data-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        .data-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      {/* Sfondo Astratto Deep Dark */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full mix-blend-screen filter blur-[150px] bg-blue-900/20 opacity-50"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[120px] bg-indigo-900/20 opacity-50"></div>
      </div>

      {/* HEADER NOTIFICHE */}
      <div className="absolute top-6 right-6 z-50">
        <button onClick={markNotificationsAsRead} className="relative w-12 h-12 glass-panel rounded-full flex items-center justify-center text-xl hover:scale-105 transition-transform text-white">
          🔔
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-pulse">{unreadCount}</span>}
        </button>
        {showNotifications && (
          <div className="absolute top-16 right-0 w-80 sm:w-96 glass-panel shadow-2xl rounded-2xl overflow-hidden border border-white/10">
            <div className="p-4 bg-white/5 border-b border-white/5 font-bold text-white uppercase tracking-widest text-xs flex justify-between items-center">
              <span>Centro Comunicazioni</span>
              <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {notifications.length === 0 ? <p className="p-6 text-xs text-slate-500 text-center uppercase tracking-widest">Nessuna notifica</p> : notifications.map(n => (
                <div key={n.id} className={`p-4 mb-2 rounded-xl text-sm transition-colors ${n.is_read ? 'bg-transparent border border-white/5 opacity-70' : 'bg-blue-600/10 border border-blue-500/30'}`}>
                  <h4 className="font-bold text-white mb-1">{n.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-blue-400 mt-2 font-mono">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-white/5 bg-[#0A0F1C]/80 backdrop-blur-3xl p-6 relative z-40">
        <div className="flex items-center gap-4 mb-12 mt-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">F</div>
          <span className="font-black text-white text-2xl tracking-tight">Finance<span className="text-blue-500">Partner</span></span>
        </div>
        
        <div className="space-y-3 flex-1">
          <button onClick={() => handleTabChange('overview')} className={`w-full text-left px-5 py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>📊 Terminale Dati</button>
          <button onClick={() => handleTabChange('marketplace')} className={`w-full text-left px-5 py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'marketplace' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>🏦 Marketplace</button>
          <button onClick={() => handleTabChange('assets')} className={`w-full flex justify-between items-center px-5 py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'assets' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            <span>📱 Infrastrutture</span>
            {(profile?.traffic_status === 'pending') && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>}
          </button>
          <button onClick={() => handleTabChange('kyc')} className={`w-full flex justify-between items-center px-5 py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'kyc' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            <span>🛡️ Dati Fiscali</span>
            {(profile?.kyc_status === 'pending') && <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>}
          </button>
        </div>
        
        <div className="mt-auto p-5 bg-white/5 rounded-2xl border border-white/5 mb-4 text-center backdrop-blur-sm">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Supporto Rete B2B</p>
          <a href="mailto:financepartner@gmail.com" className="text-xs font-bold text-blue-400 break-words hover:text-blue-300 transition-colors">financepartner@gmail.com</a>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold text-slate-600 hover:text-white py-3 uppercase tracking-widest transition-colors w-full">Disconnetti Sessione</button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 h-screen overflow-y-auto p-6 sm:p-12 pb-32 relative z-10 hide-scrollbar">
        <div className="max-w-[1200px] mx-auto">

          {/* VISTA 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-view">
              
              {/* Header con pulsante Strategia */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Terminale Dati</h1>
                  <p className="text-sm text-slate-400 mt-2 font-mono">ID Operatore: {user.id.substring(0,8).toUpperCase()}</p>
                </div>
                <button onClick={() => setIsStrategyModalOpen(true)} className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 border border-emerald-400/50">
                  <span className="text-lg">🧠</span> Protocollo Operativo
                </button>
              </div>
              
              {/* Box Sito Assegnato (Hub Online) */}
              {profile?.assigned_site_link && (
                <div className="glass-panel p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-blue-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent pointer-events-none"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2 flex items-center gap-3">🚀 Infrastruttura Deployed</h3>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-lg">Il team tecnico ha rilasciato il tuo Hub di conversione. Il tracciamento S2S è attivo. Inserisci questo URL nelle tue campagne Ads o Bio.</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto shrink-0 relative z-10">
                    <input type="text" readOnly value={profile.assigned_site_link} className="bg-black/40 border border-blue-500/30 text-blue-300 px-5 py-4 rounded-xl font-mono text-sm w-full outline-none" />
                    <button onClick={() => {navigator.clipboard.writeText(profile.assigned_site_link); alert("🔗 URL Ufficiale Copiato!");}} className="bg-blue-600 text-white font-bold px-6 py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg active:scale-95 uppercase tracking-widest text-xs">Copia URL Hub</button>
                  </div>
                </div>
              )}

              {/* Metriche Finanziarie */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="glass-panel p-6 sm:p-8 rounded-3xl"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Commissioni Nette</span><p className="text-3xl sm:text-4xl font-black text-white mt-3">€{profile?.wallet_approved?.toFixed(2)}</p></div>
                <div className="glass-panel p-6 sm:p-8 rounded-3xl"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Valutazione (Lead)</span><p className="text-3xl sm:text-4xl font-black text-amber-400 mt-3">€{profile?.wallet_pending?.toFixed(2)}</p></div>
                <div className="glass-panel p-6 sm:p-8 rounded-3xl"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasso di Conversione</span><p className="text-3xl sm:text-4xl font-black text-blue-400 mt-3">{stats.cr.toFixed(2)}%</p></div>
                <div className="glass-panel p-6 sm:p-8 rounded-3xl"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">EPC Rete (Per Click)</span><p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-3">€{stats.epc.toFixed(2)}</p></div>
              </div>

              {/* Feed Transazioni */}
              <div className="glass-panel rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Feed Conversioni (Server-to-Server)</h3>
                    <div className="flex items-center gap-2"><span className="text-[9px] uppercase font-bold text-emerald-500">Sistema Attivo</span><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span></div>
                  </div>
                  <div className="space-y-4">
                    {conversions.slice(0, 5).map((conv) => (
                      <div key={conv.id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-white">{conv.program_id || 'Offerta Privata'}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1">{new Date(conv.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${conv.status === 'approved' ? 'text-emerald-400' : conv.status === 'rejected' ? 'text-rose-500' : 'text-amber-400'}`}>+€{conv.amount?.toFixed(2)}</p>
                          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">{conv.status}</p>
                        </div>
                      </div>
                    ))}
                    {conversions.length === 0 && <p className="text-xs font-bold text-slate-600 text-center py-10 uppercase tracking-widest">In attesa dei primi dati di traffico...</p>}
                  </div>
              </div>
            </div>
          )}

          {/* VISTA 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
             <div className="space-y-8 animate-view">
                <div className="pb-6 border-b border-white/10">
                  <h1 className="text-4xl font-black text-white tracking-tight">Marketplace Finanziario</h1>
                  <p className="text-sm text-slate-400 mt-2">Campagne B2B dirette. Le commissioni mostrate sono il payout netto per l'affiliato.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {offers.map((offer) => (
                    <div key={offer.id} className="glass-panel p-8 rounded-3xl flex flex-col relative group">
                      <div className="absolute top-6 right-6 hidden sm:block"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${offer.payout_type === 'CPL' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'}`}>{offer.payout_type || 'CPA'} Model</span></div>
                      
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3 shadow-lg shrink-0">
                          {offer.image_url ? <img src={offer.image_url} className="w-full h-full object-contain" alt="" /> : <span className="text-3xl">🏦</span>}
                        </div>
                        <div>
                          <h4 className="font-black text-white text-2xl line-clamp-1 group-hover:text-blue-400 transition-colors">{offer.name}</h4>
                          <button onClick={() => {setSelectedOffer(offer); setIsOfferModalOpen(true);}} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest mt-2 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg transition-colors">📄 Leggi Termini & Policy</button>
                        </div>
                      </div>

                      <div className="mt-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="w-full sm:w-auto">
                          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">Margine Netto</p>
                          <p className="font-black text-emerald-400 text-3xl">€{offer.partner_payout?.toFixed(2)}</p>
                        </div>
                        <div className="flex w-full sm:w-auto gap-3">
                          <button onClick={(e) => openSiteModal(offer, e)} className="flex-1 sm:flex-none text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-6 py-4 rounded-xl hover:bg-white/10 transition-colors uppercase tracking-widest">Sito</button>
                          <button onClick={(e) => handleGetLink(offer, e)} className="flex-[2] sm:flex-none text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all">Genera Link</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
          
          {/* VISTA 3: ASSET E SORGENTI */}
          {activeTab === 'assets' && (
            <div className="space-y-8 max-w-4xl animate-view">
              <div className="pb-6 border-b border-white/10">
                <h1 className="text-4xl font-black text-white tracking-tight">Sviluppo & Asset</h1>
                <p className="text-sm text-slate-400 mt-2">Dichiara il tuo traffico o delega a noi la creazione della tua struttura di conversione.</p>
              </div>
              
              <div className="glass-panel p-8 sm:p-10 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">1. Analisi e Autorizzazione Traffico Proprio</h2>
                    <p className="text-xs text-slate-400 mt-1">Obbligatorio per sbloccare la generazione manuale dei Tracking Link.</p>
                  </div>
                  <StatusBadge status={profile?.traffic_status} />
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dominio Web / Profilo Social Ufficiale</label>
                    <input type="url" value={billing.registered_website} onChange={(e) => setBilling({...billing, registered_website: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input text-blue-300 font-mono" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Volume di Fuoco Stimato / Strategia</label>
                    <input type="text" value={billing.traffic_volume} onChange={(e) => setBilling({...billing, traffic_volume: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input text-slate-300" placeholder="Es. 50 Lead al giorno da Meta Ads" />
                  </div>
                  
                  {(!profile?.traffic_status || profile?.traffic_status === 'none') && (
                    <div className="pt-2 text-right">
                      <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-10 py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                        Invia per Audit Compliance
                      </button>
                    </div>
                  )}
                </div>

                {profile?.traffic_status === 'pending' && profile?.traffic_notes && (
                  <div className="mt-8 p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                    <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">⏳ Briefing in Lavorazione dal Team</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono bg-black/40 p-5 rounded-xl border border-white/5">{profile.traffic_notes}</p>
                  </div>
                )}
              </div>

              <div className="glass-panel p-8 sm:p-10 rounded-3xl border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-black text-white">2. Richiedi Creazione Hub (Sito "Chiavi in Mano")</h2>
                  <span className="bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 font-bold px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest">Servizio B2B Incluso</span>
                </div>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">Il nostro reparto IT costruirà per te una Landing Page ottimizzata e multilingua, contenente le migliori offerte del network. Non dovrai configurare domini o tracking, riceverai un link definitivo pronto per le campagne Ads.</p>
                <button onClick={() => {setSelectedOffer(null); setIsSiteModalOpen(true);}} className="w-full sm:w-auto bg-white hover:bg-slate-200 text-black font-black text-xs uppercase tracking-widest px-10 py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all active:scale-95">
                  Avvia Richiesta Hub Multi-Offerta
                </button>
              </div>
            </div>
          )}

          {/* VISTA 4: KYC E FATTURAZIONE */}
          {activeTab === 'kyc' && (
             <div className="space-y-8 max-w-4xl animate-view">
               <div className="pb-6 border-b border-white/10">
                 <h1 className="text-4xl font-black text-white tracking-tight">Amministrazione & Fisco</h1>
                 <p className="text-sm text-slate-400 mt-2">I pagamenti vengono processati automaticamente il 15 del mese su circuito SEPA.</p>
               </div>
               
               <div className="glass-panel p-8 sm:p-10 rounded-3xl">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                   <h2 className="text-xl font-bold text-white">Identificazione e IBAN</h2>
                   <StatusBadge status={profile?.kyc_status} />
                 </div>

                 <div className="space-y-6">
                  <div className="flex p-1.5 bg-black/40 rounded-xl w-full sm:w-max border border-white/5">
                    <button onClick={() => setBilling({...billing, entity_type: 'privato'})} disabled={profile?.kyc_status === 'approved'} className={`px-8 py-3 text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'privato' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}>Privato</button>
                    <button onClick={() => setBilling({...billing, entity_type: 'azienda'})} disabled={profile?.kyc_status === 'approved'} className={`px-8 py-3 text-xs font-bold rounded-lg transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'azienda' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}>Partita IVA</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Intestatario Fiscale</label>
                      <input type="text" value={billing.full_name} onChange={(e) => setBilling({...billing, full_name: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input" placeholder="Nome Completo o Ragione Sociale" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Codice Fiscale</label>
                      <input type="text" value={billing.tax_id} onChange={(e) => setBilling({...billing, tax_id: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input uppercase font-mono" placeholder="RSSMRA..." />
                    </div>
                    {billing.entity_type === 'azienda' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Partita IVA</label>
                        <input type="text" value={billing.vat_number} onChange={(e) => setBilling({...billing, vat_number: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input font-mono" placeholder="IT0123..." />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Indirizzo di Residenza / Sede Legale</label>
                      <input type="text" value={billing.address} onChange={(e) => setBilling({...billing, address: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input" placeholder="Via Roma 1, Milano" />
                    </div>
                    
                    <div className="sm:col-span-2 mt-4 pt-6 border-t border-white/10">
                      <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">IBAN per Erogazione Fondi (Area SEPA)</label>
                      <input type="text" value={billing.payment_info} onChange={(e) => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input text-xl font-mono uppercase tracking-[0.2em] border-emerald-500/50 focus:border-emerald-400 bg-emerald-900/10 text-emerald-300" placeholder="IT00X00000000000000000" />
                    </div>
                  </div>

                  {(!profile?.kyc_status || profile?.kyc_status === 'none' || profile?.kyc_status === 'pending') && (
                    <div className="pt-4 text-right">
                      <button onClick={handleSaveSettings} disabled={savingSettings || profile?.kyc_status === 'approved'} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-12 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 uppercase tracking-widest disabled:opacity-50">
                        {savingSettings ? 'Crittografia...' : 'Applica e Salva Dati'}
                      </button>
                    </div>
                  )}
                  {settingsMsg.text && <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 p-4 rounded-xl text-center border ${settingsMsg.type==='error'?'bg-rose-500/10 text-rose-400 border-rose-500/30':'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>{settingsMsg.text}</p>}
                </div>
               </div>
             </div>
          )}
        </div>
      </main>

      {/* --- MODALE STRATEGIA E FIDUCIA (ONBOARDING) --- */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#070B14]/90 backdrop-blur-md animate-view">
          <div className="glass-panel p-1 border-white/20 rounded-[2.5rem] max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400"></div>
            
            <div className="p-8 sm:p-10 overflow-y-auto hide-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">Protocollo FinancePartner</h2>
                  <p className="text-sm text-slate-400">Non siamo solo un network. Siamo i tuoi soci d'infrastruttura.</p>
                </div>
                <button onClick={() => setIsStrategyModalOpen(false)} className="text-slate-500 hover:text-white bg-white/5 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
              </div>

              <div className="space-y-6">
                
                {/* Section 1: Fiducia & S2S */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-6xl opacity-10">🔒</div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><span className="text-blue-400">1.</span> Sicurezza del Tracciamento (S2S)</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    A differenza dei network classici che usano Cookie fragili (bloccati da iOS e AdBlocker), il nostro sistema si basa su una connessione <strong className="text-white">Server-to-Server (Postback)</strong> diretta con le API degli Istituti Bancari. Se tu generi una vendita, il server della banca comunica <em>esclusivamente</em> con il tuo SubID crittografato. Nessun click perso, nessuna commissione rubata.
                  </p>
                </div>

                {/* Section 2: Come si fanno i soldi qui */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-6xl opacity-10">📈</div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><span className="text-emerald-400">2.</span> Strategie di Acquisizione (CPA/CPL)</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Il mercato finanziario paga molto perché acquisisce clienti ad alto valore. Le strategie che convertono di più nel nostro network sono:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-slate-300"><span className="text-emerald-500">✅</span> <div><strong className="text-white">Social "Edu-Fin":</strong> Pagine Instagram/TikTok che parlano di risparmio, investimenti o carte gratuite. L'utente si fida del creator e apre il conto.</div></li>
                    <li className="flex gap-3 text-sm text-slate-300"><span className="text-emerald-500">✅</span> <div><strong className="text-white">Content Arbitrage:</strong> Articoli o video di comparazione (es. "N26 vs Revolut"). Il traffico intenzionale su Google o YouTube ha tassi di conversione (CR) fino al 30%.</div></li>
                    <li className="flex gap-3 text-sm text-slate-300"><span className="text-emerald-500">✅</span> <div><strong className="text-white">Hub System (Raccomandato):</strong> Richiedi a noi la creazione del tuo Sito Hub. Lo piazzi nella bio o in Ads, e l'utente sceglie autonomamente l'offerta migliore per lui.</div></li>
                  </ul>
                </div>

                {/* Section 3: Regole e Policy */}
                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-rose-400 mb-2">La Regola d'Oro (Zero Tolleranza)</h3>
                  <p className="text-sm text-rose-200/80 leading-relaxed">
                    Proteggiamo gli advertiser per garantirti payout più alti. È <strong>severamente vietato</strong> offrire rimborsi o soldi agli utenti per farli iscrivere (Traffico Incentivato), ed è vietato usare il nome della banca su Google Ads (Brand Bidding). Chi vìola le policy viene stornato e bannato.
                  </p>
                </div>

              </div>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <button onClick={() => setIsStrategyModalOpen(false)} className="bg-white text-black font-black text-sm uppercase tracking-widest px-12 py-5 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all">
                  Ho compreso, portami al Terminale
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* BOTTOM BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#0A0F1C]/95 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
        <div className="flex justify-around p-2">
          <button onClick={() => handleTabChange('overview')} className={`flex flex-col items-center gap-1 w-full py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'text-blue-400' : 'text-slate-500'}`}><span className="text-xl">📊</span><span className="text-[9px] font-bold uppercase tracking-widest">Home</span></button>
          <button onClick={() => handleTabChange('marketplace')} className={`flex flex-col items-center gap-1 w-full py-3 rounded-xl transition-colors ${activeTab === 'marketplace' ? 'text-blue-400' : 'text-slate-500'}`}><span className="text-xl">🏦</span><span className="text-[9px] font-bold uppercase tracking-widest">Offerte</span></button>
          <button onClick={() => handleTabChange('assets')} className={`flex flex-col items-center gap-1 w-full py-3 rounded-xl transition-colors relative ${activeTab === 'assets' ? 'text-blue-400' : 'text-slate-500'}`}>
             <span className="text-xl">📱</span><span className="text-[9px] font-bold uppercase tracking-widest">Asset</span>
             {profile?.traffic_status === 'pending' && <span className="absolute top-2 right-5 w-2 h-2 rounded-full bg-amber-500 shadow-md"></span>}
          </button>
          <button onClick={() => handleTabChange('kyc')} className={`flex flex-col items-center gap-1 w-full py-3 rounded-xl transition-colors relative ${activeTab === 'kyc' ? 'text-blue-400' : 'text-slate-500'}`}>
             <span className="text-xl">🛡️</span><span className="text-[9px] font-bold uppercase tracking-widest">KYC</span>
             {profile?.kyc_status === 'pending' && <span className="absolute top-2 right-5 w-2 h-2 rounded-full bg-amber-500 shadow-md"></span>}
          </button>
        </div>
      </nav>

      {/* MODALE RICHIESTA SITO (SENZA URL, AUTO-TRACKING LINK) */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#070B14]/80 backdrop-blur-md animate-view">
          <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] max-w-lg w-full shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-black text-white mb-2">Deploy Infrastruttura Web</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Target: <strong className="text-white">{selectedOffer ? selectedOffer.name : "Hub Multi-Offerta (Consigliato)"}</strong>. L'URL finale ti verrà consegnato dal team.
            </p>
            
            <form onSubmit={handleRequestSiteSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Posizionamento Traffico</label>
                <textarea required rows="3" value={siteForm.whereToPromote} onChange={(e) => setSiteForm({...siteForm, whereToPromote: e.target.value})} className="data-input resize-none" placeholder="Es. Ads su Meta focalizzate sui conti a zero spese..."></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">KPI (Volumi e Budget)</label>
                <input type="text" required value={siteForm.goals} onChange={(e) => setSiteForm({...siteForm, goals: e.target.value})} className="data-input" placeholder="Es. Budget 50€/giorno" />
              </div>
              
              <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl mt-4">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">⚠️ Avviso di Rischio</p>
                <p className="text-xs text-rose-200/70 font-medium leading-relaxed">Il traffico generato da questa Landing Page sarà rigorosamente ispezionato. Le tecniche Fraud e Incent portano al blocco irrevocabile dei fondi.</p>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="flex-1 text-xs font-bold uppercase tracking-widest text-slate-400 bg-white/5 hover:bg-white/10 py-4 rounded-xl transition-colors">Annulla</button>
                <button type="submit" disabled={savingSettings} className="flex-[2] text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-50">
                  {savingSettings ? 'Elaborazione...' : 'Invia Briefing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DETTAGLI OFFERTA COMPLETO */}
      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#070B14]/80 backdrop-blur-md animate-view" onClick={() => setIsOfferModalOpen(false)}>
          <div className="glass-panel p-8 sm:p-10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {selectedOffer.image_url ? <img src={selectedOffer.image_url} alt="" className="w-full h-full object-contain p-2" /> : <span className="text-2xl">🏦</span>}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{selectedOffer.name}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] font-bold border border-white/10 text-slate-400 bg-white/5 px-3 py-1 rounded-lg uppercase tracking-widest">Modello {selectedOffer.payout_type || 'CPA'}</span>
                    <span className="text-[9px] font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg uppercase tracking-widest">Payout: €{selectedOffer.partner_payout?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white flex items-center justify-center font-bold transition-colors">✕</button>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto hide-scrollbar pr-2">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Direttive Campagna</h4>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-5 rounded-2xl border border-white/5">{selectedOffer.description || 'Nessun dettaglio aggiuntivo.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Target Geo</p>
                   <p className="text-sm font-bold text-white">{selectedOffer.allowed_countries || 'Italia (IT)'}</p>
                 </div>
                 <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Traffico Autorizzato</p>
                   <p className="text-sm font-bold text-emerald-400">{selectedOffer.allowed_traffic || 'Meta, SEO, Native'}</p>
                 </div>
              </div>
              {selectedOffer.restrictions && (
                <div className="bg-rose-500/10 p-6 rounded-2xl border border-rose-500/20">
                   <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">⚠️ Divieti Assoluti</p>
                   <p className="text-xs font-medium text-rose-200/70 leading-relaxed">{selectedOffer.restrictions}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <button onClick={(e) => handleGetLink(selectedOffer, e)} className="flex-[2] text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95">Ottieni Link Diretto</button>
              <button onClick={(e) => {setIsOfferModalOpen(false); openSiteModal(selectedOffer, e);}} className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 py-4 rounded-xl transition-all">Richiedi Sito</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}