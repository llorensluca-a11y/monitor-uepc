import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Brush,
} from "recharts";

const URL_SAL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqXET4bpJAIlB2zIGFeN2D4w4_O2_xf0Z9knA0HTaWtMdaN3N7OXX7WCstqKiabiNdSXQhmd4nXM9V/pub?output=csv";
const URL_PRE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQupnKrc5VTLand2DPyEjjeHGqN4IemircxRnpT-UdZPyK5pJx5UE31SEUEKbe1kFTmOlRUpTXupJc1/pub?gid=137040153&single=true&output=csv";

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
  "Enseñanza Inicial Y Primaria": "#1e5f8a",
  "Enseñanza Media Y Técnica": "#c0321e",
  "Enseñanza Superior Y Universitaria": "#2a7a4a",
  "Administración De La Educación": "#d4631a",
  "Regímenes Especiales": "#7c6a9a",
};

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

// ── Procesamiento salario ─────────────────────────────────────

function processSalario(text) {
  const rows = parseCSV(text);
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  const findKey = (...hints) =>
    keys.find((k) => hints.some((h) => k.toLowerCase().includes(h.toLowerCase())));
  const keySal =
    findKey("Maestra - 0", "Maestra- 0", "Maestra 0") ||
    keys.find((k) => k.includes("Maestra"));
  const keyLP =
    findKey("LP (Hogar", "LP (hogar") || keys.find((k) => k.startsWith("LP"));
  const keyLI =
    findKey("LI (hogar", "LI (Hogar") || keys.find((k) => k.startsWith("LI"));
  const keyLbl = keys[0];

  const data    = rows.filter((r) => parseNum(r[keySal]) > 50000);
  const labels  = data.map((r) => r[keyLbl]);
  const salario = data.map((r) => parseNum(r[keySal]));
  const lp      = data.map((r) => parseNum(r[keyLP]));
  const li      = data.map((r) => parseNum(r[keyLI]));
  const base0   = salario[0] && lp[0] ? salario[0] / lp[0] : 1;
  const indice  = salario.map((s, i) => lp[i] > 0 ? +(s / lp[i] / base0).toFixed(4) : null);
  const L       = data.length - 1;

  let perdida = 0;
  salario.forEach((s, i) => { if (lp[i] > 0 && s < lp[i]) perdida += lp[i] - s; });

  const brechaData = labels.map((l, i) => ({
    label: l, salario: salario[i], lp: lp[i], li: li[i],
  }));

  const step = Math.max(1, Math.floor(data.length / 60));
  const indiceData = labels.filter((_, i) => i % step === 0).map((l, idx) => ({
    label: l, indice: indice[idx * step],
  }));

  // Variación mensual e interanual (último dato vs anterior y vs hace 12 meses)
  const varMensual = L > 0 && salario[L-1] > 0
    ? (salario[L] / salario[L-1] - 1) * 100 : null;
  const varInteranual = L >= 12 && salario[L-12] > 0
    ? (salario[L] / salario[L-12] - 1) * 100 : null;

  // Meses consecutivos por debajo de la LP
  let mesesBajoLP = 0;
  for (let i = L; i >= 0; i--) {
    if (lp[i] > 0 && salario[i] < lp[i]) mesesBajoLP++;
    else break;
  }

  // Tabla de aumentos: variación % mensual del salario nominal
  const aumentosData = [];
  for (let i = 1; i < data.length; i++) {
    if (salario[i] !== salario[i-1] && salario[i-1] > 0) {
      aumentosData.push({
        label: labels[i],
        pct: +((salario[i] / salario[i-1] - 1) * 100).toFixed(1),
        sal: salario[i],
      });
    }
  }

  return {
    brechaData, indiceData, L, perdida,
    lastSal: salario[L], lastLP: lp[L], lastLI: li[L], lastLabel: labels[L],
    varMensual, varInteranual, mesesBajoLP, aumentosData,
  };
}

// ── Procesamiento presupuesto ─────────────────────────────────
// Los valores en el CSV vienen en PESOS corrientes (sin escala)

function processPres(text) {
  const rows = parseCSV(text);
  if (!rows.length) return null;

  // byAR[año][rubro] = { vig ($), dev ($), ipc }
  const byAR = {};

  rows.forEach((r) => {
    const anio = parseInt(r["Año"]);
    if (isNaN(anio) || anio < 2010) return;

    const det = (r["Detalle"] || "").trim();
    if (!RUBROS.includes(det)) return;

    const vig = parseNum(r["Presupuesto vigente"]);
    const dev = parseNum(r["Presupuesto devengado"]);

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

    return { tvA, tdA, ejecPct, varR, ejData, tableRows };
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
        const col = p.dataKey === "salario" ? "#4ade80" : (p.color || "#9a9088");
        return (
          <div key={i} style={{ fontFamily: "monospace", fontSize: "0.6rem", color: col, marginBottom: 2 }}>
            {p.name}: {fmt ? fmt(p.value) : p.value}
          </div>
        );
      })}
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

  const bLP = sal ? sal.lastLP - sal.lastSal : 0;
  const pLP = sal ? (sal.lastLP / sal.lastSal - 1) * 100 : 0;
  const bLI = sal ? sal.lastSal - sal.lastLI : 0;
  const datosAnio = pre && anoSel ? pre.getDatosAnio(anoSel) : null;

  // Lista de equivalencias para la pérdida acumulada
  // Precios actualizados — fuente: MercadoLibre / Zonaprop / Despegar (marzo 2026)
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

  // Elegir equivalencia según la pérdida acumulada (cambia cada vez que carga)
  const getEquivalencias = (perdida) => {
    if (!perdida || perdida <= 0) return null;
    const monto = Math.abs(perdida);
    const conCantidad = EQUIVALENCIAS.map(e => {
      const cantidadExacta = monto / e.precio;
      const entera = Math.floor(cantidadExacta);
      const decimal = cantidadExacta - entera;
      // Mostrar 1 decimal si hay fracción significativa (>0.05)
      const cantidadDisplay = decimal >= 0.05
        ? parseFloat(cantidadExacta.toFixed(1))
        : entera;
      return { ...e, cantidad: cantidadDisplay, cantidadExacta };
    }).filter(e => e.cantidadExacta >= 1);
    if (!conCantidad.length) return null;
    return conCantidad[Math.floor(Math.random() * conCantidad.length)];
  };

  const equiv = sal ? getEquivalencias(sal.perdida) : null;

  return (
    <div style={{ background: "#f5f2ee", minHeight: "100vh", fontFamily: "system-ui,sans-serif", fontSize: 14 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 1px; background: #ddd8d0; }
        .grid-3   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #ddd8d0; }
        .grid-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #ddd8d0; }
        .grid-1   { display: grid; grid-template-columns: 1fr; gap: 1px; background: #ddd8d0; }
        .sit-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #ddd8d0; }
        .ind-grid { display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 1px; background: #ddd8d0; flex: 1; }
        @media (max-width: 600px) {
          .grid-1-2, .grid-3, .grid-2 { grid-template-columns: 1fr !important; }
          .sit-grid { grid-template-columns: 1fr !important; }
          .ind-grid { grid-template-columns: 1fr !important; }
          .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .hide-mobile { display: none !important; }
          .brush-label { display: none; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#1a1714", color: "white", padding: "1.6rem 2rem 1.3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa49c", marginBottom: 6 }}>
            UEPC · Secretaría de Estadística · Córdoba
          </div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: "2.5rem", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em" }}>
            Monitor <span style={{ color: "#e05a3a", fontStyle: "italic" }}>Educativo</span>
          </div>
          <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#aaa49c" }}>
            Salario docente · Presupuesto educativo provincial
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "4px 10px", fontFamily: "monospace", fontSize: "0.6rem", color: "#aaa49c", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <span style={{ width: 5, height: 5, background: loading ? "#facc15" : err ? "#c0321e" : "#4ade80", borderRadius: "50%", display: "inline-block" }} />
            {loading ? "Cargando…" : err ? "Error" : "Datos actualizados"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: "#555", marginTop: 4 }}>
            {new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          {!loading && (
            <button onClick={load} style={{ marginTop: 6, background: "none", border: "1px solid #444", color: "#aaa", fontFamily: "monospace", fontSize: "0.58rem", padding: "3px 8px", cursor: "pointer", borderRadius: 2, display: "block", marginLeft: "auto" }}>
              ↻ Actualizar
            </button>
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
          {/* ── S1: SALARIO ── */}
          <div style={{ padding: "0 1.5rem", marginTop: "2rem" }}>
            <Sec num="01" title="Salario Real Docente" />

            {/* Fila 1: Pérdida acumulada (1/3) + Índice real docente (2/3) */}
            <div className="grid-1-2" style={{ marginBottom: 1 }}>
              <Card dark>
                <Tag c="red">Pérdida Acumulada</Tag>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginBottom: 12, lineHeight: 1.5 }}>
                  Pérdida real acumulada<br />desde junio de 2016
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "2.8rem", fontWeight: 900, color: "white", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {sal ? fmtP(-sal.perdida) : "–"}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", marginTop: 10 }}>
                  suma de brechas mensuales
                </div>
                {equiv && (
                  <div style={{ marginTop: 18, padding: "0.9rem", background: "rgba(255,255,255,0.06)", borderRadius: 3, borderLeft: "3px solid rgba(255,255,255,0.2)" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.52rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
                      con ese dinero podrías comprar
                    </div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "1.4rem", fontWeight: 900, color: "white", lineHeight: 1.1 }}>
                      {equiv.cantidad} {equiv.emoji}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                      {equiv.cantidad === 1 ? "un" : equiv.cantidad} {equiv.nombre}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.55rem", color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                      aprox. {fmtP(equiv.precio)} c/u · {equiv.categoria}
                    </div>
                  </div>
                )}
              </Card>

              <div style={{ display: "flex", flexDirection: "column", background: "#ddd8d0", gap: 1 }}>
                <div className="ind-grid" style={{ gap: 1, background: "#ddd8d0" }}>
                  {/* Var mensual — 2/5 */}
                  <div style={{ background: sal?.varMensual != null && sal.varMensual >= 0 ? "#e8f7ef" : sal?.varMensual != null ? "#fde8e4" : "white", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 180 }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#5a524a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, fontWeight: 600 }}>Var. mensual real · {sal?.lastLabel}</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "5.5rem", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.9, color: sal?.varMensual == null ? "#9a9088" : sal.varMensual >= 0 ? "#1a6b3a" : "#a82018" }}>
                      {sal?.varMensual != null ? (sal.varMensual >= 0 ? "+" : "") + sal.varMensual.toFixed(1) + "%" : "–"}
                    </div>
                    <div style={{ fontSize: "0.88rem", color: "#5a524a", marginTop: 16, fontWeight: 500 }}>respecto al mes anterior</div>
                  </div>
                  {/* Var interanual — 2/5 */}
                  <div style={{ background: sal?.varInteranual != null && sal.varInteranual >= 0 ? "#e8f7ef" : sal?.varInteranual != null ? "#fde8e4" : "white", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 180 }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#5a524a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, fontWeight: 600 }}>Var. interanual real · {sal?.lastLabel}</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "5.5rem", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.9, color: sal?.varInteranual == null ? "#9a9088" : sal.varInteranual >= 0 ? "#1a6b3a" : "#a82018" }}>
                      {sal?.varInteranual != null ? (sal.varInteranual >= 0 ? "+" : "") + sal.varInteranual.toFixed(1) + "%" : "–"}
                    </div>
                    <div style={{ fontSize: "0.88rem", color: "#5a524a", marginTop: 16, fontWeight: 500 }}>vs mismo mes año anterior</div>
                  </div>
                  {/* Tipo de ajuste — 1/5 */}
                  <div style={{ background: "#1a1714", padding: "1.6rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.48rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Tipo de ajuste</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "0.82rem", fontWeight: 700, color: "white", lineHeight: 1.4 }}>Cláusula gatillo con inflación anterior</div>
                    <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.3)", marginTop: 8 }}>mecanismo vigente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 2: Gráfico evolución 2016-hoy ancho completo */}
            <Grid cols="1fr" style={{ marginTop: 1 }}>
              <Card>
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Evolución 2016–hoy</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "0.95rem", fontWeight: 700, marginBottom: 3 }}>Salario Docente vs Líneas de Pobreza e Indigencia</div>
                <div style={{ fontSize: "0.68rem", color: "#9a9088", marginBottom: 12 }}>
                  Maestra inicial sin antigüedad · $ corrientes · <span style={{ color: "#1e5f8a" }}>Usá la barra inferior para recortar el período</span>
                </div>
                {sal && (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sal.brechaData} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ede9e3" />
                        <XAxis dataKey="label" tick={{ fontFamily: "monospace", fontSize: 7, fill: "#9a9088" }} tickLine={false} axisLine={false} interval={5} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontFamily: "monospace", fontSize: 9, fill: "#9a9088" }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtP(v)} width={85} />
                        <Tooltip content={<TTip fmt={fmtP} />} />
                        <Line type="monotone" dataKey="salario" name="Salario Docente"     stroke="#4ade80" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="lp"      name="Línea de Pobreza"    stroke="#d4631a" strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="li"      name="Línea de Indigencia"  stroke="#c0321e" strokeWidth={1.5} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
                        <Brush dataKey="label" height={24} stroke="#9a9088" fill="#f5f2ee" travellerWidth={8} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                      {[["#4ade80","Salario Docente"],["#d4631a","Línea de Pobreza"],["#c0321e","Línea de Indigencia"]].map(([c, l]) => (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace", fontSize: "0.58rem", color: "#9a9088" }}>
                          <div style={{ width: 12, height: 3, background: c, borderRadius: 2 }} />{l}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </Grid>

            {/* Fila 3: Brecha LP y Brecha LI */}
            <div className="grid-2" style={{ marginTop: 1 }}>
              <Card redBg>
                <Tag c="orange">Brecha LP · {sal?.lastLabel}</Tag>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                  {/* Izquierda */}
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#6b5e56", marginBottom: 12, lineHeight: 1.6 }}>
                      El docente está a{" "}
                      <span style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "1.05rem", color: "#d4631a" }}>
                        {sal ? fmtP(bLP) : "–"}
                      </span>{" "}
                      para alcanzar la línea de pobreza
                    </div>
                    <Prog label="Salario como % de la LP" right={sal ? ((sal.lastSal / sal.lastLP) * 100).toFixed(1) + "%" : "–"} pct={sal ? (sal.lastSal / sal.lastLP) * 100 : 0} color="orange" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #e8d8d0" }}>
                      <div>
                        <div style={{ fontSize: "0.58rem", color: "#9a9088", marginBottom: 2 }}>LP HOY</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem", color: "#d4631a" }}>{sal ? fmtP(sal.lastLP) : "–"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.58rem", color: "#9a9088", marginBottom: 2 }}>SALARIO HOY</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" }}>{sal ? fmtP(sal.lastSal) : "–"}</div>
                      </div>
                    </div>
                  </div>
                  {/* Derecha: dato destacado */}
                  <div style={{ background: "#d4631a", padding: "1.2rem", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.52rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>el salario debe aumentar</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "3rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {sal ? pLP.toFixed(1) + "%" : "–"}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.65)", marginTop: 8 }}>para alcanzar la LP</div>
                  </div>
                </div>
              </Card>

              <Card>
                <Tag c="red">Brecha LI · {sal?.lastLabel}</Tag>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                  {/* Izquierda */}
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#6b5e56", marginBottom: 12, lineHeight: 1.6 }}>
                      El docente está{" "}
                      <span style={{ fontFamily: "Georgia,serif", fontWeight: 900, fontSize: "1.05rem", color: bLI >= 0 ? "#2a7a4a" : "#c0321e" }}>
                        {sal ? fmtP(Math.abs(bLI)) : "–"}
                      </span>{" "}
                      {bLI >= 0 ? "por encima" : "por debajo"} de la LI
                    </div>
                    <Prog label="LI como % del salario" right={sal ? ((sal.lastLI / sal.lastSal) * 100).toFixed(1) + "%" : "–"} pct={sal ? (sal.lastLI / sal.lastSal) * 100 : 0} color="red" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd8d0" }}>
                      <div>
                        <div style={{ fontSize: "0.58rem", color: "#9a9088", marginBottom: 2 }}>SALARIO HOY</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" }}>{sal ? fmtP(sal.lastSal) : "–"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.58rem", color: "#9a9088", marginBottom: 2 }}>LI HOY</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem", color: "#c0321e" }}>{sal ? fmtP(sal.lastLI) : "–"}</div>
                      </div>
                    </div>
                  </div>
                  {/* Derecha: dato destacado */}
                  <div style={{ background: bLI >= 0 ? "#1e5f8a" : "#c0321e", padding: "1.2rem", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.52rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>la LI representa el</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "3rem", fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {sal ? ((sal.lastLI / sal.lastSal) * 100).toFixed(1) + "%" : "–"}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.65)", marginTop: 8 }}>del salario docente</div>
                  </div>
                </div>
              </Card>
            </div>



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
              <Card>
                <Tag c="dark">Presupuesto {anoSel}</Tag>
                <div style={{ fontSize: "0.72rem", color: "#9a9088", marginBottom: 6 }}>Presupuesto vigente total</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "2.2rem", fontWeight: 900, color: "#1e5f8a", letterSpacing: "-0.03em" }}>
                  {datosAnio ? fmtP(datosAnio.tvA) : "–"}
                </div>
                {datosAnio && (
                  <>
                    <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: "#9a9088", marginTop: 4 }}>en pesos corrientes</div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: "0.68rem", color: "#9a9088" }}>Devengado</div>
                      <div style={{ fontFamily: "Georgia,serif", fontSize: "1.5rem", fontWeight: 700 }}>{fmtP(datosAnio.tdA)}</div>
                    </div>
                  </>
                )}
              </Card>

              <Card redBg>
                <Tag c="red">Ejecución</Tag>
                <div style={{ fontSize: "0.72rem", color: "#9a9088", marginBottom: 6, lineHeight: 1.4 }}>
                  % del vigente efectivamente<br />ejecutado
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "2.4rem", fontWeight: 900, color: "#c0321e", letterSpacing: "-0.03em" }}>
                  {datosAnio ? datosAnio.ejecPct.toFixed(1) + "%" : "–"}
                </div>
                {datosAnio && (
                  <div style={{ fontSize: "0.7rem", color: "#9a9088", marginTop: 10, lineHeight: 1.5 }}>
                    La subejecución es una constante: año a año se ejecuta menos de lo que se designa.
                  </div>
                )}
              </Card>

              <Card blueBg>
                <Tag c="blue">Variación real del vigente</Tag>
                <div style={{ fontSize: "0.72rem", color: "#9a9088", marginBottom: 6, lineHeight: 1.4 }}>
                  Cambio real presupuesto vigente<br />vs año anterior · deflactado IPC
                </div>
                {datosAnio && (
                  <>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "2.4rem", fontWeight: 900, color: datosAnio.varR >= 0 ? "#2a7a4a" : "#c0321e", letterSpacing: "-0.03em" }}>
                      {datosAnio.varR >= 0 ? "+" : ""}{datosAnio.varR.toFixed(1)}%
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", marginTop: 4 }}>
                      Variación de {anoSel - 1} a {anoSel}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <Grid cols="1fr" style={{ marginTop: 1 }}>
              <Card>
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Serie histórica · deflactado</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "0.95rem", fontWeight: 700, marginBottom: 3 }}>Evolución del Presupuesto Vigente por Rubro</div>
                <div style={{ fontSize: "0.68rem", color: "#9a9088", marginBottom: 12 }}>$ constantes · Miles de millones · Áreas apiladas</div>
                {pre && pre.evolData ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={pre.evolData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ede9e3" />
                        <XAxis dataKey="ano" tick={{ fontFamily: "monospace", fontSize: 9, fill: "#9a9088" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontFamily: "monospace", fontSize: 9, fill: "#9a9088" }} tickLine={false} axisLine={false} tickFormatter={(v) => "$" + v + " MM"} width={80} />
                        <Tooltip content={<TTip fmt={(v) => "$" + v?.toFixed(1) + " MM"} />} />
                        {Object.entries(RSHORT).map(([full, short]) => (
                          <Area key={full} type="monotone" dataKey={short} name={short} stroke={RCOL[full]} fill={RCOL[full]} fillOpacity={0.75} stackId="1" isAnimationActive={false} />
                        ))}
                        <Brush dataKey="ano" height={24} stroke="#9a9088" fill="#f5f2ee" travellerWidth={8} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                      {Object.entries(RSHORT).map(([full, short]) => (
                        <div key={full} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace", fontSize: "0.58rem", color: "#9a9088" }}>
                          <div style={{ width: 10, height: 10, background: RCOL[full], borderRadius: 1 }} />{short}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#c0321e", padding: "1rem" }}>Sin datos.</div>
                )}
              </Card>
            </Grid>

            <Grid cols="1fr" style={{ marginTop: 1 }}>
              <Card>
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Año {anoSel}</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "0.95rem", fontWeight: 700, marginBottom: 3 }}>Vigente vs Devengado por Rubro</div>
                <div style={{ fontSize: "0.68rem", color: "#9a9088", marginBottom: 12 }}>En miles de millones de $ corrientes</div>
                {datosAnio && datosAnio.ejData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={datosAnio.ejData} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ede9e3" horizontal={false} />
                      <XAxis type="number" tick={{ fontFamily: "monospace", fontSize: 9, fill: "#9a9088" }} tickLine={false} axisLine={false} tickFormatter={(v) => "$" + v} />
                      <YAxis type="category" dataKey="rubro" tick={{ fontFamily: "monospace", fontSize: 8, fill: "#9a9088" }} tickLine={false} axisLine={false} width={95} />
                      <Tooltip content={<TTip fmt={(v) => "$" + v?.toFixed(2) + " MM"} />} />
                      <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088" }} />
                      <Bar dataKey="vig" name="Vigente"   fill="#9a9088" opacity={0.4} radius={[0, 2, 2, 0]} isAnimationActive={false} />
                      <Bar dataKey="dev" name="Devengado" fill="#1e5f8a"              radius={[0, 2, 2, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#c0321e", padding: "1rem" }}>Sin datos para {anoSel}.</div>
                )}
              </Card>
            </Grid>

            <Grid cols="1fr" style={{ marginTop: 1 }}>
              <Card>
                <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Detalle · {anoSel}</div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>Ejecución Presupuestaria por Rubro</div>
                {datosAnio && datosAnio.tableRows.length > 0 ? (
                  <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", display: "block", width: "100%", maxWidth: "100%" }}>
                  <table style={{ borderCollapse: "collapse", minWidth: 480, width: "max-content", maxWidth: "100%" }}>
                    <thead>
                      <tr>
                        {["Rubro", "Vigente", "Devengado", "Ejecución", `Var. real vigente vs ${anoSel - 1}`].map((h) => (
                          <th key={h} style={{ fontFamily: "monospace", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9a9088", padding: "5px 8px", borderBottom: "1px solid #ddd8d0", textAlign: h === "Rubro" ? "left" : "right", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datosAnio.tableRows.map((row) => (
                        <tr key={row.r}>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #f5f2ee", fontWeight: 500, fontSize: "0.78rem" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: RCOL[row.r] || "#999", borderRadius: 1, marginRight: 6, verticalAlign: "middle" }} />
                            {row.r}
                          </td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #f5f2ee", fontFamily: "monospace", fontSize: "0.7rem", textAlign: "right" }}>{fmtP(row.vig)}</td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #f5f2ee", fontFamily: "monospace", fontSize: "0.7rem", textAlign: "right" }}>{fmtP(row.dev)}</td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #f5f2ee", fontFamily: "monospace", fontSize: "0.7rem", textAlign: "right", color: row.ep < 90 ? "#c0321e" : "#2a7a4a", fontWeight: 600 }}>
                            {row.ep.toFixed(1)}%
                          </td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid #f5f2ee", fontFamily: "monospace", fontSize: "0.7rem", textAlign: "right", color: row.delta === null ? "#9a9088" : row.delta < 0 ? "#c0321e" : "#2a7a4a", fontWeight: 600 }}>
                            {row.delta === null ? "–" : (row.delta >= 0 ? "+" : "") + row.delta.toFixed(1) + "%"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : (
                  <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#c0321e", padding: "1rem" }}>Sin datos para {anoSel}.</div>
                )}
              </Card>
            </Grid>
          </div>

          {/* FOOTER */}
          <div style={{ padding: "1.5rem", marginTop: "1.5rem", borderTop: "1px solid #ddd8d0", display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: "0.6rem", color: "#9a9088" }}>
            <span>UEPC · Monitor Educativo · Datos desde Google Sheets vía proxy CORS</span>
            <span>Generado {new Date().toLocaleDateString("es-AR")}</span>
          </div>
        </>
      )}
    </div>
  );
}