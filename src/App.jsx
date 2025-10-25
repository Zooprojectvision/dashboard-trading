// src/App.jsx
// ZooProjectVision — V4.3.1 + Blocs I/J/K/L/M/N intégrés

import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

/* ================== [A] START — Thème global & helpers couleur ================== */
const C = {
  bg: "#0a0a0b",
  text: "#e8ecef",
  muted: "#b6bcc1",
  panel: "#141414",
  border: "#242424",
  axis: "#c9cdd1",           // gris très clair pour axes
  white: "#ffffff",
  green: "#20e3d6",          // vert gloss
  green2: "#18b8ad",
  pink: "#ff5fa2",           // rose gloss
  pink2: "#ff7cbf",
  orange: "#ffb347"          // orange neutre, si besoin
}
/* ================== [A] END — Thème global & helpers couleur ================== */


/* ================== Helpers calcul ================== */
function round2(x){ return Math.round((x??0)*100)/100 }
function mean(a){ if(!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
function stddev(a){ if(!a.length) return 0; const m=mean(a); const v=mean(a.map(x=>(x-m)*(x-m))); return Math.sqrt(v) }

/* ================== [COMPONENT] Win Rate Donut (BLOCK N) ================== */
function WinRateDonut({ filtered }) {
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

  const data = React.useMemo(() => ([
    { name: 'Gagnants', value: counts.wins },
    { name: 'Perdants', value: counts.losses },
  ]), [counts])

  const ringColors = ['var(--muted)', '#0f0f10']
  const size = 160, outerR = 62, innerR = 42, labelSize = 22

  const TooltipDonut = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const agg = new Map()
    payload.forEach(p => {
      const cat = p?.name || (p?.payload?.name) || ''
      const val = Number.isFinite(p?.value) ? p.value : 0
      agg.set(cat, (agg.get(cat) || 0) + val)
    })
    return (
      <div style={{
        background:'var(--panel)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 10px', color:'var(--text)', fontSize:12
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
        <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:10, color:'var(--muted)', fontSize:12 }}>
          <span>gagnants: <b style={{ color:'var(--text)' }}>{new Intl.NumberFormat().format(counts.wins)}</b></span>
          <span>perdants: <b style={{ color:'var(--text)' }}>{new Intl.NumberFormat().format(counts.losses)}</b></span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerR} outerRadius={outerR}
                 paddingAngle={1.5} stroke="none" isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={ringColors[i % ringColors.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<TooltipDonut />} />
          </PieChart>
        </ResponsiveContainer>

        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', textAlign:'center' }}>
          <div>
            <div style={{ fontSize: labelSize, lineHeight:1, color:'var(--text)' }}>
              {counts.wr.toFixed(1)}%
            </div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
              sur {new Intl.NumberFormat().format(counts.total)} trades
            </div>
          </div>
        </div>
      </div>

      <div style={{ color:'var(--muted)', fontSize:12, marginTop:8 }}>
        Ratio de trades gagnants (neutre).
      </div>
    </div>
  )
}

/* ================== [COMPONENT] Matrice corrélation (BLOCK J) ================== */
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

/* ================== [COMPONENT] Guide (BLOCK K) ================== */
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

/* ================== [COMPONENT] Cashflows chip (BLOCK L) ================== */
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

/* ================== [COMPONENT] Risque & Projection (BLOCK M) ================== */
function RiskProjection({ filtered, displayCcy, convert, fmt, capitalGlobal, capitalInitialDisp, maxDDPct }) {
  const [open, setOpen] = React.useState(false)
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

/* ================== [MAIN APP] ================== */
export default function App(){
  try{
    /* ---------- démo data trades (90j) ---------- */
    const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
    const BROKERS = ["Darwinex", "ICMarkets", "Pepperstone"]
    const STRATS  = ["Strategy 1", "Strategy 2", "Breakout"]

    const demoTrades = React.useMemo(() => {
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
            date, asset, broker, strategy,
            pnl, ccy:'USD',
            open_time: open.toISOString(),
            close_time: close.toISOString(),
            mfe, mae
          })
        }
      }
      return rows
    }, [])

    /* ---------- état utilisateur: trades importés ---------- */
    const [userTrades, setUserTrades] = React.useState([])
    const tradesAll = React.useMemo(()=> demoTrades.concat(userTrades), [demoTrades, userTrades])

    /* ---------- cashflows (démo + custom) ---------- */
    const CAPITAL_INITIAL_USD = 100000
    const demoCashflows = [
      { date:'2025-01-05', type:'deposit',          amount: 2000, ccy:'USD', note:'Apport' },
      { date:'2025-02-10', type:'prop_fee',         amount: -500, ccy:'USD', note:'Prop challenge' },
      { date:'2025-03-15', type:'prop_payout',      amount: 1000, ccy:'USD', note:'Payout prop' },
      { date:'2025-04-02', type:'darwin_mgmt_fee',  amount: 250,  ccy:'USD', note:'Darwinex mgmt fee' },
      { date:'2025-05-20', type:'withdrawal',       amount: -800, ccy:'USD', note:'Retrait' },
    ]
    const [userCashflows, setUserCashflows] = React.useState(()=>{
      try{
        const raw = localStorage.getItem('zp_cashflows_custom')
        return raw ? JSON.parse(raw) : []
      }catch{ return [] }
    })
    React.useEffect(()=>{ try{
      localStorage.setItem('zp_cashflows_custom', JSON.stringify(userCashflows))
    }catch{} }, [userCashflows])
    const allCashflows = React.useMemo(()=> demoCashflows.concat(userCashflows), [userCashflows])

    /* ---------- Filtres ---------- */
    const [asset, setAsset] = React.useState("All")
    const [broker, setBroker] = React.useState("All")
    const [strategy, setStrategy] = React.useState("All")
    const [dateFrom, setDateFrom] = React.useState("")
    const [dateTo, setDateTo] = React.useState("")
    const resetFilters = ()=>{ setAsset("All"); setBroker("All"); setStrategy("All"); setDateFrom(""); setDateTo("") }

    const assets=React.useMemo(()=> Array.from(new Set(tradesAll.map(t=>t.asset))), [tradesAll])
    const brokers=React.useMemo(()=> Array.from(new Set(tradesAll.map(t=>t.broker))), [tradesAll])
    const strategies=React.useMemo(()=> Array.from(new Set(tradesAll.map(t=>t.strategy))), [tradesAll])

    const filtered=React.useMemo(()=> tradesAll.filter(t=>{
      if(asset!=="All" && t.asset!==asset) return false
      if(broker!=="All" && t.broker!==broker) return false
      if(strategy!=="All" && t.strategy!==strategy) return false
      if(dateFrom && t.date<dateFrom) return false
      if(dateTo && t.date>dateTo) return false
      return true
    }), [tradesAll, asset, broker, strategy, dateFrom, dateTo])

    /* ---------- Devises (USD/EUR/CHF) ---------- */
    const [displayCcy, setDisplayCcy] = React.useState('USD')
    const fxFallback = {
      USD: { USD:1,   EUR:0.93, CHF:0.88 },
      EUR: { USD:1/0.93, EUR:1, CHF:0.88/0.93 },
      CHF: { USD:1/0.88, EUR:0.93/0.88, CHF:1 }
    }
    const [rates, setRates] = React.useState(null)
    React.useEffect(() => {
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
      try { return new Intl.NumberFormat(undefined,{ style:'currency', currency:ccy, minimumFractionDigits:2, maximumFractionDigits:2 }).format(v ?? 0) }
      catch { return `${(v??0).toFixed(2)} ${ccy}` }
    }

    /* ---------- Cashflows en range + base capital ---------- */
    const cashflowsInRange = React.useMemo(()=>{
      const list = allCashflows.filter(c=>{
        if (dateFrom && c.date < dateFrom) return false
        if (dateTo && c.date > dateTo) return false
        return true
      })
      return list.map(c => ({ ...c, amount_disp: convert(c.amount, c.ccy, displayCcy) }))
    }, [allCashflows, dateFrom, dateTo, displayCcy, rates])

    const cashFlowTotal = React.useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
    const capitalInitialDisp = React.useMemo(()=> convert(CAPITAL_INITIAL_USD, 'USD', displayCcy), [displayCcy, rates])

    const totalPnlDisp = React.useMemo(()=> filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, displayCcy, rates])
    const capitalBase = React.useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])
    const capitalGlobal = React.useMemo(()=> capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

    /* ---------- Equity (trading seul) + HWM/LWM ---------- */
    function groupByDateSumPnlDisp(rows) {
      const m = new Map()
      for (const r of rows) {
        const v = convert(r.pnl, r.ccy, displayCcy)
        m.set(r.date, (m.get(r.date) || 0) + v)
      }
      return Array.from(m, ([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date))
    }
    const pnlByDate = React.useMemo(() => groupByDateSumPnlDisp(filtered), [filtered, displayCcy, rates])

    const equitySeriesHL = React.useMemo(() => {
      let eq = capitalInitialDisp
      let h = -Infinity, l = Infinity
      const out=[]
      for(const p of pnlByDate){
        eq += p.pnl
        h = Math.max(h, eq); l = Math.min(l, eq)
        out.push({ date:p.date, equity_trading: Number(eq.toFixed(2)), hwm:Number(h.toFixed(2)), lwm:Number(l.toFixed(2)) })
      }
      return out
    }, [pnlByDate, capitalInitialDisp])

    const { peakEquity, troughEquity, maxDDAbs } = React.useMemo(()=>{
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

    const maxDDPct = React.useMemo(()=> {
      if (!Number.isFinite(peakEquity) || peakEquity<=0) return 0
      return (maxDDAbs / peakEquity) * 100
    }, [maxDDAbs, peakEquity])

    /* ---------- MFE/MAE daily (moyenne + cumul) ---------- */
    const mfeMaeDaily = React.useMemo(()=>{
      const map = new Map()
      for(const t of filtered){
        const d = t.date
        const mfe = convert(t.mfe ?? 0, t.ccy || 'USD', displayCcy)
        const mae = convert(t.mae ?? 0, t.ccy || 'USD', displayCcy)
        if(!map.has(d)) map.set(d, { date:d, sMFE:0, sMAE:0, n:0 })
        const x = map.get(d); x.sMFE += Math.max(0, mfe); x.sMAE += Math.max(0, Math.abs(mae)); x.n++
      }
      const arr = Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date))
      let cumM=0, cumA=0
      return arr.map(r=>{
        const avgMFE = r.n? r.sMFE/r.n : 0
        const avgMAE = r.n? r.sMAE/r.n : 0
        cumM += r.sMFE; cumA += r.sMAE
        return {
          date:r.date,
          avgMFE:Number(avgMFE.toFixed(2)), avgMAE:Number(avgMAE.toFixed(2)),
          cumMFE:Number(cumM.toFixed(2)),   cumMAE:Number(cumA.toFixed(2))
        }
      })
    }, [filtered, displayCcy, rates])

    /* ---------- Capital Tiers (BLOCK I) ---------- */
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
      const row = { date: ctForm.date, source: ctForm.source, amount: amt, ccy: ctForm.ccy || displayCcy, note: ctForm.note || '' }
      setCapitalTiers(prev => prev.concat([row]))
      setShowCT(false)
      setCtForm({ date:new Date().toISOString().slice(0,10), source:'Darwinex', amount:'', ccy:displayCcy, note:'' })
    }

    /* ---------- RENDER ---------- */
    return (
      <div className="wrap">
        {/* HEADER */}
        <div className="header">
          <div>
            <h1 className="brand">ZooProjectVision</h1>
            <p className="subtitle">Dashboard De Performance Trading — Multi-Actifs, Multi-Brokers, Multi-Stratégies</p>
          </div>
          <div className="header-actions">
            {/* Import CSV (dépôt) */}
            <label className="btn">
              importer csv
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
                }}
              />
            </label>

            {/* Ajouter flux */}
            <button className="btn" onClick={()=>setShowFlow(true)}>ajouter flux</button>

            {/* KPI neutre + bouton Capital Tiers */}
            <div className="card halo-neutral" style={{ padding:'6px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <div className="kpi-title" style={{ margin:0 }}>capital tiers</div>
              <div className="val" style={{ fontSize:14, color:'var(--text)' }}>{fmt(capitalTiersTotalDisp, displayCcy)}</div>
            </div>
            <button className="btn" onClick={()=>setShowCT(true)}>capital tiers</button>

            {/* Cashflows résumé */}
            <CashflowSummaryChip
              allCashflows={allCashflows}
              dateFrom={dateFrom} dateTo={dateTo}
              displayCcy={displayCcy} convert={convert} fmt={fmt}
            />

            {/* Devise */}
            <select className="sel" value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)} style={{ width:90 }}>
              {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
            </select>

            {/* Reset filtres */}
            <button className="btn ghost" onClick={resetFilters}>réinitialiser</button>

            {/* Aide */}
            <GuidePanel />

            {/* Risque & Projection */}
            <RiskProjection
              filtered={filtered} displayCcy={displayCcy} convert={convert} fmt={fmt}
              capitalGlobal={capitalGlobal} capitalInitialDisp={capitalInitialDisp} maxDDPct={maxDDPct}
            />
          </div>
        </div>

        {/* FILTRES */}
        <div className="card" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10 }}>
          <div><div className="kpi-title">actif</div>
            <select value={asset} onChange={e=>setAsset(e.target.value)} className="sel"><option>All</option>{assets.map(a=><option key={a} value={a}>{a}</option>)}</select>
          </div>
          <div><div className="kpi-title">broker</div>
            <select value={broker} onChange={e=>setBroker(e.target.value)} className="sel"><option>All</option>{brokers.map(b=><option key={b} value={b}>{b}</option>)}</select>
          </div>
          <div><div className="kpi-title">stratégie</div>
            <select value={strategy} onChange={e=>setStrategy(e.target.value)} className="sel"><option>All</option>{strategies.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><div className="kpi-title">du</div><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="sel" /></div>
          <div><div className="kpi-title">au</div><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="sel" /></div>
          <div />
          <div />
        </div>

        {/* KPI PRINCIPAUX */}
        <div className="grid-6">
          <div className="card"><div className="kpi-title">capital initial</div><div className="val">{fmt(capitalInitialDisp)}</div></div>
          <div className={`card ${cashFlowTotal>=0?'halo-good':'halo-bad'}`}><div className="kpi-title">cash flow</div><div className="val" style={{color:cashFlowTotal>=0?C.green:C.pink}}>{fmt(cashFlowTotal)}</div></div>
          <div className={`card ${totalPnlDisp>=0?'halo-good':'halo-bad'}`}><div className="kpi-title">pnl (filtré)</div><div className="val" style={{color:totalPnlDisp>=0?C.green:C.pink}}>{fmt(totalPnlDisp)}</div></div>
          <div className="card"><div className="kpi-title">capital global</div><div className="val">{fmt(capitalGlobal)}</div></div>
          <div className={`card ${maxDDPct<15?'halo-good':(maxDDPct<=20?'halo-warn':'halo-bad')}`}><div className="kpi-title">max dd %</div><div className="val">{maxDDPct.toFixed(2)}%</div></div>
          <div className={`card ${maxDDAbs<= (peakEquity*0.2)? (maxDDAbs<= (peakEquity*0.15)?'halo-good':'halo-warn'):'halo-bad'}`}><div className="kpi-title">max dd (abs)</div><div className="val">{fmt(maxDDAbs)}</div></div>
        </div>

        {/* KPI — Win Rate donut + quelques ratios neutres */}
        <div className="grid-4">
          <WinRateDonut filtered={filtered} />
          <div className="card">
            <div className="kpi-title">peak / trough (trading)</div>
            <div className="val">{fmt(peakEquity)} / {fmt(troughEquity)}</div>
          </div>
          <div className="card">
            <div className="kpi-title">expectancy / trade</div>
            <div className="val" style={{color:'var(--text)'}}>{(() => {
              const v = filtered.length? (totalPnlDisp/filtered.length) : 0
              return fmt(v)
            })()}</div>
          </div>
          <div className="card">
            <div className="kpi-title">jours actifs</div>
            <div className="val">{new Set(filtered.map(t=>t.date)).size}</div>
          </div>
        </div>

        {/* Courbe d’équité (trading seul) */}
        <div className="card" style={{ height: 420, marginTop:16 }}>
          <div className="kpi-title" style={{ marginBottom:8 }}>courbe d’équité</div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={equitySeriesHL} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} tick={{ fontSize: 11 }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--panel)', border: `1px solid var(--border)`, color: 'var(--text)', borderRadius: 10 }}
                labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }}
                formatter={(v,n)=>[fmt(v), n]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: C.text }} />
              <Line type="monotone" dataKey="equity_trading" name="Équité (trading seul)" dot={false} stroke={C.white} strokeWidth={1.8} isAnimationActive={false} />
              <Line type="monotone" dataKey="hwm" name="Plus Haut (HWM)" dot={false} stroke={C.green} strokeWidth={1.4} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="lwm" name="Plus Bas (LWM)" dot={false} stroke={C.pink} strokeWidth={1.2} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MFE/MAE — quotidien (moyenne) */}
        <div className="card" style={{height:360, marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="kpi-title">mfe / mae — Quotidien (Moyenne)</div>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{left:8,right:8,top:8,bottom:8}}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tick={{ fontSize: 11 }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}}
                formatter={(v,n)=>[
                  fmt(v),
                  n==='avgMFE'?'MFE Moyen':'MAE Moyen'
                ]}
                labelStyle={{color:C.text}} itemStyle={{color:C.text}}
              />
              <Legend wrapperStyle={{ color:C.text }} />
              <Line type="monotone" dataKey="avgMFE" name="MFE Moyen" dot={false} stroke={C.green} strokeWidth={2} />
              <Line type="monotone" dataKey="avgMAE" name="MAE Moyen" dot={false} stroke={C.pink} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Matrice corrélation */}
        <CorrelationMatrix filtered={filtered} displayCcy={displayCcy} convert={convert} />

        {/* FOOTER */}
        <div style={{ textAlign: "center", color: C.muted, fontSize: 12, marginTop: 20 }}>
          ZooProjectVision © {new Date().getFullYear()}
        </div>

        {/* MODALE — Ajouter flux */}
        <FlowModal
          openHook={[showFlow, setShowFlow]}
          onSave={(row)=>setUserCashflows(prev=>prev.concat([row]))}
          displayCcy={displayCcy}
        />

        {/* MODALE — Capital Tiers */}
        {showCT && (
          <div className="modal-overlay" onClick={()=>setShowCT(false)}>
            <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div className="kpi-title" style={{ fontSize:14 }}>ajouter un capital tiers</div>
                <button className="btn ghost sm" onClick={()=>setShowCT(false)}>fermer</button>
              </div>
              <form onSubmit={submitCT} style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(2, 1fr)' }}>
                <label className="form-label"><span>source</span>
                  <select className="sel" value={ctForm.source} onChange={e=>setCtForm(f=>({...f, source:e.target.value}))}>
                    {ctSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="form-label"><span>date</span>
                  <input type="date" className="sel" value={ctForm.date} onChange={e=>setCtForm(f=>({...f, date:e.target.value}))} />
                </label>
                <label className="form-label"><span>devise</span>
                  <select className="sel" value={ctForm.ccy} onChange={e=>setCtForm(f=>({...f, ccy:e.target.value}))}>
                    {['USD','EUR','CHF'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-label"><span>montant</span>
                  <input type="number" step="0.01" className="sel" placeholder="ex: 25 000.00" value={ctForm.amount}
                         onChange={e=>setCtForm(f=>({...f, amount:e.target.value}))} />
                </label>
                <label className="form-label" style={{ gridColumn:'1 / -1' }}><span>note</span>
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
                          {fmt(convert(Number(r.amount)||0, r.ccy||'USD', displayCcy))}
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

      </div>
    )
  }catch(e){
    console.error(e)
    return <div style={{ color: C.pink, padding: 16 }}>Erreur : {String(e.message || e)}</div>
  }
}

/* ================== Modale Flux (réutilisable) ================== */
function FlowModal({ openHook, onSave, displayCcy }){
  const [open, setOpen] = openHook || [false, ()=>{}]
  const [flow, setFlow] = React.useState({
    date: new Date().toISOString().slice(0,10),
    type: 'darwin_mgmt_fee',
    amount: '',
    ccy: displayCcy,
    note: ''
  })
  React.useEffect(()=>{ setFlow(f=>({...f, ccy: displayCcy})) }, [displayCcy])

  const flowTypes = [
    { value:'darwin_mgmt_fee',  label:'Darwinex – Management Fee' },
    { value:'prop_payout',      label:'Prop Firm – Payout' },
    { value:'prop_fee',         label:'Prop Firm – Fee Challenge' },
    { value:'deposit',          label:'Dépôt' },
    { value:'withdrawal',       label:'Retrait' },
    { value:'business_expense', label:'Charge Business' },
    { value:'other_income',     label:'Autre Revenu' }
  ]

  const submit = (e)=>{
    e.preventDefault()
    const amt = Number(flow.amount)
    if (!flow.date || !flow.type || !Number.isFinite(amt)) { alert('Merci de compléter Date / Type / Montant'); return }
    const row = { date: flow.date, type: flow.type, amount: amt, ccy: flow.ccy || displayCcy, note: flow.note || '' }
    onSave && onSave(row)
    setOpen(false)
    setFlow({ date: new Date().toISOString().slice(0,10), type:'darwin_mgmt_fee', amount:'', ccy: displayCcy, note:'' })
  }

  if(!open) return null
  return (
    <div className="modal-overlay" onClick={()=>setOpen(false)}>
      <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:14, color: 'var(--text)' }}>ajouter un flux</div>
          <button className="btn ghost sm" onClick={()=>setOpen(false)}>fermer</button>
        </div>
        <form onSubmit={submit} style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(2,1fr)' }}>
          <label className="form-label"><span>type</span>
            <select value={flow.type} onChange={e=>setFlow(f=>({...f, type:e.target.value}))} className="sel">
              {flowTypes.map(t=> <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="form-label"><span>date</span>
            <input type="date" value={flow.date} onChange={e=>setFlow(f=>({...f, date:e.target.value}))} className="sel" />
          </label>
          <label className="form-label"><span>devise</span>
            <select value={flow.ccy} onChange={e=>setFlow(f=>({...f, ccy:e.target.value}))} className="sel">
              {['USD','EUR','CHF'].map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="form-label"><span>montant</span>
            <input type="number" step="0.01" placeholder="ex: 250.00" value={flow.amount}
                   onChange={e=>setFlow(f=>({...f, amount:e.target.value}))} className="sel" />
          </label>
          <label className="form-label" style={{ gridColumn:'1 / -1' }}><span>note</span>
            <input type="text" placeholder="optionnel" value={flow.note}
                   onChange={e=>setFlow(f=>({...f, note:e.target.value}))} className="sel" />
          </label>
          <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button type="button" className="btn ghost" onClick={()=>setOpen(false)}>annuler</button>
            <button type="submit" className="btn">enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ================== CSV utils (import) ================== */
function parseCSV(text){
  const lines = String(text||'').trim().split(/\r?\n/); if(!lines.length) return []
  const headers = lines.shift().split(',').map(h=>h.trim().replace(/^"|"$/g,''))
  const rows=[]
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
