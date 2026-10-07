import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Brush, ReferenceLine, ReferenceDot, Cell,
} from "recharts";

const URL_SAL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqXET4bpJAIlB2zIGFeN2D4w4_O2_xf0Z9knA0HTaWtMdaN3N7OXX7WCstqKiabiNdSXQhmd4nXM9V/pub?output=csv";
const URL_PRE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQupnKrc5VTLand2DPyEjjeHGqN4IemircxRnpT-UdZPyK5pJx5UE31SEUEKbe1kFTmOlRUpTXupJc1/pub?gid=137040153&single=true&output=csv";

const LOGO_UEPC = "data:image/png;base64,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";

const RUBROS = [
  "Enseñanza Inicial Y Primaria",
  "Enseñanza Media Y Técnica",
  "Enseñanza Superior Y Universitaria",
  "Administración De La Educación",
  "Regímenes Especiales",
];
const RSHORT = {
  "Enseñanza Inicial Y Primaria": "Ini+Prim",
  "Enseñanza Media Y Técnica": "Media+Téc",
  "Enseñanza Superior Y Universitaria": "Superior",
  "Administración De La Educación": "Administración",
  "Regímenes Especiales": "Reg.Esp.",
};
const RCOL = {
  "Enseñanza Inicial Y Primaria": "#2f6f9f",
  "Enseñanza Media Y Técnica": "#e8892b",
  "Enseñanza Superior Y Universitaria": "#7b5ea7",
  "Administración De La Educación": "#a39b91",
  "Regímenes Especiales": "#3c9a9c",
};
// Nombre para mostrar: "Enseñanza Inicial Y Primaria" -> "Enseñanza Inicial y Primaria"
const RNOMBRE = (r) => r.replace(/ Y /g, " y ").replace(/ De La /g, " de la ");

// ── Utilidades ────────────────────────────────────────────────

function parseNum(s) {
  if (!s || s.trim() === "" || s.trim() === "-") return 0;
  let cleaned = s.replace(/\$/g, "").replace(/\s/g, "");
  // Detectar formato: si hay comas y el último segmento tras la última coma
  // tiene exactamente 3 dígitos → coma es separador de miles (formato $111,519,468,311)
  // Si hay punto con 2 decimales al final → punto es decimal
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");
  if (hasComma && !hasDot) {
    // Solo comas: todas son separadores de miles → eliminarlas
    cleaned = cleaned.replace(/,/g, "");
  } else if (hasDot && hasComma) {
    // Ambos: el punto puede ser decimal y la coma separador de miles
    // ej: "1.234,56" (europeo) o "1,234.56" (anglosajón)
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot   = cleaned.lastIndexOf(".");
    if (lastDot > lastComma) {
      // anglosajón: "1,234.56" → quitar comas
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // europeo: "1.234,56" → quitar puntos, coma→punto
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }
  } else if (hasDot && !hasComma) {
    // Solo punto — puede ser decimal o separador de miles
    const parts = cleaned.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      // Probablemente separador de miles: "27.751.162" → quitar puntos
      cleaned = cleaned.replace(/\./g, "");
    }
    // Si no, dejarlo como está (decimal normal)
  }
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function fmtP(n) {
  if (!n && n !== 0) return "–";
  const a = Math.abs(n), sg = n < 0 ? "-" : "";
  if (a >= 1e12) return sg + "$" + (a / 1e12).toLocaleString("es-AR", { maximumFractionDigits: 2 }) + " B";
  if (a >= 1e9)  return sg + "$" + (a / 1e9).toLocaleString("es-AR",  { maximumFractionDigits: 1 }) + " MM";
  if (a >= 1e6)  return sg + "$" + (a / 1e6).toLocaleString("es-AR",  { maximumFractionDigits: 1 }) + " M";
  return sg + "$" + a.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function csvSplit(line) {
  const r = []; let cur = "", q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === "," && !q) { r.push(cur); cur = ""; continue; }
    cur += ch;
  }
  r.push(cur);
  return r;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const hdr = csvSplit(lines[0]).map((h) => h.trim());
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const vals = csvSplit(line);
    const obj = {};
    hdr.forEach((h, i) => { obj[h] = (vals[i] || "").trim(); });
    return obj;
  });
}

// ── Fetch con proxy CORS ──────────────────────────────────────

async function fetchCSV(url) {
  // Intentar directo primero (Google Sheets publicados tienen CORS abierto)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const text = await res.text();
      if (text.includes(",") && text.includes("\n")) return text;
    }
  } catch (e) {
    // ignorar, intentar proxies
  }
  // Fallback a proxies
  const proxies = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];
  let lastError = "";
  for (const makeProxy of proxies) {
    try {
      const res = await fetch(makeProxy(url), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes(",") && text.includes("\n")) return text;
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error("Todos los métodos fallaron: " + lastError);
}

// ── Configuración del salario ─────────────────────────────────
// Cargos a mostrar: "cols" son los nombres de columna en la planilla (se comparan sin espacios)
const CARGOS = [
  { id: "m0",  nombre: "Maestra inicial", detalle: "sin antigüedad",        corto: "Maestra · 0 años",  cols: ["Maestra - 0"],  color: "#d6007a" },
  { id: "m30", nombre: "Maestra",         detalle: "30 años de antigüedad", corto: "Maestra · 30 años", cols: ["Maestra - 30"], color: "#7b2d8e" },
];

// Paritaria vigente (acuerdo aceptado el 20/04/2026, vigencia feb-26 a ene-27).
// "base" = último mes del acuerdo anterior: la variación "desde la paritaria" compara contra ese mes.
// Cuando haya una paritaria nueva, cambiar solo estas líneas.
const PARITARIA = {
  base: "ene-26",
  inicio: "feb-26",
  etiqueta: "Paritaria 2026",
  ajuste: "Cláusula IPC",
  ajusteDetalle: "rige de may-26 a ene-27 · acuerdo feb-26 a ene-27",
};

// Pérdida acumulada: se mide contra el salario real del mes "base" (pico de la serie).
// Si el mes no existe en los datos, se usa el máximo de cada cargo.
const PERDIDA = { base: "feb-17" };

// Previsión Presupuestaria de Educación (programa 705, subprograma 2).
// Se calcula pero hoy NO se muestra en el monitor (pendiente definir cómo presentarla).
const RESERVA = { programa: 705, subprograma: 2 };
const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
// "sep-26" -> "septiembre de 2026"
const mesLargo = (lbl) => {
  const i = MESES.indexOf((lbl || "").slice(0, 3));
  return i >= 0 ? `${MESES_LARGO[i]} de 20${lbl.slice(-2)}` : lbl;
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const yearOf = (s) => parseInt(((s || "").match(/(\d{4})/) || [])[1]);

// ── Procesamiento salario ─────────────────────────────────────
// La planilla viene en pesos constantes del último IPC disponible (se re-expresa cada mes).

function processSalario(text) {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  if (lines.length < 2) return null;
  const hdr = csvSplit(lines[0]).map((h) => h.trim());
  const filas = lines.slice(1).map(csvSplit);
  const norm = (s) => s.toLowerCase().replace(/\s/g, "");
  const colExact  = (...names) => hdr.findIndex((h) => names.some((n) => norm(h) === norm(n)));
  const colStarts = (...pref)  => hdr.findIndex((h) => pref.some((p) => norm(h).startsWith(norm(p))));

  const iLP = colStarts("LP (hogar", "LP");
  const iLI = colStarts("LI (hogar", "LI");
  const cargoCol = Object.fromEntries(CARGOS.map((c) => [c.id, colExact(...c.cols)]));
  const i0 = cargoCol[CARGOS[0].id];
  if (i0 < 0 || iLP < 0) return null;

  // Algunas filas de la planilla pueden quedar corridas una columna a la derecha
  // (celda de Maestra-0 vacía y el salario en la columna siguiente). Se detecta y se corrige por fila.
  const data = [];
  filas.forEach((f) => {
    if (!yearOf(f[0])) return;
    let off = 0;
    if (!(parseNum(f[i0]) > 50000)) {
      if (parseNum(f[i0 + 1]) > 50000) off = 1;
      else return; // fila sin salario (totales, notas)
    }
    data.push({ etiqueta: f[0], off, v: (i) => (i >= 0 ? parseNum(f[i + off]) : 0) });
  });
  if (!data.length) return null;

  // Etiquetas "jun-16": la planilla usa "j 2016", ambiguo entre junio y julio.
  // Se reconstruye el mes por posición (filas mensuales consecutivas; el primer año arranca a mitad de año).
  const nPorAnio = {};
  data.forEach((r) => { const y = yearOf(r.etiqueta); nPorAnio[y] = (nPorAnio[y] || 0) + 1; });
  const primerAnio = yearOf(data[0].etiqueta);
  const vistos = {};
  const labels = data.map((r) => {
    const y = yearOf(r.etiqueta);
    vistos[y] = (vistos[y] ?? -1) + 1;
    const m = (y === primerAnio ? 12 - nPorAnio[y] : 0) + vistos[y];
    return m >= 0 && m <= 11 ? `${MESES[m]}-${String(y).slice(-2)}` : r.etiqueta;
  });
  const filasCorridas = labels.filter((_, i) => data[i].off === 1);

  const lp = data.map((r) => r.v(iLP));
  const li = data.map((r) => r.v(iLI));
  const L  = data.length - 1;
  const pct = (a, b) => (a > 0 && b > 0 ? (a / b - 1) * 100 : null);
  const iBase = labels.indexOf(PARITARIA.base);

  const cargos = {};
  CARGOS.forEach((c) => {
    const col = cargoCol[c.id];
    if (col < 0) return;
    const s = data.map((r) => r.v(col));
    let mesesBajo = 0;
    s.forEach((v, i) => { if (lp[i] > 0 && v < lp[i]) mesesBajo++; });
    const iBaseP = labels.indexOf(PERDIDA.base);
    const iPico = iBaseP >= 0 ? iBaseP : s.indexOf(Math.max(...s));
    let perdida = 0;
    s.forEach((v, i) => { if (i > iPico) perdida += Math.max(0, s[iPico] - v); });
    cargos[c.id] = {
      ...c,
      serie: s,
      last: s[L],
      perdida,
      mesesBajo,
      picoLabel: labels[iPico],
      picoValor: s[iPico],
      varPico: pct(s[L], s[iPico]),
      varMensual:    L > 0  ? pct(s[L], s[L - 1])  : null,
      varInteranual: L >= 12 ? pct(s[L], s[L - 12]) : null,
      varParitaria:  iBase >= 0 && iBase < L ? pct(s[L], s[iBase]) : null,
      pctLP: lp[L] > 0 ? (s[L] / lp[L]) * 100 : null,
    };
  });

  const brechaData = labels.map((l, i) => {
    const o = { label: l, lp: lp[i], li: li[i] };
    Object.values(cargos).forEach((c) => { o[c.id] = c.serie[i]; });
    return o;
  });

  return {
    labels, brechaData, L, cargos,
    desde: labels[0],
    lastLabel: labels[L],
    prevLabel: L > 0 ? labels[L - 1] : null,
    yoyLabel: L >= 12 ? labels[L - 12] : null,
    lastLP: lp[L],
    lastLI: li[L],
    // Si la LP del último mes es idéntica a la del anterior, todavía no se publicó la nueva
    lpRepetida: L > 0 && lp[L] === lp[L - 1],
    yearTicks: labels.filter((l) => l.startsWith("ene-")),
    hayParitaria: iBase >= 0 && iBase < L,
    filasCorridas,
  };
}

// ── Equivalencias para la pérdida acumulada ───────────────────
// PRECIOS DE MARZO 2026 (provistos por UEPC). Pendiente: actualizar a valores actuales.
// La pérdida está expresada en pesos del último IPC, así que conviene usar precios del mismo mes.
const EQUIVALENCIAS = [
  // Autos
  { emoji: "🚗", categoria: "Auto", nombre: "Toyota Corolla 2024", precio: 47000000 },
  { emoji: "🚗", categoria: "Auto", nombre: "Volkswagen Polo 2024", precio: 37000000 },
  { emoji: "🚗", categoria: "Auto", nombre: "Renault Sandero 2020", precio: 21000000 },
  { emoji: "🚗", categoria: "Auto", nombre: "Ford Fiesta 2015", precio: 15000000 },
  { emoji: "🚗", categoria: "Auto", nombre: "Chevrolet Onix 2023", precio: 24000000 },
  { emoji: "🚗", categoria: "Auto", nombre: "Peugeot 208 2024", precio: 23000000 },
  { emoji: "🚗", categoria: "Auto", nombre: "Toyota Hilux 2020", precio: 47000000 },
  // Propiedades
  { emoji: "🏠", categoria: "Propiedad", nombre: "Casa en Agua de Oro", precio: 60000000 },
  { emoji: "🏠", categoria: "Propiedad", nombre: "Cochera cubierta en Córdoba", precio: 22000000 },
  { emoji: "🏠", categoria: "Propiedad", nombre: "Lote 250m² en barrio privado", precio: 42000000 },
  { emoji: "🏠", categoria: "Propiedad", nombre: "Local Comercial Cofico", precio: 47000000 },
  // Viajes
  { emoji: "✈️", categoria: "Viaje", nombre: "Paquete Roma 15 días (2 personas)", precio: 8500000 },
  { emoji: "✈️", categoria: "Viaje", nombre: "Paquete Punta Cana 10 días (2 personas)", precio: 6435000 },
  { emoji: "✈️", categoria: "Viaje", nombre: "Paquete Brasil 10 días (familia 4)", precio: 3861000 },
  { emoji: "✈️", categoria: "Viaje", nombre: "Vacaciones Bariloche 7 días (familia)", precio: 3100000 },
  { emoji: "✈️", categoria: "Viaje", nombre: "Paquete Cancún 12 días (familia 4)", precio: 8294000 },
];

// Elige al azar un bien que alcance a comprarse al menos una vez con la pérdida
function getEquivalencia(perdida) {
  if (!perdida || perdida <= 0) return null;
  const opciones = EQUIVALENCIAS
    .map((e) => {
      const exacta = perdida / e.precio;
      const cantidad = exacta - Math.floor(exacta) >= 0.05 ? +exacta.toFixed(1) : Math.floor(exacta);
      return { ...e, exacta, cantidad };
    })
    .filter((e) => e.exacta >= 1);
  if (!opciones.length) return null;
  return opciones[Math.floor(Math.random() * opciones.length)];
}

const fmtPct = (v) =>
  v == null ? "–" : (v >= 0 ? "+" : "") + v.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const fmtPct0 = (v) =>
  v == null ? "–" : v.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const fmtFull = (n) => (n || n === 0 ? (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("es-AR") : "–");
// "$29,2 millones" / "$385.900 millones"
const fmtMill = (n) => "$" + (n / 1e6).toLocaleString("es-AR", { maximumFractionDigits: n >= 1e9 ? 0 : 1 }) + " millones";
const fmtCant = (v) => v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
const colVar = (v) => (v == null ? "#9a9088" : v >= 0 ? "#1a6b3a" : "#a82018");
const bgVar  = (v) => (v == null ? "white"   : v >= 0 ? "#e8f7ef" : "#fde8e4");

// ── Procesamiento presupuesto ─────────────────────────────────
// Los valores en el CSV vienen en PESOS corrientes (sin escala)

function processPres(text) {
  const rows = parseCSV(text);
  if (!rows.length) return null;

  // byAR[año][rubro] = { vig ($), dev ($), ipc }
  const byAR = {};
  const extra = {}; // por año: original, mes de la medición, reserva

  rows.forEach((r) => {
    const anio = parseInt(r["Año"]);
    if (isNaN(anio) || anio < 2010) return;

    const det = (r["Detalle"] || "").trim();
    if (!RUBROS.includes(det)) return;

    const vig = parseNum(r["Presupuesto vigente"]);
    const dev = parseNum(r["Presupuesto devengado"]);
    const origTxt = r["Presupuesto original"] || "";
    const mes = parseInt(r["Mes"]);
    if (!extra[anio]) extra[anio] = { orig: 0, origInvalido: false, mes: 0, resVig: 0, resDev: 0 };
    extra[anio].orig += parseNum(origTxt);
    if (origTxt.includes("#")) extra[anio].origInvalido = true;   // celdas con error en la planilla
    if (!isNaN(mes)) extra[anio].mes = Math.max(extra[anio].mes, mes);
    if (parseInt(r["Programa"]) === RESERVA.programa && parseInt(r["Subprograma"]) === RESERVA.subprograma) {
      extra[anio].resVig += vig;
      extra[anio].resDev += dev;
    }

    if (!byAR[anio]) byAR[anio] = {};
    if (!byAR[anio][det]) byAR[anio][det] = { vig: 0, dev: 0 };
    byAR[anio][det].vig += vig;
    byAR[anio][det].dev += dev;
  });

  const anos  = Object.keys(byAR).map(Number).sort();
  if (!anos.length) return null;

  // Último año con al menos un rubro con vigente > 0
  const anosConDatos = anos.filter((a) =>
    RUBROS.some((r) => (byAR[a]?.[r]?.vig || 0) > 0)
  );
  const lastA = anosConDatos.length ? anosConDatos[anosConDatos.length - 1] : anos[anos.length - 1];

  // Totales (valores ya deflactados en el CSV)
  const totalVig = (a) => RUBROS.reduce((s, r) => s + (byAR[a]?.[r]?.vig || 0), 0);
  const totalDev = (a) => RUBROS.reduce((s, r) => s + (byAR[a]?.[r]?.dev || 0), 0);

  const getDatosAnio = (a) => {
    const tvA    = totalVig(a);
    const tdA    = totalDev(a);
    const ejecPct = tvA > 0 ? (tdA / tvA) * 100 : 0;

    // Variación real del VIGENTE vs año anterior (valores ya deflactados)
    const vigAnt = totalVig(a - 1);
    const varR = vigAnt > 0
      ? (tvA / vigAnt - 1) * 100
      : 0;

    // Para gráfico: en miles de millones ($) — incluye rubros aunque dev=0
    const ejData = RUBROS.filter((r) => byAR[a]?.[r] && byAR[a][r].vig > 0).map((r) => ({
      rubro: RSHORT[r],
      vig: +(byAR[a][r].vig / 1e9).toFixed(2),
      dev: +(byAR[a][r].dev / 1e9).toFixed(2),
    }));

    // Para tabla: en $ (fmtP formatea)
    const tableRows = RUBROS.filter((r) => byAR[a]?.[r] && byAR[a][r].vig > 0).map((r) => {
      const cur  = byAR[a][r];
      const prev = byAR[a - 1]?.[r];
      const delta = prev?.vig > 0 ? (cur.vig / prev.vig - 1) * 100 : null;
      const ep    = cur.vig > 0 ? (cur.dev / cur.vig) * 100 : 0;
      return { r, vig: cur.vig, dev: cur.dev, ep, delta };
    });

    const e = extra[a] || {};
    const mes = e.mes || 12;
    const resVig = e.resVig || 0;
    const vigSinRes = tvA - resVig;
    const ejecSinRes = vigSinRes > 0 ? ((tdA - (e.resDev || 0)) / vigSinRes) * 100 : 0;
    const varVigOrig = !e.origInvalido && e.orig > 0 ? (tvA / e.orig - 1) * 100 : null;
    return {
      tvA, tdA, ejecPct, varR, ejData, tableRows,
      tOrig: e.orig || 0, origInvalido: !!e.origInvalido, varVigOrig,
      mes, pctAnio: (mes / 12) * 100, enCurso: mes < 12,
      resVig, pctRes: tvA > 0 ? (resVig / tvA) * 100 : 0, ejecSinRes,
    };
  };

  // Evolución histórica: valores ya en pesos constantes, convertir a miles de millones
  const evolData = anosConDatos.map((a) => {
    const obj = { ano: a };
    RUBROS.forEach((r) => {
      const d = byAR[a]?.[r];
      obj[RSHORT[r]] = d && d.vig > 0 ? +((d.vig) / 1e9).toFixed(2) : 0;
    });
    return obj;
  });

  return { anos, anosConDatos, lastA, evolData, getDatosAnio };
}

// ── Componentes UI ────────────────────────────────────────────

const Tag = ({ c, children }) => {
  const bg = { red: "#c0321e", orange: "#d4631a", blue: "#1e5f8a", green: "#2a7a4a", dark: "#1a1714" }[c] || "#1a1714";
  return (
    <span style={{ display: "inline-block", background: bg, color: "white", fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 2, marginBottom: 8 }}>
      {children}
    </span>
  );
};

const Card = ({ children, dark, redBg, blueBg, style }) => (
  <div style={{ background: dark ? "#1a1714" : redBg ? "#fdf0ee" : blueBg ? "#eef4fa" : "white", color: dark ? "white" : "#1a1714", padding: "1.3rem 1.5rem", minWidth: 0, overflow: "hidden", ...style }}>
    {children}
  </div>
);

const Grid = ({ cols, children, style }) => (
  <div style={{ display: "grid", gridTemplateColumns: cols, gap: 1, background: "#ddd8d0", ...style }}>
    {children}
  </div>
);

const Sec = ({ num, title }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: "2px solid #1a1714", paddingBottom: 8, marginBottom: 16 }}>
    <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", letterSpacing: "0.1em" }}>{num}</span>
    <span style={{ fontFamily: "Georgia,serif", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</span>
  </div>
);

const Prog = ({ label, right, pct, color }) => {
  const c = { red: "#c0321e", orange: "#d4631a", blue: "#1e5f8a", green: "#2a7a4a" }[color] || color;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#9a9088", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: c, fontWeight: 600 }}>{right}</span>
      </div>
      <div style={{ height: 8, background: "#ddd8d0", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: c, borderRadius: 2 }} />
      </div>
    </div>
  );
};

const TTip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1714", border: "1px solid #3d3830", padding: "8px 12px", borderRadius: 2, maxWidth: 260 }}>
      <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#e8e2d9", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => {
        const col = p.color || p.stroke || "#9a9088";
        return (
          <div key={i} style={{ fontFamily: "monospace", fontSize: "0.6rem", color: col, marginBottom: 2 }}>
            {p.name}: {fmt ? fmt(p.value) : p.value}
          </div>
        );
      })}
    </div>
  );
};

// Tooltip del gráfico de presupuesto: rubros + total, en billones
const TTipPres = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const tot = payload.reduce((s, p) => s + (p.value || 0), 0);
  const f = (v) => "$" + (v / 1000).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " B";
  return (
    <div style={{ background: "#1a1714", border: "1px solid #3d3830", padding: "8px 12px", borderRadius: 2 }}>
      <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#e8e2d9", marginBottom: 4 }}>{label} · total {f(tot)}</div>
      {[...payload].reverse().map((p) => (
        <div key={p.dataKey} style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "#d8d2c9", marginBottom: 2, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, background: p.fill, display: "inline-block", borderRadius: 1 }} />{p.name}: {f(p.value)}
        </div>
      ))}
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────

export default function App() {
  const [sal, setSal]         = useState(null);
  const [pre, setPre]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [anoSel, setAnoSel]   = useState(null);
  const [cargoSel, setCargoSel] = useState("m0");

  async function load() {
    setLoading(true);
    setErr("");
    setSal(null);
    setPre(null);
    try {
      const [st, pt] = await Promise.all([fetchCSV(URL_SAL), fetchCSV(URL_PRE)]);
      const salData = processSalario(st);
      const preData = processPres(pt);
      setSal(salData);
      setPre(preData);
      if (preData) setAnoSel(preData.lastA);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const cs = sal ? sal.cargos[cargoSel] || Object.values(sal.cargos)[0] : null;
  const bLP = cs ? sal.lastLP - cs.last : 0;          // > 0: le falta para la LP
  const bajoLP = bLP > 0;
  const pLP = cs ? (sal.lastLP / cs.last - 1) * 100 : 0;
  const bLI = cs ? cs.last - sal.lastLI : 0;
  const datosAnio = pre && anoSel ? pre.getDatosAnio(anoSel) : null;

  // Se sortea una vez por carga de datos / cambio de cargo (no en cada re-render)
  const equiv = useMemo(() => (cs ? getEquivalencia(cs.perdida) : null), [cs]);

  return (
    <div style={{ background: "#f5f2ee", minHeight: "100vh", fontFamily: "system-ui,sans-serif", fontSize: 14 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 1px; background: #ddd8d0; }
        .grid-3   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #ddd8d0; }
        .grid-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #ddd8d0; }
        .grid-1   { display: grid; grid-template-columns: 1fr; gap: 1px; background: #ddd8d0; }
        .sit-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #ddd8d0; }
        .ind-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #ddd8d0; flex: 1; }
        .brecha-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
        .cargo-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .cargo-toggle { display: inline-flex; flex-wrap: wrap; background: #e8e3dc; border-radius: 4px; padding: 3px; gap: 3px; }
        .cargo-toggle button { border: 0; background: transparent; padding: 8px 14px; border-radius: 3px; cursor: pointer; font-size: 0.82rem; font-weight: 600; color: #5a524a; display: inline-flex; align-items: center; gap: 7px; font-family: inherit; }
        .cargo-toggle button .sub { font-weight: 400; color: #9a9088; }
        .cargo-toggle button.on { background: #1a1714; color: white; }
        .cargo-toggle button.on .sub { color: #aaa49c; }
        .cargo-toggle .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
        .cargo-note { font-family: monospace; font-size: 0.66rem; color: #9a9088; }
        .rubros { display: flex; flex-direction: column; }
        .rubro { display: grid; grid-template-columns: minmax(200px, 2.2fr) 1fr 1fr minmax(180px, 2fr) 1.2fr; gap: 16px; align-items: center; padding: 11px 4px; border-bottom: 1px solid #f0ece6; font-size: 0.85rem; }
        .rubro-hdr { font-family: monospace; font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.08em; color: #9a9088; border-bottom: 2px solid #1a1714; padding-top: 0; }
        .rubro .num { text-align: right; font-family: monospace; font-size: 0.8rem; }
        .rubro-hdr .num { font-size: 0.58rem; }
        .rubro-nom { display: flex; align-items: center; font-weight: 500; color: #1a1714; }
        .rubro-ej { display: flex; align-items: center; gap: 10px; }
        .rubro-barra { position: relative; flex: 1; height: 10px; background: #ede9e3; border-radius: 2px; }
        .rubro-lbl { display: none; }
        .frase { margin: 1.6rem 1.5rem 0; padding: 1.3rem 1.6rem; background: white; border-left: 5px solid #d6007a; }
        .frase-k { font-family: monospace; font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: #d6007a; margin-bottom: 8px; font-weight: 700; }
        .frase-t { font-family: Georgia, serif; font-size: clamp(1.15rem, 2.2vw, 1.55rem); line-height: 1.4; color: #1a1714; margin: 0; }
        .frase-t strong { color: #d6007a; }
        .frase-s { font-size: 0.9rem; color: #5a524a; margin: 10px 0 0; line-height: 1.5; }
        .hdr { background: #1a1714; color: white; padding: 1.4rem 2rem 1.3rem; display: flex; flex-wrap: wrap; gap: 1rem 2rem; justify-content: space-between; align-items: center; }
        .hdr-izq { display: flex; align-items: center; gap: 1.4rem; flex-wrap: wrap; }
        .hdr-logo { height: 56px; width: auto; display: block; }
        .hdr-sep { width: 1px; align-self: stretch; background: rgba(255,255,255,0.18); }
        .hdr-der { text-align: right; }
        .hdr-btn { margin-top: 6px; background: none; border: 1px solid #555; color: #bbb; font-family: monospace; font-size: 0.6rem; padding: 3px 8px; cursor: pointer; border-radius: 2px; display: block; margin-left: auto; }
        @media (max-width: 600px) {
          .grid-1-2, .grid-3, .grid-2 { grid-template-columns: 1fr !important; }
          .sit-grid { grid-template-columns: 1fr !important; }
          .ind-grid { grid-template-columns: 1fr !important; }
          .brecha-inner { grid-template-columns: 1fr !important; }
          .ind-cell { min-height: 0 !important; padding: 1.1rem 1rem !important; }
          .hdr { padding: 1.1rem 1.1rem 1rem; }
          .hdr-logo { height: 42px; }
          .hdr-sep { display: none; }
          .hdr-der { text-align: left; }
          .hdr-btn { margin-left: 0; }
          .rubro-hdr { display: none !important; }
          .rubro { grid-template-columns: 1fr 1fr; gap: 6px 12px; padding: 14px 2px; }
          .rubro-nom { grid-column: 1 / -1; font-size: 0.95rem; }
          .rubro-ej { grid-column: 1 / -1; }
          .rubro .num { text-align: left; white-space: nowrap; font-size: 0.74rem; }
          .rubro-lbl { display: inline; font-family: system-ui, sans-serif; color: #9a9088; font-size: 0.72rem; }
          .cargo-toggle { width: 100%; }
          .cargo-toggle button { flex: 1 1 100%; justify-content: flex-start; }
          .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .hide-mobile { display: none !important; }
          .brush-label { display: none; }
        }
      `}</style>

      {/* HEADER */}
      <div className="hdr">
        <div className="hdr-izq">
          <img src={LOGO_UEPC} alt="UEPC Capital" className="hdr-logo" />
          <div className="hdr-sep" />
          <div>
            <div style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa49c", marginBottom: 6 }}>
              UEPC · Secretaría de Estadística · Córdoba
            </div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: "2.4rem", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em" }}>
              Monitor <span style={{ color: "#f0368f", fontStyle: "italic" }}>Educativo</span>
            </div>
            <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#aaa49c" }}>
              Salario docente · Presupuesto educativo provincial
            </div>
          </div>
        </div>
        <div className="hdr-der">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 10px", fontFamily: "monospace", fontSize: "0.6rem", color: "#aaa49c", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <span style={{ width: 5, height: 5, background: loading ? "#facc15" : err ? "#c0321e" : "#4ade80", borderRadius: "50%", display: "inline-block" }} />
            {loading ? "Cargando…" : err ? "Error" : "Datos actualizados"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "#8a847c", marginTop: 6 }}>
            {sal ? `Último dato salarial: ${sal.lastLabel}` : ""}
          </div>
          {!loading && (
            <button onClick={load} className="hdr-btn">↻ Actualizar</button>
          )}
        </div>
      </div>

      {err && (
        <div style={{ background: "#fdf0ee", borderBottom: "2px solid #c0321e", color: "#c0321e", padding: "0.7rem 2rem", fontFamily: "monospace", fontSize: "0.7rem" }}>
          ⚠ Error: {err}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "5rem", color: "#9a9088", fontFamily: "monospace", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #ddd8d0", borderTopColor: "#1a1714", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1.2rem" }} />
          Cargando datos desde Google Sheets…
          <div style={{ fontSize: "0.65rem", marginTop: 8, color: "#bbb" }}>Puede tardar unos segundos</div>
        </div>
      )}

      {!loading && !err && (
        <>
          {/* ── FRASE DEL MES (se genera sola con los datos) ── */}
          {sal && sal.cargos.m0 && (
            <div className="frase">
              <div className="frase-k">El dato del mes</div>
              <p className="frase-t">
                En {mesLargo(sal.lastLabel)}, una maestra inicial cobra <strong>{fmtFull(sal.cargos.m0.last)}</strong>: el <strong>{fmtPct0(sal.cargos.m0.pctLP)}</strong> de lo que necesita una familia tipo para no ser pobre.
                {sal.cargos.m0.perdida > 0 && <> Desde {mesLargo(sal.cargos.m0.picoLabel)}, su mejor salario real, dejó de cobrar <strong>{fmtMill(sal.cargos.m0.perdida)}</strong>.</>}
              </p>
            </div>
          )}

          {/* ── S1: SALARIO ── */}
          <div style={{ padding: "0 1.5rem", marginTop: "2rem" }}>
            <Sec num="01" title="Salario Real Docente" />

            {sal && cs && (
              <>
                {/* Selector de cargo */}
                <div className="cargo-bar">
                  <div className="cargo-toggle" role="tablist" aria-label="Cargo">
                    {Object.values(sal.cargos).map((c) => (
                      <button key={c.id} role="tab" aria-selected={cargoSel === c.id} className={cargoSel === c.id ? "on" : ""} onClick={() => setCargoSel(c.id)}>
                        <span className="dot" style={{ background: c.color }} />
                        {c.nombre} <span className="sub">· {c.detalle}</span>
                      </button>
                    ))}
                  </div>
                  <div className="cargo-note">
                    Valores en pesos constantes del último IPC disponible · último dato: <strong>{sal.lastLabel}</strong>
                  </div>
                </div>

                {/* Fila 1: Pérdida acumulada (1/3) + indicadores (2/3) */}
                <div className="grid-1-2" style={{ marginBottom: 1 }}>
                  <Card dark>
                    <Tag c="red">Pérdida acumulada</Tag>
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.5 }}>
                      Lo que dejó de cobrar una <strong style={{ color: "white" }}>{cs.corto.toLowerCase()}</strong> frente a {cs.picoLabel}, su salario real más alto, sumado mes a mes
                    </div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(2.2rem, 5vw, 2.9rem)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {cs.perdida > 0 ? fmtP(-cs.perdida) : "$0"}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.66rem", color: "rgba(255,255,255,0.45)", marginTop: 10 }}>
                      Hoy cobra {fmtPct0(Math.abs(cs.varPico))} {cs.varPico < 0 ? "menos" : "más"} que en {cs.picoLabel}
                    </div>
                    {equiv && (
                      <div style={{ marginTop: 18, padding: "0.9rem", background: "rgba(255,255,255,0.06)", borderRadius: 3, borderLeft: "3px solid rgba(255,255,255,0.2)" }}>
                        <div style={{ fontFamily: "monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
                          con ese dinero podría comprar
                        </div>
                        <div style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 900, color: "white", lineHeight: 1.1 }}>
                          {fmtCant(equiv.cantidad)} {equiv.emoji}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{equiv.nombre}</div>
                        <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                          aprox. {fmtP(equiv.precio)} c/u · {equiv.categoria}
                        </div>
                      </div>
                    )}
                  </Card>

                  <div style={{ display: "flex", flexDirection: "column", background: "#ddd8d0", gap: 1 }}>
                    <div className="ind-grid">
                      {[
                        { lbl: "Var. mensual real",   v: cs.varMensual,    sub: `${sal.prevLabel} → ${sal.lastLabel}` },
                        { lbl: "Var. interanual real", v: cs.varInteranual, sub: `${sal.yoyLabel} → ${sal.lastLabel}` },
                        { lbl: "Desde la paritaria",   v: cs.varParitaria,  sub: `${PARITARIA.base} (antes del acuerdo) → ${sal.lastLabel}`, destacado: true },
                      ].map((it) => (
                        <div key={it.lbl} className="ind-cell" style={{ background: bgVar(it.v), padding: "1.6rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 170, boxShadow: it.destacado ? `inset 0 -4px 0 ${colVar(it.v)}` : "none" }}>
                          <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#5a524a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, fontWeight: 600 }}>{it.lbl}</div>
                          <div style={{ fontFamily: "Georgia,serif", fontSize: "clamp(2.4rem, 4.2vw, 4rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, color: colVar(it.v) }}>
                            {fmtPct(it.v)}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#5a524a", marginTop: 14 }}>{it.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#1a1714", color: "white", padding: "0.9rem 1.2rem", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.4rem 1rem" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Tipo de ajuste</span>
                      <span style={{ fontFamily: "Georgia,serif", fontSize: "1.05rem", fontWeight: 700 }}>{PARITARIA.ajuste}</span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>{PARITARIA.ajusteDetalle}</span>
                    </div>
                  </div>
                </div>

                {/* Fila 2: Evolución, ambos cargos */}
                <Grid cols="1fr" style={{ marginTop: 1 }}>
                  <Card>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Evolución {sal.desde} a {sal.lastLabel}</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", fontWeight: 700, marginBottom: 3 }}>Salario docente vs líneas de pobreza e indigencia</div>
                    <div style={{ fontSize: "0.72rem", color: "#9a9088", marginBottom: 12 }}>
                      Hogar tipo 2 · pesos constantes del último IPC · <span style={{ color: "#1e5f8a" }}>usá la barra inferior para recortar el período</span>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={sal.brechaData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ede9e3" />
                        <XAxis dataKey="label" ticks={sal.yearTicks} tickFormatter={(v) => "20" + v.slice(-2)} tick={{ fontFamily: "monospace", fontSize: 10, fill: "#9a9088" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontFamily: "monospace", fontSize: 9, fill: "#9a9088" }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtP(v)} width={70} />
                        <Tooltip content={<TTip fmt={fmtP} />} />
                        {sal.labels.includes(PARITARIA.inicio) && (
                          <ReferenceLine x={PARITARIA.inicio} stroke="#9a9088" strokeDasharray="4 3" label={{ value: PARITARIA.etiqueta, position: "insideTopRight", fontSize: 10, fontFamily: "monospace", fill: "#5a524a" }} />
                        )}
                        <Line type="monotone" dataKey="lp" name="Línea de Pobreza" stroke="#d4631a" strokeWidth={1.6} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="li" name="Línea de Indigencia" stroke="#c0321e" strokeWidth={1.4} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
                        {Object.values(sal.cargos).map((c) => (
                          <Line key={c.id} type="monotone" dataKey={c.id} name={c.corto} stroke={c.color} strokeWidth={c.id === cargoSel ? 3 : 1.6} strokeOpacity={c.id === cargoSel ? 1 : 0.55} dot={false} isAnimationActive={false} />
                        ))}
                        <ReferenceDot x={cs.picoLabel} y={cs.picoValor} r={5} fill={cs.color} stroke="white" strokeWidth={2} label={{ value: `Pico ${cs.picoLabel}`, position: "top", fontSize: 10, fontFamily: "monospace", fill: "#5a524a" }} />
                        <Brush dataKey="label" height={24} stroke="#9a9088" fill="#f5f2ee" travellerWidth={8} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                      {[...Object.values(sal.cargos).map((c) => [c.color, c.corto]), ["#d4631a", "Línea de Pobreza"], ["#c0321e", "Línea de Indigencia"]].map(([c, l]) => (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace", fontSize: "0.62rem", color: "#5a524a" }}>
                          <div style={{ width: 14, height: 3, background: c, borderRadius: 2 }} />{l}
                        </div>
                      ))}
                    </div>
                    {sal.filasCorridas.length > 0 && (
                      <div style={{ fontSize: "0.68rem", color: "#b0571a", marginTop: 8 }}>
                        ⚠ Aviso de mantenimiento: en la planilla, las filas {sal.filasCorridas[0]} a {sal.filasCorridas[sal.filasCorridas.length - 1]} están corridas una columna a la derecha. El monitor las corrige solo, pero conviene arreglarlas en la hoja.
                      </div>
                    )}
                    {sal.lpRepetida && (
                      <div style={{ fontSize: "0.68rem", color: "#9a9088", marginTop: 8 }}>
                        * La LP de {sal.lastLabel} repite la de {sal.prevLabel}: el dato nuevo todavía no fue publicado.
                      </div>
                    )}
                  </Card>
                </Grid>

                {/* Fila 3: Brecha LP y Brecha LI del cargo seleccionado */}
                <div className="grid-2" style={{ marginTop: 1 }}>
                  <Card redBg={bajoLP} style={bajoLP ? {} : { background: "#eef7f1" }}>
                    <Tag c={bajoLP ? "orange" : "green"}>Brecha LP · {cs.corto} · {sal.lastLabel}</Tag>
                    <div className="brecha-inner">
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#5a524a", marginBottom: 12, lineHeight: 1.6 }}>
                          {bajoLP ? (
                            <>Le faltan <span style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "1.1rem", color: "#d4631a" }}>{fmtFull(bLP)}</span> por mes para alcanzar la línea de pobreza</>
                          ) : (
                            <>Supera la línea de pobreza por <span style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "1.1rem", color: "#2a7a4a" }}>{fmtFull(-bLP)}</span> por mes</>
                          )}
                        </div>
                        <Prog label="Salario como % de la LP" right={fmtPct0(cs.pctLP)} pct={cs.pctLP || 0} color={bajoLP ? "orange" : "green"} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #e8d8d0" }}>
                          <div>
                            <div style={{ fontSize: "0.6rem", color: "#9a9088", marginBottom: 2 }}>LP HOY</div>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", color: "#d4631a" }}>{fmtFull(sal.lastLP)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.6rem", color: "#9a9088", marginBottom: 2 }}>SALARIO HOY</div>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem" }}>{fmtFull(cs.last)}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ background: bajoLP ? "#d4631a" : "#2a7a4a", padding: "1.2rem", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                        <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                          {bajoLP ? "el salario debe aumentar" : "el salario supera la LP en"}
                        </div>
                        <div style={{ fontFamily: "Georgia,serif", fontSize: "3rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                          {fmtPct0(Math.abs(bajoLP ? pLP : cs.pctLP - 100))}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
                          {bajoLP ? "para alcanzar la LP" : "por encima de la LP"}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <Tag c="red">Brecha LI · {cs.corto} · {sal.lastLabel}</Tag>
                    <div className="brecha-inner">
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#5a524a", marginBottom: 12, lineHeight: 1.6 }}>
                          Está{" "}
                          <span style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "1.1rem", color: bLI >= 0 ? "#2a7a4a" : "#c0321e" }}>{fmtFull(Math.abs(bLI))}</span>{" "}
                          {bLI >= 0 ? "por encima" : "por debajo"} de la línea de indigencia
                        </div>
                        <Prog label="LI como % del salario" right={fmtPct0((sal.lastLI / cs.last) * 100)} pct={(sal.lastLI / cs.last) * 100} color="red" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd8d0" }}>
                          <div>
                            <div style={{ fontSize: "0.6rem", color: "#9a9088", marginBottom: 2 }}>SALARIO HOY</div>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem" }}>{fmtFull(cs.last)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.6rem", color: "#9a9088", marginBottom: 2 }}>LI HOY</div>
                            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", color: "#c0321e" }}>{fmtFull(sal.lastLI)}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ background: bLI >= 0 ? "#3d3830" : "#c0321e", padding: "1.2rem", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                        <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{bLI >= 0 ? "el salario supera la LI en" : "le falta para la LI"}</div>
                        <div style={{ fontFamily: "Georgia,serif", fontSize: "3rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                          {fmtPct0(Math.abs((cs.last / sal.lastLI - 1) * 100))}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.75)", marginTop: 8 }}>{bLI >= 0 ? "por encima de la indigencia" : "para salir de la indigencia"}</div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Fila 4: Comparación entre cargos */}
                <Grid cols="1fr" style={{ marginTop: 1 }}>
                  <Card>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Resumen · {sal.lastLabel}</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", fontWeight: 700, marginBottom: 14 }}>Comparación entre cargos</div>
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 440 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", fontFamily: "monospace", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9088", padding: "6px 10px", borderBottom: "2px solid #1a1714" }}>Indicador</th>
                            {Object.values(sal.cargos).map((c) => (
                              <th key={c.id} style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.06em", color: c.id === cargoSel ? "#1a1714" : "#9a9088", padding: "6px 10px", borderBottom: "2px solid #1a1714", whiteSpace: "nowrap" }}>
                                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c.color, marginRight: 6 }} />{c.corto}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { lbl: "Salario",                                     f: (c) => fmtFull(c.last) },
                            { lbl: "Salario como % de la LP",                     f: (c) => fmtPct0(c.pctLP), col: (c) => (c.pctLP >= 100 ? "#1a6b3a" : "#d4631a") },
                            { lbl: `Var. mensual real (vs ${sal.prevLabel})`,    f: (c) => fmtPct(c.varMensual),    col: (c) => colVar(c.varMensual) },
                            { lbl: `Var. interanual real (vs ${sal.yoyLabel})`,  f: (c) => fmtPct(c.varInteranual), col: (c) => colVar(c.varInteranual) },
                            { lbl: `Desde la paritaria (vs ${PARITARIA.base})`,  f: (c) => fmtPct(c.varParitaria),  col: (c) => colVar(c.varParitaria) },
                            { lbl: "Salario hoy vs su pico real",                 f: (c) => `${fmtPct(c.varPico)} (vs ${c.picoLabel})`, col: (c) => colVar(c.varPico) },
                            { lbl: "Pérdida acumulada desde el pico",             f: (c) => (c.perdida > 0 ? fmtP(-c.perdida) : "$0") },
                            { lbl: "Meses por debajo de la LP",                   f: (c) => `${c.mesesBajo} de ${sal.L + 1}` },
                          ].map((row, i) => (
                            <tr key={row.lbl} style={{ background: i % 2 ? "#fafaf8" : "white" }}>
                              <td style={{ padding: "8px 10px", fontSize: "0.8rem", color: "#5a524a", borderBottom: "1px solid #f0ece6" }}>{row.lbl}</td>
                              {Object.values(sal.cargos).map((c) => (
                                <td key={c.id} style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: c.id === cargoSel ? 700 : 500, color: row.col ? row.col(c) : "#1a1714", borderBottom: "1px solid #f0ece6", whiteSpace: "nowrap" }}>
                                  {row.f(c)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </Grid>
              </>
            )}
          </div>

          {/* ── S2: PRESUPUESTO ── */}
          <div style={{ padding: "0 1.5rem", marginTop: "2.5rem" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #1a1714", paddingBottom: 8, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", letterSpacing: "0.1em" }}>02</span>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Presupuesto Educativo Provincial</span>
              </div>
              {pre && pre.anos && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1714", padding: "6px 14px", borderRadius: 4 }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#aaa49c", textTransform: "uppercase", letterSpacing: "0.1em" }}>Año</span>
                  <select
                    value={anoSel || ""}
                    onChange={(e) => setAnoSel(Number(e.target.value))}
                    style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 700, background: "transparent", color: "white", border: "none", outline: "none", cursor: "pointer" }}
                  >
                    {[...pre.anosConDatos].reverse().map((a) => (
                      <option key={a} value={a} style={{ background: "#1a1714", color: "white" }}>{a}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid-3" style={{ marginBottom: 1 }}>
              {/* Vigente vs original */}
              <Card>
                <Tag c="dark">Presupuesto {anoSel}</Tag>
                <div style={{ fontSize: "0.75rem", color: "#5a524a", marginBottom: 6 }}>Presupuesto vigente total</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "2.3rem", fontWeight: 900, color: "#1a1714", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {datosAnio ? fmtP(datosAnio.tvA) : "–"}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "#9a9088", marginTop: 6 }}>en pesos de {pre?.lastA}</div>
                {datosAnio && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid #ede9e3" }}>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>Original</div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem" }}>{datosAnio.origInvalido ? "s/d" : fmtP(datosAnio.tOrig)}</div>
                      <div style={{ fontSize: "0.68rem", color: datosAnio.varVigOrig == null ? "#9a9088" : colVar(datosAnio.varVigOrig), marginTop: 2 }}>
                        {datosAnio.varVigOrig == null ? "dato con errores en la planilla" : `${fmtPct(datosAnio.varVigOrig)} en el año`}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.06em" }}>Devengado</div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem" }}>{fmtP(datosAnio.tdA)}</div>
                      <div style={{ fontSize: "0.68rem", color: "#9a9088", marginTop: 2 }}>{datosAnio.enCurso ? `a ${MESES_LARGO[datosAnio.mes - 1]}` : "cierre del año"}</div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Ejecución vs tiempo transcurrido */}
              <Card redBg>
                <Tag c="red">{datosAnio?.enCurso ? `Ejecución a ${MESES_LARGO[datosAnio.mes - 1]}` : "Ejecución anual"}</Tag>
                {datosAnio && (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontFamily: "Georgia,serif", fontSize: "2.6rem", fontWeight: 900, color: "#c0321e", letterSpacing: "-0.03em", lineHeight: 1 }}>
                        {fmtPct0(datosAnio.ejecPct)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#5a524a" }}>del vigente ejecutado</div>
                    </div>
                    <div style={{ position: "relative", height: 14, background: "#ead9d4", borderRadius: 2, marginTop: datosAnio.enCurso ? 30 : 16 }}>
                      <div style={{ position: "absolute", inset: 0, width: `${Math.min(datosAnio.ejecPct, 100)}%`, background: "#c0321e", borderRadius: 2 }} />
                      {datosAnio.enCurso && (
                        <div style={{ position: "absolute", left: `${datosAnio.pctAnio}%`, top: -22, bottom: -4, borderLeft: "2px dashed #1a1714" }}>
                          <span style={{ position: "absolute", top: 0, right: 4, whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "0.6rem", color: "#1a1714" }}>
                            año transcurrido {fmtPct0(datosAnio.pctAnio)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#5a524a", marginTop: 12, lineHeight: 1.5 }}>
                      {datosAnio.enCurso
                        ? <>Pasó el {fmtPct0(datosAnio.pctAnio)} del año y se devengó el {fmtPct0(datosAnio.ejecPct)} del presupuesto vigente.</>
                        : <>Se devengó el {fmtPct0(datosAnio.ejecPct)} del presupuesto vigente.</>}
                    </div>
                  </>
                )}
              </Card>

              {/* Variación real */}
              <Card blueBg>
                <Tag c="blue">Variación real del vigente</Tag>
                <div style={{ fontSize: "0.75rem", color: "#5a524a", marginBottom: 6, lineHeight: 1.4 }}>
                  Presupuesto vigente {anoSel} vs {anoSel - 1}, descontada la inflación
                </div>
                {datosAnio && (
                  <>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "2.6rem", fontWeight: 900, color: colVar(datosAnio.varR), letterSpacing: "-0.03em", lineHeight: 1 }}>
                      {fmtPct(datosAnio.varR)}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "#9a9088", marginTop: 8 }}>
                      ambos años en pesos de {pre?.lastA}
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Evolución anual del vigente por rubro */}
            <Grid cols="1fr" style={{ marginTop: 1 }}>
              <Card>
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Serie histórica · descontada la inflación</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", fontWeight: 700, marginBottom: 3 }}>Presupuesto vigente por rubro, año a año</div>
                <div style={{ fontSize: "0.72rem", color: "#9a9088", marginBottom: 12 }}>
                  Billones de pesos de {pre?.lastA} (1 billón = un millón de millones) · <span style={{ color: "#1e5f8a" }}>tocá una barra para ver ese año</span>
                </div>
                {pre && pre.evolData ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pre.evolData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} onClick={(e) => e && e.activeLabel && setAnoSel(Number(e.activeLabel))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ede9e3" vertical={false} />
                        <XAxis dataKey="ano" tick={{ fontFamily: "monospace", fontSize: 10, fill: "#5a524a" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontFamily: "monospace", fontSize: 9, fill: "#9a9088" }} tickLine={false} axisLine={false} tickFormatter={(v) => "$" + (v / 1000).toLocaleString("es-AR") + " B"} width={52} />
                        <Tooltip cursor={{ fill: "rgba(26,23,20,0.05)" }} content={<TTipPres />} />
                        {RUBROS.map((r) => (
                          <Bar key={r} dataKey={RSHORT[r]} name={RNOMBRE(r)} stackId="1" fill={RCOL[r]} isAnimationActive={false} style={{ cursor: "pointer" }}>
                            {pre.evolData.map((d) => (
                              <Cell key={d.ano} fillOpacity={d.ano === anoSel ? 1 : 0.45} />
                            ))}
                          </Bar>
                        ))}
                        <Brush dataKey="ano" height={24} stroke="#9a9088" fill="#f5f2ee" travellerWidth={8} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
                      {RUBROS.map((r) => (
                        <div key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#5a524a" }}>
                          <div style={{ width: 10, height: 10, background: RCOL[r], borderRadius: 2 }} />{RNOMBRE(r)}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#c0321e", padding: "1rem" }}>Sin datos.</div>
                )}
              </Card>
            </Grid>

            {/* Ejecución por rubro: tabla + barras en un solo bloque */}
            <Grid cols="1fr" style={{ marginTop: 1 }}>
              <Card>
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                  Detalle · {anoSel}{datosAnio?.enCurso ? ` · a ${MESES_LARGO[datosAnio.mes - 1]}` : ""}
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", fontWeight: 700, marginBottom: 3 }}>Ejecución por rubro</div>
                <div style={{ fontSize: "0.72rem", color: "#9a9088", marginBottom: 16 }}>
                  Pesos de {pre?.lastA}{datosAnio?.enCurso ? <> · la línea punteada marca el {fmtPct0(datosAnio.pctAnio)} del año transcurrido</> : ""}
                </div>
                {datosAnio && datosAnio.tableRows.length > 0 ? (
                  <div className="rubros">
                    <div className="rubro rubro-hdr">
                      <div>Rubro</div><div className="num">Vigente</div><div className="num">Devengado</div><div>Ejecución</div><div className="num">Var. real vigente vs {anoSel - 1}</div>
                    </div>
                    {datosAnio.tableRows.map((row) => {
                      const atrasado = datosAnio.enCurso ? row.ep < datosAnio.pctAnio - 5 : row.ep < 90;
                      return (
                        <div key={row.r} className="rubro">
                          <div className="rubro-nom">
                            <span style={{ display: "inline-block", width: 10, height: 10, background: RCOL[row.r], borderRadius: 2, marginRight: 8, flexShrink: 0 }} />
                            {RNOMBRE(row.r)}
                          </div>
                          <div className="num"><span className="rubro-lbl">Vigente </span>{fmtP(row.vig)}</div>
                          <div className="num"><span className="rubro-lbl">Devengado </span>{fmtP(row.dev)}</div>
                          <div className="rubro-ej">
                            <div className="rubro-barra">
                              <div style={{ position: "absolute", inset: 0, width: `${Math.min(row.ep, 100)}%`, background: RCOL[row.r], borderRadius: 2 }} />
                              {datosAnio.enCurso && <div style={{ position: "absolute", left: `${datosAnio.pctAnio}%`, top: -4, bottom: -4, borderLeft: "2px dashed #1a1714" }} />}
                            </div>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.85rem", color: atrasado ? "#c0321e" : "#1a1714", minWidth: 52, textAlign: "right" }}>{fmtPct0(row.ep)}</span>
                          </div>
                          <div className="num" style={{ fontWeight: 700, color: colVar(row.delta) }}>
                            <span className="rubro-lbl">Var. real vs {anoSel - 1} </span>{fmtPct(row.delta)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#c0321e", padding: "1rem" }}>Sin datos para {anoSel}.</div>
                )}
              </Card>
            </Grid>
          </div>


          {/* FOOTER */}
          <div style={{ padding: "1.5rem", marginTop: "1.5rem", borderTop: "1px solid #ddd8d0", display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088" }}>
            <span>UEPC Capital · Monitor Educativo · Elaboración propia</span>
            <span>Generado {new Date().toLocaleDateString("es-AR")}</span>
          </div>
        </>
      )}
    </div>
  );
}