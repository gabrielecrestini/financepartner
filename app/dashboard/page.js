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
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); 
  
  const [billing, setBilling] = useState({
    full_name: '', entity_type: 'privato', vat_number: '', tax_id: '', address: '', payment_info: '', registered_website: '', traffic_volume: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ text: '', type: '' });

  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [siteForm, setSiteForm] = useState({ volume: '', trafficType: 'Pagina Instagram / TikTok', notes: '' });
  
  const router = useRouter();

  // Memoria Tab: Salva e recupera la scheda attiva per evitare reset al refresh
  useEffect(() => {
    const savedTab = localStorage.getItem('fp_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('fp_active_tab', tab);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setUser(user);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);
      
      if (profileData) {
        setBilling({
          full_name: profileData.full_name || '', entity_type: profileData.entity_type || 'privato',
          vat_number: profileData.vat_number || '', tax_id: profileData.tax_id || '',
          address: profileData.address || '', payment_info: profileData.payment_info || '',
          registered_website: profileData.registered_website || '', traffic_volume: profileData.traffic_volume || ''
        });
      }

      const { data: offersData } = await supabase.from('offers').select('*');
      setOffers(offersData || []);

      const { data: convData } = await supabase.from('conversions').select('*').eq('partner_id', user.id).order('created_at', { ascending: false });
      const convs = convData || [];
      setConversions(convs);

      // Calcolo Metriche Reali (Click, EPC, CR)
      const { count: totalClicks } = await supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('affiliate_id', user.id);
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
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Generatore di Link Reale connesso al Tracker
  const handleGetLink = (offer, e) => {
    if (e) e.stopPropagation();
    if (profile?.traffic_status !== 'approved') {
      alert("🔒 ACCESSO NEGATO\n\nPer generare i link operativi, la tua sorgente di traffico deve essere approvata. Vai in 'Asset & Sorgenti' per compilare la richiesta.");
      handleTabChange('assets');
      return;
    }
    // Genera dinamicamente il link usando l'URL in cui si trova il sito (es. localhost o vercel)
    const trackingLink = `${window.location.origin}/api/click?offer_id=${offer.id}&subid=${user.id}`;
    navigator.clipboard.writeText(trackingLink);
    alert("🔗 Tracking Link Copiato!\nIl tracciamento S2S è attivo. Ogni click verrà contato.");
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
    const { error } = await supabase.from('profiles').update({
      traffic_status: 'pending', traffic_volume: siteForm.volume,
      traffic_notes: `Richiesta Sito per: ${selectedOffer.name} | Canale: ${siteForm.trafficType} | Note: ${siteForm.notes}`
    }).eq('id', user.id);

    setSavingSettings(false);
    if (!error) {
      setProfile({...profile, traffic_status: 'pending'});
      setIsSiteModalOpen(false);
      alert("✅ Modulo inviato al team. Controlla lo stato nella sezione 'Asset'.");
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
      setSettingsMsg({ text: 'Dati sincronizzati con l\'Amministrazione.', type: 'success' });
      setProfile({...profile, traffic_status: newTrafficStatus, kyc_status: newKycStatus, registered_website: cleanWebsite}); 
      setTimeout(() => setSettingsMsg({ text: '', type: '' }), 4000);
    } else {
      setSettingsMsg({ text: 'Errore di connessione al database.', type: 'error' });
    }
  };

  const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max shadow-sm"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Verificato</span>;
    if (status === 'pending') return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max shadow-sm"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> In Revisione</span>;
    if (status === 'rejected') return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max shadow-sm"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Rifiutato</span>;
    return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-max shadow-sm">Da Compilare</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-800 font-sans selection:bg-blue-500/20 flex flex-col md:flex-row overflow-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        .light-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 1); box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05); }
        .data-input { background: #FFFFFF; border: 1px solid #E2E8F0; color: #0F172A; transition: all 0.3s ease; }
        .data-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); outline: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes floatSlow { 0% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(15px, -15px) rotate(2deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
        .anim-float { animation: floatSlow 10s ease-in-out infinite; }
        @keyframes viewEntry { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-view { animation: viewEntry 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />

      {/* Sfondo Luminoso Premium */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] bg-blue-200/60 anim-float"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] bg-indigo-200/50 anim-float" style={{animationDelay: '3s'}}></div>
      </div>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-slate-200 bg-white/70 backdrop-blur-3xl z-40 relative shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">F</div>
          <div>
            <span className="font-bold text-slate-900 text-lg tracking-tight block leading-tight">FinancePartner</span>
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Network Portal</span>
          </div>
        </div>
        
        <div className="flex-1 py-8 px-5 space-y-2">
          <button onClick={() => handleTabChange('overview')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
             <span className="text-lg">📊</span> Overview Dati
          </button>
          
          <button onClick={() => handleTabChange('marketplace')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'marketplace' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
            <span className="text-lg">🏦</span> Catalogo Offerte
          </button>

          <button onClick={() => handleTabChange('assets')} className={`w-full flex justify-between items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'assets' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
            <span className="flex items-center gap-3"><span className="text-lg">📱</span> Asset & Sorgenti</span>
            {(profile?.traffic_status === 'pending') && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>}
          </button>
          
          <button onClick={() => handleTabChange('kyc')} className={`w-full flex justify-between items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'kyc' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
            <span className="flex items-center gap-3"><span className="text-lg">🛡️</span> Dati Fiscali KYC</span>
            {(profile?.kyc_status === 'pending') && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
          </button>
        </div>
        
        <div className="p-6 bg-slate-50/50 mt-auto border-t border-slate-100">
          <div className="p-4 rounded-xl bg-white border border-slate-200 mb-3 shadow-sm">
            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1 tracking-widest">ID Operatore</p>
            <p className="text-xs font-mono text-slate-700 truncate font-semibold">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 py-2 transition-colors">Disconnetti Sessione</button>
        </div>
      </aside>

      {/* --- HEADER MOBILE --- */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white/90 backdrop-blur-xl z-40 relative shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs">F</div>
           <span className="font-bold text-slate-900 tracking-tight">FinancePartner</span>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">Esci</button>
      </header>

      {/* --- AREA CONTENUTI PRINCIPALE --- */}
      <main className="flex-1 h-screen overflow-y-auto hide-scrollbar pb-32 md:pb-0 relative z-10">
        <div className="p-5 sm:p-10 max-w-[1400px] mx-auto">
          
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'overview' && 'Il tuo Terminale'}
              {activeTab === 'marketplace' && 'Network Bancario'}
              {activeTab === 'assets' && 'Sorgenti di Acquisizione'}
              {activeTab === 'kyc' && 'Tesoreria & Compliance'}
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Aggiornato in tempo reale tramite tracciamento S2S.</p>
          </div>

          {/* === VISTA 1: OVERVIEW === */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8 animate-view">
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem] flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Saldo Netto</span>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">€{profile?.wallet_approved?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem] flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">In Valutazione <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span></span>
                  <p className="text-3xl sm:text-4xl font-black text-amber-500">€{profile?.wallet_pending?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem] flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Conv. Rate</span>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-500">{stats.cr.toFixed(2)}%</p>
                </div>
                <div className="light-panel p-6 sm:p-8 rounded-[1.5rem] flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">EPC (Entrata/Click)</span>
                  <p className="text-3xl sm:text-4xl font-black text-blue-600">€{stats.epc.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2 light-panel rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[350px]">
                  <div className="relative z-10">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Liquidità Totale Generata</h3>
                    <div className="mt-4"><span className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter">€{profile?.wallet_approved?.toFixed(2) || "0.00"}</span></div>
                  </div>
                  <div className={`absolute bottom-0 left-0 w-full h-[65%] transition-opacity duration-1000 ${profile?.wallet_approved > 0 ? 'opacity-100' : 'opacity-30'}`}>
                    <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full stroke-blue-500 fill-[url(#blue-grad)]">
                      <defs><linearGradient id="blue-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" /><stop offset="100%" stopColor="#3B82F6" stopOpacity="0" /></linearGradient></defs>
                      <path d="M0,300 L0,180 C150,180 250,80 400,120 C550,150 650,40 800,90 C900,130 950,60 1000,0 L1000,300 Z" strokeWidth="4" />
                    </svg>
                  </div>
                </div>

                <div className="light-panel rounded-[2rem] p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feed S2S</h3>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  </div>
                  <div className="space-y-4 flex-1">
                    {conversions.slice(0, 5).map((conv) => (
                      <div key={conv.id} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{conv.program_id || 'FinanceAds Lead'}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{new Date(conv.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-black ${conv.status === 'approved' ? 'text-emerald-600' : conv.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>+€{conv.amount?.toFixed(2)}</p>
                          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">{conv.status}</p>
                        </div>
                      </div>
                    ))}
                    {conversions.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                         <div className="text-4xl mb-2">📥</div>
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nessun evento registrato</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === VISTA 2: MARKETPLACE === */}
          {activeTab === 'marketplace' && (
            <div className="animate-view space-y-6">
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                  {offers.length > 0 ? offers.map((offer) => (
                    <div key={offer.id} onClick={() => openOfferDetails(offer)} className="light-panel rounded-[2rem] p-6 sm:p-8 flex flex-col relative group hover:shadow-[0_20px_50px_rgba(59,130,246,0.08)] transition-all cursor-pointer border border-transparent hover:border-blue-200">
                      
                      <div className="absolute top-6 right-6 hidden sm:block">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${offer.payout_type === 'CPL' ? 'bg-cyan-100 text-cyan-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {offer.payout_type || 'CPA'} Model
                        </span>
                      </div>

                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                          {offer.image_url ? (
                            <img src={offer.image_url} alt={offer.name} className="w-full h-full object-contain p-2" />
                          ) : (
                            <span className="text-3xl text-slate-300">🏦</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xl sm:text-2xl line-clamp-1">{offer.name}</h4>
                          <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">Apri Scheda Tecnica</p>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className="w-full sm:w-auto text-left sm:text-right bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">CPA Netto</p>
                          <p className="font-black text-emerald-500 text-2xl">€{offer.partner_payout?.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex w-full gap-3">
                          <button onClick={(e) => openSiteModal(offer, e)} className="flex-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 py-3.5 rounded-xl transition-all shadow-sm">
                            Sito
                          </button>
                          <button onClick={(e) => handleGetLink(offer, e)} className="flex-[2] text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-600/20">
                            Ottieni Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                     <div className="light-panel p-16 text-center rounded-[2rem] col-span-full border-dashed border-slate-300">
                        <div className="text-4xl mb-4 opacity-30">💼</div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nessuna campagna caricata</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          {/* === VISTA 3: ASSET E SORGENTI DI TRAFFICO === */}
          {activeTab === 'assets' && (
            <div className="animate-view max-w-4xl space-y-8 pb-10">
              <div className="light-panel p-8 sm:p-10 rounded-[2rem]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Validazione Traffico</h2>
                    <p className="text-xs text-slate-500 mt-1">Senza una fonte approvata, il tracciamento dei link sarà bloccato.</p>
                  </div>
                  <StatusBadge status={profile?.traffic_status} />
                </div>

                <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">URL (Sito, Pagina IG, Canale)</label>
                    <input type="url" value={billing.registered_website} onChange={(e) => setBilling({...billing, registered_website: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input w-full rounded-xl px-4 py-3.5 text-sm font-mono text-blue-600 disabled:opacity-50 disabled:bg-slate-100" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Strategia / Volumi Stimati</label>
                    <input type="text" value={billing.traffic_volume} onChange={(e) => setBilling({...billing, traffic_volume: e.target.value})} disabled={profile?.traffic_status === 'approved' || profile?.traffic_status === 'pending'} className="data-input w-full rounded-xl px-4 py-3.5 text-sm disabled:opacity-50 disabled:bg-slate-100" placeholder="Es. 500€/mese su Meta Ads" />
                  </div>
                  
                  {(!profile?.traffic_status || profile?.traffic_status === 'none') && (
                    <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-10 py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                      Invia per Revisione
                    </button>
                  )}
                </div>

                {profile?.traffic_status === 'pending' && profile?.traffic_notes && (
                  <div className="mt-6 p-5 rounded-2xl border border-amber-200 bg-amber-50">
                    <h3 className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-widest">Richiesta Landing Page in Corso</h3>
                    <p className="text-sm text-amber-900 font-mono bg-white p-3 rounded-lg border border-amber-100">{profile.traffic_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === VISTA 4: KYC E FATTURAZIONE === */}
          {activeTab === 'kyc' && (
            <div className="animate-view max-w-4xl space-y-8 pb-10">
              <div className="light-panel p-8 sm:p-10 rounded-[2rem]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Coordinate & Fisco</h2>
                    <p className="text-xs text-slate-500 mt-1">Dati necessari per i bonifici SEPA e le ritenute d'acconto.</p>
                  </div>
                  <StatusBadge status={profile?.kyc_status} />
                </div>

                <div className="space-y-6">
                  <div className="flex p-1.5 bg-slate-100 rounded-xl w-full sm:w-max">
                    <button onClick={() => setBilling({...billing, entity_type: 'privato'})} disabled={profile?.kyc_status === 'approved'} className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 ${billing.entity_type === 'privato' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Privato (Occasionale)</button>
                    <button onClick={() => setBilling({...billing, entity_type: 'azienda'})} disabled={profile?.kyc_status === 'approved'} className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 ${billing.entity_type === 'azienda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Azienda / P.IVA</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Intestatario</label><input type="text" value={billing.full_name} onChange={(e) => setBilling({...billing, full_name: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input w-full rounded-xl px-4 py-3.5 text-sm disabled:opacity-50 disabled:bg-slate-50" /></div>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Codice Fiscale</label><input type="text" value={billing.tax_id} onChange={(e) => setBilling({...billing, tax_id: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input w-full rounded-xl px-4 py-3.5 text-sm uppercase font-mono disabled:opacity-50 disabled:bg-slate-50" /></div>
                    {billing.entity_type === 'azienda' && <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">P.IVA</label><input type="text" value={billing.vat_number} onChange={(e) => setBilling({...billing, vat_number: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input w-full rounded-xl px-4 py-3.5 text-sm font-mono disabled:opacity-50 disabled:bg-slate-50" /></div>}
                    <div className="sm:col-span-2"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sede / Residenza</label><input type="text" value={billing.address} onChange={(e) => setBilling({...billing, address: e.target.value})} disabled={profile?.kyc_status === 'approved'} className="data-input w-full rounded-xl px-4 py-3.5 text-sm disabled:opacity-50 disabled:bg-slate-50" /></div>
                    
                    <div className="sm:col-span-2 mt-2">
                      <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">IBAN di Accredito (SEPA)</label>
                      <input type="text" value={billing.payment_info} onChange={(e) => setBilling({...billing, payment_info: e.target.value.toUpperCase()})} disabled={profile?.kyc_status === 'approved'} className="data-input w-full rounded-xl px-4 py-4 text-base font-mono uppercase tracking-[0.1em] border-blue-200 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-50 bg-blue-50/50 text-blue-800" placeholder="IT00X000..." />
                    </div>
                  </div>

                  {(!profile?.kyc_status || profile?.kyc_status === 'none') && (
                    <div className="pt-4">
                      <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-10 py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                        {savingSettings ? 'Invio in corso...' : 'Salva Dati KYC'}
                      </button>
                    </div>
                  )}
                  {settingsMsg.text && <p className={`text-[10px] font-bold uppercase tracking-widest mt-3 ${settingsMsg.type==='error'?'text-rose-500':'text-emerald-500'}`}>{settingsMsg.text}</p>}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      
      {/* BOTTOM BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around p-2">
          <button onClick={() => handleTabChange('overview')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors ${activeTab === 'overview' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><span className="text-[10px] font-bold uppercase tracking-widest">Home</span></button>
          <button onClick={() => handleTabChange('marketplace')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors ${activeTab === 'marketplace' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><span className="text-[10px] font-bold uppercase tracking-widest">Offerte</span></button>
          <button onClick={() => handleTabChange('assets')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors relative ${activeTab === 'assets' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <span className="text-[10px] font-bold uppercase tracking-widest">Asset</span>
             {profile?.traffic_status === 'pending' && <span className="absolute top-1 right-5 w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
          </button>
          <button onClick={() => handleTabChange('kyc')} className={`flex flex-col items-center gap-1 w-full py-2 rounded-xl transition-colors relative ${activeTab === 'kyc' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>
             <span className="text-[10px] font-bold uppercase tracking-widest">KYC</span>
             {profile?.kyc_status === 'pending' && <span className="absolute top-1 right-6 w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
          </button>
        </div>
      </nav>

      {/* MODALE DETTAGLI OFFERTA */}
      {isOfferModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-view" onClick={() => setIsOfferModalOpen(false)}>
          <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedOffer.image_url ? <img src={selectedOffer.image_url} alt="" className="w-full h-full object-contain p-2" /> : <span className="text-2xl">🏦</span>}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedOffer.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] font-bold border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md uppercase">Modello {selectedOffer.payout_type || 'CPA'}</span>
                    <span className="text-[9px] font-bold border border-emerald-200 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Payout: €{selectedOffer.partner_payout?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOfferModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto hide-scrollbar pr-2">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Informazioni Campagna</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedOffer.description || 'Dettagli non forniti per questa offerta.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Geo</p>
                   <p className="text-xs font-bold text-slate-800">{selectedOffer.allowed_countries || 'Italia (IT)'}</p>
                 </div>
                 <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Traffico OK</p>
                   <p className="text-xs font-bold text-emerald-600">{selectedOffer.allowed_traffic || 'Meta, SEO, Native'}</p>
                 </div>
              </div>
              {selectedOffer.restrictions && (
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                   <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1"><span>⚠️</span> Divieti Assoluti</p>
                   <p className="text-xs font-medium text-rose-700 leading-relaxed">{selectedOffer.restrictions}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <button onClick={(e) => handleGetLink(selectedOffer, e)} className="flex-[2] text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition-all shadow-md shadow-blue-500/20">Copia Tracking Link</button>
              <button onClick={(e) => openSiteModal(selectedOffer, e)} className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 py-4 rounded-xl transition-all">Richiedi Sito</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE RICHIEDI SITO */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-view">
          <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] max-w-lg w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Infrastruttura Web</h2>
            <p className="text-xs text-slate-500 mb-6">Forniscici i dettagli per crearti una pagina ad altissima conversione per <strong className="text-slate-800">{selectedOffer?.name}</strong>.</p>
            
            <form onSubmit={handleRequestSiteSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Canale Principale</label>
                <select value={siteForm.trafficType} onChange={(e) => setSiteForm({...siteForm, trafficType: e.target.value})} className="data-input w-full rounded-xl px-4 py-4 text-sm appearance-none">
                  <option>Meta Ads (Facebook Ads)</option>
                  <option>Pagina Instagram (Reels/Stories)</option>
                  <option>Profilo TikTok</option>
                  <option>Canale Telegram</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Volumi Stimati</label>
                <input type="text" required value={siteForm.volume} onChange={(e) => setSiteForm({...siteForm, volume: e.target.value})} className="data-input w-full rounded-xl px-4 py-4 text-sm" placeholder="Es. 50€/giorno Ads o 20k Subs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Note (Es. Pixel Meta/TikTok)</label>
                <textarea rows="2" value={siteForm.notes} onChange={(e) => setSiteForm({...siteForm, notes: e.target.value})} className="data-input w-full rounded-xl px-4 py-4 text-sm resize-none"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsSiteModalOpen(false)} className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 py-4 rounded-xl">Annulla</button>
                <button type="submit" disabled={savingSettings} className="flex-[2] text-[10px] font-bold uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 py-4 rounded-xl shadow-lg">Invia Richiesta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}