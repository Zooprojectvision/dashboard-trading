import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceDot, PieChart, Pie, Cell
} from "recharts"

/**
 * ZooProjectVision — V4.3.1
 * + Aide/Guide auto-MAJ (cache 24h, forcage manuel)
 * + Drawer “Flux — Synthèse” (agrégats, table, top mouvements, export)
 * + Sélecteur de langue FR/EN/ES (guide + formats), fallback FR
 * ~ V4.3 conservée (FX live, verdicts, donut WR centré, heatmap, etc.)
 */

/* ===================== Thème & couleurs ===================== */
const C = {
  bg: "#0a0a0b",
  text: "#e8ecef",
  muted: "#b6bcc1",
  panel: "#141414",
  border: "#2a2a2a",
  axis: "#cfd3d6", // gris très clair pour les axes
  white: "#ffffff",
  green: "#20e3d6",
  green2: "#18b8ad",
  pink: "#ff5fa2",
  pink2: "#ff7cbf",
  orange: "#ffab49",
  good: "#22e6c9",
  warn: "#ff9f3f",
  bad: "#ff4f86",
}

/* ===================== i18n minimal (UI principale FR pour l’instant) ===================== */
const LANGS = ["fr", "en", "es"]
const LS_LANG = "zp_lang"
function normLang(s) { const x=(s||"fr").slice(0,2).toLowerCase(); return LANGS.includes(x)?x:"fr" }
function fmtLocale(lang){
  switch(lang){
    case "en": return "en-US"
    case "es": return "es-ES"
    default: return "fr-FR"
  }
}

/* ===================== Helpers verdict ===================== */
function verdictClass(kind) {
  if (kind === "good") return "verdict-good"
  if (kind === "warn") return "verdict-warn"
  if (kind === "bad") return "verdict-bad"
  return ""
}
function verdictOf(value, rules) {
  if (!rules) return null
  const v = Number(value) || 0
  switch (rules.mode) {
    case "sign":
      if (v > 0) return "good"
      if (v === 0) return "warn"
      return "bad"
    case "ddpct":
      if (v < 15) return "good"
      if (v <= 20) return "warn"
      return "bad"
    case "ei":
      if (v >= 0.05) return "good"
      if (v >= -0.05) return "warn"
      return "bad"
    case "expectancy":
      if (v > 0) return "good"
      if (Math.abs(v) < 1e-8) return "warn"
      return "bad"
    case "sharpe":
      if (v >= 1.0) return "good"
      if (v >= 0.5) return "warn"
      return "bad"
    case "sortino":
      if (v >= 1.2) return "good"
      if (v >= 0.8) return "warn"
      return "bad"
    case "rf":
      if (v >= 1.5) return "good"
      if (v >= 0.7) return "warn"
      return "bad"
    case "corrMean":
      if (v <= 0.20) return "good"
      if (v <= 0.50) return "warn"
      return "bad"
    case "ruin":
      if (v <= 0.05) return "good"
      if (v <= 0.20) return "warn"
      return "bad"
    default:
      return null
  }
}

/* ===================== Helpers calcul ===================== */
function round2(x) { return Math.round((x ?? 0) * 100) / 100 }
function mean(a) { if (!a.length) return 0; return a.reduce((x, y) => x + y, 0) / a.length }
function stddev(a) { if (!a.length) return 0; const m = mean(a); const v = mean(a.map(x => (x - m) * (x - m))); return Math.sqrt(v) }
function pearson(a, b) {
  const n = Math.min(a.length, b.length)
  if (!n) return 0
  const ax = a.slice(0, n), bx = b.slice(0, n)
  const ma = mean(ax), mb = mean(bx)
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) { const x = ax[i] - ma, y = bx[i] - mb; num += x * y; da += x * x; db += y * y }
  const den = Math.sqrt(da * db)
  return den > 0 ? num / den : 0
}

/* ===================== FX live (cache 24h + fallback) ===================== */
const FXCACHE_KEY = "zp_fx_cache_v2"
const fxFallback = {
  USD: { USD: 1, EUR: 0.93, CHF: 0.88 },
  EUR: { USD: 1 / 0.93, EUR: 1, CHF: 0.88 / 0.93 },
  CHF: { USD: 1 / 0.88, EUR: 0.93 / 0.88, CHF: 1 }
}
function buildFxMatrix(baseUSD) {
  const { EUR, CHF } = baseUSD
  return {
    USD: { USD: 1, EUR, CHF },
    EUR: { USD: 1 / EUR, EUR: 1, CHF: CHF / EUR },
    CHF: { USD: 1 / CHF, EUR: EUR / CHF, CHF: 1 }
  }
}

/* ===================== Demo data ===================== */
const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
const BROKERS = ["Darwinex", "ICMarkets", "Pepperstone"]
const STRATS = ["Strategy 1", "Strategy 2", "Breakout"]

function genDemoTrades() {
  const rows = []
  const today = new Date()
  for (let i = 90; i >= 1; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    for (let k = 0; k < 6; k++) {
      const asset = ASSETS[(i + k) % ASSETS.length]
      const broker = BROKERS[(i + k * 2) % BROKERS.length]
      const strategy = STRATS[(i + k * 3) % STRATS.length]
      let pnl = (Math.random() - 0.5) * (Math.random() < 0.15 ? 2500 : 900)
      pnl = Number(pnl.toFixed(2))
      const openH = Math.floor(Math.random() * 24)
      const openM = Math.floor(Math.random() * 60)
      const open = new Date(d.getFullYear(), d.getMonth(), d.getDate(), openH, openM)
      const durMin = 15 + Math.floor(Math.random() * (60 * 8))
      const close = new Date(open.getTime() + durMin * 60 * 1000)
      const mfe = Number((Math.abs(pnl) * (0.8 + Math.random() * 0.8)).toFixed(2))
      const mae = Number((Math.abs(pnl) * (0.6 + Math.random() * 0.8)).toFixed(2))
      rows.push({
        date, asset, broker, strategy,
        pnl, ccy: "USD",
        open_time: open.toISOString(),
        close_time: close.toISOString(),
        mfe, mae
      })
    }
  }
  return rows
}

const CAPITAL_INITIAL_USD = 100000
const demoCashflows = [
  { date: "2025-01-05", type: "deposit", amount: 2000, ccy: "USD", note: "Apport" },
  { date: "2025-02-10", type: "prop_fee", amount: -500, ccy: "USD", note: "Prop challenge" },
  { date: "2025-03-15", type: "prop_payout", amount: 1000, ccy: "USD", note: "Payout prop" },
  { date: "2025-04-02", type: "darwin_mgmt_fee", amount: 250, ccy: "USD", note: "Darwinex mgmt fee" },
  { date: "2025-05-20", type: "withdrawal", amount: -800, ccy: "USD", note: "Retrait" },
]

/* ===================== Storage helpers ===================== */
const LS_TRADES = "zp_user_trades"
const LS_CASH = "zp_user_cashflows"
const LS_TIER = "zp_managed_capital"
const LS_SUB = "zp_subtitle"
const LS_GUIDE = "zp_guide_cache_v1" // {at, data}

function loadLS(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback } }
function saveLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ } }

/* ===================== CSV import (MT4/5) ===================== */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/); if (!lines.length) return []
  const headers = lines.shift().split(",").map(h => h.trim().replace(/^"|"$/g, ""))
  const rows = []
  for (const line of lines) {
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
    const obj = {}
    headers.forEach((h, i) => obj[h] = (cols[i] || "").replace(/^"|"$/g, ""))
    rows.push(obj)
  }
  return rows
}
function mapMT5Rows(rows) {
  return rows.map(r => {
    const date = (r["Time"] || r["Open time"] || r["Open Time"] || r["Date"] || "").slice(0, 10)
    const asset = r["Symbol"] || r["Instrument"] || r["Symbol name"] || "UNKNOWN"
    const broker = r["Broker"] || "Unknown"
    const strategy = r["Strategy"] || "Unknown"
    const pnl = Number(r["Profit"] || r["PnL"] || r["PL"] || r["Net P/L"] || 0)
    const openTime = r["Time"] || r["Open time"] || r["Open Time"] || ""
    const closeTime = r["Close time"] || r["Close Time"] || ""
    const mfeRaw = Number(r["MFE"] || r["MFE Profit"] || r["Max Favorable Excursion"] || 0)
    const maeRaw = Number(r["MAE"] || r["MAE Profit"] || r["Max Adverse Excursion"] || 0)
    return {
      date, asset, broker, strategy,
      pnl: Number((pnl || 0).toFixed(2)), ccy: "USD",
      open_time: openTime, close_time: closeTime,
      mfe: Number((Math.abs(mfeRaw) || 0).toFixed(2)),
      mae: Number((Math.abs(maeRaw) || 0).toFixed(2)),
    }
  }).filter(r => r.date)
}

/* ===================== TZ helpers ===================== */
const brokerTZ = { Darwinex: "Europe/Madrid", ICMarkets: "Australia/Sydney", Pepperstone: "Australia/Melbourne", Unknown: "UTC" }
function toTZ(dateISO, tz) {
  const d = new Date(dateISO); if (!isFinite(d)) return d
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  const parts = fmt.formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {})
  const local = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`)
  return local
}
function getHourInTZ(dateISO, tz) { const dd = toTZ(dateISO, tz); return isFinite(dd) ? dd.getUTCHours() : 0 }
function getWeekdayInTZ(dateISO, tz) { const dd = toTZ(dateISO, tz); if (!isFinite(dd)) return 0; const day = dd.getUTCDay(); return (day + 6) % 7 }
function getMonthInTZ(dateISO, tz) { const dd = toTZ(dateISO, tz); return isFinite(dd) ? dd.getUTCMonth() : 0 }

/* ===================== App ===================== */
export default function App() {
  /* ---------- Langue ---------- */
  const [lang, setLang] = useState(() => {
    const saved = loadLS(LS_LANG, null)
    if (saved) return normLang(saved)
    return normLang(navigator.language || "fr")
  })
  useEffect(() => { saveLS(LS_LANG, lang) }, [lang])

  /* ---------- Sous-titre (éditable) ---------- */
  const [subtitle, setSubtitle] = useState(() => loadLS(LS_SUB, "Dashboard de performance trading — multi-actifs, multi-brokers, multi-stratégies"))
  const [editSub, setEditSub] = useState(false)

  /* ---------- Données utilisateur ---------- */
  const [userTrades, setUserTrades] = useState(() => loadLS(LS_TRADES, []))
  useEffect(() => { saveLS(LS_TRADES, userTrades) }, [userTrades])

  const [userCashflows, setUserCashflows] = useState(() => loadLS(LS_CASH, []))
  useEffect(() => { saveLS(LS_CASH, userCashflows) }, [userCashflows])

  const [tierCapital, setTierCapital] = useState(() => loadLS(LS_TIER, []))
  useEffect(() => { saveLS(LS_TIER, tierCapital) }, [tierCapital])

  const demoTrades = useMemo(() => genDemoTrades(), [])
  const tradesAll = useMemo(() => demoTrades.concat(userTrades), [demoTrades, userTrades])
  const allCashflows = useMemo(() => demoCashflows.concat(userCashflows), [userCashflows])

  /* ---------- Filtres ---------- */
  const [asset, setAsset] = useState("All")
  const [broker, setBroker] = useState("All")
  const [strategy, setStrategy] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const resetFilters = () => { setAsset("All"); setBroker("All"); setStrategy("All"); setDateFrom(""); setDateTo("") }

  const assets = useMemo(() => Array.from(new Set(tradesAll.map(t => t.asset))), [tradesAll])
  const brokers = useMemo(() => Array.from(new Set(tradesAll.map(t => t.broker))), [tradesAll])
  const strategies = useMemo(() => Array.from(new Set(tradesAll.map(t => t.strategy))), [tradesAll])

  const filtered = useMemo(() => tradesAll.filter(t => {
    if (asset !== "All" && t.asset !== asset) return false
    if (broker !== "All" && t.broker !== broker) return false
    if (strategy !== "All" && t.strategy !== strategy) return false
    if (dateFrom && t.date < dateFrom) return false
    if (dateTo && t.date > dateTo) return false
    return true
  }), [tradesAll, asset, broker, strategy, dateFrom, dateTo])

  /* ---------- Devise & FX ---------- */
  const [displayCcy, setDisplayCcy] = useState("USD")
  const [rates, setRates] = useState(null)
  useEffect(() => {
    const cached = loadLS(FXCACHE_KEY, null)
    const now = Date.now()
    if (cached && (now - cached.at < 24 * 60 * 60 * 1000)) {
      setRates(cached.data)
    } else {
      fetch("https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF")
        .then(r => r.json())
        .then(j => {
          if (j && j.rates && j.rates.EUR && j.rates.CHF) {
            const data = buildFxMatrix({ EUR: j.rates.EUR, CHF: j.rates.CHF })
            setRates(data); saveLS(FXCACHE_KEY, { at: now, data })
          } else setRates(fxFallback)
        })
        .catch(() => setRates(fxFallback))
    }
  }, [])
  const convert = (val, from = "USD", to = displayCcy) => {
    if (val == null) return 0
    if (from === to) return round2(val)
    const table = rates || fxFallback
    const r = (table[from] && table[from][to]) ? table[from][to] : 1
    return round2(val * r)
  }
  const fmtC = (v, ccy = displayCcy) => {
    try {
      return new Intl.NumberFormat(fmtLocale(lang), { style: "currency", currency: ccy, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0)
    } catch {
      return `${(v ?? 0).toFixed(2)} ${ccy}`
    }
  }

  /* ---------- Cashflows filtrés ---------- */
  const cashflowsInRange = useMemo(() => {
    const list = allCashflows.filter(c => {
      if (dateFrom && c.date < dateFrom) return false
      if (dateTo && c.date > dateTo) return false
      return true
    })
    return list.map(c => ({ ...c, amount_disp: convert(c.amount, c.ccy, displayCcy) }))
  }, [allCashflows, dateFrom, dateTo, displayCcy, rates])

  const cashFlowTotal = useMemo(() => cashflowsInRange.reduce((a, c) => a + (c.amount_disp || 0), 0), [cashflowsInRange])
  const capitalInitialDisp = useMemo(() => convert(CAPITAL_INITIAL_USD, "USD", displayCcy), [displayCcy, rates])
  const capitalBase = useMemo(() => capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])

  /* ---------- KPIs calcul ---------- */
  const totalPnlDisp = useMemo(() => filtered.reduce((s, t) => s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, displayCcy, rates])
  const capitalGlobal = useMemo(() => capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

  const wins = filtered.filter(t => t.pnl > 0).length
  const wr = filtered.length ? (wins / filtered.length) * 100 : 0
  const avgWin = (() => {
    const list = filtered.filter(t => t.pnl > 0).map(t => convert(t.pnl, t.ccy, displayCcy))
    return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
  })()
  const avgLoss = (() => {
    const list = filtered.filter(t => t.pnl < 0).map(t => Math.abs(convert(t.pnl, t.ccy, displayCcy)))
    return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
  })()
  const rr = avgLoss > 0 ? (avgWin / avgLoss) : 0
  const expectancy = useMemo(() => filtered.length ? (totalPnlDisp / filtered.length) : 0, [totalPnlDisp, filtered.length])
  const edgeIndex = useMemo(() => {
    const WR = filtered.length ? wins / filtered.length : 0
    const RR = avgLoss > 0 ? avgWin / avgLoss : 0
    return WR * RR - (1 - WR)
  }, [wins, filtered.length, avgWin, avgLoss])

  /* ---------- Équité ---------- */
  function groupByDateSumPnlDisp(rows) {
    const m = new Map()
    for (const r of rows) {
      const v = convert(r.pnl, r.ccy, displayCcy)
      m.set(r.date, (m.get(r.date) || 0) + v)
    }
    return Array.from(m, ([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date))
  }
  const pnlByDate = useMemo(() => groupByDateSumPnlDisp(filtered), [filtered, displayCcy, rates])
  const cashByDate = useMemo(() => {
    const m = new Map()
    for (const c of cashflowsInRange) m.set(c.date, (m.get(c.date) || 0) + (c.amount_disp || 0))
    return Array.from(m, ([date, cash]) => ({ date, cash })).sort((a, b) => a.date.localeCompare(b.date))
  }, [cashflowsInRange])
  const pnlMap = useMemo(() => { const m = new Map(); pnlByDate.forEach(p => m.set(p.date, p.pnl)); return m }, [pnlByDate])
  const cashCumMap = useMemo(() => { let cum = 0; const m = new Map(); for (const c of cashByDate) { cum += c.cash; m.set(c.date, round2(cum)) } return m }, [cashByDate])
  const mergedDates = useMemo(() => { const s = new Set(); pnlByDate.forEach(x => s.add(x.date)); cashByDate.forEach(x => s.add(x.date)); return Array.from(s).sort((a, b) => a.localeCompare(b)) }, [pnlByDate, cashByDate])
  const equityMerged = useMemo(() => {
    let eqTrading = capitalInitialDisp
    const out = []
    for (const d of mergedDates) {
      eqTrading += (pnlMap.get(d) || 0)
      const cashCum = (cashCumMap.get(d) || 0)
      out.push({ date: d, equity_trading: round2(eqTrading), equity_with_flows: round2(eqTrading + cashCum) })
    }
    return out
  }, [mergedDates, pnlMap, cashCumMap, capitalInitialDisp])
  const equitySeriesHL = useMemo(() => {
    let h = -Infinity, l = Infinity
    return equityMerged.map(p => { h = Math.max(h, p.equity_trading); l = Math.min(l, p.equity_trading); return { ...p, hwm: round2(h), lwm: round2(l) } })
  }, [equityMerged])

  const { peakEquity, troughEquity, maxDDAbs } = useMemo(() => {
    if (!equitySeriesHL.length) return { peakEquity: 0, troughEquity: 0, maxDDAbs: 0 }
    let peakSeen = equitySeriesHL[0].equity_trading, maxDrop = 0
    for (const p of equitySeriesHL) { if (p.equity_trading > peakSeen) peakSeen = p.equity_trading; const drop = peakSeen - p.equity_trading; if (drop > maxDrop) maxDrop = drop }
    const pe = Math.max(...equitySeriesHL.map(e => e.equity_trading))
    const tr = Math.min(...equitySeriesHL.map(e => e.equity_trading))
    return { peakEquity: pe, troughEquity: tr, maxDDAbs: maxDrop }
  }, [equitySeriesHL])

  const globalReturnPct = useMemo(() => {
    if (!isFinite(capitalBase) || capitalBase <= 0) return 0
    return (totalPnlDisp / capitalBase) * 100
  }, [totalPnlDisp, capitalBase])
  const maxDDPct = useMemo(() => {
    if (!isFinite(peakEquity) || peakEquity <= 0) return 0
    return (maxDDAbs / peakEquity) * 100
  }, [maxDDAbs, peakEquity])
  function equityWithFlowsAt(date) { const p = equitySeriesHL.find(x => x.date === date); return p ? p.equity_with_flows : undefined }

  /* ---------- Sharpe / Sortino / Recovery / Ruine ---------- */
  const sharpe = useMemo(() => {
    const rets = []
    for (let i = 1; i < equitySeriesHL.length; i++) {
      const p = equitySeriesHL[i - 1].equity_trading, c = equitySeriesHL[i].equity_trading
      rets.push(p > 0 ? (c - p) / p : 0)
    }
    const mu = mean(rets), sd = stddev(rets)
    return sd > 0 ? (mu / sd) * Math.sqrt(252) : 0
  }, [equitySeriesHL])
  const sortino = useMemo(() => {
    const rets = []
    for (let i = 1; i < equitySeriesHL.length; i++) {
      const p = equitySeriesHL[i - 1].equity_trading, c = equitySeriesHL[i].equity_trading
      rets.push(p > 0 ? (c - p) / p : 0)
    }
    const mu = mean(rets), neg = rets.filter(r => r < 0), sdDown = stddev(neg)
    return sdDown > 0 ? (mu / sdDown) * Math.sqrt(252) : 0
  }, [equitySeriesHL])
  const recoveryFactor = useMemo(() => {
    const profitNet = (equitySeriesHL.at(-1)?.equity_trading || capitalInitialDisp) - capitalInitialDisp
    return maxDDAbs > 0 ? profitNet / maxDDAbs : 0
  }, [equitySeriesHL, capitalInitialDisp, maxDDAbs])
  const ruinRisk = useMemo(() => {
    const WR = filtered.length ? wins / filtered.length : 0
    const L = avgLoss || 0
    const base = capitalBase || capitalInitialDisp
    if (base <= 0 || L <= 0) return 0
    const k = Math.max(1, Math.floor(base / (2 * L)))
    const p = Math.pow(1 - WR, k)
    return Math.min(1, Math.max(0, p))
  }, [filtered.length, wins, avgLoss, capitalBase, capitalInitialDisp])

  /* ---------- MFE/MAE ---------- */
  const mfeMaeDaily = useMemo(() => {
    const map = new Map()
    for (const t of filtered) {
      const d = t.date
      const mfe = convert(t.mfe ?? 0, t.ccy || "USD", displayCcy)
      const mae = convert(t.mae ?? 0, t.ccy || "USD", displayCcy)
      if (!map.has(d)) map.set(d, { date: d, sMFE: 0, sMAE: 0, n: 0 })
      const x = map.get(d); x.sMFE += Math.max(0, mfe); x.sMAE += Math.max(0, mae); x.n++
    }
    const arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
    let cumM = 0, cumA = 0
    return arr.map(r => {
      const avgMFE = r.n ? r.sMFE / r.n : 0
      const avgMAE = r.n ? r.sMAE / r.n : 0
      cumM += r.sMFE; cumA += r.sMAE
      return { date: r.date, avgMFE: round2(avgMFE), avgMAE: round2(avgMAE), cumMFE: round2(cumM), cumMAE: round2(cumA) }
    })
  }, [filtered, displayCcy, rates])

  /* ---------- Gains/Pertes par heure / jour / mois (TZ broker) ---------- */
  const lastDate = equitySeriesHL.at(-1)?.date || new Date().toISOString().slice(0, 10)
  const defaultFrom = useMemo(() => { const d = new Date(lastDate); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) }, [lastDate])
  const aggStart = dateFrom || defaultFrom
  const aggEnd = dateTo || lastDate
  const filteredForTimeAgg = useMemo(() => filtered.filter(t => t.date >= aggStart && t.date <= aggEnd), [filtered, aggStart, aggEnd])

  const hoursBase = Array.from({ length: 24 }, (_, h) => ({ h, label: `${String(h).padStart(2, "0")}:00`, gain: 0, loss: 0 }))
  const byHour = useMemo(() => {
    const base = hoursBase.map(x => ({ ...x }))
    for (const t of filteredForTimeAgg) {
      const tz = brokerTZ[t.broker] || "UTC"
      const h = getHourInTZ(t.open_time || (t.date + "T00:00:00Z"), tz)
      const v = convert(t.pnl, t.ccy || "USD", displayCcy)
      const b = base[h]
      if (v >= 0) b.gain += v
      else b.loss += Math.abs(v)
    }
    return base.map(x => ({ ...x, net: x.gain - x.loss }))
  }, [filteredForTimeAgg, displayCcy, rates])

  const weekLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const byWeekday = useMemo(() => {
    const base = weekLabels.map((lbl, idx) => ({ idx, label: lbl, gain: 0, loss: 0 }))
    for (const t of filteredForTimeAgg) {
      const tz = brokerTZ[t.broker] || "UTC"
      const w = getWeekdayInTZ(t.open_time || (t.date + "T00:00:00Z"), tz)
      const v = convert(t.pnl, t.ccy || "USD", displayCcy)
      const b = base.find(x => x.idx === w)
      if (v >= 0) b.gain += v
      else b.loss += Math.abs(v)
    }
    return base.map(x => ({ ...x, net: x.gain - x.loss }))
  }, [filteredForTimeAgg, displayCcy, rates])

  const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
  const byMonth = useMemo(() => {
    const base = monthLabels.map((lbl, idx) => ({ idx, label: lbl, gain: 0, loss: 0 }))
    for (const t of filteredForTimeAgg) {
      const tz = brokerTZ[t.broker] || "UTC"
      const m = getMonthInTZ(t.open_time || (t.date + "T00:00:00Z"), tz)
      const v = convert(t.pnl, t.ccy || "USD", displayCcy)
      const b = base.find(x => x.idx === m)
      if (v >= 0) b.gain += v
      else b.loss += Math.abs(v)
    }
    return base.map(x => ({ ...x, net: x.gain - x.loss }))
  }, [filteredForTimeAgg, displayCcy, rates])

  /* ---------- Corrélations ---------- */
  const corrMatrix = useMemo(() => {
    const dates = Array.from(new Set(filtered.map(t => t.date))).sort()
    const strats = Array.from(new Set(filtered.map(t => t.strategy))).sort()
    if (strats.length < 2) return { strats, matrix: [] }
    const byDayStrat = new Map()
    for (const s of strats) byDayStrat.set(s, new Map())
    for (const d of dates) for (const s of strats) byDayStrat.get(s).set(d, 0)
    for (const t of filtered) {
      const v = convert(t.pnl, t.ccy || "USD", displayCcy)
      byDayStrat.get(t.strategy).set(t.date, byDayStrat.get(t.strategy).get(t.date) + v)
    }
    const series = strats.map(s => dates.map(d => byDayStrat.get(s).get(d) || 0))
    const matrix = strats.map((_, i) => strats.map((__, j) => pearson(series[i], series[j])))
    return { strats, matrix }
  }, [filtered, displayCcy, rates])
  const corrPairs = useMemo(() => {
    const { strats, matrix } = corrMatrix
    if (!matrix.length) return []
    const vals = []
    for (let i = 0; i < strats.length; i++) for (let j = i + 1; j < strats.length; j++) vals.push(matrix[i][j])
    return vals
  }, [corrMatrix])
  const corrMean = useMemo(() => (corrPairs.length ? mean(corrPairs) : 0), [corrPairs])

  /* ---------- Calendrier ---------- */
  const [calYear, setCalYear] = useState(() => Number((lastDate || "").slice(0, 4)) || new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => (Number((lastDate || "").slice(5, 7)) - 1) || new Date().getMonth())
  function monthDays(year, monthIndex) {
    const end = new Date(year, monthIndex + 1, 0).getDate()
    const arr = []
    for (let d = 1; d <= end; d++) arr.push(new Date(year, monthIndex, d).toISOString().slice(0, 10))
    return arr
  }
  const calDates = useMemo(() => monthDays(calYear, calMonth), [calYear, calMonth])
  const monthLabel = useMemo(() => new Date(calYear, calMonth, 1).toLocaleDateString(fmtLocale(lang), { month: "long", year: "numeric" }), [calYear, calMonth, lang])
  const ymNow = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`
  const monthTradesPnl = useMemo(() => filtered.filter(t => t.date.startsWith(ymNow)).reduce((s, t) => s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, ymNow, displayCcy, rates])
  const yearTradesPnl = useMemo(() => filtered.filter(t => t.date.startsWith(String(calYear))).reduce((s, t) => s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, calYear, displayCcy, rates])

  const dailyReturns = useMemo(() => {
    const out = []
    for (let i = 1; i < equitySeriesHL.length; i++) {
      const p = equitySeriesHL[i - 1].equity_trading, c = equitySeriesHL[i].equity_trading
      out.push({ date: equitySeriesHL[i].date, ret: p === 0 ? 0 : (c - p) / p })
    }
    return out
  }, [equitySeriesHL])
  const dailyRetMap = useMemo(() => { const m = new Map(); dailyReturns.forEach(r => m.set(r.date, r.ret)); return m }, [dailyReturns])
  const monthDDMap = useMemo(() => {
    const ym = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`
    const pts = equitySeriesHL.filter(p => p.date.startsWith(ym))
    let peak = -Infinity; const m = new Map()
    for (const p of pts) { peak = Math.max(peak, p.equity_trading); m.set(p.date, peak > 0 ? (p.equity_trading - peak) / peak : 0) }
    return m
  }, [equitySeriesHL, calYear, calMonth])

  /* ---------- Modals (Flux / Capital tiers) ---------- */
  const [showFlowForm, setShowFlowForm] = useState(false)
  const [flow, setFlow] = useState({ date: new Date().toISOString().slice(0, 10), type: "darwin_mgmt_fee", amount: "", ccy: displayCcy, note: "" })
  useEffect(() => { setFlow(f => ({ ...f, ccy: displayCcy })) }, [displayCcy])
  const flowTypes = [
    { value: "darwin_mgmt_fee", label: "Darwinex – Management Fee" },
    { value: "prop_payout", label: "Prop Firm – Payout" },
    { value: "prop_fee", label: "Prop Firm – Fee Challenge" },
    { value: "deposit", label: "Dépôt" },
    { value: "withdrawal", label: "Retrait" },
    { value: "business_expense", label: "Charge Business" },
    { value: "other_income", label: "Autre Revenu" }
  ]
  const submitFlow = (e) => {
    e.preventDefault()
    const amt = Number(flow.amount)
    if (!flow.date || !flow.type || isNaN(amt)) { alert("Merci de compléter Date / Type / Montant"); return }
    const row = { date: flow.date, type: flow.type, amount: amt, ccy: flow.ccy || displayCcy, note: flow.note || "" }
    setUserCashflows(prev => prev.concat([row]))
    setShowFlowForm(false)
    setFlow({ date: new Date().toISOString().slice(0, 10), type: "darwin_mgmt_fee", amount: "", ccy: displayCcy, note: "" })
  }

  const [showTierForm, setShowTierForm] = useState(false)
  const [tier, setTier] = useState({ source: "Darwinex", amount: "", from: new Date().toISOString().slice(0, 10), to: "" })
  const submitTier = (e) => {
    e.preventDefault()
    const amt = Number(tier.amount)
    if (!tier.source || isNaN(amt)) { alert("Merci de compléter Source / Montant"); return }
    setTierCapital(prev => prev.concat([{ source: tier.source, amount: amt, from: tier.from || "", to: tier.to || "" }]))
    setShowTierForm(false)
    setTier({ source: "Darwinex", amount: "", from: new Date().toISOString().slice(0, 10), to: "" })
  }

  /* ---------- Aide / Guide ---------- */
  const [showGuide, setShowGuide] = useState(false)
  const [guide, setGuide] = useState(() => loadLS(LS_GUIDE, null))
  const guideUrl = "/guide.json" // fallback local (public/guide.json). Tu pourras remplacer par un CDN/GitHub raw.

  function fetchGuide(force=false){
    const now = Date.now()
    if (!force && guide && guide.at && (now - guide.at < 24*60*60*1000)) return
    fetch(guideUrl)
      .then(r=>r.json())
      .then(data=>{
        const payload = { at: now, data }
        setGuide(payload); saveLS(LS_GUIDE, payload)
      })
      .catch(()=>{ /* garde l’existant si offline */ })
  }
  useEffect(()=>{ fetchGuide(false) },[]) // charge une fois

  const guideSections = useMemo(()=>{
    const d = guide?.data
    if(!d || !d.locales) return []
    const loc = d.locales[lang] || d.locales["fr"]
    return loc?.sections || []
  },[guide, lang])

  /* ---------- Drawer Flux — Synthèse ---------- */
  const [showFlows, setShowFlows] = useState(false)
  const [flowsUseFilterRange, setFlowsUseFilterRange] = useState(false)

  const allFlowsConverted = useMemo(()=> allCashflows
    .map(c => ({...c, amount_disp: convert(c.amount, c.ccy || "USD", displayCcy)}))
    .sort((a,b) => a.date.localeCompare(b.date)), [allCashflows, displayCcy, rates])

  const flowsRange = useMemo(()=>{
    if (flowsUseFilterRange && (dateFrom || dateTo)) {
      const from = dateFrom || allFlowsConverted[0]?.date
      const to = dateTo || allFlowsConverted.at(-1)?.date
      return [from, to]
    }
    // auto: min flux -> max flux
    const from = allFlowsConverted[0]?.date
    const to = allFlowsConverted.at(-1)?.date
    return [from, to]
  }, [flowsUseFilterRange, dateFrom, dateTo, allFlowsConverted])

  const flowsInRange = useMemo(()=>{
    const [from, to] = flowsRange
    if(!from || !to) return []
    return allFlowsConverted.filter(f => f.date >= from && f.date <= to)
  }, [flowsRange, allFlowsConverted])

  const flowsAgg = useMemo(()=>{
    const agg = {
      deposit: 0, withdrawal: 0, prop_fee: 0, prop_payout: 0, darwin_mgmt_fee:0,
      business_expense:0, other_income:0, total:0,
      counts: {}
    }
    for (const f of flowsInRange){
      const v = f.amount_disp || 0
      agg.total += v
      agg[f.type] = (agg[f.type] || 0) + v
      agg.counts[f.type] = (agg.counts[f.type] || 0) + 1
    }
    return agg
  }, [flowsInRange])

  function flowsRows(){
    const mapName = {
      deposit:"Dépôts", withdrawal:"Retraits", prop_fee:"Prop Fees", prop_payout:"Payouts Prop",
      darwin_mgmt_fee:"Darwinex Fee", business_expense:"Charges", other_income:"Autres revenus"
    }
    const keys = ["deposit","withdrawal","prop_payout","prop_fee","darwin_mgmt_fee","business_expense","other_income"]
    return keys.map(k=>{
      const val = flowsAgg[k]||0, n = flowsAgg.counts[k]||0
      const avg = n? val/n : 0
      return { key:k, label: mapName[k]||k, amount: val, n, avg }
    })
  }

  const top5Flows = useMemo(()=>{
    const sorted = [...flowsInRange].sort((a,b)=> Math.abs(b.amount_disp||0) - Math.abs(a.amount_disp||0))
    return sorted.slice(0,5)
  }, [flowsInRange])

  /* ---------- Exports ---------- */
  const exportFlowsCSV = ()=>{
    const header = ["date","type",`amount_${displayCcy}`,"note"]
    const rows = flowsInRange.map(f => [f.date, f.type, (f.amount_disp||0).toFixed(2), f.note||""])
    const csv = [header, ...rows].map(r=>r.join(",")).join("\n")
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=`flux_${displayCcy}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  /* ---------- Verdits (classes) ---------- */
  const verdictPNL = verdictOf(totalPnlDisp, { mode: "sign" })
  const verdictDDpct = verdictOf(maxDDPct, { mode: "ddpct" })
  const verdictDDabs = verdictDDpct
  const verdictEI = verdictOf(edgeIndex, { mode: "ei" })
  const verdictExpect = verdictOf(expectancy, { mode: "expectancy" })
  const verdictSharpe = verdictOf(sharpe, { mode: "sharpe" })
  const verdictSortino = verdictOf(sortino, { mode: "sortino" })
  const verdictRF = verdictOf(recoveryFactor, { mode: "rf" })
  const verdictCorr = verdictOf(Math.abs(corrMean), { mode: "corrMean" })
  const verdictRuin = verdictOf(ruinRisk, { mode: "ruin" })

  /* ---------- Render ---------- */
  return (
    <div className="app">
      {/* HEADER */}
      <div className="header">
        <div>
          <h1 className="brand">ZooProjectVision</h1>
          <div className="subtitle-wrap">
            {!editSub ? (
              <>
                <p className="subtitle">{subtitle}</p>
                <button className="btn ghost sm" onClick={() => setEditSub(true)} title="Modifier le sous-titre">✏️</button>
              </>
            ) : (
              <form className="subtitle-edit" onSubmit={(e) => { e.preventDefault(); setEditSub(false); saveLS(LS_SUB, subtitle) }}>
                <input className="input" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                <button className="btn sm" type="submit">Valider</button>
                <button className="btn ghost sm" type="button" onClick={() => setEditSub(false)}>Annuler</button>
              </form>
            )}
          </div>
        </div>

        <div className="header-actions">
          {/* Import CSV */}
          <label className="btn label-file">
            importer csv
            <input
              type="file" accept=".csv"
              onChange={e => {
                const f = e.target.files?.[0]; if (!f) return
                const fr = new FileReader()
                fr.onload = () => {
                  const rows = parseCSV(String(fr.result))
                  const mapped = mapMT5Rows(rows)
                  if (!mapped.length) { alert("CSV non reconnu. Vérifie Time/Symbol/Profit (+ MFE/MAE si dispo)."); return }
                  setUserTrades(prev => prev.concat(mapped))
                }
                fr.readAsText(f)
              }}
            />
          </label>

          {/* Ajouter Flux */}
          <button className="btn" onClick={() => setShowFlowForm(true)}>ajouter flux</button>

          {/* Capital tiers */}
          <button className="btn" onClick={() => setShowTierForm(true)}>capital tiers</button>

          {/* Export */}
          <button className="btn" onClick={exportFlowsCSV}>export flux</button>

          {/* Drawer Flux — Synthèse */}
          <button className="btn" onClick={() => setShowFlows(true)}>flux — synthèse</button>

          {/* Aide / Guide */}
          <button className="btn" onClick={() => { setShowGuide(true); fetchGuide(false) }}>aide / guide</button>

          {/* Langue */}
          <select className="input lang" value={lang} onChange={e=>setLang(normLang(e.target.value))}>
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>

          {/* Reset filtres */}
          <button className="btn" onClick={resetFilters}>réinitialiser</button>

          {/* Devise */}
          <select className="input" value={displayCcy} onChange={e => setDisplayCcy(e.target.value)}>
            {["USD", "EUR", "CHF"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* FILTRES */}
      <div className="card grid-7">
        <div>
          <div className="label">Actif</div>
          <select value={asset} onChange={e => setAsset(e.target.value)} className="input">
            <option>All</option>
            {assets.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Broker</div>
          <select value={broker} onChange={e => setBroker(e.target.value)} className="input">
            <option>All</option>
            {brokers.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Stratégie</div>
          <select value={strategy} onChange={e => setStrategy(e.target.value)} className="input">
            <option>All</option>
            {strategies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Du</div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
        </div>
        <div>
          <div className="label">Au</div>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
        </div>
        <div>
          <div className="label">Devise</div>
          <select value={displayCcy} onChange={e => setDisplayCcy(e.target.value)} className="input">
            {["USD", "EUR", "CHF"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div />
      </div>

      {/* KPI PRINCIPAUX */}
      <div className="kpi-grid">
        <div className="card">
          <div className="kpi-title">Capital Initial</div>
          <div className="kpi-val white">{fmtC(capitalInitialDisp)}</div>
        </div>

        <div className={`card ${verdictClass(verdictPNL)}`}>
          <div className="kpi-title">PNL (Filtré)</div>
          <div className={`kpi-val ${totalPnlDisp >= 0 ? "pos" : "neg"}`}>{fmtC(totalPnlDisp)}</div>
        </div>

        <div className="card">
          <div className="kpi-title">Cash Flow</div>
          <div className={`kpi-val ${cashFlowTotal >= 0 ? "pos" : "neg"}`}>{fmtC(cashFlowTotal)}</div>
        </div>

        <div className="card">
          <div className="kpi-title">Capital Global</div>
          <div className="kpi-val">{fmtC(capitalGlobal)}</div>
        </div>

        <div className="card">
          <div className="kpi-title">Total Trades</div>
          <div className="kpi-val">{filtered.length}</div>
        </div>

        <div className={`card ${verdictClass(verdictDDpct)}`}>
          <div className="kpi-title">Max DD (%)</div>
          <div className="kpi-val">{maxDDPct.toFixed(2)}%</div>
        </div>

        <div className={`card ${verdictClass(verdictDDabs)}`}>
          <div className="kpi-title">Max DD (Abs)</div>
          <div className="kpi-val">{fmtC(maxDDAbs)}</div>
        </div>

        <div className="card">
          <div className="kpi-title">Capital Tiers Sous Gestion</div>
          <div className="kpi-val">{fmtC(tierCapital.filter(x => !x.to || x.to >= lastDate).reduce((s, x) => s + (x.amount || 0), 0))}</div>
        </div>
      </div>

      {/* RATIOS PRIORITAIRES (WR/RR + EI) */}
      <div className={`card ${verdictClass(verdictEI)}`}>
        <div className="kpi-title">Win Rate & RR — Edge Index</div>
        <div className="kpi-rows">
          {/* Donut WR */}
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Gagnants", value: wr },
                    { name: "Perdants", value: 100 - wr }
                  ]}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={85}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill={`url(#gradGreen)`} />
                  <Cell fill={`url(#gradPink)`} />
                </Pie>
                <defs>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} /><stop offset="100%" stopColor={C.green2} />
                  </linearGradient>
                  <linearGradient id="gradPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.pink} /><stop offset="100%" stopColor={C.pink2} />
                  </linearGradient>
                </defs>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">{wr.toFixed(1)}%</div>
          </div>

          {/* Gagnants / Perdants (comptage) */}
          <div className="bars-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { type: "Gagnants", n: filtered.filter(t => t.pnl > 0).length },
                { type: "Perdants", n: filtered.filter(t => t.pnl < 0).length },
              ]} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="type" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <Tooltip content={<GLTooltip C={C} fmtC={(x) => new Intl.NumberFormat(fmtLocale(lang)).format(x)} />} />
                <Bar dataKey="n" name="Comptage" radius={[6, 6, 0, 0]}>
                  <Cell fill={`var(--green)`} />
                  <Cell fill={`var(--pink)`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* RR + Expectancy + EI */}
          <div className="mini-kpis">
            <div className="mini">
              <div className="label">Risk / Reward</div>
              <div className="val">{rr.toFixed(2)}</div>
            </div>
            <div className={`mini ${verdictClass(verdictExpect)}`}>
              <div className="label">Expectancy / Trade</div>
              <div className={`val ${expectancy >= 0 ? "pos" : "neg"}`}>{fmtC(expectancy)}</div>
            </div>
            <div className={`mini ${verdictClass(verdictEI)}`}>
              <div className="label">Edge Index</div>
              <div className={`val ${edgeIndex >= 0 ? "pos" : "neg"}`}>{edgeIndex.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AUTRES RATIOS */}
      <div className="kpi-grid four">
        <div className={`card ${verdictClass(verdictSharpe)}`}>
          <div className="kpi-title">Sharpe (Ann.)</div>
          <div className="kpi-val">{sharpe.toFixed(2)}</div>
        </div>
        <div className={`card ${verdictClass(verdictSortino)}`}>
          <div className="kpi-title">Sortino (Ann.)</div>
          <div className="kpi-val">{sortino.toFixed(2)}</div>
        </div>
        <div className={`card ${verdictClass(verdictRF)}`}>
          <div className="kpi-title">Recovery Factor</div>
          <div className="kpi-val">{recoveryFactor.toFixed(2)}</div>
        </div>
        <div className={`card ${verdictClass(verdictCorr)}`}>
          <div className="kpi-title">Corrélation Moyenne (|·|)</div>
          <div className="kpi-val">{Math.abs(corrMean).toFixed(2)}</div>
        </div>
      </div>

      {/* COURBE D’ÉQUITÉ */}
      <div className="card tall">
        <div className="kpi-title-row">
          <div className="kpi-title">Courbe d’Équité</div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={equitySeriesHL} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
            <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
            <Tooltip
              contentStyle={{ background: C.panel, border: "1px solid var(--border)", color: C.text, borderRadius: 10 }}
              labelStyle={{ color: C.text }} itemStyle={{ color: C.text }}
              formatter={(value, name) => [fmtC(value), name]}
            />
            <Legend wrapperStyle={{ color: C.text }} />
            <Line type="monotone" dataKey="equity_trading" name="Équité (trading seul)" dot={false} stroke={C.white} strokeWidth={1.8} isAnimationActive={false} />
            <Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#9aa0a6" strokeDasharray="5 4" strokeWidth={1.2} />
            <Line type="monotone" dataKey="hwm" name="Plus Haut (HWM)" dot={false} stroke={C.green} strokeWidth={1.2} strokeDasharray="4 3" />
            <Line type="monotone" dataKey="lwm" name="Plus Bas (LWM)" dot={false} stroke={C.pink} strokeWidth={1.2} strokeDasharray="4 3" />
            {cashflowsInRange
              .filter(c => ["deposit", "withdrawal", "prop_fee", "prop_payout", "darwin_mgmt_fee"].includes(c.type))
              .map((c, i) => {
                const y = equityWithFlowsAt(c.date)
                const color = c.amount >= 0 ? C.green : C.pink
                return (y != null) ? <ReferenceDot key={i} x={c.date} y={y} r={4} fill={color} stroke="none" /> : null
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MFE / MAE — Quotidien (Moyenne) */}
      <div className="card tall">
        <div className="kpi-title-row">
          <div className="kpi-title">MFE / MAE — Quotidien (Moyenne)</div>
          <Help text="MFE: meilleur gain latent. MAE: pire perte latente. Moyennés par jour après filtres." />
        </div>
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={mfeMaeDaily} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
            <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
            <Tooltip
              contentStyle={{ background: C.panel, border: "1px solid var(--border)", color: C.text, borderRadius: 10 }}
              labelStyle={{ color: C.text }} itemStyle={{ color: C.text }}
              formatter={(v, n) => [fmtC(v), (n === "avgMFE") ? "MFE Moyen" : "MAE Moyen"]}
            />
            <Legend wrapperStyle={{ color: C.text }} />
            <Line type="monotone" dataKey="avgMFE" name="MFE Moyen" dot={false} stroke={C.green} strokeWidth={2} />
            <Line type="monotone" dataKey="avgMAE" name="MAE Moyen" dot={false} stroke={C.pink} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MFE / MAE — Cumul */}
      <div className="card tall">
        <div className="kpi-title">Cumul MFE / MAE</div>
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={mfeMaeDaily} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
            <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
            <Tooltip
              contentStyle={{ background: C.panel, border: "1px solid var(--border)", color: C.text, borderRadius: 10 }}
              labelStyle={{ color: C.text }} itemStyle={{ color: C.text }}
              formatter={(v, n) => [fmtC(v), (n === "cumMFE") ? "Cumul MFE" : "Cumul MAE"]}
            />
            <Legend wrapperStyle={{ color: C.text }} />
            <Line type="monotone" dataKey="cumMFE" name="Cumul MFE" dot={false} stroke={C.green} strokeWidth={2.2} />
            <Line type="monotone" dataKey="cumMAE" name="Cumul MAE" dot={false} stroke={C.pink} strokeWidth={2.2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* GAINS / PERTES — Heure / Jour / Mois */}
      <div className="grid-3">
        <div className={`card tall ${verdictClass(verdictOf((byHour.reduce((s, x) => s + x.net, 0)), { mode: "sign" }))}`}>
          <div className="kpi-title">Gains / Pertes — Par Heure</div>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={byHour} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="label" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <Tooltip content={<GLTooltip C={C} fmtC={fmtC} />} />
              <Legend wrapperStyle={{ color: C.text }} />
              <Bar dataKey="gain" name="Gagnants" fill="var(--green)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="loss" name="Perdants" fill="var(--pink)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`card tall ${verdictClass(verdictOf((byWeekday.reduce((s, x) => s + x.net, 0)), { mode: "sign" }))}`}>
          <div className="kpi-title">Gains / Pertes — Par Jour</div>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={byWeekday} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="label" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <Tooltip content={<GLTooltip C={C} fmtC={fmtC} />} />
              <Legend wrapperStyle={{ color: C.text }} />
              <Bar dataKey="gain" name="Gagnants" fill="var(--green)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="loss" name="Perdants" fill="var(--pink)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`card tall ${verdictClass(verdictOf((byMonth.reduce((s, x) => s + x.net, 0)), { mode: "sign" }))}`}>
          <div className="kpi-title">Gains / Pertes — Par Mois</div>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={byMonth} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="label" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <Tooltip content={<GLTooltip C={C} fmtC={fmtC} />} />
              <Legend wrapperStyle={{ color: C.text }} />
              <Bar dataKey="gain" name="Gagnants" fill="var(--green)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="loss" name="Perdants" fill="var(--pink)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HEATMAP CORRÉLATION */}
      <div className="card">
        <div className="kpi-title">Corrélation par Stratégie (PnL quotidien)</div>
        <CorrelationHeatmap C={C} corrMatrix={corrMatrix} />
      </div>

      {/* CALENDRIER */}
      <div className="card">
        <div className="calendar-head">
          <div className="kpi-title">Calendrier / {monthLabel}</div>
          <div className="cal-ctrl">
            <button className="btn ghost" onClick={() => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y-- } setCalMonth(m); setCalYear(y) }}>◀</button>
            <button className="btn ghost" onClick={() => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++ } setCalMonth(m); setCalYear(y) }}>▶</button>
          </div>
        </div>
        <div className="calendar-meta">
          <span>Mensuel (trading) : <b className={monthTradesPnl >= 0 ? "pos" : "neg"}>{fmtC(monthTradesPnl)}</b></span>
          <span>Annuel (trading) : <b className={yearTradesPnl >= 0 ? "pos" : "neg"}>{fmtC(yearTradesPnl)}</b></span>
        </div>
        <div className="cal-grid">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} className="cal-dow">{d}</div>)}
          {calDates.map(dt => {
            const ret = dailyRetMap.get(dt)
            const dd = monthDDMap.get(dt) || 0
            let kind = "good"
            if (dd <= -0.02) kind = "bad"
            else if (dd <= -0.01) kind = "warn"
            else kind = "good"
            return (
              <div key={dt} className={`cal-cell ${verdictClass(kind)}`}>
                <div className="cal-date">{Number(dt.slice(8, 10))}</div>
                <div className={ret >= 0 ? "pos" : "neg"}>{ret != null ? `${(ret * 100).toFixed(2)}%` : "—"}</div>
                <div className="muted">{dd != null ? `${Math.abs(dd * 100).toFixed(2)}%` : "—"}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DRAWER — AIDE / GUIDE */}
      {showGuide && (
        <div className="drawer" onClick={()=>setShowGuide(false)}>
          <div className="drawer-card" onClick={e=>e.stopPropagation()}>
            <div className="drawer-head">
              <div>Aide / Guide</div>
              <div className="gap">
                <select className="input lang" value={lang} onChange={e=>setLang(normLang(e.target.value))}>
                  <option value="fr">FR</option>
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                </select>
                <button className="btn ghost sm" onClick={()=>fetchGuide(true)}>Mettre à jour</button>
                <button className="btn ghost sm" onClick={()=>setShowGuide(false)}>Fermer</button>
              </div>
            </div>
            <div className="guide-body">
              {guideSections.length===0 ? (
                <div className="muted">Le guide n’est pas disponible hors ligne pour cette langue.</div>
              ) : (
                guideSections.map(sec=>(
                  <details key={sec.id} open className="guide-sec">
                    <summary className="guide-title">{sec.title}</summary>
                    {(sec.items||[]).map((it,idx)=>(
                      <div key={sec.id+'-'+idx} className="guide-item">
                        <div className="guide-item-title">{it.title}</div>
                        <div className="guide-item-text">{it.text}</div>
                      </div>
                    ))}
                  </details>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER — FLUX SYNTHÈSE */}
      {showFlows && (
        <div className="drawer" onClick={()=>setShowFlows(false)}>
          <div className="drawer-card wide" onClick={e=>e.stopPropagation()}>
            <div className="drawer-head">
              <div>Flux — Synthèse</div>
              <div className="gap">
                <label className="toggle">
                  <input type="checkbox" checked={flowsUseFilterRange} onChange={e=>setFlowsUseFilterRange(e.target.checked)} />
                  <span>Appliquer filtres (Du/Au)</span>
                </label>
                <button className="btn ghost sm" onClick={()=>setShowFlows(false)}>Fermer</button>
              </div>
            </div>

            <div className="kpi-grid four">
              <div className="card">
                <div className="kpi-title">Total Apports</div>
                <div className="kpi-val pos">{fmtC((flowsAgg.deposit||0) + (flowsAgg.other_income||0))}</div>
              </div>
              <div className="card">
                <div className="kpi-title">Total Retraits</div>
                <div className="kpi-val neg">{fmtC(flowsAgg.withdrawal||0)}</div>
              </div>
              <div className="card">
                <div className="kpi-title">Payouts (Prop)</div>
                <div className="kpi-val pos">{fmtC(flowsAgg.prop_payout||0)}</div>
              </div>
              <div className="card">
                <div className="kpi-title">Frais (Prop + Darwinex + Charges)</div>
                <div className="kpi-val neg">{fmtC((flowsAgg.prop_fee||0)+(flowsAgg.darwin_mgmt_fee||0)+(flowsAgg.business_expense||0))}</div>
              </div>
            </div>

            <div className="card" style={{marginTop:12}}>
              <div className="kpi-title">Net Flows</div>
              <div className={`kpi-val ${flowsAgg.total>=0?'pos':'neg'}`}>{fmtC(flowsAgg.total||0)}</div>
              <div className="muted" style={{marginTop:6}}>
                Période : {flowsRange[0] || '—'} → {flowsRange[1] || '—'} · Devise : {displayCcy}
              </div>
            </div>

            <div className="card" style={{marginTop:12}}>
              <div className="kpi-title">Détail par catégorie</div>
              <div className="table">
                <div className="tr th">
                  <div>Catégorie</div><div>Montant</div><div>Événements</div><div>Moyenne</div>
                </div>
                {flowsRows().map(r=>(
                  <div className="tr" key={r.key}>
                    <div>{r.label}</div>
                    <div className={r.amount>=0?'pos':'neg'}>{fmtC(r.amount)}</div>
                    <div>{r.n}</div>
                    <div className={r.avg>=0?'pos':'neg'}>{fmtC(r.avg)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{marginTop:12}}>
              <div className="kpi-title">Top 5 mouvements</div>
              {top5Flows.length===0 ? (
                <div className="muted">Aucun flux sur la période.</div>
              ) : (
                <div className="table">
                  <div className="tr th"><div>Date</div><div>Type</div><div>Note</div><div>Montant</div></div>
                  {top5Flows.map((f,i)=>(
                    <div className="tr" key={i}>
                      <div>{f.date}</div>
                      <div>{f.type}</div>
                      <div title={f.note||''} className="ellipsis">{f.note||'—'}</div>
                      <div className={f.amount_disp>=0?'pos':'neg'}>{fmtC(f.amount_disp)}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{marginTop:10, display:'flex', justifyContent:'flex-end'}}>
                <button className="btn" onClick={exportFlowsCSV}>export csv flux</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Flux */}
      {showFlowForm && (
        <div className="modal" onClick={() => setShowFlowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>Ajouter un flux</div>
              <button className="btn ghost sm" onClick={() => setShowFlowForm(false)}>Fermer</button>
            </div>
            <form onSubmit={submitFlow} className="form-grid">
              <label><span>Type</span>
                <select value={flow.type} onChange={e => setFlow(f => ({ ...f, type: e.target.value }))} className="input">
                  {flowTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label><span>Date</span>
                <input type="date" value={flow.date} onChange={e => setFlow(f => ({ ...f, date: e.target.value }))} className="input" />
              </label>
              <label><span>Devise</span>
                <select value={flow.ccy} onChange={e => setFlow(f => ({ ...f, ccy: e.target.value }))} className="input">
                  {["USD", "EUR", "CHF"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label><span>Montant</span>
                <input type="number" step="0.01" placeholder="ex: 250.00" value={flow.amount} onChange={e => setFlow(f => ({ ...f, amount: e.target.value }))} className="input" />
              </label>
              <label className="span2"><span>Note</span>
                <input type="text" placeholder="optionnel" value={flow.note} onChange={e => setFlow(f => ({ ...f, note: e.target.value }))} className="input" />
              </label>
              <div className="form-actions">
                <button type="button" className="btn ghost" onClick={() => setShowFlowForm(false)}>Annuler</button>
                <button type="submit" className="btn">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL — Capital Tiers */}
      {showTierForm && (
        <div className="modal" onClick={() => setShowTierForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>Capital Tiers Sous Gestion</div>
              <button className="btn ghost sm" onClick={() => setShowTierForm(false)}>Fermer</button>
            </div>
            <form onSubmit={submitTier} className="form-grid">
              <label><span>Source</span>
                <input className="input" value={tier.source} onChange={e => setTier(t => ({ ...t, source: e.target.value }))} />
              </label>
              <label><span>Montant</span>
                <input type="number" step="0.01" className="input" value={tier.amount} onChange={e => setTier(t => ({ ...t, amount: e.target.value }))} />
              </label>
              <label><span>Du</span>
                <input type="date" className="input" value={tier.from} onChange={e => setTier(t => ({ ...t, from: e.target.value }))} />
              </label>
              <label><span>Au</span>
                <input type="date" className="input" value={tier.to} onChange={e => setTier(t => ({ ...t, to: e.target.value }))} />
              </label>
              <div className="form-actions span2">
                <button type="button" className="btn ghost" onClick={() => setShowTierForm(false)}>Annuler</button>
                <button type="submit" className="btn">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="footer">ZooProjectVision © {new Date().getFullYear()}</div>
    </div>
  )
}

/* ===== Tooltip custom Gains/Pertes — 1 ligne par catégorie, format auto ===== */
function GLTooltip({ active, payload, label, C, fmtC }) {
  if (!active || !payload || !payload.length) return null
  const usesCount = payload.some(p => p.dataKey === "n")
  const agg = new Map()
  payload.forEach(p => {
    const cat =
      (p.payload && p.payload.type)
        ? String(p.payload.type)
        : (p.name === "loss" ? "Perdants" : p.name === "gain" ? "Gagnants" : (p.name || ""))
    const val = Number.isFinite(p.value) ? p.value : 0
    agg.set(cat, (agg.get(cat) || 0) + val)
  })
  const fmtInt = v => new Intl.NumberFormat(undefined).format(v)
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", color: "var(--text)" }}>
      {label != null && <div style={{ marginBottom: 6, opacity: .9 }}>{label}</div>}
      {[...agg.entries()].map(([cat, val], i) => {
        const isLoss = cat.toLowerCase().startsWith("perd")
        const valueText = usesCount ? fmtInt(val) : fmtC(val)
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{cat}</span>
            <b style={{ color: isLoss ? "var(--pink)" : "var(--green)" }}>{valueText}</b>
          </div>
        )
      })}
    </div>
  )
}

/* ===== Petite aide (?) au survol ===== */
function Help({ text }) {
  return <span className="help" title={text}>?</span>
}

/* ===== Heatmap corrélation rouge→orange→vert ===== */
function CorrelationHeatmap({ C, corrMatrix }) {
  const { strats, matrix } = corrMatrix
  if (!matrix || !matrix.length || strats.length < 2) {
    return <div className="muted" style={{ padding: 8 }}>Ajoute au moins 2 stratégies pour voir la corrélation.</div>
  }
  const colorFor = (v) => {
    if (v >= 0.66) return "var(--bad-bg)"
    if (v >= 0.33) return "rgba(255,171,73,0.20)"
    if (v >= 0) return "rgba(34,230,201,0.14)"
    return "rgba(34,230,201,0.22)"
  }
  return (
    <div className="heatmap">
      <div className="heatmap-head">
        <div className="corner" />
        {strats.map(s => <div key={"h" + s} className="head">{s}</div>)}
      </div>
      <div className="heatmap-body">
        {matrix.map((row, i) => (
          <div key={"r" + i} className="row">
            <div className="head">{strats[i]}</div>
            {row.map((v, j) => (
              <div
                key={`c${i}-${j}`}
                className="cell"
                title={`${strats[i]} vs ${strats[j]} : ${v.toFixed(2)}`}
                style={{ background: colorFor(v) }}
              >
                <span>{v.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
