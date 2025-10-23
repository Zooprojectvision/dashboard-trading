import React, { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceDot
} from 'recharts'

export default function App() {
  try {
    /* ===================== Thème ===================== */
    const colors = {
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
    const card = { background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14 }

    /* ===================== Démo data ===================== */
    const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
    const BROKERS = ["Darwinex", "ICMarkets", "Pepperstone"]
    const STRATS  = ["Strategy 1", "Strategy 2", "Breakout"]

    const demoTrades = useMemo(() => {
      const rows = []
      const today = new Date()
      for (let i = 90; i >= 1; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i)
        const date = d.toISOString().slice(0, 10)
        for (let k = 0; k < 6; k++) {
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
            date,
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

    /* ===================== État utilisateur ===================== */
    const [userTrades, setUserTrades] = useState([])
    const tradesAll = useMemo(()=> demoTrades.concat(userTrades), [demoTrades, userTrades])

    const [userCashflows, setUserCashflows] = useState(()=>{
      const raw = localStorage.getItem('zp_cashflows_custom')
      return raw ? JSON.parse(raw) : []
    })
    useEffect(()=>{ localStorage.setItem('zp_cashflows_custom', JSON.stringify(userCashflows)) }, [userCashflows])
    const allCashflows = useMemo(()=> demoCashflows.concat(userCashflows), [userCashflows])

    /* ===================== Filtres ===================== */
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

    /* ===================== Devise ===================== */
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
    const fmt = (v, ccy=displayCcy) => {
      try {
        return new Intl.NumberFormat(undefined,{ style:'currency', currency:ccy, minimumFractionDigits:2, maximumFractionDigits:2 }).format(v ?? 0)
      } catch { return `${(v??0).toFixed(2)} ${ccy}` }
    }

    /* ===================== Cashflows ===================== */
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

    /* ===================== PnL groupé par date ===================== */
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

    /* ===================== Équité (UNE SEULE COURBE AVEC FLUX) ===================== */
    const equityWithFlowsSeries = useMemo(()=>{
      let eq = capitalInitialDisp
      const out = []
      for (const d of mergedDates){
        eq += (pnlMap.get(d) || 0) + (cashCumMap.has(d) ? (cashCumMap.get(d) - (out.length?cashCumMap.get(mergedDates[out.length-1])||0:0)) : 0)
        // on ajoute pnl du jour + variation de cash du jour
        out.push({ date: d, equity_with_flows: Number(eq.toFixed(2)) })
      }
      return out
    }, [mergedDates, pnlMap, cashCumMap, capitalInitialDisp])

    /* MaxDD & KPIs globaux */
    const totalPnlDisp = useMemo(()=> filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, displayCcy, rates])
    const cashFlowTotal = useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
    const capitalBase = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])
    const capitalGlobal = useMemo(()=> capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

    // Max DD à partir de la seule courbe "avec flux"
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

    /* Win Rate / RR / Expectancy */
    const wins = filtered.filter(t => t.pnl > 0).length
    const wr = filtered.length ? (wins / filtered.length) * 100 : 0
    const avgWin = (() => {
      const list = filtered.filter(t => t.pnl > 0).map(t => convert(t.pnl, t.ccy, displayCcy))
      return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
    })()
    const avgLoss = (() => {
      const list = filtered.filter(t => t.pnl < 0).map(t => Math.abs(convert(t.pnl, t.ccy, displayCcy)))
      return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
    })()
    const rr = avgLoss > 0 ? (avgWin / avgLoss) : 0
    const expectancy = useMemo(()=> filtered.length ? (totalPnlDisp / filtered.length) : 0, [totalPnlDisp, filtered.length])

    const globalReturnPct = useMemo(()=>{
      if (!isFinite(capitalBase) || capitalBase<=0) return 0
      return (totalPnlDisp / capitalBase) * 100
    }, [totalPnlDisp, capitalBase])

    /* ===================== Durées ===================== */
    const avgWinDurMin = useMemo(()=>{
      const mins = filtered.filter(t=>t.pnl>0).map(t=>{
        const o = t.open_time ? new Date(t.open_time).getTime() : NaN
        const c = t.close_time ? new Date(t.close_time).getTime() : NaN
        if (!isFinite(o) || !isFinite(c)) return null
        return (c - o) / 60000
      }).filter(v=>v!=null)
      return mins.length ? mean(mins) : 0
    }, [filtered])

    const avgLossDurMin = useMemo(()=>{
      const mins = filtered.filter(t=>t.pnl<0).map(t=>{
        const o = t.open_time ? new Date(t.open_time).getTime() : NaN
        const c = t.close_time ? new Date(t.close_time).getTime() : NaN
        if (!isFinite(o) || !isFinite(c)) return null
        return (c - o) / 60000
      }).filter(v=>v!=null)
      return mins.length ? mean(mins) : 0
    }, [filtered])

    /* ===================== Gains/Pertes par HEURE / JOUR / MOIS ===================== */
    const gainsLossByHour = useMemo(()=>{
      const arr = Array.from({length:24}, (_,h)=>({ hour: `${String(h).padStart(2,'0')}:00`, gain: 0, loss: 0 }))
      for (const t of filtered){
        const h = new Date(t.open_time || (t.date+'T00:00:00Z')).getHours()
        if (!isFinite(h)) continue
        const v = convert(t.pnl, t.ccy, displayCcy)
        if (v >= 0) arr[h].gain += v; else arr[h].loss += Math.abs(v)
      }
      return arr.map(x=>({ ...x, gain: fix2(x.gain), loss: fix2(x.loss) }))
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
      return arr.map(x=>({ ...x, gain: fix2(x.gain), loss: fix2(x.loss) }))
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
      return arr.map(x=>({ ...x, gain: fix2(x.gain), loss: fix2(x.loss) }))
    }, [filtered, displayCcy, rates])

    /* ===================== Import/Export CSV (inchangé côté UI bouton) ===================== */
    const exportCSV = () => {
      const header = ['date','asset','broker','strategy',`pnl_${displayCcy}`]
      const rows = filtered.map(t => [ t.date, t.asset, t.broker, t.strategy, convert(t.pnl, t.ccy, displayCcy).toFixed(2) ])
      const csv = [header, ...rows].map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `trades_filtres_${displayCcy}.csv`; a.click()
      URL.revokeObjectURL(url)
    }

    /* ===================== UI States ===================== */
    const [showForm, setShowForm] = useState(false) // modal flux (conservé si besoin plus tard)
    const [showFlows, setShowFlows] = useState(true)

    /* ===================== Render ===================== */
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, padding: 20, maxWidth: 1540, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
          <div>
            <h1 style={{ color: colors.turq, fontWeight: 400, margin: 0, fontSize: 32 }}>ZooProjectVision</h1>
            <p style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Dashboard de performance trading — multi-actifs, multi-brokers, multi-stratégies</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: 'wrap', alignItems:'center' }}>
            <button style={btn(colors)} onClick={() => window.location.reload()}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >Actualiser</button>
            <button style={btn(colors)} onClick={resetFilters}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >Réinitialiser Filtres</button>
            <button style={btn(colors)} onClick={exportCSV}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >Export CSV</button>

            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:colors.muted, border:`1px solid ${colors.gold}`, padding:'6px 10px', borderRadius:10 }}>
              <input type="checkbox" checked={showFlows} onChange={e=>setShowFlows(e.target.checked)} />
              Afficher points de flux
            </label>
          </div>
        </div>

        {/* FILTRES */}
        <Filters
          colors={colors}
          assets={assets} brokers={brokers} strategies={strategies}
          asset={asset} setAsset={setAsset}
          broker={broker} setBroker={setBroker}
          strategy={strategy} setStrategy={setStrategy}
          dateFrom={dateFrom} setDateFrom={setDateFrom}
          dateTo={dateTo} setDateTo={setDateTo}
          displayCcy={displayCcy} setDisplayCcy={setDisplayCcy}
        />

        {/* KPIs */}
        <KPIs
          colors={colors}
          capitalInitialDisp={capitalInitialDisp}
          cashFlowTotal={cashFlowTotal}
          totalPnlDisp={totalPnlDisp}
          capitalGlobal={capitalGlobal}
          globalReturnPct={globalReturnPct}
          maxDDPct={maxDDPct}
          maxDDAbs={maxDDAbs}
          wr={wr} rr={rr} expectancy={expectancy}
          avgWin={avgWin} avgLoss={avgLoss}
          avgWinDurMin={avgWinDurMin} avgLossDurMin={avgLossDurMin}
          filtered={filtered}
        />

        {/* Courbe d’Équité (UNE SEULE COURBE AVEC FLUX) */}
        <div style={{ ...card, height: 420, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Courbe D’Équité (Avec Flux)</h3>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={equityWithFlowsSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <Tooltip content={<EquityTooltip colors={colors} fmt={fmt} cashflows={cashflowsInRange} />} />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.muted, paddingTop: 4 }} />
              <Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#ffffff" strokeWidth={3} isAnimationActive={false} />
              {showFlows && cashflowsInRange
                .filter(c=>['deposit','withdrawal','prop_fee','prop_payout','darwin_mgmt_fee'].includes(c.type))
                .map((c,i)=>{
                  const pt = equityWithFlowsSeries.find(p=>p.date===c.date)
                  if(!pt) return null
                  const color = c.amount >= 0 ? colors.turq : colors.pink
                  return <ReferenceDot key={'cf'+i} x={c.date} y={pt.equity_with_flows} r={4} fill={color} stroke="none" />
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Histogrammes — Heures / Jours / Mois */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16 }}>
          <BarCard title="Gains / Pertes Par Heure D’Ouverture" data={gainsLossByHour} xKey="hour" colors={colors} fmt={fmt} />
          <BarCard title="Gains / Pertes Par Jour D’Ouverture" data={gainsLossByDay} xKey="day" colors={colors} fmt={fmt} />
          <BarCard title="Gains / Pertes Par Mois D’Ouverture" data={gainsLossByMonth} xKey="month" colors={colors} fmt={fmt} />
        </div>

        <div style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 20 }}>
          ZooProjectVision © {new Date().getFullYear()}
        </div>
      </div>
    )
  } catch (e) {
    console.error(e)
    return <div style={{ color: '#ff5fa2', padding: 16 }}>Erreur dans App.jsx : {String(e.message || e)}</div>
  }
}

/* ===================== Components ===================== */

function Filters({ colors, assets, brokers, strategies,
  asset, setAsset, broker, setBroker, strategy, setStrategy,
  dateFrom, setDateFrom, dateTo, setDateTo, displayCcy, setDisplayCcy }) {

  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
      <div><div style={label(colors)}>Actif</div>
        <select value={asset} onChange={e => setAsset(e.target.value)} style={sel(colors)}><option>All</option>{assets.map(a => <option key={a} value={a}>{a}</option>)}</select>
      </div>
      <div><div style={label(colors)}>Broker</div>
        <select value={broker} onChange={e => setBroker(e.target.value)} style={sel(colors)}><option>All</option>{brokers.map(b => <option key={b} value={b}>{b}</option>)}</select>
      </div>
      <div><div style={label(colors)}>Stratégie</div>
        <select value={strategy} onChange={e => setStrategy(e.target.value)} style={sel(colors)}><option>All</option>{strategies.map(s => <option key={s} value={s}>{s}</option>)}</select>
      </div>
      <div><div style={label(colors)}>Du</div><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={sel(colors)} /></div>
      <div><div style={label(colors)}>Au</div><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={sel(colors)} /></div>
      <div><div style={label(colors)}>Devise</div>
        <select value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)} style={sel(colors)}>{['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}</select>
      </div>
      <div />
    </div>
  )
}

function KPIs({
  colors,
  capitalInitialDisp, cashFlowTotal, totalPnlDisp, capitalGlobal,
  globalReturnPct, maxDDPct, maxDDAbs,
  wr, rr, expectancy, avgWin, avgLoss, avgWinDurMin, avgLossDurMin,
  filtered
}) {
  const wins = filtered.filter(t => t.pnl > 0).length
  const p = filtered.length ? (wins / filtered.length) : 0
  const profitable = (avgWin * p - avgLoss * (1 - p)) > 0
  const colPR = profitable ? '#ffffff' : colors.pink

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 12 }}>
        <div style={card}><h3 style={kpiTitle(colors)}>Capital Initial</h3><div style={{ fontSize: 18 }}>{fmt(capitalInitialDisp)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Cash Flow</h3><div style={{ fontSize: 18, color: cashFlowTotal >= 0 ? colors.turq : colors.pink }}>{fmt(cashFlowTotal)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>PNL (Filtré)</h3><div style={{ fontSize: 18, color: totalPnlDisp >= 0 ? colors.turq : colors.pink }}>{fmt(totalPnlDisp)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Capital Global</h3><div style={{ fontSize: 18 }}>{fmt(capitalGlobal)}</div></div>
        <div style={card}><h3 style={kpiTitle(colors)}>Rentabilité Globale</h3>
          <div style={{ fontSize: 18, color: colorByThreshold('ret', globalReturnPct) }}>{globalReturnPct.toFixed(2)}%</div>
        </div>
        <div style={card}>
          <h3 style={kpiTitle(colors)}>Max DD % / Max DD</h3>
          <div style={{ fontSize: 18 }}>
            <span style={{ color: colorByThreshold('dd', maxDDPct) }}>{maxDDPct.toFixed(2)}%</span>
            {' / '}
            <span style={{ color: colorByThreshold('dd', maxDDPct) }}>{fmt(maxDDAbs)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
        <div style={card}>
          <h3 style={kpiTitle(colors)}>Win Rate / RR</h3>
          <div style={{ fontSize: 16 }}>
            <span style={{ color: colPR }}>{wr.toFixed(2)}%</span>
            {' / '}
            <span style={{ color: colPR }}>{rr.toFixed(2)}</span>
          </div>
        </div>
        <div style={card}>
          <h3 style={kpiTitle(colors)}>Expectancy (par Trade)</h3>
          <div style={{ fontSize: 16, color: expectancy>0 ? '#ffffff' : colors.pink }}>{fmt(expectancy)}</div>
        </div>
        <div style={card}>
          <h3 style={kpiTitle(colors)}>Gain Moyen / Perte Moyenne</h3>
          <div style={{ fontSize: 16 }}>
            <span style={{ color: colors.turq }}>{fmt(avgWin)}</span>
            {' / '}
            <span style={{ color: colors.pink }}>{fmt(avgLoss)}</span>
          </div>
        </div>
        <div style={card}>
          <h3 style={kpiTitle(colors)}>Durée Moyenne Gains / Pertes</h3>
          <div style={{ fontSize: 16 }}>
            <span style={{ color: colors.turq }}>{avgWinDurMin.toFixed(0)} min</span>
            {' / '}
            <span style={{ color: colors.pink }}>{avgLossDurMin.toFixed(0)} min</span>
          </div>
        </div>
      </div>
    </>
  )
}

/* Tooltip custom pour la courbe d’équité avec flux */
function EquityTooltip({ active, payload, label, colors, fmt, cashflows }) {
  if (!active || !payload || !payload.length) return null
  const equity = payload[0].value
  const flows = cashflows.filter(c => c.date === label)
  return (
    <div style={{
      background: "#0f1011",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      borderRadius: 12,
      boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
      padding: 10,
      fontSize: 12,
      maxWidth: 280
    }}>
      <div style={{ color: colors.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ marginBottom: 6 }}>Équité: <b>{fmt(equity)}</b></div>
      {flows.length>0 && (
        <div>
          {flows.map((c,i)=>(
            <div key={i} style={{ color: c.amount>=0?colors.turq:colors.pink }}>
              {(c.type==='deposit' && 'Dépôt') ||
               (c.type==='withdrawal' && 'Retrait') ||
               (c.type==='prop_fee' && 'Prop Fee') ||
               (c.type==='prop_payout' && 'Prop Payout') ||
               (c.type==='darwin_mgmt_fee' && 'Darwinex Fee') || 'Flux'}: {c.amount>=0?'+':''}{fmt(c.amount_disp)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Carte histogramme réutilisable (2 barres: gains & pertes) */
function BarCard({ title, data, xKey, colors, fmt }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, height: 320 }}>
      <h3 style={kpiTitle(colors)}>{title}</h3>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
          <XAxis dataKey={xKey} stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
          <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "#0f1011", border:`1px solid ${colors.border}`, color: colors.text, borderRadius:12, boxShadow:"0 8px 20px rgba(0,0,0,0.35)", padding:10 }}
            itemStyle={{ color: colors.text }} labelStyle={{ color: colors.muted, fontSize: 11 }}
            formatter={(v, n)=>[fmt(v), n==='gain'?'Gains':'Pertes']}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: colors.muted, paddingTop: 4 }} />
          <defs>
            <linearGradient id="turqGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.turq} />
              <stop offset="100%" stopColor={colors.turq2} />
            </linearGradient>
            <linearGradient id="pinkGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.pink} />
              <stop offset="100%" stopColor={colors.pink2} />
            </linearGradient>
          </defs>
          <Bar dataKey="gain" name="Gains" fill="url(#turqGloss)" />
          <Bar dataKey="loss" name="Pertes" fill="url(#pinkGloss)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ===================== helpers ===================== */
function mean(a){ if(!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
function fix2(x){ return Number((x||0).toFixed(2)) }

/* ===================== UI helpers ===================== */
function btn(colors){ return { border:`1px solid ${colors.gold}`, background:'transparent', color:colors.text, padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12, transition:'background 160ms ease' } }
function label(colors){ return { color: colors.text, fontSize: 12, marginBottom: 6, fontWeight: 400 } }
function sel(colors){ return { width:'100%', padding:'9px 12px', fontSize:12, color:colors.text, background:'#0f0f10', border:`1px solid ${colors.border}`, borderRadius:10, outline:'none' } }
function kpiTitle(colors){ return { fontWeight: 400, color: colors.text, margin: "0 0 8px", fontSize: 14, letterSpacing: 0.2 } }
function colorByThreshold(metric, value){
  const c = { good:'#ffffff', neutral:'#c8d0d6', bad:'#ff5fa2' }
  switch(metric){
    case 'ret': return value>=0?c.good:c.bad
    case 'dd':  return value<10?c.good: value<=25?c.neutral:c.bad
    default:    return '#e8ecef'
  }
}
function fmt(v, ccy='USD'){ // fallback local, remplacé dans KPIs
  try { return new Intl.NumberFormat(undefined,{ style:'currency', currency:ccy, minimumFractionDigits:2, maximumFractionDigits:2 }).format(v ?? 0) }
  catch { return `${(v??0).toFixed(2)} ${ccy}` }
}
