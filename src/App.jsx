// ZooProjectVision — App.jsx — V4.3.1 (baseline propre, blocs repérés)
// IMPORTANT : Cette version inclut :
// - Thème minimaliste (Inter), couleurs unifiées
// - Sous-titre éditable, persistance localStorage
// - Devises USD/EUR/CHF (API exchangerate.host + fallback)
// - Import CSV MT4/MT5 + MFE/MAE
// - Cashflows + points sur équité “avec flux” (sans lignes verticales)
// - Courbe Équité (trading seul = blanc fin) + HWM/LWM + avec flux (gris)
// - Vue PnL Global (base 0) et Vue Stratégie(s) (lignes fines par stratégie)
// - KPI principaux (Capital initial, Cash Flow, PnL filtré, Capital global, Total trades, Capital tiers neutre)
// - Ratios neutres : Win rate, RR, Expectancy, Sharpe, Sortino, Recovery, Corrélation stratégies
// - Opérationnels : Jours actifs, Durée moyenne, Peak/Trough, Max DD %/montant
// - Win rate donut (centrage), barres Gagnants/Perdants
// - Gains/Pertes agrégés par Heure/Jour/Mois
// - Calendrier enrichi (PnL jour, ret%, DD% & montant, nb trades/jour, week-ends)
// - Aide/Guide auto (guide.fr/en/es.json) + sélecteur de langue
//
// NB : Les classes CSS supposent que styles.css de V4.3.1 est déjà en place.

import React, { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  CartesianGrid, ReferenceDot, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

/* [BLOCK A] START — Thème & utilitaires (couleurs, formats) */
const C = {
  bg: '#0a0a0b',
  text: '#e8ecef',
  muted: '#b6bcc1',
  panel: '#141414',
  border: '#242424',
  white: '#ffffff',
  axis: '#d0d3d6',      // très clair
  green: '#20e3d6',     // vert gloss
  green2: '#18b8ad',
  pink: '#ff5fa2',      // rose gloss
  pink2: '#ff7cbf',
  turq: '#20e3d6',
  gold: '#c9a44b'
}

function fmtNum(n) {
  try { return new Intl.NumberFormat(undefined).format(n ?? 0) }
  catch { return String(n ?? 0) }
}
function fmtPct(n, digits = 2) {
  const v = Number(n ?? 0)
  return `${v.toFixed(digits)}%`
}
function fmtMoney(v, ccy = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: ccy,
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(v ?? 0)
  } catch {
    return `${(v ?? 0).toFixed(2)} ${ccy}`
  }
}
/* [BLOCK A] END — Thème & utilitaires (couleurs, formats) */


/* [BLOCK B] START — Données & persistance (imports CSV, cashflows, sous-titre, capital tiers) */
const CAPITAL_INITIAL_USD = 100000

const DEMO_ASSETS = ['XAUUSD', 'DAX', 'US500', 'USTEC', 'US30']
const DEMO_BROKERS = ['Darwinex', 'ICMarkets', 'Pepperstone']
const DEMO_STRATS = ['Strategy 1', 'Strategy 2', 'Breakout']

function makeDemoTrades() {
  const rows = []
  const today = new Date()
  for (let i = 120; i >= 1; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    for (let k = 0; k < 6; k++) {
      const asset = DEMO_ASSETS[(i + k) % DEMO_ASSETS.length]
      const broker = DEMO_BROKERS[(i + k * 2) % DEMO_BROKERS.length]
      const strategy = DEMO_STRATS[(i + k * 3) % DEMO_STRATS.length]
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
        pnl, ccy: 'USD',
        open_time: open.toISOString(),
        close_time: close.toISOString(),
        mfe, mae
      })
    }
  }
  return rows
}

const demoTrades = makeDemoTrades()

const demoCashflows = [
  { date: '2025-01-05', type: 'deposit', amount: 2000, ccy: 'USD', note: 'Apport' },
  { date: '2025-02-10', type: 'prop_fee', amount: -500, ccy: 'USD', note: 'Prop challenge' },
  { date: '2025-03-15', type: 'prop_payout', amount: 1000, ccy: 'USD', note: 'Payout prop' },
  { date: '2025-04-02', type: 'darwin_mgmt_fee', amount: 250, ccy: 'USD', note: 'Darwinex mgmt fee' },
  { date: '2025-05-20', type: 'withdrawal', amount: -800, ccy: 'USD', note: 'Retrait' },
]
/* [BLOCK B] END — Données & persistance (imports CSV, cashflows, sous-titre, capital tiers) */


/* [BLOCK C] START — Devises & taux de change (conversion USD/EUR/CHF) */
const fxFallback = {
  USD: { USD: 1, EUR: 0.93, CHF: 0.88 },
  EUR: { USD: 1 / 0.93, EUR: 1, CHF: 0.88 / 0.93 },
  CHF: { USD: 1 / 0.88, EUR: 0.93 / 0.88, CHF: 1 }
}
/* [BLOCK C] END — Devises & taux de change (conversion USD/EUR/CHF) */


export default function App() {
  try {

    /* [BLOCK B] — états persistés */
    const [userTrades, setUserTrades] = useState(() => {
      const raw = localStorage.getItem('zp_trades_custom_v431')
      return raw ? JSON.parse(raw) : []
    })
    useEffect(() => {
      localStorage.setItem('zp_trades_custom_v431', JSON.stringify(userTrades))
    }, [userTrades])

    const [userCashflows, setUserCashflows] = useState(() => {
      const raw = localStorage.getItem('zp_cashflows_custom_v431')
      return raw ? JSON.parse(raw) : []
    })
    useEffect(() => {
      localStorage.setItem('zp_cashflows_custom_v431', JSON.stringify(userCashflows))
    }, [userCashflows])

    const [capitalTiers, setCapitalTiers] = useState(() => {
      const raw = localStorage.getItem('zp_capital_tiers_v431')
      return raw ? Number(raw) : 0
    })
    useEffect(() => {
      localStorage.setItem('zp_capital_tiers_v431', String(capitalTiers || 0))
    }, [capitalTiers])

    const [subtitle, setSubtitle] = useState(() => {
      return localStorage.getItem('zp_subtitle_v431') || 'dashboard de performance multi-stratégies'
    })
    const [editingSubtitle, setEditingSubtitle] = useState(false)
    useEffect(() => {
      localStorage.setItem('zp_subtitle_v431', subtitle || '')
    }, [subtitle])

    const [lang, setLang] = useState(() => localStorage.getItem('zp_lang_v431') || 'fr')
    useEffect(() => {
      localStorage.setItem('zp_lang_v431', lang)
    }, [lang])

    /* [BLOCK C] — devises & taux */
    const [displayCcy, setDisplayCcy] = useState('USD')
    useEffect(() => {
      const cached = localStorage.getItem('zp_fx_cache_v431')
      const now = Date.now()
      if (cached) {
        const { at, data } = JSON.parse(cached)
        if (now - at < 24 * 60 * 60 * 1000) {
          setRates(data); return
        }
      }
      fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF')
        .then(r => r.json())
        .then(j => {
          const data = {
            USD: { USD: 1, EUR: j.rates.EUR, CHF: j.rates.CHF },
            EUR: { USD: 1 / j.rates.EUR, EUR: 1, CHF: j.rates.CHF / j.rates.EUR },
            CHF: { USD: 1 / j.rates.CHF, EUR: j.rates.EUR / j.rates.CHF, CHF: 1 }
          }
          setRates(data)
          localStorage.setItem('zp_fx_cache_v431', JSON.stringify({ at: now, data }))
        })
        .catch(() => { /* fallback */ })
    }, [])
    const [rates, setRates] = useState(null)

    const convert = (val, from = 'USD', to = displayCcy) => {
      if (val == null) return 0
      if (from === to) return Number(Number(val).toFixed(2))
      const table = rates || fxFallback
      const r = (table[from] && table[from][to]) ? table[from][to] : 1
      return Number((val * r).toFixed(2))
    }
    const fmtC = (v) => fmtMoney(v, displayCcy)

    /* [BLOCK D] START — Filtres (actif, broker, stratégie, dates) */
    const tradesAll = useMemo(() => demoTrades.concat(userTrades), [userTrades])

    const [asset, setAsset] = useState('All')
    const [broker, setBroker] = useState('All')
    const [strategy, setStrategy] = useState('All')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const resetFilters = () => { setAsset('All'); setBroker('All'); setStrategy('All'); setDateFrom(''); setDateTo('') }

    const assets = useMemo(() => Array.from(new Set(tradesAll.map(t => t.asset))), [tradesAll])
    const brokers = useMemo(() => Array.from(new Set(tradesAll.map(t => t.broker))), [tradesAll])
    const strategies = useMemo(() => Array.from(new Set(tradesAll.map(t => t.strategy))), [tradesAll])

    const filtered = useMemo(() => tradesAll.filter(t => {
      if (asset !== 'All' && t.asset !== asset) return false
      if (broker !== 'All' && t.broker !== broker) return false
      if (strategy !== 'All' && t.strategy !== strategy) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      return true
    }), [tradesAll, asset, broker, strategy, dateFrom, dateTo])
    /* [BLOCK D] END — Filtres (actif, broker, stratégie, dates) */

    /* [BLOCK E] START — Cashflows filtrés & capital */
    const allCashflows = useMemo(() => demoCashflows.concat(userCashflows), [userCashflows])
    const cashflowsInRange = useMemo(() => {
      const list = allCashflows.filter(c => {
        if (dateFrom && c.date < dateFrom) return false
        if (dateTo && c.date > dateTo) return false
        return true
      })
      return list.map(c => ({ ...c, amount_disp: convert(c.amount, c.ccy, displayCcy) }))
    }, [allCashflows, dateFrom, dateTo, displayCcy, rates])

    const cashFlowTotal = useMemo(() =>
      cashflowsInRange.reduce((a, c) => a + (c.amount_disp || 0), 0),
      [cashflowsInRange]
    )

    const capitalInitialDisp = useMemo(() =>
      convert(CAPITAL_INITIAL_USD, 'USD', displayCcy), [displayCcy, rates]
    )
    const capitalBase = useMemo(() => capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])
    /* [BLOCK E] END — Cashflows filtrés & capital */

    /* [BLOCK G] START — Équité & drawdown (trading seul / avec flux) */
    function groupByDateSumPnlDisp(rows) {
      const m = new Map()
      for (const r of rows) {
        const v = convert(r.pnl, r.ccy || 'USD', displayCcy)
        m.set(r.date, (m.get(r.date) || 0) + v)
      }
      return Array.from(m, ([date, pnl]) => ({ date, pnl }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }
    const pnlByDate = useMemo(() => groupByDateSumPnlDisp(filtered), [filtered, displayCcy, rates])

    const cashByDate = useMemo(() => {
      const m = new Map()
      for (const c of cashflowsInRange) {
        m.set(c.date, (m.get(c.date) || 0) + (c.amount_disp || 0))
      }
      return Array.from(m, ([date, cash]) => ({ date, cash }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }, [cashflowsInRange])

    const cashCumMap = useMemo(() => {
      let cum = 0; const m = new Map()
      for (const c of cashByDate) { cum += c.cash; m.set(c.date, Number(cum.toFixed(2))) }
      return m
    }, [cashByDate])

    const pnlMap = useMemo(() => {
      const m = new Map(); pnlByDate.forEach(p => m.set(p.date, p.pnl)); return m
    }, [pnlByDate])

    const mergedDates = useMemo(() => {
      const s = new Set()
      pnlByDate.forEach(x => s.add(x.date))
      cashByDate.forEach(x => s.add(x.date))
      return Array.from(s).sort((a, b) => a.localeCompare(b))
    }, [pnlByDate, cashByDate])

    const equityMerged = useMemo(() => {
      let eqTrading = capitalInitialDisp
      const out = []
      for (const d of mergedDates) {
        eqTrading += (pnlMap.get(d) || 0)
        const withFlows = eqTrading + (cashCumMap.get(d) || 0)
        out.push({
          date: d,
          equity_trading: Number(eqTrading.toFixed(2)),
          equity_with_flows: Number(withFlows.toFixed(2))
        })
      }
      return out
    }, [mergedDates, pnlMap, cashCumMap, capitalInitialDisp])

    const equitySeriesHL = useMemo(() => {
      let h = -Infinity, l = Infinity
      return equityMerged.map(p => {
        h = Math.max(h, p.equity_trading)
        l = Math.min(l, p.equity_trading)
        return { ...p, hwm: Number(h.toFixed(2)), lwm: Number(l.toFixed(2)) }
      })
    }, [equityMerged])

    const maxDDCalc = useMemo(() => {
      if (!equitySeriesHL.length) return { peakEquity: 0, troughEquity: 0, maxDDAbs: 0, maxDDPct: 0 }
      let peakSeen = equitySeriesHL[0].equity_trading
      let maxDrop = 0
      for (const p of equitySeriesHL) {
        if (p.equity_trading > peakSeen) peakSeen = p.equity_trading
        const drop = peakSeen - p.equity_trading
        if (drop > maxDrop) maxDrop = drop
      }
      const pe = Math.max(...equitySeriesHL.map(e => e.equity_trading))
      const tr = Math.min(...equitySeriesHL.map(e => e.equity_trading))
      const maxDDPct = pe > 0 ? (maxDrop / pe) * 100 : 0
      return { peakEquity: pe, troughEquity: tr, maxDDAbs: maxDrop, maxDDPct }
    }, [equitySeriesHL])

    function equityWithFlowsAt(date) {
      const p = equitySeriesHL.find(x => x.date === date)
      return p ? p.equity_with_flows : undefined
    }

    const dailyReturns = useMemo(() => {
      const out = []
      for (let i = 1; i < equitySeriesHL.length; i++) {
        const p = equitySeriesHL[i - 1].equity_trading, c = equitySeriesHL[i].equity_trading
        out.push({ date: equitySeriesHL[i].date, ret: p === 0 ? 0 : (c - p) / p })
      }
      return out
    }, [equitySeriesHL])
    /* [BLOCK G] END — Équité & drawdown (trading seul / avec flux) */

    /* [BLOCK F] START — KPI (principaux / ratios / opérationnels) */
    const totalPnlDisp = useMemo(() =>
      filtered.reduce((s, t) => s + convert(t.pnl, t.ccy || 'USD', displayCcy), 0),
      [filtered, displayCcy, rates]
    )
    const capitalGlobal = useMemo(() => (capitalBase + totalPnlDisp), [capitalBase, totalPnlDisp])

    const wins = filtered.filter(t => t.pnl > 0).length
    const wr = filtered.length ? (wins / filtered.length) * 100 : 0
    const avgWin = (() => {
      const list = filtered.filter(t => t.pnl > 0).map(t => convert(t.pnl, t.ccy || 'USD', displayCcy))
      return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
    })()
    const avgLoss = (() => {
      const list = filtered.filter(t => t.pnl < 0).map(t => Math.abs(convert(t.pnl, t.ccy || 'USD', displayCcy)))
      return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
    })()
    const rr = avgLoss > 0 ? (avgWin / avgLoss) : 0
    const expectancy = useMemo(() => filtered.length ? (totalPnlDisp / filtered.length) : 0, [totalPnlDisp, filtered.length])

    const sharpe = useMemo(() => {
      const rets = dailyReturns.map(r => r.ret)
      const mu = mean(rets), sd = stddev(rets)
      return sd > 0 ? (mu / sd) * Math.sqrt(252) : 0
    }, [dailyReturns])

    const sortino = useMemo(() => {
      const rets = dailyReturns.map(r => r.ret)
      const mu = mean(rets), neg = rets.filter(r => r < 0), sdDown = stddev(neg)
      return sdDown > 0 ? (mu / sdDown) * Math.sqrt(252) : 0
    }, [dailyReturns])

    const recoveryFactor = useMemo(() => {
      const profitNet = (equitySeriesHL.at(-1)?.equity_trading || capitalInitialDisp) - capitalInitialDisp
      return maxDDCalc.maxDDAbs > 0 ? profitNet / maxDDCalc.maxDDAbs : 0
    }, [equitySeriesHL, capitalInitialDisp, maxDDCalc])

    const avgTradeDurationMin = useMemo(() => {
      const mins = filtered.map(t => {
        const o = t.open_time ? new Date(t.open_time).getTime() : NaN
        const c = t.close_time ? new Date(t.close_time).getTime() : NaN
        if (!isFinite(o) || !isFinite(c)) return null
        return (c - o) / 60000
      }).filter(v => v != null)
      return mins.length ? mean(mins) : 0
    }, [filtered])

    const activeDays = useMemo(() => new Set(filtered.map(t => t.date)).size, [filtered])

    // Verdicts simples (classes CSS halo-*)
    function verdictForPnl(v) { return v > 0 ? 'halo-good' : v === 0 ? 'halo-warn' : 'halo-bad' }
    function verdictForDDpct(p) {
      if (p < 15) return 'halo-good'
      if (p <= 20) return 'halo-warn'
      return 'halo-bad'
    }
    /* [BLOCK F] END — KPI (principaux / ratios / opérationnels) */

    /* [BLOCK H] START — Courbes PnL (global base 0) & par stratégie */
    // PnL Global cumulatif base 0 (trading uniquement)
    const pnlGlobalSeries = useMemo(() => {
      const m = new Map()
      for (const t of filtered) {
        m.set(t.date, (m.get(t.date) || 0) + convert(t.pnl, t.ccy || 'USD', displayCcy))
      }
      const dates = Array.from(m.keys()).sort()
      let cum = 0
      return dates.map(d => { cum += m.get(d); return { date: d, pnl: Number(cum.toFixed(2)) } })
    }, [filtered, displayCcy, rates])

    // PnL cumulatif par stratégie (base 0 pour chaque, visualisés ensemble)
    const stratPnlSeries = useMemo(() => {
      const byStrat = new Map()
      for (const t of filtered) {
        const s = t.strategy || 'Unknown'
        const d = t.date
        const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
        if (!byStrat.has(s)) byStrat.set(s, new Map())
        const m = byStrat.get(s)
        m.set(d, (m.get(d) || 0) + v)
      }
      const allDates = Array.from(new Set(filtered.map(t => t.date))).sort()
      const out = {}
      for (const [s, m] of byStrat.entries()) {
        let cum = 0
        out[s] = allDates.map(d => {
          cum += (m.get(d) || 0)
          return { date: d, value: Number(cum.toFixed(2)) }
        })
      }
      return { dates: Array.from(allDates), series: out }
    }, [filtered, displayCcy, rates])
    /* [BLOCK H] END — Courbes PnL (global base 0) & par stratégie */

    /* [BLOCK I] START — Agrégations Gains/Pertes (Heures / Jours / Mois) */
    // Fenêtre par défaut 30 jours si pas de filtre
    const defaultWindowStart = useMemo(() => {
      if (dateFrom) return dateFrom
      const dates = filtered.map(t => t.date).sort()
      const last = dates.at(-1) || new Date().toISOString().slice(0, 10)
      const d = new Date(last); d.setDate(d.getDate() - 30)
      return d.toISOString().slice(0, 10)
    }, [filtered, dateFrom])

    const inWindow = useMemo(() => filtered.filter(t => {
      const after = defaultWindowStart
      if (after && t.date < after) return false
      if (dateTo && t.date > dateTo) return false
      return true
    }), [filtered, defaultWindowStart, dateTo])

    function splitGainLossAgg(list, keyFn, buckets) {
      const base = buckets.map((lab, idx) => ({ idx, label: lab, gain: 0, loss: 0 }))
      for (const t of list) {
        const idx = keyFn(t)
        if (idx == null || idx < 0 || idx >= base.length) continue
        const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
        if (v >= 0) base[idx].gain += v; else base[idx].loss += Math.abs(v)
      }
      // net verdict (utilisé pour halos si rendu en cartes)
      return base.map(b => ({ ...b, net: b.gain - b.loss }))
    }

    const hoursLabels = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)
    const aggHours = useMemo(() => {
      return splitGainLossAgg(inWindow, t => {
        const h = new Date(t.open_time || (t.date + 'T00:00:00Z')).getHours()
        return isFinite(h) ? h : null
      }, hoursLabels)
    }, [inWindow, displayCcy, rates])

    const weekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const aggWeek = useMemo(() => {
      return splitGainLossAgg(inWindow, t => {
        const d = new Date(t.open_time || (t.date + 'T00:00:00Z'))
        // Lundi=0 ... Dimanche=6
        const day = (d.getDay() + 6) % 7
        return day
      }, weekLabels)
    }, [inWindow, displayCcy, rates])

    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const aggMonths = useMemo(() => {
      return splitGainLossAgg(inWindow, t => {
        const d = new Date(t.open_time || (t.date + 'T00:00:00Z'))
        return d.getMonth()
      }, monthLabels)
    }, [inWindow, displayCcy, rates])
    /* [BLOCK I] END — Agrégations Gains/Pertes (Heures / Jours / Mois) */

    /* [BLOCK J] START — Calendrier enrichi */
    const lastDate = equitySeriesHL.at(-1)?.date || new Date().toISOString().slice(0, 10)
    const [calYear, setCalYear] = useState(Number(lastDate.slice(0, 4)))
    const [calMonth, setCalMonth] = useState(Number(lastDate.slice(5, 7)) - 1)

    function monthDays(year, monthIndex) {
      const end = new Date(year, monthIndex + 1, 0).getDate()
      const arr = []
      for (let d = 1; d <= end; d++) arr.push(new Date(year, monthIndex, d).toISOString().slice(0, 10))
      return arr
    }
    const calDates = useMemo(() => monthDays(calYear, calMonth), [calYear, calMonth])

    const dailyPnlMap = useMemo(() => {
      const m = new Map()
      for (const t of filtered) {
        m.set(t.date, (m.get(t.date) || 0) + convert(t.pnl, t.ccy || 'USD', displayCcy))
      }
      return m
    }, [filtered, displayCcy, rates])

    const dailyRetMap = useMemo(() => {
      const m = new Map()
      for (let i = 1; i < equitySeriesHL.length; i++) {
        const prev = equitySeriesHL[i - 1].equity_trading
        const cur = equitySeriesHL[i].equity_trading
        m.set(equitySeriesHL[i].date, prev > 0 ? (cur - prev) / prev : 0)
      }
      return m
    }, [equitySeriesHL])

    const monthDDMap = useMemo(() => {
      const ym = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
      const pts = equitySeriesHL.filter(p => p.date.startsWith(ym))
      let peak = -Infinity; const m = new Map()
      for (const p of pts) {
        peak = Math.max(peak, p.equity_trading)
        const dd = peak > 0 ? (p.equity_trading - peak) / peak : 0 // <=0
        m.set(p.date, dd)
      }
      return m
    }, [equitySeriesHL, calYear, calMonth])

    const tradesPerDayMap = useMemo(() => {
      const m = new Map()
      for (const t of filtered) m.set(t.date, (m.get(t.date) || 0) + 1)
      return m
    }, [filtered])

    const monthLabel = useMemo(() => {
      const dt = new Date(calYear, calMonth, 1)
      return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }, [calYear, calMonth])

    const ymNow = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
    const monthTradesPnl = useMemo(() =>
      filtered.filter(t => t.date.startsWith(ymNow))
        .reduce((s, t) => s + convert(t.pnl, t.ccy || 'USD', displayCcy), 0),
      [filtered, ymNow, displayCcy, rates]
    )
    const yearTradesPnl = useMemo(() => {
      const y = String(calYear)
      return filtered.filter(t => t.date.startsWith(y))
        .reduce((s, t) => s + convert(t.pnl, t.ccy || 'USD', displayCcy), 0)
    }, [filtered, calYear, displayCcy, rates])
    /* [BLOCK J] END — Calendrier enrichi */

      /* [BLOCK K] START — Matrice de corrélation des stratégies */
    function buildDailyStratSeries(rows) {
      const byDayByStrat = new Map()
      for (const t of rows) {
        const d = t.date
        const s = t.strategy || 'Unknown'
        const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
        if (!byDayByStrat.has(d)) byDayByStrat.set(d, new Map())
        const m = byDayByStrat.get(d)
        m.set(s, (m.get(s) || 0) + v)
      }
      const dates = Array.from(byDayByStrat.keys()).sort()
      const stratSet = new Set()
      for (const m of byDayByStrat.values()) for (const k of m.keys()) stratSet.add(k)
      const strats = Array.from(stratSet)
      const series = {}
      for (const s of strats) series[s] = []
      for (const d of dates) {
        const m = byDayByStrat.get(d)
        for (const s of strats) series[s].push(m.get(s) ?? 0)
      }
      return { strats, series }
    }
    const corrData = useMemo(() => buildDailyStratSeries(filtered), [filtered, displayCcy, rates])
    const avgStrategyCorr = useMemo(() => {
      const { strats, series } = corrData
      if (!strats || strats.length < 2) return 0
      const pairCorr = []
      for (let i = 0; i < strats.length; i++) {
        for (let j = i + 1; j < strats.length; j++) {
          pairCorr.push(pearson(series[strats[i]], series[strats[j]]))
        }
      }
      const vals = pairCorr.filter(x => isFinite(x))
      return vals.length ? mean(vals) : 0
    }, [corrData])
    /* [BLOCK K] END — Matrice de corrélation des stratégies */

    /* [BLOCK L] START — Export CSV (après filtres) */
    const exportCSV = () => {
      const header = ['date', 'asset', 'broker', 'strategy', `pnl_${displayCcy}`, `mfe_${displayCcy}`, `mae_${displayCcy}`]
      const rows = filtered.map(t => [
        t.date, t.asset, t.broker, t.strategy,
        convert(t.pnl, t.ccy || 'USD', displayCcy).toFixed(2),
        convert(t.mfe ?? 0, t.ccy || 'USD', displayCcy).toFixed(2),
        convert(t.mae ?? 0, t.ccy || 'USD', displayCcy).toFixed(2),
      ])
      const csv = [header, ...rows].map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `trades_filtres_${displayCcy}.csv`; a.click()
      URL.revokeObjectURL(url)
    }
    /* [BLOCK L] END — Export CSV (après filtres) */

    /* [BLOCK M] START — Modale “Ajouter flux” */
    const [showForm, setShowForm] = useState(false)
    const [flow, setFlow] = useState({
      date: new Date().toISOString().slice(0, 10),
      type: 'darwin_mgmt_fee',
      amount: '',
      ccy: displayCcy,
      note: ''
    })
    useEffect(() => { setFlow(f => ({ ...f, ccy: displayCcy })) }, [displayCcy])

    const flowTypes = [
      { value: 'darwin_mgmt_fee', label: 'Darwinex – Management Fee' },
      { value: 'prop_payout', label: 'Prop Firm – Payout' },
      { value: 'prop_fee', label: 'Prop Firm – Fee Challenge' },
      { value: 'deposit', label: 'Dépôt' },
      { value: 'withdrawal', label: 'Retrait' },
      { value: 'business_expense', label: 'Charge Business' },
      { value: 'other_income', label: 'Autre Revenu' }
    ]
    const submitFlow = (e) => {
      e.preventDefault()
      const amt = Number(flow.amount)
      if (!flow.date || !flow.type || isNaN(amt)) { alert('Merci de compléter Date / Type / Montant'); return }
      const row = { date: flow.date, type: flow.type, amount: amt, ccy: flow.ccy || displayCcy, note: flow.note || '' }
      setUserCashflows(prev => prev.concat([row]))
      setShowForm(false)
      setFlow({ date: new Date().toISOString().slice(0, 10), type: 'darwin_mgmt_fee', amount: '', ccy: displayCcy, note: '' })
    }
    /* [BLOCK M] END — Modale “Ajouter flux” */

    /* [BLOCK N] START — RENDER (assemblage UI) */
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 20, maxWidth: 1540, margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
          <div>
            <h1 className="title-brand">ZooProjectVision</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!editingSubtitle ? (
                <>
                  <p className="subtitle" style={{ margin: 0 }}>{subtitle}</p>
                  <button className="btn ghost sm" onClick={() => setEditingSubtitle(true)} title="Modifier le sous-titre">✏️</button>
                </>
              ) : (
                <>
                  <input className="sel" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                  <button className="btn sm" onClick={() => setEditingSubtitle(false)}>OK</button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Import CSV */}
            <label className="btn" style={{ position: 'relative' }}>
              importer csv
              <input type="file" accept=".csv" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const fr = new FileReader();
                  fr.onload = () => {
                    const rows = parseCSV(String(fr.result));
                    const mapped = mapMT5Rows(rows);
                    if (!mapped.length) { alert('CSV non reconnu. Vérifie Time/Symbol/Profit (+ MFE/MAE si dispo).'); return }
                    setUserTrades(prev => prev.concat(mapped));
                  };
                  fr.readAsText(f);
                }} />
            </label>

            {/* Ajouter flux */}
            <button className="btn" onClick={() => setShowForm(true)}>ajouter flux</button>

            {/* Capital Tiers (neutre) */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
              <span className="kpi-title">capital tiers</span>
              <input className="sel" type="number" step="0.01" style={{ width: 140 }}
                value={capitalTiers} onChange={e => setCapitalTiers(Number(e.target.value || 0))} />
            </div>

            {/* Réinitialiser */}
            <button className="btn ghost" onClick={resetFilters}>réinitialiser</button>

            {/* Devise */}
            <select className="sel" value={displayCcy} onChange={e => setDisplayCcy(e.target.value)}>
              {['USD', 'EUR', 'CHF'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Langue (guide) */}
            <select className="sel" value={lang} onChange={e => setLang(e.target.value)}>
              {['fr', 'en', 'es'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>

            {/* Export */}
            <button className="btn ghost" onClick={exportCSV}>export csv</button>
          </div>
        </div>

        {/* FILTRES */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          <div>
            <div className="kpi-title">actif</div>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="sel"><option>All</option>{assets.map(a => <option key={a} value={a}>{a}</option>)}</select>
          </div>
          <div>
            <div className="kpi-title">broker</div>
            <select value={broker} onChange={e => setBroker(e.target.value)} className="sel"><option>All</option>{brokers.map(b => <option key={b} value={b}>{b}</option>)}</select>
          </div>
          <div>
            <div className="kpi-title">stratégie</div>
            <select value={strategy} onChange={e => setStrategy(e.target.value)} className="sel"><option>All</option>{strategies.map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><div className="kpi-title">du</div><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="sel" /></div>
          <div><div className="kpi-title">au</div><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="sel" /></div>
          <div />
          <div />
        </div>

        {/* KPI PRINCIPAUX */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 12 }}>
          <div className="card halo-neutral">
            <div className="kpi-title">capital initial</div>
            <div className="val" style={{ color: C.white }}>{fmtC(capitalInitialDisp)}</div>
          </div>
          <div className={`card ${verdictForPnl(cashFlowTotal)}`}>
            <div className="kpi-title">cash flow</div>
            <div className="val" style={{ color: cashFlowTotal >= 0 ? C.green : C.pink }}>{fmtC(cashFlowTotal)}</div>
          </div>
          <div className={`card ${verdictForPnl(totalPnlDisp)}`}>
            <div className="kpi-title">pnl (filtré)</div>
            <div className="val" style={{ color: totalPnlDisp >= 0 ? C.green : C.pink }}>{fmtC(totalPnlDisp)}</div>
          </div>
          <div className="card halo-neutral">
            <div className="kpi-title">capital global</div>
            <div className="val">{fmtC(capitalGlobal)}</div>
          </div>
          <div className="card halo-neutral">
            <div className="kpi-title">total trades</div>
            <div className="val">{fmtNum(filtered.length)}</div>
          </div>
          <div className="card halo-neutral">
            <div className="kpi-title">capital tiers</div>
            <div className="val">{fmtC(convert(capitalTiers, 'USD', displayCcy))}</div>
          </div>
        </div>

        {/* RATIOS & QUALITÉ (neutres) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 12 }}>
          <div className="card"><div className="kpi-title">win rate</div><div className="val">{fmtPct(wr)}</div></div>
          <div className="card"><div className="kpi-title">risk / reward</div><div className="val">{rr.toFixed(2)}</div></div>
          <div className="card"><div className="kpi-title">expectancy / trade</div><div className="val">{fmtC(expectancy)}</div></div>
          <div className="card"><div className="kpi-title">sharpe (ann.)</div><div className="val">{sharpe.toFixed(2)}</div></div>
          <div className="card"><div className="kpi-title">sortino (ann.)</div><div className="val">{sortino.toFixed(2)}</div></div>
          <div className="card"><div className="kpi-title">recovery factor</div><div className="val">{recoveryFactor.toFixed(2)}</div></div>
        </div>

        {/* OPÉRATIONNELS + DD */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
          <div className="card"><div className="kpi-title">jours actifs</div><div className="val">{activeDays}</div></div>
          <div className="card"><div className="kpi-title">durée moyenne</div><div className="val">{Math.round(avgTradeDurationMin)} min</div></div>
          <div className="card"><div className="kpi-title">equity peak / trough</div><div className="val">{fmtC(maxDDCalc.peakEquity)} / {fmtC(maxDDCalc.troughEquity)}</div></div>
          <div className={`card ${verdictForDDpct(maxDDCalc.maxDDPct)}`}>
            <div className="kpi-title">max dd</div>
            <div className="val">{fmtPct(maxDDCalc.maxDDPct)} · {fmtC(maxDDCalc.maxDDAbs)}</div>
          </div>
        </div>

        {/* WIN RATE — DONUT + GAGNANTS/PERDANTS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {/* Donut */}
          <div className="card" style={{ position: 'relative', height: 260 }}>
            <div className="kpi-title">win rate</div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 24 }}>{fmtPct(wr)}</div>
            </div>
            <ResponsiveContainer width="100%" height="88%">
              <PieChart>
                <Pie data={[
                  { name: 'Gagnants', value: Math.max(0.0001, wr) },
                  { name: 'Perdants', value: Math.max(0.0001, 100 - wr) }
                ]}
                  dataKey="value" nameKey="name"
                  innerRadius={70} outerRadius={100} stroke="none">
                  <Cell fill={C.green} />
                  <Cell fill={C.pink} />
                </Pie>
                <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }} />
                <Legend wrapperStyle={{ color: C.text }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gagnants / Perdants — barres */}
          <div className="card" style={{ height: 260 }}>
            <div className="kpi-title">gagnants / perdants (comptage)</div>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={[
                { type: 'Gagnants', n: filtered.filter(t => t.pnl > 0).length },
                { type: 'Perdants', n: filtered.filter(t => t.pnl < 0).length }
              ]} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="type" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }}
                  formatter={(v, n, ctx) => [fmtNum(v), ctx?.payload?.type || n]} />
                <Legend wrapperStyle={{ color: C.text }} />
                <Bar dataKey="n" name="nombre" fill="url(#colGloss)">
                  {/* gradient */}
                </Bar>
                <defs>
                  <linearGradient id="colGloss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.green} /><stop offset="100%" stopColor={C.green2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COURBES — Équité / PnL Global / Stratégie(s) */}
        <div className="card" style={{ height: 460, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div className="kpi-title">courbes</div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={equitySeriesHL} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} tick={{ fontSize: 10 }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }}
                labelStyle={{ color: C.text }} itemStyle={{ color: C.text }}
                formatter={(v, n) => [fmtC(v), n]} />
              <Legend wrapperStyle={{ color: C.text }} />

              {/* trading seul */}
              <Line type="monotone" dataKey="equity_trading" name="Équité (trading seul)" dot={false} stroke={C.white} strokeWidth={1.8} isAnimationActive={false} />
              {/* avec flux */}
              <Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#8a8f94" strokeWidth={1.2} strokeDasharray="5 4" />

              {/* HWM/LWM (trading seul) */}
              <Line type="monotone" dataKey="hwm" name="Plus Haut (HWM)" dot={false} stroke={C.turq} strokeWidth={1.4} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="lwm" name="Plus Bas (LWM)" dot={false} stroke={C.pink} strokeWidth={1.2} strokeDasharray="4 3" />

              {/* Points cashflow (aucune ligne verticale) */}
              {cashflowsInRange
                .filter(c => ['deposit', 'withdrawal', 'prop_fee', 'prop_payout', 'darwin_mgmt_fee'].includes(c.type))
                .map((c, i) => {
                  const y = equityWithFlowsAt(c.date)
                  const color = c.amount >= 0 ? C.green : C.pink
                  return y != null ? <ReferenceDot key={'cf' + i} x={c.date} y={y} r={4} fill={color} stroke="none" /> : null
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MFE / MAE — Quotidien (moyenne) */}
        <div className="card" style={{ height: 360, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="kpi-title">mfe / mae — quotidien (moyenne)</div>
            <span className="help" title="MFE: meilleur gain latent. MAE: pire perte latente. Moyennés par jour après filtres.">?</span>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={buildMfeMaeDaily(filtered, convert, displayCcy)} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }}
                formatter={(v, n) => [fmtC(v), n === 'avgMFE' ? 'MFE Moyen' : 'MAE Moyen']} />
              <Legend wrapperStyle={{ color: C.text }} />
              <Line type="monotone" dataKey="avgMFE" name="MFE Moyen" dot={false} stroke={C.green} strokeWidth={2} />
              <Line type="monotone" dataKey="avgMAE" name="MAE Moyen" dot={false} stroke={C.pink} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* GAINS / PERTES — Heures / Jours / Mois */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          <div className="card">
            <div className="kpi-title">gains / pertes par heure</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={aggHours} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="label" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }}
                  formatter={(v, n) => [fmtC(v), n === 'gain' ? 'Gains' : 'Pertes']} />
                <Legend wrapperStyle={{ color: C.text }} />
                <Bar dataKey="gain" name="Gains">
                  <Cell fill={C.green} />
                </Bar>
                <Bar dataKey="loss" name="Pertes">
                  <Cell fill={C.pink} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="kpi-title">gains / pertes par jour</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={aggWeek} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="label" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }}
                  formatter={(v, n) => [fmtC(v), n === 'gain' ? 'Gains' : 'Pertes']} />
                <Legend wrapperStyle={{ color: C.text }} />
                <Bar dataKey="gain" name="Gains">
                  <Cell fill={C.green} />
                </Bar>
                <Bar dataKey="loss" name="Pertes">
                  <Cell fill={C.pink} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="kpi-title">gains / pertes par mois</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={aggMonths} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="label" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
                <Tooltip contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }}
                  formatter={(v, n) => [fmtC(v), n === 'gain' ? 'Gains' : 'Pertes']} />
                <Legend wrapperStyle={{ color: C.text }} />
                <Bar dataKey="gain" name="Gains">
                  <Cell fill={C.green} />
                </Bar>
                <Bar dataKey="loss" name="Pertes">
                  <Cell fill={C.pink} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CALENDRIER */}
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="kpi-title">calendrier / {monthLabel}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost sm" onClick={() => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y-- } setCalMonth(m); setCalYear(y) }}>◀</button>
              <button className="btn ghost sm" onClick={() => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++ } setCalMonth(m); setCalYear(y) }}>▶</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, color: C.muted, fontSize: 12, margin: '4px 0 10px' }}>
            <span>mensuel (trading) : <span style={{ color: monthTradesPnl >= 0 ? C.green : C.pink }}>{fmtC(monthTradesPnl)}</span></span>
            <span>annuel (trading) : <span style={{ color: yearTradesPnl >= 0 ? C.green : C.pink }}>{fmtC(yearTradesPnl)}</span></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} style={{ textAlign: 'center', color: C.muted, fontSize: 12 }}>{d}</div>)}
            {calDates.map(dt => {
              const pnl = dailyPnlMap.get(dt) || 0
              const ret = dailyRetMap.get(dt)
              const dd = monthDDMap.get(dt) // <=0
              const n = tradesPerDayMap.get(dt) || 0
              const bg = ret == null ? '#0f0f10' : (ret >= 0 ? 'rgba(32,227,214,0.15)' : 'rgba(255,95,162,0.15)')
              // verdict bordure sur DD%
              let haloClass = 'halo-neutral'
              if (dd != null) {
                const ddPct = Math.abs(dd * 100)
                if (ddPct < 1) haloClass = 'halo-good'
                else if (ddPct <= 2) haloClass = 'halo-warn'
                else haloClass = 'halo-bad'
              }
              return (
                <div key={dt} className={`cal-cell ${haloClass}`} style={{ padding: '10px 8px', background: bg }}>
                  <div style={{ fontSize: 11, opacity: .9 }}>{Number(dt.slice(8, 10))}</div>
                  <div style={{ fontSize: 12, color: pnl >= 0 ? C.green : C.pink }}>{fmtC(pnl)}</div>
                  <div style={{ fontSize: 11, color: '#bfc5c9' }}>{ret != null ? fmtPct(ret * 100) : '—'}</div>
                  <div style={{ fontSize: 11, color: '#bfc5c9' }}>{dd != null ? `DD ${fmtPct(Math.abs(dd * 100))}` : 'DD —'}</div>
                  <div style={{ fontSize: 11, color: '#bfc5c9' }}>{n} trade(s)</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AIDE / GUIDE (auto) */}
        <details className="card" style={{ marginTop: 16 }}>
          <summary className="kpi-title" style={{ cursor: 'pointer' }}>aide & guide</summary>
          <Guide lang={lang} />
        </details>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 20 }}>
          ZooProjectVision © {new Date().getFullYear()}
        </div>

        {/* MODALE — Ajouter flux */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="kpi-title">ajouter un flux</div>
                <button className="btn ghost sm" onClick={() => setShowForm(false)}>fermer</button>
              </div>
              <form onSubmit={submitFlow} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2,1fr)' }}>
                <label className="form-label"><span>type</span>
                  <select value={flow.type} onChange={e => setFlow(f => ({ ...f, type: e.target.value }))} className="sel">
                    {flowTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="form-label"><span>date</span>
                  <input type="date" value={flow.date} onChange={e => setFlow(f => ({ ...f, date: e.target.value }))} className="sel" />
                </label>
                <label className="form-label"><span>devise</span>
                  <select value={flow.ccy} onChange={e => setFlow(f => ({ ...f, ccy: e.target.value }))} className="sel">
                    {['USD', 'EUR', 'CHF'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-label"><span>montant</span>
                  <input type="number" step="0.01" placeholder="ex: 250.00" value={flow.amount}
                    onChange={e => setFlow(f => ({ ...f, amount: e.target.value }))} className="sel" />
                </label>
                <label className="form-label" style={{ gridColumn: '1 / -1' }}><span>note</span>
                  <input type="text" placeholder="optionnel" value={flow.note}
                    onChange={e => setFlow(f => ({ ...f, note: e.target.value }))} className="sel" />
                </label>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>annuler</button>
                  <button type="submit" className="btn">enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
    /* [BLOCK N] END — RENDER (assemblage UI) */

  } catch (e) {
    console.error(e)
    return <div style={{ color: C.pink, padding: 16 }}>Erreur dans App.jsx : {String(e.message || e)}</div>
  }
}

/* [BLOCK O] START — Helpers (parse CSV, stats, MFE/MAE daily, Guide) */
function mean(a) { if (!a.length) return 0; return a.reduce((x, y) => x + y, 0) / a.length }
function stddev(a) { if (!a.length) return 0; const m = mean(a); const v = mean(a.map(x => (x - m) * (x - m))); return Math.sqrt(v) }
function pearson(a, b) {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const ax = a.slice(0, n), bx = b.slice(0, n)
  const ma = mean(ax), mb = mean(bx)
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) {
    const x = ax[i] - ma, y = bx[i] - mb
    num += x * y; da += x * x; db += y * y
  }
  const den = Math.sqrt(da * db)
  return den > 0 ? num / den : 0
}

function parseCSV(text) {
  const lines = String(text || '').trim().split(/\r?\n/); if (!lines.length) return []
  const headers = lines.shift().split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = []
  for (const line of lines) {
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
    const obj = {}
    headers.forEach((h, i) => obj[h] = (cols[i] || '').replace(/^"|"$/g, ''))
    rows.push(obj)
  }
  return rows
}
function mapMT5Rows(rows) {
  return rows.map((r) => {
    const date = (r['Time'] || r['Open time'] || r['Open Time'] || r['Date'] || '').slice(0, 10)
    const asset = r['Symbol'] || r['Instrument'] || r['Symbol name'] || 'UNKNOWN'
    const broker = r['Broker'] || 'Unknown'
    const strategy = r['Strategy'] || 'Unknown'
    const pnl = Number(r['Profit'] || r['PnL'] || r['PL'] || r['Net P/L'] || 0)
    const openTime = r['Time'] || r['Open time'] || r['Open Time'] || ''
    const closeTime = r['Close time'] || r['Close Time'] || ''
    const mfeRaw = Number(r['MFE'] || r['MFE Profit'] || r['Max Favorable Excursion'] || 0)
    const maeRaw = Number(r['MAE'] || r['MAE Profit'] || r['Max Adverse Excursion'] || 0)
    return {
      date, asset, broker, strategy,
      pnl: Number((pnl || 0).toFixed(2)), ccy: 'USD',
      open_time: openTime, close_time: closeTime,
      mfe: Number((Math.abs(mfeRaw) || 0).toFixed(2)),
      mae: Number((Math.abs(maeRaw) || 0).toFixed(2)),
    }
  }).filter(r => r.date)
}

function buildMfeMaeDaily(filtered, convert, displayCcy) {
  const map = new Map()
  for (const t of filtered) {
    const d = t.date
    const mfe = convert(t.mfe ?? 0, t.ccy || 'USD', displayCcy)
    const mae = convert(t.mae ?? 0, t.ccy || 'USD', displayCcy)
    if (!map.has(d)) map.set(d, { date: d, sMFE: 0, sMAE: 0, n: 0 })
    const x = map.get(d); x.sMFE += Math.max(0, mfe); x.sMAE += Math.max(0, mae); x.n++
  }
  const arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  let cumM = 0, cumA = 0
  return arr.map(r => {
    const avgMFE = r.n ? r.sMFE / r.n : 0
    const avgMAE = r.n ? r.sMAE / r.n : 0
    cumM += r.sMFE; cumA += r.sMAE
    return {
      date: r.date,
      avgMFE: Number(avgMFE.toFixed(2)),
      avgMAE: Number(avgMAE.toFixed(2)),
      cumMFE: Number(cumM.toFixed(2)),
      cumMAE: Number(cumA.toFixed(2))
    }
  })
}

// Guide auto (charge /public/guide.[lang].json si dispo)
function Guide({ lang }) {
  const [doc, setDoc] = useState(null)
  useEffect(() => {
    const url = `/guide.${lang}.json`
    fetch(url).then(r => r.ok ? r.json() : null).then(setDoc).catch(() => setDoc(null))
  }, [lang])
  if (!doc) return <div style={{ color: C.muted, fontSize: 12 }}>guide non disponible ({lang})</div>
  return (
    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, display: 'grid', gap: 8 }}>
      {Object.entries(doc).map(([k, v]) => (
        <div key={k}>
          <div style={{ color: C.text, marginBottom: 4 }}>{k}</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{String(v)}</div>
        </div>
      ))}
    </div>
  )
}
/* [BLOCK O] END — Helpers (parse CSV, stats, MFE/MAE daily, Guide) */
