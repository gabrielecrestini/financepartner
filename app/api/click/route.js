import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offer_id');
    const subid = searchParams.get('subid');

    // Se mancano i dati, torna alla home del nuovo dominio
    if (!offerId || !subid) {
      return NextResponse.redirect(new URL('https://financepartnerr.it', request.url));
    }

    // Inizializzazione Server-Side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Recupero link offerta
    const { data: offer, error } = await supabase
      .from('offers')
      .select('tracking_link')
      .eq('id', offerId)
      .single();

    if (error || !offer || !offer.tracking_link) {
      return NextResponse.redirect(new URL('https://financepartnerr.it', request.url));
    }

    // 2. Registrazione Click nel DB
    await supabase.from('clicks').insert({
      affiliate_id: subid,
      offer_id: offerId
    });

    // 3. Preparazione URL finale per FinanceAds
    let finalUrl = offer.tracking_link.trim();
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    const separator = finalUrl.includes('?') ? '&' : '?';
    const redirectTarget = `${finalUrl}${separator}subid=${subid}`;

    return NextResponse.redirect(redirectTarget);

  } catch (error) {
    console.error("Errore API Click:", error);
    return NextResponse.redirect(new URL('https://financepartnerr.it', request.url));
  }
}