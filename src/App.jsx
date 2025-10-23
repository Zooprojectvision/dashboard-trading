import React, { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceDot
} from 'recharts'

export default function App() {
  try {
    /* ===================== Thème & styles ===================== */
    const colors = {
      bg: "#0a0a0b",
      text: "#e8ecef",        // gris clair pour tout le texte
      muted: "#c2c7cc",
      panel: "#141414",
      border: "#1f2021",
      axis: "#8a8f94",
      // gloss
      green: "#4ade80", green2: "#22c55e",         // positif
      pink:  "#ff5fa2", pink2:  "#ff7cbf",         // négatif
      gold:  "#c9a44b",
      // tons de fond soft
      softGreen: "rgba(34,197,94,0.12)",
      softRed:   "rgba(255,99,132,0.12)",
      softOrange:"rgba(245,158,11,0.12)",
    }
    const baseCard = { background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14 }

    const tone = (mode) => {
      switch (mode) {
        case 'green':  return { background: colors.softGreen, border: `1px solid rgba(34,197,94,0.4)` }
        case 'red':    return { background: colors.softRed,   border: `1px solid rgba(255,99,132,0.4)` }
        case 'orange': return { background: colors.softOrange, border: `1px solid rgba(245,158,11,0.45)` }
        default:       return {}
      }
    }

    const card = (toneMode=null) => ({ ...baseCard, ...(toneMode ? tone(toneMode) : {}) })
    const title = { fontWeight: 400, color: colors.text, margin: "0 0 8px", fontSize: 14, letterSpacing: 0.2 }
    const label = { color: colors.text, fontSize: 12, marginBottom: 6, fontWeight: 400 }
    const btn = { border:`1px solid ${colors.gold}`, background:'transparent', color:colors.text, padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12, transition:'background 160ms ease' }
    const sel = { width:'100%', padding:'9px 12px', fontSize:12, color:colors.text, background:'#0f0f10', border:`1px solid ${colors.border}`, borderRadius:10, outline:'none' }

    /* ===================== Démo / données ===================== */
    const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
    const BROKERS = ["Darwinex", "ICMarkets", "Pepperstone"]
    const STRATS  = ["Strategy 1", "Strategy 2", "Breakout"]

    const demoTrades = useMemo(() => {
      const rows = []
      const today = new Date()
      for (let i = 190; i >= 1; i--) { // ~6+ mois pour activer les alertes horaires
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
          rows.push({
            date,
            asset, broker, strategy,
            pnl, ccy: 'USD',
            open_time: open.toISOString(),
            close_time: close.toISOString()
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

    const [userTrades, setUserTrades] = useState([])
    const tradesAll = useMemo(()=> demoTrades.concat(userTrades), [demoTrades, userTrades])

    const [userCashflows, setUserCashflows] = useState(()=> {
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

    /* ===================== Devises ===================== */
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

    /* ===================== Équité avec flux (1 courbe) + HWM/LWM (avec flux) ===================== */
    const equityWithFlowsSeries = useMemo(()=>{
      let eq = capitalInitialDisp
      let lastCashCum = 0
      const out = []
      for (const d of mergedDates){
        const cashCum = cashCumMap.get(d) || 0
        const deltaCash = cashCum - lastCashCum
        lastCashCum = cashCum
        eq += (pnlMap.get(d) || 0) + deltaCash
        out.push({ date: d, equity_with_flows: Number(eq.toFixed(2)) })
      }
      // HWM/LWM avec flux
      let h = -Infinity, l = Infinity
      for (const p of out){
        h = Math.max(h, p.equity_with_flows)
        l = Math.min(l, p.equity_with_flows)
        p.hwm_wf = Number(h.toFixed(2))
        p.lwm_wf = Number(l.toFixed(2))
      }
      return out
    }, [mergedDates, pnlMap, cashCumMap, capitalInitialDisp])

    // MaxDD sur la courbe avec flux
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

    /* ===================== KPIs ===================== */
    const totalPnlDisp   = useMemo(()=> filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, displayCcy, rates])
    const cashFlowTotal  = useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
    const capitalBase    = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])
    const capitalGlobal  = useMemo(()=> capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

    const wins           = filtered.filter(t => t.pnl > 0).length
    const wr             = filtered.length ? (wins / filtered.length) * 100 : 0
    const avgWin         = (() => {
      const list = filtered.filter(t => t.pnl > 0).map(t => convert(t.pnl, t.ccy, displayCcy))
      return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
    })()
    const avgLoss        = (() => {
      const list = filtered.filter(t => t.pnl < 0).map(t => Math.abs(convert(t.pnl, t.ccy, displayCcy)))
      return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
    })()
    const rr             = avgLoss > 0 ? (avgWin / avgLoss) : 0
    const expectancy     = useMemo(()=> filtered.length ? (totalPnlDisp / filtered.length) : 0, [totalPnlDisp, filtered.length])

    // ret journaliers pour Sharpe/Sortino
    const dailyReturns = useMemo(()=>{
      const out = []
      for (let i=1;i<equityWithFlowsSeries.length;i++){
        const p = equityWithFlowsSeries[i-1].equity_with_flows, c = equityWithFlowsSeries[i].equity_with_flows
        out.push(p===0?0:(c-p)/p)
      }
      return out
    }, [equityWithFlowsSeries])

    const sharpe = useMemo(()=>{
      if (!dailyReturns.length) return 0
      const m = mean(dailyReturns)
      const sd = stddev(dailyReturns)
      const srDaily = sd>0 ? m/sd : 0
      return srDaily * Math.sqrt(252)
    }, [dailyReturns])

    const sortino = useMemo(()=>{
      if (!dailyReturns.length) return 0
      const neg = dailyReturns.filter(r=>r<0)
      const dn = neg.length ? Math.sqrt(mean(neg.map(x=>x*x))) : 0
      const m = mean(dailyReturns)
      return dn>0 ? (m/dn)*Math.sqrt(252) : (m>0? Infinity : 0)
    }, [dailyReturns])

    const globalReturnPct = useMemo(()=>{
      if (!isFinite(capitalBase) || capitalBase<=0) return 0
      return (totalPnlDisp / capitalBase) * 100
    }, [totalPnlDisp, capitalBase])

    /* ===================== MTD / YTD / Weekdays ===================== */
    function inMonth(d, y, m){ const [Y,M] = d.split('-').map(x=>+x); return (Y===y && M===m) }
    const today = new Date()
    const yNow = today.getFullYear(), mNow = today.getMonth()+1
    const mtd = useMemo(()=>{
      const v = filtered.filter(t=>inMonth(t.date, yNow, mNow)).reduce((s,t)=>s+convert(t.pnl,t.ccy,displayCcy),0)
      return v
    }, [filtered, displayCcy, rates])
    const ytd = useMemo(()=>{
      const v = filtered.filter(t=>(+t.date.slice(0,4)===yNow)).reduce((s,t)=>s+convert(t.pnl,t.ccy,displayCcy),0)
      return v
    }, [filtered, displayCcy, rates])
    const weekdays = useMemo(()=>{
      // Lundi..Dimanche (pour crypto on garde weekend)
      const map = new Map()
      for (const t of filtered){
        const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
        const wd = d.getDay() // 0 Dimanche..6 Samedi
        const key = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][wd]
        const v = convert(t.pnl, t.ccy, displayCcy)
        if (!map.has(key)) map.set(key, 0)
        map.set(key, map.get(key)+v)
      }
      const keys = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] // ordre humain
      return keys.map(k=>({ k, v: Number((map.get(k)||0).toFixed(2)) }))
    }, [filtered, displayCcy, rates])

    /* ===================== Gains/Pertes par HEURE / JOUR / MOIS ===================== */
    const gainsLossByHour = useMemo(()=>{
      const arr = Array.from({length:24}, (_,h)=>({ hour: `${String(h).padStart(2,'0')}:00`, gain: 0, loss: 0, n:0 }))
      for (const t of filtered){
        const h = new Date(t.open_time || (t.date+'T00:00:00Z')).getHours()
        if (!isFinite(h)) continue
        const v = convert(t.pnl, t.ccy, displayCcy)
        if (v >= 0) arr[h].gain += v; else arr[h].loss += Math.abs(v)
        arr[h].n++
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

    /* ===================== Alertes horaires (zones à éviter) ===================== */
    const coverageDays = mergedDates.length
    const hourlyAlerts = useMemo(()=>{
      if (coverageDays < 180) return []
      const bad = []
      for (const x of gainsLossByHour){
        if (x.n >= 10) {
          const net = x.gain - x.loss
          if (net < 0) bad.push({ hour: x.hour, trades:x.n, net })
        }
      }
      return bad.sort((a,b)=>a.net - b.net)
    }, [coverageDays, gainsLossByHour])

    /* ===================== Helpers couleurs ===================== */
    const numColor = (v) => (v < 0 ? colors.pink : (v > 0 ? colors.green : colors.text))
    const toneBySign = (v) => (v < 0 ? 'red' : (v > 0 ? 'green' : null))

    const ddTone = (ddPct) => {
      if (ddPct <= 10) return 'green'
      if (ddPct <= 20) return 'orange'
      return 'red'
    }

    const isWRRRProfitable = useMemo(()=>{
      const p = filtered.length ? (wins / filtered.length) : 0
      return (avgWin * p - avgLoss * (1 - p)) > 0
    }, [filtered, wins, avgWin, avgLoss])

    /* ===================== Render ===================== */
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, padding: 20, maxWidth: 1540, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
          <div>
            <h1 style={{ color: colors.text, fontWeight: 400, margin: 0, fontSize: 36 }}>ZooProjectVision</h1>
            <p style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Dashboard de performance trading — multi-actifs, multi-brokers, multi-stratégies</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: 'wrap', alignItems:'center' }}>
            <button style={btn}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
              onClick={()=>window.location.reload()}
            >Actualiser</button>
            <button style={btn}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
              onClick={resetFilters}
            >Réinitialiser Filtres</button>
            <div style={{ color: colors.muted, fontSize:12, border:`1px solid ${colors.gold}`, padding:'6px 10px', borderRadius:10 }}>
              Devise:&nbsp;
              <select value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)} style={{...sel, width:'auto', display:'inline-block'}}>
                {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* FILTRES */}
        <div style={{ ...baseCard, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          <div><div style={label}>Actif</div>
            <select value={asset} onChange={e => setAsset(e.target.value)} style={sel}><option>All</option>{assets.map(a => <option key={a} value={a}>{a}</option>)}</select>
          </div>
          <div><div style={label}>Broker</div>
            <select value={broker} onChange={e => setBroker(e.target.value)} style={sel}><option>All</option>{brokers.map(b => <option key={b} value={b}>{b}</option>)}</select>
          </div>
          <div><div style={label}>Stratégie</div>
            <select value={strategy} onChange={e => setStrategy(e.target.value)} style={sel}><option>All</option>{strategies.map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><div style={label}>Du</div><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={sel} /></div>
          <div><div style={label}>Au</div><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={sel} /></div>
          <div />
        </div>

        {/* KPI PRINCIPAUX */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 12 }}>
          {/* Capital Initial (figé) */}
          <div style={card(null)}>
            <h3 style={title}>Capital Initial</h3>
            <div style={{ fontSize:18 }}>{fmt(capitalInitialDisp)}</div>
          </div>

          {/* Cash Flow (figé par filtres de dates, mais indépendant des stratégies) */}
          <div style={card(toneBySign(cashFlowTotal))}>
            <h3 style={title}>Cash Flow</h3>
            <div style={{ fontSize:18, color: numColor(cashFlowTotal) }}>{fmt(cashFlowTotal)}</div>
          </div>

          {/* PNL (filtré) */}
          <div style={card(toneBySign(totalPnlDisp))}>
            <h3 style={title}>PNL (Filtré)</h3>
            <div style={{ fontSize:18, color: numColor(totalPnlDisp) }}>{fmt(totalPnlDisp)}</div>
          </div>

          {/* Capital Global */}
          <div style={card((capitalGlobal < capitalInitialDisp - Math.max(0, cashFlowTotal)) ? 'red' : toneBySign(capitalGlobal - capitalInitialDisp))}>
            <h3 style={title}>Capital Global</h3>
            <div style={{ fontSize:18 }}>{fmt(capitalGlobal)}</div>
          </div>

          {/* Rentabilité Globale */}
          <div style={card(toneBySign(globalReturnPct))}>
            <h3 style={title}>Rentabilité Globale</h3>
            <div style={{ fontSize:18, color: numColor(globalReturnPct) }}>{globalReturnPct.toFixed(2)}%</div>
          </div>

          {/* Max DD % / Max DD (montant) */}
          <div style={card(ddTone(maxDDPct))}>
            <h3 style={title}>Max DD % / Max DD</h3>
            <div style={{ fontSize:18 }}>
              <span style={{ color: colors.pink }}>{Math.abs(maxDDPct).toFixed(2)}%</span>
              {' / '}
              <span style={{ color: colors.pink }}>{fmt(Math.abs(maxDDAbs))}</span>
            </div>
          </div>
        </div>

        {/* KPI SECONDAIRES (inclut MTD/YTD/Weekdays + Sharpe/Sortino + blocs demandés) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 12 }}>
          {/* MTD */}
          <div style={card(toneBySign(mtd))}>
            <h3 style={title}>MTD</h3>
            <div style={{ fontSize:16, color: numColor(mtd) }}>{fmt(mtd)}</div>
          </div>
          {/* YTD */}
          <div style={card(toneBySign(ytd))}>
            <h3 style={title}>YTD</h3>
            <div style={{ fontSize:16, color: numColor(ytd) }}>{fmt(ytd)}</div>
          </div>
          {/* Weekdays (net total) */}
          <div style={card(toneBySign(weekdays.reduce((s,x)=>s+x.v,0)))}>
            <h3 style={title}>Weekdays</h3>
            <div style={{ fontSize:12 }}>
              {weekdays.map(x=><span key={x.k} style={{ marginRight:10, color:numColor(x.v) }}>{x.k}:{' '}{fmt(x.v)}</span>)}
            </div>
          </div>

          {/* Win Rate / RR */}
          <div style={card(isWRRRProfitable ? 'green' : 'red')}>
            <h3 style={title}>Win Rate / RR</h3>
            <div style={{ fontSize:16, color: isWRRRProfitable ? colors.green : colors.pink }}>
              {wr.toFixed(2)}% {' / '} {rr.toFixed(2)}
            </div>
          </div>

          {/* Expectancy */}
          <div style={card(toneBySign(expectancy))}>
            <h3 style={title}>Expectancy (par Trade)</h3>
            <div style={{ fontSize:16, color: numColor(expectancy) }}>{fmt(expectancy)}</div>
          </div>

          {/* Sharpe / Sortino */}
          <div style={card((sharpe<0 || sortino<0) ? 'red' : 'green')}>
            <h3 style={title}>Sharpe / Sortino</h3>
            <div style={{ fontSize:16, color: (sharpe<0 || sortino<0) ? colors.pink : colors.green }}>
              {isFinite(sharpe)?sharpe.toFixed(2):'∞'} {' / '} {isFinite(sortino)?sortino.toFixed(2):'∞'}
            </div>
          </div>

          {/* Gain Moyen / Perte Moyenne (suit le ton de WR/RR si rouge) */}
          <div style={card(isWRRRProfitable ? toneBySign(avgWin-avgLoss) : 'red')}>
            <h3 style={title}>Gain Moyen / Perte Moyenne</h3>
            <div style={{ fontSize:16 }}>
              <span style={{ color: colors.green }}>{fmt(avgWin)}</span>
              {' / '}
              <span style={{ color: colors.pink }}>{fmt(avgLoss)}</span>
            </div>
          </div>

          {/* Durée Moyenne Gains / Pertes */}
          <div style={card(null)}>
            <h3 style={title}>Durée Moyenne Gains / Pertes</h3>
            <div style={{ fontSize:16, color: colors.text }}>
              {avgWinDurMin.toFixed(0)} min {' / '} {avgLossDurMin.toFixed(0)} min
            </div>
          </div>
        </div>

        {/* Courbe d’Équité — 1 courbe (avec flux) + HWM/LWM (avec flux) + points de flux */}
        <div style={{ ...baseCard, height: 420, marginTop: 16 }}>
          <h3 style={title}>Courbe D’Équité (Avec Flux)</h3>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={equityWithFlowsSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <Tooltip content={<EquityTooltip colors={colors} fmt={fmt} cashflows={cashflowsInRange} />} />
              {/* ligne principale en blanc, fine */}
              <Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#ffffff" strokeWidth={2} isAnimationActive={false} />
              {/* Plus haut (HWM) & plus bas (LWM) avec flux */}
              <Line type="monotone" dataKey="hwm_wf" name="Plus Haut (HWM)" dot={false} stroke={colors.green} strokeWidth={1.2} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="lwm_wf" name="Plus Bas (LWM)" dot={false} stroke={colors.pink}  strokeWidth={1.2} strokeDasharray="4 3" />
              {/* Points de flux */}
              {cashflowsInRange
                .filter(c=>['deposit','withdrawal','prop_fee','prop_payout','darwin_mgmt_fee'].includes(c.type))
                .map((c,i)=>{
                  const pt = equityWithFlowsSeries.find(p=>p.date===c.date)
                  if(!pt) return null
                  const color = c.amount >= 0 ? colors.green : colors.pink
                  return <ReferenceDot key={'cf'+i} x={c.date} y={pt.equity_with_flows} r={4} fill={color} stroke="none" />
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Histogrammes — Heure / Jour / Mois */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16 }}>
          <BarCard title="Gains / Pertes Par Heure D’Ouverture" data={gainsLossByHour} xKey="hour" colors={colors} fmt={fmt} />
          <BarCard title="Gains / Pertes Par Jour D’Ouverture"  data={gainsLossByDay}  xKey="day"  colors={colors} fmt={fmt} />
          <BarCard title="Gains / Pertes Par Mois D’Ouverture"  data={gainsLossByMonth} xKey="month" colors={colors} fmt={fmt} />
        </div>

        {/* Alertes horaires (si ≥180 jours, min 10 trades/heure, net négatif) */}
        {hourlyAlerts.length>0 && (
          <div style={{ ...baseCard, marginTop:16 }}>
            <h3 style={title}>Alertes Horaires — Zones À Éviter</h3>
            <div style={{ fontSize:12, color: colors.muted, marginBottom:8 }}>
              Affichées car historique ≥ 180 jours et ≥ 10 trades par heure.
            </div>
            <ul style={{ margin:0, paddingLeft:18 }}>
              {hourlyAlerts.map((a,i)=>(
                <li key={i} style={{ color: colors.pink }}>
                  {a.hour} — {a.trades} trades — Net {fmt(a.net)}
                </li>
              ))}
            </ul>
          </div>
        )}

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

/* ===================== Tooltip courbe d’équité ===================== */
function EquityTooltip({ active, payload, label, colors, fmt, cashflows }) {
  if (!active || !payload || !payload.length) return null
  const equity = payload.find(x=>x.dataKey==='equity_with_flows')?.value ?? payload[0].value
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
      maxWidth: 320
    }}>
      <div style={{ color: colors.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ marginBottom: 6 }}>Équité: <b style={{ color: '#fff' }}>{fmt(equity)}</b></div>
      {flows.length>0 && (
        <div>
          {flows.map((c,i)=>(
            <div key={i} style={{ color: c.amount>=0?colors.green:colors.pink }}>
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

/* ===================== Carte histogramme réutilisable (vert/pink gloss) ===================== */
function BarCard({ title, data, xKey, colors, fmt }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, height: 320 }}>
      <h3 style={{ fontWeight:400, color: colors.text, margin:"0 0 8px", fontSize:14 }}>{title}</h3>
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
            <linearGradient id="greenGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.green} />
              <stop offset="100%" stopColor={colors.green2} />
            </linearGradient>
            <linearGradient id="pinkGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.pink} />
              <stop offset="100%" stopColor={colors.pink2} />
            </linearGradient>
          </defs>
          <Bar dataKey="gain" name="Gains" fill="url(#greenGloss)" />
          <Bar dataKey="loss" name="Pertes" fill="url(#pinkGloss)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ===================== helpers ===================== */
function mean(a){ if(!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
function stddev(a){
  if(!a.length) return 0
  const m = mean(a)
  const v = mean(a.map(x => (x-m)*(x-m)))
  return Math.sqrt(v)
}
function fix2(x){ return Number((x||0).toFixed(2)) }
