import { useState, useCallback } from "react";
import { ARTIKEL } from "./artikel.js";

const CONFIG = {
  STRIPE_PAYMENT_LINK: "https://buy.stripe.com/4gM28r2qn26hf7a0MzgUM00",
  PREIS: 7.99,
  RICHTWERTE: {
    gesamt: 2.67, heizung_warmwasser: 1.32, heizung_max: 2.18,
    wasser_abwasser: 0.26, grundsteuer: 0.21, muell: 0.20,
    hausmeister: 0.30, hausmeister_max: 0.45, versicherungen: 0.28,
    allgemeinstrom: 0.08, gartenpflege: 0.11, strassenreinigung: 0.05,
    aufzug: 0.18, schornstein: 0.04,
  },
};
const IS_DEMO = CONFIG.STRIPE_PAYMENT_LINK.includes("HIER");

const C = {
  bg: "#ffffff", surface: "#f8f9fa", high: "#f0f2f4", border: "#dde1e7",
  gold: "#2d7a4f", goldD: "#1d5235", goldBg: "#eaf4ee",
  text: "#1a1a1a", muted: "#555e68", dim: "#6b7280",
  green: "#2d7a4f", greenBg: "#eaf4ee",
  red: "#c0392b", redBg: "#fdf0ee",
  amber: "#b45309", amberBg: "#fef3e2",
  blue: "#1d4ed8", blueBg: "#eff6ff",
};

const POSTEN_GRUPPEN = [
  { id: "heizung", label: "Heizung und Warmwasser", icon: "🔥",
    hint: "Größten Posten findest du unter 'Heizkosten' oder 'Wärmeversorgung'",
    posten: [
      { key: "heizkosten_gesamt", label: "Heizkosten", pflicht: true, tip: "Gesamte Heizkosten lt. Abrechnung" },
      { key: "warmwasser_gesamt", label: "Warmwasserversorgung", pflicht: true, tip: "Muss separat ausgewiesen sein" },
      { key: "heizung_betriebsstrom", label: "Betriebsstrom Heizungsanlage", tip: "Strom für Pumpen, Steuerung" },
      { key: "heizung_wartung", label: "Wartung Heizungsanlage", tip: "Wartung ja, Reparaturen nein" },
      { key: "schornsteinreinigung", label: "Schornsteinreinigung", tip: "§ 2 Nr. 12 BetrKV" },
      { key: "co2_abgabe", label: "CO2-Abgabe / Kohlendioxidkosten", tip: "Vermieter trägt je nach Energieklasse 0-95%" },
    ]},
  { id: "wasser", label: "Wasserversorgung und Entwässerung", icon: "💧",
    hint: "Suche nach Wasser, Abwasser oder Entwässerung",
    posten: [
      { key: "kaltwasser", label: "Wasserversorgung (Kaltwasser)", tip: "Frischwasserkosten inkl. Grundgebühr" },
      { key: "entwasserung", label: "Entwässerung / Abwasser", tip: "Kanalgebühren der Gemeinde" },
      { key: "niederschlagswasser", label: "Niederschlagswassergebühr", tip: "Manche Kommunen erheben dies separat" },
      { key: "wasserzaehler", label: "Miete und Wartung Wasserzähler", tip: "Zählermiete und Eichung" },
    ]},
  { id: "grundbesitz", label: "Grundbesitzabgaben", icon: "🏛",
    hint: "Gemeindliche Gebühren — Grundsteuer, Müll und Straßenreinigung",
    posten: [
      { key: "grundsteuer", label: "Grundsteuer", tip: "Prüfe ob Betrag mit Bescheid übereinstimmt" },
      { key: "strassenreinigung", label: "Straßenreinigung und Winterdienst", tip: "§ 2 Nr. 8 BetrKV" },
      { key: "muellbeseitigung", label: "Müllbeseitigung / Abfallentsorgung", tip: "Gebühren für alle Tonnen" },
    ]},
  { id: "gebaeude", label: "Gebäudereinigung und Pflege", icon: "🧹",
    hint: "Nur wenn im Mietvertrag vereinbart",
    posten: [
      { key: "hausreinigung", label: "Hausreinigung / Treppenhausreinigung", tip: "Nur umlagefähig wenn vertraglich vereinbart" },
      { key: "gartenpflege", label: "Gartenpflege", tip: "Nur laufende Pflege, keine Neuanlage" },
      { key: "ungezieferbekaempfung", label: "Ungezieferbekämpfung", tip: "§ 2 Nr. 9 BetrKV" },
    ]},
  { id: "technik", label: "Technische Anlagen", icon: "⚙️",
    hint: "Betrieb und Wartung - keine Reparaturen",
    posten: [
      { key: "aufzug", label: "Aufzug (Betrieb, Wartung, TÜV)", tip: "§ 2 Nr. 7 BetrKV" },
      { key: "allgemeinstrom", label: "Beleuchtung / Allgemeinstrom", tip: "Strom für Gemeinschaftsflächen" },
      { key: "tiefgarage", label: "Tiefgaragenbelüftung / -entwässerung", tip: "§ 2 Nr. 13 BetrKV wenn vorhanden" },
      { key: "gemeinschaftsantenne", label: "Gemeinschafts-Antenne / SAT-Anlage", tip: "Umlagefähig wenn Gemeinschaftsanlage" },
    ]},
  { id: "versicherungen", label: "Versicherungen", icon: "🛡",
    hint: "Nur Sachversicherungen des Gebäudes — nicht deine Hausratsversicherung",
    posten: [
      { key: "gebaeudeversicherung", label: "Gebäudeversicherung", tip: "Feuer, Sturm, Leitungswasser" },
      { key: "haftpflichtversicherung", label: "Haftpflichtversicherung Gebäude", tip: "Haus- und Grundbesitzerhaftpflicht" },
      { key: "glasversicherung", label: "Glasversicherung", tip: "Nur wenn vertraglich vereinbart" },
    ]},
  { id: "sonstiges", label: "Hauswart und Sonstiges", icon: "🏠",
    hint: "Achtung: Verwaltungskosten darf der Vermieter NICHT umlegen",
    posten: [
      { key: "hauswart", label: "Hauswart / Hausmeister", tip: "Nur Betriebskostenanteile — keine Verwaltung/Instandhaltung" },
      { key: "kabelanschluss", label: "Kabelanschluss / TV-Versorgung", tip: "Seit 01.07.2024 NICHT mehr umlagefähig!" },
      { key: "gemeinschaftswaschmaschine", label: "Waschmaschinen / Trockenräume", tip: "§ 2 Nr. 15 BetrKV" },
      { key: "sonstiges_vereinbart", label: "Sonstige vereinbarte Betriebskosten", tip: "Nur wenn explizit im Mietvertrag" },
    ]},
];

const ALLE_POSTEN = POSTEN_GRUPPEN.flatMap(g => g.posten);

const toNum = v => {
  if (v == null || v === "") return 0;
  let s = String(v).trim();
  if (/^\d{1,3}(\.\d{3})+(,\d*)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  const n = parseFloat(s);
  return (!isNaN(n) && n > 0) ? n : 0;
};

const fmt = n => (n != null && !isNaN(n)) ? "€ " + parseFloat(n || 0).toFixed(2) : "€ 0,00";
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

function checkPaidReturn() {
  try { return new URLSearchParams(window.location.search).get("paid") === "true"; } catch { return false; }
}

const BEWERTUNG = {
  ok:         { label: "Unauffällig",  farbe: C.green, bg: C.greenBg, icon: "✅", sub: "Keine wesentlichen Fehler gefunden" },
  auffaellig: { label: "Prüfenswert", farbe: C.amber, bg: C.amberBg, icon: "⚠️", sub: "Auffälligkeiten — Widerspruch empfohlen" },
  kritisch:   { label: "Fehlerhaft",  farbe: C.red,   bg: C.redBg,   icon: "🚨", sub: "Erhebliche Fehler — sofort widersprechen" },
};

function analysierePosten(w, wohn) {
  const R = CONFIG.RICHTWERTE;
  const flaeche = Math.max(toNum(wohn.flaeche), 5);
  const rj = m => m * flaeche * 12;
  const abw = (b, rw) => rw > 0 ? Math.round(((b - rw) / rw) * 100) : 0;
  const widerspruch = [], posten_bewertung = [];

  if (toNum(w.kabelanschluss) > 0) {
    const b = toNum(w.kabelanschluss);
    posten_bewertung.push({ posten: "Kabelanschluss", betrag: b, richtwert: 0, abweichung_prozent: 100, status: "nicht_umlagefaehig", hinweis: "Seit 01.07.2024 nicht mehr umlagefähig. Voller Betrag rückforderbar.", paragraf: "§ 2 Nr. 15b TKG" });
    widerspruch.push("Kabelanschlusskosten " + fmt(b) + ": Nicht umlagefähig seit 01.07.2024 (§ 2 Nr. 15b TKG). Rückforderung des vollen Betrags.");
  }

  const heiz = toNum(w.heizkosten_gesamt), ww = toNum(w.warmwasser_gesamt);
  if (heiz > 0 || ww > 0) {
    const kombi = heiz + ww;
    const rwK = rj(R.heizung_warmwasser), rwMax = rj(R.heizung_max);
    const aK = abw(kombi, rwK);
    let st = "ok", hi = "Richtwert Heizung+WW für " + flaeche + "m²: " + fmt(rwK) + "/Jahr. Verbrauchsanteil muss 50-70% betragen (§ 7 HeizkostenV).";
    if (kombi > rwMax) { st = "sehr_hoch"; widerspruch.push("Heizkosten+Warmwasser " + fmt(kombi) + " übersteigen DMB-Höchstwert " + fmt(rwMax) + " für " + flaeche + "m². Belegeinsicht anfordern."); hi = aK + "% über DMB-Richtwert! Max. " + fmt(rwMax) + "/Jahr."; }
    else if (kombi > rwK * 1.3) { st = "hoch"; widerspruch.push("Heizkosten+Warmwasser " + fmt(kombi) + " liegen " + aK + "% über DMB-Durchschnitt für " + flaeche + "m². Belege anfordern."); hi = aK + "% über DMB-Richtwert."; }
    if (heiz > 0) posten_bewertung.push({ posten: "Heizkosten", betrag: heiz, richtwert: rwK * 0.75, abweichung_prozent: aK, status: st, hinweis: hi, paragraf: "§ 2 Nr. 4 BetrKV, § 7 HeizkostenV" });
    if (ww > 0) posten_bewertung.push({ posten: "Warmwasserversorgung", betrag: ww, richtwert: rwK * 0.25, abweichung_prozent: 0, status: "ok", hinweis: "Muss separat ausgewiesen sein (§ 8 HeizkostenV).", paragraf: "§ 2 Nr. 5 BetrKV" });
  }

  if (toNum(w.co2_abgabe) > 0) {
    const b = toNum(w.co2_abgabe);
    posten_bewertung.push({ posten: "CO2-Abgabe", betrag: b, richtwert: 0, abweichung_prozent: 0, status: "pruefen", hinweis: "Vermieter muss 0-95% selbst tragen (10-Stufen-Modell). Energieausweis anfordern.", paragraf: "§ 5 CO2KostAufG" });
    widerspruch.push("CO2-Abgabe " + fmt(b) + ": Prüfe ob Vermieteranteil korrekt abgezogen wurde (§ 5 CO2KostAufG).");
  }

  if (toNum(w.hauswart) > 0) {
    const b = toNum(w.hauswart), rw = rj(R.hausmeister), rwMax = rj(R.hausmeister_max), a = abw(b, rw);
    let st = "ok", hi = "Nur Betriebskostenanteile umlagefähig. Richtwert: " + fmt(rw) + "/Jahr.";
    if (b > rwMax) { st = "sehr_hoch"; widerspruch.push("Hausmeisterkosten " + fmt(b) + " erheblich über Richtwert " + fmt(rw) + "/Jahr für " + flaeche + "m². Aufschlüsselung anfordern."); hi = a + "% über Max-Richtwert! Aufschlüsselung anfordern."; }
    else if (b > rw * 1.3) { st = "hoch"; widerspruch.push("Hausmeisterkosten " + fmt(b) + " (" + a + "% über Richtwert). Nachweis anfordern."); }
    posten_bewertung.push({ posten: "Hauswart/Hausmeister", betrag: b, richtwert: rw, abweichung_prozent: a, status: st, hinweis: hi, paragraf: "§ 2 Nr. 14 BetrKV" });
  }

  const kw = toNum(w.kaltwasser), ew = toNum(w.entwasserung), nw = toNum(w.niederschlagswasser);
  const wg = kw + ew + nw;
  if (wg > 0) {
    const rw = rj(R.wasser_abwasser), a = abw(wg, rw);
    let st = "ok", hi = "Richtwert Wasser+Abwasser für " + flaeche + "m²: " + fmt(rw) + "/Jahr.";
    if (wg > rw * 1.6) { st = "sehr_hoch"; widerspruch.push("Wasser+Abwasser " + fmt(wg) + " (" + a + "% über Richtwert). Auf Doppelberechnung prüfen."); hi = a + "% über Richtwert — mögliche Doppelberechnung!"; }
    else if (wg > rw * 1.3) { st = "hoch"; hi = a + "% über Richtwert. Belege anfordern."; }
    if (kw > 0) posten_bewertung.push({ posten: "Wasserversorgung", betrag: kw, richtwert: rw * 0.5, abweichung_prozent: a, status: st, hinweis: hi, paragraf: "§ 2 Nr. 2 BetrKV" });
    if (ew > 0) posten_bewertung.push({ posten: "Entwässerung", betrag: ew, richtwert: rw * 0.5, abweichung_prozent: 0, status: "ok", hinweis: "Kanalgebühren der Gemeinde.", paragraf: "§ 2 Nr. 2 BetrKV" });
    if (nw > 0) posten_bewertung.push({ posten: "Niederschlagswasser", betrag: nw, richtwert: 0, abweichung_prozent: 0, status: "ok", hinweis: "Kommunale Gebühr.", paragraf: "§ 2 Nr. 2 BetrKV" });
  }

  const bm = { grundsteuer:[R.grundsteuer,"§ 2 Nr. 1 BetrKV"], muellbeseitigung:[R.muell,"§ 2 Nr. 8 BetrKV"], strassenreinigung:[R.strassenreinigung,"§ 2 Nr. 8 BetrKV"], allgemeinstrom:[R.allgemeinstrom,"§ 2 Nr. 11 BetrKV"], gartenpflege:[R.gartenpflege,"§ 2 Nr. 10 BetrKV"], aufzug:[R.aufzug,"§ 2 Nr. 7 BetrKV"], schornsteinreinigung:[R.schornstein,"§ 2 Nr. 12 BetrKV"], gebaeudeversicherung:[R.versicherungen*0.7,"§ 2 Nr. 13 BetrKV"], haftpflichtversicherung:[R.versicherungen*0.3,"§ 2 Nr. 13 BetrKV"], glasversicherung:[R.versicherungen*0.15,"§ 2 Nr. 13 BetrKV"], heizung_betriebsstrom:[0.03,"§ 2 Nr. 4 BetrKV"], heizung_wartung:[0.05,"§ 2 Nr. 4 BetrKV"], hausreinigung:[0.14,"§ 2 Nr. 9 BetrKV"], wasserzaehler:[0.03,"§ 2 Nr. 2 BetrKV"] };
  const skip = new Set(["heizkosten_gesamt","warmwasser_gesamt","co2_abgabe","hauswart","kaltwasser","entwasserung","niederschlagswasser","kabelanschluss"]);
  ALLE_POSTEN.forEach(p => {
    const b = toNum(w[p.key]);
    if (b <= 0 || skip.has(p.key)) return;
    const entry = bm[p.key];
    if (entry) {
      const [rm, para] = entry, rw = rj(rm), a = abw(b, rw);
      let st = "ok", hi = rw > 0 ? "Richtwert für " + flaeche + "m²: " + fmt(rw) + "/Jahr." : "Formale Zulässigkeit prüfen.";
      if (a > 80) { st = "sehr_hoch"; hi = a + "% über DMB-Richtwert! Belege anfordern."; widerspruch.push(p.label + " " + fmt(b) + " liegt " + a + "% über DMB-Richtwert. Belegeinsicht anfordern (§ 259 BGB)."); }
      else if (a > 40) { st = "hoch"; hi = a + "% über DMB-Richtwert. Prüfenswert."; }
      posten_bewertung.push({ posten: p.label, betrag: b, richtwert: rw, abweichung_prozent: Math.max(0, a), status: st, hinweis: hi, paragraf: para });
    } else {
      posten_bewertung.push({ posten: p.label, betrag: b, richtwert: 0, abweichung_prozent: 0, status: "pruefen", hinweis: "Prüfe ob im Mietvertrag vereinbart und nach § 2 BetrKV zulässig.", paragraf: "§ 2 BetrKV" });
    }
  });
  return { posten_bewertung, widerspruch };
}

function buildResult(w, wohn) {
  const R = CONFIG.RICHTWERTE;
  const flaeche = Math.max(toNum(wohn.flaeche), 5);
  const gesamt = ALLE_POSTEN.reduce((s, p) => s + toNum(w[p.key]), 0);
  const proQmJahr = gesamt / flaeche;
  const richtwertJahr = R.gesamt * 12;
  const vorauszahlung = toNum(wohn.vorauszahlung);
  const saldo = vorauszahlung > 0 ? gesamt - vorauszahlung : null;
  const { posten_bewertung, widerspruch } = analysierePosten(w, wohn);
  const hatKritisch = posten_bewertung.some(p => p.status === "nicht_umlagefaehig");
  const hatSehrHoch = posten_bewertung.some(p => p.status === "sehr_hoch");
  const hatHoch = posten_bewertung.some(p => ["hoch","pruefen"].includes(p.status));
  const gesamtZuHoch = proQmJahr > richtwertJahr * 1.25;
  const bew = hatKritisch ? "kritisch" : (hatSehrHoch || gesamtZuHoch || widerspruch.length > 1) ? "auffaellig" : hatHoch ? "auffaellig" : "ok";
  const ersparnis = posten_bewertung.reduce((s, p) => {
    if (p.status === "nicht_umlagefaehig") return s + p.betrag;
    if (p.richtwert > 0 && p.betrag > p.richtwert) return s + (p.betrag - p.richtwert);
    return s;
  }, 0);
  const saldoText = saldo !== null ? (saldo > 0 ? " Nachzahlung: " + fmt(saldo) + "." : " Guthaben: " + fmt(Math.abs(saldo)) + " — trotzdem inhaltlich prüfen!") : "";
  return {
    gesamtbewertung: bew, gesamt,
    zusammenfassung: hatKritisch
      ? "Kritisch: " + widerspruch.length + " fehlerhafte Posten (" + fmt(gesamt) + ", " + fmt(proQmJahr) + "/m2/Jahr)." + saldoText
      : (hatSehrHoch || gesamtZuHoch)
        ? "Auffällig: " + fmt(proQmJahr) + "/m2/Jahr — DMB-Richtwert 2024: " + fmt(richtwertJahr) + "/m2/Jahr. " + widerspruch.length + " Posten zur Prüfung." + saldoText
        : "Weitgehend unauffällig: " + fmt(proQmJahr) + "/m2/Jahr (DMB-Richtwert: " + fmt(richtwertJahr) + "/m2/Jahr)." + saldoText,
    fehler_anzahl: widerspruch.length,
    moegliche_ersparnis: Math.round(ersparnis * 100) / 100,
    pro_qm_gesamt: parseFloat(proQmJahr.toFixed(2)),
    richtwert_pro_qm_jahr: richtwertJahr,
    posten_bewertung, widerspruchsgruende: widerspruch,
    fristen_hinweis: "Widerspruchsfrist: 12 Monate nach Erhalt der Abrechnung (§ 556 Abs. 3 BGB). Für Abrechnungsjahr " + wohn.jahr + " endet die Frist typisch Ende " + (parseInt(wohn.jahr) + 2) + ". Sofort handeln!",
    naechste_schritte: [
      widerspruch.length > 0 ? "Widerspruchsbrief per Einschreiben senden" : "Belege beim Vermieter anfordern (§ 259 BGB)",
      "Originalbelege einsehen — dieses Recht besteht unabhängig vom Ergebnis",
      "Bei Ablehnung: Deutschen Mieterbund einschalten (mieterbund.de · Tel. 030 223230)",
    ],
    co2_hinweis: toNum(w.co2_abgabe) > 0 ? "CO2-Abgabe abgerechnet: Vermieter muss je nach Energieklasse 0-95% selbst tragen. Energieausweis anfordern." : "",
  };
}

// ─── UI Components ────────────────────────────────────────────────────────────

function StepBar({ current, total, label }) {
  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Schritt {current} / {total}</span>
        <span style={{ fontSize: 11, color: C.gold }}>{label}</span>
      </div>
      <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, background: C.gold, width: pct(current, total) + "%", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function Btn({ onClick, children, variant = "gold", style = {} }) {
  const bg = variant === "gold" ? C.gold : variant === "dark" ? C.surface : variant === "green" ? C.green : "transparent";
  const color = variant === "gold" ? "#0f0f0f" : variant === "green" ? "#fff" : C.muted;
  const border = variant === "outline" ? "1px solid " + C.border : "none";
  return (
    <button onClick={onClick} style={{ width: "100%", background: bg, color, border, borderRadius: 12, padding: "16px", fontSize: 15, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, error, tip, required, prefix, suffix, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <label style={{ fontSize: 11, color: error ? C.red : C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}{required && <span style={{ color: C.gold, marginLeft: 3 }}>*</span>}
        </label>
        {tip && !error && <span style={{ fontSize: 10, color: C.dim, maxWidth: 160, textAlign: "right" }}>{tip}</span>}
        {error && <span style={{ fontSize: 10, color: C.red }}>⚠ {error}</span>}
      </div>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.muted, pointerEvents: "none" }}>{prefix}</span>}
        <input type={type} placeholder={placeholder} value={value || ""} autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          onFocus={e => { setFocused(true); e.target.style.borderColor = C.gold; }}
          onBlur={e => { setFocused(false); e.target.style.borderColor = error ? C.red : C.border; }}
          style={{ width: "100%", boxSizing: "border-box", background: error ? C.redBg : "#ffffff", border: "1.5px solid " + (error ? C.red : C.border), borderRadius: 10, padding: "12px " + (suffix ? "36px" : "14px") + " 12px " + (prefix ? "28px" : "14px"), fontSize: 15, fontFamily: "inherit", color: C.text, outline: "none", WebkitAppearance: "none", MozAppearance: "textfield" }} />
        {suffix && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.muted, pointerEvents: "none" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function EuroInput({ label, value, onChange, tip, pflicht, warn }) {
  const [focused, setFocused] = useState(false);
  const filled = toNum(value) > 0;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 12px", marginBottom: 6, background: warn ? C.redBg : filled ? "#f0faf4" : C.surface, border: "1.5px solid " + (warn ? C.red : focused ? C.green : filled ? C.green + "66" : C.border), borderRadius: 10 }}>
      <div style={{ flex: 1, minWidth: 0, marginRight: 10, paddingTop: 2 }}>
        <div style={{ fontSize: 13, color: filled ? C.text : C.muted, fontWeight: filled ? 600 : 400 }}>
          {label}
          {pflicht && <span style={{ color: C.gold, marginLeft: 4, fontSize: 10 }}>✦ Pflicht</span>}
          {warn && <span style={{ color: C.red, marginLeft: 6, fontSize: 10, fontWeight: 700 }}>⚠ nicht umlagefähig seit 07/2024!</span>}
        </div>
        {tip && <div style={{ fontSize: 10, color: C.dim, marginTop: 3, lineHeight: 1.4 }}>{tip}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, paddingTop: 2 }}>
        <span style={{ fontSize: 12, color: C.muted }}>€</span>
        <input type="number" min="0" step="0.01" placeholder="0,00" value={value || ""}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: 90, background: "#ffffff", border: "1px solid " + (focused ? C.green : C.border), borderRadius: 7, padding: "7px 8px", fontSize: 14, fontFamily: "inherit", color: C.text, textAlign: "right", outline: "none", WebkitAppearance: "none", MozAppearance: "textfield" }} />
      </div>
    </div>
  );
}

function BrandAnschrift() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="19" height="19" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2"/>
          <circle cx="9" cy="9" r="3.5" stroke="white" strokeWidth="1.5"/>
          <circle cx="9" cy="9" r="1" fill="white"/>
          <line x1="9" y1="2" x2="14" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>Nebenkosten<span style={{ color: C.green }}>Radar</span></div>
    </div>
  );
}

function LegalFooter({ setStep, setPrevStep, currentStep }) {
  return (
    <div style={{ borderTop: "1px solid " + C.border, padding: "14px 20px", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
      {[["Impressum", "impressum"], ["AGB", "agb"], ["Datenschutz", "datenschutz"]].map(([label, s]) => (
        <button key={s} onClick={() => { setPrevStep(currentStep); setStep(s); }}
          style={{ background: "none", border: "none", color: C.dim, fontSize: 12, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline" }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState("welcome");
  const [prevStep, setPrevStep] = useState("welcome");
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [unlocked, setUnlocked] = useState(() => checkPaidReturn());
  const [payPending, setPayPending] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [openGruppe, setOpenGruppe] = useState("heizung");
  const [copied, setCopied] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [reportCopied, setReportCopied] = useState(false);
  const [widerrufsCheckbox, setWiderrufsCheckbox] = useState(false);
  const [ratgeberArtikel, setRatgeberArtikel] = useState(null);

  const [wohnung, setWohnung] = useState({ flaeche: "", jahr: String(new Date().getFullYear() - 1), vorauszahlung: "" });
  const [werte, setWerte] = useState({});
  const [adressen, setAdressen] = useState({ mieterName: "", mieterStrasse: "", mieterPlz: "", mieterOrt: "", vermieterName: "", vermieterStrasse: "", vermieterPlz: "", vermieterOrt: "", datum: new Date().toLocaleDateString("de-DE") });

  const setW = useCallback((k, v) => setWohnung(p => ({ ...p, [k]: v })), []);
  const setA = useCallback((k, v) => setAdressen(p => ({ ...p, [k]: v })), []);
  const setPosten = useCallback((k, v) => setWerte(p => ({ ...p, [k]: v })), []);

  const total = ALLE_POSTEN.reduce((s, p) => s + toNum(werte[p.key]), 0);
  const filledPosten = ALLE_POSTEN.filter(p => toNum(werte[p.key]) > 0).length;

  const LOADING_MSGS = [
    "Prüfe Umlagefähigkeit nach § 2 BetrKV…",
    "Vergleiche mit DMB-Betriebskostenspiegel 2024…",
    "Prüfe Heizkostenverordnung (50/70-Regel)…",
    "Prüfe CO2-Kostenteilung…",
    "Erkenne Rechenfehler und Doppelberechnung…",
    "Prüfe Verwaltungs- und Instandhaltungsanteile…",
    "Erstelle Widerspruchsbegründung…",
  ];

  function validateWohnung() {
    const e = {};
    if (!wohnung.flaeche || toNum(wohnung.flaeche) < 5) e.flaeche = "Gültige Wohnfläche erforderlich (mind. 5m²)";
    if (!wohnung.jahr || wohnung.jahr.length !== 4) e.jahr = "Gültiges Jahr erforderlich";
    if (!wohnung.vorauszahlung || toNum(wohnung.vorauszahlung) <= 0) e.vorauszahlung = "Bitte Vorauszahlungen eingeben";
    setErrors(e); setSubmitAttempted(true);
    return Object.keys(e).length === 0;
  }

  function validatePosten() {
    const e = {};
    const pf = POSTEN_GRUPPEN[0].posten.filter(p => p.pflicht && toNum(werte[p.key]) <= 0);
    if (pf.length > 0) e.pflicht = "Pflichtfelder fehlen: " + pf.map(p => p.label).join(", ");
    if (filledPosten === 0) e.gesamt = "Mindestens einen Posten eingeben";
    setErrors(e); setSubmitAttempted(true);
    return Object.keys(e).length === 0;
  }

  function validateAdressen() {
    const e = {};
    if (!adressen.mieterName.trim()) e.mieterName = "Pflichtfeld";
    if (!adressen.mieterStrasse.trim()) e.mieterStrasse = "Pflichtfeld";
    if (!/^\d{5}$/.test(adressen.mieterPlz)) e.mieterPlz = "5-stellige PLZ";
    if (!adressen.mieterOrt.trim()) e.mieterOrt = "Pflichtfeld";
    if (!adressen.vermieterName.trim()) e.vermieterName = "Pflichtfeld";
    if (!adressen.vermieterStrasse.trim()) e.vermieterStrasse = "Pflichtfeld";
    if (!/^\d{5}$/.test(adressen.vermieterPlz)) e.vermieterPlz = "5-stellige PLZ";
    if (!adressen.vermieterOrt.trim()) e.vermieterOrt = "Pflichtfeld";
    setErrors(e); setSubmitAttempted(true);
    return Object.keys(e).length === 0;
  }

  async function runAnalyse() {
    setStep("loading"); setLoadingIdx(0);
    const iv = setInterval(() => setLoadingIdx(i => Math.min(i + 1, LOADING_MSGS.length - 1)), 900);
    const fallback = buildResult(werte, wohnung);
    try {
      const postenliste = ALLE_POSTEN.filter(p => toNum(werte[p.key]) > 0).map(p => "- " + p.label + ": " + fmt(toNum(werte[p.key]))).join("\n");
      const res = await fetch("/api/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: "Analysiere Nebenkostenabrechnung. Wohnung: " + wohnung.flaeche + "m², Jahr " + wohnung.jahr + ". Posten:\n" + postenliste + "\nAntworte als JSON: {gesamtbewertung,zusammenfassung,fehler_anzahl,moegliche_ersparnis,pro_qm_gesamt,richtwert_pro_qm_jahr,posten_bewertung,widerspruchsgruende,fristen_hinweis,naechste_schritte,co2_hinweis}" }] }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      clearInterval(iv); setResult(parsed); setStep("result");
    } catch {
      clearInterval(iv); setResult(fallback); setStep("result");
    }
  }

  function generateReport() {
    if (!result) return;
    const bew = BEWERTUNG[result.gesamtbewertung] || BEWERTUNG.auffaellig;
    const lines = [
      "NEBENKOSTENPRUEFBERICHT — NebenkostenRadar",
      "===========================================",
      "Wohnung: " + wohnung.flaeche + "m² | Abrechnungsjahr: " + wohnung.jahr,
      "Erstellt am: " + new Date().toLocaleDateString("de-DE"),
      "",
      "GESAMTBEWERTUNG: " + bew.label,
      "-------------------------------------------",
      result.zusammenfassung || "",
      "",
      "Ihr Wert/m²/Jahr: " + fmt(result.pro_qm_gesamt),
      "DMB-Richtwert 2024: " + fmt(result.richtwert_pro_qm_jahr),
      "Mögliche Ersparnis: " + (result.moegliche_ersparnis > 0 ? fmt(result.moegliche_ersparnis) : "Keine"),
      "",
      "POSTEN-BEWERTUNG",
      "-------------------------------------------",
      ...(result.posten_bewertung || []).map(p => p.posten + ": " + fmt(p.betrag) + " [" + ({ ok: "ok", hoch: "erhöht", sehr_hoch: "stark erhöht", nicht_umlagefaehig: "NICHT ZULAESSIG", pruefen: "prüfen" })[p.status] + "] " + p.hinweis),
      "",
      "WIDERSPRUCHSGRUENDE",
      "-------------------------------------------",
      ...(result.widerspruchsgruende && result.widerspruchsgruende.length > 0 ? result.widerspruchsgruende.map((g, i) => (i + 1) + ". " + g) : ["Keine konkreten Widerspruchsgründe."]),
      "",
      "FRISTEN",
      "-------------------------------------------",
      result.fristen_hinweis || "",
      "",
      "-------------------------------------------",
      "Kein Ersatz für anwaltliche Beratung.",
      "Deutscher Mieterbund: mieterbund.de · Tel. 030 223230",
    ];
    setReportContent(lines.join("\n"));
    setStep("bericht");
  }

  function handleKaufen() {
    if (!widerrufsCheckbox && !IS_DEMO) {
      alert("Bitte bestätige zunächst die Zustimmung zur sofortigen Ausführung.");
      return;
    }
    if (IS_DEMO) { setUnlocked(true); return; }
    setPayPending(true);
    window.open(CONFIG.STRIPE_PAYMENT_LINK + "?success_url=" + encodeURIComponent(window.location.href.split("?")[0] + "?paid=true"), "_blank");
  }

  function resetAll() {
    setStep("welcome"); setResult(null); setUnlocked(false); setPayPending(false);
    setErrors({}); setSubmitAttempted(false); setWerte({}); setOpenGruppe("heizung");
  }

  const root = { fontFamily: "'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif", background: C.bg, color: C.text, minHeight: "100vh", WebkitTextSizeAdjust: "100%" };
  const card = { background: C.surface, border: "1px solid " + C.border, borderRadius: 12, marginBottom: 12, overflow: "hidden" };
  const cardHead = { padding: "11px 16px", borderBottom: "1px solid " + C.border, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" };


  // ── Einheitliche Navigation ───────────────────────────────────────────────
  function Nav({ activeStep }) {
    const items = [
      { label: "Prüfen", target: "wohnung" },
      { label: "Ratgeber", target: "ratgeber" },
      { label: "Über uns", target: "ueberuns" },
    ];
    return (
      <div style={{ borderBottom: "2px solid " + C.border, padding: "0 20px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setStep("welcome")}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(45,122,79,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2"/>
                <circle cx="9" cy="9" r="3.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="1" fill="white"/>
                <line x1="9" y1="2" x2="14" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Nebenkosten<span style={{ color: C.green }}>Radar</span></div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: "0.04em" }}>Unabhängige Abrechnungsprüfung</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {items.map(item => (
              <button key={item.label}
                onClick={() => { setPrevStep(activeStep); setStep(item.target); }}
                style={{ background: "none", border: "none", padding: "6px 10px", fontSize: 13, fontFamily: "inherit", color: activeStep === item.target ? C.green : C.muted, fontWeight: activeStep === item.target ? 700 : 400, cursor: "pointer", borderRadius: 6 }}>
                {item.label}
              </button>
            ))}
            <button onClick={() => setStep("wohnung")}
              style={{ background: C.green, border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontFamily: "inherit", fontWeight: 700, color: "#fff", cursor: "pointer", marginLeft: 6 }}>
              Kostenlos prüfen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── WELCOME ──────────────────────────────────────────────────────────────────
  if (step === "welcome") return (
    <div style={root}>

      <Nav activeStep="welcome" />


      {/* Hero */}
      <div style={{ padding: "56px 24px 48px", borderBottom: "1px solid " + C.border, textAlign: "center", maxWidth: 680, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "inline-block", background: C.greenBg, border: "1px solid " + C.green + "40", borderRadius: 4, padding: "4px 12px", fontSize: 11, color: C.green, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 20, textTransform: "uppercase" }}>
          Unabhängige Prüfung · Keine versteckten Kosten
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.35, margin: "0 0 14px", color: C.text, letterSpacing: "-0.01em", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Ihre Nebenkostenabrechnung.<br/>
          <span style={{ color: C.green }}>Geprüft. Transparent. Rechtssicher.</span>
        </h1>
        <p style={{ fontSize: 16, color: C.muted, margin: "0 0 32px", lineHeight: 1.7, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Wir prüfen Ihre Abrechnung systematisch nach dem aktuellen deutschen Mietrecht — vollautomatisch, nachvollziehbar und ohne juristische Vorkenntnisse.
        </p>

        {/* Was wir tun */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
          {[
            ["Vollständige Prüfung aller Posten", "Jede Position wird gegen den DMB-Betriebskostenspiegel 2024 verglichen und auf rechtliche Zulässigkeit nach BetrKV § 2 geprüft."],
            ["Erkennung nicht umlagefähiger Kosten", "Wir erkennen Posten die Ihr Vermieter nicht abrechnen darf — z.B. Verwaltungskosten, Reparaturen oder seit Juli 2024 den Kabelanschluss."],
            ["Heizkostenverordnung & CO₂-Abgabe", "Prüfung der 50/70-Regel nach HeizkostenV sowie der korrekten Aufteilung der CO₂-Abgabe nach CO₂KostAufG."],
            ["Versandfertiger Widerspruchsbrief", "Bei Auffälligkeiten erstellen wir einen vollständigen Widerspruchsbrief mit den korrekten Rechtsgrundlagen — sofort verwendbar."],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", background: C.surface, border: "1px solid " + C.border, borderRadius: 8, textAlign: "left" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 8, height: 8, background: "#fff", borderRadius: "50%" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {IS_DEMO && <div style={{ background: C.amberBg, border: "1px solid " + C.amber + "40", borderRadius: 6, padding: "8px 14px", marginBottom: 16, fontSize: 11, color: C.amber }}>Demo-Modus — Stripe nicht konfiguriert</div>}
        <button onClick={() => setStep("wohnung")}
          style={{ width: "100%", background: C.green, color: "#ffffff", border: "none", borderRadius: 8, padding: "16px 24px", fontSize: 16, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", letterSpacing: "0.01em" }}>
          Jetzt kostenlos prüfen
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: C.dim, marginTop: 10 }}>
          Basisanalyse kostenlos · Vollbericht einmalig €{CONFIG.PREIS.toFixed(2)} · Kein Abo · Keine Registrierung
        </p>
      </div>

      {/* Kennzahlen */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid " + C.border, maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {[
          ["50 %", "aller Abrechnungen enthalten Fehler", "Quelle: Deutscher Mieterbund"],
          ["§ 2 BetrKV", "Rechtsgrundlage unserer Prüfung", "inkl. HeizkostenV & CO₂KostAufG"],
          ["Ø 320 €", "mögliche Rückforderung", "bei fehlerhafter Abrechnung"],
        ].map(([n, l, s]) => (
          <div key={l} style={{ padding: "20px 12px", textAlign: "center", borderRight: "1px solid " + C.border }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.green, marginBottom: 4 }}>{n}</div>
            <div style={{ fontSize: 11, color: C.text, fontWeight: 600, marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 10, color: C.dim }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Transparenz */}
      <div style={{ padding: "36px 24px", borderBottom: "1px solid " + C.border, maxWidth: 680, margin: "0 auto", width: "100%", boxSizing: "border-box", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.08em" }}>Unsere Grundsätze</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Unabhängig", "Keine Verbindung zu Vermietern oder Verwaltungen. Wir arbeiten ausschließlich im Interesse der Mieter."],
            ["Transparent", "Vollständige Offenlegung aller Prüfschritte und Rechtsgrundlagen. Keine Blackbox."],
            ["Aktuell", "Richtwerte werden jährlich nach dem DMB-Betriebskostenspiegel aktualisiert. Rechtliche Änderungen fließen laufend ein."],
            ["Keine versteckten Kosten", "Die Basisanalyse ist kostenlos. Der Vollbericht kostet einmalig €" + CONFIG.PREIS.toFixed(2) + " — sonst nichts."],
          ].map(([title, desc]) => (
            <div key={title} style={{ padding: "18px 14px", background: C.surface, borderRadius: 8, border: "1px solid " + C.border, textAlign: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.greenBg, border: "1px solid " + C.green + "40", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.green }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Was kostet was */}
      <div style={{ padding: "36px 24px", borderBottom: "1px solid " + C.border, maxWidth: 680, margin: "0 auto", width: "100%", boxSizing: "border-box", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.08em" }}>Leistungsübersicht</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Basisanalyse */}
          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 10, padding: "22px 18px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Basisanalyse</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 4 }}>Kostenlos</div>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 18 }}>Keine Registrierung</div>
            <div style={{ width: "100%", borderTop: "1px solid " + C.border, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {["Gesamtbewertung mit Ampelsystem", "€/m²-Vergleich mit DMB-Richtwert 2024", "Vorschau der ersten 3 Posten"].map(item => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", textAlign: "left" }}>
                  <span style={{ color: C.green, fontSize: 11, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div style={{ background: C.green, border: "2px solid " + C.green, borderRadius: 10, padding: "22px 18px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap" }}>Empfohlen</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, opacity: 0.85 }}>Premiumanalyse</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 2 }}>€{CONFIG.PREIS.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: "#fff", marginBottom: 18, opacity: 0.8 }}>Einmalig · Kein Abo</div>
            <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.3)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Alle Posten mit Richtwerten & Abweichung",
                "Widerspruchsgründe mit §§ Rechtsgrundlagen",
                "Fristen nach § 556 Abs. 3 BGB",
                "Nächste Schritte konkret formuliert",
                "Versandfertiger Widerspruchsbrief",
                "Vollständiger Prüfbericht zum Kopieren",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", textAlign: "left" }}>
                  <span style={{ color: "#fff", fontSize: 11, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 11, color: "#fff", lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <LegalFooter setStep={setStep} setPrevStep={setPrevStep} currentStep="welcome" />
    </div>
  );


  // ── WOHNUNG ───────────────────────────────────────────────────────────────────
  if (step === "wohnung") {
    const diff = wohnung.vorauszahlung && total > 0 ? total - toNum(wohnung.vorauszahlung) : null;
    const vz = toNum(wohnung.vorauszahlung), fl = toNum(wohnung.flaeche);
    const vzQm = vz && fl ? vz / fl / 12 : null;
    return (
      <div style={root}>
        <div style={{ background: C.surface, padding: "20px 20px 0", borderBottom: "1px solid " + C.border }}>
          <button onClick={() => setStep("welcome")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 12px", fontFamily: "inherit" }}>← Zurück</button>
          <StepBar current={1} total={3} label="Wohnungsdaten" />
        </div>
        <div style={{ padding: "22px 20px 40px" }}>
          <h2 style={{ fontSize: 21, fontWeight: 400, margin: "0 0 6px" }}>Angaben zur Wohnung</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px", lineHeight: 1.55 }}>Steht auf dem Deckblatt deiner Abrechnung.</p>

          <div style={{ background: C.greenBg, border: "1px solid " + C.green + "40", borderRadius: 10, padding: "13px 14px", marginBottom: 20, fontSize: 12, color: C.muted, lineHeight: 1.75 }}>
            <div style={{ color: C.gold, fontWeight: 700, marginBottom: 5, fontSize: 13 }}>Wie funktioniert eine Nebenkostenabrechnung?</div>
            Du zahlst monatlich Abschläge für Heizung, Wasser, Müll u.a. Einmal im Jahr rechnet dein Vermieter ab, was tatsächlich angefallen ist. Im nächsten Schritt trägst du jeden Posten ein — genau so wie er auf der Abrechnung steht.
          </div>

          <Field label="Wohnfläche laut Mietvertrag" value={wohnung.flaeche} onChange={v => setW("flaeche", v)} type="number" placeholder="z.B. 75" suffix="m²" required error={errors.flaeche} autoFocus tip="Steht auf dem Deckblatt oder im Mietvertrag" />
          <Field label="Abrechnungsjahr" value={wohnung.jahr} onChange={v => setW("jahr", v)} type="number" placeholder="z.B. 2023" required error={errors.jahr} tip="Das Kalenderjahr oben auf der Abrechnung" />
          <Field label="Geleistete Vorauszahlungen" value={wohnung.vorauszahlung} onChange={v => setW("vorauszahlung", v)} type="number" placeholder="z.B. 1200,00" prefix="€" required error={errors.vorauszahlung} tip="Alle Abschläge des Jahres — steht als 'Summe Vorauszahlungen' auf der Abrechnung" />

          {diff !== null && !isNaN(diff) && (
            <div style={{ background: diff > 0 ? C.redBg : C.amberBg, border: "1px solid " + (diff > 0 ? C.red : C.amber) + "30", borderLeft: "3px solid " + (diff > 0 ? C.red : C.amber), borderRadius: 10, padding: "12px 14px", marginBottom: 10, fontSize: 13, color: diff > 0 ? C.red : C.amber, lineHeight: 1.5 }}>
              {diff > 0 ? "Nachzahlung " + fmt(diff) + " — prüfe ob alle Posten korrekt sind" : "Guthaben " + fmt(Math.abs(diff)) + " — trotzdem prüfen: Auch bei Guthaben kann die Abrechnung fehlerhafte Posten enthalten."}
            </div>
          )}
          {vzQm !== null && vzQm < 0.5 && (
            <div style={{ background: C.redBg, border: "1px solid " + C.red + "30", borderLeft: "3px solid " + C.red, borderRadius: 10, padding: "12px 14px", marginBottom: 10, fontSize: 13, color: C.red }}>
              Vorauszahlung sehr niedrig: {fmt(vzQm)}/m²/Monat — Richtwert: {fmt(CONFIG.RICHTWERTE.gesamt)}/m²/Monat. Bitte Eingabe prüfen.
            </div>
          )}
          {vzQm !== null && vzQm > CONFIG.RICHTWERTE.gesamt * 2 && (
            <div style={{ background: C.amberBg, border: "1px solid " + C.amber + "30", borderLeft: "3px solid " + C.amber, borderRadius: 10, padding: "12px 14px", marginBottom: 10, fontSize: 13, color: C.amber }}>
              Vorauszahlung auffällig hoch: {fmt(vzQm)}/m²/Monat — mehr als doppelt so hoch wie der DMB-Richtwert ({fmt(CONFIG.RICHTWERTE.gesamt)}/m²/Monat).
            </div>
          )}

          <Btn onClick={() => { if (validateWohnung()) { setErrors({}); setSubmitAttempted(false); setStep("posten"); } }}>Weiter zu den Posten →</Btn>
        </div>
      </div>
    );
  }

  // ── POSTEN ────────────────────────────────────────────────────────────────────
  if (step === "posten") return (
    <div style={root}>
      <div style={{ background: C.surface, padding: "20px 20px 0", borderBottom: "1px solid " + C.border }}>
        <button onClick={() => setStep("wohnung")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 12px", fontFamily: "inherit" }}>← Zurück</button>
        <StepBar current={2} total={3} label="Kostenposten" />
      </div>
      <div style={{ padding: "14px 20px 0" }}>
        <h2 style={{ fontSize: 20, fontWeight: 400, margin: "0 0 4px" }}>Posten aus deiner Abrechnung</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px" }}>Trage die Beträge so ein wie sie auf der Abrechnung stehen. ✦ = Pflichtfeld.</p>
        <div style={{ background: "#ffffff", border: "1px solid " + (total > 0 ? C.green : C.border), borderRadius: 10, padding: "11px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Eingegeben</div>
            <div style={{ fontSize: 21, fontWeight: 700, color: total > 0 ? C.gold : C.dim }}>{total > 0 ? fmt(total) : "€ 0,00"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Posten</div>
            <div style={{ fontSize: 21, fontWeight: 700, color: C.muted }}>{filledPosten}</div>
          </div>
        </div>
        {submitAttempted && (errors.pflicht || errors.gesamt) && (
          <div style={{ background: C.redBg, border: "1px solid " + C.red + "30", borderLeft: "3px solid " + C.red, borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: C.red }}>
            {errors.pflicht || errors.gesamt}
          </div>
        )}
      </div>
      <div style={{ padding: "0 20px 120px" }}>
        {POSTEN_GRUPPEN.map(gruppe => {
          const groupSum = gruppe.posten.reduce((s, p) => s + toNum(werte[p.key]), 0);
          const isOpen = openGruppe === gruppe.id;
          return (
            <div key={gruppe.id} style={{ marginBottom: 8 }}>
              <button onClick={() => setOpenGruppe(isOpen ? null : gruppe.id)}
                style={{ width: "100%", background: C.surface, border: "1px solid " + (groupSum > 0 ? C.green : C.border), borderRadius: isOpen ? "10px 10px 0 0" : 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 19 }}>{gruppe.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{gruppe.label}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{gruppe.hint}</div>
                </div>
                {groupSum > 0 && <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>{fmt(groupSum)}</span>}
                <span style={{ color: C.dim, fontSize: 15, transform: isOpen ? "rotate(90deg)" : "none" }}>›</span>
              </button>
              {isOpen && (
                <div style={{ background: "#ffffff", border: "1px solid " + C.border, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "10px 12px" }}>
                  {gruppe.posten.map(p => (
                    <EuroInput key={p.key} label={p.label} value={werte[p.key]} tip={p.tip} pflicht={p.pflicht}
                      warn={p.key === "kabelanschluss" && toNum(werte[p.key]) > 0}
                      onChange={v => setPosten(p.key, v)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#ffffff", padding: "20px 20px 24px", borderTop: "1px solid #dde1e7", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <Btn onClick={() => { if (validatePosten()) { setErrors({}); setSubmitAttempted(false); runAnalyse(); } }} style={{ background: filledPosten > 0 ? C.green : C.surface, color: filledPosten > 0 ? "#ffffff" : C.dim }}>
          {filledPosten === 0 ? "Posten eingeben um fortzufahren" : filledPosten + " Posten analysieren →"}
        </Btn>
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div style={{ ...root, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 32 }}>
      <div style={{ fontSize: 52, marginBottom: 24 }}>📡</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Nebenkosten<span style={{ color: C.gold }}>Radar</span></div>
      <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 28 }}>Analyse läuft</div>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px", textAlign: "center", minHeight: 20 }}>{LOADING_MSGS[loadingIdx]}</p>
      <div style={{ width: "100%", maxWidth: 260 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Prüffortschritt</span>
          <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>{Math.round(pct(loadingIdx + 1, LOADING_MSGS.length))}%</span>
        </div>
        <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", background: C.gold, width: pct(loadingIdx + 1, LOADING_MSGS.length) + "%", transition: "width 0.9s ease", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 14, justifyContent: "center" }}>
          {LOADING_MSGS.map((_, i) => (
            <div key={i} style={{ width: i === loadingIdx ? 18 : 6, height: 6, borderRadius: 3, background: i <= loadingIdx ? C.gold : C.border, transition: "all 0.4s ease" }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────────
  if (step === "result") {
    if (!result) return <div style={{ ...root, padding: 40, textAlign: "center" }}><p>Kein Ergebnis.</p><Btn onClick={() => setStep("posten")} style={{ width: "auto", padding: "12px 28px" }}>Zurück</Btn></div>;
    const bew = BEWERTUNG[result.gesamtbewertung] || BEWERTUNG.auffaellig;
    return (
      <div style={root}>
        <div style={{ background: "#ffffff", padding: "22px 20px 18px" }}>
          <div style={{ fontSize: 10, color: C.goldD, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>NebenkostenRadar · Ergebnis {wohnung.jahr}</div>
          <h1 style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>Deine Analyse</h1>
        </div>
        <div style={{ padding: "16px 20px 100px" }}>
          <div style={{ background: bew.bg, border: "2px solid " + bew.farbe + "40", borderLeft: "4px solid " + bew.farbe, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>{bew.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: bew.farbe }}>{bew.label}{result.fehler_anzahl > 0 ? " · " + result.fehler_anzahl + " Fehler" : ""}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{bew.sub}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{result.zusammenfassung}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { l: "Dein €/m²/Jahr", v: result.pro_qm_gesamt ? fmt(result.pro_qm_gesamt) : "–", s: "eingegebene Posten" },
              { l: "DMB-Richtwert 2024", v: result.richtwert_pro_qm_jahr ? fmt(result.richtwert_pro_qm_jahr) : "–", s: "Bundesdurchschnitt" },
              { l: "Mögl. Ersparnis", v: result.moegliche_ersparnis > 0 ? fmt(result.moegliche_ersparnis) : "Keine", s: "bei Widerspruch", hi: result.moegliche_ersparnis > 0 },
              { l: "Geprüfte Posten", v: result.posten_bewertung ? result.posten_bewertung.length : filledPosten, s: "analysiert" },
            ].map(k => (
              <div key={k.l} style={{ background: k.hi ? C.goldBg : C.surface, border: "1px solid " + (k.hi ? C.goldD : C.border), borderRadius: 10, padding: "11px 12px" }}>
                <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{k.l}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: k.hi ? C.gold : C.text }}>{k.v}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{k.s}</div>
              </div>
            ))}
          </div>

          {result.co2_hinweis && (
            <div style={{ background: C.blueBg, border: "1px solid " + C.blue + "30", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 12, color: C.blue, lineHeight: 1.5 }}>
              {result.co2_hinweis}
            </div>
          )}

          <div style={card}>
            <div style={{ ...cardHead, display: "flex", justifyContent: "space-between" }}>
              <span>Posten-Bewertung</span>
              {!unlocked && <span style={{ color: C.dim, fontWeight: 400, textTransform: "none" }}>Vorschau · 3 von {result.posten_bewertung ? result.posten_bewertung.length : 0}</span>}
            </div>
            {(result.posten_bewertung || []).slice(0, unlocked ? 999 : 3).map((p, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", padding: "11px 16px", borderBottom: i < arr.length - 1 ? "1px solid " + C.border : "none", background: p.status === "nicht_umlagefaehig" ? C.redBg : "transparent" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.posten}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{p.hinweis}</div>
                  {p.paragraf && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{p.paragraf}</div>}
                  {p.richtwert > 0 && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Richtwert für {wohnung.flaeche}m²: {fmt(p.richtwert)}/Jahr</div>}
                </div>
                <div style={{ textAlign: "right", marginLeft: 10, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(p.betrag)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: { ok: C.green, hoch: C.amber, sehr_hoch: "#e87c42", nicht_umlagefaehig: C.red, pruefen: C.amber }[p.status] || C.muted }}>
                    {{ ok: "✓ Unauffällig", hoch: "↑ Erhöht", sehr_hoch: "↑↑ Stark erhöht", nicht_umlagefaehig: "✗ Nicht zulässig", pruefen: "? Prüfen" }[p.status] || p.status}
                    {p.abweichung_prozent > 0 && p.status !== "nicht_umlagefaehig" ? " (+" + p.abweichung_prozent + "%)" : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!unlocked ? (
            <div style={{ background: C.surface, border: "2px solid " + C.goldD, borderRadius: 16, padding: "20px 18px" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ background: C.greenBg, border: "1px solid " + C.green + "40", borderRadius: 20, display: "inline-block", padding: "4px 14px", fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 10 }}>VOLLBERICHT · €{CONFIG.PREIS.toFixed(2)} einmalig</div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Vollständigen Bericht freischalten</h3>
                <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.55 }}>Alle Posten mit Richtwerten · Widerspruchsgründe · Fristen · Brief</p>
              </div>
              {result.moegliche_ersparnis > 0 && (
                <div style={{ background: C.greenBg, border: "1px solid " + C.green + "30", borderLeft: "3px solid " + C.green, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.green, marginBottom: 14 }}>
                  Mögliche Rückforderung laut Analyse: <strong>{fmt(result.moegliche_ersparnis)}</strong>
                </div>
              )}
              {payPending ? (
                <div>
                  <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 12 }}>Zahlung läuft im neuen Tab. Nach Abschluss hier klicken:</p>
                  <Btn onClick={() => setUnlocked(true)} variant="green" style={{ marginBottom: 8 }}>✓ Bezahlt — Vollbericht anzeigen</Btn>
                  <Btn onClick={() => setPayPending(false)} variant="outline">Abbrechen</Btn>
                </div>
              ) : (
                <div>
                  {/* Widerrufsbelehrung + Checkbox — Pflicht nach § 356 Abs. 5 BGB */}
                  <div style={{ background: "#f8f9fa", border: "1px solid " + C.border, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <input type="checkbox" checked={widerrufsCheckbox} onChange={e => setWiderrufsCheckbox(e.target.checked)} aria-label="Zustimmung zur sofortigen Vertragsausführung und Verlust des Widerrufsrechts" aria-required="true"
                        style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, cursor: "pointer", accentColor: C.gold }} />
                      <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                        Ich stimme zu, dass mit der Ausführung des Vertrags sofort begonnen wird, und ich habe zur Kenntnis genommen, dass ich mit Beginn der Ausführung mein <strong style={{ color: C.text }}>Widerrufsrecht verliere</strong> (§ 356 Abs. 5 BGB i.V.m. § 18 VRRL). Der Vollbericht steht sofort nach Zahlung zur Verfügung.
                      </span>
                    </label>
                  </div>
                  {/* Preis, Lieferung, Anbieter — Pflichtangaben vor Kaufabschluss */}
                  <div style={{ fontSize: 11, color: C.dim, marginBottom: 12, lineHeight: 1.7, textAlign: "center" }}>
                    Gesamtpreis: <strong style={{ color: C.text }}>€{CONFIG.PREIS.toFixed(2)}</strong> · Sofortiger Zugang nach Zahlung<br/>
                    Anbieter: NebenkostenRadar · Inhaber: Stefan Hennig · Frankfurt am Main<br/>Vertragssprache: Deutsch · Vertrag wird nicht gespeichert<br/>
                    Zahlung über Stripe · Kein Abo · Einmalige Zahlung
                  </div>
                  <button
                    onClick={widerrufsCheckbox || IS_DEMO ? handleKaufen : undefined}
                    disabled={!widerrufsCheckbox && !IS_DEMO} aria-disabled={!widerrufsCheckbox && !IS_DEMO} aria-describedby="widerruf-hinweis"
                    style={{
                      width: "100%", border: "none", borderRadius: 12, padding: "16px",
                      fontSize: 15, fontFamily: "inherit", fontWeight: 700,
                      background: widerrufsCheckbox || IS_DEMO ? C.gold : C.border,
                      color: widerrufsCheckbox || IS_DEMO ? "#0f0f0f" : C.dim,
                      cursor: widerrufsCheckbox || IS_DEMO ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                    }}>
                    {IS_DEMO ? "Demo: Vollbericht freischalten →" : "Jetzt kaufen · €" + CONFIG.PREIS.toFixed(2)}
                  </button>
                  {!widerrufsCheckbox && !IS_DEMO && (
                    <div id="widerruf-hinweis" style={{ textAlign: "center", fontSize: 11, color: C.amber, marginTop: 6 }}>
                      ⚠ Bitte zuerst die Checkbox oben bestätigen
                    </div>
                  )}
                  <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: C.dim }}>
                    Mit dem Kauf akzeptierst du unsere{" "}
                    <button onClick={() => { setPrevStep("result"); setStep("agb"); }} style={{ background: "none", border: "none", color: C.dim, textDecoration: "underline", cursor: "pointer", fontSize: 10, fontFamily: "inherit", padding: 0 }}>AGB</button>
                    {" "}und{" "}
                    <button onClick={() => { setPrevStep("result"); setStep("datenschutz"); }} style={{ background: "none", border: "none", color: C.dim, textDecoration: "underline", cursor: "pointer", fontSize: 10, fontFamily: "inherit", padding: 0 }}>Datenschutzerklärung</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={card}>
                <div style={cardHead}>Widerspruchsgründe</div>
                {(result.widerspruchsgruende || []).length === 0
                  ? <div style={{ padding: "14px 16px", fontSize: 13, color: C.muted, fontStyle: "italic" }}>Keine konkreten Widerspruchsgründe.</div>
                  : (result.widerspruchsgruende || []).map((g, i) => (
                    <div key={i} style={{ padding: "11px 16px", borderBottom: i < result.widerspruchsgruende.length - 1 ? "1px solid " + C.border : "none", fontSize: 13, lineHeight: 1.6, display: "flex", gap: 10 }}>
                      <span style={{ color: C.red, flexShrink: 0 }}>▸</span>{g}
                    </div>
                  ))}
              </div>

              <div style={card}>
                <div style={cardHead}>Nächste Schritte</div>
                {(result.naechste_schritte || []).map((s, i) => (
                  <div key={i} style={{ padding: "11px 16px", borderBottom: i < (result.naechste_schritte || []).length - 1 ? "1px solid " + C.border : "none", fontSize: 13, lineHeight: 1.5, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.greenBg, border: "1px solid " + C.green + "40", color: C.gold, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>{s}
                  </div>
                ))}
              </div>

              <div style={{ background: C.amberBg, border: "1px solid " + C.amber + "20", borderLeft: "3px solid " + C.amber, borderRadius: 12, padding: "13px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>Fristen</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{result.fristen_hinweis}</div>
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <Btn onClick={() => { setErrors({}); setStep("adressen"); }} style={{ flex: 2 }}>Brief erstellen →</Btn>
                <Btn onClick={generateReport} variant="dark" style={{ flex: 1, fontSize: 13 }}>Bericht</Btn>
              </div>
            </>
          )}

          <Btn onClick={resetAll} variant="outline" style={{ marginTop: 4 }}>← Neue Prüfung starten</Btn>
          <p style={{ textAlign: "center", fontSize: 10, color: C.dim, marginTop: 12, lineHeight: 1.6 }}>Keine Rechtsberatung. Deutscher Mieterbund: mieterbund.de · Tel. 030 223230</p>
          <LegalFooter setStep={setStep} setPrevStep={setPrevStep} currentStep="result" />
        </div>
      </div>
    );
  }

  // ── ADRESSEN ──────────────────────────────────────────────────────────────────
  if (step === "adressen") return (
    <div style={root}>
      <div style={{ background: C.surface, padding: "20px 20px 0", borderBottom: "1px solid " + C.border }}>
        <button onClick={() => setStep("result")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 12px", fontFamily: "inherit" }}>← Zurück</button>
        <StepBar current={3} total={3} label="Absender & Empfänger" />
      </div>
      <div style={{ padding: "22px 20px 40px" }}>
        <h2 style={{ fontSize: 21, fontWeight: 400, margin: "0 0 6px" }}>Adressangaben für den Brief</h2>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 22px" }}>Werden nur für den Brief verwendet — keine Speicherung.</p>

        <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Deine Adresse (Absender)</div>
          <Field label="Vor- und Nachname" value={adressen.mieterName} onChange={v => setA("mieterName", v)} placeholder="Max Mustermann" required error={errors.mieterName} autoFocus />
          <Field label="Straße und Hausnummer" value={adressen.mieterStrasse} onChange={v => setA("mieterStrasse", v)} placeholder="Musterstraße 12" required error={errors.mieterStrasse} />
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
            <Field label="PLZ" value={adressen.mieterPlz} onChange={v => setA("mieterPlz", v)} type="text" placeholder="12345" required error={errors.mieterPlz} />
            <Field label="Ort" value={adressen.mieterOrt} onChange={v => setA("mieterOrt", v)} placeholder="Musterstadt" required error={errors.mieterOrt} />
          </div>
        </div>

        <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: "16px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Vermieter / Hausverwaltung</div>
          <Field label="Name oder Firma" value={adressen.vermieterName} onChange={v => setA("vermieterName", v)} placeholder="Muster Verwaltungs GmbH" required error={errors.vermieterName} />
          <Field label="Straße und Hausnummer" value={adressen.vermieterStrasse} onChange={v => setA("vermieterStrasse", v)} placeholder="Verwalterstraße 1" required error={errors.vermieterStrasse} />
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
            <Field label="PLZ" value={adressen.vermieterPlz} onChange={v => setA("vermieterPlz", v)} type="text" placeholder="12345" required error={errors.vermieterPlz} />
            <Field label="Ort" value={adressen.vermieterOrt} onChange={v => setA("vermieterOrt", v)} placeholder="Musterstadt" required error={errors.vermieterOrt} />
          </div>
        </div>

        <Field label="Datum" value={adressen.datum} onChange={v => setA("datum", v)} placeholder="01.01.2024" tip="Datum für den Brief" />
        <Btn onClick={() => { if (validateAdressen()) { setErrors({}); setStep("dokument"); } }}>Brief erstellen →</Btn>
      </div>
    </div>
  );

  // ── DOKUMENT ──────────────────────────────────────────────────────────────────
  if (step === "dokument") {
    const gruende = result ? (result.widerspruchsgruende || []) : [];
    const briefLines = [
      adressen.mieterName,
      adressen.mieterStrasse,
      adressen.mieterPlz + " " + adressen.mieterOrt,
      "",
      "",
      adressen.vermieterName,
      adressen.vermieterStrasse,
      adressen.vermieterPlz + " " + adressen.vermieterOrt,
      "",
      "",
      adressen.mieterOrt + ", " + adressen.datum,
      "",
      "",
      "Betreff: Widerspruch zur Betriebskostenabrechnung " + wohnung.jahr,
      "         Mietobjekt: " + adressen.mieterStrasse + ", " + adressen.mieterPlz + " " + adressen.mieterOrt,
      "",
      "",
      "Sehr geehrte Damen und Herren,",
      "",
      "hiermit widerspreche ich der Betriebskostenabrechnung für das Abrechnungsjahr " + wohnung.jahr + " fristgerecht gemäß § 556 Abs. 3 BGB.",
      "",
      "Die Abrechnung weist nach meiner Prüfung folgende Mängel auf:",
      "",
      ...(gruende.length > 0 ? gruende.map((g, i) => (i + 1) + ". " + g) : ["1. Die Abrechnung ist in mehreren Punkten nicht hinreichend nachvollziehbar."]),
      "",
      "Ich bitte daher um:",
      "",
      "1. Übersendung aller Originalbelege zur Einsichtnahme (§ 259 BGB)",
      "2. Nachvollziehbare Darlegung des Umlageschlüssels für alle Positionen",
      "3. Korrektur der beanstandeten Posten und Neuberechnung der Abrechnung",
      "",
      "Eine eventuelle Nachzahlung leiste ich ausdrücklich unter Vorbehalt.",
      "",
      "Ich bitte um schriftliche Stellungnahme innerhalb von 4 Wochen.",
      "",
      "",
      "Mit freundlichen Grüßen,",
      "",
      "",
      "_________________________________",
      adressen.mieterName,
    ];
    const briefText = briefLines.join("\n");
    return (
      <div style={root}>
        <div style={{ background: C.surface, padding: "20px 20px 16px", borderBottom: "1px solid " + C.border }}>
          <button onClick={() => setStep("adressen")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 10px", fontFamily: "inherit" }}>← Zurück</button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, color: C.goldD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>NebenkostenRadar</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Widerspruchsbrief</h2>
            <div style={{ background: C.greenBg, border: "1px solid " + C.green + "30", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Versandfertig</div>
          </div>
        </div>

        <div style={{ margin: "16px 20px 0", background: "#fafafa", border: "1px solid #dde1e7", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: "#f0f2f4", padding: "8px 16px", borderBottom: "1px solid #dde1e7", display: "flex", alignItems: "center", gap: 8 }}>
            {["#e05252", "#e8a642", "#4caf7d"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
            <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>Widerspruch_{wohnung.jahr}.txt</span>
          </div>
          <pre style={{ padding: "20px", fontFamily: "'Courier New',monospace", fontSize: 11.5, color: "#1a1a1a", lineHeight: 1.9, whiteSpace: "pre-wrap", maxHeight: 420, overflowY: "auto", margin: 0 }}>{briefText}</pre>
        </div>

        <div style={{ padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={() => { try { navigator.clipboard.writeText(briefText); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {} }} variant={copied ? "green" : "gold"}>
            {copied ? "✓ In Zwischenablage kopiert!" : "Brief kopieren"}
          </Btn>
          <Btn onClick={generateReport} variant="dark">Vollständigen Prüfbericht anzeigen</Btn>

          <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: "16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Versandhinweise</div>
            {[["Per Einschreiben mit Rückschein", "Nur so ist der Zugang beweisbar"], ["Widerspruchsfrist beachten", "12 Monate nach Erhalt (§ 556 Abs. 3 BGB)"], ["Kopie aufbewahren", "Brief und Einlieferungsbeleg für deine Unterlagen"]].map(([t, s], i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 10 : 0, alignItems: "flex-start" }}>
                <span style={{ color: C.gold, flexShrink: 0, fontSize: 12 }}>{i + 1}.</span>
                <div>
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{t}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{s}</div>
                </div>
              </div>
            ))}
          </div>

          <Btn onClick={resetAll} variant="outline">Neue Prüfung starten</Btn>
        </div>
        <div style={{ borderTop: "1px solid " + C.border, padding: "12px 20px", display: "flex", justifyContent: "center", gap: 20 }}>
          {[["Impressum","impressum"],["AGB","agb"],["Datenschutz","datenschutz"]].map(([l,s]) => (
            <button key={s} onClick={() => { setPrevStep(step); setStep(s); }}
              style={{ background:"none", border:"none", color:C.dim, fontSize:11, fontFamily:"inherit", cursor:"pointer", textDecoration:"underline" }}>
              {l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── BERICHT ───────────────────────────────────────────────────────────────────
  if (step === "bericht") return (
    <div style={root}>
      <div style={{ background: C.surface, padding: "20px 20px 16px", borderBottom: "1px solid " + C.border }}>
        <button onClick={() => { setErrors({}); setStep(adressen.mieterName && adressen.vermieterName ? "dokument" : "adressen"); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 10px", fontFamily: "inherit" }}>← Zurück</button>
        <div style={{ fontSize: 10, color: C.goldD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>NebenkostenRadar</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Prüfbericht</h2>
          <div style={{ background: C.greenBg, border: "1px solid " + C.green + "40", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: C.gold, fontWeight: 700 }}>Jahr {wohnung.jahr}</div>
        </div>
      </div>

      <div style={{ margin: "16px 20px 0", background: "#fafafa", border: "1px solid #dde1e7", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ background: "#f0f2f4", padding: "8px 16px", borderBottom: "1px solid #dde1e7", display: "flex", alignItems: "center", gap: 8 }}>
          {["#e05252", "#e8a642", "#4caf7d"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
          <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>Nebenkostenpruefbericht_{wohnung.jahr}.txt</span>
        </div>
        <pre style={{ padding: "20px", fontFamily: "'Courier New',monospace", fontSize: 11, color: "#1a1810", lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto", margin: 0 }}>{reportContent}</pre>
      </div>

      <div style={{ padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn onClick={() => { try { navigator.clipboard.writeText(reportContent); setReportCopied(true); setTimeout(() => setReportCopied(false), 2500); } catch { alert("Bitte den Text oben manuell markieren und kopieren."); } }} variant={reportCopied ? "green" : "gold"}>
          {reportCopied ? "✓ Bericht kopiert!" : "Bericht in Zwischenablage kopieren"}
        </Btn>
        <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: "14px 16px", fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          Den kopierten Text in Word, Pages oder Notes einfügen und speichern.
        </div>
        <Btn onClick={() => { setErrors({}); setStep(adressen.mieterName && adressen.vermieterName ? "dokument" : "adressen"); }} variant="outline">← Zurück zum Widerspruchsbrief</Btn>
      </div>
    </div>
  );

  // ── IMPRESSUM ─────────────────────────────────────────────────────────────────
  if (step === "impressum") return (
    <div style={root}>
      <div style={{ background: C.surface, padding: "20px 20px 16px", borderBottom: "1px solid " + C.border }}>
        <button onClick={() => setStep(prevStep || "welcome")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 10px", fontFamily: "inherit" }}>← Zurück</button>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Impressum</h2>
      </div>
      <div style={{ padding: "24px 20px 60px" }}>
        {[
          { t: "Angaben gemäß § 5 TMG", brand: true, lines: ["NebenkostenRadar — nebenkostenradar.com", "Inhaber: Stefan Hennig (Einzelunternehmer)", "Ludwigstr. 33-37", "60327 Frankfurt am Main"] },
          { t: "Kontakt", lines: ["", "E-Mail: support@nebenkostenradar.com"] },
          { t: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV", lines: ["Stefan Hennig", "Ludwigstr. 33-37", "60327 Frankfurt am Main"] },
          { t: "Haftungsausschluss", lines: ["Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität können wir keine Gewähr übernehmen."] },
          { t: "Haftung für Links", lines: ["Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben."] },
          { t: "Streitschlichtung", lines: ["Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: https://ec.europa.eu/consumers/odr/", "Wir nehmen nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil."] },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.t}</div>
            {s.brand && <BrandAnschrift />}
            {s.lines.map((line, j) => {
              const isPlaceholder = line.startsWith("DEIN") || line.startsWith("DEINE");
              return <div key={j} style={{ fontSize: 13, color: isPlaceholder ? C.amber : C.muted, lineHeight: 1.8, fontStyle: isPlaceholder ? "italic" : "normal" }}>{isPlaceholder ? "⚠ " + line : line}</div>;
            })}
          </div>
        ))}
        <div style={{ background: C.amberBg, border: "1px solid " + C.amber + "30", borderLeft: "3px solid " + C.amber, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.amber, lineHeight: 1.7 }}>
          Impressum vollständig. Bei Änderungen: src/App.jsx → Impressum-Bereich anpassen.
        </div>
      </div>
    </div>
  );

  // ── DATENSCHUTZ ───────────────────────────────────────────────────────────────
  if (step === "datenschutz") return (
    <div style={root}>
      <div style={{ background: C.surface, padding: "20px 20px 16px", borderBottom: "1px solid " + C.border }}>
        <button onClick={() => setStep(prevStep || "welcome")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 10px", fontFamily: "inherit" }}>← Zurück</button>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Datenschutzerklärung</h2>
      </div>
      <div style={{ padding: "24px 20px 60px" }}>
        {[
          { t: "1. Verantwortlicher", brand: true, lines: ["NebenkostenRadar — nebenkostenradar.com", "Inhaber: Stefan Hennig (Einzelunternehmer)", "Ludwigstr. 33-37, 60327 Frankfurt am Main", "support@nebenkostenradar.com"] },
          { t: "2. Keine Datenspeicherung", lines: ["Diese Website speichert keine personenbezogenen Daten. Alle eingegebenen Werte (Nebenkostenposten, Wohnungsdaten) werden ausschließlich lokal in Ihrem Browser verarbeitet."] },
          { t: "3. Keine Cookies", lines: ["Diese Website verwendet keine Tracking-Cookies, kein Webanalyse-Tool und keine Social-Media-Plugins. Es werden keine Cookies gesetzt, die einer Einwilligung bedürfen. Technisch notwendige Cookies (Session-Cookies) werden nur zur Bereitstellung der Website-Funktion verwendet und sind gemäß § 25 Abs. 2 TDDDG ohne Einwilligung zulässig."] },
          { t: "4. Hosting (Vercel)", lines: ["Unser Hosting-Anbieter Vercel (Vercel Inc., 340 S Lemon Ave, Walnut, CA 91789, USA) erhebt automatisch Server-Log-Dateien (IP-Adresse, Browser, Zeitstempel). Diese Daten werden nicht mit anderen Daten zusammengeführt. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am technischen Betrieb). Datenschutzerklärung Vercel: vercel.com/legal/privacy-policy"] },
          { t: "5. Zahlungsabwicklung (Stripe)", lines: ["Bei Kauf eines Vollberichts leiten wir Sie zur Zahlungsseite von Stripe Payments Europe, Ltd. (1 Grand Canal Street Lower, Dublin D02 H210, Irland) weiter. Dabei werden Name, E-Mail-Adresse und Zahlungsdaten an Stripe übermittelt. Stripe verarbeitet diese Daten gemäß eigener Datenschutzerklärung: stripe.com/de/privacy. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Datenübermittlung in die USA auf Basis von Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO)."] },
          { t: "6. Analyse-Service (Anthropic)", lines: ["Für die automatische Prüfung werden die eingegebenen Kostenpositionen (KEINE personenbezogenen Daten) an die API von Anthropic PBC, USA übermittelt. Die Daten werden nicht dauerhaft gespeichert und nicht für KI-Training genutzt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO."] },
          { t: "7. Ihre Rechte (Art. 15–22 DSGVO)", lines: ["Auskunft (Art. 15) · Berichtigung (Art. 16) · Löschung (Art. 17) · Einschränkung (Art. 18) · Datenübertragbarkeit (Art. 20) · Widerspruch (Art. 21)", "Kontakt für Datenschutzanfragen und Ausübung Ihrer Betroffenenrechte: support@nebenkostenradar.com (Antwort innerhalb von 30 Tagen gemäß Art. 12 Abs. 3 DSGVO)"] },
          { t: "8. Beschwerderecht", lines: ["Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig für Hessen: Der Hessische Beauftragte für Datenschutz und Informationsfreiheit, Postfach 3163, 65021 Wiesbaden."] },
          { t: "9. Aktualität", lines: ["Diese Datenschutzerklärung gilt ab " + new Date().toLocaleDateString("de-DE") + "."] },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.t}</div>
            {s.brand && <BrandAnschrift />}
            {s.lines.map((line, j) => {
              const isPlaceholder = line.startsWith("DEIN") || line.startsWith("DEINE");
              return <div key={j} style={{ fontSize: 13, color: isPlaceholder ? C.amber : C.muted, lineHeight: 1.8, marginBottom: 6, fontStyle: isPlaceholder ? "italic" : "normal" }}>{isPlaceholder ? "⚠ " + line : line}</div>;
            })}
          </div>
        ))}
        <div style={{ background: C.amberBg, border: "1px solid " + C.amber + "30", borderLeft: "3px solid " + C.amber, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: C.amber, lineHeight: 1.7 }}>
          Datenschutzerklärung vollständig. Aufsichtsbehörde: Hessen (korrekt für Frankfurt).
        </div>
      </div>
    </div>
  );


  if (step === "agb") return (
    <div style={root}>
      <div style={{ background: C.surface, padding: "20px 20px 16px", borderBottom: "1px solid " + C.border }}>
        <button onClick={() => setStep(prevStep || "result")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "0 0 10px", fontFamily: "inherit" }}>← Zurück</button>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Allgemeine Geschäftsbedingungen</h2>
      </div>
      <div style={{ padding: "24px 20px 60px" }}>
        {[
          { t: "§ 1 Geltungsbereich", lines: [
            "Diese AGB gelten für alle Käufe digitaler Inhalte über nebenkostenradar.com.",
            "Anbieter: NebenkostenRadar (nebenkostenradar.com), Inhaber: Stefan Hennig (Einzelunternehmer), Ludwigstr. 33-37, 60327 Frankfurt am Main, support@nebenkostenradar.com",
          ]},
          { t: "§ 2 Vertragsgegenstand", lines: [
            "Gegenstand ist die einmalige Freischaltung eines digitalen Prüfberichts zur Nebenkostenabrechnung.",
            "Der Vollbericht umfasst: vollständige Posten-Bewertung, Widerspruchsgründe mit Rechtsgrundlagen, Fristen, nächste Schritte und einen Muster-Widerspruchsbrief.",
          ]},
          { t: "§ 3 Vertragsschluss und Vertragsspeicherung", lines: [
            "Der Vertrag kommt mit Abschluss der Zahlung über Stripe zustande.",
            "Mit Klick auf 'Jetzt kaufen' und Abschluss der Zahlung erklärt der Käufer sein verbindliches Angebot.",
            "Der Vertragstext wird nach Vertragsschluss nicht gespeichert und ist nach Abschluss der Session nicht mehr zugänglich (§ 312i Abs. 1 Nr. 3 BGB).",
            "Vertragssprache: Deutsch.",
          ]},
          { t: "§ 4 Preise und Zahlung", lines: [
            "Der Preis beträgt " + CONFIG.PREIS.toFixed(2) + " Euro. Stefan Hennig ist Kleinunternehmer gemäß § 19 UStG; es wird keine Umsatzsteuer ausgewiesen.",
            "Zahlung über Stripe Payments Europe, Ltd. Akzeptierte Methoden: Kreditkarte, SEPA-Lastschrift u.a.",
            "Einmalzahlung — kein Abo, keine Folgekosten.",
          ]},
          { t: "§ 5 Lieferung und Zugang", lines: [
            "Der Vollbericht wird sofort nach erfolgreicher Zahlung im Browser freigeschaltet.",
            "Keine physische Lieferung. Der Inhalt steht im Browser zur Verfügung und kann kopiert werden.",
            "Es handelt sich um einen einmaligen Kauf — kein Abonnement, kein Dauerschuldverhältnis. Ein Kündigungsbutton gemäß § 312k BGB ist daher nicht erforderlich; es entstehen keine wiederkehrenden Kosten.",
          ]},
          { t: "§ 6 Widerrufsrecht", lines: [
            "Das Widerrufsrecht erlischt gemäß § 356 Abs. 5 BGB, wenn der Käufer ausdrücklich zugestimmt hat, dass mit der Ausführung sofort begonnen wird, und er zur Kenntnis genommen hat, dass er dadurch sein Widerrufsrecht verliert.",
            "Diese Zustimmung wird beim Kauf durch Aktivierung der Checkbox erteilt. Ohne Aktivierung ist ein Kauf nicht möglich.",
          ]},
          { t: "§ 7 Haftungsausschluss", lines: [
            "Der Prüfbericht ersetzt keine Rechtsberatung im Sinne des RDG. Eine Haftung für rechtliche Richtigkeit oder Vollständigkeit der Analyseergebnisse wird ausgeschlossen.",
            "Für rechtssichere Prüfung empfehlen wir den Deutschen Mieterbund oder einen Rechtsanwalt.",
          ]},
          { t: "§ 8 Schlussbestimmungen", lines: [
            "Es gilt deutsches Recht. Gerichtsstand ist Frankfurt am Main, sofern gesetzlich zulässig.",
            "Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen unberührt.",
          ]},
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.t}</div>
            {s.lines.map((line, j) => (
              <div key={j} style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 6 }}>{line}</div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 11, color: C.dim, marginTop: 16, lineHeight: 1.6 }}>
          Stand: 10.06.2026 · Stefan Hennig, Frankfurt am Main
        </div>
      </div>
    </div>
  );


  // ════════════════════════════════════════════════════════════════════════════
  // RATGEBER ÜBERSICHT
  // ════════════════════════════════════════════════════════════════════════════


  if (step === "ratgeber") return (
    <div style={root}>
      <Nav activeStep="ratgeber" />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px" }}>
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => setStep("welcome")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}>← Startseite</button>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Ratgeber Mietrecht</h1>
        <p style={{ fontSize: 15, color: C.muted, margin: "0 0 32px", lineHeight: 1.6 }}>Fundierte Informationen zu Nebenkostenabrechnungen, Fristen und Ihren Rechten als Mieter — kostenlos und aktuell.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ARTIKEL.map(a => (
            <div key={a.id} onClick={() => { setRatgeberArtikel(a.id); setStep("artikel"); }}
              style={{ background: "#fff", border: "1px solid " + C.border, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <img src={a.bild} alt={a.bildAlt} style={{ width: "100%", height: 180, objectFit: "cover" }} loading="lazy" />
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <span style={{ background: C.greenBg, color: C.green, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>{a.kategorie}</span>
                  <span style={{ color: C.dim, fontSize: 11 }}>{a.datum} · {a.lesezeit} Lesezeit</span>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 8px", lineHeight: 1.35 }}>{a.titel}</h2>
                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px", lineHeight: 1.6 }}>{a.teaser}</p>
                <span style={{ color: C.green, fontSize: 13, fontWeight: 600 }}>Artikel lesen →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LegalFooter setStep={setStep} setPrevStep={setPrevStep} currentStep="ratgeber" />
    </div>
  );

  // ── ARTIKEL ──────────────────────────────────────────────────────────────────
  if (step === "artikel") {
    const artikel = ARTIKEL.find(a => a.id === ratgeberArtikel);
    if (!artikel) return <div style={root}><p>Artikel nicht gefunden.</p></div>;
    return (
      <div style={root}>
        {/* Nav */}
        <div style={{ borderBottom: "2px solid " + C.border, padding: "0 20px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setStep("welcome")}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2.5px solid #fff" }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>NebenkostenRadar</span>
            </div>
            <button onClick={() => setStep("wohnung")}
              style={{ background: C.green, border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontFamily: "inherit", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              Jetzt prüfen
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 60px" }}>
          <button onClick={() => setStep("ratgeber")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: "0 0 20px" }}>← Ratgeber</button>

          {/* Hero Bild */}
          <img src={artikel.bild} alt={artikel.bildAlt} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 10, marginBottom: 24 }} />

          {/* Meta */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span style={{ background: C.greenBg, color: C.green, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, letterSpacing: "0.06em" }}>{artikel.kategorie}</span>
            <span style={{ color: C.dim, fontSize: 12 }}>{artikel.datum} · {artikel.lesezeit} Lesezeit</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 16px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>{artikel.titel}</h1>

          {/* Inhalt rendern */}
          {artikel.inhalt.map((block, i) => {
            if (block.typ === "intro") return <p key={i} style={{ fontSize: 16, color: C.text, lineHeight: 1.75, margin: "0 0 24px", fontWeight: 400, borderLeft: "3px solid " + C.green, paddingLeft: 16 }}>{block.text}</p>;
            if (block.typ === "h2") return <h2 key={i} style={{ fontSize: 19, fontWeight: 700, color: C.text, margin: "32px 0 12px", letterSpacing: "-0.01em" }}>{block.text}</h2>;
            if (block.typ === "text") return <p key={i} style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: "0 0 16px" }}>{block.text}</p>;
            if (block.typ === "liste") return (
              <ul key={i} style={{ margin: "0 0 20px", paddingLeft: 0, listStyle: "none" }}>
                {block.items.map((item, j) => (
                  <li key={j} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14, color: C.muted, lineHeight: 1.65, alignItems: "flex-start" }}>
                    <span style={{ color: C.green, flexShrink: 0, marginTop: 3, fontSize: 12, fontWeight: 700 }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            );
            if (block.typ === "schritte") return (
              <div key={i} style={{ margin: "0 0 24px" }}>
                {block.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", gap: 14, marginBottom: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.green, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{j+1}</div>
                    <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>
            );
            if (block.typ === "hinweis") return (
              <div key={i} style={{ background: C.greenBg, border: "1px solid " + C.green + "40", borderLeft: "3px solid " + C.green, borderRadius: 8, padding: "14px 16px", margin: "0 0 20px", fontSize: 13, color: C.text, lineHeight: 1.65 }}>
                {block.text}
              </div>
            );
            if (block.typ === "tabelle") return (
              <div key={i} style={{ overflowX: "auto", margin: "0 0 24px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  {block.zeilen.map((row, j) => (
                    <tr key={j} style={{ background: j === 0 ? C.text : j % 2 === 0 ? C.surface : "#fff", borderBottom: "1px solid " + C.border }}>
                      {row.map((cell, k) => (
                        j === 0
                          ? <th key={k} style={{ padding: "10px 12px", color: "#fff", textAlign: "left", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em" }}>{cell}</th>
                          : <td key={k} style={{ padding: "10px 12px", color: k === 0 ? C.text : C.muted, fontWeight: k === 0 ? 600 : 400 }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </table>
              </div>
            );
            if (block.typ === "cta") return (
              <div key={i} style={{ background: C.green, borderRadius: 10, padding: "18px 20px", margin: "24px 0", textAlign: "center" }}>
                <p style={{ color: "#fff", fontSize: 14, margin: "0 0 12px", lineHeight: 1.6 }}>{block.text}</p>
                <button onClick={() => setStep("wohnung")}
                  style={{ background: "#fff", border: "none", borderRadius: 6, padding: "10px 24px", fontSize: 14, fontFamily: "inherit", fontWeight: 700, color: C.green, cursor: "pointer" }}>
                  Kostenlos prüfen →
                </button>
              </div>
            );
            return null;
          })}

          {/* Weitere Artikel */}
          <div style={{ borderTop: "1px solid " + C.border, paddingTop: 24, marginTop: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Weitere Artikel</div>
            {ARTIKEL.filter(a => a.id !== artikel.id).map(a => (
              <div key={a.id} onClick={() => setRatgeberArtikel(a.id)}
                style={{ display: "flex", gap: 12, marginBottom: 12, cursor: "pointer", padding: "10px", borderRadius: 8, border: "1px solid " + C.border }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <img src={a.bild} alt={a.bildAlt} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} loading="lazy" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 4 }}>{a.titel}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{a.datum} · {a.lesezeit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <LegalFooter setStep={setStep} setPrevStep={setPrevStep} currentStep="artikel" />
      </div>
    );
  }

  // ── ÜBER UNS ─────────────────────────────────────────────────────────────────
  if (step === "ueberuns") return (
    <div style={root}>
      <div style={{ borderBottom: "2px solid " + C.border, padding: "0 20px", background: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setStep("welcome")}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2.5px solid #fff" }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>NebenkostenRadar</span>
          </div>
          <button onClick={() => setStep("wohnung")}
            style={{ background: C.green, border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontFamily: "inherit", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
            Jetzt prüfen
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px" }}>
        <button onClick={() => setStep("welcome")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: "0 0 20px" }}>← Startseite</button>

        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80" alt="Modernes Bürogebäude in Frankfurt" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 10, marginBottom: 28 }} />

        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 16px", letterSpacing: "-0.02em" }}>Über NebenkostenRadar</h1>

        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.75, margin: "0 0 28px" }}>
          NebenkostenRadar ist ein unabhängiger digitaler Prüfdienst für Nebenkostenabrechnungen. Wir helfen Mietern in Deutschland, ihre Betriebskostenabrechnungen auf Fehler, überhöhte Posten und nicht umlagefähige Kosten zu überprüfen — schnell, transparent und ohne juristische Vorkenntnisse.
        </p>

        {[
          { titel: "Unser Ansatz", text: "Wir kombinieren systematische Regelprüfung nach BetrKV, HeizkostenV und CO₂KostAufG mit dem aktuellen DMB-Betriebskostenspiegel. Jeder Posten wird automatisch auf Zulässigkeit und Plausibilität geprüft. Das Ergebnis ist nachvollziehbar, mit konkreten Rechtsgrundlagen belegt." },
          { titel: "Unabhängigkeit", text: "NebenkostenRadar hat keine Verbindungen zu Vermietern, Hausverwaltungen oder Immobiliengesellschaften. Wir arbeiten ausschließlich im Interesse der Mieter. Unsere Prüfergebnisse sind nicht käuflich." },
          { titel: "Aktualität", text: "Gesetzliche Änderungen — wie das Ende des Kabelanschluss-Nebenkostenprivilegs im Juli 2024 — fließen unmittelbar in unsere Prüflogik ein. Richtwerte werden jährlich nach dem DMB-Betriebskostenspiegel aktualisiert." },
          { titel: "Transparenz bei den Kosten", text: "Die Basisanalyse ist kostenlos und ohne Registrierung verfügbar. Der vollständige Prüfbericht mit Widerspruchsbrief kostet einmalig €7,99 — ohne Abo, ohne versteckte Folgekosten." },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < 3 ? "1px solid " + C.border : "none" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>{s.titel}</h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: 0 }}>{s.text}</p>
          </div>
        ))}

        <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 10, padding: "18px 20px", marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Kontakt</div>
          <BrandAnschrift />
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 2 }}>
            <div>Inhaber: Stefan Hennig (Einzelunternehmer)</div>
            <div>Ludwigstr. 33-37, 60327 Frankfurt am Main</div>
            <div>support@nebenkostenradar.com</div>
          </div>
        </div>
      </div>
      <LegalFooter setStep={setStep} setPrevStep={setPrevStep} currentStep="ueberuns" />
    </div>
  );

  return null;
}
