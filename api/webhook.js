// Stripe Webhook → E-Mail via Resend
// Vercel Environment Variables:
//   STRIPE_WEBHOOK_SECRET  (Stripe Dashboard → Webhooks → Signing secret)
//   RESEND_API_KEY         (resend.com → API Keys)

export const config = {
  api: { bodyParser: false }  // Raw body für Stripe Signaturprüfung
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const resendKey = process.env.RESEND_API_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Raw body lesen
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  let event;
  try {
    if (webhookSecret) {
      // Stripe Signatur verifizieren
      const { createHmac } = await import('crypto');
      const sig = req.headers['stripe-signature'] || '';
      const parts = Object.fromEntries(sig.split(',').map(p => p.split('=')));
      const payload = `${parts.t}.${rawBody}`;
      const expected = createHmac('sha256', webhookSecret).update(payload).digest('hex');
      if (expected !== parts.v1) {
        console.error('Stripe Signatur ungültig');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Webhook Parse Fehler:', err.message);
    return res.status(400).json({ error: err.message });
  }

  console.log('Webhook Event:', event.type);

  // Unterstützte Events
  const SUPPORTED = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'charge.succeeded',
  ];
  if (!SUPPORTED.includes(event.type)) {
    return res.status(200).json({ received: true, skipped: event.type });
  }

  // E-Mail-Adresse aus verschiedenen Event-Typen extrahieren
  const obj = event.data.object;
  const customerEmail =
    obj.customer_details?.email ||
    obj.receipt_email ||
    obj.billing_details?.email ||
    obj.metadata?.email ||
    null;

  console.log('Kunde E-Mail:', customerEmail);

  if (!customerEmail || !resendKey) {
    console.log('Keine E-Mail oder kein Resend Key — überspringe');
    return res.status(200).json({ received: true });
  }

  // E-Mail via Resend
  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NebenkostenRadar <noreply@nebenkostenradar.com>',
        to: customerEmail,
        subject: 'Ihr NebenkostenRadar Prüfbericht — Zugang sichern',
        html: buildEmail(),
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error('Resend Fehler:', JSON.stringify(emailData));
    } else {
      console.log('E-Mail gesendet:', emailData.id);
    }
  } catch (err) {
    console.error('E-Mail Fehler:', err.message);
  }

  return res.status(200).json({ received: true });
}

function buildEmail() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#ffffff;border-radius:12px 12px 0 0;padding:24px 32px;border-bottom:2px solid #dde1e7;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background:#2d7a4f;border-radius:8px;width:38px;height:38px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-size:18px;">&#9679;</span>
                </td>
                <td style="padding-left:10px;">
                  <div style="font-size:17px;font-weight:800;color:#1a1a1a;">Nebenkosten<span style="color:#2d7a4f;">Radar</span></div>
                  <div style="font-size:10px;color:#2d7a4f;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">nebenkostenradar.com</div>
                </td>
              </tr></table>
            </td>
            <td align="right" style="font-size:11px;color:#8a9199;">Unabhängige Abrechnungsprüfung</td>
          </tr></table>
        </td></tr>

        <!-- Inhalt -->
        <tr><td style="background:#ffffff;padding:28px 32px;">
          <div style="background:#eaf4ee;border-left:4px solid #2d7a4f;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
            <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">&#10003; Zahlung erfolgreich — Vollbericht freigeschaltet</div>
            <div style="font-size:12px;color:#555e68;">Ihre Premiumanalyse steht bereit.</div>
          </div>

          <p style="font-size:14px;color:#1a1a1a;margin:0 0 14px;line-height:1.65;">
            vielen Dank für Ihre Bestellung bei NebenkostenRadar.
          </p>
          <p style="font-size:14px;color:#555e68;margin:0 0 20px;line-height:1.7;">
            <strong style="color:#1a1a1a;">Wichtig:</strong> Kehren Sie jetzt zur Prüfung zurück um Ihren vollständigen Bericht und den Widerspruchsbrief abzurufen. Falls Sie den Tab bereits geschlossen haben, starten Sie einfach eine neue Prüfung auf nebenkostenradar.com — Ihre Zahlung ist gespeichert.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="https://nebenkostenradar.com" style="display:inline-block;background:#2d7a4f;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:700;">
                Zur Prüfung zurückkehren &#8594;
              </a>
            </td></tr>
          </table>

          <div style="border:1px solid #dde1e7;border-radius:8px;padding:18px 20px;">
            <div style="font-size:11px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">Ihre Premiumanalyse enthält</div>
            <table cellpadding="0" cellspacing="0" width="100%">
              ${[
                'Alle Posten mit Richtwerten und Abweichungsprozent',
                'Widerspruchsgründe mit Rechtsgrundlagen (§§)',
                'Fristen nach § 556 Abs. 3 BGB',
                'Nächste Schritte konkret formuliert',
                'Versandfertiger Muster-Widerspruchsbrief',
                'Vollständiger Prüfbericht zum Kopieren',
              ].map(item => `<tr><td style="padding:4px 0;font-size:13px;color:#555e68;">
                <span style="color:#2d7a4f;font-weight:bold;margin-right:8px;">&#10003;</span>${item}
              </td></tr>`).join('')}
            </table>
          </div>
        </td></tr>

        <!-- Hinweis -->
        <tr><td style="background:#fef3e2;padding:14px 32px;border-top:1px solid #dde1e7;">
          <p style="font-size:12px;color:#b45309;margin:0;line-height:1.6;">
            Dieser Bericht ersetzt keine Rechtsberatung. Deutscher Mieterbund:
            <a href="https://www.mieterbund.de" style="color:#b45309;">mieterbund.de</a> &middot; Tel. 030 223230
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8f9fa;border-radius:0 0 12px 12px;padding:18px 32px;border-top:1px solid #dde1e7;">
          <p style="font-size:11px;color:#8a9199;margin:0;line-height:1.8;text-align:center;">
            NebenkostenRadar &middot; Stefan Hennig &middot; Ludwigstr. 33-37, 60327 Frankfurt am Main<br>
            <a href="https://nebenkostenradar.com" style="color:#8a9199;">Impressum</a> &middot;
            <a href="https://nebenkostenradar.com" style="color:#8a9199;">Datenschutz</a> &middot;
            support@nebenkostenradar.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
