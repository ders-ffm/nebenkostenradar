// Stripe Webhook → E-Mail via Resend
// Vercel Environment Variables nötig:
//   STRIPE_WEBHOOK_SECRET  (aus Stripe Dashboard → Webhooks)
//   RESEND_API_KEY         (aus resend.com → API Keys)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;

  let event;
  try {
    // Stripe Signatur prüfen
    const { createHmac } = await import('crypto');
    const body = JSON.stringify(req.body);
    const timestamp = sig.split(',')[0].split('=')[1];
    const payload = `${timestamp}.${body}`;
    const expected = createHmac('sha256', webhookSecret)
      .update(payload).digest('hex');
    const received = sig.split('v1=')[1]?.split(',')[0];
    if (expected !== received) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    event = req.body;
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // Nur erfolgreiche Zahlungen verarbeiten
  if (event.type !== 'checkout.session.completed' &&
      event.type !== 'payment_intent.succeeded') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const customerEmail = session.customer_details?.email ||
                        session.receipt_email ||
                        session.metadata?.email;

  if (!customerEmail) {
    console.log('Keine E-Mail-Adresse in Webhook gefunden');
    return res.status(200).json({ received: true });
  }

  // E-Mail via Resend senden
  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NebenkostenRadar <noreply@nebenkostenradar.com>',
        to: customerEmail,
        subject: 'Ihr NebenkostenRadar Prüfbericht',
        html: buildEmail(),
      }),
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      console.error('Resend Fehler:', err);
    }
  } catch (err) {
    console.error('E-Mail Fehler:', err);
  }

  return res.status(200).json({ received: true });
}

function buildEmail() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ihr NebenkostenRadar Prüfbericht</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#ffffff;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #dde1e7;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#2d7a4f;border-radius:8px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                      <span style="color:#ffffff;font-size:20px;font-weight:bold;">⬤</span>
                    </td>
                    <td style="padding-left:12px;">
                      <div style="font-size:18px;font-weight:800;color:#1a1a1a;letter-spacing:-0.02em;">
                        Nebenkosten<span style="color:#2d7a4f;">Radar</span>
                      </div>
                      <div style="font-size:10px;color:#2d7a4f;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
                        nebenkostenradar.com
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" style="font-size:12px;color:#8a9199;">
                Unabhängige Abrechnungsprüfung
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Bestätigung -->
        <tr><td style="background:#ffffff;padding:32px 32px 24px;">
          <div style="background:#eaf4ee;border-left:4px solid #2d7a4f;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">✓ Zahlung erfolgreich</div>
            <div style="font-size:13px;color:#555e68;">Ihre Premiumanalyse wurde freigeschaltet.</div>
          </div>

          <p style="font-size:15px;color:#1a1a1a;margin:0 0 16px;line-height:1.6;">
            vielen Dank für Ihre Bestellung. Ihr vollständiger Prüfbericht steht bereit.
          </p>

          <p style="font-size:14px;color:#555e68;margin:0 0 24px;line-height:1.7;">
            <strong style="color:#1a1a1a;">So greifen Sie auf Ihren Bericht zu:</strong><br>
            Gehen Sie zurück zur Seite wo Sie die Analyse durchgeführt haben. Falls Sie den Tab geschlossen haben, starten Sie eine neue Prüfung — Ihre Zahlung ist gespeichert und der Vollbericht wird beim nächsten Kauf automatisch berücksichtigt.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="https://nebenkostenradar.com" style="display:inline-block;background:#2d7a4f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.01em;">
                Zur Prüfung zurückkehren →
              </a>
            </td></tr>
          </table>

          <!-- Was enthalten ist -->
          <div style="border:1px solid #dde1e7;border-radius:8px;padding:20px;margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;">
              Ihre Premiumanalyse enthält
            </div>
            ${[
              'Alle Posten mit Richtwerten und Abweichungsprozent',
              'Vollständige Widerspruchsgründe mit Rechtsgrundlagen (§§)',
              'Fristen nach § 556 Abs. 3 BGB',
              'Nächste Schritte konkret formuliert',
              'Versandfertiger Muster-Widerspruchsbrief',
              'Vollständiger Prüfbericht zum Kopieren',
            ].map(item => `
            <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;width:100%;">
              <tr>
                <td width="20" style="vertical-align:top;padding-top:1px;">
                  <span style="color:#2d7a4f;font-weight:bold;font-size:13px;">✓</span>
                </td>
                <td style="font-size:13px;color:#555e68;line-height:1.5;">${item}</td>
              </tr>
            </table>`).join('')}
          </div>
        </td></tr>

        <!-- Hinweis -->
        <tr><td style="background:#fef3e2;padding:16px 32px;border-top:1px solid #dde1e7;">
          <p style="font-size:12px;color:#b45309;margin:0;line-height:1.6;">
            <strong>Wichtig:</strong> Dieser Prüfbericht ersetzt keine Rechtsberatung.
            Bei komplexen Fällen empfehlen wir den Deutschen Mieterbund:
            <a href="https://www.mieterbund.de" style="color:#b45309;">mieterbund.de</a> · Tel. 030 223230
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8f9fa;border-radius:0 0 12px 12px;padding:20px 32px;border-top:1px solid #dde1e7;">
          <p style="font-size:11px;color:#8a9199;margin:0;line-height:1.8;text-align:center;">
            NebenkostenRadar · Inhaber: Stefan Hennig · Ludwigstr. 33-37, 60327 Frankfurt am Main<br>
            <a href="https://nebenkostenradar.com/impressum" style="color:#8a9199;">Impressum</a> ·
            <a href="https://nebenkostenradar.com/datenschutz" style="color:#8a9199;">Datenschutz</a> ·
            support@nebenkostenradar.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
