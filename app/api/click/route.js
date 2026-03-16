import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offer_id');
    const subid = searchParams.get('subid');

    if (!offerId || !subid) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 1. Cerca l'offerta nel database per prendere il link di FinanceAds
    const { data: offer } = await supabase
      .from('offers')
      .select('tracking_link')
      .eq('id', offerId)
      .single();

    // 2. Salva il Click nel Database (Questo farà muovere il grafico nella Dashboard!)
    await supabase.from('clicks').insert({
      affiliate_id: subid,
      offer_id: offerId
    });

    // 3. Costruisci il link finale di FinanceAds aggiungendo il SubID
    // Assumiamo che il tracking_link abbia già un "?" o una "&", usiamo la sintassi sicura
    let finalUrl = offer?.tracking_link || '/';
    if (finalUrl !== '/') {
      const separator = finalUrl.includes('?') ? '&' : '?';
      // Aggiungiamo il subid. FinanceAds di solito usa "subid="
      finalUrl = `${finalUrl}${separator}subid=${subid}`;
    }

    // 4. Reindirizza l'utente (l'operazione dura meno di 50ms, l'utente non se ne accorge)
    return NextResponse.redirect(finalUrl);

  } catch (error) {
    console.error("Errore nel tracking link:", error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}