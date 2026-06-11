# NebenkostenRadar

Prüfung von Nebenkostenabrechnungen — kostenlos, automatisch, rechtssicher.

## Quick Start

```bash
npm install
npm run dev
```

## Konfiguration

1. `.env.local` erstellen:
```
ANTHROPIC_API_KEY=sk-ant-...
```

2. In `src/App.jsx` Zeile 8:
```js
STRIPE_PAYMENT_LINK: 'https://buy.stripe.com/DEIN_LINK',
```

## Deployment (Vercel)

```bash
npm run build
# → Vercel verbindet automatisch mit GitHub
```

Umgebungsvariable in Vercel Dashboard setzen:
`ANTHROPIC_API_KEY` = dein Anthropic Key

## Projektstruktur

```
nebenkostenradar/
├── api/
│   └── messages.js      ← Backend (Anthropic API Proxy)
├── src/
│   ├── App.jsx          ← Gesamte App (hier alles drin)
│   └── main.jsx         ← React Entry Point
├── public/
│   └── favicon.svg
├── index.html
├── vercel.json          ← Vercel Konfiguration
├── vite.config.js       ← Build Konfiguration
└── package.json
```
