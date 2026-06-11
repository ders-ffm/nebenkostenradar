// NebenkostenRadar · Admin Authentication
// Prüft das Admin-Passwort gegen die Umgebungsvariable ADMIN_PASSWORD
// In Vercel setzen: Settings → Environment Variables → ADMIN_PASSWORD

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    // Kein Passwort gesetzt — Demo-Modus
    console.warn('ADMIN_PASSWORD nicht gesetzt — Demo-Modus aktiv');
    if (password === 'admin') return res.status(200).json({ ok: true });
    return res.status(401).json({ error: 'Falsches Passwort' });
  }

  if (password === adminPassword) {
    return res.status(200).json({ ok: true });
  }

  // Kurze Verzögerung gegen Brute-Force
  setTimeout(() => {
    res.status(401).json({ error: 'Falsches Passwort' });
  }, 500);
}
