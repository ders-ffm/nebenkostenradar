// Stripe Zahlungsverifikation — serverseitig
// Prüft ob eine Stripe Session wirklich bezahlt wurde
// Verhindert dass ?paid=true manuell in URL eingetippt werden kann
//
// Vercel Environment Variable: STRIPE_SECRET_KEY
// (Stripe Dashboard → Entwickler → API-Schlüssel → Geheimer Schlüssel)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://nebenkostenradar.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { sessionId } = req.body || {};
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!sessionId || !stripeKey) {
    return res.status(400).json({ verified: false, error: 'Fehlende Parameter' });
  }

  // Session-ID muss mit cs_ beginnen (Stripe Checkout Session)
  if (!sessionId.startsWith('cs_')) {
    return res.status(400).json({ verified: false, error: 'Ungültige Session-ID' });
  }

  try {
    // Stripe API: Session abrufen
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${stripeKey}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(400).json({ verified: false, error: 'Session nicht gefunden' });
    }

    const session = await response.json();

    // Prüfe ob Zahlung wirklich erfolgreich war
    if (session.payment_status === 'paid') {
      return res.status(200).json({ verified: true });
    } else {
      return res.status(200).json({ verified: false, error: 'Zahlung nicht abgeschlossen' });
    }
  } catch (err) {
    console.error('Verifikation Fehler:', err.message);
    return res.status(500).json({ verified: false, error: 'Serverfehler' });
  }
}
