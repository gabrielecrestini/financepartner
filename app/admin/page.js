"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [offers, setOffers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sites'); 
  
  // Stato per i link dei siti da inviare
  const [siteLinks, setSiteLinks] = useState({});

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

  // FUNZIONE PER INVIARE NOTIFICHE
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

  // FUNZIONE: APPROVA SITO E MANDA IL LINK
  const handleApproveSite = async (userId) => {
    const linkToAssign = siteLinks[userId];
    if (!linkToAssign) {
      alert("Inserisci l'URL del sito prima di approvare!");
      return;
    }

    const { error } = await supabase.from('profiles').update({ 
      traffic_status: 'approved', 
      assigned_site_link: linkToAssign 
    }).eq('id', userId);

    if (!error) {
      setProfiles(profiles.map(p => p.id === userId ? { ...p, traffic_status: 'approved', assigned_site_link: linkToAssign } : p));
      await sendNotification(userId, "🚀 Asset Web Pronto!", "Il tuo sito è online e i tuoi link sono stati sbloccati. Puoi iniziare a spammare e scalare le campagne!", "success");
      alert("Sito inviato e notifica consegnata all'utente!");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#030509] flex flex-col items-center justify-center"><div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const pendingTraffic = profiles.filter(p => p.traffic_status === 'pending' && !p.traffic_notes?.includes('Richiesta Sito'));
  const pendingSites = profiles.filter(p => p.traffic_status === 'pending' && p.traffic_notes?.includes('Richiesta Sito'));
  const pendingKyc = profiles.filter(p => p.kyc_status === 'pending');

  return (
    <div className="min-h-screen bg-[#030509] text-slate-300 font-sans flex flex-col md:flex-row">
      <style dangerouslySetInnerHTML={{__html: `.admin-panel { background: rgba(10, 15, 25, 0.8); border: 1px solid rgba(255, 255, 255, 0.05); } .data-input { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px; border-radius: 8px; width: 100%; outline:none; } .data-input:focus { border-color: #3B82F6; }`}} />

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-white/10 bg-[#05070C] p-6 space-y-4">
        <div className="mb-8"><span className="font-bold text-white text-lg tracking-tight block">ADMIN ROOT</span><span className="text-[9px] text-red-500 uppercase tracking-widest">Master Control</span></div>
        <button onClick={() => handleTabChange('sites')} className={`p-4 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'sites' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>1. Code Siti Web {pendingSites.length > 0 && `(${pendingSites.length})`}</button>
        <button onClick={() => handleTabChange('compliance')} className={`p-4 rounded-xl text-left text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'compliance' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>2. Traffico & KYC</button>
        <button onClick={() => router.push('/dashboard')} className="mt-auto p-4 border border-white/10 rounded-xl text-xs text-slate-500 hover:text-white">Torna all'App</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">
          
          {activeTab === 'sites' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-black text-white uppercase mb-8">Richieste Asset Web</h1>
              {pendingSites.length === 0 ? <p className="text-slate-500">Nessuna richiesta pendente.</p> : pendingSites.map(p => (
                <div key={p.id} className="admin-panel p-6 rounded-2xl border-l-4 border-l-blue-500 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 mb-2">Utente: <span className="text-white font-bold">{p.email}</span></p>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                       <p className="text-xs text-blue-300 whitespace-pre-wrap">{p.traffic_notes}</p>
                       <p className="text-[10px] text-emerald-400 mt-2 uppercase font-bold">Obiettivi: {p.traffic_volume}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Inserisci URL Sito Creato</label>
                    <input type="url" placeholder="https://tuosito.com/lander-1" value={siteLinks[p.id] || ''} onChange={e => setSiteLinks({...siteLinks, [p.id]: e.target.value})} className="data-input mb-4" />
                    <button onClick={() => handleApproveSite(p.id)} className="w-full text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      Approva e Invia Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-black text-white uppercase">Compliance (Sorgenti Proprie & KYC)</h1>
              
              <div className="admin-panel p-6 rounded-2xl">
                <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Sorgenti Private ({pendingTraffic.length})</h2>
                {pendingTraffic.map(p => (
                   <div key={p.id} className="flex justify-between items-center p-4 border-b border-white/5">
                     <div><p className="font-mono text-xs text-white">{p.email}</p><a href={p.registered_website} target="_blank" className="text-blue-400 text-sm">{p.registered_website}</a></div>
                     <button onClick={() => updateStatus(p.id, 'traffic_status', 'approved', 'La tua sorgente di traffico è stata approvata! I link sono attivi.')} className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg">Approva e Notifica</button>
                   </div>
                ))}
              </div>

              <div className="admin-panel p-6 rounded-2xl">
                <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">KYC Fiscali ({pendingKyc.length})</h2>
                {pendingKyc.map(p => (
                   <div key={p.id} className="flex justify-between items-center p-4 border-b border-white/5">
                     <div><p className="font-mono text-xs text-white">{p.email}</p><p className="text-slate-400 text-sm">{p.full_name} - {p.payment_info}</p></div>
                     <button onClick={() => updateStatus(p.id, 'kyc_status', 'approved', 'Il tuo profilo KYC è stato validato con successo.')} className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg">Approva KYC</button>
                   </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}