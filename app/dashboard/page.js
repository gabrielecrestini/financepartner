"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Componente intelligente per loghi (Niente foto rotte)
const SafeImage = ({ src, alt, fallbackIcon = "🏦", className }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-[#0F172A] border border-white/5 rounded-2xl shadow-inner ${className}`}>
        <span className="opacity-40 text-2xl drop-shadow-md">{fallbackIcon}</span>
      </div>
    );
  }
  return (
    <div className={`bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-lg shrink-0 border border-slate-200/20 ${className}`}>
      <img src={src} alt={alt} onError={() => setError(true)} className="w-full h-full object-contain" />
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Stati Dati
  const [offers, setOffers] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [stats, setStats] = useState({ clicks: 0, epc: 0, cr: 0 });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Stati UI
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const mainContentRef = useRef(null);

  // Form & Modali
  const [billing, setBilling] = useState({ full_name: '', entity_type: 'privato', vat_number: '', tax_id: '', address: '', payment_info: '', registered_website: '', traffic_volume: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });
  
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [siteForm, setSiteForm] = useState({ whereToPromote: '', goals: '' });
  
  // Gatekeeper
  const [gateForm, setGateForm] = useState({ url: '', strategy: '' });
  const [isSubmittingGate, setIsSubmittingGate] = useState(false);

  const router = useRouter();

  // CALCOLO NOTIFICHE
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    setIsMounted(true);
    const savedTab = localStorage.getItem('fp_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    if (mainContentRef.current) {
      mainContentRef.current.style.opacity = 0;
      mainContentRef.current.style.transform = 'translateY(10px) scale(0.99)';
    }
    setTimeout(() => {
      setActiveTab(tab);
      localStorage.setItem('fp_active_tab', tab);
      if (mainContentRef.current) {
        mainContentRef.current.style.opacity = 1;
        mainContentRef.current.style.transform = 'translateY(0px) scale(1)';
      }
    }, 150);
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
      } catch (e) { console.log("Security IP check skipped"); }

      setProfile(profileData);
      
      if (profileData?.traffic_status === 'approved') {
        setBilling({ full_name: profileData.full_name || '', entity_type: profileData.entity_type || 'privato', vat_number: profileData.vat_number || '', tax_id: profileData.tax_id || '', address: profileData.address || '', payment_info: profileData.payment_info || '', registered_website: profileData.registered_website || '', traffic_volume: profileData.traffic_volume || '' });

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

        if (totalClicks === 0 && !profileData.assigned_site_link) {
          setTimeout(() => setIsStrategyModalOpen(true), 1000);
        }
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, [isMounted, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // --- GATEKEEPER SUBMIT ---
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

  // --- LOGICA DI GENERAZIONE LINK S2S ---
  const handleGetLink = (offer, e) => {
    if (e) e.stopPropagation();
    if (profile?.traffic_status !== 'approved') {
      alert("🔒 ACCESSO NEGATO: La tua sorgente di traffico deve essere validata nella sezione Infrastrutture per usare i link diretti.");
      handleTabChange('assets'); return;
    }
    const trackingLink = `https://financepartner.netlify.app/api/click?offer_id=${offer.id}&subid=${user.id}`;
    navigator.clipboard.writeText(trackingLink);
    showToast("🔗 URL Server-to-Server Copiato", 'success');
  };

  // --- LOGICA RICHIESTA SITI (MULTI-RICHIESTA PERFETTA) ---
  const handleRequestSiteSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    
    const isSingleOffer = selectedOffer && selectedOffer.id;
    const targetName = isSingleOffer ? selectedOffer.name : "Hub Multilink Globale";
    const trackingLinkToProvide = isSingleOffer ? `https://financepartner.netlify.app/api/click?offer_id=${selectedOffer.id}&subid=${user.id}` : `Hub. SubID: ${user.id}`;
    
    const timestamp = new Date().toLocaleString('it-IT');
    const newBriefing = `\n\n--- RICHIESTA DEL ${timestamp} ---\n🎯 ASSET: ${targetName}\n🔗 LINK S2S: ${trackingLinkToProvide}\n📱 STRATEGIA: ${siteForm.whereToPromote}\n💰 KPI: ${siteForm.goals}`;
    
    const existingNotes = profile.traffic_notes || '';
    const updatedNotes = existingNotes + newBriefing;
    const newStatus = profile.traffic_status === 'approved' ? 'approved' : 'pending';

    const { error } = await supabase.from('profiles').update({ traffic_status: newStatus, traffic_notes: updatedNotes }).eq('id', user.id);
    
    setSavingSettings(false);
    if (!error) {
      setProfile({...profile, traffic_status: newStatus, traffic_notes: updatedNotes});
      setIsSiteModalOpen(false);
      showToast("✅ Richiesta inoltrata al Reparto Sviluppo", 'success');
      setSiteForm({ whereToPromote: '', goals: '' });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    if (billing.payment_info) {
      const ibanRegex = /^[a-zA-Z]{2}[0-9a-zA-Z]{13,32}$/;
      if (!ibanRegex.test(billing.payment_info.replace(/\s+/g, ''))) { showToast('IBAN SEPA non conforme.', 'error'); setSavingSettings(false); return; }
    }
    const { error } = await supabase.from('profiles').update({...billing, payment_info: billing.payment_info.replace(/\s+/g, '').toUpperCase()}).eq('id', user.id);
    setSavingSettings(false);
    if (!error) {
      showToast('Dati sincronizzati tramite AES-256.', 'success');
      setProfile({...profile, ...billing}); 
    }
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

  const showToast = (text, type) => {
    setSettingsMsg({ text, type });
    setTimeout(() => setSettingsMsg({ text: '', type: '' }), 3500);
  };

  const openSiteModal = (offer, e) => {
    if (e) e.stopPropagation();
    setSelectedOffer(offer);
    setIsSiteModalOpen(true);
  };

  const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Verificato</span>;
    if (status === 'pending') return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> In Audit</span>;
    if (status === 'rejected') return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span> Bloccato</span>;
    return <span className="bg-white/5 text-slate-400 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Azione Richiesta</span>;
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-blue-400/50 text-[10px] font-mono tracking-widest uppercase">Inizializzazione Workspace...</p></div>;

  // =======================================================================
  // GATEKEEPER: SALA D'ATTESA VIP
  // =======================================================================
  if (profile && profile.traffic_status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-500/30">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; }
          @keyframes radar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
          @keyframes fadeUpGate { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .gate-panel { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 30px 60px rgba(0,0,0,0.8); animation: fadeUpGate 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .radar-sweep { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 70%, rgba(59, 130, 246, 0.3) 100%); animation: radar 2.5s linear infinite; }
          .input-gate { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 18px; border-radius: 12px; width: 100%; outline: none; transition: all 0.3s ease; }
          .input-gate:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); background: rgba(0,0,0,0.6); }
        `}} />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_100%)] pointer-events-none"></div>
        <button onClick={handleLogout} className="absolute top-8 right-8 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Disconnetti</button>

        {(!profile.traffic_status || profile.traffic_status === 'none') && (
          <div className="gate-panel p-8 sm:p-12 rounded-[2rem] max-w-xl w-full relative z-10 border-t-2 border-t-blue-500">
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">🔐</div>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Accesso B2B Riservato</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">Il network eroga le commissioni finanziarie più alte sul mercato. Per tutelare i budget bancari, approviamo manualmente ogni profilo. Dichiara i tuoi asset.</p>
            
            <form onSubmit={submitApplication} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL Principale (Sito o Social)</label>
                <input type="text" value={gateForm.url} onChange={e => setGateForm({...gateForm, url: e.target.value})} className="input-gate font-mono text-sm" placeholder="https:// (Opzionale)" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Strategia Operativa & KPI (Obbligatorio)</label>
                <textarea required rows="3" value={gateForm.strategy} onChange={e => setGateForm({...gateForm, strategy: e.target.value})} className="input-gate resize-none text-sm" placeholder="Es. Meta Ads verso Hub di comparazione..."></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isSubmittingGate} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 py-5 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.3)] active:scale-95 uppercase tracking-widest transition-all disabled:opacity-50">
                  {isSubmittingGate ? 'Invio Dati Sicuro...' : 'Sottoponi a Dipartimento Compliance'}
                </button>
              </div>
            </form>
          </div>
        )}

        {profile.traffic_status === 'pending' && (
          <div className="gate-panel p-10 sm:p-16 rounded-[2.5rem] max-w-lg w-full relative z-10 text-center flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center mb-10">
              <div className="absolute inset-0 border border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-2 border border-blue-500/10 rounded-full"></div>
              <div className="absolute inset-0 rounded-full radar-sweep"></div>
              <div className="absolute w-24 h-24 bg-[#020617] rounded-full z-10 flex items-center justify-center border border-white/5"><span className="text-3xl">⏳</span></div>
              <div className="absolute inset-0 border border-blue-500 rounded-full animate-[pulseRing_2s_infinite]"></div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-6"><span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span> In Revisione</div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Audit in Corso</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">Il profilo è in fase di validazione da parte dell'anti-frode. L'approvazione richiede dalle 12 alle 24 ore.</p>
            <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-left space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-300"><span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</span> Dati Ricevuti</div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-300"><span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</span> Identity Encryption</div>
              <div className="flex items-center gap-3 text-sm font-bold text-white"><span className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex items-center justify-center text-[10px]"></span> Controllo Manuale Qualità</div>
            </div>
            <p className="mt-8 text-[10px] text-slate-500 font-mono">ID Operazione: {user.id.substring(0,12).toUpperCase()}</p>
          </div>
        )}

        {profile.traffic_status === 'rejected' && (
          <div className="gate-panel p-10 rounded-[2rem] max-w-md w-full relative z-10 text-center border-t-4 border-t-rose-600">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 border border-rose-500/20">⛔</div>
            <h2 className="text-2xl font-black text-white mb-2">Accesso Interdetto</h2>
            <p className="text-sm text-slate-400 leading-relaxed">La candidatura non rispetta gli standard del network. Per tutelare i partner, l'accesso a questa utenza è bloccato.</p>
          </div>
        )}
      </div>
    );
  }

  // =======================================================================
  // TERMINALE DASHBOARD (Approvato)
  // =======================================================================
  
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-blue-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        
        .glass-panel { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); border-radius: 1.5rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .glass-panel:hover { border-color: rgba(255, 255, 255, 0.08); box-shadow: 0 20px 50px -10px rgba(0,0,0,0.8); transform: translateY(-2px); }
        
        .input-premium { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 18px 20px; border-radius: 1rem; width: 100%; outline: none; transition: all 0.2s ease; font-size: 0.9rem; letter-spacing: 0.02em; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.7); box-shadow: inset 0 0 0 1px #3B82F6, 0 0 20px rgba(59,130,246,0.15); }
        .input-premium:disabled { opacity: 0.4; cursor: not-allowed; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .animate-view { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 40px 40px; }
        .text-gradient { background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .tab-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 16px 20px; border-radius: 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; transition: all 0.2s ease; border: 1px solid transparent; }
        .tab-btn.active { background: rgba(59, 130, 246, 0.08); color: #60A5FA; border-color: rgba(59, 130, 246, 0.2); box-shadow: inset 0 0 20px rgba(59,130,246,0.05); }
        .tab-btn:not(.active):hover { background: rgba(255, 255, 255, 0.03); color: white; }
      `}} />

      <div className="fixed inset-0 z-0 bg-grid opacity-50 pointer-events-none"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none"></div>

      {/* NOTIFICATION TOAST */}
      {settingsMsg.text && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-view border backdrop-blur-xl ${settingsMsg.type === 'error' ? 'bg-rose-950/80 text-rose-200 border-rose-500/50' : 'bg-blue-950/80 text-blue-200 border-blue-500/50'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${settingsMsg.type === 'error' ? 'bg-rose-500' : 'bg-blue-400'} animate-pulse`}></span>
            {settingsMsg.text}
          </div>
        </div>
      )}

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-5 border-b border-white/5 bg-[#020617]/90 backdrop-blur-xl z-40 relative">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-[0_0_15px_rgba(59,130,246,0.4)]">F</div>
           <span className="font-black text-white text-xl tracking-tight">Finance<span className="text-blue-500">Partner</span></span>
        </div>
        <button onClick={markNotificationsAsRead} className="relative text-xl text-slate-400 hover:text-white transition-colors">
          🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#020617] animate-pulse"></span>}
        </button>
      </header>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-white/5 bg-[#020617]/40 backdrop-blur-3xl p-6 relative z-40 shrink-0">
        <div className="flex items-center gap-4 mb-8 mt-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">F</div>
          <div>
            <span className="font-black text-white text-xl tracking-tight block leading-none">FinancePartner</span>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1 block">Private Network</span>
          </div>
        </div>

        <div className="mb-10 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">🛡️</div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status Utenza</p>
            <p className="text-[11px] font-bold mt-0.5 text-emerald-400">Network Autorizzato</p>
          </div>
        </div>
        
        <nav className="space-y-2 flex-1">
          {[ 
            {id: 'overview', icon: '📊', label: 'Terminale'}, 
            {id: 'marketplace', icon: '🏦', label: 'Marketplace'}, 
            {id: 'assets', icon: '🖥️', label: 'Infrastrutture'}, 
            {id: 'kyc', icon: '🛡️', label: 'Compliance'} 
          ].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
              <div className="flex items-center gap-3"><span className="text-lg opacity-80">{tab.icon}</span> <span>{tab.label}</span></div>
              {(tab.id === 'assets' || tab.id === 'kyc') && profile?.[tab.id + '_status'] === 'pending' && <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse"></span>}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto p-5 bg-white/[0.02] rounded-2xl border border-white/5 mb-4 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Account Manager</p>
          <a href="mailto:finance.partnerr@gmail.com" className="text-xs font-bold text-slate-300 hover:text-blue-400 transition-colors">finance.partnerr@gmail.com</a>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-black text-slate-600 hover:text-rose-400 py-3 uppercase tracking-widest transition-colors w-full text-center flex items-center justify-center gap-2"><span>⏻</span> Disconnetti</button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8 lg:p-12 pb-32 relative z-10 hide-scrollbar scroll-smooth">
        <div ref={mainContentRef} className="max-w-[1400px] mx-auto transition-all duration-300">

          {/* VISTA 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 lg:space-y-12 animate-view">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-gradient">Console Operativa</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> API Connection: Secure
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsStrategyModalOpen(true)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95">
                    <span className="text-base">🧠</span> Playbook
                  </button>
                  <button onClick={markNotificationsAsRead} className="relative w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-xl transition-colors border border-white/10 text-white">
                    🔔
                    {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-bounce">{unreadCount}</span>}
                  </button>
                </div>
              </div>
              
              {showNotifications && (
                <div className="absolute top-24 right-12 z-50 w-96 glass-panel p-2 shadow-2xl rounded-3xl overflow-hidden animate-view">
                  <div className="p-4 bg-white/5 border-b border-white/5 font-black text-white uppercase tracking-widest text-[10px] flex justify-between items-center rounded-t-xl">
                    <span>Centro Notifiche</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2 hide-scrollbar">
                    {notifications.length === 0 ? <p className="p-8 text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">Nessun evento</p> : notifications.map(n => (
                      <div key={n.id} className={`p-5 mb-2 rounded-2xl text-sm transition-all ${n.is_read ? 'bg-transparent opacity-60' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                        <h4 className="font-bold text-white mb-1.5">{n.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-blue-400 mt-3 font-mono">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Box Asset Dinamico */}
              {profile?.assigned_site_link && (
                <div className="glass-panel p-8 sm:p-10 rounded-[2rem] border-l-4 border-l-blue-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight text-white flex items-center gap-3">🚀 I tuoi Asset Operativi</h3>
                    <p className="text-sm text-blue-200/70 leading-relaxed max-w-2xl font-medium mb-6">L'IT ha rilasciato le infrastrutture richieste. Inserisci questi URL crittografati nelle tue campagne per attivare il Server-to-Server.</p>
                    <textarea readOnly value={profile.assigned_site_link} className="bg-black/50 border border-blue-500/20 text-blue-300 p-5 rounded-xl font-mono text-sm w-full outline-none focus:border-blue-400 transition-colors resize-none hide-scrollbar" rows={profile.assigned_site_link.split('\n').length > 1 ? 4 : 2} />
                  </div>
                </div>
              )}

              {/* Metriche Finanziarie */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: "Liquidità Esigibile", value: `€${profile?.wallet_approved?.toFixed(2) || '0.00'}`, color: "text-white" },
                  { label: "Volume in Valutazione", value: `€${profile?.wallet_pending?.toFixed(2) || '0.00'}`, color: "text-amber-400" },
                  { label: "Tasso Conversione", value: `${stats.cr.toFixed(2)}%`, color: "text-blue-400" },
                  { label: "Earnings Per Click", value: `€${stats.epc.toFixed(2)}`, color: "text-emerald-400" }
                ].map((stat, i) => (
                  <div key={i} className="glass-panel p-6 sm:p-8 flex flex-col justify-between min-h-[140px]">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    <p className={`text-3xl sm:text-4xl font-black ${stat.color} tracking-tight mt-4 drop-shadow-md`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Feed Transazioni */}
              <div className="glass-panel p-8 sm:p-10 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 border-b border-white/5 pb-6">
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Log Transazioni Server</h3>
                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 w-max">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                      <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest">S2S Attivo</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {conversions.slice(0, 6).map((conv) => (
                      <div key={conv.id} className="flex justify-between items-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                        <div>
                          <p className="text-sm sm:text-base font-black text-white tracking-tight">{conv.program_id || 'Lead Generato'}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-1">{new Date(conv.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl sm:text-2xl font-black tracking-tight ${conv.status === 'approved' ? 'text-emerald-400' : conv.status === 'rejected' ? 'text-rose-500' : 'text-amber-400'}`}>+€{conv.amount?.toFixed(2)}</p>
                          <p className={`text-[9px] uppercase tracking-widest font-black mt-1 ${conv.status === 'approved' ? 'text-emerald-500' : 'text-slate-500'}`}>{conv.status}</p>
                        </div>
                      </div>
                    ))}
                    {conversions.length === 0 && (
                      <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <span className="text-4xl opacity-30 mb-4 block">🔌</span>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">In attesa dei primi log S2S.</p>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          )}

          {/* VISTA 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
             <div className="space-y-10 animate-view">
                <div className="pb-6 border-b border-white/5">
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-gradient">Marketplace Privato</h1>
                  <p className="text-sm text-slate-400 mt-2 font-medium">Accordi diretti B2B. I margini esposti rappresentano il payout netto erogato al partner.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {offers.map((offer) => (
                    <div key={offer.id} className="glass-panel p-8 sm:p-10 flex flex-col relative group overflow-hidden hover:border-blue-500/30">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                      
                      <div className="flex items-start sm:items-center gap-6 mb-8 border-b border-white/5 pb-8">
                        <SafeImage src={offer.image_url} alt={offer.name} className="w-16 h-16 sm:w-20 sm:h-20 bg-white" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-black text-white text-2xl sm:text-3xl tracking-tight leading-none group-hover:text-blue-400 transition-colors">{offer.name}</h4>
                            <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${offer.payout_type === 'CPL' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>{offer.payout_type || 'CPA'}</span>
                          </div>
                          <button onClick={() => {setSelectedOffer(offer); setIsOfferModalOpen(true);}} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest mt-2 flex items-center gap-2 transition-colors">📄 Termini & Policy ➔</button>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1.5">Margine Netto</p>
                          <p className="font-black text-emerald-400 text-4xl sm:text-5xl tracking-tight leading-none drop-shadow-md">€{offer.partner_payout?.toFixed(2)}</p>
                        </div>
                        <div className="flex w-full sm:w-auto gap-3">
                          <button onClick={(e) => openSiteModal(offer, e)} className="flex-1 sm:flex-none text-[10px] font-black text-slate-300 bg-white/5 border border-white/10 px-6 py-4.5 rounded-xl hover:bg-white/10 transition-colors uppercase tracking-widest active:scale-95">Infrastruttura</button>
                          <button onClick={(e) => handleGetLink(offer, e)} className="flex-[2] sm:flex-none text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 px-8 py-4.5 rounded-xl shadow-[0_0_25px_rgba(59,130,246,0.3)] active:scale-95 transition-all">Genera Link S2S</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {offers.length === 0 && <div className="col-span-full py-20 text-center"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Sincronizzazione inventario in corso...</p></div>}
                </div>
             </div>
          )}
          
          {/* VISTA 3: ASSET */}
          {activeTab === 'assets' && (
            <div className="space-y-10 max-w-4xl animate-view">
              <div className="pb-6 border-b border-white/5">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-gradient">Sviluppo Infrastrutture</h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed font-medium">Richiedi la costruzione di nuovi Hub o dichiara nuove sorgenti esterne per sbloccare i link manuali.</p>
              </div>
              
              <div className="glass-panel p-8 sm:p-12 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">1. Audit Canale Indipendente</h2>
                    <p className="text-xs text-slate-400">Dichiara domini o profili esterni per la validazione Compliance.</p>
                  </div>
                  <StatusBadge status={profile?.traffic_status} />
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">URL Principale</label>
                      <input type="url" value={billing.registered_website} onChange={(e) => setBilling({...billing, registered_website: e.target.value})} className="input-premium font-mono text-blue-300" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Strategia & Budget Mensile</label>
                      <input type="text" value={billing.traffic_volume} onChange={(e) => setBilling({...billing, traffic_volume: e.target.value})} className="input-premium" placeholder="Es. Meta Ads / 500€" />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto bg-blue-600 text-white font-black text-[11px] px-10 py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50">
                      {savingSettings ? 'Inoltro Sicuro...' : 'Sottoponi a Dipartimento Compliance'}
                    </button>
                  </div>
                </div>

                {/* Box Storico Note Condivise */}
                {profile?.traffic_notes && (
                  <div className="mt-10 p-8 rounded-[1.5rem] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
                    <h3 className="text-sm font-black text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2">Storico Briefing Operativi</h3>
                    <textarea readOnly value={profile.traffic_notes} className="bg-black/40 border border-white/5 text-slate-300 p-5 rounded-xl font-mono text-xs w-full resize-none outline-none hide-scrollbar" rows={6} />
                  </div>
                )}
              </div>

              <div className="glass-panel p-8 sm:p-12 relative overflow-hidden border border-indigo-500/20">
                <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-6 relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">2. Deploy "Turn-Key" Hub</h2>
                  <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-black px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest shadow-[0_0_15px_rgba(79,70,229,0.2)]">Servizio B2B Incluso</span>
                </div>
                <p className="text-sm text-slate-400 mb-10 leading-relaxed relative z-10 max-w-3xl font-medium">L'IT progetterà per te Hub di comparazione o Landing Page singole. Puoi effettuare richieste illimitate. Ogni nuovo URL crittografato verrà consegnato nel Terminale.</p>
                <button onClick={() => {setSelectedOffer(null); setIsSiteModalOpen(true);}} className="w-full sm:w-auto bg-white text-black hover:bg-slate-200 font-black text-[11px] uppercase tracking-widest px-12 py-5 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all active:scale-95 relative z-10">
                  Avvia Nuova Richiesta Deploy
                </button>
              </div>
            </div>
          )}

          {/* VISTA 4: KYC E FATTURAZIONE */}
          {activeTab === 'kyc' && (
             <div className="space-y-10 max-w-4xl animate-view">
               <div className="pb-6 border-b border-white/5">
                 <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight text-gradient">Tesoreria Fiscale</h1>
                 <p className="text-sm text-slate-400 mt-2 font-medium">Dati crittografati AES-256. I pagamenti esigibili vengono liquidati su circuito SEPA.</p>
               </div>
               
               <div className="glass-panel p-8 sm:p-12 relative overflow-hidden">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                   <h2 className="text-2xl font-black text-white tracking-tight">Profilo Beneficiario</h2>
                   <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">
                     Stato: {profile?.kyc_status === 'approved' ? <span className="text-emerald-400">Verificato</span> : profile?.kyc_status === 'pending' ? <span className="text-amber-400">In Audit</span> : <span className="text-slate-400">Mancante</span>}
                   </div>
                 </div>

                 <div className="space-y-8 relative z-10">
                  <div className="flex p-1.5 bg-black/40 rounded-xl w-full sm:w-max border border-white/5">
                    <button onClick={() => setBilling({...billing, entity_type: 'privato'})} disabled={profile?.kyc_status === 'approved'} className={`px-10 py-4 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'privato' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Privato</button>
                    <button onClick={() => setBilling({...billing, entity_type: 'azienda'})} disabled={profile?.kyc_status === 'approved'} className={`px-10 py-4 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'azienda' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Impresa / P.IVA</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Intestatario Fiscale Conto Corrente</label>
                      <input type="text" value={billing.full_name} onChange={(e) => setBilling({...billing, full_name: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="input-premium" placeholder="Nome Completo o Ragione Sociale" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Codice Fiscale</label>
                      <input type="text" value={billing.tax_id} onChange={(e) => setBilling({...billing, tax_id: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="input-premium uppercase font-mono" placeholder="RSSMRA..." />
                    </div>
                    {billing.entity_type === 'azienda' && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Partita IVA</label>
                        <input type="text" value={billing.vat_number} onChange={(e) => setBilling({...billing, vat_number: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="input-premium font-mono" placeholder="IT0123..." />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Indirizzo Sede Legale / Residenza</label>
                      <input type="text" value={billing.address} onChange={(e) => setBilling({...billing, address: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="input-premium" placeholder="Via, Numero, CAP, Città" />
                    </div>
                    
                    <div className="md:col-span-2 mt-4 pt-8 border-t border-white/5">
                      <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><span className="text-lg">🔒</span> IBAN Erogazione Fondi (Area SEPA)</label>
                      <input type="text" value={billing.payment_info} onChange={(e) => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="input-premium text-lg sm:text-xl font-mono uppercase tracking-[0.2em] border-emerald-500/30 focus:border-emerald-500 bg-emerald-500/5 text-emerald-400" placeholder="IT00X00000000000000000" />
                    </div>
                  </div>

                  {(!profile?.kyc_status || profile?.kyc_status === 'none' || profile?.kyc_status === 'pending') && (
                    <div className="pt-4 flex justify-end">
                      <button onClick={handleSaveSettings} disabled={savingSettings || profile?.kyc_status === 'approved'} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-14 py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 uppercase tracking-widest disabled:opacity-50">
                        {savingSettings ? 'Crittografia...' : 'Salva e Invia a Fisco'}
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
      <nav className="md:hidden fixed bottom-0 w-full bg-[#020617]/90 backdrop-blur-2xl border-t border-white/5 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex justify-around p-2">
          {[ 
            {id: 'overview', icon: '📊', label: 'Home'}, 
            {id: 'marketplace', icon: '🏦', label: 'Offerte'}, 
            {id: 'assets', icon: '🖥️', label: 'Hub'}, 
            {id: 'kyc', icon: '🛡️', label: 'Dati'} 
          ].map((tab) => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex flex-col items-center justify-center w-full py-2.5 rounded-xl transition-all relative ${activeTab === tab.id ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white'}`}>
              <span className={`text-xl mb-1 ${activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'opacity-70'}`}>{tab.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              {(tab.id === 'kyc') && profile?.[tab.id + '_status'] === 'pending' && <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>}
            </button>
          ))}
        </div>
      </nav>

      {/* MODALE ONBOARDING */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#020617]/95 backdrop-blur-md animate-view">
          <div className="glass-panel p-1 rounded-[2.5rem] max-w-4xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400"></div>
            <div className="p-8 sm:p-12 overflow-y-auto hide-scrollbar">
              <div className="flex justify-between items-start mb-10 pb-6 border-b border-white/5">
                <div>
                  <div className="inline-block px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-widest mb-4">Confidential B2B</div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">Protocollo Operativo</h2>
                  <p className="text-sm text-slate-400 max-w-xl leading-relaxed">Benvenuto in FinancePartner. Abbiamo rimosso la pubblicità, l'interfaccia caotica e i vecchi cookie per offrirti l'infrastruttura di acquisizione più potente d'Europa.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-black/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <h3 className="text-xl font-black text-white mb-3 flex items-center gap-3"><span className="text-blue-500">01.</span> Superiorità S2S</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">Il mercato perde il 30% delle vendite a causa di iOS e AdBlocker. Qui, quando generi un lead, i server della banca comunicano <strong className="text-white">direttamente tramite API</strong> col nostro database usando il tuo SubID. Zero click persi. Tracciamento assoluto.</p>
                </div>
                <div className="bg-black/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                  <h3 className="text-xl font-black text-white mb-3 flex items-center gap-3"><span className="text-emerald-500">02.</span> Strategia: L'Hub Multilink</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4 font-medium">La finanza paga le CPA più alte al mondo. Richiedi nella sezione "Infrastrutture" il tuo <strong>Hub Multilink</strong>. Promuovi l'Hub. L'utente sceglierà da solo la banca migliore per lui e il tuo Conversion Rate esploderà.</p>
                </div>
                <div className="bg-rose-950/20 border border-rose-900/50 p-8 rounded-3xl">
                  <h3 className="text-lg font-black text-rose-400 mb-3 flex items-center gap-2">⚠️ Policy di Rete: Zero Tolleranza</h3>
                  <p className="text-sm text-rose-200/70 leading-relaxed font-medium">Non tolleriamo traffico "Incentivato" né "Brand Bidding". Le violazioni portano allo storno istantaneo delle commissioni a tutela del network.</p>
                </div>
              </div>
              <div className="mt-12 flex justify-end">
                <button onClick={() => setIsStrategyModalOpen(false)} className="bg-white text-black font-black text-[11px] uppercase tracking-widest px-12 py-5 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">Comprendo, Entra nel Terminale</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE RICHIESTA SITO */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md animate-view">
          <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] max-w-xl w-full relative overflow-hidden border border-indigo-500/30">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.8)]"></div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Deploy Infrastruttura</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">Target: <strong className="text-white">{selectedOffer ? selectedOffer.name : "Hub Globale (Raccomandato)"}</strong>. L'URL che riceverai potrà essere combinato con gli asset già attivi.</p>
            <form onSubmit={handleRequestSiteSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Posizionamento & Sorgente Ads</label>
                <textarea required rows="3" value={siteForm.whereToPromote} onChange={(e) => setSiteForm({...siteForm, whereToPromote: e.target.value})} className="input-premium resize-none" placeholder="Es. TikTok Bio + Meta Ads focalizzate sul risparmio..."></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">KPI Obiettivi (Volume/Budget)</label>
                <input type="text" required value={siteForm.goals} onChange={(e) => setSiteForm({...siteForm, goals: e.target.value})} className="input-premium" placeholder="Es. Budget 50€/Giorno | 100 Lead/Mese" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="flex-1 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white/5 hover:bg-white/10 py-5 rounded-xl transition-colors active:scale-95">Annulla</button>
                <button type="submit" disabled={savingSettings} className="flex-[2] text-[11px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 py-5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 transition-all disabled:opacity-50">INVIA BRIEFING</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE DETTAGLI OFFERTA COMPLETO E RIPRISTINATO --- */}
      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md animate-view" onClick={() => setIsOfferModalOpen(false)}>
          <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative border-t border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-8">
              <div className="flex items-center gap-6">
                <SafeImage src={selectedOffer.image_url} alt={selectedOffer.name} className="w-20 h-20 bg-white" />
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-3">{selectedOffer.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-[9px] font-black text-slate-300 bg-white/10 uppercase tracking-widest">Modello {selectedOffer.payout_type || 'CPA'}</span>
                    <span className="px-3 py-1.5 rounded-lg text-[9px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest">Margine: €{selectedOffer.partner_payout?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-white flex items-center justify-center font-bold">✕</button>
            </div>
            
            <div className="space-y-6 max-h-[50vh] overflow-y-auto hide-scrollbar pr-2">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Protocollo Informativo Campagna</h4>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-black/40 p-6 rounded-2xl border border-white/5 font-mono">{selectedOffer.description || 'Dettagli tecnici non forniti dal network.'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Geo Target (Nazioni)</p>
                   <p className="text-sm font-bold text-white tracking-tight">{selectedOffer.allowed_countries || 'Italia (IT)'}</p>
                 </div>
                 <div className="bg-black/40 border border-white/5 p-6 rounded-2xl">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Traffico Autorizzato</p>
                   <p className="text-sm font-bold text-emerald-400 tracking-tight">{selectedOffer.allowed_traffic || 'Meta, TikTok, SEO, Native'}</p>
                 </div>
              </div>
              
              {selectedOffer.restrictions && (
                <div className="bg-rose-950/20 border border-rose-900/50 p-6 rounded-2xl">
                   <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="text-rose-500 text-base">⚠️</span> Divieti Assoluti (Pena Storno)</p>
                   <p className="text-xs font-medium text-rose-200/70 leading-relaxed">{selectedOffer.restrictions}</p>
                </div>
              )}
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4">
              <button onClick={(e) => handleGetLink(selectedOffer, e)} className="flex-[2] text-[11px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">Ottieni Link S2S</button>
              <button onClick={(e) => {setIsOfferModalOpen(false); openSiteModal(selectedOffer, e);}} className="flex-1 text-[11px] font-black uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 py-5 rounded-xl transition-all">Deploy Hub</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}