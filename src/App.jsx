// === PARTIE 1/3 — Modèle, états, filtres, conversions, calculs ===
import React, { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceDot
} from 'recharts'

// Palette & style carte
export function makeColors() {
  return {
    bg: "#0a0a0b",
    text: "#e8ecef",
    muted: "#b6bcc1",
    panel: "#141414",
    border: "#1e1e1f",
    turq: "#20e3d6",
    turq2: "#18b8ad",
    pink: "#ff5fa2",
    pink2: "#ff7cbf",
    gold: "#c9a44b",
    axis: "#8a8f94"
  }
}
export const cardStyle = (colors) => ({
  background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14
})

/** Hook principal : calcule toutes les séries et KPI à partir des états/filters */
export function useDashboardModel() {
  const colors = makeColors()

  /* --------- DEMO DATA --------- */
  const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
  const BROKERS = ["Darwinex", "ICMarkets", "Pepperstone"]
  const STRATS  = ["Strategy 1", "Strategy 2", "Breakout"]

  const demoTrades = useMemo(() => {
    const rows = []
    const today = new Date()
    for (let i = 120; i >= 1; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      for (let k = 0; k < 5; k++) {
        const asset    = ASSETS[(i + k) % ASSETS.length]
        const broker   = BROKERS[(i + k * 2) % BROKERS.length]
        const strategy = STRATS[(i + k * 3) % STRATS.length]
        let pnl = (Math.random() - 0.5) * (Math.random() < 0.15 ? 2500 : 900)
        pnl = Number(pnl.toFixed(2))
        const openH = Math.floor(Math.random()*24)
        const openM = Math.floor(Math.random()*60)
        const open = new Date(d.getFullYear(), d.getMonth(), d.getDate(), openH, openM)
        const durMin = 15 + Math.floor(Math.random()* (60*8))
        const close = new Date(open.getTime() + durMin*60*1000)
        const mfe = Number((Math.abs(pnl) * (0.8 + Math.random()*0.8)).toFixed(2))
        const mae = Number((Math.abs(pnl) * (0.6 + Math.random()*0.8)).toFixed(2))
        rows.push({
          date, // date d'ouverture
          asset, broker, strategy,
          pnl, ccy: 'USD',
          open_time: open.toISOString(),
          close_time: close.toISOString(),
          mfe, mae
        })
      }
    }
    return rows
  }, [])

  const CAPITAL_INITIAL_USD = 100000
  const demoCashflows = [
    { date:'2025-01-05', type:'deposit',          amount: 2000, ccy:'USD', note:'Apport' },
    { date:'2025-02-10', type:'prop_fee',         amount: -500, ccy:'USD', note:'Prop challenge' },
    { date:'2025-03-15', type:'prop_payout',      amount: 1000, ccy:'USD', note:'Payout prop' },
    { date:'2025-04-02', type:'darwin_mgmt_fee',  amount: 250,  ccy:'USD', note:'Darwinex mgmt fee' },
    { date:'2025-05-20', type:'withdrawal',       amount: -800, ccy:'USD', note:'Retrait' }
  ]

  /* --------- STATE --------- */
  const [userTrades, setUserTrades] = useState([])
  const tradesAll = useMemo(()=> demoTrades.concat(userTrades), [demoTrades, userTrades])

  const [userCashflows, setUserCashflows] = useState(()=>{
    const raw = localStorage.getItem('zp_cashflows_custom')
    return raw ? JSON.parse(raw) : []
  })
  useEffect(()=>{ localStorage.setItem('zp_cashflows_custom', JSON.stringify(userCashflows)) }, [userCashflows])
  const allCashflows = useMemo(()=> demoCashflows.concat(userCashflows), [userCashflows])

  /* --------- FILTRES --------- */
  const [asset, setAsset] = useState("All")
  const [broker, setBroker] = useState("All")
  const [strategy, setStrategy] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const resetFilters = () => { setAsset("All"); setBroker("All"); setStrategy("All"); setDateFrom(""); setDateTo("") }

  const assets     = useMemo(() => Array.from(new Set(tradesAll.map(t => t.asset))), [tradesAll])
  const brokers    = useMemo(() => Array.from(new Set(tradesAll.map(t => t.broker))), [tradesAll])
  const strategies = useMemo(() => Array.from(new Set(tradesAll.map(t => t.strategy))), [tradesAll])

  const filtered = useMemo(() => tradesAll.filter(t => {
    if (asset !== "All" && t.asset !== asset) return false
    if (broker !== "All" && t.broker !== broker) return false
    if (strategy !== "All" && t.strategy !== strategy) return false
    if (dateFrom && t.date < dateFrom) return false
    if (dateTo && t.date > dateTo) return false
    return true
  }), [tradesAll, asset, broker, strategy, dateFrom, dateTo])

  /* --------- FX --------- */
  const [displayCcy, setDisplayCcy] = useState('USD')
  const fxFallback = {
    USD: { USD:1,   EUR:0.93, CHF:0.88 },
    EUR: { USD:1/0.93, EUR:1, CHF:0.88/0.93 },
    CHF: { USD:1/0.88, EUR:0.93/0.88, CHF:1 }
  }
  const [rates, setRates] = useState(null)
  useEffect(() => {
    const key = 'fx_cache_v1'
    const cached = localStorage.getItem(key)
    const now = Date.now()
    if (cached) {
      const { at, data } = JSON.parse(cached)
      if (now - at < 24*60*60*1000) { setRates(data); return }
    }
    fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF')
      .then(r=>r.json())
      .then(j=>{
        const data = {
          USD: { USD:1, EUR:j.rates.EUR, CHF:j.rates.CHF },
          EUR: { USD:1/j.rates.EUR, EUR:1, CHF:j.rates.CHF/j.rates.EUR },
          CHF: { USD:1/j.rates.CHF, EUR:j.rates.EUR/j.rates.CHF, CHF:1 }
        }
        setRates(data)
        localStorage.setItem(key, JSON.stringify({ at: now, data }))
      })
      .catch(()=>{})
  }, [])
  const convert = (val, from='USD', to=displayCcy) => {
    if (val == null) return 0
    if (from === to) return Number(val.toFixed(2))
    const table = rates || fxFallback
    const r = (table[from] && table[from][to]) ? table[from][to] : 1
    return Number((val * r).toFixed(2))
  }
  const fmtLocal = (v, ccy=displayCcy) => {
    try {
      return new Intl.NumberFormat(undefined,{ style:'currency', currency:ccy, minimumFractionDigits:2, maximumFractionDigits:2 }).format(v ?? 0)
    } catch { return `${(v??0).toFixed(2)} ${ccy}` }
  }

  /* --------- CASHFLOWS --------- */
  const cashflowsInRange = useMemo(()=>{
    const list = allCashflows.filter(c=>{
      if (dateFrom && c.date < dateFrom) return false
      if (dateTo && c.date > dateTo) return false
      return true
    })
    return list.map(c => ({ ...c, amount_disp: convert(c.amount, c.ccy, displayCcy) }))
  }, [allCashflows, dateFrom, dateTo, displayCcy, rates])

  const cashByDate = useMemo(()=>{
    const m = new Map()
    for (const c of cashflowsInRange){
      m.set(c.date, (m.get(c.date)||0) + (c.amount_disp||0))
    }
    return Array.from(m, ([date, cash]) => ({ date, cash })).sort((a,b)=>a.date.localeCompare(b.date))
  }, [cashflowsInRange])

  const cashCumMap = useMemo(()=>{
    let cum=0; const m=new Map()
    for (const c of cashByDate){ cum += c.cash; m.set(c.date, Number(cum.toFixed(2))) }
    return m
  }, [cashByDate])

  const capitalInitialDisp = useMemo(()=> convert(CAPITAL_INITIAL_USD, 'USD', displayCcy), [displayCcy, rates])

  /* --------- PNL groupé par date d'ouverture --------- */
  function groupByDateSumPnlDisp(rows) {
    const m = new Map()
    for (const r of rows) {
      const v = convert(r.pnl, r.ccy, displayCcy)
      m.set(r.date, (m.get(r.date) || 0) + v)
    }
    return Array.from(m, ([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date))
  }
  const pnlByDate = useMemo(() => groupByDateSumPnlDisp(filtered), [filtered, displayCcy, rates])
  const pnlMap = useMemo(()=>{ const m=new Map(); pnlByDate.forEach(p=>m.set(p.date, p.pnl)); return m },[pnlByDate])

  const mergedDates = useMemo(()=>{
    const s = new Set()
    pnlByDate.forEach(x=>s.add(x.date))
    cashByDate.forEach(x=>s.add(x.date))
    return Array.from(s).sort((a,b)=>a.localeCompare(b))
  }, [pnlByDate, cashByDate])

  /* --------- ÉQUITÉ (une courbe avec flux) --------- */
  const equityWithFlowsSeries = useMemo(()=>{
    let eq = capitalInitialDisp
    let prevCashCum = 0
    const out = []
    for (const d of mergedDates){
      const pnl = (pnlMap.get(d) || 0)
      const cashCum = (cashCumMap.get(d) || 0)
      const cashDelta = cashCum - prevCashCum
      prevCashCum = cashCum
      eq += pnl + cashDelta
      out.push({ date: d, equity_with_flows: Number(eq.toFixed(2)) })
    }
    return out
  }, [mergedDates, pnlMap, cashCumMap, capitalInitialDisp])

  /* --------- KPI --------- */
  const totalPnlDisp = useMemo(()=> filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, displayCcy, rates])
  const cashFlowTotal = useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
  const capitalBase = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])
  const capitalGlobal = useMemo(()=> capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

  const { peakEquity, maxDDAbs } = useMemo(()=>{
    if (!equityWithFlowsSeries.length) return { peakEquity:0, maxDDAbs:0 }
    let peakSeen = equityWithFlowsSeries[0].equity_with_flows
    let maxDrop = 0
    for (const p of equityWithFlowsSeries) {
      if (p.equity_with_flows > peakSeen) peakSeen = p.equity_with_flows
      const drop = peakSeen - p.equity_with_flows
      if (drop > maxDrop) maxDrop = drop
    }
    return { peakEquity: peakSeen, maxDDAbs: maxDrop }
  }, [equityWithFlowsSeries])

  const maxDDPct = useMemo(()=>{
    if (!isFinite(peakEquity) || peakEquity<=0) return 0
    return (maxDDAbs / peakEquity) * 100
  }, [maxDDAbs, peakEquity])

  const wins = filtered.filter(t => t.pnl > 0).length
  const wr = filtered.length ? (wins / filtered.length) * 100 : 0
  const avgWin = useMemo(() => {
    const list = filtered.filter(t => t.pnl > 0).map(t => convert(t.pnl, t.ccy, displayCcy))
    return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
  }, [filtered, displayCcy, rates])
  const avgLoss = useMemo(() => {
    const list = filtered.filter(t => t.pnl < 0).map(t => Math.abs(convert(t.pnl, t.ccy, displayCcy)))
    return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
  }, [filtered, displayCcy, rates])
  const rr = useMemo(()=> avgLoss > 0 ? (avgWin / avgLoss) : 0, [avgWin, avgLoss])
  const expectancy = useMemo(()=> filtered.length ? (totalPnlDisp / filtered.length) : 0, [totalPnlDisp, filtered.length])

  const globalReturnPct = useMemo(()=>{
    if (!isFinite(capitalBase) || capitalBase<=0) return 0
    return (totalPnlDisp / capitalBase) * 100
  }, [totalPnlDisp, capitalBase])

  // Durées (gains / pertes)
  const avgWinDurMin = useMemo(()=>{
    const mins = filtered.filter(t=>t.pnl>0).map(t=>{
      const o = t.open_time ? new Date(t.open_time).getTime() : NaN
      const c = t.close_time ? new Date(t.close_time).getTime() : NaN
      if (!isFinite(o) || !isFinite(c)) return null
      return (c - o) / 60000
    }).filter(v=>v!=null)
    return mins.length ? (mins.reduce((a,b)=>a+b,0)/mins.length) : 0
  }, [filtered])

  const avgLossDurMin = useMemo(()=>{
    const mins = filtered.filter(t=>t.pnl<0).map(t=>{
      const o = t.open_time ? new Date(t.open_time).getTime() : NaN
      const c = t.close_time ? new Date(t.close_time).getTime() : NaN
      if (!isFinite(o) || !isFinite(c)) return null
      return (c - o) / 60000
    }).filter(v=>v!=null)
    return mins.length ? (mins.reduce((a,b)=>a+b,0)/mins.length) : 0
  }, [filtered])

  /* --------- Histogrammes (heure/jour/mois) --------- */
  const gainsLossByHour = useMemo(()=>{
    const arr = Array.from({length:24}, (_,h)=>({ hour: `${String(h).padStart(2,'0')}:00`, gain: 0, loss: 0 }))
    for (const t of filtered){
      const h = new Date(t.open_time || (t.date+'T00:00:00Z')).getHours()
      if (!isFinite(h)) continue
      const v = convert(t.pnl, t.ccy, displayCcy)
      if (v >= 0) arr[h].gain += v; else arr[h].loss += Math.abs(v)
    }
    return arr.map(x=>({ ...x, gain: Number(x.gain.toFixed(2)), loss: Number(x.loss.toFixed(2)) }))
  }, [filtered, displayCcy, rates])

  const gainsLossByDay = useMemo(()=>{
    const map = new Map()
    for (const t of filtered){
      const d = (t.open_time ? t.open_time.slice(0,10) : t.date)
      const v = convert(t.pnl, t.ccy, displayCcy)
      if (!map.has(d)) map.set(d, { day:d, gain:0, loss:0 })
      const x = map.get(d)
      if (v >= 0) x.gain += v; else x.loss += Math.abs(v)
    }
    const arr = Array.from(map.values()).sort((a,b)=>a.day.localeCompare(b.day))
    return arr.map(x=>({ ...x, gain: Number(x.gain.toFixed(2)), loss: Number(x.loss.toFixed(2)) }))
  }, [filtered, displayCcy, rates])

  const gainsLossByMonth = useMemo(()=>{
    const map = new Map()
    for (const t of filtered){
      const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const v = convert(t.pnl, t.ccy, displayCcy)
      if (!map.has(key)) map.set(key, { month:key, gain:0, loss:0 })
      const x = map.get(key)
      if (v >= 0) x.gain += v; else x.loss += Math.abs(v)
    }
    const arr = Array.from(map.values()).sort((a,b)=>a.month.localeCompare(b.month))
    return arr.map(x=>({ ...x, gain: Number(x.gain.toFixed(2)), loss: Number(x.loss.toFixed(2)) }))
  }, [filtered, displayCcy, rates])

  /* --------- Calendrier (mois/année sélectionnés) --------- */
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth()) // 0-11

  return {
    // style
    colors,
    card: cardStyle(colors),

    // data & états exposés à l’UI
    ASSETS, BROKERS, STRATS,
    tradesAll,
    allCashflows,

    // filtres
    assets, brokers, strategies,
    asset, setAsset, broker, setBroker, strategy, setStrategy,
    dateFrom, setDateFrom, dateTo, setDateTo, resetFilters,

    // devise & conversion
    displayCcy, setDisplayCcy, convert, fmtLocal,

    // cashflows & equity
    cashflowsInRange, cashByDate, cashCumMap,
    capitalInitialDisp,
    pnlByDate, mergedDates, equityWithFlowsSeries,

    // KPI
    totalPnlDisp, cashFlowTotal, capitalBase, capitalGlobal,
    peakEquity, maxDDAbs, maxDDPct,
    wr, avgWin, avgLoss, rr, expectancy, globalReturnPct,
    avgWinDurMin, avgLossDurMin,

    // histogrammes
    gainsLossByHour, gainsLossByDay, gainsLossByMonth,

    // calendrier
    calYear, setCalYear, calMonth, setCalMonth
  }
}
// === PARTIE 2/3 — Interface UI du Dashboard ===

export default function App() {
  const m = useDashboardModel()
  const { colors, card, assets, brokers, strategies,
    asset, setAsset, broker, setBroker, strategy, setStrategy,
    dateFrom, setDateFrom, dateTo, setDateTo, resetFilters,
    displayCcy, setDisplayCcy,
    capitalInitialDisp, capitalBase, capitalGlobal,
    totalPnlDisp, maxDDAbs, maxDDPct,
    wr, rr, avgWin, avgLoss, expectancy,
    avgWinDurMin, avgLossDurMin, globalReturnPct,
    gainsLossByHour, gainsLossByMonth,
    equityWithFlowsSeries, cashflowsInRange,
    fmtLocal, calYear, calMonth, setCalYear, setCalMonth
  } = m

  return (
    <div style={{ background: colors.bg, color: colors.text, minHeight: '100vh', padding: 20 }}>
      {/* HEADER */}
      <h1 style={{ color: colors.turq, fontWeight: 400, margin: '10px 0 20px', fontSize: 32 }}>
        ZooProjectVision
      </h1>

      {/* FILTRES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <select style={sel(colors)} value={asset} onChange={e => setAsset(e.target.value)}>
          <option>All</option>{assets.map(a => <option key={a}>{a}</option>)}
        </select>
        <select style={sel(colors)} value={broker} onChange={e => setBroker(e.target.value)}>
          <option>All</option>{brokers.map(a => <option key={a}>{a}</option>)}
        </select>
        <select style={sel(colors)} value={strategy} onChange={e => setStrategy(e.target.value)}>
          <option>All</option>{strategies.map(a => <option key={a}>{a}</option>)}
        </select>
        <input type="date" style={sel(colors)} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" style={sel(colors)} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <select style={sel(colors)} value={displayCcy} onChange={e => setDisplayCcy(e.target.value)}>
          <option>USD</option><option>EUR</option><option>CHF</option>
        </select>
        <button style={btn(colors)} onClick={resetFilters}>Réinitialiser</button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 30 }}>
        <div style={card}><h3 style={kpiTitle(colors)}>Capital Initial</h3><div style={kpiVal}>{fmtLocal(capitalInitialDisp)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Cash Flow</h3><div style={kpiVal}>{fmtLocal(capitalBase - capitalInitialDisp)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Capital Global</h3><div style={kpiVal}>{fmtLocal(capitalGlobal)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Rentabilité Globale</h3><div style={kpiVal}>{globalReturnPct.toFixed(2)}%</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Max DD % / Max DD</h3><div style={kpiVal}>{maxDDPct.toFixed(2)}% / {fmtLocal(maxDDAbs)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Gain Moyen / Perte Moyenne</h3><div style={kpiVal}>{fmtLocal(avgWin)} / {fmtLocal(avgLoss)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Win Rate / RR</h3><div style={kpiVal}>
          {(() => {
            const p = wr / 100
            const profitable = (avgWin * p - avgLoss * (1 - p)) > 0
            const col = profitable ? colors.text : colors.pink
            return <span style={{ color: col }}>{wr.toFixed(1)}% / {rr.toFixed(2)}</span>
          })()}
        </div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Durée Moyenne Gains / Pertes</h3><div style={kpiVal}>{avgWinDurMin.toFixed(0)}m / {avgLossDurMin.toFixed(0)}m</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Espérance par Trade</h3><div style={kpiVal}>{fmtLocal(expectancy)}</div></div>
      </div>

      {/* COURBE D'ÉQUITÉ */}
      <div style={card}>
        <h3 style={kpiTitle(colors)}>Courbe D'Équité (Flux Inclus)</h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={equityWithFlowsSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#0f1011", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 12 }}
                labelStyle={{ color: colors.muted, fontSize: 11 }}
                formatter={(v, name, p) => {
                  const flux = cashflowsInRange.filter(c => c.date === p.payload.date)
                  const fluxText = flux.map(f => `${f.type}: ${fmtLocal(f.amount_disp)}`).join(' | ')
                  return [`${fmtLocal(v)}${fluxText ? ` (${fluxText})` : ''}`, "Équité"]
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.muted, paddingTop: 4 }} />
              <Line type="monotone" dataKey="equity_with_flows" stroke="#ffffff" strokeWidth={3} dot={false} />
              {cashflowsInRange.map((c, i) => {
                const y = equityWithFlowsSeries.find(p => p.date === c.date)?.equity_with_flows
                const color = c.amount >= 0 ? colors.turq : colors.pink
                return y ? <ReferenceDot key={i} x={c.date} y={y} r={4} fill={color} stroke="none" /> : null
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAPHIQUE PAR HEURE */}
      <div style={{ ...card, marginTop: 20 }}>
        <h3 style={kpiTitle(colors)}>Gains / Pertes Par Heure D’Ouverture</h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={gainsLossByHour}>
              <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
              <XAxis dataKey="hour" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} />
              <Tooltip contentStyle={{ background: "#0f1011", border: `1px solid ${colors.border}`, borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.muted, paddingTop: 4 }} />
              <Bar dataKey="gain" name="Gains" fill={colors.turq} />
              <Bar dataKey="loss" name="Pertes" fill={colors.pink} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAPHIQUE PAR MOIS */}
      <div style={{ ...card, marginTop: 20 }}>
        <h3 style={kpiTitle(colors)}>Gains / Pertes Par Mois</h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={gainsLossByMonth}>
              <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
              <XAxis dataKey="month" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} />
              <Tooltip contentStyle={{ background: "#0f1011", border: `1px solid ${colors.border}`, borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.muted, paddingTop: 4 }} />
              <Bar dataKey="gain" name="Gains" fill={colors.turq} />
              <Bar dataKey="loss" name="Pertes" fill={colors.pink} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CALENDRIER */}
      <div style={{ ...card, marginTop: 20, marginBottom: 40 }}>
        <h3 style={kpiTitle(colors)}>Calendrier / {calYear}</h3>
        <p style={{ fontSize: 13, color: colors.muted }}>Rentabilité mensuelle et drawdown</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 10,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 13, color: colors.text }}>{new Date(calYear, i).toLocaleString('default', { month: 'short' })}</div>
              <div style={{ fontSize: 12, color: colors.turq }}>+{(Math.random()*10).toFixed(2)}%</div>
              <div style={{ fontSize: 12, color: colors.pink }}>{(Math.random()*5).toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
// === PARTIE 3/3 — Helpers, styles, utilitaires ===

// Style des boutons
export const btn = (colors) => ({
  background: 'transparent',
  color: colors.gold,
  border: `1px solid ${colors.gold}`,
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
  transition: '0.2s',
  fontSize: 13
})

// Style des sélecteurs / input
export const sel = (colors) => ({
  background: colors.panel,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 13,
  outline: 'none'
})

// Style des titres KPI
export const kpiTitle = (colors) => ({
  color: colors.muted,
  fontWeight: 400,
  fontSize: 13,
  marginBottom: 4,
  textTransform: 'capitalize'
})

// Style des valeurs KPI
export const kpiVal = {
  fontWeight: 400,
  fontSize: 16,
  color: '#e8ecef'
}

// === FIN DU FICHIER App.jsx ===
