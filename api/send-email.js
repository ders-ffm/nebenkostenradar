// NebenkostenRadar — E-Mail nach Zahlung senden
// Direktaufruf aus der App (kein Stripe Webhook nötig)
// Vercel Environment Variable: RESEND_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://nebenkostenradar.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, briefText, berichtText } = req.body || {};
  const resendKey = process.env.RESEND_API_KEY;

  if (!email || !resendKey) {
    return res.status(400).json({ error: 'E-Mail oder API Key fehlt' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Ungueltige E-Mail-Adresse' });
  }

  const brief = briefText
    ? `<div style="margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Ihr Widerspruchsbrief</div>
        <div style="background:#fafafa;border:1px solid #dde1e7;border-radius:8px;padding:20px;font-family:'Courier New',monospace;font-size:12px;color:#1a1a1a;line-height:1.8;white-space:pre-wrap;">${briefText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
       </div>` : '';

  const bericht = berichtText
    ? `<div style="margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Ihr Pruefbericht</div>
        <div style="background:#fafafa;border:1px solid #dde1e7;border-radius:8px;padding:20px;font-family:'Courier New',monospace;font-size:11px;color:#1a1a1a;line-height:1.8;white-space:pre-wrap;">${berichtText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
       </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#ffffff;border-radius:12px 12px 0 0;padding:24px 32px;border-bottom:2px solid #dde1e7;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><table cellpadding="0" cellspacing="0"><tr>
        <td style="background:#2d7a4f;border-radius:8px;width:38px;height:38px;text-align:center;vertical-align:middle;">
          <span style="color:#fff;font-size:20px;font-weight:bold;">&#9679;</span>
        </td>
        <td style="padding-left:10px;">
          <div style="font-size:17px;font-weight:800;color:#1a1a1a;">Nebenkosten<span style="color:#2d7a4f;">Radar</span></div>
          <div style="font-size:10px;color:#2d7a4f;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">nebenkostenradar.com</div>
        </td>
      </tr></table></td>
      <td align="right" style="font-size:11px;color:#8a9199;">Unabhaengige Abrechnungspruefung</td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#ffffff;padding:28px 32px;">
    <div style="background:#eaf4ee;border-left:4px solid #2d7a4f;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">&#10003; Ihr Pruefbericht und Widerspruchsbrief</div>
      <div style="font-size:12px;color:#555e68;">Anbei Ihre vollstaendige Analyse von NebenkostenRadar.</div>
    </div>
    ${brief}
    ${bericht}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
      <tr><td align="center">
        <a href="https://nebenkostenradar.com" style="display:inline-block;background:#2d7a4f;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:700;">
          Neue Pruefung starten &#8594;
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#fef3e2;padding:14px 32px;border-top:1px solid #dde1e7;">
    <p style="font-size:12px;color:#b45309;margin:0;line-height:1.6;">
      Kein Ersatz fuer Rechtsberatung. Deutscher Mieterbund:
      <a href="https://www.mieterbund.de" style="color:#b45309;">mieterbund.de</a> &middot; Tel. 030 223230
    </p>
  </td></tr>
  <tr><td style="background:#f8f9fa;border-radius:0 0 12px 12px;padding:18px 32px;border-top:1px solid #dde1e7;">
    <p style="font-size:11px;color:#8a9199;margin:0;line-height:1.8;text-align:center;">
      NebenkostenRadar &middot; Stefan Hennig &middot; Ludwigstr. 33-37, 60327 Frankfurt am Main<br>
      support@nebenkostenradar.com
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NebenkostenRadar <noreply@nebenkostenradar.com>',
        to: email,
        subject: 'Ihr NebenkostenRadar Pruefbericht',
        html,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Resend Fehler:', JSON.stringify(data));
      return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Fehler:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
