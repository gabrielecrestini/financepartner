import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  // Prende i dati dall'URL generato dalla dashboard
  const offer_id = searchParams.get('offer_id');
  const subid = searchParams.get('subid');

  // Se mancano dati, rimanda alla home per sicurezza
  if (!offer_id || !subid) {
    return NextResponse.redirect('https://financepartner.netlify.app');
  }

  try {
    // 1. REGISTRA IL CLICK NEL DATABASE (Aggiorna le statistiche in Dashboard)
    await supabase.from('clicks').insert([{
      offer_id: offer_id,
      affiliate_id: subid
    }]);

    // 2. RECUPERA IL TUO LINK FINANCEADS DAL DATABASE
    const { data: offer } = await supabase
      .from('offers')
      .select('base_link')
      .eq('id', offer_id)
      .single();

    if (!offer || !offer.base_link) {
      return NextResponse.redirect('https://financepartner.netlify.app');
    }

    // 3. COSTRUISCE IL LINK FINALE (La Magia)
    // Prende il tuo link (es. https://financeads.net/tc.php?t=12345) 
    // e ci attacca in automatico "&subid=ID_DELL_AFFILIATO"
    const separator = offer.base_link.includes('?') ? '&' : '?';
    const finalFinanceAdsUrl = `${offer.base_link}${separator}subid=${subid}`;

    // 4. REINDIRIZZA ALLA BANCA (L'utente non si accorge di nulla)
    return NextResponse.redirect(finalFinanceAdsUrl);

  } catch (error) {
    console.error("Errore nel tracker:", error);
    return NextResponse.redirect('https://financepartner.netlify.app');
  }
}