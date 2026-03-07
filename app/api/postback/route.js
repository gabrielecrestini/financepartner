import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. Inizializzazione di Supabase 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usiamo la Service Role Key per scavalcare le regole RLS essendo un'API Server-side
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // 2. Lettura dei parametri.
    // L'URL che FinanceAds chiamerà sarà tipo: ?subid=USER_UUID&status=confirmed&program=eToro&payout=150
    const subid = searchParams.get('subid');
    const rawStatus = searchParams.get('status') || '';
    const programName = searchParams.get('program') || 'Campagna Finanziaria'; 
    const receivedPayout = searchParams.get('payout'); 

    // Normalizziamo lo status per evitare problemi di maiuscole/minuscole
    const status = rawStatus.toLowerCase();

    // Sicurezza: blocchiamo richieste vuote o test di FinanceAds con le macro non compilate
    if (!subid || subid === '{subid}' || subid === '[SUBID]') {
      return NextResponse.json({ error: 'SubID mancante o invalido (Macro non compilata)' }, { status: 400 });
    }

    // 3. Determina la quota da pagare al partner.
    // Se FinanceAds ci ha inviato il payout (es. payout=50), usiamo quello.
    // Altrimenti, proviamo a cercarlo nel nostro database tramite il nome del programma.
    let quotaPartner = parseFloat(receivedPayout);

    if (isNaN(quotaPartner) || quotaPartner <= 0) {
       // Se l'importo non è nell'URL, lo cerchiamo nel DB
       const { data: offer } = await supabase
         .from('offers')
         .select('partner_payout')
         .ilike('name', `%${programName}%`) // Cerca un'offerta che contiene quel nome
         .limit(1)
         .single();
       
       if (offer) {
         quotaPartner = Number(offer.partner_payout);
       } else {
         quotaPartner = 0; // Fallback di sicurezza
       }
    }

    // 4. Esecuzione delle azioni sui Portafogli in base allo STATO
    
    if (status === 'open' || status === 'pending') {
      
      // A. L'utente ha generato un Lead "In Attesa"
      const { error: insertError } = await supabase
        .from('conversions')
        .insert({
          partner_id: subid,
          program_id: programName,
          amount: quotaPartner,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Aggiungi soldi al saldo "In Attesa"
      const { data: profile } = await supabase.from('profiles').select('wallet_pending').eq('id', subid).single();
      if (profile) {
        await supabase.from('profiles').update({ wallet_pending: Number(profile.wallet_pending) + quotaPartner }).eq('id', subid);
      }

      // Notifica l'affiliato
      await supabase.from('notifications').insert([{ 
        user_id: subid, title: '⏳ Lead in Valutazione', 
        message: `L'istituto bancario sta verificando una nuova conversione per ${programName} (Potenziale: €${quotaPartner.toFixed(2)}).`, type: 'info' 
      }]);

    } else if (status === 'confirmed' || status === 'approved') {
      
      // B. La Banca ha APPROVATO la conversione (FinanceAds paga te, tu paghi l'affiliato)
      // Cerchiamo se esiste già la conversione "pending" per aggiornarla
      const { data: pendingConv } = await supabase
        .from('conversions')
        .select('id')
        .eq('partner_id', subid)
        .eq('program_id', programName)
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (pendingConv) {
        // Aggiorna la conversione esistente
        await supabase.from('conversions').update({ status: 'approved', amount: quotaPartner, updated_at: new Date().toISOString() }).eq('id', pendingConv.id);
        
        // Sposta i soldi da Pending ad Approved
        const { data: profile } = await supabase.from('profiles').select('wallet_pending, wallet_approved').eq('id', subid).single();
        if (profile) {
          await supabase.from('profiles').update({
              wallet_pending: Math.max(0, Number(profile.wallet_pending) - quotaPartner),
              wallet_approved: Number(profile.wallet_approved) + quotaPartner
            }).eq('id', subid);
        }
      } else {
        // Se per qualche motivo FinanceAds manda direttamente 'confirmed' senza passare per 'open', la creiamo da zero
        await supabase.from('conversions').insert({ partner_id: subid, program_id: programName, amount: quotaPartner, status: 'approved' });
        
        // Aggiungiamo direttamente i soldi in Approved
        const { data: profile } = await supabase.from('profiles').select('wallet_approved').eq('id', subid).single();
        if (profile) {
          await supabase.from('profiles').update({ wallet_approved: Number(profile.wallet_approved) + quotaPartner }).eq('id', subid);
        }
      }

      // Notifica trionfale all'affiliato
      await supabase.from('notifications').insert([{ 
        user_id: subid, title: '💶 Commissione Liquidabile (S2S)', 
        message: `La conversione per ${programName} è stata validata. Sono stati aggiunti €${quotaPartner.toFixed(2)} al tuo saldo esigibile.`, type: 'success' 
      }]);

    } else if (status === 'rejected' || status === 'cancelled') {
      
      // C. La Banca ha RIFIUTATO il Lead
      const { data: pendingConv } = await supabase
        .from('conversions').select('id').eq('partner_id', subid).eq('program_id', programName).eq('status', 'pending')
        .limit(1).single();

      if (pendingConv) {
         // Aggiorna log
         await supabase.from('conversions').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', pendingConv.id);
         
         // Togli i soldi dal saldo in attesa
         const { data: profile } = await supabase.from('profiles').select('wallet_pending').eq('id', subid).single();
         if (profile) {
           await supabase.from('profiles').update({ wallet_pending: Math.max(0, Number(profile.wallet_pending) - quotaPartner) }).eq('id', subid);
         }
      }

      // Avvisa l'affiliato dello storno
      await supabase.from('notifications').insert([{ 
        user_id: subid, title: '⛔ Traffico Rifiutato', 
        message: `Purtroppo una conversione per ${programName} non ha superato i controlli di qualità della banca ed è stata stornata.`, type: 'error' 
      }]);
    }

    // 5. Risposta a FinanceAds: "Tutto Ricevuto Perfettamente" (Status 200)
    return NextResponse.json({ success: true, message: 'Automazione Postback completata con successo' });

  } catch (error) {
    console.error('Errore Critico nel Postback S2S:', error);
    // Rispondiamo comunque con 200 a FinanceAds per evitare che ri-invii gli stessi dati all'infinito intasando il server
    return NextResponse.json({ success: false, error: 'Errore interno catturato' }, { status: 200 });
  }
}