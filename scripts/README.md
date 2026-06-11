# NebenkostenRadar Scripts

## rechtsmonitor.mjs — Automatischer SEO-Artikel Generator

### Einmalig einrichten
```bash
npm install node-fetch
```

Unsplash API Key holen (kostenlos):
1. unsplash.com/developers → App registrieren
2. Access Key kopieren

### Manuell ausführen (empfohlen: 1x/Monat)
```bash
export ANTHROPIC_API_KEY=sk-ant-...
export UNSPLASH_ACCESS_KEY=...
node scripts/rechtsmonitor.mjs
```

### Mit Claude Code (einfachste Methode)
```
claude "Führe den Rechtsmonitor aus und erstelle Artikel über 
        aktuelle BGH-Urteile zum Mietrecht"
```

Claude Code führt das Script aus, prüft das Ergebnis und 
committed die Änderungen automatisch zu GitHub.

### Einzelnen Artikel erstellen
```bash
node scripts/rechtsmonitor.mjs "Dein Thema hier"
```

### GitHub Actions (vollautomatisch, 1x/Monat)
Erstelle .github/workflows/rechtsmonitor.yml:
```yaml
name: Monatlicher Rechtsmonitor
on:
  schedule:
    - cron: '0 9 1 * *'  # 1. jeden Monats, 9 Uhr
  workflow_dispatch:      # Auch manuell auslösbar
jobs:
  artikel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install node-fetch
      - run: node scripts/rechtsmonitor.mjs
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          UNSPLASH_ACCESS_KEY: ${{ secrets.UNSPLASH_ACCESS_KEY }}
      - uses: actions/create-pull-request@v5
        with:
          commit-message: "Neue Ratgeber-Artikel"
          title: "Monatliche Artikel-Aktualisierung"
```

### Rechtliche Sicherheit
- Quellen: Nur öffentliche Behörden (BGH, BfDI, Mieterbund)
- Texte: KI schreibt eigene Formulierungen — kein Copy-Paste
- Bilder: Unsplash (kostenlos, kommerzielle Nutzung erlaubt)
- UTM-Parameter in Bild-URLs (Pflicht laut Unsplash-Lizenz)
