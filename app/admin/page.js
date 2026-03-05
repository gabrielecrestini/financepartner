"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [offers, setOffers] = useState([]); // Stato per le offerte
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('compliance'); 
  
  const router = useRouter();

  // Stato per il form di creazione offerta
  const [offerForm, setOfferForm] = useState({
    name: '', program_id: '', partner_payout: '', payout_type: 'CPA', 
    base_link: '', image_url: '', description: '', allowed_countries: 'Italia (IT)', 
    allowed_traffic: 'Meta Ads, TikTok, Google SEO, Native', restrictions: ''
  });
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  // Memoria Tab: non perdi la schermata se aggiorni la pagina
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

      // Recupera Profili
      const { data: allProfiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles(allProfiles || []);

      // Recupera Offerte
      const { data: allOffers } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
      setOffers(allOffers || []);

      setLoading(false);
    };

    fetchAdminData();
  }, [router]);

  const updateStatus = async (userId, field, newStatus) => {
    const { error } = await supabase.from('profiles').update({ [field]: newStatus }).eq('id', userId);
    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, [field]: newStatus } : p));
    } else {
      alert("Errore di comunicazione col database.");
    }
  };

  const markAsPaid = async (userId) => {
    const confirm = window.confirm("Confermi di aver inviato il bonifico? Il credito dell'affiliato verrà azzerato.");
    if (!confirm) return;
    const { error } = await supabase.from('profiles').update({ wallet_approved: 0 }).eq('id', userId);
    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, wallet_approved: 0 } : p));
      alert("✅ Debito azzerato.");
    }
  };

  // LOGICA GESTIONE OFFERTE
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setIsSavingOffer(true);
    const { data, error } = await supabase.from('offers').insert([{
      ...offerForm,
      partner_payout: parseFloat(offerForm.partner_payout)
    }]).select();

    setIsSavingOffer(false);
    if (error) {
      alert(`Errore: ${error.message}`);
    } else if (data) {
      setOffers([data[0], ...offers]); // Aggiunge la nuova offerta in cima alla lista
      alert("🚀 Offerta aggiunta con successo e visibile agli affiliati!");
      // Resetta il form
      setOfferForm({name: '', program_id: '', partner_payout: '', payout_type: 'CPA', base_link: '', image_url: '', description: '', allowed_countries: 'Italia (IT)', allowed_traffic: 'Meta Ads, TikTok, Google SEO, Native', restrictions: ''});
    }
  };

  const handleDeleteOffer = async (id) => {
    const confirm = window.confirm("Cancellare definitivamente questa offerta dal Marketplace?");
    if (!confirm) return;
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (!error) {
      setOffers(offers.filter(o => o.id !== id));
    } else {
      alert("Errore durante l'eliminazione.");
    }
  };

  // COMPONENTE BADGE RISOLTO
  const StatusBadge = ({ status }) => {
    if (status === 'approved') return <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold uppercase">Approvato</span>;
    if (status === 'pending') return <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-[10px] font-bold uppercase">In Attesa</span>;
    if (status === 'rejected') return <span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded text-[10px] font-bold uppercase">Rifiutato</span>;
    return <span className="bg-white/10 text-slate-400 px-2 py-1 rounded text-[10px] font-bold uppercase">Nessun Dato</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#030509] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-red-500 text-xs font-mono uppercase tracking-widest animate-pulse">Root Access Login...</p>
    </div>
  );

  const pendingTraffic = profiles.filter(p => p.traffic_status === 'pending' && !p.traffic_notes?.includes('Richiesta Sito'));
  const pendingSites = profiles.filter(p => p.traffic_status === 'pending' && p.traffic_notes?.includes('Richiesta Sito'));
  const pendingKyc = profiles.filter(p => p.kyc_status === 'pending');
  const readyForPayout = profiles.filter(p => p.wallet_approved > 0);

  return (
    <div className="min-h-screen bg-[#030509] text-slate-300 font-sans selection:bg-red-500/30 flex flex-col md:flex-row overflow-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        .admin-panel { background: rgba(10, 15, 25, 0.8); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .data-input { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: white; }
        .data-input:focus { border-color: #DC2626; outline: none; }
        .data-row { transition: all 0.2s ease; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .data-row:hover { background: rgba(255,255,255,0.02); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-[20vh] bg-gradient-to-b from-red-600/10 to-transparent"></div>
      </div>

      {/* --- SIDEBAR ADMIN --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-white/10 bg-[#05070C] z-40 relative">
        <div className="p-8 border-b border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(220,38,38,0.5)]">⚡</div>
          <div><span className="font-bold text-white text-lg tracking-tight block">ADMIN ROOT</span><span className="text-[9px] font-mono text-red-500 uppercase tracking-widest">Master Control</span></div>
        </div>
        
        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto hide-scrollbar">
          <button onClick={() => handleTabChange('compliance')} className={`w-full flex justify-between items-center gap-3 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'compliance' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            1. Compliance
            {(pendingTraffic.length > 0 || pendingKyc.length > 0) && <span className="bg-red-600 text-white px-2 py-0.5 rounded">{pendingTraffic.length + pendingKyc.length}</span>}
          </button>
          <button onClick={() => handleTabChange('sites')} className={`w-full flex justify-between items-center gap-3 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'sites' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            2. Asset Web
            {pendingSites.length > 0 && <span className="bg-amber-500 text-black px-2 py-0.5 rounded">{pendingSites.length}</span>}
          </button>
          <button onClick={() => handleTabChange('payouts')} className={`w-full flex justify-between items-center gap-3 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'payouts' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            3. Tesoreria
            {readyForPayout.length > 0 && <span className="bg-emerald-500 text-black px-2 py-0.5 rounded">{readyForPayout.length}</span>}
          </button>
          <button onClick={() => handleTabChange('offers')} className={`w-full flex justify-between items-center gap-3 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'offers' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            4. DB Offerte
            <span className="text-slate-600">{offers.length}</span>
          </button>
          <button onClick={() => handleTabChange('network')} className={`w-full flex justify-between items-center gap-3 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'network' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            5. Affiliati
            <span className="text-slate-600">{profiles.length}</span>
          </button>
        </div>
        
        <div className="p-6 border-t border-white/10">
          <button onClick={() => router.push('/dashboard')} className="w-full text-xs font-bold text-slate-500 hover:text-white py-3 border border-white/10 rounded-xl transition-colors">Torna all'App</button>
        </div>
      </aside>

      {/* --- AREA CONTENUTI --- */}
      <main className="flex-1 h-screen overflow-y-auto hide-scrollbar relative z-10 p-6 sm:p-12">
        <div className="max-w-[1400px] mx-auto">

          {/* VISTE PRECEDENTI: Compliance, Sites, Payouts, Network (Omesse o ridotte per brevità, sono le stesse di prima con i bottoni) */}
          {/* MANTENIAMO IL CODICE INTATTO DELLE ALTRE SCHEDE */}
          
          {/* TAB 1: COMPLIANCE */}
          {activeTab === 'compliance' && (
            <div className="space-y-10">
              <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Code di Validazione</h1>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Sorgenti Traffico ({pendingTraffic.length})</h2>
                <div className="admin-panel rounded-2xl overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-white/5 text-[9px] uppercase text-slate-500"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Sorgente</th><th className="px-6 py-4 text-right">Azione</th></tr></thead>
                    <tbody>
                      {pendingTraffic.map(p => (
                        <tr key={p.id} className="data-row">
                          <td className="px-6 py-4 font-mono text-xs">{p.email}</td>
                          <td className="px-6 py-4"><a href={p.registered_website} target="_blank" className="text-blue-400">{p.registered_website}</a></td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <button onClick={() => updateStatus(p.id, 'traffic_status', 'approved')} className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg">Approva</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 mt-8">Verifica KYC ({pendingKyc.length})</h2>
                <div className="admin-panel rounded-2xl overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-white/5 text-[9px] uppercase text-slate-500"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Soggetto</th><th className="px-6 py-4">IBAN</th><th className="px-6 py-4 text-right">Azione</th></tr></thead>
                    <tbody>
                      {pendingKyc.map(p => (
                        <tr key={p.id} className="data-row">
                          <td className="px-6 py-4 font-mono text-xs">{p.email}</td>
                          <td className="px-6 py-4"><p className="text-white">{p.full_name}</p><p className="text-[9px] text-amber-500">{p.entity_type}</p></td>
                          <td className="px-6 py-4 font-mono text-xs">{p.payment_info}</td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <button onClick={() => updateStatus(p.id, 'kyc_status', 'approved')} className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg">Approva KYC</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SITI E ASSET */}
          {activeTab === 'sites' && (
             <div className="space-y-6">
              <div className="border-b border-white/10 pb-6"><h1 className="text-3xl font-black text-white uppercase">Richieste Siti Web</h1></div>
              <div className="grid grid-cols-1 gap-6">
                  {pendingSites.map(p => (
                    <div key={p.id} className="admin-panel p-6 rounded-2xl border-l-4 border-l-blue-500 relative">
                      <div className="absolute top-6 right-6">
                         <button onClick={() => updateStatus(p.id, 'traffic_status', 'approved')} className="text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-all">Sito Creato / Sblocca Link</button>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 mb-4">Utente: <span className="text-white">{p.email}</span></p>
                      <div className="bg-black/40 border border-white/5 p-5 rounded-xl max-w-2xl">
                         <p className="text-sm font-mono text-blue-300 whitespace-pre-wrap">{p.traffic_notes}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAYOUTS */}
          {activeTab === 'payouts' && (
             <div className="space-y-6">
               <div className="border-b border-white/10 pb-6"><h1 className="text-3xl font-black text-white uppercase">Tesoreria</h1></div>
               <div className="admin-panel rounded-2xl overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-white/5 text-[9px] uppercase text-slate-500"><tr><th className="px-6 py-4">ID / KYC</th><th className="px-6 py-4">IBAN</th><th className="px-6 py-4 text-right">Da Pagare</th><th className="px-6 py-4 text-right">Azione</th></tr></thead>
                    <tbody>
                      {readyForPayout.map(p => (
                        <tr key={p.id} className="data-row">
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{p.email}<br/><span className={p.kyc_status === 'approved' ? 'text-emerald-500' : 'text-red-500'}>KYC: {p.kyc_status}</span></td>
                          <td className="px-6 py-4 font-mono text-xs text-white">{p.payment_info}</td>
                          <td className="px-6 py-4 text-right font-mono font-black text-emerald-400 text-xl">€{p.wallet_approved?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => markAsPaid(p.id)} className="text-[10px] font-bold uppercase bg-white text-black px-4 py-2 rounded-lg">Azzera Credito</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {/* TAB 4: DATABASE AFFILIATI */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-6"><h1 className="text-3xl font-black text-white uppercase">Database Utenti ({profiles.length})</h1></div>
              <div className="admin-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white/5 text-[9px] uppercase text-slate-500"><tr><th className="px-6 py-4">Email</th><th className="px-6 py-4">Data Iscrizione</th><th className="px-6 py-4">Traffico</th><th className="px-6 py-4 text-right">Generato</th></tr></thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} className="data-row">
                        <td className="px-6 py-4 font-mono text-xs text-white">{p.email}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><StatusBadge status={p.traffic_status} /></td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-300">€{p.wallet_approved?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === NUOVA TAB 5: GESTORE OFFERTE === */}
          {activeTab === 'offers' && (
            <div className="space-y-10 animate-view">
              <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Database Offerte</h1>
                <p className="text-sm text-slate-500 mt-2 font-mono">Inietta nuove campagne direttamente nel Marketplace.</p>
              </div>

              {/* Form Aggiunta Offerta */}
              <div className="admin-panel p-8 rounded-[2rem] border border-red-500/20">
                <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-6">➕ Crea Nuova Campagna</h2>
                <form onSubmit={handleCreateOffer} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Commerciale</label>
                      <input type="text" required value={offerForm.name} onChange={e => setOfferForm({...offerForm, name: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Es. Conto Trading eToro" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Program ID (FinanceAds)</label>
                      <input type="text" required value={offerForm.program_id} onChange={e => setOfferForm({...offerForm, program_id: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm font-mono text-amber-400" placeholder="Es. 12345" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Payout Affiliato (€)</label>
                      <input type="number" step="0.01" required value={offerForm.partner_payout} onChange={e => setOfferForm({...offerForm, partner_payout: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm font-mono text-emerald-400" placeholder="50.00" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Modello Conversione</label>
                      <select value={offerForm.payout_type} onChange={e => setOfferForm({...offerForm, payout_type: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm">
                        <option>CPA</option><option>CPL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Logo URL (Clearbit)</label>
                      <input type="url" value={offerForm.image_url} onChange={e => setOfferForm({...offerForm, image_url: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm font-mono" placeholder="https://logo.clearbit.com/etoro.com" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Base Link (FinanceAds Pulito - SENZA SUBID)</label>
                      <input type="url" required value={offerForm.base_link} onChange={e => setOfferForm({...offerForm, base_link: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm font-mono text-blue-400" placeholder="https://financeads.net/tc.php?t=12345" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Descrizione Lunga</label>
                      <textarea rows="3" value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Pitch commerciale dell'offerta..."></textarea>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Geo (Nazioni)</label>
                      <input type="text" value={offerForm.allowed_countries} onChange={e => setOfferForm({...offerForm, allowed_countries: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Traffico Consentito</label>
                      <input type="text" value={offerForm.allowed_traffic} onChange={e => setOfferForm({...offerForm, allowed_traffic: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm text-emerald-400" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Restrizioni Assolute (Pena Storno)</label>
                      <input type="text" value={offerForm.restrictions} onChange={e => setOfferForm({...offerForm, restrictions: e.target.value})} className="data-input w-full rounded-xl px-4 py-3 text-sm text-rose-400 border-rose-500/30 bg-rose-500/5" placeholder="Es. Vietato Brand Bidding..." />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isSavingOffer} className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50">
                      {isSavingOffer ? 'Iniezione Dati...' : 'Aggiungi al Database Pubblico'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista Offerte Attive */}
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Campagne Attive in Piattaforma ({offers.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map(offer => (
                    <div key={offer.id} className="admin-panel p-5 rounded-2xl flex justify-between items-center group border-l-2 border-emerald-500">
                      <div className="flex items-center gap-4">
                        {offer.image_url ? <img src={offer.image_url} alt="" className="w-10 h-10 rounded-lg bg-white p-1 object-contain" /> : <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xl">🏦</div>}
                        <div>
                          <h4 className="font-bold text-white text-sm">{offer.name}</h4>
                          <p className="text-[10px] font-mono text-slate-500">ID: {offer.program_id} | Payout: €{offer.partner_payout}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteOffer(offer.id)} className="text-[10px] font-bold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 px-3 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        Elimina
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}