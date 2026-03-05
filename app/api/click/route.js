import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request) {
  // 1. Estrae i dati dal link (es. /api/click?offer_id=123&subid=abc)
  const { searchParams } = new URL(request.url);
  const offer_id = searchParams.get('offer_id');
  const subid = searchParams.get('subid');

  // Se mancano i parametri, rimanda alla home del tuo sito
  if (!offer_id || !subid) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Cerca l'offerta nel database per prendere il link di financeAds
  const { data: offer, error } = await supabase
    .from('offers')
    .select('base_link')
    .eq('id', offer_id)
    .single();

  if (error || !offer) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. REGISTRA IL CLICK NEL DATABASE (Così calcoliamo l'EPC e il CR!)
  await supabase.from('clicks').insert([
    { affiliate_id: subid, offer_id: offer_id }
  ]);

  // 4. Costruisce il link finale per financeAds e fa il REDIRECT INVISIBILE
  // Assicuriamoci di agganciare il subid nel modo corretto
  const separator = offer.base_link.includes('?') ? '&' : '?';
  const finalUrl = `${offer.base_link}${separator}subid=${subid}`;

  return NextResponse.redirect(finalUrl);
}