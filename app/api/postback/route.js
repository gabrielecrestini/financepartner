import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. Inizializzazione di Supabase 
// Le variabili vengono prese in automatico dal tuo file .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usiamo la Service Role Key perché questa è una rotta server sicura
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // 2. Lettura dei parametri inviati da financeAds nell'URL
    // Esempio in arrivo: ?subid=USER_UUID&status=open&program=80001C110660650T
    const subid = searchParams.get('subid');
    const status = searchParams.get('status'); // Può essere 'open', 'confirmed', o 'rejected'
    const programId = searchParams.get('program');

    // Controllo di sicurezza: se mancano i dati, blocca tutto
    if (!subid || !status || !programId) {
      return NextResponse.json({ error: 'Parametri mancanti dal Postback' }, { status: 400 });
    }

    // 3. Cerca l'offerta nel DB per sapere quanto pagare il tuo collaboratore
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('partner_payout')
      .eq('program_id', programId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offerta non trovata o non configurata' }, { status: 404 });
    }

    const quotaPartner = Number(offer.partner_payout);

    // 4. Esecuzione delle azioni in base allo stato della banca
    if (status === 'open') {
      
      // L'utente ha appena fatto l'azione. Creiamo la conversione "In attesa"
      const { error: insertError } = await supabase
        .from('conversions')
        .insert({
          partner_id: subid,
          program_id: programId,
          amount: quotaPartner,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Leggi il profilo e aggiungi i soldi al saldo "In Attesa"
      const { data: profile } = await supabase.from('profiles').select('wallet_pending').eq('id', subid).single();
      if (profile) {
        await supabase
          .from('profiles')
          .update({ wallet_pending: Number(profile.wallet_pending) + quotaPartner })
          .eq('id', subid);
      }

    } else if (status === 'confirmed') {
      
      // FinanceAds ha pagato TE. Troviamo la conversione "In attesa" del collaboratore...
      const { data: pendingConv } = await supabase
        .from('conversions')
        .select('id')
        .eq('partner_id', subid)
        .eq('program_id', programId)
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (pendingConv) {
        // ...e la passiamo in "Approvata"
        await supabase
          .from('conversions')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', pendingConv.id);

        // Spostiamo i soldi: li togliamo dal "pending" e li mettiamo in "approved" (Prelevabili)
        const { data: profile } = await supabase.from('profiles').select('wallet_pending, wallet_approved').eq('id', subid).single();
        if (profile) {
          await supabase
            .from('profiles')
            .update({
              wallet_pending: Math.max(0, Number(profile.wallet_pending) - quotaPartner), // Math.max evita che vada in negativo
              wallet_approved: Number(profile.wallet_approved) + quotaPartner
            })
            .eq('id', subid);
        }
      }

    } else if (status === 'rejected') {
      
      // La banca ha rifiutato l'utente (es. documenti falsi o duplicato)
      const { data: pendingConv } = await supabase
        .from('conversions')
        .select('id')
        .eq('partner_id', subid)
        .eq('program_id', programId)
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (pendingConv) {
         // Cambiamo lo stato in "Rifiutata"
         await supabase
           .from('conversions')
           .update({ status: 'rejected', updated_at: new Date().toISOString() })
           .eq('id', pendingConv.id);
         
         // Sottraiamo i soldi dal saldo in attesa per pulire il portafoglio
         const { data: profile } = await supabase.from('profiles').select('wallet_pending').eq('id', subid).single();
         if (profile) {
           await supabase
             .from('profiles')
             .update({
               wallet_pending: Math.max(0, Number(profile.wallet_pending) - quotaPartner)
             })
             .eq('id', subid);
         }
      }
    }

    // 5. Risposta a financeAds: "Tutto Ricevuto Perfettamente"
    return NextResponse.json({ success: true, message: 'Automazione Postback completata' });

  } catch (error) {
    console.error('Errore nel sistema S2S:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}