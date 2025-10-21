import React, { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

export default function App() {
  try {
    /* ---------- Thème ---------- */
    const colors = {
      bg: "#0a0a0b",
      text: "#e8ecef",
      muted: "#b6bcc1",
      panel: "#141414",
      border: "#242424",
      turq: "#20e3d6",
      turq2: "#18b8ad",
      pink: "#ff5fa2",
      pink2: "#ff7cbf",
      gold: "#c9a44b",
      axis: "#6e6e6e"
    }
    const card = { background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 12 }

    /* ---------- Démo data (open_time + close_time + MFE/MAE) ---------- */
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
          const durMin = 15 + Math.floor(Math.random()* (60*8))    // 15 min à 8 h
          const close = new Date(open.getTime() + durMin*60*1000)
          // MFE/MAE démo : proportion du |pnl| avec bruit
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
      { date:'2025-01-05', type:'deposit',          amount: 2000, ccy:'USD', note:'apport' },
      { date:'2025-02-10', type:'prop_fee',         amount: -500, ccy:'USD', note:'prop challenge' },
      { date:'2025-03-15', type:'prop_payout',      amount: 1000, ccy:'USD', note:'payout prop' },
      { date:'2025-04-02', type:'darwin_mgmt_fee',  amount: 250,  ccy:'USD', note:'Darwinex mgmt fee' },
      { date:'2025-05-20', type:'withdrawal',       amount: -800, ccy:'USD', note:'retrait' },
    ]

    /* ---------- État utilisateur ---------- */
    const [userTrades, setUserTrades] = useState([])
    const tradesAll = useMemo(()=> demoTrades.concat(userTrades), [demoTrades, userTrades])

    const [userCashflows, setUserCashflows] = useState(()=>{
      const raw = localStorage.getItem('zp_cashflows_custom')
      return raw ? JSON.parse(raw) : []
    })
    useEffect(()=>{ localStorage.setItem('zp_cashflows_custom', JSON.stringify(userCashflows)) }, [userCashflows])
    const allCashflows = useMemo(()=> demoCashflows.concat(userCashflows), [userCashflows])

    /* ---------- Filtres ---------- */
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

    /* ---------- Devises (USD/EUR/CHF) ---------- */
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

    /* ---------- Cashflows ---------- */
    const cashflowsInRange = useMemo(()=>{
      const list = allCashflows.filter(c=>{
        if (dateFrom && c.date < dateFrom) return false
        if (dateTo && c.date > dateTo) return false
        return true
      })
      return list.map(c => ({ ...c, amount_disp: convert(c.amount, c.ccy, displayCcy) }))
    }, [allCashflows, dateFrom, dateTo, displayCcy, rates])

    const cashFlowTotal = useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
    const capitalInitialDisp = useMemo(()=> convert(CAPITAL_INITIAL_USD, 'USD', displayCcy), [displayCcy, rates])
    const capitalBase = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])

    /* ---------- KPI principaux ---------- */
    const totalPnlDisp = useMemo(()=> filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, displayCcy, rates])
    const capitalGlobal = useMemo(()=> capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

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

    /* ---------- Séries équité & indicateurs ---------- */
    function groupByDateSumPnlDisp(rows) {
      const m = new Map()
      for (const r of rows) {
        const v = convert(r.pnl, r.ccy, displayCcy)
        m.set(r.date, (m.get(r.date) || 0) + v)
      }
      return Array.from(m, ([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date))
    }
    const pnlByDate = useMemo(() => groupByDateSumPnlDisp(filtered), [filtered, displayCcy, rates])

    const equitySeries = useMemo(() => {
      let eq = capitalBase
      return pnlByDate.map(pt => {
        eq += pt.pnl
        return { date: pt.date, equity: Number(eq.toFixed(2)) }
      })
    }, [pnlByDate, capitalBase])

    // HWM/LWM le long du temps
    const equitySeriesHL = useMemo(() => {
      let h = -Infinity, l = Infinity;
      return equitySeries.map(p => {
        h = Math.max(h, p.equity);
        l = Math.min(l, p.equity);
        return { ...p, hwm: Number(h.toFixed(2)), lwm: Number(l.toFixed(2)) };
      });
    }, [equitySeries]);

    // daily returns & stats
    const dailyReturns = useMemo(()=>{
      const out = []
      for (let i=1;i<equitySeries.length;i++){
        const p = equitySeries[i-1].equity, c = equitySeries[i].equity
        out.push({ date: equitySeries[i].date, ret: p===0?0:(c-p)/p })
      }
      return out
    }, [equitySeries])
    const vol = useMemo(()=> stddev(dailyReturns.map(r=>r.ret)), [dailyReturns])

    const { peakEquity, troughEquity, maxDDAbs } = useMemo(()=>{
      if (!equitySeries.length) return { peakEquity:0, troughEquity:0, maxDDAbs:0 }
      let peakSeen = equitySeries[0].equity
      let maxDrop = 0
      for (const p of equitySeries) {
        if (p.equity > peakSeen) peakSeen = p.equity
        const drop = peakSeen - p.equity
        if (drop > maxDrop) maxDrop = drop
      }
      const pe = Math.max(...equitySeries.map(e=>e.equity))
      const tr = Math.min(...equitySeries.map(e=>e.equity))
      return { peakEquity: pe, troughEquity: tr, maxDDAbs: maxDrop }
    }, [equitySeries])

    const recoveryFactor = useMemo(()=>{
      const profitNet = (equitySeries.at(-1)?.equity || capitalBase) - capitalBase
      return maxDDAbs > 0 ? profitNet / maxDDAbs : 0
    }, [equitySeries, capitalBase, maxDDAbs])

    const sharpe = useMemo(()=>{
      const rets = dailyReturns.map(r=>r.ret)
      const mu = mean(rets), sd = stddev(rets)
      return sd>0 ? (mu/sd)*Math.sqrt(252) : 0
    }, [dailyReturns])
    const sortino = useMemo(()=>{
      const rets = dailyReturns.map(r=>r.ret)
      const mu = mean(rets), neg = rets.filter(r=>r<0), sdDown = stddev(neg)
      return sdDown>0 ? (mu/sdDown)*Math.sqrt(252) : 0
    }, [dailyReturns])

    const avgTradeDurationMin = useMemo(()=>{
      const mins = filtered.map(t=>{
        const o = t.open_time ? new Date(t.open_time).getTime() : NaN
        const c = t.close_time ? new Date(t.close_time).getTime() : NaN
        if (!isFinite(o) || !isFinite(c)) return null
        return (c - o) / 60000
      }).filter(v=>v!=null)
      return mins.length ? mean(mins) : 0
    }, [filtered])
    const activeDays = useMemo(()=> new Set(filtered.map(t=>t.date)).size, [filtered])

    const avgStrategyCorr = useMemo(()=>{
      const byDayByStrat = new Map()
      for(const t of filtered){
        const d = t.date
        if (!byDayByStrat.has(d)) byDayByStrat.set(d, new Map())
        const m = byDayByStrat.get(d)
        m.set(t.strategy, (m.get(t.strategy)||0) + convert(t.pnl, t.ccy, displayCcy))
      }
      const stratSet = new Set()
      for(const m of byDayByStrat.values()) for(const k of m.keys()) stratSet.add(k)
      const strats = Array.from(stratSet)
      if (strats.length < 2) return 0
      const series = {}; for(const s of strats) series[s] = []
      const dates = Array.from(byDayByStrat.keys()).sort()
      for(const d of dates){
        const m = byDayByStrat.get(d)
        for(const s of strats) series[s].push(m.get(s) ?? 0)
      }
      const pairCorr = []
      for(let i=0;i<strats.length;i++){
        for(let j=i+1;j<strats.length;j++){
          pairCorr.push(pearson(series[strats[i]], series[strats[j]]))
        }
      }
      return mean(pairCorr.filter(x=>isFinite(x)))
    }, [filtered, displayCcy, rates])

    /* ---------- MFE/MAE — séries quotidiennes & cumul ---------- */
    const mfeMaeDaily = useMemo(()=>{
      // groupe par date: moyenne MFE & MAE (converties)
      const map = new Map()
      for(const t of filtered){
        const d = t.date
        const mfe = convert(t.mfe ?? 0, t.ccy || 'USD', displayCcy)
        const mae = convert(t.mae ?? 0, t.ccy || 'USD', displayCcy)
        if(!map.has(d)) map.set(d, { date:d, sMFE:0, sMAE:0, n:0 })
        const x = map.get(d); x.sMFE += Math.max(0, mfe); x.sMAE += Math.max(0, mae); x.n++
      }
      const arr = Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date))
      let cumM=0, cumA=0
      return arr.map(r=>{
        const avgMFE = r.n? r.sMFE/r.n : 0
        const avgMAE = r.n? r.sMAE/r.n : 0
        cumM += r.sMFE; cumA += r.sMAE
        return { date:r.date, avgMFE:Number(avgMFE.toFixed(2)), avgMAE:Number(avgMAE.toFixed(2)), cumMFE:Number(cumM.toFixed(2)), cumMAE:Number(cumA.toFixed(2)) }
      })
    }, [filtered, displayCcy, rates])

    /* ---------- Histogramme & Pie ---------- */
    function groupByNameSumDisp(rows, key) {
      const m = new Map()
      for (const r of rows) m.set(r[key], (m.get(r[key]) || 0) + convert(r.pnl, r.ccy, displayCcy))
      return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    }
    const pnlByAsset = useMemo(() => groupByNameSumDisp(filtered, "asset"), [filtered, displayCcy, rates])

    const pieData = useMemo(() => {
      const sums = new Map()
      for (const r of filtered) {
        const abs = Math.abs(convert(r.pnl, r.ccy, displayCcy))
        sums.set(r.asset, (sums.get(r.asset) || 0) + abs)
      }
      const tot = Array.from(sums.values()).reduce((a,b)=>a+b,0) || 1
      return Array.from(sums, ([name, val]) => ({ name, value: val, pct: (val/tot)*100 }))
        .sort((a,b)=>b.value-a.value)
    }, [filtered, displayCcy, rates])

    /* ---------- Export CSV ---------- */
    const exportCSV = () => {
      const header = ['date','asset','broker','strategy',`pnl_${displayCcy}`,`mfe_${displayCcy}`,`mae_${displayCcy}`]
      const rows = filtered.map(t => [
        t.date, t.asset, t.broker, t.strategy,
        convert(t.pnl, t.ccy, displayCcy).toFixed(2),
        convert(t.mfe??0, t.ccy, displayCcy).toFixed(2),
        convert(t.mae??0, t.ccy, displayCcy).toFixed(2),
      ])
      const csv = [header, ...rows].map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `trades_filtrés_${displayCcy}.csv`; a.click()
      URL.revokeObjectURL(url)
    }

    /* ---------- Import CSV (MT5/MT4) ---------- */
    function parseCSV(text){
      const lines = text.trim().split(/\r?\n/); if(!lines.length) return []
      const headers = lines.shift().split(',').map(h=>h.trim().replace(/^"|"$/g,''))
      const rows = []
      for(const line of lines){
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
        const obj = {}
        headers.forEach((h, i) => obj[h] = (cols[i]||'').replace(/^"|"$/g,''))
        rows.push(obj)
      }
      return rows
    }
    function mapMT5Rows(rows){
      // tente plusieurs noms de colonnes possibles pour MFE/MAE
      return rows.map((r)=>{
        const date = (r['Time'] || r['Open time'] || r['Open Time'] || r['Date'] || '').slice(0,10)
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
          pnl: Number((pnl||0).toFixed(2)), ccy:'USD',
          open_time: openTime, close_time: closeTime,
          mfe: Number((Math.abs(mfeRaw)||0).toFixed(2)),
          mae: Number((Math.abs(maeRaw)||0).toFixed(2)),
        }
      }).filter(r=>r.date)
    }

    /* ---------- Formulaire flux ---------- */
    const [showForm, setShowForm] = useState(false)
    const [flow, setFlow] = useState({
      date: new Date().toISOString().slice(0,10),
      type: 'darwin_mgmt_fee',
      amount: '',
      ccy: displayCcy,
      note: ''
    })
    useEffect(()=>{ setFlow(f=>({...f, ccy: displayCcy})) }, [displayCcy])
    const flowTypes = [
      { value:'darwin_mgmt_fee',  label:'Darwinex – management fee' },
      { value:'prop_payout',      label:'Prop firm – payout' },
      { value:'prop_fee',         label:'Prop firm – fee challenge' },
      { value:'deposit',          label:'Dépôt' },
      { value:'withdrawal',       label:'Retrait' },
      { value:'business_expense', label:'Charge business' },
      { value:'other_income',     label:'Autre revenu' }
    ]
    const submitFlow = (e)=>{
      e.preventDefault()
      const amt = Number(flow.amount)
      if (!flow.date || !flow.type || isNaN(amt)) { alert('Merci de compléter Date / Type / Montant'); return }
      const row = { date: flow.date, type: flow.type, amount: amt, ccy: flow.ccy || displayCcy, note: flow.note || '' }
      setUserCashflows(prev => prev.concat([row]))
      setShowForm(false)
      setFlow({ date: new Date().toISOString().slice(0,10), type:'darwin_mgmt_fee', amount:'', ccy: displayCcy, note:'' })
    }

    /* ---------- Alertes (comme avant) ---------- */
    const [showAlerts, setShowAlerts] = useState(false)
    const TOTAL_REF = Math.max(1, capitalGlobal)
    const onePctThreshold = TOTAL_REF * 0.01
    const recentCutoff = useMemo(()=>{ const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10) },[])
    const recentTrades = useMemo(()=> filtered.filter(t=>t.date>=recentCutoff), [filtered, recentCutoff])
    const alertsTrades = useMemo(()=>{
      return filtered
        .filter(t => Math.abs(convert(t.pnl, t.ccy, displayCcy)) > onePctThreshold)
        .map(t => ({ date:t.date, asset:t.asset, pnl: convert(t.pnl, t.ccy, displayCcy)}))
    }, [filtered, onePctThreshold, displayCcy, rates])
    const alertsHours = useMemo(()=>{
      const byHour = new Map()
      for(const t of recentTrades){
        const h = new Date(t.open_time || (t.date+'T00:00:00Z')).getHours()
        if(!byHour.has(h)) byHour.set(h, {n:0, losses:0})
        const x = byHour.get(h); x.n++; if(t.pnl<0) x.losses++
      }
      const out=[]
      for(const [h,{n,losses}] of byHour){
        if(n>=10){
          const rate = losses/n
          if(rate>=0.80) out.push({ hour: `${String(h).padStart(2,'0')}:00`, n, lossRate: rate })
        }
      }
      return out.sort((a,b)=>b.lossRate - a.lossRate)
    }, [recentTrades])
    const alertsCount = (alertsTrades?.length||0) + (alertsHours?.length||0)

    /* ---------- Calendrier ---------- */
    const lastDate = equitySeries.at(-1)?.date || new Date().toISOString().slice(0,10)
    const [calYear, setCalYear] = useState(Number(lastDate.slice(0,4)))
    const [calMonth, setCalMonth] = useState(Number(lastDate.slice(5,7))-1)
    function monthDays(year, monthIndex){
      const end = new Date(year, monthIndex+1, 0).getDate()
      const arr=[]
      for (let d=1; d<=end; d++) arr.push(new Date(year, monthIndex, d).toISOString().slice(0,10))
      return arr
    }
    const calDates = useMemo(()=> monthDays(calYear, calMonth), [calYear, calMonth])
    const dailyRetMap = useMemo(()=>{ const m=new Map(); dailyReturns.forEach(r=>m.set(r.date,r.ret)); return m }, [dailyReturns])
    const monthDDMap = useMemo(()=>{
      const ym = `${calYear}-${String(calMonth+1).padStart(2,'0')}`
      const pts = equitySeries.filter(p=>p.date.startsWith(ym))
      let peak=-Infinity; const m=new Map()
      for(const p of pts){ peak=Math.max(peak, p.equity); m.set(p.date, (p.equity-peak)/peak) }
      return m
    }, [equitySeries, calYear, calMonth])
    const monthLabel = useMemo(()=>{
      const dt = new Date(calYear, calMonth, 1)
      return dt.toLocaleDateString(undefined,{month:'long', year:'numeric'})
    }, [calYear, calMonth])

    /* ---------- Render ---------- */
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", padding: 20, maxWidth: 1540, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
          <div>
            <h1 style={{ color: colors.turq, fontWeight: 400, margin: 0, fontSize: 26 }}>ZooProject</h1>
            <p style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Dashboard de performance trading — multi-actifs, multi-brokers, multi-stratégies</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: 'wrap', alignItems:'center' }}>
            <label style={btn(colors, true)}>
              importer trades csv
              <input type="file" accept=".csv" style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}
                onChange={e=>{
                  const f=e.target.files?.[0]; if(!f) return;
                  const fr=new FileReader();
                  fr.onload=()=>{
                    const rows=parseCSV(String(fr.result));
                    const mapped=mapMT5Rows(rows);
                    if(!mapped.length){ alert('CSV non reconnu. Vérifie Time/Symbol/Profit (+ MFE/MAE si dispo).'); return }
                    setUserTrades(prev=>prev.concat(mapped));
                  };
                  fr.readAsText(f);
                }}/>
            </label>
            <button
              style={btn(colors)}
              onClick={() => window.location.reload()}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >actualiser</button>
            <button
              style={btn(colors)}
              onClick={resetFilters}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >réinitialiser filtres</button>
            <button
              style={btn(colors)}
              onClick={()=>setShowForm(true)}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >ajouter flux</button>
            <button
              style={btn(colors)}
              onClick={exportCSV}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >export csv</button>

            <button onClick={()=>setShowAlerts(s=>!s)} style={{ position:'relative', border:`1px solid ${colors.border}`, background:colors.panel, color:colors.text, padding:'6px 10px', borderRadius:10 }}>
              🔔{ (alertsCount>0) && (<span style={{ position:'absolute', top:-6, right:-6, background:colors.pink, color:'#111', fontSize:10, padding:'2px 6px', borderRadius:999 }}>{alertsCount}</span>) }
            </button>
          </div>
        </div>

        {/* FILTRES (compteurs supprimés) */}
        <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
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

        {/* KPI Principaux */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
          <div style={card}><h3 style={kpiTitle(colors)}>Capital initial</h3><div style={{ fontSize: 18 }}>{fmt(capitalInitialDisp)}</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Cash flow</h3><div style={{ fontSize: 18, color: cashFlowTotal >= 0 ? colors.turq : colors.pink }}>{fmt(cashFlowTotal)}</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>PNL (filtré)</h3><div style={{ fontSize: 18, color: totalPnlDisp >= 0 ? colors.turq : colors.pink }}>{fmt(totalPnlDisp)}</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Capital global</h3><div style={{ fontSize: 18 }}>{fmt(capitalGlobal)}</div></div>
        </div>

        {/* KPI Secondaires */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
          <div style={card}><h3 style={kpiTitle(colors)}>Win Rate / RR</h3><div style={{ fontSize: 16 }}>{wr.toFixed(2)}% / {rr.toFixed(2)}</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Risque ruine</h3><div style={{ fontSize: 16, color: colors.pink }}>{(riskOfRuin(wr, rr)*100).toFixed(2)}%</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Trades</h3><div style={{ fontSize: 16 }}>{filtered.length}</div></div>
        </div>

        {/* KPI Avancés */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
          <div style={card}><h3 style={kpiTitle(colors)}>Expectancy (par trade)</h3><div style={{ fontSize: 16, color: expectancy>=0?colors.turq:colors.pink }}>{fmt(expectancy)}</div><div style={{ fontSize: 12, color: colors.muted }}>Moyenne PnL/trade</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Recovery factor</h3><div style={{ fontSize: 16 }}>{recoveryFactor.toFixed(2)}</div><div style={{ fontSize: 12, color: colors.muted }}>Profit net / |Max DD|</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Sharpe / Sortino</h3><div style={{ fontSize: 16 }}>{sharpe.toFixed(2)} / {sortino.toFixed(2)}</div><div style={{ fontSize: 12, color: colors.muted }}>Rdt journaliers (annualisés)</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Volatilité résultats</h3><div style={{ fontSize: 16 }}>{(vol*100).toFixed(2)}%</div><div style={{ fontSize: 12, color: colors.muted }}>Écart-type des ret. journaliers</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Equity peak / trough</h3><div style={{ fontSize: 16 }}>{fmt(peakEquity)} / {fmt(troughEquity)}</div><div style={{ fontSize: 12, color: colors.muted }}>Plus haut / plus bas</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Durée moyenne</h3><div style={{ fontSize: 16 }}>{avgTradeDurationMin.toFixed(0)} min</div><div style={{ fontSize: 12, color: colors.muted }}>Ouverture → clôture</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Jours actifs</h3><div style={{ fontSize: 16 }}>{activeDays}</div><div style={{ fontSize: 12, color: colors.muted }}>≥1 trade/jour</div></div>
          <div style={card}><h3 style={kpiTitle(colors)}>Corrélation stratégies</h3><div style={{ fontSize: 16 }}>{(avgStrategyCorr||0).toFixed(2)}</div><div style={{ fontSize: 12, color: colors.muted }}>Moyenne paires</div></div>
        </div>

        {/* Courbe d'équité + HWM/LWM */}
        <div style={{ ...card, height: 420, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Courbe d’équité (avec HWM/LWM)</h3>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={equitySeriesHL} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} tickFormatter={(v)=>v.toFixed(0)} />
              <Tooltip contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }} itemStyle={{ color: colors.text }} labelStyle={{ color: colors.text }} />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />
              <Line type="monotone" dataKey="equity" name="Équité" dot={false} stroke="#ffffff" strokeWidth={2.8} isAnimationActive={false} />
              <Line type="monotone" dataKey="hwm" name="Plus haut (HWM)" dot={false} stroke={colors.turq} strokeWidth={1.8} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="lwm" name="Plus bas (LWM)" dot={false} stroke={colors.pink} strokeWidth={1.4} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MFE/MAE — quotidien (moyenne) */}
        <div style={{ ...card, height: 360, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>MFE (potentiel) vs MAE (risque) — quotidien</h3>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} tickFormatter={(v)=>v.toFixed(0)} />
              <Tooltip contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }}
                       itemStyle={{ color: colors.text }} labelStyle={{ color: colors.text }}
                       formatter={(v, n)=>[fmt(v), n === 'avgMFE' ? 'MFE moyen' : 'MAE moyen (visu +)']} />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />
              <Line type="monotone" dataKey="avgMFE" name="MFE moyen" dot={false} stroke={colors.turq} strokeWidth={2} />
              {/* MAE affiché en valeur positive mais à interpréter "risque" */}
              <Line type="monotone" dataKey="avgMAE" name="MAE moyen" dot={false} stroke={colors.pink} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MFE/MAE — cumul */}
        <div style={{ ...card, height: 360, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Cumul MFE vs MAE</h3>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} tickFormatter={(v)=>v.toFixed(0)} />
              <Tooltip contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }}
                       itemStyle={{ color: colors.text }} labelStyle={{ color: colors.text }}
                       formatter={(v, n)=>[fmt(v), n === 'cumMFE' ? 'Cumul MFE' : 'Cumul MAE']} />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />
              <Line type="monotone" dataKey="cumMFE" name="Cumul MFE" dot={false} stroke={colors.turq} strokeWidth={2.2} />
              <Line type="monotone" dataKey="cumMAE" name="Cumul MAE" dot={false} stroke={colors.pink} strokeWidth={2.2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Histogramme par actif */}
        <div style={{ ...card, height: 360, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Gain / Perte par actif</h3>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={pnlByAsset} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="name" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis }} tick={{ fontSize: 10 }}
                     tickFormatter={v=>fmt(v)} />
              <Tooltip contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }}
                       itemStyle={{ color: colors.text }} labelStyle={{ color: colors.text }}
                       formatter={(v)=>[fmt(v), 'PnL']} />
              <defs>
                <linearGradient id="turqGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.turq} /><stop offset="100%" stopColor={colors.turq2} /></linearGradient>
                <linearGradient id="pinkGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.pink} /><stop offset="100%" stopColor={colors.pink2} /></linearGradient>
              </defs>
              <Bar dataKey="value" name="PnL">
                {pnlByAsset.map((row, i) => (
                  <Cell key={i} fill={row.value >= 0 ? "url(#turqGloss)" : "url(#pinkGloss)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition PnL */}
        <div style={{ ...card, height: 360, marginTop: 16 }}>
          <h3 style={kpiTitle(colors)}>Répartition PnL</h3>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} stroke="none"
                   label={({ name, pct }) => `${name} ${(pct).toFixed(2)}%`}>
                {pieData.map((seg, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? "url(#pieTurq)" : "url(#piePink)"} stroke="none" />
                ))}
              </Pie>
              <defs>
                <linearGradient id="pieTurq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.turq}/><stop offset="100%" stopColor={colors.turq2}/></linearGradient>
                <linearGradient id="piePink" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.pink}/><stop offset="100%" stopColor={colors.pink2}/></linearGradient>
              </defs>
              <Tooltip contentStyle={{ background: colors.panel, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10 }}
                       itemStyle={{ color: colors.text }} labelStyle={{ color: colors.text }}
                       formatter={(v, n, ctx) => [`${fmt(ctx.payload.value)} (${ctx.payload.pct.toFixed(2)}%)`, ctx.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Calendrier */}
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <h3 style={kpiTitle(colors)}>Calendrier — {monthLabel}</h3>
            <div style={{ display:'flex', gap:8 }}>
              <button
                style={btn(colors)}
                onClick={()=>{ let m=calMonth-1, y=calYear; if(m<0){m=11;y--} setCalMonth(m); setCalYear(y) }}
                onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
                onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
              >◀</button>
              <button
                style={btn(colors)}
                onClick={()=>{ let m=calMonth+1, y=calYear; if(m>11){m=0;y++} setCalMonth(m); setCalYear(y) }}
                onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
                onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
              >▶</button>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=><div key={d} style={{textAlign:'center', color:colors.muted, fontSize:12}}>{d}</div>)}
            {calendarCells(calDates, dailyRetMap, monthDDMap, colors)}
          </div>
        </div>

        {/* Centre Alertes */}
        {showAlerts && (
          <div style={{ ...card, marginTop: 16 }}>
            <h3 style={kpiTitle(colors)}>Centre d’alertes</h3>
            {(!alertsCount) && <div style={{fontSize:12, color:colors.muted}}>Aucune alerte active.</div>}
            {(alertsTrades.length>0) && (
              <>
                <div style={{marginTop:6, fontSize:12, color:colors.muted}}>Trades &gt; 1% du capital</div>
                {alertsTrades.map((a,i)=>(
                  <div key={'t'+i} style={rowKV(colors)}>
                    <span>{a.date} · {a.asset}</span><span style={{color:colors.pink}}>{fmt(a.pnl)}</span>
                  </div>
                ))}
              </>
            )}
            {(alertsHours.length>0) && (
              <>
                <div style={{marginTop:6, fontSize:12, color:colors.muted}}>Créneaux horaires faibles (30j)</div>
                {alertsHours.map((a,i)=>(
                  <div key={'h'+i} style={rowKV(colors)}>
                    <span>{a.hour}</span><span style={{color:colors.pink}}>{(a.lossRate*100).toFixed(0)}% pertes · {a.n} trades</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 20 }}>
          ZooProject © {new Date().getFullYear()}
        </div>

        {/* MODAL — Ajouter flux */}
        {showForm && (
          <div style={modalOverlay()} onClick={()=>setShowForm(false)}>
            <div style={modalCard(colors)} onClick={(e)=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:14, color: colors.text }}>Ajouter un flux</div>
                <button style={btnGhost(colors)} onClick={()=>setShowForm(false)}>fermer</button>
              </div>
              <form onSubmit={submitFlow} style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(2,1fr)' }}>
                <label style={formLabel()}><span>Type</span>
                  <select value={flow.type} onChange={e=>setFlow(f=>({...f, type:e.target.value}))} style={sel(colors)}>
                    {flowTypes.map(t=> <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label style={formLabel()}><span>Date</span>
                  <input type="date" value={flow.date} onChange={e=>setFlow(f=>({...f, date:e.target.value}))} style={sel(colors)} />
                </label>
                <label style={formLabel()}><span>Devise</span>
                  <select value={flow.ccy} onChange={e=>setFlow(f=>({...f, ccy:e.target.value}))} style={sel(colors)}>
                    {['USD','EUR','CHF'].map(c=> <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label style={formLabel()}><span>Montant</span>
                  <input type="number" step="0.01" placeholder="ex: 250.00" value={flow.amount}
                         onChange={e=>setFlow(f=>({...f, amount:e.target.value}))} style={sel(colors)} />
                </label>
                <label style={{ ...formLabel(), gridColumn:'1 / -1' }}><span>Note</span>
                  <input type="text" placeholder="optionnel" value={flow.note}
                         onChange={e=>setFlow(f=>({...f, note:e.target.value}))} style={sel(colors)} />
                </label>
                <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8 }}>
                  <button type="button" style={btnGhost(colors)} onClick={()=>setShowForm(false)}>annuler</button>
                  <button type="submit" style={btn(colors)}>enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  } catch (e) {
    console.error(e)
    return <div style={{ color: '#ff5fa2', padding: 16 }}>Erreur dans App.jsx : {String(e.message || e)}</div>
  }
}

/* ---------- helpers math ---------- */
function mean(a){ if(!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
function stddev(a){
  if(!a.length) return 0
  const m = mean(a)
  const v = mean(a.map(x => (x-m)*(x-m)))
  return Math.sqrt(v)
}
function pearson(a,b){
  const n = Math.min(a.length, b.length)
  if(n===0) return 0
  const ax = a.slice(0,n), bx = b.slice(0,n)
  const ma = mean(ax), mb = mean(bx)
  let num=0, da=0, db=0
  for(let i=0;i<n;i++){
    const x=ax[i]-ma, y=bx[i]-mb
    num += x*y; da += x*x; db += y*y
  }
  const den = Math.sqrt(da*db)
  return den>0 ? num/den : 0
}
function riskOfRuin(wrPct, rr){
  const wr = wrPct/100
  const expectancy = wr*rr - (1-wr)
  const x = expectancy / (rr + 1 || 1)
  const base = (1 - x) / (1 + x)
  if (!isFinite(base) || base <= 0) return 0
  const riskPerTrade = 0.01
  const r = Math.pow(base, 1 / Math.max(1e-6, riskPerTrade))
  return Math.max(0, Math.min(1, r))
}

/* ---------- helpers UI ---------- */
function btn(colors, isLabel){
  return {
    position: isLabel?'relative':'static',
    border:`1px solid ${colors.gold}`, background:'transparent', color:colors.text,
    padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12, transition:'background 160ms ease'
  }
}
function btnGhost(colors){ return { border:`1px solid ${colors.border}`, background:'transparent', color:colors.text, padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12 } }
function label(colors){ return { color: colors.text, fontSize: 12, marginBottom: 4, fontWeight: 400 } }
function sel(colors){ return { width:'100%', padding:'8px 10px', fontSize:12, color:colors.text, background:'#0f0f10', border:`1px solid ${colors.border}`, borderRadius:10, outline:'none' } }
function kpiTitle(colors){ return { fontWeight: 400, color: colors.text, margin: "0 0 8px", fontSize: 13, letterSpacing: 0.2 } }
function modalOverlay(){ return { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 } }
function modalCard(colors){ return { width:'min(720px, 100%)', background:colors.panel, border:`1px solid ${colors.border}`, borderRadius:16, padding:12 } }
function formLabel(){ return { display:'flex', flexDirection:'column', gap:6, fontSize:12 } }
function rowKV(colors){ return { display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${colors.border}`, borderRadius:10, padding:'8px 10px', margin:'6px 0', fontSize:12 } }

/* ---------- calendrier cellules ---------- */
function calendarCells(dates, retMap, ddMap, colors){
  return dates.map(dt=>{
    const ret = retMap.get(dt); const dd = ddMap.get(dt);
    const bg = ret==null ? '#0f0f10' : (ret>=0 ? 'rgba(32,227,214,0.15)' : 'rgba(255,95,162,0.15)');
    return (
      <div key={dt} style={{padding:'10px 8px', border:'1px solid #2a2a2a', borderRadius:8, background:bg}}>
        <div style={{fontSize:11, opacity:.9}}>{Number(dt.slice(8,10))}</div>
        <div style={{fontSize:12, color: ret>=0 ? '#20e3d6' : '#ff5fa2'}}>
          {ret!=null ? `${(ret*100).toFixed(2)}%` : '—'}
        </div>
        <div style={{fontSize:11, color:'#bfc5c9'}}>
          {dd!=null ? `${Math.abs(dd*100).toFixed(2)}%` : '—'}
        </div>
      </div>
    )
  })
}
