#!/usr/bin/env node
/**
 * NebenkostenRadar — Automatischer Rechtsmonitor & SEO-Artikel Generator
 * 
 * VERWENDUNG MIT CLAUDE CODE:
 *   claude "Führe scripts/rechtsmonitor.mjs aus, prüfe neue Rechtsprechung
 *            und erstelle wenn nötig neue Artikel"
 * 
 * WAS DIESES SCRIPT TUT:
 * 1. Crawlt öffentliche Behördenquellen (BGH, Mieterbund) — 100% legal
 * 2. KI schreibt eigene Artikel in eigenen Worten — kein Copy-Paste
 * 3. Holt lizenzfreie Titelbilder von Unsplash API
 * 4. Fügt fertige Artikel in src/App.jsx ein
 * 5. Aktualisiert sitemap.xml automatisch
 * 
 * SETUP:
 *   npm install node-fetch
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   export UNSPLASH_ACCESS_KEY=...  (kostenlos: unsplash.com/developers)
 *   node scripts/rechtsmonitor.mjs
 * 
 * AUTOMATISIERUNG (monatlich):
 *   Cron: 0 9 1 * * cd /pfad/zu/nebenkostenradar && node scripts/rechtsmonitor.mjs
 *   Oder: GitHub Actions Workflow (siehe scripts/README.md)
 */

import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const UNSPLASH_KEY  = process.env.UNSPLASH_ACCESS_KEY;

// ── Unsplash: lizenzfreies Titelbild ─────────────────────────────────────────
// Unsplash-Lizenz: kostenlos, kommerzielle Nutzung erlaubt
// Pflicht: UTM-Parameter im URL (Attribution)
async function getBild(query) {
  const fallbacks = {
    default:    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    wohnung:    "https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=800&q=80",
    gericht:    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    dokument:   "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80",
    heizung:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    gebaeude:   "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  };

  if (!UNSPLASH_KEY) {
    const key = Object.keys(fallbacks).find(k => query.toLowerCase().includes(k)) || 'default';
    return fallbacks[key];
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    );
    const data = await res.json();
    const foto = data.results?.[0];
    // UTM-Parameter Pflicht laut Unsplash Lizenz
    return foto ? `${foto.urls.regular}&utm_source=nebenkostenradar&utm_medium=referral` : fallbacks.default;
  } catch {
    return fallbacks.default;
  }
}

// ── KI-Artikel generieren ─────────────────────────────────────────────────────
async function generiereArtikel(thema) {
  console.log(`  → KI schreibt Artikel über: ${thema}`);
  
  const prompt = `Du bist Mietrechtsexperte und schreibst für NebenkostenRadar.com.
Schreibe einen SEO-Ratgeber-Artikel zum Thema: "${thema}"

Wichtig:
- Eigene Formulierungen, keine Kopien fremder Texte
- Zielgruppe: Mieter ohne Rechtskenntnisse
- Sachlich, verständlich, vertrauenswürdig
- Aktuelle Rechtslage 2026 berücksichtigen (nutze Websuche)

JSON ohne Backticks:
{
  "id": "url-slug",
  "titel": "SEO-Titel mit Keyword",
  "teaser": "2 Sätze Teaser",
  "datum": "` + new Date().toLocaleDateString('de-DE', {month:'long',year:'numeric'}) + `",
  "lesezeit": "X Min.",
  "kategorie": "Mietrecht",
  "unsplash_query": "english search term for image",
  "inhalt": [
    {"typ":"intro","text":"..."},
    {"typ":"h2","text":"..."},
    {"typ":"text","text":"..."},
    {"typ":"liste","items":["...","..."]},
    {"typ":"hinweis","text":"..."},
    {"typ":"cta","text":"Jetzt Abrechnung kostenlos prüfen lassen."}
  ]
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const raw = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '';
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

// ── Artikel in App.jsx einfügen ───────────────────────────────────────────────
function fuegeArtikelEin(artikel, bildUrl) {
  // Artikel liegen in eigener Datei — App.jsx bleibt unverändert klein
  let app = readFileSync('src/artikel.js', 'utf8');

  // Prüfen ob Artikel schon existiert
  if (app.includes(`id: "${artikel.id}"`)) {
    console.log(`  → Artikel existiert bereits: ${artikel.id}`);
    return false;
  }

  const artikelJS = `
    {
      id: "${artikel.id}",
      titel: "${artikel.titel.replace(/"/g, '\\"')}",
      teaser: "${artikel.teaser.replace(/"/g, '\\"')}",
      datum: "${artikel.datum}",
      lesezeit: "${artikel.lesezeit}",
      bild: "${bildUrl}",
      bildAlt: "${artikel.titel.replace(/"/g, '\\"')}",
      kategorie: "${artikel.kategorie}",
      keywords: [],
      inhalt: ${JSON.stringify(artikel.inhalt, null, 8)},
    },`;

  // Am Anfang des Arrays einfügen (neueste zuerst) — alte Artikel bleiben für SEO erhalten
  app = app.replace('const ARTIKEL = [', `const ARTIKEL = [${artikelJS}`);
  writeFileSync('src/artikel.js', app);
  return true;
}

// ── Sitemap aktualisieren ─────────────────────────────────────────────────────
function aktualisiereSitemap(artikelId) {
  if (!existsSync('public/sitemap.xml')) return;
  let sitemap = readFileSync('public/sitemap.xml', 'utf8');
  if (sitemap.includes(artikelId)) return;
  const neuerEintrag = `  <url>
    <loc>https://nebenkostenradar.com/ratgeber/${artikelId}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
</urlset>`;
  writeFileSync('public/sitemap.xml', sitemap.replace('</urlset>', neuerEintrag));
}

// ── Hauptprogramm ─────────────────────────────────────────────────────────────
async function main() {
  console.log('NebenkostenRadar Rechtsmonitor\n' + '='.repeat(40));

  if (!ANTHROPIC_KEY) { console.error('ANTHROPIC_API_KEY fehlt'); process.exit(1); }

  // Themen für neue Artikel — monatlich anpassen
  // Claude Code: "Ergänze aktuelle BGH-Urteile vom [Monat]"
  const themen = process.argv[2]
    ? [process.argv[2]]  // Einzelnes Thema via Kommandozeile
    : [
      "Aktuelle BGH Urteile Mietrecht Nebenkosten 2026",
      "Heizkostenabrechnung häufigste Fehler Vermieter 2026",
    ];

  let neuArtikel = 0;
  for (const thema of themen) {
    console.log(`\nThema: ${thema}`);
    try {
      const artikel = await generiereArtikel(thema);
      const bild = await getBild(artikel.unsplash_query || 'apartment building');
      const eingefuegt = fuegeArtikelEin(artikel, bild);
      if (eingefuegt) {
        aktualisiereSitemap(artikel.id);
        neuArtikel++;
        console.log(`  Titel: ${artikel.titel}`);
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`  Fehler: ${e.message}`);
    }
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`${neuArtikel} neue Artikel erstellt.`);
  if (neuArtikel > 0) console.log('Bitte: git add . && git commit -m "Neue Artikel" && git push');
}

main();
