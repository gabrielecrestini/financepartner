"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [offers, setOffers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sites'); // Impostato su 'sites' per farti vedere subito la modifica
  
  const [siteLinks, setSiteLinks] = useState({});

  // Stati per il Modale "Aggiungi Vendita Manuale"
  const [isConvModalOpen, setIsConvModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [convForm, setConvForm] = useState({ program_id: '', amount: '', status: 'approved' });

  // Stato form Offerte
  const [offerForm, setOfferForm] = useState({
    name: '', program_id: '', partner_payout: '', payout_type: 'CPA', 
    base_link: '', image_url: '', description: '', allowed_countries: 'Italia (IT)', 
    allowed_traffic: 'Meta Ads, TikTok, Google SEO, Native', restrictions: ''
  });
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const savedTab = localStorage.getItem('admin_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('admin_active_tab', tab);
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (!user || user.email !== adminEmail) {
        alert("⛔ SECURITY BREACH: Accesso negato.");
        router.push('/dashboard');
        return;
      }
      setAdminUser(user);

      const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles(allProfiles || []);
      const { data: allOffers } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
      setOffers(allOffers || []);
      setLoading(false);
    };
    fetchAdminData();
  }, [router]);

  const sendNotification = async (userId, title, message, type = 'success') => {
    await supabase.from('notifications').insert([{ user_id: userId, title, message, type }]);
  };

  const updateStatus = async (userId, field, newStatus, notificationMessage = null) => {
    const { error } = await supabase.from('profiles').update({ [field]: newStatus }).eq('id', userId);
    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, [field]: newStatus } : p));
      if (notificationMessage) {
        await sendNotification(userId, "Aggiornamento Account", notificationMessage, newStatus === 'approved' ? 'success' : 'error');
      }
    }
  };

  const handleApproveSite = async (userId) => {
    const linkToAssign = siteLinks[userId];
    if (!linkToAssign) { alert("Inserisci l'URL del sito prima di approvare!"); return; }
    const { error } = await supabase.from('profiles').update({ traffic_status: 'approved', assigned_site_link: linkToAssign }).eq('id', userId);
    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, traffic_status: 'approved', assigned_site_link: linkToAssign } : p));
      await sendNotification(userId, "🚀 Asset Web Pronto!", "Il tuo sito è online e i link sono stati sbloccati. Usa il link ufficiale in dashboard.", "success");
      alert("Sito inviato all'utente!");
    }
  };

  const markAsPaid = async (userId) => {
    const confirm = window.confirm("Confermi di aver inviato il bonifico? Il credito dell'affiliato verrà azzerato.");
    if (!confirm) return;
    const { error } = await supabase.from('profiles').update({ wallet_approved: 0 }).eq('id', userId);
    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, wallet_approved: 0 } : p));
      await sendNotification(userId, "💸 Pagamento Emesso", "Abbiamo emesso un bonifico SEPA sul tuo conto. Il saldo è stato azzerato.", "success");
      alert("✅ Debito azzerato.");
    }
  };

  // --- MOTORE AGGIUNTA VENDITA MANUALE ---
  const handleAddConversion = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const payoutValue = parseFloat(convForm.amount);
    
    // 1. Inserisci nel feed conversioni
    await supabase.from('conversions').insert([{
      partner_id: selectedUser.id,
      program_id: convForm.program_id,
      amount: payoutValue,
      status: convForm.status
    }]);

    // 2. Aggiorna il portafoglio
    const userProfile = profiles.find(p => p.id === selectedUser.id);
    let updatedProfile = { ...userProfile };

    if (convForm.status === 'approved') {
      const newApproved = (userProfile.wallet_approved || 0) + payoutValue;
      await supabase.from('profiles').update({ wallet_approved: newApproved }).eq('id', selectedUser.id);
      updatedProfile.wallet_approved = newApproved;
      await sendNotification(selectedUser.id, "🎉 Nuova Commissione Approvata!", `Hai generato una nuova conversione per ${convForm.program_id} di €${payoutValue}.`, "success");
    } else if (convForm.status === 'pending') {
      const newPending = (userProfile.wallet_pending || 0) + payoutValue;
      await supabase.from('profiles').update({ wallet_pending: newPending }).eq('id', selectedUser.id);
      updatedProfile.wallet_pending = newPending;
      await sendNotification(selectedUser.id, "⏳ Lead in Valutazione", `Una nuova conversione per ${convForm.program_id} è in fase di approvazione dall'istituto.`, "info");
    }

    setProfiles(profiles.map(p => p.id === selectedUser.id ? updatedProfile : p));
    setIsConvModalOpen(false);
    setConvForm({ program_id: '', amount: '', status: 'approved' });
    alert("✅ Conversione assegnata correttamente e notifica inviata!");
  };

  // --- GESTIONE OFFERTE ---
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setIsSavingOffer(true);
    const { data, error } = await supabase.from('offers').insert([{...offerForm, partner_payout: parseFloat(offerForm.partner_payout)}]).select();
    setIsSavingOffer(false);
    if (error) alert(`Errore: ${error.message}`);
    else if (data) {
      setOffers([data[0], ...offers]);
      alert("🚀 Offerta aggiunta al Marketplace!");
      setOfferForm({name: '', program_id: '', partner_payout: '', payout_type: 'CPA', base_link: '', image_url: '', description: '', allowed_countries: 'Italia (IT)', allowed_traffic: 'Meta Ads', restrictions: ''});
    }
  };

  const handleDeleteOffer = async (id) => {
    const confirm = window.confirm("Cancellare definitivamente questa offerta?");
    if (!confirm) return;
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (!error) setOffers(offers.filter(o => o.id !== id));
  };

  if (loading) return <div className="min-h-screen bg-[#030509] flex items-center justify-center"><div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const pendingTraffic = profiles.filter(p => p.traffic_status === 'pending' && !p.traffic_notes?.includes('Richiesta Sito'));
  const pendingSites = profiles.filter(p => p.traffic_status === 'pending' && p.traffic_notes?.includes('Richiesta Sito'));
  const pendingKyc = profiles.filter(p => p.kyc_status === 'pending');
  const readyForPayout = profiles.filter(p => p.wallet_approved > 0);

  return (
    <div className="min-h-screen bg-[#030509] text-slate-300 font-sans flex flex-col md:flex-row relative">
      <style dangerouslySetInnerHTML={{__html: `.admin-panel { background: rgba(10, 15, 25, 0.8); border: 1px solid rgba(255, 255, 255, 0.05); } .data-input { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px; border-radius: 8px; width: 100%; outline:none; } .data-input:focus { border-color: #3B82F6; }`}} />

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-white/10 bg-[#05070C] p-6 space-y-3 z-40">
        <div className="mb-8"><span className="font-bold text-white text-lg tracking-tight block">ADMIN ROOT</span><span className="text-[9px] text-red-500 uppercase tracking-widest">Master Control</span></div>
        
        <button onClick={() => handleTabChange('network')} className={`p-4 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'network' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>1. Affiliati & Vendite</button>
        <button onClick={() => handleTabChange('compliance')} className={`flex justify-between p-4 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'compliance' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
          2. Compliance {(pendingTraffic.length > 0 || pendingKyc.length > 0) && <span className="bg-red-600 text-white px-2 py-0.5 rounded">{pendingTraffic.length + pendingKyc.length}</span>}
        </button>
        <button onClick={() => handleTabChange('sites')} className={`flex justify-between p-4 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'sites' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
          3. Sviluppo Siti {pendingSites.length > 0 && <span className="bg-amber-500 text-black px-2 py-0.5 rounded">{pendingSites.length}</span>}
        </button>
        <button onClick={() => handleTabChange('payouts')} className={`flex justify-between p-4 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'payouts' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
          4. Tesoreria {readyForPayout.length > 0 && <span className="bg-emerald-500 text-black px-2 py-0.5 rounded">{readyForPayout.length}</span>}
        </button>
        <button onClick={() => handleTabChange('offers')} className={`p-4 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'offers' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>5. Catalogo Offerte</button>
        
        <button onClick={() => router.push('/dashboard')} className="mt-auto p-4 border border-white/10 rounded-xl text-xs text-slate-500 hover:text-white uppercase tracking-widest">Esci da Admin</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto relative z-10">
        <div className="max-w-[1200px] mx-auto">
          
          {/* TAB 1: AFFILIATI E INSERIMENTO VENDITE */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-black text-white uppercase">Gestione Affiliati</h1>
                <p className="text-sm text-slate-500 mt-1">Trova l'utente e usa il tasto rosso per assegnargli manualmente le vendite e i lead.</p>
              </div>
              <div className="admin-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white/5 text-[9px] uppercase tracking-widest text-slate-500">
                    <tr><th className="px-6 py-4">ID (SubID)</th><th className="px-6 py-4">Status Traffico</th><th className="px-6 py-4 text-right">Saldo Approvato</th><th className="px-6 py-4 text-right">Assegnazione Dati</th></tr>
                  </thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">
                          <p className="text-white mb-1">{p.email}</p>
                          <p className="text-[9px] text-slate-500">ID: {p.id}</p>
                        </td>
                        <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${p.traffic_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{p.traffic_status || 'none'}</span></td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">€{p.wallet_approved?.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => {setSelectedUser(p); setIsConvModalOpen(true);}} className="text-[10px] font-bold uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg shadow-lg active:scale-95 transition-all">
                            + Aggiungi Vendita
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: COMPLIANCE */}
          {activeTab === 'compliance' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-black text-white uppercase border-b border-white/10 pb-6">Validazione Documentale</h1>
              
              <div className="admin-panel p-6 rounded-2xl">
                <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Sorgenti Affiliate ({pendingTraffic.length})</h2>
                {pendingTraffic.map(p => (
                   <div key={p.id} className="flex justify-between items-center p-4 border-b border-white/5">
                     <div><p className="font-mono text-xs text-white">{p.email}</p><a href={p.registered_website} target="_blank" className="text-blue-400 text-sm hover:underline">{p.registered_website}</a></div>
                     <button onClick={() => updateStatus(p.id, 'traffic_status', 'approved', 'Sorgente di traffico approvata! I tuoi link sono operativi.')} className="text-[10px] font-bold uppercase bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white px-4 py-2 rounded-lg transition-colors">Approva Rete</button>
                   </div>
                ))}
                {pendingTraffic.length === 0 && <p className="text-xs text-slate-500 uppercase tracking-widest">Nessuna richiesta</p>}
              </div>

              <div className="admin-panel p-6 rounded-2xl">
                <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Verifica Fiscale KYC ({pendingKyc.length})</h2>
                {pendingKyc.map(p => (
                   <div key={p.id} className="flex justify-between items-center p-4 border-b border-white/5">
                     <div><p className="font-mono text-xs text-white">{p.email}</p><p className="text-slate-400 text-sm">{p.full_name} - {p.payment_info}</p></div>
                     <button onClick={() => updateStatus(p.id, 'kyc_status', 'approved', 'KYC Convalidato. Sei idoneo per ricevere pagamenti SEPA.')} className="text-[10px] font-bold uppercase bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black px-4 py-2 rounded-lg transition-colors">Convalida KYC</button>
                   </div>
                ))}
                {pendingKyc.length === 0 && <p className="text-xs text-slate-500 uppercase tracking-widest">Nessuna richiesta</p>}
              </div>
            </div>
          )}

          {/* TAB: SITI WEB - AGGIORNATA CON SUBID IN EVIDENZA */}
          {activeTab === 'sites' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-black text-white uppercase border-b border-white/10 pb-6">Deploy Infrastrutture</h1>
              {pendingSites.length === 0 ? <p className="text-slate-500 uppercase tracking-widest text-sm">Nessun sito da creare.</p> : pendingSites.map(p => (
                <div key={p.id} className="admin-panel p-6 rounded-2xl border-l-4 border-l-blue-500 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 mb-1">Cliente: <span className="text-white font-bold">{p.email}</span></p>
                    
                    {/* BOX SUBID IN EVIDENZA */}
                    <div className="mb-4 inline-flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">SUB-ID UTENTE:</span>
                      <span className="text-xs font-mono text-white">{p.id}</span>
                      <button 
                        onClick={() => {navigator.clipboard.writeText(p.id); alert("SubID Copiato!");}} 
                        className="text-[9px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors uppercase font-bold"
                      >
                        Copia
                      </button>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-5 rounded-xl">
                       <p className="text-xs text-blue-300 font-mono whitespace-pre-wrap">{p.traffic_notes}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assegna URL Finale</label>
                    <input type="url" placeholder="https://..." value={siteLinks[p.id] || ''} onChange={e => setSiteLinks({...siteLinks, [p.id]: e.target.value})} className="data-input mb-4" />
                    <button onClick={() => handleApproveSite(p.id)} className="w-full text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      Sito Online: Invia Link Utente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: PAYOUTS */}
          {activeTab === 'payouts' && (
             <div className="space-y-6">
               <h1 className="text-3xl font-black text-white uppercase border-b border-white/10 pb-6">Distinta Pagamenti</h1>
               <div className="admin-panel rounded-2xl overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-white/5 text-[9px] uppercase tracking-widest text-slate-500"><tr><th className="px-6 py-4">ID / Stato KYC</th><th className="px-6 py-4">IBAN Accredito</th><th className="px-6 py-4 text-right">Debito Rete</th><th className="px-6 py-4 text-right">Azione Amministrativa</th></tr></thead>
                    <tbody>
                      {readyForPayout.map(p => (
                        <tr key={p.id} className="border-b border-white/5">
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{p.email}<br/><span className={`uppercase font-bold ${p.kyc_status === 'approved' ? 'text-emerald-500' : 'text-red-500'}`}>KYC {p.kyc_status}</span></td>
                          <td className="px-6 py-4 font-mono text-sm text-white">{p.payment_info || 'Mancante'}</td>
                          <td className="px-6 py-4 text-right font-mono font-black text-emerald-400 text-xl">€{p.wallet_approved?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => markAsPaid(p.id)} className="text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-slate-200 px-4 py-2.5 rounded-lg active:scale-95 transition-all">Segna come Pagato</button>
                          </td>
                        </tr>
                      ))}
                      {readyForPayout.length === 0 && <tr><td colSpan="4" className="text-center py-10 text-slate-500 uppercase text-xs">Nessun bonifico in sospeso</td></tr>}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {/* TAB: GESTIONE OFFERTE */}
          {activeTab === 'offers' && (
            <div className="space-y-10">
              <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Database Campagne</h1>
              </div>

              <div className="admin-panel p-8 rounded-[2rem] border border-blue-500/20">
                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6">➕ Inserisci Offerta</h2>
                <form onSubmit={handleCreateOffer} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Commerciale</label>
                      <input type="text" required value={offerForm.name} onChange={e => setOfferForm({...offerForm, name: e.target.value})} className="data-input" placeholder="Es. Conto Trading eToro" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Program ID (FinanceAds)</label>
                      <input type="text" required value={offerForm.program_id} onChange={e => setOfferForm({...offerForm, program_id: e.target.value})} className="data-input font-mono text-amber-400" placeholder="Es. 12345" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">CPA Affiliato (€)</label>
                      <input type="number" step="0.01" required value={offerForm.partner_payout} onChange={e => setOfferForm({...offerForm, partner_payout: e.target.value})} className="data-input font-mono text-emerald-400" placeholder="50.00" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Modello</label>
                      <select value={offerForm.payout_type} onChange={e => setOfferForm({...offerForm, payout_type: e.target.value})} className="data-input"><option>CPA</option><option>CPL</option></select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">URL Logo (Clearbit)</label>
                      <input type="url" value={offerForm.image_url} onChange={e => setOfferForm({...offerForm, image_url: e.target.value})} className="data-input font-mono" placeholder="https://logo.clearbit.com/etoro.com" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Base Link FinanceAds (NO SUBID)</label>
                      <input type="url" required value={offerForm.base_link} onChange={e => setOfferForm({...offerForm, base_link: e.target.value})} className="data-input font-mono text-blue-400" placeholder="https://financeads.net/tc.php?t=12345" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Descrizione Policy</label>
                      <textarea rows="2" value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} className="data-input resize-none" placeholder="Dettagli campagna..."></textarea>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nazioni (Geo)</label>
                      <input type="text" value={offerForm.allowed_countries} onChange={e => setOfferForm({...offerForm, allowed_countries: e.target.value})} className="data-input" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Traffico Consentito</label>
                      <input type="text" value={offerForm.allowed_traffic} onChange={e => setOfferForm({...offerForm, allowed_traffic: e.target.value})} className="data-input text-emerald-400" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Divieti Assoluti</label>
                      <input type="text" value={offerForm.restrictions} onChange={e => setOfferForm({...offerForm, restrictions: e.target.value})} className="data-input text-rose-400 border-rose-500/30" placeholder="Vietato Brand Bidding..." />
                    </div>
                  </div>
                  <div className="pt-4 text-right">
                    <button type="submit" disabled={isSavingOffer} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                      {isSavingOffer ? 'Salvataggio...' : 'Pubblica nel Marketplace'}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Campagne Pubblicate ({offers.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map(offer => (
                    <div key={offer.id} className="admin-panel p-5 rounded-2xl flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        {offer.image_url ? <img src={offer.image_url} alt="" className="w-10 h-10 rounded-lg bg-white p-1 object-contain" /> : <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">🏦</div>}
                        <div>
                          <h4 className="font-bold text-white text-sm">{offer.name}</h4>
                          <p className="text-[10px] font-mono text-slate-500">ID: {offer.program_id} | CPA: €{offer.partner_payout}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteOffer(offer.id)} className="text-[10px] font-bold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 px-3 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100">Rimuovi</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALE INSERIMENTO VENDITA MANUALE --- */}
      {isConvModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="admin-panel p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.2)] border border-red-500/30">
            <h2 className="text-2xl font-black text-white mb-2">Assegna Conversione</h2>
            <p className="text-xs text-slate-400 mb-6">Stai accreditando fondi all'utente: <span className="text-white font-mono">{selectedUser.email}</span></p>
            
            <form onSubmit={handleAddConversion} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nome Offerta / Programma</label>
                <input type="text" required value={convForm.program_id} onChange={e => setConvForm({...convForm, program_id: e.target.value})} className="data-input" placeholder="Es. N26 IT" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Importo Commissione (€)</label>
                <input type="number" step="0.01" required value={convForm.amount} onChange={e => setConvForm({...convForm, amount: e.target.value})} className="data-input text-emerald-400 font-mono text-lg" placeholder="50.00" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stato Conversione</label>
                <select value={convForm.status} onChange={e => setConvForm({...convForm, status: e.target.value})} className="data-input bg-[#0A0F19]">
                  <option value="approved">Approvato (Aggiunge al Saldo Netto)</option>
                  <option value="pending">In Valutazione (Aggiunge al Saldo Pendente)</option>
                  <option value="rejected">Rifiutato (Nessun guadagno, solo notifica)</option>
                </select>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsConvModalOpen(false)} className="flex-1 text-xs font-bold text-slate-500 bg-white/5 hover:bg-white/10 py-3.5 rounded-xl transition-all">Annulla</button>
                <button type="submit" className="flex-[2] text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 py-3.5 rounded-xl shadow-lg transition-all active:scale-95">Emetti Commissione</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}