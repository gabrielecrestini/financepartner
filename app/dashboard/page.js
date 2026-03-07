"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Componente intelligente per loghi
const SafeImage = ({ src, alt, fallbackIcon = "🏦", className }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#0F172A] to-[#020617] border border-white/5 rounded-2xl shadow-inner ${className}`}>
        <span className="opacity-30 text-2xl drop-shadow-lg">{fallbackIcon}</span>
      </div>
    );
  }
  return (
    <div className={`bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-xl shrink-0 border border-slate-200/20 ${className}`}>
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
  const [chartData, setChartData] = useState([]);
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

  // CALCOLO NOTIFICHE BLINDATO
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    setIsMounted(true);
    const savedTab = localStorage.getItem('fp_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    if (mainContentRef.current) {
      mainContentRef.current.style.opacity = 0;
      mainContentRef.current.style.transform = 'translateY(15px) scale(0.98)';
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
      } catch (e) {}

      setProfile(profileData);
      
      if (profileData?.traffic_status === 'approved') {
        setBilling({ full_name: profileData.full_name || '', entity_type: profileData.entity_type || 'privato', vat_number: profileData.vat_number || '', tax_id: profileData.tax_id || '', address: profileData.address || '', payment_info: profileData.payment_info || '', registered_website: profileData.registered_website || '', traffic_volume: profileData.traffic_volume || '' });

        const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setNotifications(notifs || []);

        const { data: offersData } = await supabase.from('offers').select('*');
        setOffers(offersData || []);

        const { data: convData } = await supabase.from('conversions').select('*').eq('partner_id', user.id).order('created_at', { ascending: false });
        setConversions(convData || []);

        const { data: clickData } = await supabase.from('clicks').select('created_at').eq('affiliate_id', user.id);
        const clicks = clickData || [];
        const totalClicks = clicks.length;
        
        const convs = convData || [];
        const totalApproved = profileData?.wallet_approved || 0;
        const totalConversions = convs.filter(c => c.status === 'approved').length;

        setStats({ clicks: totalClicks, epc: totalClicks > 0 ? (totalApproved / totalClicks) : 0, cr: totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0 });

        // MOTORE GRAFICO: Ultimi 7 giorni
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

        if (totalClicks === 0 && !profileData.assigned_site_link) {
          setTimeout(() => setIsStrategyModalOpen(true), 1200);
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

  const showToast = (text, type) => {
    setSettingsMsg({ text, type });
    setTimeout(() => setSettingsMsg({ text: '', type: '' }), 3500);
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
    showToast("🔗 URL Server-to-Server Copiato in Appunti", 'success');
  };

  // --- LOGICA RICHIESTA SITI (MULTI-RICHIESTA) ---
  const handleRequestSiteSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const targetName = selectedOffer ? selectedOffer.name : "Hub Multilink Globale";
    const trackingLinkToProvide = selectedOffer ? `https://financepartner.netlify.app/api/click?offer_id=${selectedOffer.id}&subid=${user.id}` : `Hub. SubID: ${user.id}`;
    const timestamp = new Date().toLocaleString('it-IT');
    const newBriefing = `\n\n--- [${timestamp}] ---\n🎯 ASSET: ${targetName}\n🔗 LINK S2S: ${trackingLinkToProvide}\n📱 STRATEGIA: ${siteForm.whereToPromote}\n💰 KPI: ${siteForm.goals}`;
    
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
      if (!ibanRegex.test(billing.payment_info.replace(/\s+/g, ''))) { showToast('Errore: IBAN SEPA non conforme.', 'error'); setSavingSettings(false); return; }
    }
    const { error } = await supabase.from('profiles').update({...billing, payment_info: billing.payment_info.replace(/\s+/g, '').toUpperCase()}).eq('id', user.id);
    setSavingSettings(false);
    if (!error) {
      showToast('Dati Fiscali sincronizzati (AES-256).', 'success');
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

  const openSiteModal = (offer, e) => {
    if (e) e.stopPropagation();
    setSelectedOffer(offer);
    setIsSiteModalOpen(true);
  };

  const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Verificato</span>;
    if (status === 'pending') return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> In Audit</span>;
    if (status === 'rejected') return <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(243,64,84,0.2)]"><span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span> Bloccato</span>;
    return <span className="bg-white/5 border border-white/10 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Azione Richiesta</span>;
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-[#02040A] flex flex-col items-center justify-center gap-6"><div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.5)]"></div><p className="text-blue-400/60 text-[10px] font-mono tracking-widest uppercase animate-pulse">Caricamento Dati Crittografati...</p></div>;

  // =======================================================================
  // GATEKEEPER: SALA D'ATTESA VIP
  // =======================================================================
  if (profile && profile.traffic_status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#02040A] text-white flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-500/30">
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; }
          @keyframes radar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
          @keyframes fadeUpGate { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          .gate-panel { background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 40px 80px rgba(0,0,0,0.8); animation: fadeUpGate 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .radar-sweep { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 0deg, transparent 70%, rgba(59, 130, 246, 0.4) 100%); animation: radar 2.5s linear infinite; }
          .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
          .input-gate { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 20px; border-radius: 16px; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.95rem; }
          .input-gate:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: rgba(0,0,0,0.7); }
        `}} />

        <div className="absolute inset-0 z-0 bg-grid opacity-40 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        
        <button onClick={handleLogout} className="absolute top-8 right-8 z-50 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">Disconnetti</button>

        {(!profile.traffic_status || profile.traffic_status === 'none') && (
          <div className="gate-panel p-8 sm:p-14 rounded-[2.5rem] max-w-xl w-full relative z-10">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-[#02040A] border border-blue-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)]">🔐</div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Accesso Riservato B2B</h2>
            <p className="text-base text-slate-400 mb-10 leading-relaxed font-medium">Il nostro network eroga le commissioni finanziarie più alte sul mercato. Per tutelare i budget bancari, approviamo manualmente ogni affiliato. Dichiara i tuoi asset operativi.</p>
            
            <form onSubmit={submitApplication} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">URL Principale (Sito o Profilo Social)</label>
                <input type="text" value={gateForm.url} onChange={e => setGateForm({...gateForm, url: e.target.value})} className="input-gate font-mono text-blue-200" placeholder="https:// (Opzionale se richiedi Hub)" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Strategia Operativa & KPI (Obbligatorio)</label>
                <textarea required rows="3" value={gateForm.strategy} onChange={e => setGateForm({...gateForm, strategy: e.target.value})} className="input-gate resize-none" placeholder="Es. Promuoverò l'Hub di comparazione tramite Meta Ads con budget di 50€/giorno..."></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isSubmittingGate} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[13px] px-8 py-5 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.4)] active:scale-95 uppercase tracking-widest transition-all disabled:opacity-50">
                  {isSubmittingGate ? 'Invio Dati Sicuro...' : 'Sottoponi Profilo a Compliance'}
                </button>
              </div>
            </form>
          </div>
        )}

        {profile.traffic_status === 'pending' && (
          <div className="gate-panel p-10 sm:p-20 rounded-[3rem] max-w-lg w-full relative z-10 text-center flex flex-col items-center border border-amber-500/20">
            <div className="relative w-36 h-36 flex items-center justify-center mb-12">
              <div className="absolute inset-0 border border-blue-500/30 rounded-full"></div>
              <div className="absolute inset-3 border border-blue-500/10 rounded-full"></div>
              <div className="absolute inset-0 rounded-full radar-sweep"></div>
              <div className="absolute w-28 h-28 bg-[#02040A] rounded-full z-10 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,1)]"><span className="text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">⏳</span></div>
              <div className="absolute inset-0 border-2 border-blue-500/50 rounded-full animate-[pulseRing_2.5s_infinite]"></div>
            </div>
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-8 shadow-[0_0_20px_rgba(245,158,11,0.2)]"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span> Analisi in Corso</div>
            <h2 className="text-4xl font-black text-white mb-5 tracking-tight">Audit Compliance</h2>
            <p className="text-base text-slate-400 leading-relaxed mb-10">Il tuo profilo è in fase di validazione da parte del dipartimento anti-frode. L'approvazione richiede mediamente dalle 12 alle 24 ore.</p>
            <div className="w-full bg-black/50 border border-white/10 rounded-[1.5rem] p-7 text-left space-y-5">
              <div className="flex items-center gap-4 text-sm font-bold text-slate-300"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.3)]">✓</span> Dati Ricevuti</div>
              <div className="flex items-center gap-4 text-sm font-bold text-slate-300"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.3)]">✓</span> Identity Encryption AES</div>
              <div className="flex items-center gap-4 text-sm font-bold text-white"><span className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(59,130,246,0.3)]"></span> Quality Check Manuale</div>
            </div>
            <p className="mt-10 text-[10px] text-slate-500 font-mono tracking-widest uppercase">ID Pratica: {user.id.substring(0,12)}</p>
          </div>
        )}

        {profile.traffic_status === 'rejected' && (
          <div className="gate-panel p-10 rounded-[3rem] max-w-md w-full relative z-10 text-center border-t-4 border-t-rose-600">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 border border-rose-500/30 shadow-[0_0_30px_rgba(243,64,84,0.3)]">⛔</div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Accesso Interdetto</h2>
            <p className="text-base text-slate-400 leading-relaxed">La candidatura non rispetta i rigidi standard qualitativi del network. Per tutelare i partner bancari, l'accesso a questa utenza è stato bloccato in modo permanente.</p>
          </div>
        )}
      </div>
    );
  }

  // =======================================================================
  // COMPONENTE GRAFICO TREND (Native UI, Zero Lag)
  // =======================================================================
  const maxClicks = Math.max(...chartData.map(d => d.clicks), 1);
  const ChartComponent = () => (
    <div className="glass-panel p-8 sm:p-10 relative overflow-hidden mt-6 border border-white/5">
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
        <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span> Analisi Traffico (7 Giorni)
        </h3>
      </div>
      <div className="h-56 flex items-end gap-2 sm:gap-6 pt-4 pb-2 relative w-full">
        {/* Griglia di sfondo */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
          <div className="w-full h-px bg-slate-500"></div><div className="w-full h-px bg-slate-500"></div><div className="w-full h-px bg-slate-500"></div><div className="w-full h-px bg-slate-500"></div>
        </div>
        
        {chartData.map((data, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-3 relative group z-10 h-full justify-end">
            {/* Tooltip Hover */}
            <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 bg-[#02040A] border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono z-20 whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,1)] pointer-events-none">
              <span className="text-blue-400 font-bold text-xs">{data.clicks} Clicks</span> <span className="text-slate-600 mx-2">|</span> <span className="text-emerald-400 font-bold text-xs">{data.conversions} Lead</span>
            </div>
            
            {/* Barra dei Click (Stile Capsula) */}
            <div className="w-full sm:w-[60%] relative flex justify-center items-end h-full">
              <div className="w-full bg-gradient-to-t from-blue-600/10 to-blue-500/40 rounded-t-lg group-hover:to-blue-400/60 transition-all relative overflow-hidden shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]" style={{height: `${(data.clicks / maxClicks) * 100}%`, minHeight: '8px'}}>
                <div className="absolute bottom-0 w-full bg-blue-500 rounded-full" style={{height: '4px', boxShadow: '0 0 10px rgba(59,130,246,1)'}}></div>
                <div className="absolute top-0 w-full h-1 bg-white/20"></div>
              </div>
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{data.date}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // =======================================================================
  // TERMINALE DASHBOARD MAIN (Approvato)
  // =======================================================================
  
  return (
    <div className="min-h-screen bg-[#02040A] text-slate-300 font-sans flex flex-col md:flex-row relative overflow-hidden selection:bg-blue-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        
        .glass-panel { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5); border-radius: 2rem; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .glass-panel:hover { border-color: rgba(255, 255, 255, 0.1); box-shadow: 0 30px 60px -10px rgba(0,0,0,0.8); transform: translateY(-3px); }
        
        .input-premium { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); color: white; padding: 20px 24px; border-radius: 1.2rem; width: 100%; outline: none; transition: all 0.3s ease; font-size: 0.95rem; font-weight: 500; }
        .input-premium:focus { border-color: #3B82F6; background: rgba(0, 0, 0, 0.6); box-shadow: inset 0 0 0 1px #3B82F6, 0 0 20px rgba(59,130,246,0.15); }
        .input-premium:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .animate-view { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .bg-grid { background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 50px 50px; }
        .text-gradient { background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .tab-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 18px 24px; border-radius: 1.2rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800; transition: all 0.3s ease; border: 1px solid transparent; }
        .tab-btn.active { background: rgba(59, 130, 246, 0.1); color: #60A5FA; border-color: rgba(59, 130, 246, 0.25); box-shadow: inset 0 0 20px rgba(59,130,246,0.05); }
        .tab-btn:not(.active):hover { background: rgba(255, 255, 255, 0.03); color: white; border-color: rgba(255, 255, 255, 0.05); }
      `}} />

      <div className="fixed inset-0 z-0 bg-grid opacity-60 pointer-events-none"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-blue-600/10 blur-[180px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none"></div>

      {/* NOTIFICATION TOAST */}
      {settingsMsg.text && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-view border backdrop-blur-2xl ${settingsMsg.type === 'error' ? 'bg-rose-950/90 text-rose-200 border-rose-500/50' : 'bg-[#0B1221]/90 text-blue-200 border-blue-500/50'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${settingsMsg.type === 'error' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]'} animate-pulse`}></span>
            {settingsMsg.text}
          </div>
        </div>
      )}

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-5 border-b border-white/5 bg-[#02040A]/90 backdrop-blur-2xl z-40 relative">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-base shadow-[0_0_20px_rgba(59,130,246,0.4)]">F</div>
           <span className="font-black text-white text-xl tracking-tight">Finance<span className="text-blue-500">Partner</span></span>
        </div>
        <button onClick={markNotificationsAsRead} className="relative text-2xl text-slate-400 hover:text-white transition-colors">
          🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-[#02040A] animate-pulse"></span>}
        </button>
      </header>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-80 h-screen border-r border-white/5 bg-[#02040A]/60 backdrop-blur-3xl p-8 relative z-40 shrink-0">
        <div className="flex items-center gap-5 mb-10 mt-2">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center font-black text-white text-2xl shadow-[0_0_30px_rgba(59,130,246,0.4)]">F</div>
          <div>
            <span className="font-black text-white text-2xl tracking-tight block leading-none">FinancePartner</span>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1.5 block">Private Network</span>
          </div>
        </div>

        <div className="mb-10 p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-5 relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative z-10">🛡️</div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status Utenza</p>
            <p className="text-xs font-black mt-1 text-emerald-400 drop-shadow-md">Network Autorizzato</p>
          </div>
        </div>
        
        <nav className="space-y-3 flex-1">
          {[ 
            {id: 'overview', icon: '📊', label: 'Terminale'}, 
            {id: 'marketplace', icon: '🏦', label: 'Marketplace'}, 
            {id: 'assets', icon: '🖥️', label: 'Infrastrutture'}, 
            {id: 'kyc', icon: '🛡️', label: 'Compliance'} 
          ].map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
              <div className="flex items-center gap-4"><span className="text-xl opacity-80">{tab.icon}</span> <span>{tab.label}</span></div>
              {(tab.id === 'assets' || tab.id === 'kyc') && profile?.[tab.id + '_status'] === 'pending' && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse"></span>}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto p-6 bg-white/[0.02] rounded-3xl border border-white/5 mb-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5"></div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 relative z-10">Account Manager</p>
          <a href="mailto:finance.partnerr@gmail.com" className="text-xs font-bold text-slate-300 hover:text-blue-400 transition-colors relative z-10 break-all">finance.partnerr@gmail.com</a>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-black text-slate-600 hover:text-rose-400 py-3 uppercase tracking-widest transition-colors w-full text-center flex items-center justify-center gap-2 bg-white/[0.01] hover:bg-rose-500/10 rounded-xl"><span>⏻</span> Termina Sessione</button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 h-screen overflow-y-auto p-4 sm:p-8 lg:p-14 pb-32 relative z-10 hide-scrollbar scroll-smooth">
        <div ref={mainContentRef} className="max-w-[1400px] mx-auto transition-all duration-300">

          {/* VISTA 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 lg:space-y-10 animate-view">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight text-gradient leading-[1.1] mb-2">Console Operativa</h1>
                  <p className="text-xs sm:text-sm text-slate-400 font-mono flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span> API Connection: Secure
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsStrategyModalOpen(true)} className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white px-6 py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg">
                    <span className="text-lg">🧠</span> Playbook
                  </button>
                  <button onClick={markNotificationsAsRead} className="relative w-14 h-14 bg-white/[0.03] hover:bg-white/[0.08] rounded-[1.2rem] flex items-center justify-center text-2xl transition-colors border border-white/10 text-white shadow-lg">
                    🔔
                    {unreadCount > 0 && <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-bounce border-2 border-[#02040A]">{unreadCount}</span>}
                  </button>
                </div>
              </div>
              
              {/* Notifiche Dropdown */}
              {showNotifications && (
                <div className="absolute top-32 right-12 z-50 w-[400px] glass-panel p-2 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden animate-view border border-white/10">
                  <div className="p-5 bg-white/5 border-b border-white/5 font-black text-white uppercase tracking-widest text-[10px] flex justify-between items-center rounded-t-[1.5rem]">
                    <span>Centro Notifiche B2B</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-3 hide-scrollbar">
                    {notifications.length === 0 ? <p className="p-10 text-[11px] text-slate-500 text-center uppercase tracking-widest font-black">Nessun evento registrato</p> : notifications.map(n => (
                      <div key={n.id} className={`p-6 mb-3 rounded-[1.5rem] text-sm transition-all ${n.is_read ? 'bg-transparent opacity-60' : 'bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 shadow-lg'}`}>
                        <h4 className="font-black text-white mb-2">{n.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-blue-400 mt-4 font-mono">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Box Asset Multi-Link (Stile Terminale) */}
              {profile?.assigned_site_link && (
                <div className="glass-panel p-8 sm:p-12 rounded-[2.5rem] border-l-4 border-l-blue-500 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-[500px] h-full bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none group-hover:from-blue-500/20 transition-all duration-500"></div>
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight text-white flex items-center gap-3">🚀 I tuoi Asset Operativi</h3>
                      <p className="text-sm text-blue-100/60 leading-relaxed max-w-2xl font-medium">L'infrastruttura è attiva. Incolla questi link nelle tue campagne per abilitare il Postback Server-to-Server diretto con l'istituto.</p>
                    </div>
                    <div className="w-full lg:w-[500px] bg-black/60 border border-blue-500/30 rounded-2xl p-5 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative group/copy">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Link Generati</span>
                        <button onClick={() => {navigator.clipboard.writeText(profile.assigned_site_link); showToast("🔗 Asset copiati negli appunti", 'success');}} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all">Copia Tutto</button>
                      </div>
                      <textarea readOnly value={profile.assigned_site_link} className="bg-transparent text-blue-300 font-mono text-sm w-full outline-none resize-none hide-scrollbar leading-relaxed" rows={Math.min(profile.assigned_site_link.split('\n').length, 5)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Metriche Finanziarie (Premium Cards) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
                {[
                  { label: "Liquidità Esigibile", value: `€${profile?.wallet_approved?.toFixed(2) || '0.00'}`, color: "text-white", glow: "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]" },
                  { label: "Volume in Valutazione", value: `€${profile?.wallet_pending?.toFixed(2) || '0.00'}`, color: "text-amber-400", glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]" },
                  { label: "Tasso Conversione", value: `${stats.cr.toFixed(2)}%`, color: "text-blue-400", glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]" },
                  { label: "Earnings Per Click", value: `€${stats.epc.toFixed(2)}`, color: "text-emerald-400", glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]" }
                ].map((stat, i) => (
                  <div key={i} className={`glass-panel p-7 sm:p-9 flex flex-col justify-between min-h-[160px] group transition-all duration-300 ${stat.glow}`}>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    <p className={`text-4xl sm:text-5xl font-black ${stat.color} tracking-tight mt-5 drop-shadow-lg`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* IL GRAFICO ANALYTICS */}
              <ChartComponent />

              {/* Feed Transazioni */}
              <div className="glass-panel p-8 sm:p-12 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5 mb-10 border-b border-white/5 pb-8">
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-widest">Log Transazioni S2S</h3>
                    <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 w-max shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
                      <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest">Ricezione Dati Attiva</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {conversions.slice(0, 6).map((conv) => (
                      <div key={conv.id} className="flex justify-between items-center p-6 rounded-[1.5rem] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.04] transition-all hover:scale-[1.01]">
                        <div>
                          <p className="text-base sm:text-lg font-black text-white tracking-tight mb-1">{conv.program_id || 'Lead Finanziario'}</p>
                          <p className="text-[11px] font-mono text-slate-500">{new Date(conv.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md mb-1 ${conv.status === 'approved' ? 'text-emerald-400' : conv.status === 'rejected' ? 'text-rose-500' : 'text-amber-400'}`}>+€{conv.amount?.toFixed(2)}</p>
                          <p className={`text-[10px] uppercase tracking-widest font-black ${conv.status === 'approved' ? 'text-emerald-500' : 'text-slate-500'}`}>{conv.status}</p>
                        </div>
                      </div>
                    ))}
                    {conversions.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                        <span className="text-5xl opacity-20 mb-6 block">🔌</span>
                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">In attesa dei primi eventi di Postback.</p>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          )}

          {/* VISTA 2: MARKETPLACE */}
          {activeTab === 'marketplace' && (
             <div className="space-y-10 animate-view">
                <div className="pb-8 border-b border-white/5">
                  <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight text-gradient mb-4">Marketplace B2B</h1>
                  <p className="text-base text-slate-400 font-medium leading-relaxed max-w-3xl">Accesso diretto ai programmi di acquisizione istituzionali. I margini esposti rappresentano il Payout Netto garantito all'affiliato.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {offers.map((offer) => (
                    <div key={offer.id} className="glass-panel p-8 sm:p-12 flex flex-col relative group overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-bl-[100%] pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
                      
                      <div className="flex items-start sm:items-center gap-6 sm:gap-8 mb-10 border-b border-white/5 pb-10 relative z-10">
                        <SafeImage src={offer.image_url} alt={offer.name} className="w-20 h-20 sm:w-24 sm:h-24 bg-white" />
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h4 className="font-black text-white text-3xl sm:text-4xl tracking-tight leading-none group-hover:text-blue-400 transition-colors">{offer.name}</h4>
                            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-lg ${offer.payout_type === 'CPL' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-cyan-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-indigo-500/20'}`}>{offer.payout_type || 'CPA'}</span>
                          </div>
                          <button onClick={() => {setSelectedOffer(offer); setIsOfferModalOpen(true);}} className="text-[11px] font-black text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors bg-white/5 px-4 py-2 rounded-xl mt-4 border border-white/5 hover:bg-white/10">📄 Leggi Protocollo ➔</button>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-8 relative z-10">
                        <div>
                          <p className="text-[11px] uppercase font-black text-slate-500 tracking-widest mb-2">Commissione Netta</p>
                          <p className="font-black text-emerald-400 text-5xl sm:text-6xl tracking-tight leading-none drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">€{offer.partner_payout?.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
                          <button onClick={(e) => openSiteModal(offer, e)} className="w-full sm:w-auto text-[11px] font-black text-slate-300 bg-white/[0.03] border border-white/10 px-8 py-5 rounded-2xl hover:bg-white/10 transition-colors uppercase tracking-widest active:scale-95 text-center">Infrastruttura</button>
                          <button onClick={(e) => handleGetLink(offer, e)} className="w-full sm:w-auto text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.4)] active:scale-95 transition-all text-center">Genera Link S2S</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {offers.length === 0 && <div className="col-span-full py-24 text-center"><p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizzazione inventario in corso...</p></div>}
                </div>
             </div>
          )}
          
          {/* VISTA 3: ASSET */}
          {activeTab === 'assets' && (
            <div className="space-y-10 max-w-4xl animate-view">
              <div className="pb-8 border-b border-white/5">
                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight text-gradient mb-4">Sviluppo Asset</h1>
                <p className="text-base text-slate-400 leading-relaxed font-medium">Richiedi la costruzione di nuovi Hub o dichiara nuove sorgenti esterne per sbloccare i link manuali.</p>
              </div>
              
              <div className="glass-panel p-8 sm:p-14 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-3">1. Audit Canale Esterno</h2>
                    <p className="text-sm text-slate-400 max-w-md leading-relaxed">Dichiara domini o profili esterni per la validazione Compliance e abilitare il Tracker.</p>
                  </div>
                  <StatusBadge status={profile?.traffic_status} />
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">URL Principale</label>
                      <input type="url" value={billing.registered_website} onChange={(e) => setBilling({...billing, registered_website: e.target.value})} className="input-premium font-mono text-blue-300" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Strategia & Budget Mensile</label>
                      <input type="text" value={billing.traffic_volume} onChange={(e) => setBilling({...billing, traffic_volume: e.target.value})} className="input-premium" placeholder="Es. Meta Ads / 1000€" />
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto bg-blue-600 text-white font-black text-[12px] px-12 py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] active:scale-95 uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50">
                      {savingSettings ? 'Inoltro Sicuro...' : 'Sottoponi a Dipartimento Compliance'}
                    </button>
                  </div>
                </div>

                {profile?.traffic_notes && (
                  <div className="mt-12 p-8 sm:p-10 rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-900/10 to-transparent relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
                    <h3 className="text-sm font-black text-blue-400 mb-4 uppercase tracking-widest flex items-center gap-3">Storico Briefing Operativi</h3>
                    <textarea readOnly value={profile.traffic_notes} className="bg-black/60 border border-white/5 text-slate-300 p-6 rounded-2xl font-mono text-xs sm:text-sm w-full resize-none outline-none hide-scrollbar leading-relaxed" rows={6} />
                  </div>
                )}
              </div>

              <div className="glass-panel p-8 sm:p-14 relative overflow-hidden border border-indigo-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6 mb-8 relative z-10">
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">2. Deploy "Turn-Key" Hub</h2>
                  <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-black px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] mt-1 sm:mt-0">Servizio Incluso</span>
                </div>
                <p className="text-base text-slate-300 mb-10 leading-relaxed relative z-10 max-w-2xl font-medium">L'IT progetterà per te Hub di comparazione o Landing Page singole. Puoi effettuare richieste illimitate. Ogni nuovo URL crittografato verrà consegnato nel Terminale.</p>
                <button onClick={() => {setSelectedOffer(null); setIsSiteModalOpen(true);}} className="w-full sm:w-auto bg-white text-black hover:bg-slate-200 font-black text-[12px] uppercase tracking-widest px-14 py-6 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all active:scale-95 relative z-10">
                  Avvia Nuova Richiesta IT
                </button>
              </div>
            </div>
          )}

          {/* VISTA 4: KYC E FATTURAZIONE */}
          {activeTab === 'kyc' && (
             <div className="space-y-10 max-w-4xl animate-view">
               <div className="pb-8 border-b border-white/5">
                 <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight text-gradient mb-4">Tesoreria Fiscale</h1>
                 <p className="text-base text-slate-400 font-medium leading-relaxed">Dati protetti tramite crittografia AES-256. I pagamenti esigibili vengono liquidati automaticamente su circuito SEPA al 15 del mese.</p>
               </div>
               
               <div className="glass-panel p-8 sm:p-14 relative overflow-hidden">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-10">
                   <h2 className="text-3xl font-black text-white tracking-tight">Profilo Beneficiario</h2>
                   <div className="bg-black/40 px-5 py-2.5 rounded-xl border border-white/10 text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                     Stato KYC: {profile?.kyc_status === 'approved' ? <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Verificato</span> : profile?.kyc_status === 'pending' ? <span className="text-amber-400">In Audit</span> : <span className="text-slate-500">Mancante</span>}
                   </div>
                 </div>

                 <div className="space-y-8 relative z-10">
                  <div className="flex p-2 bg-black/50 rounded-2xl w-full sm:w-max border border-white/5 shadow-inner">
                    <button onClick={() => setBilling({...billing, entity_type: 'privato'})} disabled={profile?.kyc_status === 'approved'} className={`px-12 py-4 text-[11px] font-black rounded-xl transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'privato' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Privato</button>
                    <button onClick={() => setBilling({...billing, entity_type: 'azienda'})} disabled={profile?.kyc_status === 'approved'} className={`px-12 py-4 text-[11px] font-black rounded-xl transition-all uppercase tracking-widest disabled:opacity-50 ${billing.entity_type === 'azienda' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Impresa / P.IVA</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/[0.02] p-8 sm:p-10 rounded-[2.5rem] border border-white/5">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Intestatario Fiscale Conto</label>
                      <input type="text" value={billing.full_name} onChange={(e) => setBilling({...billing, full_name: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="input-premium text-lg" placeholder="Nome Completo o Ragione Sociale" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Codice Fiscale</label>
                      <input type="text" value={billing.tax_id} onChange={(e) => setBilling({...billing, tax_id: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="input-premium uppercase font-mono text-lg" placeholder="RSSMRA..." />
                    </div>
                    {billing.entity_type === 'azienda' && (
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Partita IVA</label>
                        <input type="text" value={billing.vat_number} onChange={(e) => setBilling({...billing, vat_number: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="input-premium font-mono text-lg" placeholder="IT0123..." />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Indirizzo Sede Legale / Residenza</label>
                      <input type="text" value={billing.address} onChange={(e) => setBilling({...billing, address: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="input-premium text-lg" placeholder="Via, Numero, CAP, Città" />
                    </div>
                    
                    <div className="md:col-span-2 mt-4 pt-10 border-t border-white/5">
                      <label className="block text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-5 flex items-center gap-3"><span className="text-2xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">🔒</span> IBAN Erogazione Fondi (Circuito SEPA)</label>
                      <input type="text" value={billing.payment_info} onChange={(e) => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="input-premium text-xl sm:text-3xl font-mono uppercase tracking-[0.25em] border-emerald-500/40 focus:border-emerald-500 bg-emerald-500/5 text-emerald-400 py-6" placeholder="IT00X00000000000000000" />
                    </div>
                  </div>

                  {(!profile?.kyc_status || profile?.kyc_status === 'none' || profile?.kyc_status === 'pending') && (
                    <div className="pt-6 flex justify-end">
                      <button onClick={handleSaveSettings} disabled={savingSettings || profile?.kyc_status === 'approved'} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[13px] px-16 py-6 rounded-2xl transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] active:scale-95 uppercase tracking-widest disabled:opacity-50">
                        {savingSettings ? 'Crittografia...' : 'Sincronizza Dati Fiscali'}
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
      <nav className="md:hidden fixed bottom-0 w-full bg-[#02040A]/90 backdrop-blur-2xl border-t border-white/10 z-50 pb-safe shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <div className="flex justify-around p-3">
          {[ 
            {id: 'overview', icon: '📊', label: 'Home'}, 
            {id: 'marketplace', icon: '🏦', label: 'Offerte'}, 
            {id: 'assets', icon: '🖥️', label: 'Asset'}, 
            {id: 'kyc', icon: '🛡️', label: 'Dati'} 
          ].map((tab) => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex flex-col items-center justify-center w-full py-3 rounded-2xl transition-all relative ${activeTab === tab.id ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-slate-500 hover:text-white border border-transparent'}`}>
              <span className={`text-2xl mb-1 ${activeTab === tab.id ? 'drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'opacity-70'}`}>{tab.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
              {(tab.id === 'kyc') && profile?.[tab.id + '_status'] === 'pending' && <span className="absolute top-2 right-4 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"></span>}
            </button>
          ))}
        </div>
      </nav>

      {/* MODALE ONBOARDING */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#02040A]/95 backdrop-blur-xl animate-view">
          <div className="glass-panel p-1 rounded-[3rem] max-w-5xl w-full relative overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_100px_rgba(59,130,246,0.15)]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400"></div>
            <div className="p-8 sm:p-14 overflow-y-auto hide-scrollbar">
              <div className="flex justify-between items-start mb-12 pb-8 border-b border-white/5">
                <div>
                  <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Confidential Protocol</div>
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 leading-none">Terminale Operativo</h2>
                  <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-medium">Benvenuto in FinancePartner. Abbiamo rimosso la pubblicità, il design amatoriale e i vecchi cookie per fornirti l'infrastruttura di acquisizione più potente d'Europa.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/50 border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6">🔌</div>
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Precisione S2S</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">Il mercato perde il 30% delle vendite su iOS. Qui i server della banca comunicano <strong className="text-white">direttamente tramite API</strong> col nostro database. Zero click persi. Tracciamento assoluto.</p>
                </div>
                <div className="bg-black/50 border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6">💶</div>
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight">L'Hub Multilink</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">La finanza paga le CPA più alte al mondo. Richiedi nella sezione "Infrastrutture" il tuo <strong>Hub Web</strong>. L'utente sceglierà da solo la banca migliore e il tuo Conversion Rate esploderà.</p>
                </div>
                <div className="md:col-span-2 bg-rose-950/20 border border-rose-900/50 p-10 rounded-[2.5rem] flex flex-col sm:flex-row gap-8 items-center">
                  <div className="w-20 h-20 shrink-0 bg-rose-500/10 rounded-full flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(244,63,94,0.2)]">⚠️</div>
                  <div>
                    <h3 className="text-xl font-black text-rose-400 mb-2 tracking-tight">Policy Zero Tolleranza</h3>
                    <p className="text-sm text-rose-200/70 leading-relaxed font-medium">È vietato il traffico "Incentivato" e il "Brand Bidding". Le violazioni per lead fraudolenti comportano lo storno istantaneo delle commissioni a tutela del network bancario.</p>
                  </div>
                </div>
              </div>
              <div className="mt-12 pt-10 border-t border-white/5 flex justify-end">
                <button onClick={() => setIsStrategyModalOpen(false)} className="bg-white text-black font-black text-[12px] uppercase tracking-widest px-14 py-6 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">Inizializza Terminale</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE RICHIESTA SITO */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#02040A]/95 backdrop-blur-xl animate-view">
          <div className="glass-panel p-8 sm:p-14 rounded-[3rem] max-w-2xl w-full relative overflow-hidden border border-indigo-500/30">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.8)]"></div>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Deploy Infrastruttura</h2>
            <p className="text-base text-slate-400 mb-10 leading-relaxed font-medium">Target compilazione: <strong className="text-white bg-white/10 px-3 py-1 rounded-md">{selectedOffer ? selectedOffer.name : "Hub Globale B2B"}</strong>.</p>
            <form onSubmit={handleRequestSiteSubmit} className="space-y-8">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Posizionamento & Sorgente Traffico</label>
                <textarea required rows="3" value={siteForm.whereToPromote} onChange={(e) => setSiteForm({...siteForm, whereToPromote: e.target.value})} className="input-premium resize-none text-base" placeholder="Es. TikTok Bio + Campagne Meta Ads focalizzate sul risparmio..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Obiettivi di Volume (KPI)</label>
                <input type="text" required value={siteForm.goals} onChange={(e) => setSiteForm({...siteForm, goals: e.target.value})} className="input-premium text-base" placeholder="Es. Budget 100€/Giorno | 300 Lead/Mese" />
              </div>
              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="flex-1 text-[12px] font-black uppercase tracking-widest text-slate-400 bg-white/5 hover:bg-white/10 py-6 rounded-2xl transition-colors active:scale-95 border border-white/5">Annulla</button>
                <button type="submit" disabled={savingSettings} className="flex-[2] text-[12px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 py-6 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-95 transition-all disabled:opacity-50">TRASMETTI BRIEFING</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DETTAGLI OFFERTA COMPLETO */}
      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#02040A]/95 backdrop-blur-xl animate-view" onClick={() => setIsOfferModalOpen(false)}>
          <div className="glass-panel p-8 sm:p-14 rounded-[3rem] max-w-3xl w-full shadow-[0_0_100px_rgba(0,0,0,1)] relative border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-10 border-b border-white/5 pb-10">
              <div className="flex items-center gap-8">
                <SafeImage src={selectedOffer.image_url} alt={selectedOffer.name} className="w-24 h-24 bg-white" />
                <div>
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-4">{selectedOffer.name}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-2 rounded-xl text-[10px] font-black text-slate-300 bg-white/10 border border-white/5 uppercase tracking-widest">Modello {selectedOffer.payout_type || 'CPA'}</span>
                    <span className="px-4 py-2 rounded-xl text-[10px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">Margine Netto: €{selectedOffer.partner_payout?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold text-xl transition-all">✕</button>
            </div>
            
            <div className="space-y-8 max-h-[50vh] overflow-y-auto hide-scrollbar pr-2">
              <div>
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Protocollo Informativo</h4>
                <p className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap bg-black/40 p-8 rounded-[2rem] border border-white/5 font-mono">{selectedOffer.description || 'Dettagli tecnici non forniti dal network.'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                 <div className="bg-black/40 border border-white/5 p-8 rounded-[2rem]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Geo Target (Nazioni)</p>
                   <p className="text-lg font-black text-white tracking-tight">{selectedOffer.allowed_countries || 'Italia (IT)'}</p>
                 </div>
                 <div className="bg-black/40 border border-white/5 p-8 rounded-[2rem]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Traffico Autorizzato</p>
                   <p className="text-lg font-black text-emerald-400 tracking-tight">{selectedOffer.allowed_traffic || 'Meta, TikTok, SEO, Native'}</p>
                 </div>
              </div>
              
              {selectedOffer.restrictions && (
                <div className="bg-rose-950/20 border border-rose-900/50 p-8 rounded-[2rem]">
                   <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-3"><span className="text-rose-500 text-xl">⚠️</span> Divieti Assoluti</p>
                   <p className="text-sm font-medium text-rose-200/70 leading-relaxed">{selectedOffer.restrictions}</p>
                </div>
              )}
            </div>
            
            <div className="mt-12 pt-10 border-t border-white/5 flex flex-col sm:flex-row gap-5">
              <button onClick={(e) => handleGetLink(selectedOffer, e)} className="flex-[2] text-[12px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(59,130,246,0.4)] active:scale-95">Ottieni Link S2S Crittografato</button>
              <button onClick={(e) => {setIsOfferModalOpen(false); openSiteModal(selectedOffer, e);}} className="flex-1 text-[12px] font-black uppercase tracking-widest text-white bg-white/5 border border-white/10 hover:bg-white/10 py-6 rounded-2xl transition-all active:scale-95">Deploy Hub</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}