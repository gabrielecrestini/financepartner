import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inizializziamo Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offer_id');
    const subid = searchParams.get('subid');

    // Se mancano i parametri, torna alla home
    if (!offerId || !subid) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 1. Cerca il link dell'offerta nel DB
    const { data: offer, error } = await supabase
      .from('offers')
      .select('tracking_link')
      .eq('id', offerId)
      .single();

    // Se c'è un errore o il link è vuoto, c'è un problema nel DB
    if (error || !offer || !offer.tracking_link) {
      console.error("Offerta non trovata o tracking_link vuoto:", error);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Salva il Click nel Database (Aggiorna il grafico in Dashboard!)
    await supabase.from('clicks').insert({
      affiliate_id: subid,
      offer_id: offerId
    });

    // 3. Costruisci il link finale di FinanceAds
    let finalUrl = offer.tracking_link.trim();
    
    // Sicurezza: se manca https:// lo aggiungiamo
    if (!finalUrl.startsWith('http')) {
      finalUrl = 'https://' + finalUrl;
    }

    // Aggiungiamo il subid per tracciare la vendita su FinanceAds
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}subid=${subid}`;

    // 4. Manda l'utente alla pagina della banca (FinanceAds)
    return NextResponse.redirect(finalUrl);

  } catch (error) {
    console.error("Errore Critico API Click:", error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}