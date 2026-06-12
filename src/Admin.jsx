import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// NebenkostenRadar · Admin Panel
// Erreichbar unter: nebenkostenradar.com/admin
// Passwort: wird in Vercel als ADMIN_PASSWORD Umgebungsvariable gesetzt
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg: "#0f0f0f", surface: "#1a1a1a", surfaceHigh: "#222",
  border: "#2e2e2e", gold: "#c9a84c", goldDim: "#8a6f2e", goldBg: "#1c1800",
  text: "#f0ece4", muted: "#888", dim: "#555",
  green: "#4caf7d", greenBg: "#071510",
  red: "#e05252", redBg: "#180808",
  blue: "#5ba4e0", blueBg: "#0a1520",
};

const DEFAULT_CONFIG = {
  preis: 7.99,
  stripeLink: "",
  texte: {
    headline: "Nebenkostenabrechnung prüfen lassen",
    subheadline: "Deine Abrechnung. Geprüft. Geschützt.",
    cta: "Kostenlos prüfen →",
    paywall_titel: "Vollständigen Bericht freischalten",
    paywall_sub: "Alle Posten mit Richtwerten · Widerspruchsgründe · Fristen · Nächste Schritte · Versandfertiger Brief · Bericht-Download",
  },
  richtwerte: {
    gesamt: 2.67,
    heizung_warmwasser: 1.32,
    heizung_max: 2.18,
    wasser_abwasser: 0.26,
    grundsteuer: 0.21,
    muell: 0.20,
    hausmeister: 0.30,
    hausmeister_max: 0.45,
    versicherungen: 0.28,
    allgemeinstrom: 0.08,
    gartenpflege: 0.11,
    strassenreinigung: 0.05,
    aufzug: 0.18,
    schornstein: 0.04,
  },
  stats: {
    analysen_gesamt: 0,
    kaeufe_gesamt: 0,
    umsatz_gesamt: 0,
    letzte_analyse: null,
    letzter_kauf: null,
  },
  wartungsmodus: false,
  wartungstext: "NebenkostenRadar wird gerade aktualisiert. Bitte in Kürze erneut versuchen.",
};

// Storage Key für Vercel KV oder localStorage (Demo)
const STORAGE_KEY = "nebenkostenradar_config";

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(cfg) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); return true; }
  catch { return false; }
}

// ── Komponenten ───────────────────────────────────────────────────────────────
function Card({ title, icon, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      {type === "textarea" ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          rows={3}
          style={{ width: "100%", boxSizing: "border-box", background: C.surfaceHigh, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: C.text, outline: "none", resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", boxSizing: "border-box", background: C.surfaceHigh, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", color: C.text, outline: "none" }} />
      )}
      {hint && <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function StatBox({ label, value, sub, color = C.gold }) {
  return (
    <div style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px", flex: 1 }}>
      <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim }}>{sub}</div>}
    </div>
  );
}

function SaveBtn({ onClick, saved }) {
  return (
    <button onClick={onClick} style={{
      background: saved ? C.green : `linear-gradient(135deg,${C.gold},${C.goldDim})`,
      color: saved ? "#fff" : "#0f0f0f", border: "none", borderRadius: 8,
      padding: "10px 24px", fontSize: 13, fontFamily: "inherit", fontWeight: 700,
      cursor: "pointer", transition: "all 0.2s",
    }}>
      {saved ? "✓ Gespeichert" : "Speichern"}
    </button>
  );
}

// ── Haupt-Admin-App ───────────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_auth") === "true");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [config, setConfig] = useState(loadConfig);
  const [activeTab, setActiveTab] = useState("stats");
  const [saved, setSaved] = useState({});

  // Das Passwort wird gegen eine Umgebungsvariable geprüft.
  // In der Demo (lokale Entwicklung ohne Backend) funktioniert: "admin"
  // In Produktion: ADMIN_PASSWORD in Vercel setzen, dann /api/admin-auth nutzen
  async function checkPassword() {
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_auth", "true");
        setAuthed(true);
      } else {
        setPwError(true);
        setTimeout(() => setPwError(false), 2000);
      }
    } catch {
      // Demo-Modus: Passwort "admin" funktioniert lokal
      if (pw === "admin") {
        sessionStorage.setItem("admin_auth", "true");
        setAuthed(true);
      } else {
        setPwError(true);
        setTimeout(() => setPwError(false), 2000);
      }
    }
  }

  function updateConfig(path, value) {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function save(section) {
    if (saveConfig(config)) {
      setSaved(s => ({ ...s, [section]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [section]: false })), 2000);
    }
  }

  function logout() {
    sessionStorage.removeItem("admin_auth");
    setAuthed(false);
  }

  const root = { fontFamily: "'Georgia','Times New Roman',serif", background: C.bg, color: C.text, minHeight: "100vh" };

  // ── Login Screen ────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ ...root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Nebenkosten<span style={{ color: C.gold }}>Radar</span></div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Admin-Bereich</div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${pwError ? C.red : C.border}`, borderRadius: 12, padding: "24px" }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Passwort</div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && checkPassword()}
            placeholder="Admin-Passwort eingeben"
            autoFocus
            style={{ width: "100%", boxSizing: "border-box", background: C.surfaceHigh, border: `1.5px solid ${pwError ? C.red : C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 15, fontFamily: "inherit", color: C.text, outline: "none", marginBottom: 14 }} />
          {pwError && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>⚠ Falsches Passwort</div>}
          <button onClick={checkPassword} style={{ width: "100%", background: `linear-gradient(135deg,${C.gold},${C.goldDim})`, color: "#0f0f0f", border: "none", borderRadius: 8, padding: "13px", fontSize: 14, fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
            Anmelden →
          </button>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.dim, marginTop: 16 }}>
          Lokal (Demo): Passwort ist "admin"
        </div>
      </div>
    </div>
  );

  const TABS = [
    { id: "stats",      label: "Statistiken",  icon: "📊" },
    { id: "texte",      label: "Texte",        icon: "✏️" },
    { id: "preise",     label: "Preise",       icon: "💶" },
    { id: "richtwerte", label: "Richtwerte",   icon: "⚖️" },
    { id: "wartung",    label: "Wartung",      icon: "🔧" },
  ];

  return (
    <div style={root}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Nebenkosten<span style={{ color: C.gold }}>Radar</span></div>
            <div style={{ fontSize: 10, color: C.dim }}>Admin-Panel</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/" target="_blank" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>↗ Website</a>
          <button onClick={logout} style={{ background: C.surfaceHigh, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>Abmelden</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 20px", display: "flex", gap: 4, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ background: "none", border: "none", borderBottom: `2px solid ${activeTab === t.id ? C.gold : "transparent"}`, color: activeTab === t.id ? C.gold : C.muted, padding: "12px 14px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 20px 60px" }}>

        {/* ── STATISTIKEN ─────────────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <StatBox label="Analysen gesamt" value={config.stats.analysen_gesamt.toLocaleString("de")} sub="seit Start" />
              <StatBox label="Käufe gesamt" value={config.stats.kaeufe_gesamt.toLocaleString("de")} sub="Vollberichte" color={C.green} />
              <StatBox label="Umsatz gesamt" value={`€${config.stats.umsatz_gesamt.toFixed(2)}`} sub="brutto" color={C.blue} />
            </div>

            <Card title="Conversion Rate" icon="📈">
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ flex: 1, height: 8, background: C.surfaceHigh, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: config.stats.analysen_gesamt > 0 ? `${Math.min((config.stats.kaeufe_gesamt / config.stats.analysen_gesamt) * 100, 100)}%` : "0%", background: `linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                  {config.stats.analysen_gesamt > 0 ? `${((config.stats.kaeufe_gesamt / config.stats.analysen_gesamt) * 100).toFixed(1)}%` : "–"}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Ziel: 10% · Branchenschnitt: 3–8%</div>
            </Card>

            <Card title="Letzte Aktivitäten" icon="🕐">
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 2 }}>
                <div>Letzte Analyse: <span style={{ color: C.text }}>{config.stats.letzte_analyse || "–"}</span></div>
                <div>Letzter Kauf: <span style={{ color: C.text }}>{config.stats.letzter_kauf || "–"}</span></div>
              </div>
            </Card>

            <Card title="Statistiken manuell anpassen" icon="✏️">
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Field label="Analysen gesamt" type="number" value={config.stats.analysen_gesamt}
                    onChange={v => updateConfig("stats.analysen_gesamt", parseInt(v) || 0)} />
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Käufe gesamt" type="number" value={config.stats.kaeufe_gesamt}
                    onChange={v => updateConfig("stats.kaeufe_gesamt", parseInt(v) || 0)} />
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Umsatz (€)" type="number" value={config.stats.umsatz_gesamt}
                    onChange={v => updateConfig("stats.umsatz_gesamt", parseFloat(v) || 0)} />
                </div>
              </div>
              <SaveBtn onClick={() => save("stats")} saved={saved.stats} />
            </Card>
          </>
        )}

        {/* ── TEXTE ───────────────────────────────────────────────────────── */}
        {activeTab === "texte" && (
          <Card title="Texte & Inhalte bearbeiten" icon="✏️">
            <Field label="Haupt-Headline" value={config.texte.headline}
              onChange={v => updateConfig("texte.headline", v)}
              hint="Erscheint groß auf der Startseite" />
            <Field label="Subheadline / Claim" value={config.texte.subheadline}
              onChange={v => updateConfig("texte.subheadline", v)} />
            <Field label="Call-to-Action Button" value={config.texte.cta}
              onChange={v => updateConfig("texte.cta", v)}
              hint="Text auf dem Haupt-Button der Startseite" />
            <Field label="Paywall-Titel" value={config.texte.paywall_titel}
              onChange={v => updateConfig("texte.paywall_titel", v)}
              hint="Überschrift der Freischalt-Box" />
            <Field label="Paywall-Beschreibung" type="textarea" value={config.texte.paywall_sub}
              onChange={v => updateConfig("texte.paywall_sub", v)}
              hint="Was ist im Vollbericht enthalten?" />
            <SaveBtn onClick={() => save("texte")} saved={saved.texte} />
          </Card>
        )}

        {/* ── PREISE ──────────────────────────────────────────────────────── */}
        {activeTab === "preise" && (
          <>
            <Card title="Preis & Stripe" icon="💶">
              <Field label="Preis Vollbericht (€)" type="number" value={config.preis}
                onChange={v => updateConfig("preis", parseFloat(v) || 7.99)}
                hint="Muss mit dem Preis in deinem Stripe Payment Link übereinstimmen!" />
              <Field label="Stripe Payment Link" value={config.stripeLink}
                onChange={v => updateConfig("stripeLink", v)}
                placeholder="https://buy.stripe.com/..."
                hint="Aus dem Stripe Dashboard → Payment Links" />
              <div style={{ background: C.goldBg, border: `1px solid ${C.goldDim}`, borderRadius: 8, padding: "12px 14px", fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
                ⚠️ Wenn du den Preis hier änderst, musst du auch einen neuen Stripe Payment Link mit dem gleichen Preis erstellen und hier eintragen.
              </div>
              <SaveBtn onClick={() => save("preise")} saved={saved.preise} />
            </Card>

            <Card title="Preisrechner" icon="🧮">
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 2 }}>
                <div>Bruttopreis: <span style={{ color: C.text, fontWeight: 700 }}>€{config.preis.toFixed(2)}</span></div>
                <div>Stripe-Gebühr (1,4% + 0,25€): <span style={{ color: C.red }}>−€{(config.preis * 0.014 + 0.25).toFixed(2)}</span></div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                  Netto pro Verkauf: <span style={{ color: C.green, fontWeight: 700 }}>€{(config.preis - config.preis * 0.014 - 0.25).toFixed(2)}</span>
                </div>
                <div>Break-even: <span style={{ color: C.text }}>3 Verkäufe (Domainkosten)</span></div>
              </div>
            </Card>
          </>
        )}

        {/* ── RICHTWERTE ──────────────────────────────────────────────────── */}
        {activeTab === "richtwerte" && (
          <>
            <div style={{ background: C.blueBg, border: `1px solid ${C.blue}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: C.blue, lineHeight: 1.7 }}>
              📊 DMB-Betriebskostenspiegel wird jährlich im Herbst veröffentlicht (mieterbund.de).<br/>
              Alle Werte in <strong>€/m²/Monat</strong>. Letzte Aktualisierung: DMB Betriebskostenspiegel 2024.
            </div>
            <Card title="Richtwerte aktualisieren" icon="⚖️">
              {[
                { key: "gesamt",             label: "Gesamtdurchschnitt" },
                { key: "heizung_warmwasser", label: "Heizung + Warmwasser (Durchschnitt)" },
                { key: "heizung_max",        label: "Heizung + Warmwasser (Maximum)" },
                { key: "wasser_abwasser",    label: "Wasser + Abwasser" },
                { key: "grundsteuer",        label: "Grundsteuer" },
                { key: "muell",              label: "Müllbeseitigung" },
                { key: "hausmeister",        label: "Hausmeister (Durchschnitt)" },
                { key: "hausmeister_max",    label: "Hausmeister (Maximum)" },
                { key: "versicherungen",     label: "Versicherungen gesamt" },
                { key: "allgemeinstrom",     label: "Allgemeinstrom / Beleuchtung" },
                { key: "gartenpflege",       label: "Gartenpflege" },
                { key: "strassenreinigung",  label: "Straßenreinigung + Winterdienst" },
                { key: "aufzug",             label: "Aufzug" },
                { key: "schornstein",        label: "Schornsteinreinigung" },
              ].map(r => (
                <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <label style={{ fontSize: 13, color: C.text, flex: 1 }}>{r.label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <input type="number" step="0.01" min="0"
                      value={config.richtwerte[r.key]}
                      onChange={e => updateConfig(`richtwerte.${r.key}`, parseFloat(e.target.value) || 0)}
                      style={{ width: 80, background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 13, fontFamily: "inherit", color: C.text, textAlign: "right", outline: "none" }} />
                    <span style={{ fontSize: 11, color: C.dim, width: 60 }}>€/m²/Mon</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <SaveBtn onClick={() => save("richtwerte")} saved={saved.richtwerte} />
              </div>
            </Card>
          </>
        )}

        {/* ── WARTUNG ─────────────────────────────────────────────────────── */}
        {activeTab === "wartung" && (
          <>
            <Card title="Wartungsmodus" icon="🔧">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Wartungsmodus aktivieren</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Nutzer sehen einen Hinweis statt der App</div>
                </div>
                <button onClick={() => updateConfig("wartungsmodus", !config.wartungsmodus)}
                  style={{ background: config.wartungsmodus ? C.red : C.surfaceHigh, border: `1px solid ${config.wartungsmodus ? C.red : C.border}`, borderRadius: 20, padding: "8px 18px", fontSize: 13, fontFamily: "inherit", color: config.wartungsmodus ? "#fff" : C.muted, cursor: "pointer", fontWeight: 600 }}>
                  {config.wartungsmodus ? "🔴 Aktiv" : "⚪ Inaktiv"}
                </button>
              </div>
              <Field label="Wartungshinweis für Nutzer" type="textarea"
                value={config.wartungstext}
                onChange={v => updateConfig("wartungstext", v)} />
              <SaveBtn onClick={() => save("wartung")} saved={saved.wartung} />
            </Card>

            <Card title="System-Informationen" icon="ℹ️">
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 2 }}>
                <div>Version: <span style={{ color: C.text }}>1.0.0</span></div>
                <div>Framework: <span style={{ color: C.text }}>React + Vite</span></div>
                <div>Hosting: <span style={{ color: C.text }}>Vercel</span></div>
                <div>Config gespeichert: <span style={{ color: C.text }}>localStorage (Demo) / Vercel KV (Produktion)</span></div>
                <div>Admin-URL: <span style={{ color: C.gold }}>nebenkostenradar.com/admin</span></div>
              </div>
            </Card>

            <Card title="Gefährliche Aktionen" icon="⚠️">
              <button onClick={() => {
                if (window.confirm("Wirklich alle Statistiken zurücksetzen?")) {
                  updateConfig("stats", DEFAULT_CONFIG.stats);
                  save("stats");
                }
              }} style={{ background: C.redBg, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", marginRight: 10 }}>
                Statistiken zurücksetzen
              </button>
              <button onClick={() => {
                if (window.confirm("Wirklich alle Einstellungen auf Standard zurücksetzen?")) {
                  setConfig(DEFAULT_CONFIG);
                  saveConfig(DEFAULT_CONFIG);
                }
              }} style={{ background: C.redBg, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 8, padding: "10px 20px", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                Alle Einstellungen zurücksetzen
              </button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
