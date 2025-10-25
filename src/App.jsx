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

    {/* ================== [BLOCK E] START — KPI principaux + ratios ================== */}
{(() => {
  // ---------- Utils locaux (compat avec ton code existant) ----------
  const fmtLocal = (v) => {
    try {
      if (typeof fmt === 'function') return fmt(v, displayCcy)
      if (typeof fmtC === 'function') return fmtC(v)
      return new Intl.NumberFormat(undefined, { style:'currency', currency: displayCcy || 'USD' }).format(v ?? 0)
    } catch {
      return `${(v ?? 0).toFixed(2)} ${displayCcy || 'USD'}`
    }
  }
  const valColor = (v) => (v >= 0 ? 'var(--green)' : 'var(--pink)')

  // ---------- Données Win Rate / RR ----------
  const total = filtered.length
  const wins = filtered.filter(t => t.pnl > 0).length
  const losses = total - wins
  const winRate = total ? (wins / total) * 100 : 0

  const posVals = filtered
    .filter(t => t.pnl > 0)
    .map(t => convert(t.pnl, t.ccy || 'USD', displayCcy))
  const negVals = filtered
    .filter(t => t.pnl < 0)
    .map(t => Math.abs(convert(t.pnl, t.ccy || 'USD', displayCcy)))

  const avgWin = posVals.length ? posVals.reduce((a,b)=>a+b,0) / posVals.length : 0
  const avgLoss = negVals.length ? negVals.reduce((a,b)=>a+b,0) / negVals.length : 0
  const rr = avgLoss > 0 ? (avgWin / avgLoss) : 0

  // Donut data (réduit pour éviter le clipping)
  const donutData = [
    { name: 'Gagnants', value: wins, color: 'var(--green)' },
    { name: 'Perdants', value: losses, color: 'var(--pink)' }
  ]

  return (
    <>
      {/* KPI principaux */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 12 }}>
        {/* Capital Initial — blanc (spécial) */}
        <div className="card">
          <div className="kpi-title">capital initial</div>
          <div className="val" style={{ color: 'var(--white)' }}>{fmtLocal(capitalInitialDisp)}</div>
        </div>

        {/* Cash Flow — vert/rose selon signe */}
        <div className="card">
          <div className="kpi-title">cash flow</div>
          <div className="val" style={{ color: valColor(cashFlowTotal) }}>{fmtLocal(cashFlowTotal)}</div>
        </div>

        {/* PnL (Filtré) — vert/rose */}
        <div className="card">
          <div className="kpi-title">pnl (filtré)</div>
          <div className="val" style={{ color: valColor(totalPnlDisp) }}>{fmtLocal(totalPnlDisp)}</div>
        </div>

        {/* Capital Global — vert/rose vs 0 (on affiche la valeur globale) */}
        <div className="card">
          <div className="kpi-title">capital global</div>
          <div className="val" style={{ color: valColor(capitalGlobal - capitalInitialDisp) }}>
            {fmtLocal(capitalGlobal)}
          </div>
        </div>

        {/* Max DD% — neutre (texte) */}
        <div className="card">
          <div className="kpi-title">max drawdown (%)</div>
          <div className="val" style={{ color: 'var(--text)' }}>
            {Number.isFinite(maxDDPct) ? `${maxDDPct.toFixed(2)}%` : '—'}
          </div>
        </div>

        {/* Max DD (abs) — neutre (texte) */}
        <div className="card">
          <div className="kpi-title">max drawdown (abs)</div>
          <div className="val" style={{ color: 'var(--text)' }}>
            {Number.isFinite(maxDDAbs) ? fmtLocal(maxDDAbs) : '—'}
          </div>
        </div>
      </div>

      {/* KPI Win Rate / RR — avec donut centré */}
      <div className="card" style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:12, alignItems:'center', marginTop:12 }}>
        <div>
          <div className="kpi-title">win rate / rr</div>
          <div style={{ position:'relative', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}   // ⇐ plus petit
                  outerRadius={75}   // ⇐ plus petit
                  paddingAngle={1}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {donutData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text)' }}
                  itemStyle={{ color: 'var(--text)' }}
                  formatter={(v, n) => [v, n]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Label centré — % win rate */}
            <div style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              pointerEvents:'none'
            }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:18, fontWeight:600, color:'var(--text)' }}>
                  {winRate.toFixed(1)}%
                </div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>
                  win&nbsp;rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone valeurs (neutres) */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
          <div className="card halo-neutral" style={{ padding:10 }}>
            <div className="kpi-title">trades</div>
            <div className="val" style={{ color:'var(--text)' }}>{total}</div>
          </div>
          <div className="card halo-neutral" style={{ padding:10 }}>
            <div className="kpi-title">win rate</div>
            <div className="val" style={{ color:'var(--text)' }}>{winRate.toFixed(1)}%</div>
          </div>
          <div className="card halo-neutral" style={{ padding:10 }}>
            <div className="kpi-title">risk / reward</div>
            <div className="val" style={{ color:'var(--text)' }}>{rr.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </>
  )
})()}
{/* ================== [BLOCK E] END — KPI principaux + ratios ================== */}

    /* ================== [BLOCK F] START — Courbes & Agrégations ================== */

{/** -------------------------------------------------------
    Utils locaux communs (format monétaire + date courte)
    ------------------------------------------------------- */}
{(() => {
  const fmtMoney = (v) => {
    try{
      if (typeof fmt === 'function') return fmt(v, displayCcy)
      if (typeof fmtC === 'function') return fmtC(v)
      return new Intl.NumberFormat(undefined, { style:'currency', currency: displayCcy || 'USD' }).format(v ?? 0)
    }catch{
      return `${(v ?? 0).toFixed(2)} ${displayCcy || 'USD'}`
    }
  }
  const shortDate = (iso) => {
    // "YYYY-MM-DD" -> "DD/MM"
    if (!iso) return ''
    const y = iso.slice(0,4), m = iso.slice(5,7), d = iso.slice(8,10)
    return `${d}/${m}`
  }

  /* =============== F2 — Courbe d’Équité =============== */
  // Prépare séries alternatives:
  //  a) PnL Global (depuis 0) = cumul des PnL quotidiens après filtres
  //  b) Stratégies = cumul par stratégie (lignes fines)
  const dailyPnl = (() => {
    const map = new Map()
    for (const t of filtered){
      const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
      map.set(t.date, (map.get(t.date) || 0) + v)
    }
    return Array.from(map, ([date, pnl]) => ({ date, pnl }))
      .sort((a,b)=> a.date.localeCompare(b.date))
  })()
  const globalCumul = (() => {
    let c = 0
    return dailyPnl.map(r => ({ date: r.date, pnl_cumul: (c += r.pnл || r.pnl, c) }))
  })()

  const strategies = Array.from(new Set(filtered.map(t => t.strategy))).sort()
  const stratCumulSeries = (() => {
    // cumul par stratégie
    const byDateByStrat = new Map()
    for (const t of filtered){
      const d = t.date
      const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
      if (!byDateByStrat.has(d)) byDateByStrat.set(d, new Map())
      const m = byDateByStrat.get(d)
      m.set(t.strategy, (m.get(t.strategy) || 0) + v)
    }
    const dates = Array.from(byDateByStrat.keys()).sort()
    // initialiser cumul à 0 pour chaque strat
    const cumul = {}; strategies.forEach(s => cumul[s] = 0)
    return dates.map(dt => {
      const row = { date: dt }
      const m = byDateByStrat.get(dt)
      strategies.forEach(s => {
        cumul[s] += (m.get(s) || 0)
        row[s] = cumul[s]
      })
      return row
    })
  })()

  // Tooltip custom pour la courbe d’équité
  function EqTooltip({ active, payload, label }){
    if (!active || !payload || !payload.length) return null
    return (
      <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 10px', color:'var(--text)' }}>
        <div style={{ marginBottom:6 }}>{shortDate(label)}</div>
        {payload.map((p,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
            <span style={{ color:'var(--text)' }}>{p.name}</span>
            <b style={{ color:'var(--text)' }}>{fmtMoney(p.value)}</b>
          </div>
        ))}
      </div>
    )
  }

  // Points de flux (scatter-like via ReferenceDot simple, sans ligne verticale)
  const flowPoints = (showFlows && Array.isArray(cashflowsInRange))
    ? cashflowsInRange
        .filter(c => ['deposit','withdrawal','prop_fee','prop_payout','darwin_mgmt_fee'].includes(c.type))
        .map(c => {
          const y = equityWithFlowsAt(equitySeriesHL, c.date)
          return {
            date: c.date,
            y,
            color: (c.amount >= 0 ? 'var(--green)' : 'var(--pink)'),
            label: (c.type==='deposit' ? 'Dépôt'
                   : c.type==='withdrawal' ? 'Retrait'
                   : c.type==='prop_fee' ? 'Prop fee'
                   : c.type==='prop_payout' ? 'Prop payout'
                   : 'Darwinex fee'),
            amount: c.amount
          }
        })
        .filter(p => p.y != null)
    : []

  // Toggle vue (global vs stratégies) — simple bouton radio
  // (si tu as déjà un état similaire ailleurs, tu peux réutiliser)
  const [curveView, setCurveView] = React.useState('global') // 'global' | 'strat'

  return (
    <>
      {/* Titre + options */}
      <div className="card" style={{ height: 460, marginTop: 16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div className="kpi-title">courbe d’équité</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button className={`btn sm ${curveView==='global'?'':'ghost'}`} onClick={()=>setCurveView('global')}>pnl global</button>
            <button className={`btn sm ${curveView==='strat'?'':'ghost'}`} onClick={()=>setCurveView('strat')}>stratégie(s)</button>
            <label className="btn sm ghost" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!showFlows} readOnly />
              avec flux
            </label>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="85%">
          <LineChart
            data={curveView==='global' ? globalCumul : stratCumulSeries}
            margin={{ left:8, right:8, top:8, bottom:8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              stroke="var(--axis)"
              tickLine={false}
              axisLine={{ stroke:'var(--axis)' }}
            />
            <YAxis
              stroke="var(--axis)"
              tickLine={false}
              axisLine={{ stroke:'var(--axis)' }}
            />
            <Tooltip content={<EqTooltip />} />
            <Legend wrapperStyle={{ color:'var(--text)' }} />

            {/* Lignes */}
            {curveView==='global' ? (
              <Line type="monotone" dataKey="pnl_cumul" name="PnL Global (depuis 0)" dot={false} stroke="var(--white)" strokeWidth={1.6} isAnimationActive={false} />
            ) : (
              strategies.map((s,i)=>(
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  name={s}
                  dot={false}
                  stroke={i%2===0 ? 'var(--green)' : 'var(--pink)'}
                  strokeWidth={1.2}
                  isAnimationActive={false}
                />
              ))
            )}

            {/* Points de flux (uniquement en lecture/indication) */}
            {flowPoints.map((p, i) => (
              <ReferenceDot key={i} x={p.date} y={p.y} r={4} fill={p.color} stroke="none" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* =============== F1 — Gains/Pertes par Heure/Jour/Mois =============== */}
      {(() => {
        // Fenêtre d’agrégation: filtres date ou défaut 30 jours
        const today = new Date()
        const defaultFrom = new Date(today.getTime() - 29*24*3600*1000).toISOString().slice(0,10)
        const fromDate = (dateFrom && dateFrom.length) ? dateFrom : defaultFrom
        const toDate   = (dateTo && dateTo.length)     ? dateTo   : today.toISOString().slice(0,10)

        const inRange = filtered.filter(t => (!fromDate || t.date >= fromDate) && (!toDate || t.date <= toDate))

        // HEURE
        const byHourBase = Array.from({length:24}, (_,h)=>({ hour: `${String(h).padStart(2,'0')}:00`, gain:0, loss:0 }))
        for(const t of inRange){
          const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
          const h = d.getHours()
          const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
          const row = byHourBase[h]
          if (v >= 0) row.gain += v; else row.loss += Math.abs(v)
        }

        // JOUR (Lun..Dim)
        const dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
        const byDOWBase = dayNames.map((name,idx)=>({ idx, day:name, gain:0, loss:0 }))
        for(const t of inRange){
          const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
          const js = d.getDay() // 0 Dim .. 6 Sam -> remap Lun=0..Dim=6
          const dow = (js===0)?6:(js-1)
          const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
          const row = byDOWBase[dow]
          if (v >= 0) row.gain += v; else row.loss += Math.abs(v)
        }

        // MOIS (Jan..Déc)
        const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jui','Jui','Aoû','Sep','Oct','Nov','Déc']
        const byMonthBase = monthNames.map((name,idx)=>({ idx, month:name, gain:0, loss:0 }))
        for(const t of inRange){
          const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
          const m = d.getMonth()
          const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
          const row = byMonthBase[m]
          if (v >= 0) row.gain += v; else row.loss += Math.abs(v)
        }

        function GLTooltip({ active, payload, label }){
          if (!active || !payload || !payload.length) return null
          // Agréger par catégorie (Gagnants/Perdants)
          const agg = new Map()
          payload.forEach(p => {
            const cat = p.dataKey === 'loss' ? 'Perdants' : 'Gagnants'
            const val = Number.isFinite(p.value) ? p.value : 0
            agg.set(cat, (agg.get(cat) || 0) + val)
          })
          return (
            <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 10px', color:'var(--text)' }}>
              {label != null && <div style={{ marginBottom:6, opacity:.9 }}>{label}</div>}
              {[...agg.entries()].map(([cat, val], i) => {
                const isLoss = cat.toLowerCase().startsWith('perd')
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                    <span style={{ color:'var(--text)' }}>{cat}</span>
                    <b style={{ color: isLoss ? 'var(--pink)' : 'var(--green)' }}>{fmtMoney(val)}</b>
                  </div>
                )
              })}
            </div>
          )
        }

        return (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16 }}>
            {/* HEURE */}
            <div className="card">
              <div className="kpi-title">gains / pertes — par heure (ouverture)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byHourBase} margin={{ left:8, right:8, top:8, bottom:8 }}>
                  <CartesianGrid stroke="#2b2b2b" />
                  <XAxis dataKey="hour" stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
                  <YAxis stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
                  <Tooltip content={<GLTooltip />} />
                  <Legend wrapperStyle={{ color:'var(--text)' }} />
                  <Bar dataKey="gain" name="Gains" fill="var(--green)" />
                  <Bar dataKey="loss" name="Pertes" fill="var(--pink)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* JOUR */}
            <div className="card">
              <div className="kpi-title">gains / pertes — par jour de semaine</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byDOWBase} margin={{ left:8, right:8, top:8, bottom:8 }}>
                  <CartesianGrid stroke="#2b2b2b" />
                  <XAxis dataKey="day" stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
                  <YAxis stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
                  <Tooltip content={<GLTooltip />} />
                  <Legend wrapperStyle={{ color:'var(--text)' }} />
                  <Bar dataKey="gain" name="Gains" fill="var(--green)" />
                  <Bar dataKey="loss" name="Pertes" fill="var(--pink)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* MOIS */}
            <div className="card">
              <div className="kpi-title">gains / pertes — par mois</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byMonthBase} margin={{ left:8, right:8, top:8, bottom:8 }}>
                  <CartesianGrid stroke="#2b2b2b" />
                  <XAxis dataKey="month" stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
                  <YAxis stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
                  <Tooltip content={<GLTooltip />} />
                  <Legend wrapperStyle={{ color:'var(--text)' }} />
                  <Bar dataKey="gain" name="Gains" fill="var(--green)" />
                  <Bar dataKey="loss" name="Pertes" fill="var(--pink)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })()}

      {/* =============== F3 — MFE/MAE Quotidien (Moyenne) =============== */}
      <div className="card" style={{ height: 360, marginTop: 16 }}>
        <div className="kpi-title">mfe / mae — quotidien (moyenne)</div>
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={mfeMaeDaily} margin={{ left:8, right:8, top:8, bottom:8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis dataKey="date" tickFormatter={shortDate} stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
            <YAxis stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
            <Tooltip
              contentStyle={{ background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:10 }}
              formatter={(v, n, ctx) => {
                const isMFE = (n==='avgMFE' || ctx?.dataKey==='avgMFE')
                return [fmtMoney(v), isMFE ? 'MFE Moyen' : 'MAE Moyen']
              }}
            />
            <Legend wrapperStyle={{ color:'var(--text)' }} />
            <Line type="monotone" dataKey="avgMFE" name="MFE Moyen" dot={false} stroke="var(--green)" strokeWidth={2} />
            <Line type="monotone" dataKey="avgMAE" name="MAE Moyen" dot={false} stroke="var(--pink)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* =============== F3 — MFE/MAE Cumulé =============== */}
      <div className="card" style={{ height: 360, marginTop: 16 }}>
        <div className="kpi-title">cumul mfe / mae</div>
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={mfeMaeDaily} margin={{ left:8, right:8, top:8, bottom:8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis dataKey="date" tickFormatter={shortDate} stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
            <YAxis stroke="var(--axis)" tickLine={false} axisLine={{stroke:'var(--axis)'}} />
            <Tooltip
              contentStyle={{ background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:10 }}
              formatter={(v, n, ctx) => {
                const isMFE = (n==='cumMFE' || ctx?.dataKey==='cumMFE')
                return [fmtMoney(v), isMFE ? 'Cumul MFE' : 'Cumul MAE']
              }}
            />
            <Legend wrapperStyle={{ color:'var(--text)' }} />
            <Line type="monotone" dataKey="cumMFE" name="Cumul MFE" dot={false} stroke="var(--green)" strokeWidth={2.2} />
            <Line type="monotone" dataKey="cumMAE" name="Cumul MAE" dot={false} stroke="var(--pink)" strokeWidth={2.2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
})()}

/* ================== [BLOCK F] END — Courbes & Agrégations ================== */


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

    
    {/* ================== [BLOCK H] START — Calendrier (bordures verdict + infos jour) ================== */}
{(() => {
  // ---------- Utils ----------
  const fmtMoney = (v) => {
    try{
      if (typeof fmt === 'function') return fmt(v, displayCcy)
      if (typeof fmtC === 'function') return fmtC(v)
      return new Intl.NumberFormat(undefined, { style:'currency', currency: displayCcy || 'USD' }).format(v ?? 0)
    }catch{
      return `${(v ?? 0).toFixed(2)} ${displayCcy || 'USD'}`
    }
  }

  // Dernière date connue (pour initialiser le mois courant si besoin)
  const lastDate = equitySeriesHL?.length ? equitySeriesHL[equitySeriesHL.length-1].date : new Date().toISOString().slice(0,10)
  const [calYear2, setCalYear2]   = React.useState(Number(lastDate.slice(0,4)))
  const [calMonth2, setCalMonth2] = React.useState(Number(lastDate.slice(5,7)) - 1) // 0..11

  // Fabrique toutes les dates (YYYY-MM-DD) du mois affiché
  const monthDays = (y, mIdx) => {
    const end = new Date(y, mIdx+1, 0).getDate()
    const out = []
    for (let d=1; d<=end; d++) out.push(new Date(y, mIdx, d).toISOString().slice(0,10))
    return out
  }
  const datesInMonth = monthDays(calYear2, calMonth2)

  // Libellé "Octobre 2025" (selon locale)
  const monthLabel = new Date(calYear2, calMonth2, 1).toLocaleDateString(undefined, { month:'long', year:'numeric' })

  // Map equity par date pour accès rapide
  const eqMap = new Map()
  equitySeriesHL.forEach(p => eqMap.set(p.date, p.equity_trading))

  // PnL du jour (diff jour/jour)
  const pnlDayMap = new Map()
  for (let i=0; i<equitySeriesHL.length; i++){
    const todayPt = equitySeriesHL[i]
    const prevPt  = equitySeriesHL[i-1]
    const pnl = (prevPt && Number.isFinite(prevPt.equity_trading))
      ? (todayPt.equity_trading - prevPt.equity_trading)
      : 0
    pnlDayMap.set(todayPt.date, pnl)
  }

  // # trades par jour
  const tradesCountMap = new Map()
  filtered.forEach(t => {
    const d = t.date
    tradesCountMap.set(d, (tradesCountMap.get(d) || 0) + 1)
  })

  // DD% et DD montant: calculés comme écart au **plus haut** atteint dans le **mois affiché**
  const monthPts = equitySeriesHL.filter(p => p.date.startsWith(`${calYear2}-${String(calMonth2+1).padStart(2,'0')}`))
  let runPeak = -Infinity
  const ddPctMap = new Map()
  const ddAmtMap = new Map()
  monthPts.forEach(p => {
    runPeak = Math.max(runPeak, p.equity_trading)
    if (runPeak > 0){
      const ddAmt = p.equity_trading - runPeak              // négatif ou 0
      const ddPct = ddAmt / runPeak                          // négatif ou 0
      ddPctMap.set(p.date, ddPct)
      ddAmtMap.set(p.date, ddAmt)
    } else {
      ddPctMap.set(p.date, 0)
      ddAmtMap.set(p.date, 0)
    }
  })

  // Verdict bordure par seuils DD%: <= -2% => bad, <= -1% => warn, sinon good
  const verdictClass = (ddPct) => {
    if (ddPct == null) return ''           // pas de bordure spéciale si pas de data
    if (ddPct <= -0.02) return 'halo-bad'
    if (ddPct <= -0.01) return 'halo-warn'
    return 'halo-good'
  }

  // Navigation mois
  const prevMonth = () => {
    let m = calMonth2 - 1, y = calYear2
    if (m < 0){ m = 11; y-- }
    setCalMonth2(m); setCalYear2(y)
  }
  const nextMonth = () => {
    let m = calMonth2 + 1, y = calYear2
    if (m > 11){ m = 0; y++ }
    setCalMonth2(m); setCalYear2(y)
  }

  // Rendu cellule jour
  const renderCell = (dt) => {
    const dayNum  = Number(dt.slice(8,10))
    const pnlDay  = pnlDayMap.get(dt)
    const eqPrev  = (() => { // pour rentabilité %
      const idx = equitySeriesHL.findIndex(p => p.date === dt)
      return (idx>0) ? equitySeriesHL[idx-1].equity_trading : null
    })()
    const retPct  = (eqPrev && eqPrev>0) ? (pnlDay/eqPrev) : 0

    const ddPct   = ddPctMap.get(dt)   // négatif/0
    const ddAmt   = ddAmtMap.get(dt)   // négatif/0
    const nTrades = tradesCountMap.get(dt) || 0

    const halo    = verdictClass(ddPct)
    const pnlColor= (pnlDay>=0) ? 'var(--green)' : 'var(--pink)'

    return (
      <div key={dt} className={`cal-cell ${halo}`} style={{ padding:'10px 8px' }}>
        <div style={{ fontSize:11, opacity:.9 }}>{dayNum}</div>
        <div style={{ fontSize:12, color: pnlColor }}>{Number.isFinite(pnlDay) ? fmtMoney(pnlDay) : '—'}</div>
        <div style={{ fontSize:11, color:'var(--text)' }}>{Number.isFinite(retPct) ? `${(retPct*100).toFixed(2)}%` : '—'}</div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>
          {ddPct!=null ? `${Math.abs(ddPct*100).toFixed(2)}% · ${fmtMoney(ddAmt||0)}` : '—'}
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>
          {nTrades>0 ? `${nTrades} trade${nTrades>1?'s':''}` : '—'}
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      {/* En-tête calendrier */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div className="kpi-title">calendrier / {monthLabel}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn sm" onClick={prevMonth}>◀</button>
          <button className="btn sm" onClick={nextMonth}>▶</button>
        </div>
      </div>

      {/* Légende seuils DD% */}
      <div style={{ display:'flex', gap:12, color:'var(--muted)', fontSize:12, margin:'4px 0 10px' }}>
        <span><span className="cal-cell halo-good" style={{ padding:'2px 6px' }}></span> DD &gt; -1%</span>
        <span><span className="cal-cell halo-warn" style={{ padding:'2px 6px' }}></span> -2% &lt;= DD ≤ -1%</span>
        <span><span className="cal-cell halo-bad"  style={{ padding:'2px 6px' }}></span> DD ≤ -2%</span>
      </div>

      {/* Jours semaine */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8, marginBottom:6 }}>
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
          <div key={d} style={{ textAlign:'center', color:'var(--muted)', fontSize:12 }}>{d}</div>
        ))}
      </div>

      {/* Grille jours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
        {datesInMonth.map(renderCell)}
      </div>
    </div>
  )
})()}
{/* ================== [BLOCK H] END — Calendrier (bordures verdict + infos jour) ================== */}


    /* ================== [BLOCK I] START — Capital Tiers (COMPLET) ================== */

/* --- [I-A] — ÉTAT & HELPERS (à coller avec les autres useState, dans App.jsx) --- */
const [capitalTiers, setCapitalTiers] = React.useState(() => {
  try {
    const raw = localStorage.getItem('zp_capital_tiers_v1')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
})
React.useEffect(() => {
  try { localStorage.setItem('zp_capital_tiers_v1', JSON.stringify(capitalTiers)) } catch {}
}, [capitalTiers])

const capitalTiersTotalDisp = React.useMemo(() => {
  return capitalTiers.reduce((a, r) => a + (convert(Number(r.amount)||0, r.ccy||'USD', displayCcy) || 0), 0)
}, [capitalTiers, displayCcy])

const [showCT, setShowCT] = React.useState(false)
const [ctForm, setCtForm] = React.useState({
  date: new Date().toISOString().slice(0,10),
  source: 'Darwinex',
  amount: '',
  ccy: displayCcy,
  note: ''
})
React.useEffect(()=>{ setCtForm(f => ({...f, ccy: displayCcy})) }, [displayCcy])

const ctSources = ['Darwinex', 'Prop firm', 'Axi Select', 'Investisseur', 'Autre']

function submitCT(e){
  e.preventDefault()
  const amt = Number(ctForm.amount)
  if (!ctForm.date || !ctForm.source || !Number.isFinite(amt)) { alert('Merci de renseigner Date, Source, Montant.'); return }
  const row = {
    date: ctForm.date,
    source: ctForm.source,
    amount: amt,
    ccy: ctForm.ccy || displayCcy,
    note: ctForm.note || ''
  }
  setCapitalTiers(prev => prev.concat([row]))
  setShowCT(false)
  setCtForm({ date:new Date().toISOString().slice(0,10), source:'Darwinex', amount:'', ccy:displayCcy, note:'' })
}
/* --- [I-A] FIN --- */


/* --- [I-B] — HEADER (à coller dans la barre d’actions du haut, avec tes boutons) --- */
/* KPI neutre “Capital Tiers” (total converti) */
<div className="card halo-neutral" style={{ padding:'6px 10px', display:'flex', alignItems:'center', gap:8 }}>
  <div className="kpi-title" style={{ margin:0 }}>capital tiers</div>
  <div className="val" style={{ fontSize:14, color:'var(--text)' }}>
    {(() => {
      try{
        if (typeof fmt === 'function') return fmt(capitalTiersTotalDisp, displayCcy)
        return new Intl.NumberFormat(undefined,{style:'currency',currency:displayCcy||'USD'}).format(capitalTiersTotalDisp||0)
      }catch{ return `${(capitalTiersTotalDisp||0).toFixed(2)} ${displayCcy||'USD'}` }
    })()}
  </div>
</div>

/* Bouton pour ouvrir la modale “Capital Tiers” */
<button className="btn" onClick={()=>setShowCT(true)}>capital tiers</button>
/* --- [I-B] FIN --- */


/* --- [I-C] — MODALE (à coller en bas du JSX principal, avec tes autres modales) --- */
{showCT && (
  <div className="modal-overlay" onClick={()=>setShowCT(false)}>
    <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div className="kpi-title" style={{ fontSize:14 }}>ajouter un capital tiers</div>
        <button className="btn ghost sm" onClick={()=>setShowCT(false)}>fermer</button>
      </div>

      <form onSubmit={submitCT} style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(2, 1fr)' }}>
        <label className="form-label">
          <span>source</span>
          <select className="sel" value={ctForm.source} onChange={e=>setCtForm(f=>({...f, source:e.target.value}))}>
            {ctSources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="form-label">
          <span>date</span>
          <input type="date" className="sel" value={ctForm.date} onChange={e=>setCtForm(f=>({...f, date:e.target.value}))} />
        </label>

        <label className="form-label">
          <span>devise</span>
          <select className="sel" value={ctForm.ccy} onChange={e=>setCtForm(f=>({...f, ccy:e.target.value}))}>
            {['USD','EUR','CHF'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="form-label">
          <span>montant</span>
          <input type="number" step="0.01" className="sel" placeholder="ex: 25 000.00" value={ctForm.amount}
                 onChange={e=>setCtForm(f=>({...f, amount:e.target.value}))} />
        </label>

        <label className="form-label" style={{ gridColumn:'1 / -1' }}>
          <span>note</span>
          <input type="text" className="sel" placeholder="optionnel"
                 value={ctForm.note} onChange={e=>setCtForm(f=>({...f, note:e.target.value}))} />
        </label>

        <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button type="button" className="btn ghost" onClick={()=>setShowCT(false)}>annuler</button>
          <button type="submit" className="btn">enregistrer</button>
        </div>
      </form>

      {capitalTiers.length > 0 && (
        <div style={{ marginTop:12 }}>
          <div className="kpi-title" style={{ marginBottom:6 }}>historique (local)</div>
          <div style={{ display:'grid', gap:6 }}>
            {capitalTiers.slice().reverse().map((r, i) => (
              <div key={i} className="cal-cell" style={{ padding:'8px 10px', display:'grid', gridTemplateColumns:'120px 1fr 140px 80px', gap:8 }}>
                <div style={{ color:'var(--muted)' }}>{r.date}</div>
                <div style={{ color:'var(--text)' }}>{r.source}{r.note? ` — ${r.note}`:''}</div>
                <div style={{ textAlign:'right', color:'var(--text)' }}>
                  {(() => {
                    const v = convert(Number(r.amount)||0, r.ccy||'USD', displayCcy)
                    try{
                      if (typeof fmt === 'function') return fmt(v, displayCcy)
                      return new Intl.NumberFormat(undefined,{style:'currency', currency:displayCcy||'USD'}).format(v||0)
                    }catch{ return `${(v||0).toFixed(2)} ${displayCcy||'USD'}` }
                  })()}
                </div>
                <div style={{ textAlign:'right', color:'var(--muted)' }}>{r.ccy}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}
/* --- [I-C] FIN --- */

/* ================== [BLOCK I] END — Capital Tiers (COMPLET) ================== */


    /* ================== [BLOCK J — CorrelationMatrix] START ================== */
function CorrelationMatrix({ filtered, displayCcy, convert }) {
  const strategies = React.useMemo(
    () => Array.from(new Set(filtered.map(t => t.strategy))).sort(),
    [filtered]
  )
  if (strategies.length < 2) return null

  const byDateByStrat = React.useMemo(() => {
    const m = new Map()
    for (const t of filtered){
      const d = t.date
      const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
      if (!m.has(d)) m.set(d, new Map())
      const mm = m.get(d)
      mm.set(t.strategy, (mm.get(t.strategy) || 0) + v)
    }
    return m
  }, [filtered, displayCcy, convert])

  const dates = React.useMemo(() => Array.from(byDateByStrat.keys()).sort(), [byDateByStrat])

  const series = React.useMemo(() => {
    const s = {}
    strategies.forEach(st => { s[st] = dates.map(d => (byDateByStrat.get(d).get(st) || 0)) })
    return s
  }, [strategies, dates, byDateByStrat])

  const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0
  const std  = a => { if(!a.length) return 0; const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)*(x-m)))) }
  const corr = (a,b) => {
    const n = Math.min(a.length, b.length); if(!n) return 0
    const ax=a.slice(0,n), bx=b.slice(0,n)
    const ma=mean(ax), mb=mean(bx)
    let num=0, da=0, db=0
    for(let i=0;i<n;i++){ const x=ax[i]-ma, y=bx[i]-mb; num+=x*y; da+=x*x; db+=y*y }
    const den=Math.sqrt(da*db); return den>0? num/den : 0
  }

  const verdict = (c) => {
    const a = Math.abs(c)
    if (a <= 0.30) return 'halo-good'
    if (a <= 0.60) return 'halo-warn'
    return 'halo-bad'
  }

  const matrix = strategies.map((s1,i) => strategies.map((s2,j) => (i===j ? 1 : corr(series[s1], series[s2]))))

  return (
    <div className="card" style={{ marginTop:16 }}>
      <div className="kpi-title">corrélation stratégies (pnl/jour)</div>
      <div style={{ overflowX:'auto', marginTop:8 }}>
        <table style={{ borderCollapse:'separate', borderSpacing:8 }}>
          <thead>
            <tr>
              <th></th>
              {strategies.map(s => <th key={s} style={{ color:'var(--muted)', fontWeight:400 }}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row,i)=>(
              <tr key={i}>
                <th style={{ color:'var(--muted)', fontWeight:400, textAlign:'right', paddingRight:8 }}>{strategies[i]}</th>
                {row.map((c,j)=>(
                  <td key={j}>
                    <div className={`cal-cell ${verdict(c)}`} style={{ padding:'10px 12px', textAlign:'center', minWidth:72 }}>
                      <div style={{ fontSize:14, color:'var(--text)' }}>{c.toFixed(2)}</div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color:'var(--muted)', fontSize:12, marginTop:8 }}>
        |corr| ≤ 0.30 = bon, 0.30–0.60 = mitigé, &gt; 0.60 = trop corrélé.
      </div>
    </div>
  )
}
/* ================== [BLOCK J — CorrelationMatrix] END ================== */


      /* ================== [BLOCK K — GuidePanel] START ================== */
function GuidePanel() {
  const [lang, setLang] = React.useState('fr')
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState(null)

  React.useEffect(() => {
    let alive = true
    const url = lang === 'en' ? '/guide.en.json' : lang === 'es' ? '/guide.es.json' : '/guide.fr.json'
    fetch(url).then(r=>r.json()).then(j=>{ if(alive) setData(j) }).catch(()=> setData(null))
    return ()=>{ alive=false }
  }, [lang])

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <button className="btn ghost" onClick={()=>setOpen(true)}>? aide</button>
      <select className="sel" value={lang} onChange={e=>setLang(e.target.value)} style={{ width:90 }}>
        <option value="fr">FR</option>
        <option value="en">EN</option>
        <option value="es">ES</option>
      </select>

      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(false)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()} style={{ maxWidth:900 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div className="kpi-title" style={{ fontSize:16 }}>{data?.title || 'aide & guide'}</div>
              <button className="btn ghost sm" onClick={()=>setOpen(false)}>fermer</button>
            </div>
            <div style={{ color:'var(--text)', fontSize:12, lineHeight:1.6 }}>
              {data ? (
                <>
                  {data.intro && <p style={{ color:'var(--muted)' }}>{data.intro}</p>}
                  {Array.isArray(data.sections) && data.sections.map((sec, i)=>(
                    <details key={i} className="card" style={{ margin:'8px 0' }}>
                      <summary className="kpi-title" style={{ cursor:'pointer' }}>{sec.title}</summary>
                      <div style={{ paddingTop:6, color:'var(--text)' }}>
                        {Array.isArray(sec.points) ? (
                          <ul style={{ margin:'6px 0 0 18px' }}>
                            {sec.points.map((p,idx)=><li key={idx} style={{ margin:'4px 0' }}>{p}</li>)}
                          </ul>
                        ) : <p style={{ margin:0 }}>{sec.content}</p>}
                      </div>
                    </details>
                  ))}
                </>
              ) : (
                <div style={{ color:'var(--muted)' }}>chargement du guide…</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
/* ================== [BLOCK K — GuidePanel] END ================== */


    /* ================== [BLOCK L — CashflowSummaryChip] START ================== */
function CashflowSummaryChip({ allCashflows, dateFrom, dateTo, displayCcy, convert, fmt }) {
  const today = new Date()
  const defaultFrom = new Date(today.getTime() - 29*24*3600*1000).toISOString().slice(0,10)
  const fromDate = (dateFrom && dateFrom.length) ? dateFrom : defaultFrom
  const toDate   = (dateTo && dateTo.length)     ? dateTo   : today.toISOString().slice(0,10)

  const inRange = (allCashflows || []).filter(c => (!fromDate || c.date >= fromDate) && (!toDate || c.date <= toDate))
  const byType = new Map()
  for (const c of inRange){
    const v = convert(Number(c.amount)||0, c.ccy||'USD', displayCcy)
    byType.set(c.type, (byType.get(c.type) || 0) + v)
  }

  const labels = {
    deposit:'Dépôt', withdrawal:'Retrait', prop_fee:'Prop fee', prop_payout:'Prop payout',
    darwin_mgmt_fee:'Darwinex fee', business_expense:'Charge', other_income:'Autre revenu'
  }

  const fmtMoney = (v) => {
    try{
      if (typeof fmt === 'function') return fmt(v, displayCcy)
      return new Intl.NumberFormat(undefined, { style:'currency', currency: displayCcy || 'USD' }).format(v ?? 0)
    }catch{ return `${(v ?? 0).toFixed(2)} ${displayCcy || 'USD'}` }
  }

  return (
    <div className="card halo-neutral" style={{ padding:'6px 10px', display:'flex', gap:10, alignItems:'center' }}>
      <div className="kpi-title" style={{ margin:0 }}>cashflows (récap)</div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[...byType.entries()].map(([k,v])=>(
          <span key={k} style={{ color: v>=0 ? 'var(--green)' : 'var(--pink)', fontSize:12 }}>
            {labels[k] || k}: <b>{fmtMoney(v)}</b>
          </span>
        ))}
        {byType.size===0 && <span style={{ color:'var(--muted)', fontSize:12 }}>— aucun flux dans l’intervalle</span>}
      </div>
    </div>
  )
}
/* ================== [BLOCK L — CashflowSummaryChip] END ================== */


    /* ================== [BLOCK M — RiskProjection] START ================== */
function RiskProjection({ filtered, displayCcy, convert, fmt, capitalGlobal, capitalInitialDisp, maxDDPct }) {
  const [open, setOpen] = React.useState(false)
  const round2 = (x)=> Math.round((x ?? 0)*100)/100
  const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0

  const expPerTrade = React.useMemo(() => {
    if (!filtered.length) return 0
    const pnl = filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy||'USD', displayCcy), 0)
    return pnl / filtered.length
  }, [filtered, displayCcy, convert])

  const wr_rr = React.useMemo(() => {
    const total = filtered.length
    const wins  = filtered.filter(t => t.pnl > 0)
    const losses= filtered.filter(t => t.pnl < 0)
    const wr = total ? (wins.length / total) : 0
    const avgWin = wins.length ? mean(wins.map(t => convert(t.pnl, t.ccy||'USD', displayCcy))) : 0
    const avgLoss= losses.length? mean(losses.map(t => Math.abs(convert(t.pnl, t.ccy||'USD', displayCcy)))) : 0
    const rr = avgLoss>0 ? (avgWin/avgLoss) : 0
    return { wr, rr }
  }, [filtered, displayCcy, convert])

  const tradesPerDay = React.useMemo(() => {
    if (!filtered.length) return 0
    const last = filtered[filtered.length-1]?.date
    const first= filtered[0]?.date
    const days = (first && last) ? Math.max(1, Math.floor((new Date(last) - new Date(first))/86400000)+1) : 1
    return filtered.length / days
  }, [filtered])

  const baseRef = (Number(capitalGlobal)>0 ? Number(capitalGlobal) : Number(capitalInitialDisp)||100000)
  const paceAnnualPct = React.useMemo(() => {
    const dailyGain = expPerTrade * tradesPerDay
    return baseRef>0 ? (dailyGain*252/baseRef)*100 : 0
  }, [expPerTrade, tradesPerDay, baseRef])

  const projectDays = (n)=> (expPerTrade * tradesPerDay * n)

  const verdictClassNum = (v, kind) => {
    switch(kind){
      case 'wr':   { const p = v*100; if (p>=50) return 'halo-good'; if (p>=35) return 'halo-warn'; return 'halo-bad' }
      case 'rr':   { if (v>=1.5) return 'halo-good'; if (v>=1.0) return 'halo-warn'; return 'halo-bad' }
      case 'dd':   { if (v<15) return 'halo-good'; if (v<=20) return 'halo-warn'; return 'halo-bad' }
      case 'pace': { if (v>=15) return 'halo-good'; if (v>=5) return 'halo-warn'; return 'halo-bad' }
      default: return 'halo-neutral'
    }
  }

  const fmtMoney = (v)=>{
    try{
      if (typeof fmt === 'function') return fmt(v, displayCcy)
      return new Intl.NumberFormat(undefined,{style:'currency',currency:displayCcy||'USD'}).format(v||0)
    }catch{ return `${(v||0).toFixed(2)} ${displayCcy||'USD'}` }
  }

  return (
    <>
      <button className="btn ghost" onClick={()=>setOpen(true)}>🔎 risque & projection</button>

      {open && (
        <div className="modal-overlay" onClick={()=>setOpen(false)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()} style={{ maxWidth:820 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div className="kpi-title" style={{ fontSize:16 }}>diagnostic risque & projection</div>
              <button className="btn ghost sm" onClick={()=>setOpen(false)}>fermer</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              <div className={`card ${verdictClassNum(wr_rr.wr,'wr')}`} style={{ padding:12 }}>
                <div className="kpi-title">win rate</div>
                <div className="val">{(wr_rr.wr*100).toFixed(1)}%</div>
              </div>
              <div className={`card ${verdictClassNum(wr_rr.rr,'rr')}`} style={{ padding:12 }}>
                <div className="kpi-title">risk / reward</div>
                <div className="val">{wr_rr.rr.toFixed(2)}</div>
              </div>
              <div className={`card ${verdictClassNum(Number(maxDDPct)||0,'dd')}`} style={{ padding:12 }}>
                <div className="kpi-title">max dd %</div>
                <div className="val">{Number.isFinite(Number(maxDDPct))? Number(maxDDPct).toFixed(2)+'%' : '—'}</div>
              </div>
              <div className={`card ${verdictClassNum(paceAnnualPct,'pace')}`} style={{ padding:12 }}>
                <div className="kpi-title">pace annuel (≈)</div>
                <div className="val">{paceAnnualPct.toFixed(1)}%</div>
              </div>
            </div>

            <div className="card halo-neutral" style={{ marginTop:12, padding:12 }}>
              <div className="kpi-title">projection simple (linéaire)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:8 }}>
                <div className="cal-cell" style={{ padding:10 }}>
                  <div style={{ color:'var(--muted)', fontSize:12 }}>30 jours</div>
                  <div className="val">{fmtMoney(projectDays(30))}</div>
                </div>
                <div className="cal-cell" style={{ padding:10 }}>
                  <div style={{ color:'var(--muted)', fontSize:12 }}>90 jours</div>
                  <div className="val">{fmtMoney(projectDays(90))}</div>
                </div>
                <div className="cal-cell" style={{ padding:10 }}>
                  <div style={{ color:'var(--muted)', fontSize:12 }}>hypothèses</div>
                  <div style={{ color:'var(--text)', fontSize:12 }}>
                    Expectancy &amp; cadence supposées <i>stables</i> (linéaire). À réévaluer si conditions de marché changent.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
/* ================== [BLOCK M — RiskProjection] END ================== */


   /* ================== [BLOCK N — WinRateDonut] START ================== */
function WinRateDonut({ filtered }) {
  // Comptes
  const counts = React.useMemo(() => {
    let wins = 0, losses = 0
    for (const t of filtered) {
      if (t?.pnl > 0) wins++
      else if (t?.pnl < 0) losses++
    }
    const total = wins + losses
    const wr = total ? (wins / total) * 100 : 0
    return { wins, losses, total, wr }
  }, [filtered])

  // Données anneau (neutre)
  const data = React.useMemo(() => ([
    { name: 'Gagnants', value: counts.wins },
    { name: 'Perdants', value: counts.losses },
  ]), [counts])

  // Couleurs neutres (respecte la consigne: ratios en neutre)
  const ringColors = ['var(--muted)', '#0f0f10'] // segment gagnants / perdants (tons neutres)
  const size = 160           // taille du conteneur
  const outerR = 62          // rayon externe (anti-clipping)
  const innerR = 42          // rayon interne (donut)
  const labelSize = 22       // taille du % centré

  // Tooltip propre (sans "n")
  const TooltipDonut = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    // Agréger au cas où Recharts enverrait plusieurs points
    const agg = new Map()
    payload.forEach(p => {
      const cat = p?.name || (p?.payload?.name) || ''
      const val = Number.isFinite(p?.value) ? p.value : 0
      agg.set(cat, (agg.get(cat) || 0) + val)
    })
    return (
      <div style={{
        background:'var(--panel)',
        border:'1px solid var(--border)',
        borderRadius:10,
        padding:'8px 10px',
        color:'var(--text)',
        fontSize:12
      }}>
        {[...agg.entries()].map(([cat, val])=>(
          <div key={cat} style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
            <span style={{ color:'var(--text)' }}>{cat}</span>
            <b style={{ color:'var(--text)' }}>{new Intl.NumberFormat().format(val)}</b>
          </div>
        ))}
        <div style={{ marginTop:6, color:'var(--muted)' }}>
          Total: <b style={{ color:'var(--text)' }}>{new Intl.NumberFormat().format(counts.total)}</b>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding:12 }}>
      <div className="kpi-title" style={{ marginBottom:8 }}>win rate</div>

      <div style={{ position:'relative', width:'100%', height:size }}>
        {/* libellés “Gagnants / Perdants” optionnels : compacts & neutres */}
        <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:10, color:'var(--muted)', fontSize:12 }}>
          <span>gagnants: <b style={{ color:'var(--text)' }}>{new Intl.NumberFormat().format(counts.wins)}</b></span>
          <span>perdants: <b style={{ color:'var(--text)' }}>{new Intl.NumberFormat().format(counts.losses)}</b></span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={1.5}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={ringColors[i % ringColors.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<TooltipDonut />} />
          </PieChart>
        </ResponsiveContainer>

        {/* % centré, parfaitement au milieu */}
        <div style={{
          position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          pointerEvents:'none', textAlign:'center'
        }}>
          <div>
            <div style={{ fontSize: labelSize, lineHeight:1, color:'var(--text)' }}>
              {counts.wr.toFixed(1)}%
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>sur {new Intl.NumberFormat().format(counts.total)} trades</div>
          </div>
        </div>
      </div>

      <div style={{ color:'var(--muted)', fontSize:12, marginTop:8 }}>
        Ratio de trades gagnants (neutre). Les colonnes “Gagnants/Perdants” détaillées sont visibles dans la section dédiée.
      </div>
    </div>
  )
}
/* ================== [BLOCK N — WinRateDonut] END ================== */

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
