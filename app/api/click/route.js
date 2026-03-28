import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offer_id');
    const subid = searchParams.get('subid');

    // Se mancano i dati, torna alla home di PartnerVest
    if (!offerId || !subid) {
      return NextResponse.redirect(new URL('https://partnervest.net', request.url));
    }

    // Inizializzazione Server-Side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Cerca il tracking link dell'offerta
    const { data: offer, error } = await supabase
      .from('offers')
      .select('tracking_link')
      .eq('id', offerId)
      .single();

    if (error || !offer || !offer.tracking_link) {
      console.error("Offerta non trovata:", error);
      return NextResponse.redirect(new URL('https://partnervest.net', request.url));
    }

    // 2. Registra il Click nel DB (per le stats in tempo reale)
    supabase.from('clicks').insert({
      affiliate_id: subid,
      offer_id: offerId
    }).then();

    // 3. Prepara l'URL di FinanceAds
    let finalUrl = offer.tracking_link.trim();
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    
    // Aggiungiamo il subid per tracciare la vendita
    const separator = finalUrl.includes('?') ? '&' : '?';
    const redirectTarget = `${finalUrl}${separator}subid=${subid}`;

    // 4. Redirect 302 alla banca
    return NextResponse.redirect(redirectTarget, 302);

  } catch (error) {
    console.error("Errore API Click:", error);
    return NextResponse.redirect(new URL('https://partnervest.net', request.url));
  }
}