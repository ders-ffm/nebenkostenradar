// ─────────────────────────────────────────────────────────────────────────────
// NebenkostenRadar · Backend API
// Vercel Serverless Function — /api/messages
//
// Diese Datei leitet Anfragen der App sicher an die Anthropic API weiter.
// Der API Key liegt NUR hier auf dem Server — niemals im Browser-Code.
//
// Deployment: Diese Datei liegt im Ordner /api/ deines Projekts.
// Vercel erkennt sie automatisch und stellt sie unter /api/messages bereit.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {

  // ── CORS Headers ─────────────────────────────────────────────────────────
  // Erlaubt Anfragen von deiner Domain — WICHTIG: eigene Domain eintragen!
  const allowedOrigins = [
    'https://nebenkostenradar.com',
    'https://www.nebenkostenradar.com',
    'http://localhost:5173',   // lokale Entwicklung
    'http://localhost:4173',   // lokaler Preview
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight-Anfragen beantworten
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Nur POST erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── API Key prüfen ────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY nicht gesetzt!');
    return res.status(500).json({ error: 'API Key nicht konfiguriert' });
  }

  // ── Request-Größe begrenzen (Schutz vor Missbrauch) ──────────────────────
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > 5 * 1024 * 1024) { // Max 5 MB
    return res.status(413).json({ error: 'Anfrage zu groß' });
  }

  // ── Anfrage an Anthropic weiterleiten ─────────────────────────────────────
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05', // Websuche für aktuelle Richtwerte
      },
      body: bodyStr,
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic Fehler:', anthropicRes.status, errText);
      return res.status(anthropicRes.status).json({
        error: 'Analyse-Service nicht verfügbar',
        details: anthropicRes.status
      });
    }

    const data = await anthropicRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Netzwerkfehler:', err.message);
    return res.status(500).json({ error: 'Verbindungsfehler zum Analyse-Service' });
  }
}
