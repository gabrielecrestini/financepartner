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
  
  // Form Sito: Niente URL, solo info strategiche
  const [siteForm, setSiteForm] = useState({ whereToPromote: '', goals: '' });
  
  const router = useRouter();

  // Memoria Tab attiva
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
      
      // --- AGGIORNAMENTO IP SILENZIOSO ---
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const { ip } = await res.json();
        // Aggiorna l'IP corrente. Il blocco di sicurezza vero e proprio avviene nella pagina Login
        if (profileData && profileData.last_ip !== ip) {
           await supabase.from('profiles').update({ last_ip: ip }).eq('id', user.id);
        }
      } catch (e) { 
        console.log("IP non rilevato", e); 
      }
      // --- FINE AGGIORNAMENTO IP ---

      setProfile(profileData);
      
      if (profileData) {
        setBilling({
          full_name: profileData.full_name || '', entity_type: profileData.entity_type || 'privato',
          vat_number: profileData.vat_number || '', tax_id: profileData.tax_id || '',
          address: profileData.address || '', payment_info: profileData.payment_info || '',
          registered_website: profileData.registered_website || '', traffic_volume: profileData.traffic_volume || ''
        });
      }

      // Fetch Notifiche Push
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications(notifs || []);

      // Fetch Offerte
      const { data: offersData } = await supabase.from('offers').select('*');
      setOffers(offersData || []);

      // Fetch Conversioni
      const { data: convData } = await supabase.from('conversions').select('*').eq('partner_id', user.id).order('created_at', { ascending: false });
      setConversions(convData || []);

      // Calcolo Metriche
      const { count: totalClicks } = await supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('affiliate_id', user.id);
      
      const convs = convData || [];
      const totalApproved = profileData?.wallet_approved || 0;
      const totalConversions = convs.filter(c => c.status === 'approved').length;

      setStats({
        clicks: totalClicks || 0, 
        epc: totalClicks > 0 ? (totalApproved / totalClicks) : 0, 
        cr: totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0
      });

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
      alert("🔒 ACCESSO NEGATO\n\nSorgente di traffico non approvata. Vai in 'Asset & Sorgenti' per compilare la richiesta e sbloccare i link.");
      handleTabChange('assets'); 
      return;
    }
    const trackingLink = `${window.location.origin}/api/click?offer_id=${offer.id}&subid=${user.id}`;
    navigator.clipboard.writeText(trackingLink);
    alert("🔗 Tracking Link Copiato negli appunti!");
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

  // Modulo Richiesta Sito B2B
  const handleRequestSiteSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const { error } = await supabase.from('profiles').update({
      traffic_status: 'pending',
      traffic_volume: siteForm.goals,
      traffic_notes: `Richiesta Sito per: ${selectedOffer.name} | Dove Promuove: ${siteForm.whereToPromote} | Obiettivi: ${siteForm.goals}`
    }).eq('id', user.id);

    setSavingSettings(false);
    if (!error) {
      setProfile({...profile, traffic_status: 'pending'});
      setIsSiteModalOpen(false);
      alert("✅ Modulo inviato. Il team tecnico valuterà la tua richiesta e riceverai una notifica quando il sito sarà pronto.");
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMsg({ text: '', type: '' });

    if (billing.payment_info) {
      const ibanRegex = /^[a-zA-Z]{2}[0-9a-zA-Z]{13,32}$/;
      const cleanIban = billing.payment_info.replace(/\s+/g, '').toUpperCase();
      if (!ibanRegex.test(cleanIban)) {
        setSettingsMsg({ text: 'Formato IBAN non valido per l\'Area SEPA.', type: 'error' });
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
      setSettingsMsg({ text: 'Dati sincronizzati con il server centrale.', type: 'success' });
      setProfile({...profile, traffic_status: newTrafficStatus, kyc_status: newKycStatus, registered_website: cleanWebsite}); 
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 4000);
    } else {
      setSettingsMsg({ text: 'Errore di crittografia.', type: 'error' });
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max shadow-sm"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Verificato</span>;
    if (status === 'pending') return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max shadow-sm"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> In Revisione</span>;
    if (status === 'rejected') return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max shadow-sm"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Rifiutato</span>;
    return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-max shadow-sm">Da Compilare</span>;
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-800 font-sans flex flex-col md:flex-row relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        .light-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 1); box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05); }
        .data-input { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; width: 100%; outline: none; transition: all 0.3s ease; }
        .data-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* HEADER MOBILE & NOTIFICHE */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={markNotificationsAsRead} className="relative w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-xl hover:scale-105 transition-transform border border-slate-100">
          🔔
          {unreadCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}
        </button>
        {showNotifications && (
          <div className="absolute top-14 right-0 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 uppercase tracking-widest text-xs">Centro Notifiche</div>
            <div className="max-h-80 overflow-y-auto p-2">
              {notifications.length === 0 ? <p className="p-6 text-xs text-slate-500 text-center uppercase font-bold tracking-widest">Nessuna comunicazione</p> : notifications.map(n => (
                <div key={n.id} className={`p-4 mb-2 rounded-xl text-sm ${n.is_read ? 'bg-white opacity-60' : 'bg-blue-50 border border-blue-100'}`}>
                  <h4 className="font-bold text-slate-900 mb-1">{n.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[9px] text-slate-400 mt-2 font-mono">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-slate-200 bg-white shadow-sm p-6 relative z-40">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">F</div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">FinancePartner</span>
        </div>
        
        <div className="space-y-2 flex-1">
          <button onClick={() => handleTabChange('overview')} className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>📊 Terminale Dati</button>
          <button onClick={() => handleTabChange('marketplace')} className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'marketplace' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>🏦 Catalogo Offerte</button>
          <button onClick={() => handleTabChange('assets')} className={`w-full flex justify-between px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'assets' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span>📱 Asset & Sorgenti</span>
            {(profile?.traffic_status === 'pending') && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1.5"></span>}
          </button>
          <button onClick={() => handleTabChange('kyc')} className={`w-full flex justify-between px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'kyc' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span>🛡️ Fatturazione KYC</span>
            {(profile?.kyc_status === 'pending') && <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></span>}
          </button>
        </div>
        
        <div className="mt-auto p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-center shadow-inner">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assistenza Network</p>
          <a href="mailto:gabrielecrestini45@gmail.com" className="text-xs font-bold text-blue-600 break-words hover:underline">gabrielecrestini45@gmail.com</a>
        </div>
        <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-slate-800 py-3 uppercase tracking-widest transition-colors w-full">Disconnetti</button>
      </aside>

      {/* --- HEADER MOBILE --- */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white/90 backdrop-blur-xl z-40 relative shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs">F</div>
           <span className="font-bold text-slate-900 tracking-tight">FinancePartner</span>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 h-screen overflow-y-auto p-6 sm:p-10 pb-32 relative z-10">
        
        {/* Sfondo Animato */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] bg-blue-200/50"></div>
        </div>

        <div className="max-w-[1200px] mx-auto relative z-10">

          {/* VISTA 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Pannello di Controllo</h1>
              
              {/* Box Link Assegnato (Sito Pronto) */}
              {profile?.assigned_site_link && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-500/30">
                  <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">🚀 La tua Infrastruttura è Pronta!</h3>
                    <p className="text-sm text-blue-100 leading-relaxed">Il team tecnico ha rilasciato il tuo asset. Puoi iniziare a promuovere usando questo link.</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                    <input type="text" readOnly value={profile.assigned_site_link} className="bg-black/20 border border-white/20 text-white px-5 py-3 rounded-xl font-mono text-sm w-full outline-none focus:border-white/40 transition-colors" />
                    <button onClick={() => {navigator.clipboard.writeText(profile.assigned_site_link); alert("🔗 Link Copiato! Buon lavoro.");}} className="bg-white text-blue-600 font-bold px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-md active:scale-95 uppercase tracking-widest text-xs">Copia Link Ufficiale</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem]"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Netto</span><p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">€{profile?.wallet_approved?.toFixed(2)}</p></div>
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem]"><span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">In Valutazione</span><p className="text-3xl sm:text-4xl font-black text-amber-500 mt-2">€{profile?.wallet_pending?.toFixed(2)}</p></div>
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem]"><span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Conv. Rate</span><p className="text-3xl sm:text-4xl font-black text-blue-500 mt-2">{stats.cr.toFixed(2)}%</p></div>
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem]"><span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">EPC Rete</span><p className="text-3xl sm:text-4xl font-black text-emerald-500 mt-2">€{stats.epc.toFixed(2)}</p></div>
              </div>

              <div className="light-panel rounded-[2rem] p-8">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feed Transazioni Server (S2S)</h3>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  </div>
                  <div className="space-y-4">
                    {conversions.slice(0, 5).map((conv) => (
                      <div key={conv.id} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 group">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{conv.program_id || 'Offerta Nascosta'}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">{new Date(conv.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${conv.status === 'approved' ? 'text-emerald-500' : conv.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>+€{conv.amount?.toFixed(2)}</p>
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">{conv.status}</p>
                        </div>
                      </div>
                    ))}
                    {conversions.length === 0 && <p className="text-xs font-bold text-slate-400 text-center py-10 uppercase tracking-widest">Nessun evento registrato</p>}
                  </div>
              </div>
            </div>
          )}

          {/* VISTA 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
             <div className="space-y-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Catalogo Istituzionale</h1>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {offers.map((offer) => (
                    <div key={offer.id} className="light-panel p-6 sm:p-8 rounded-[2rem] flex flex-col relative border border-slate-200 hover:border-blue-200 transition-colors">
                      <div className="absolute top-6 right-6 hidden sm:block"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${offer.payout_type === 'CPL' ? 'bg-cyan-100 text-cyan-700' : 'bg-indigo-100 text-indigo-700'}`}>{offer.payout_type || 'CPA'} Model</span></div>
                      
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1rem] bg-white border border-slate-100 flex items-center justify-center p-2 shadow-sm shrink-0">
                          {offer.image_url ? <img src={offer.image_url} className="w-full h-full object-contain" alt="" /> : <span className="text-3xl">🏦</span>}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xl sm:text-2xl line-clamp-1">{offer.name}</h4>
                          <button onClick={() => {setSelectedOffer(offer); setIsOfferModalOpen(true);}} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest mt-1.5 flex items-center gap-1">Scheda Regole ➔</button>
                        </div>
                      </div>

                      <div className="mt-auto border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 w-full sm:w-auto text-center sm:text-left">
                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">Commissione</p>
                          <p className="font-black text-emerald-500 text-2xl">€{offer.partner_payout?.toFixed(2)}</p>
                        </div>
                        <div className="flex w-full sm:w-auto gap-2">
                          <button onClick={(e) => openSiteModal(offer, e)} className="flex-1 sm:flex-none text-xs font-bold text-slate-700 bg-white border border-slate-200 px-6 py-3.5 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">Richiedi Sito</button>
                          <button onClick={(e) => handleGetLink(offer, e)} className="flex-[2] sm:flex-none text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-all">Ottieni Link</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {offers.length === 0 && <p className="text-slate-500 font-bold uppercase tracking-widest text-xs col-span-full text-center py-20">Database in aggiornamento...</p>}
                </div>
             </div>
          )}
          
          {/* VISTA 3: ASSET E SORGENTI */}
          {activeTab === 'assets' && (
            <div className="space-y-8 max-w-4xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Sorgenti di Traffico</h1>
              
              <div className="light-panel p-8 sm:p-10 rounded-[2rem]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">1. Collega la tua Sorgente</h2>
                    <p className="text-xs text-slate-500 mt-1">Dichiara il tuo sito o profilo per sbloccare i tracking link nativi.</p>
                  </div>
                  <StatusBadge status={profile?.traffic_status} />
                </div>

                <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">URL Ufficiale (Sito, Pagina IG, Canale TG)</label>
                    <input type="url" value={billing.registered_website} onChange={(e) => setBilling({...billing, registered_website: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input text-sm font-mono text-blue-600 disabled:opacity-50 disabled:bg-slate-200" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Strategia e Volumi Stimati</label>
                    <input type="text" value={billing.traffic_volume} onChange={(e) => setBilling({...billing, traffic_volume: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input text-sm disabled:opacity-50 disabled:bg-slate-200" placeholder="Es. 500€/mese su Meta Ads" />
                  </div>
                  
                  {(!profile?.traffic_status || profile?.traffic_status === 'none') && (
                    <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-10 py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                      Invia per Revisione Compliance
                    </button>
                  )}
                </div>

                {profile?.traffic_status === 'pending' && profile?.traffic_notes && (
                  <div className="mt-8 p-6 rounded-2xl border border-amber-200 bg-amber-50">
                    <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">⏳ Creazione Asset in Corso</h3>
                    <p className="text-xs text-amber-900/80 leading-relaxed font-mono bg-white p-4 rounded-xl border border-amber-100">{profile.traffic_notes}</p>
                  </div>
                )}
              </div>

              <div className="light-panel p-8 sm:p-10 rounded-[2rem] border border-blue-100">
                <h2 className="text-xl font-bold text-slate-900 mb-2">2. Richiedi Creazione Sito</h2>
                <p className="text-sm text-slate-600 mb-6">Non hai un sito idoneo? Il nostro team di sviluppatori creerà un'infrastruttura ad alta conversione per te.</p>
                <button onClick={() => {setSelectedOffer({name: 'Richiesta Asset Generica'}); setIsSiteModalOpen(true);}} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                  Compila Modulo Tecnico
                </button>
              </div>
            </div>
          )}

          {/* VISTA 4: KYC E FATTURAZIONE */}
          {activeTab === 'kyc' && (
             <div className="space-y-8 max-w-4xl">
               <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Dati Amministrativi</h1>
               
               <div className="light-panel p-8 sm:p-10 rounded-[2rem]">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
                   <div>
                     <h2 className="text-xl font-bold text-slate-900">Coordinate per Bonifici SEPA</h2>
                     <p className="text-xs text-slate-500 mt-1">Dati necessari per l'emissione dei pagamenti e documentazione fiscale.</p>
                   </div>
                   <StatusBadge status={profile?.kyc_status} />
                 </div>

                 <div className="space-y-6">
                  <div className="flex p-1.5 bg-slate-100 rounded-xl w-full sm:w-max">
                    <button onClick={() => setBilling({...billing, entity_type: 'privato'})} disabled={profile?.kyc_status === 'approved'} className={`px-8 py-3 text-xs font-bold rounded-lg transition-all disabled:opacity-50 ${billing.entity_type === 'privato' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Privato (Occasionale)</button>
                    <button onClick={() => setBilling({...billing, entity_type: 'azienda'})} disabled={profile?.kyc_status === 'approved'} className={`px-8 py-3 text-xs font-bold rounded-lg transition-all disabled:opacity-50 ${billing.entity_type === 'azienda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Azienda / P.IVA</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Intestatario del Conto</label>
                      <input type="text" value={billing.full_name} onChange={(e) => setBilling({...billing, full_name: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input text-sm disabled:opacity-50 disabled:bg-slate-200" placeholder="Nome Completo o Ragione Sociale" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Codice Fiscale</label>
                      <input type="text" value={billing.tax_id} onChange={(e) => setBilling({...billing, tax_id: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input text-sm uppercase font-mono disabled:opacity-50 disabled:bg-slate-200" placeholder="RSSMRA..." />
                    </div>
                    {billing.entity_type === 'azienda' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Partita IVA</label>
                        <input type="text" value={billing.vat_number} onChange={(e) => setBilling({...billing, vat_number: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input text-sm font-mono disabled:opacity-50 disabled:bg-slate-200" placeholder="IT0123..." />
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Indirizzo Sede / Residenza</label>
                      <input type="text" value={billing.address} onChange={(e) => setBilling({...billing, address: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input text-sm disabled:opacity-50 disabled:bg-slate-200" placeholder="Via Roma 1, Milano" />
                    </div>
                    
                    <div className="sm:col-span-2 mt-4 pt-6 border-t border-slate-200">
                      <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">IBAN di Accredito (Solo Area SEPA)</label>
                      <input type="text" value={billing.payment_info} onChange={(e) => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input text-base font-mono uppercase tracking-[0.1em] border-blue-200 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-200 bg-white" placeholder="IT00X00000000000000000" />
                    </div>
                  </div>

                  {(!profile?.kyc_status || profile?.kyc_status === 'none' || profile?.kyc_status === 'pending') && (
                    <div className="pt-2">
                      <button onClick={handleSaveSettings} disabled={savingSettings || profile?.kyc_status === 'approved'} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-12 py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest disabled:opacity-50">
                        {savingSettings ? 'Crittografia...' : 'Salva & Invia al Team'}
                      </button>
                    </div>
                  )}
                  {settingsMsg.text && <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 p-3 rounded-lg ${settingsMsg.type==='error'?'bg-rose-50 text-rose-600':'bg-emerald-50 text-emerald-600'}`}>{settingsMsg.text}</p>}
                </div>
               </div>
             </div>
          )}
        </div>
      </main>

      {/* BOTTOM BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around p-2">
          <button onClick={() => handleTabChange('overview')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors ${activeTab === 'overview' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><span className="text-xl">📊</span><span className="text-[9px] font-bold uppercase tracking-widest">Home</span></button>
          <button onClick={() => handleTabChange('marketplace')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors ${activeTab === 'marketplace' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><span className="text-xl">🏦</span><span className="text-[9px] font-bold uppercase tracking-widest">Offerte</span></button>
          <button onClick={() => handleTabChange('assets')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors relative ${activeTab === 'assets' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <span className="text-xl">📱</span><span className="text-[9px] font-bold uppercase tracking-widest">Asset</span>
             {profile?.traffic_status === 'pending' && <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-500 shadow-md"></span>}
          </button>
          <button onClick={() => handleTabChange('kyc')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors relative ${activeTab === 'kyc' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <span className="text-xl">🛡️</span><span className="text-[9px] font-bold uppercase tracking-widest">KYC</span>
             {profile?.kyc_status === 'pending' && <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-500 shadow-md"></span>}
          </button>
        </div>
      </nav>

      {/* MODALE RICHIESTA SITO (SENZA URL, CON REGOLE E DIVIETI) */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-view">
          <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[2.5rem] max-w-lg w-full shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Creazione Asset Web</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Briefing tecnico per la campagna <strong className="text-slate-800">{selectedOffer?.name}</strong>. Il team ti invierà una notifica appena il sito sarà online.</p>
            
            <form onSubmit={handleRequestSiteSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Canali e Angolo di Promozione</label>
                <textarea required rows="3" value={siteForm.whereToPromote} onChange={(e) => setSiteForm({...siteForm, whereToPromote: e.target.value})} className="data-input resize-none" placeholder="Es. Userò una pagina Instagram da 50k follower e farò Meta Ads con creatività focalizzate sul risparmio..."></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Obiettivi Stimati (Budget o Conversioni)</label>
                <input type="text" required value={siteForm.goals} onChange={(e) => setSiteForm({...siteForm, goals: e.target.value})} className="data-input" placeholder="Es. 100 Lead al mese / Budget 50€ al giorno" />
              </div>
              
              <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="text-base">⚠️</span> Policy di Rete</p>
                <p className="text-xs text-rose-800 font-medium leading-relaxed">Accettando la creazione, ti impegni in modo trasparente a rispettare le restrizioni della banca. Traffico incentivato, finte promesse o Brand Bidding porteranno al ban e allo storno di tutti i guadagni generati.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="flex-1 text-xs font-bold uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 py-4 rounded-xl transition-colors">Annulla</button>
                <button type="submit" disabled={savingSettings} className="flex-[2] text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                  {savingSettings ? 'Invio...' : 'Invia Richiesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DETTAGLI OFFERTA COMPLETO */}
      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-view" onClick={() => setIsOfferModalOpen(false)}>
          <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {selectedOffer.image_url ? <img src={selectedOffer.image_url} alt="" className="w-full h-full object-contain p-2" /> : <span className="text-2xl">🏦</span>}
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{selectedOffer.name}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] font-bold border border-slate-200 text-slate-500 px-3 py-1 rounded-lg uppercase tracking-widest">Modello {selectedOffer.payout_type || 'CPA'}</span>
                    <span className="text-[9px] font-bold border border-emerald-200 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest">Payout: €{selectedOffer.partner_payout?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold transition-colors">✕</button>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto hide-scrollbar pr-2">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Informazioni Campagna</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-5 rounded-2xl border border-slate-100">{selectedOffer.description || 'Dettagli non forniti per questa offerta.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Geo</p>
                   <p className="text-sm font-bold text-slate-800">{selectedOffer.allowed_countries || 'Italia (IT)'}</p>
                 </div>
                 <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Traffico OK</p>
                   <p className="text-sm font-bold text-emerald-600">{selectedOffer.allowed_traffic || 'Meta, SEO, Native'}</p>
                 </div>
              </div>
              {selectedOffer.restrictions && (
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                   <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="text-base">⚠️</span> Divieti Assoluti</p>
                   <p className="text-xs font-medium text-rose-800 leading-relaxed">{selectedOffer.restrictions}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button onClick={(e) => handleGetLink(selectedOffer, e)} className="flex-[2] text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition-all shadow-lg active:scale-95">Ottieni Link Tracciato</button>
              <button onClick={(e) => {setIsOfferModalOpen(false); openSiteModal(selectedOffer, e);}} className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 py-4 rounded-xl transition-all">Richiedi Sito</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}