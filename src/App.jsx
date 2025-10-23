import React, { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, ReferenceDot
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
          const durMin = 15 + Math.floor(Math.random()* (60*8))    // 15 min à 8 h
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
      { date:'2025-05-20', type:'withdrawal',       amount: -800, ccy:'USD', note:'Retrait' },
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

    const cashFlowTotal = useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
    const capitalInitialDisp = useMemo(()=> convert(CAPITAL_INITIAL_USD, 'USD', displayCcy), [displayCcy, rates])
    const capitalBase = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])

    /* ===================== KPI de base ===================== */
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

    /* ===================== Équité (trading seul vs avec flux) ===================== */
    function groupByDateSumPnlDisp(rows) {
      const m = new Map()
      for (const r of rows) {
        const v = convert(r.pnl, r.ccy, displayCcy)
        m.set(r.date, (m.get(r.date) || 0) + v)
      }
      return Array.from(m, ([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date))
    }
    const pnlByDate = useMemo(() => groupByDateSumPnlDisp(filtered), [filtered, displayCcy, rates])

    const cashByDate = useMemo(()=>{
      const m = new Map()
      for (const c of cashflowsInRange){
        m.set(c.date, (m.get(c.date)||0) + (c.amount_disp||0))
      }
      return Array.from(m, ([date, cash]) => ({ date, cash })).sort((a,b)=>a.date.localeCompare(b.date))
    }, [cashflowsInRange])

    const pnlMap = useMemo(()=>{ const m=new Map(); pnlByDate.forEach(p=>m.set(p.date, p.pnl)); return m },[pnlByDate])
    const cashCumMap = useMemo(()=>{
      let cum=0; const m=new Map()
      for (const c of cashByDate){ cum += c.cash; m.set(c.date, Number(cum.toFixed(2))) }
      return m
    }, [cashByDate])

    const mergedDates = useMemo(()=>{
      const s = new Set()
      pnlByDate.forEach(x=>s.add(x.date))
      cashByDate.forEach(x=>s.add(x.date))
      return Array.from(s).sort((a,b)=>a.localeCompare(b))
    }, [pnlByDate, cashByDate])

    const equityMerged = useMemo(()=>{
      let eqTrading = capitalInitialDisp // démarre au capital initial uniquement
      const out = []
      for (const d of mergedDates){
        eqTrading += (pnlMap.get(d) || 0)
        const cashCum = (cashCumMap.get(d) || 0)
        out.push({
          date: d,
          equity_trading: Number(eqTrading.toFixed(2)),
          equity_with_flows: Number((eqTrading + cashCum).toFixed(2))
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

    const { peakEquity, troughEquity, maxDDAbs } = useMemo(()=>{
      if (!equitySeriesHL.length) return { peakEquity:0, troughEquity:0, maxDDAbs:0 }
      let peakSeen = equitySeriesHL[0].equity_trading
      let maxDrop = 0
      for (const p of equitySeriesHL) {
        if (p.equity_trading > peakSeen) peakSeen = p.equity_trading
        const drop = peakSeen - p.equity_trading
        if (drop > maxDrop) maxDrop = drop
      }
      const pe = Math.max(...equitySeriesHL.map(e=>e.equity_trading))
      const tr = Math.min(...equitySeriesHL.map(e=>e.equity_trading))
      return { peakEquity: pe, troughEquity: tr, maxDDAbs: maxDrop }
    }, [equitySeriesHL])

    function equityWithFlowsAt(date){
      const p = equitySeriesHL.find(x=>x.date===date)
      return p ? p.equity_with_flows : undefined
    }

    /* === ret journaliers (Sharpe/Sortino si besoin) === */
    const dailyReturns = useMemo(()=>{
      const out = []
      for (let i=1;i<equitySeriesHL.length;i++){
        const p = equitySeriesHL[i-1].equity_trading, c = equitySeriesHL[i].equity_trading
        out.push({ date: equitySeriesHL[i].date, ret: p===0?0:(c-p)/p })
      }
      return out
    }, [equitySeriesHL])

    /* ===================== Durées ===================== */
    const avgTradeDurationMin = useMemo(()=>{
      const mins = filtered.map(t=>{
        const o = t.open_time ? new Date(t.open_time).getTime() : NaN
        const c = t.close_time ? new Date(t.close_time).getTime() : NaN
        if (!isFinite(o) || !isFinite(c)) return null
        return (c - o) / 60000
      }).filter(v=>v!=null)
      return mins.length ? mean(mins) : 0
    }, [filtered])

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

    /* ===================== Gains / pertes par heure & par mois ===================== */
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

    /* ===================== Rentabilité & MaxDD% ===================== */
    const globalReturnPct = useMemo(()=>{
      if (!isFinite(capitalBase) || capitalBase<=0) return 0
      return (totalPnlDisp / capitalBase) * 100
    }, [totalPnlDisp, capitalBase])

    const maxDDPct = useMemo(()=>{
      if (!isFinite(peakEquity) || peakEquity<=0) return 0
      return (maxDDAbs / peakEquity) * 100
    }, [maxDDAbs, peakEquity])

    /* ===================== Export / Import CSV & Flux ===================== */
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
      a.href = url; a.download = `trades_filtres_${displayCcy}.csv`; a.click()
      URL.revokeObjectURL(url)
    }
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
      { value:'darwin_mgmt_fee',  label:'Darwinex – Management Fee' },
      { value:'prop_payout',      label:'Prop Firm – Payout' },
      { value:'prop_fee',         label:'Prop Firm – Fee Challenge' },
      { value:'deposit',          label:'Dépôt' },
      { value:'withdrawal',       label:'Retrait' },
      { value:'business_expense', label:'Charge Business' },
      { value:'other_income',     label:'Autre Revenu' }
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

    /* ===================== UI States ===================== */
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
            <label style={btn(colors, true)}>
              Importer Trades CSV
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
            <button style={btn(colors)} onClick={() => window.location.reload()}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >Actualiser</button>
            <button style={btn(colors)} onClick={resetFilters}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >Réinitialiser Filtres</button>
            <button style={btn(colors)} onClick={()=>setShowForm(true)}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >Ajouter Flux</button>
            <button style={btn(colors)} onClick={exportCSV}
              onMouseEnter={(e)=>e.currentTarget.style.background='rgba(201,164,75,0.10)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >Export CSV</button>

            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:colors.muted, border:`1px solid ${colors.gold}`, padding:'6px 10px', borderRadius:10 }}>
              <input type="checkbox" checked={showFlows} onChange={e=>setShowFlows(e.target.checked)} />
              Afficher « avec flux »
            </label>
          </div>
        </div>

        {/* FILTRES */}
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

        {/* KPI Secondaires */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
          <div style={card}>
            <h3 style={kpiTitle(colors)}>Win Rate / RR <Hint text="Couleur = rentabilité globale (expectancy). Blanc: rentable, Rose: non rentable." /></h3>
            {(() => {
              const p = filtered.length ? (wins / filtered.length) : 0
              const profitable = (avgWin * p - avgLoss * (1 - p)) > 0
              const col = profitable ? '#ffffff' : colors.pink
              return (
                <div style={{ fontSize: 16 }}>
                  <span style={{ color: col }}>{wr.toFixed(2)}%</span>
                  {' / '}
                  <span style={{ color: col }}>{rr.toFixed(2)}</span>
                </div>
              )
            })()}
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

        {/* Courbe d’équité */}
        <div style={{ ...card, height: 460, marginTop: 16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <h3 style={kpiTitle(colors)}>Courbe D’Équité (Trading Seul / Avec Flux)</h3>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={equitySeriesHL} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
              <XAxis dataKey="date" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#0f1011", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.35)", padding: 10 }}
                itemStyle={{ color: colors.text }} labelStyle={{ color: colors.muted, fontSize: 11 }}
                formatter={(v, n)=>[fmt(v), n]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: colors.muted, paddingTop: 4 }} />

              {/* TRADING SEUL (débute au capital initial) */}
              <Line type="monotone" dataKey="equity_trading" name="Équité (trading seul)" dot={false} stroke="#ffffff" strokeWidth={3} isAnimationActive={false} />

              {/* AVEC FLUX (solide) */}
              {showFlows && (
                <Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#8a8f94" strokeWidth={1.8} />
              )}

              {/* HWM/LWM sur trading seul */}
              <Line type="monotone" dataKey="hwm" name="Plus Haut (HWM)" dot={false} stroke={colors.turq} strokeWidth={1.6} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="lwm" name="Plus Bas (LWM)" dot={false} stroke={colors.pink} strokeWidth={1.2} strokeDasharray="4 3" />

              {/* Points de cashflow (sans label dans le graphe) */}
              {showFlows && cashflowsInRange
                .filter(c=>['deposit','withdrawal','prop_fee','prop_payout','darwin_mgmt_fee'].includes(c.type))
                .map((c,i)=>{
                  const y = equityWithFlowsAt(c.date)
                  const color = c.amount >= 0 ? colors.turq : colors.pink
                  return (y!=null) ? <ReferenceDot key={'cf'+i} x={c.date} y={y} r={4} fill={color} stroke="none" /> : null
                })}
            </LineChart>
          </ResponsiveContainer>

          {/* Légende lisible des flux */}
          <div style={{ marginTop: 8, maxHeight: 72, overflow: 'auto', fontSize: 12, color: colors.muted }}>
            {showFlows && cashflowsInRange
              .slice()
              .sort((a,b)=>a.date.localeCompare(b.date))
              .map((c,i)=>{
                const color = c.amount >= 0 ? colors.turq : colors.pink
                const labelTxt =
                  `${c.date} — ${(c.type==='deposit' && 'Dépôt') ||
                                (c.type==='withdrawal' && 'Retrait') ||
                                (c.type==='prop_fee' && 'Prop Fee') ||
                                (c.type==='prop_payout' && 'Prop Payout') ||
                                (c.type==='darwin_mgmt_fee' && 'Darwinex Fee') || 'Flux'} : `
                return (
                  <span key={'cfl'+i} style={{ marginRight: 14 }}>
                    <span style={{ color }}>{labelTxt}{(c.amount_disp>=0?'+':'')}{fmt(c.amount_disp)}</span>
                  </span>
                )
              })}
          </div>
        </div>

        {/* Histogrammes — Gains / Pertes par Heure & par Mois */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16 }}>
          <div style={{ ...card, height: 320 }}>
            <h3 style={kpiTitle(colors)}>Gains / Pertes Par Heure D’Ouverture</h3>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={gainsLossByHour} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
                <XAxis dataKey="hour" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
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

          <div style={{ ...card, height: 320 }}>
            <h3 style={kpiTitle(colors)}>Gains / Pertes Par Mois D’Ouverture</h3>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={gainsLossByMonth} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1f2021" strokeDasharray="4 4" />
                <XAxis dataKey="month" stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
                <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0f1011", border:`1px solid ${colors.border}`, color: colors.text, borderRadius:12, boxShadow:"0 8px 20px rgba(0,0,0,0.35)", padding:10 }}
                  itemStyle={{ color: colors.text }} labelStyle={{ color: colors.muted, fontSize: 11 }}
                  formatter={(v, n)=>[fmt(v), n==='gain'?'Gains':'Pertes']}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: colors.muted, paddingTop: 4 }} />
                <Bar dataKey="gain" name="Gains" fill="url(#turqGloss)" />
                <Bar dataKey="loss" name="Pertes" fill="url(#pinkGloss)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 20 }}>
          ZooProjectVision © {new Date().getFullYear()}
        </div>

        {/* MODAL — Ajouter flux */}
        {showForm && (
          <div style={modalOverlay()} onClick={()=>setShowForm(false)}>
            <div style={modalCard(colors)} onClick={(e)=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:14, color: colors.text }}>Ajouter Un Flux</div>
                <button style={btnGhost(colors)} onClick={()=>setShowForm(false)}>Fermer</button>
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
                  <button type="button" style={btnGhost(colors)} onClick={()=>setShowForm(false)}>Annuler</button>
                  <button type="submit" style={btn(colors)}>Enregistrer</button>
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

/* ===================== helpers math ===================== */
function mean(a){ if(!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
function stddev(a){
  if(!a.length) return 0
  const m = mean(a)
  const v = mean(a.map(x => (x-m)*(x-m)))
  return Math.sqrt(v)
}

/* ===================== helpers UI ===================== */
function btn(colors, isLabel){
  return {
    position: isLabel?'relative':'static',
    border:`1px solid ${colors.gold}`, background:'transparent', color:colors.text,
    padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12, transition:'background 160ms ease'
  }
}
function btnGhost(colors){ return { border:`1px solid ${colors.border}`, background:'transparent', color:colors.text, padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12 } }
function label(colors){ return { color: colors.text, fontSize: 12, marginBottom: 6, fontWeight: 400 } }
function sel(colors){ return { width:'100%', padding:'9px 12px', fontSize:12, color:colors.text, background:'#0f0f10', border:`1px solid ${colors.border}`, borderRadius:10, outline:'none' } }
function kpiTitle(colors){ return { fontWeight: 400, color: colors.text, margin: "0 0 8px", fontSize: 14, letterSpacing: 0.2 } }
function modalOverlay(){ return { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 } }
function modalCard(colors){ return { width:'min(720px, 100%)', background:colors.panel, border:`1px solid ${colors.border}`, borderRadius:16, padding:12 } }
function formLabel(){ return { display:'flex', flexDirection:'column', gap:6, fontSize:12 } }
function colorByThreshold(metric, value){
  const c = { good:'#ffffff', neutral:'#c8d0d6', bad:'#ff5fa2' }
  switch(metric){
    case 'wr':      return value>=50?c.good: value>=35?c.neutral:c.bad
    case 'rr':      return value>=1.5?c.good: value>=1.0?c.neutral:c.bad
    case 'exp':     return value>0?c.good:c.bad
    case 'dd':      return value<10?c.good: value<=25?c.neutral:c.bad
    case 'ret':     return value>=0?c.good:c.bad
    default:        return '#e8ecef'
  }
}
function Hint({text}){ return <span title={text} style={{marginLeft:6, opacity:.8, cursor:'help'}}>?</span> }
