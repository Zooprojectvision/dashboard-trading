import React, { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
  ReferenceLine, ReferenceDot, AreaChart, Area
} from 'recharts'

export default function App(){
  try{
    /* ==================== Thème (cohérent avec styles.css) ==================== */
    const C = {
      bg:'#0a0a0b', panel:'#141414', border:'#242424', axis:'#b6bcc1',
      text:'#e8ecef', muted:'#c8d0d6', white:'#ffffff',
      pos:'#20e3d6', pos2:'#18b8ad', neg:'#ff5fa2', neg2:'#ff7cbf', orange:'#ff9f43'
    }
    const NF = (ccy)=> new Intl.NumberFormat(undefined,{ style:'currency', currency: ccy, minimumFractionDigits:2, maximumFractionDigits:2 })
    const fmtNum = (v)=> new Intl.NumberFormat(undefined,{ maximumFractionDigits:2 }).format(v ?? 0)

    /* ==================== Démo data de base ==================== */
    const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
    const BROKERS = ["Darwinex","ICMarkets","Pepperstone"]
    const STRATS  = ["Strategy 1","Strategy 2","Breakout"]

    const demoTrades = useMemo(()=>{
      const rows=[]
      const today = new Date()
      for(let i=120;i>=1;i--){
        const d = new Date(today); d.setDate(d.getDate()-i)
        const date = d.toISOString().slice(0,10)
        for(let k=0;k<6;k++){
          const asset    = ASSETS[(i+k)%ASSETS.length]
          const broker   = BROKERS[(i+k*2)%BROKERS.length]
          const strategy = STRATS[(i+k*3)%STRATS.length]
          let pnl = (Math.random()-0.5) * (Math.random()<0.15 ? 2500 : 900)
          pnl = Number(pnl.toFixed(2))
          const h = Math.floor(Math.random()*24), m = Math.floor(Math.random()*60)
          const open = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
          const durMin = 15 + Math.floor(Math.random()* (60*8))
          const close = new Date(open.getTime()+durMin*60000)
          const mfe = Number((Math.abs(pnl)*(0.8+Math.random()*0.8)).toFixed(2))
          const mae = Number((Math.abs(pnl)*(0.6+Math.random()*0.8)).toFixed(2))
          const commission = Number((Math.random()*6).toFixed(2)) * (Math.random()<.5?-1:1)
          const swap = Number((Math.random()*4).toFixed(2)) * (Math.random()<.5?-1:1)
          rows.push({
            date, asset, broker, strategy,
            pnl, ccy:'USD',
            open_time: open.toISOString(), close_time: close.toISOString(),
            mfe, mae, commission, swap
          })
        }
      }
      return rows
    },[])

    const CAPITAL_INITIAL_USD = 100000
    const demoCashflows = [
      { date:'2025-01-05', type:'deposit',         amount:2000,  ccy:'USD', note:'Apport' },
      { date:'2025-02-10', type:'prop_fee',        amount:-500,  ccy:'USD', note:'Prop challenge' },
      { date:'2025-03-15', type:'prop_payout',     amount:1000,  ccy:'USD', note:'Payout prop' },
      { date:'2025-04-02', type:'darwin_mgmt_fee', amount: -250, ccy:'USD', note:'Darwinex mgmt fee' },
      { date:'2025-05-20', type:'withdrawal',      amount: -800, ccy:'USD', note:'Retrait' },
    ]

    /* ==================== État & persistance basiques ==================== */
    const [displayCcy, setDisplayCcy] = useState(()=>localStorage.getItem('zp_ccy') || 'USD')
    useEffect(()=>{ localStorage.setItem('zp_ccy', displayCcy) }, [displayCcy])

    const [subtitle, setSubtitle] = useState(() =>
      localStorage.getItem('zp_subtitle') ||
      'Poste De Pilotage Trading — Multi-Actifs · Multi-Brokers · Multi-Stratégies'
    )
    const [editingSubtitle, setEditingSubtitle] = useState(false)
    useEffect(()=>{ localStorage.setItem('zp_subtitle', subtitle) }, [subtitle])

    const [userTrades, setUserTrades] = useState(()=> {
      const raw = localStorage.getItem('zp_trades_custom')
      return raw ? JSON.parse(raw) : []
    })
    useEffect(()=>{ localStorage.setItem('zp_trades_custom', JSON.stringify(userTrades)) }, [userTrades])

    const [userCashflows, setUserCashflows] = useState(()=>{
      const raw = localStorage.getItem('zp_cashflows_custom')
      return raw ? JSON.parse(raw) : []
    })
    useEffect(()=>{ localStorage.setItem('zp_cashflows_custom', JSON.stringify(userCashflows)) }, [userCashflows])

    const [capitalTiers, setCapitalTiers] = useState(()=> Number(localStorage.getItem('zp_cap_tiers') || 0))
    useEffect(()=>{ localStorage.setItem('zp_cap_tiers', String(capitalTiers)) }, [capitalTiers])

    const tradesAll = useMemo(()=> demoTrades.concat(userTrades), [demoTrades, userTrades])
    const allCashflows = useMemo(()=> demoCashflows.concat(userCashflows), [userCashflows])

    /* ==================== Taux de change ==================== */
    const fxFallback = {
      USD:{USD:1, EUR:0.93, CHF:0.88},
      EUR:{USD:1/0.93, EUR:1, CHF:0.88/0.93},
      CHF:{USD:1/0.88, EUR:0.93/0.88, CHF:1}
    }
    const [rates, setRates] = useState(null)
    useEffect(()=>{
      const key='fx_cache_v1', cached=localStorage.getItem(key), now=Date.now()
      if(cached){
        const {at, data} = JSON.parse(cached)
        if(now-at < 24*3600*1000){ setRates(data); return }
      }
      fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF')
        .then(r=>r.json())
        .then(j=>{
          const data = {
            USD:{USD:1, EUR:j.rates.EUR, CHF:j.rates.CHF},
            EUR:{USD:1/j.rates.EUR, EUR:1, CHF:j.rates.CHF/j.rates.EUR},
            CHF:{USD:1/j.rates.CHF, EUR:j.rates.EUR/j.rates.CHF, CHF:1}
          }
          setRates(data)
          localStorage.setItem(key, JSON.stringify({at:now, data}))
        })
        .catch(()=>{}) // fallback sur fxFallback
    },[])
    const convert = (val, from='USD', to=displayCcy)=>{
      if(val==null) return 0
      if(from===to) return Number(Number(val).toFixed(2))
      const table = rates || fxFallback
      const r = (table[from] && table[from][to]) ? table[from][to] : 1
      return Number((val * r).toFixed(2))
    }
    const fmt = (v, ccy=displayCcy)=> {
      try{ return NF(ccy).format(v ?? 0) } catch{ return `${(v??0).toFixed(2)} ${ccy}` }
    }

    /* ==================== Filtres ==================== */
    const [asset, setAsset] = useState('All')
    const [broker, setBroker] = useState('All')
    const [strategy, setStrategy] = useState('All')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const resetFilters = ()=>{ setAsset('All'); setBroker('All'); setStrategy('All'); setDateFrom(''); setDateTo('') }

    const assets = useMemo(()=> Array.from(new Set(tradesAll.map(t=>t.asset))), [tradesAll])
    const brokers= useMemo(()=> Array.from(new Set(tradesAll.map(t=>t.broker))), [tradesAll])
    const strategies = useMemo(()=> Array.from(new Set(tradesAll.map(t=>t.strategy))), [tradesAll])

    const filtered = useMemo(()=> tradesAll.filter(t=>{
      if(asset!=='All' && t.asset!==asset) return false
      if(broker!=='All' && t.broker!==broker) return false
      if(strategy!=='All' && t.strategy!==strategy) return false
      if(dateFrom && t.date < dateFrom) return false
      if(dateTo && t.date > dateTo) return false
      return true
    }), [tradesAll, asset, broker, strategy, dateFrom, dateTo])

    /* ==================== Cashflows filtrés & capital ==================== */
    const cashflowsInRange = useMemo(()=>{
      const list = allCashflows.filter(c=>{
        if(dateFrom && c.date < dateFrom) return false
        if(dateTo && c.date > dateTo) return false
        return true
      })
      return list.map(c=> ({ ...c, amount_disp: convert(c.amount, c.ccy, displayCcy) }))
    }, [allCashflows, dateFrom, dateTo, displayCcy, rates])

    const cashFlowTotal = useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
    const capitalInitialDisp = useMemo(()=> convert(CAPITAL_INITIAL_USD,'USD',displayCcy), [displayCcy, rates])
    const capitalBase = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])

    /* ==================== KPI principaux ==================== */
    const totalPnlDisp = useMemo(()=> filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, displayCcy, rates])
    const capitalGlobal = useMemo(()=> capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

    const wins = filtered.filter(t=>t.pnl>0).length
    const wr = filtered.length ? (wins/filtered.length)*100 : 0
    const avgWin = (()=> {
      const list = filtered.filter(t=>t.pnl>0).map(t=>convert(t.pnl, t.ccy, displayCcy))
      return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
    })()
    const avgLoss = (()=> {
      const list = filtered.filter(t=>t.pnl<0).map(t=>Math.abs(convert(t.pnl, t.ccy, displayCcy)))
      return list.length ? list.reduce((a,b)=>a+b,0)/list.length : 0
    })()
    const rr = avgLoss>0 ? (avgWin/avgLoss) : 0
    const expectancy = useMemo(()=> filtered.length ? (totalPnlDisp/filtered.length):0, [totalPnlDisp, filtered.length])

    /* ==================== Équité (trading seul/avec flux) ==================== */
    function groupByDateSumPnlDisp(rows){
      const m=new Map()
      for(const r of rows){
        const v = convert(r.pnl, r.ccy, displayCcy)
        m.set(r.date, (m.get(r.date)||0)+v)
      }
      return Array.from(m, ([date, pnl])=>({date, pnl})).sort((a,b)=>a.date.localeCompare(b.date))
    }
    const pnlByDate = useMemo(()=> groupByDateSumPnlDisp(filtered), [filtered, displayCcy, rates])

    const cashByDate = useMemo(()=>{
      const m=new Map()
      for(const c of cashflowsInRange){
        m.set(c.date, (m.get(c.date)||0)+(c.amount_disp||0))
      }
      return Array.from(m, ([date,cash])=>({date,cash})).sort((a,b)=>a.date.localeCompare(b.date))
    }, [cashflowsInRange])

    const pnlMap = useMemo(()=>{ const m=new Map(); pnlByDate.forEach(p=>m.set(p.date,p.pnl)); return m },[pnlByDate])
    const cashCumMap= useMemo(()=>{
      let cum=0; const m=new Map()
      for(const c of cashByDate){ cum += c.cash; m.set(c.date, Number(cum.toFixed(2))) }
      return m
    }, [cashByDate])

    const mergedDates = useMemo(()=>{
      const s=new Set(); pnlByDate.forEach(x=>s.add(x.date)); cashByDate.forEach(x=>s.add(x.date))
      return Array.from(s).sort((a,b)=>a.localeCompare(b))
    },[pnlByDate,cashByDate])

    const equityMerged = useMemo(()=>{
      let eqTrading = capitalInitialDisp
      const out=[]
      for(const d of mergedDates){
        eqTrading += (pnlMap.get(d)||0)
        const cashCum = (cashCumMap.get(d)||0)
        out.push({
          date:d,
          equity_trading: Number(eqTrading.toFixed(2)),
          equity_with_flows: Number((eqTrading+cashCum).toFixed(2))
        })
      }
      return out
    }, [mergedDates, pnlMap, cashCumMap, capitalInitialDisp])

    const equitySeriesHL = useMemo(()=>{
      let h=-Infinity, l=Infinity
      return equityMerged.map(p=>{
        h=Math.max(h, p.equity_trading)
        l=Math.min(l, p.equity_trading)
        return { ...p, hwm:Number(h.toFixed(2)), lwm:Number(l.toFixed(2)) }
      })
    },[equityMerged])

    const { peakEquity, troughEquity, maxDDAbs } = useMemo(()=>{
      if(!equitySeriesHL.length) return { peakEquity:0, troughEquity:0, maxDDAbs:0 }
      let peakSeen=equitySeriesHL[0].equity_trading, maxDrop=0
      for(const p of equitySeriesHL){
        if(p.equity_trading>peakSeen) peakSeen=p.equity_trading
        const drop=peakSeen - p.equity_trading
        if(drop>maxDrop) maxDrop=drop
      }
      const pe=Math.max(...equitySeriesHL.map(e=>e.equity_trading))
      const tr=Math.min(...equitySeriesHL.map(e=>e.equity_trading))
      return { peakEquity:pe, troughEquity:tr, maxDDAbs:maxDrop }
    },[equitySeriesHL])

    const globalReturnPct = useMemo(()=>{
      if(!isFinite(capitalBase) || capitalBase<=0) return 0
      return (totalPnlDisp / capitalBase) * 100
    },[totalPnlDisp, capitalBase])

    const maxDDPct = useMemo(()=>{
      if(!isFinite(peakEquity)||peakEquity<=0) return 0
      return (maxDDAbs/peakEquity)*100
    },[maxDDAbs, peakEquity])

    /* ==================== Daily returns → Sharpe/Sortino ==================== */
    const dailyReturns = useMemo(()=>{
      const out=[]
      for(let i=1;i<equitySeriesHL.length;i++){
        const p=equitySeriesHL[i-1].equity_trading, c=equitySeriesHL[i].equity_trading
        out.push({ date:equitySeriesHL[i].date, ret: p>0? (c-p)/p: 0 })
      }
      return out
    },[equitySeriesHL])

    const sharpe = useMemo(()=>{
      const rets=dailyReturns.map(r=>r.ret)
      const mu=mean(rets), sd=stddev(rets)
      return sd>0 ? (mu/sd)*Math.sqrt(252) : 0
    },[dailyReturns])

    const sortino = useMemo(()=>{
      const rets=dailyReturns.map(r=>r.ret)
      const mu=mean(rets), neg=rets.filter(r=>r<0), sdDown=stddev(neg)
      return sdDown>0 ? (mu/sdDown)*Math.sqrt(252) : 0
    },[dailyReturns])

    const recoveryFactor = useMemo(()=>{
      const profitNet = (equitySeriesHL.at(-1)?.equity_trading || capitalInitialDisp) - capitalInitialDisp
      return maxDDAbs>0 ? profitNet/maxDDAbs : 0
    },[equitySeriesHL, capitalInitialDisp, maxDDAbs])

    const avgTradeDurationMin = useMemo(()=>{
      const mins = filtered.map(t=>{
        const o = t.open_time ? new Date(t.open_time).getTime() : NaN
        const c = t.close_time ? new Date(t.close_time).getTime() : NaN
        if(!isFinite(o)||!isFinite(c)) return null
        return (c-o)/60000
      }).filter(v=>v!=null)
      return mins.length? mean(mins) : 0
    },[filtered])

    const activeDays = useMemo(()=> new Set(filtered.map(t=>t.date)).size, [filtered])

    /* ==================== MFE/MAE — séries + tooltips propres ==================== */
    const mfeMaeDaily = useMemo(()=>{
      const map=new Map()
      for(const t of filtered){
        const d=t.date
        const mfe = convert(t.mfe??0, t.ccy||'USD', displayCcy)
        const mae = convert(t.mae??0, t.ccy||'USD', displayCcy)
        if(!map.has(d)) map.set(d,{date:d, sMFE:0, sMAE:0, n:0})
        const x=map.get(d); x.sMFE+=Math.max(0,mfe); x.sMAE+=Math.max(0,Math.abs(mae)); x.n++
      }
      const arr = Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date))
      let cumM=0, cumA=0
      return arr.map(r=>{
        const avgMFE=r.n? r.sMFE/r.n : 0
        const avgMAE=r.n? r.sMAE/r.n : 0
        cumM += r.sMFE; cumA += r.sMAE
        return {
          date:r.date,
          avgMFE:Number(avgMFE.toFixed(2)),
          avgMAE:Number(avgMAE.toFixed(2)),
          cumMFE:Number(cumM.toFixed(2)),
          cumMAE:Number(cumA.toFixed(2))
        }
      })
    },[filtered, displayCcy, rates])

    /* ==================== Courbes PnL global & par stratégie ==================== */
    const [curveView, setCurveView] = useState('equity') // 'equity' | 'pnl' | 'strats'

    const pnlCumulative = useMemo(()=>{
      const byDate=new Map()
      for(const t of filtered){
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        byDate.set(t.date, (byDate.get(t.date)||0)+v)
      }
      const dates=Array.from(byDate.keys()).sort()
      let cum=0
      return dates.map(d=>{
        cum += byDate.get(d)||0
        return { date:d, pnl_cum:Number(cum.toFixed(2)) }
      })
    },[filtered, displayCcy, rates])

    const stratPnlSeries = useMemo(()=>{
      const byDateStrat=new Map()
      const stratSet=new Set()
      for(const t of filtered){
        const d=t.date, s=t.strategy||'—'
        stratSet.add(s)
        const v=convert(t.pnl, t.ccy||'USD', displayCcy)
        if(!byDateStrat.has(d)) byDateStrat.set(d,new Map())
        const m=byDateStrat.get(d); m.set(s,(m.get(s)||0)+v)
      }
      const dates=Array.from(byDateStrat.keys()).sort()
      const strats=Array.from(stratSet).sort()
      const cum={}; strats.forEach(s=> cum[s]=0)
      const rows=dates.map(d=>{
        const m=byDateStrat.get(d), row={date:d}
        for(const s of strats){ cum[s] += (m?.get(s)||0); row[s]=Number(cum[s].toFixed(2)) }
        return row
      })
      return { dates, strats, rows }
    },[filtered, displayCcy, rates])

    const stratPalette = ['#7dd3fc','#60a5fa','#a78bfa','#f472b6','#fb7185','#fbbf24','#34d399','#22d3ee','#93c5fd','#fca5a5']

    /* ==================== Broker timezone (agrégations H/J/M) ==================== */
    const brokerTZ = { Darwinex:'Europe/Madrid', ICMarkets:'Australia/Sydney', Pepperstone:'Australia/Sydney' }
    const getHourInTZ = (iso, tz)=> {
      const dt = new Date(iso || '')
      return Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:tz}).format(dt))
    }
    const getWeekdayInTZ = (iso, tz)=> {
      const dt = new Date(iso || '')
      // 0=dim..6=sam → 0=lun..6=dim
      const day = Number(new Intl.DateTimeFormat('en-GB',{weekday:'short', timeZone:tz}).formatToParts(dt).find(p=>p.type==='weekday')?.value?.toLowerCase()?.slice(0,3))
      // fallback simple si non supporté
      const d = new Date(iso||''); return (d.getUTCDay()+6)%7
    }

    const defaultWindowDays = 30
    const [showFlows, setShowFlows] = useState(true)

    // Choix période “défaut 30j si pas de filtre de date”
    const recentCutoff = useMemo(()=>{
      if(dateFrom||dateTo) return null
      const d=new Date(); d.setDate(d.getDate()-defaultWindowDays)
      return d.toISOString().slice(0,10)
    },[dateFrom,dateTo])

    const filteredForTimeAgg = useMemo(()=>{
      if(!recentCutoff) return filtered
      return filtered.filter(t=>t.date>=recentCutoff)
    },[filtered, recentCutoff])

    const aggHours = useMemo(()=>{
      const base = Array.from({length:24}, (_,h)=>({ idx:h, label:`${String(h).padStart(2,'0')}:00`, gain:0, loss:0, net:0 }))
      for(const t of filteredForTimeAgg){
        const tz = brokerTZ[t.broker] || 'UTC'
        const h = getHourInTZ(t.open_time || (t.date+'T00:00:00Z'), tz)
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        if(v>=0) base[h].gain += v; else base[h].loss += Math.abs(v)
      }
      base.forEach(r=> r.net = r.gain - r.loss)
      return base
    },[filteredForTimeAgg, displayCcy, rates])

    const aggWeek = useMemo(()=>{
      const names = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
      const base = names.map((n,i)=>({ idx:i, label:n, gain:0, loss:0, net:0 }))
      for(const t of filteredForTimeAgg){
        const tz = brokerTZ[t.broker] || 'UTC'
        const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
        // weekday 0..6 (lun..dim)
        const w = (d.getUTCDay()+6)%7
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        if(v>=0) base[w].gain += v; else base[w].loss += Math.abs(v)
      }
      base.forEach(r=> r.net = r.gain - r.loss)
      return base
    },[filteredForTimeAgg, displayCcy, rates])

    const aggMonths = useMemo(()=>{
      const names = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
      const base = names.map((n,i)=>({ idx:i, label:n, gain:0, loss:0, net:0 }))
      for(const t of filteredForTimeAgg){
        const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
        const m = d.getUTCMonth()
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        if(v>=0) base[m].gain += v; else base[m].loss += Math.abs(v)
      }
      base.forEach(r=> r.net = r.gain - r.loss)
      return base
    },[filteredForTimeAgg, displayCcy, rates])

    const verdictClassByNet = (net)=> net>0 ? 'halo-good' : net<0 ? 'halo-bad' : 'halo-warn'

    /* ==================== Calendrier enrichi ==================== */
    const lastDate = equitySeriesHL.at(-1)?.date || new Date().toISOString().slice(0,10)
    const [calYear, setCalYear] = useState(Number(lastDate.slice(0,4)))
    const [calMonth, setCalMonth]= useState(Number(lastDate.slice(5,7))-1)
    function monthDays(year, monthIndex){
      const end = new Date(year, monthIndex+1, 0).getDate()
      const arr=[]
      for(let d=1; d<=end; d++) arr.push(new Date(year, monthIndex, d).toISOString().slice(0,10))
      return arr
    }
    const calDates = useMemo(()=> monthDays(calYear, calMonth), [calYear, calMonth])

    const dailyRetMap = useMemo(()=>{
      const m=new Map()
      // map equity trading by date for returns
      const e = equitySeriesHL
      for(let i=1;i<e.length;i++){
        const p=e[i-1].equity_trading, c=e[i].equity_trading
        m.set(e[i].date, p>0? (c-p)/p : 0)
      }
      return m
    },[equitySeriesHL])

    const monthDDMap = useMemo(()=>{
      const ym = `${calYear}-${String(calMonth+1).padStart(2,'0')}`
      const pts = equitySeriesHL.filter(p=>p.date.startsWith(ym))
      let peak=-Infinity; const m=new Map()
      for(const p of pts){ peak=Math.max(peak, p.equity_trading); m.set(p.date, (p.equity_trading-peak)/peak) }
      return m
    },[equitySeriesHL, calYear, calMonth])

    const ymNow = `${calYear}-${String(calMonth+1).padStart(2,'0')}`
    const monthTradesPnl = useMemo(()=> filtered
      .filter(t=>t.date.startsWith(ymNow))
      .reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, ymNow, displayCcy, rates])

    const yearTradesPnl = useMemo(()=> filtered
      .filter(t=>t.date.startsWith(String(calYear)))
      .reduce((s,t)=> s + convert(t.pnl, t.ccy, displayCcy), 0), [filtered, calYear, displayCcy, rates])

    const calVerdict = (dd)=> {
      if(dd==null) return ''
      // dd négatif : dd <= -2% rouge, -2% < dd <= -1% orange, > -1% vert
      if(dd <= -0.02) return 'halo-bad'
      if(dd <= -0.01) return 'halo-warn'
      return 'halo-good'
    }

    const monthLabel = useMemo(()=>{
      const dt=new Date(calYear, calMonth, 1)
      return dt.toLocaleDateString(undefined,{ month:'long', year:'numeric' })
    },[calYear, calMonth])

    /* ==================== Win rate donut (centré) ==================== */
    const totalTrades = filtered.length
    const losers = totalTrades - wins

    /* ==================== Correlation entre stratégies ==================== */
    const corrMatrix = useMemo(()=>{
      const byDateStrat = new Map()
      for(const t of filtered){
        const d=t.date, s=t.strategy||'—'
        const v=convert(t.pnl, t.ccy||'USD', displayCcy)
        if(!byDateStrat.has(d)) byDateStrat.set(d, new Map())
        const m=byDateStrat.get(d); m.set(s,(m.get(s)||0)+v)
      }
      const labels = Array.from(new Set(filtered.map(t=>t.strategy||'—'))).sort()
      if(labels.length<2) return { labels, matrix:[] }
      const series={}; labels.forEach(s=> series[s]=[])
      const dates=Array.from(byDateStrat.keys()).sort()
      for(const d of dates){
        const m=byDateStrat.get(d)
        for(const s of labels) series[s].push(m?.get(s) ?? 0)
      }
      const matrix = labels.map(si => labels.map(sj => pearson(series[si], series[sj])))
      return { labels, matrix }
    },[filtered, displayCcy, rates])

    const corrCellStyle = (v)=>{
      if(!Number.isFinite(v)) return { background:'transparent' }
      const a = Math.min(0.45, Math.abs(v)*0.45)
      if(v <= -0.3) return { background:`rgba(32,227,214,${a})` }   // vert = bon (décorrélé/anti-corrélé)
      if(v >=  0.3) return { background:`rgba(255,95,162,${a})` }    // rose = mauvais (corrélations fortes)
      return { background:`rgba(255,159,67,.28)` }                   // orange = neutre
    }

    /* ==================== Export CSV ==================== */
    const exportCSV = ()=>{
      const header=['date','asset','broker','strategy',`pnl_${displayCcy}`,`mfe_${displayCcy}`,`mae_${displayCcy}`, 'commission', 'swap']
      const rows = filtered.map(t=>[
        t.date, t.asset, t.broker, t.strategy,
        convert(t.pnl,t.ccy,displayCcy).toFixed(2),
        convert(t.mfe??0,t.ccy,displayCcy).toFixed(2),
        convert(t.mae??0,t.ccy,displayCcy).toFixed(2),
        convert(t.commission??0,t.ccy,displayCcy).toFixed(2),
        convert(t.swap??0,t.ccy,displayCcy).toFixed(2),
      ])
      const csv = [header, ...rows].map(r=>r.join(',')).join('\n')
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'})
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a'); a.href=url; a.download=`trades_filtres_${displayCcy}.csv`; a.click()
      URL.revokeObjectURL(url)
    }

    /* ==================== Formulaire flux ==================== */
    const [showForm, setShowForm] = useState(false)
    const [flow, setFlow] = useState({
      date: new Date().toISOString().slice(0,10),
      type: 'darwin_mgmt_fee',
      amount: '', ccy: displayCcy, note: ''
    })
    useEffect(()=>{ setFlow(f=>({...f, ccy:displayCcy})) },[displayCcy])

    const flowTypes = [
      { value:'darwin_mgmt_fee',  label:'Darwinex — Management Fee' },
      { value:'prop_payout',      label:'Prop Firm — Payout' },
      { value:'prop_fee',         label:'Prop Firm — Fee Challenge' },
      { value:'deposit',          label:'Dépôt' },
      { value:'withdrawal',       label:'Retrait' },
      { value:'business_expense', label:'Charge Business' },
      { value:'other_income',     label:'Autre Revenu' }
    ]
    const submitFlow = (e)=>{
      e.preventDefault()
      const amt=Number(flow.amount)
      if(!flow.date || !flow.type || isNaN(amt)){ alert('Merci de compléter Date / Type / Montant'); return }
      const row = { date:flow.date, type:flow.type, amount:amt, ccy:flow.ccy||displayCcy, note:flow.note||'' }
      setUserCashflows(prev=> prev.concat([row]))
      setShowForm(false)
      setFlow({ date:new Date().toISOString().slice(0,10), type:'darwin_mgmt_fee', amount:'', ccy:displayCcy, note:'' })
    }

    /* ==================== UI Helpers ==================== */
    const kpiHaloByPnl = (p)=> p>0?'halo-good': p<0?'halo-bad':'halo-warn'
    const kpiHaloByDDpct=(dd)=> dd<15?'halo-good': dd<=20?'halo-warn':'halo-bad'
    const monthNext = ()=>{ let m=calMonth+1, y=calYear; if(m>11){m=0;y++} setCalMonth(m); setCalYear(y) }
    const monthPrev = ()=>{ let m=calMonth-1, y=calYear; if(m<0){m=11;y--} setCalMonth(m); setCalYear(y) }

    /* ==================== RENDER ==================== */
    return (
      <div style={{ minHeight:'100vh', background:C.bg, color:C.text, padding:20, maxWidth:1540, margin:'0 auto' }}>
        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, gap:12 }}>
          <div>
            <h1 style={{ color:C.white, fontWeight:400, margin:0, fontSize:28 }}>ZooProjectVision — Control Center</h1>
            {!editingSubtitle ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <p style={{ color:C.muted, fontSize:12, margin:'4px 0' }}>{subtitle}</p>
                <button className="btn sm ghost" onClick={()=>setEditingSubtitle(true)} title="modifier le sous-titre">✎</button>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input className="sel" style={{ width:420 }} value={subtitle} onChange={e=>setSubtitle(e.target.value)} placeholder="Sous-titre…" />
                <button className="btn sm" onClick={()=>setEditingSubtitle(false)}>OK</button>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {/* Import CSV */}
            <label className="btn sm ghost" style={{ position:'relative' }}>
              Importer Trades CSV
              <input type="file" accept=".csv" style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}
                onChange={e=>{
                  const f=e.target.files?.[0]; if(!f) return
                  const fr=new FileReader()
                  fr.onload=()=>{
                    const rows=parseCSV(String(fr.result))
                    const mapped=mapMT5Rows(rows)
                    if(!mapped.length){ alert('CSV non reconnu. Vérifie Time/Symbol/Profit (+ MFE/MAE si dispo).'); return }
                    setUserTrades(prev=>prev.concat(mapped))
                  }
                  fr.readAsText(f)
                }}
              />
            </label>
            <button className="btn sm ghost" onClick={()=>window.location.reload()}>Actualiser</button>
            <button className="btn sm ghost" onClick={resetFilters}>Réinitialiser</button>
            <button className="btn sm ghost" onClick={()=>setShowForm(true)}>Ajouter Flux</button>
            <button className="btn sm ghost" onClick={exportCSV}>Export CSV</button>

            {/* Devise (sans titre) */}
            <select className="sel" value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)}>
              {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* FILTRES */}
        <div className="card" style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:10 }}>
          <div><div className="label">Actif</div>
            <select value={asset} onChange={e=>setAsset(e.target.value)} className="sel"><option>All</option>{assets.map(a=><option key={a} value={a}>{a}</option>)}</select>
          </div>
          <div><div className="label">Broker</div>
            <select value={broker} onChange={e=>setBroker(e.target.value)} className="sel"><option>All</option>{brokers.map(b=><option key={b} value={b}>{b}</option>)}</select>
          </div>
          <div><div className="label">Stratégie</div>
            <select value={strategy} onChange={e=>setStrategy(e.target.value)} className="sel"><option>All</option>{strategies.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><div className="label">Du</div><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="sel" /></div>
          <div><div className="label">Au</div><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="sel" /></div>
          <div />
          <div />
        </div>

        {/* KPI PRINCIPAUX (avec halos verdict) */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:12, marginTop:12 }}>
          <div className="card halo-good">
            <div className="kpi-title title-caps">Capital Initial</div>
            <div className="val">{fmt(capitalInitialDisp)}</div>
          </div>
          <div className={`card ${kpiHaloByPnl(cashFlowTotal)}`}>
            <div className="kpi-title title-caps">Cash Flow</div>
            <div className="val" style={{ color: cashFlowTotal>=0?C.pos:C.neg }}>{fmt(cashFlowTotal)}</div>
          </div>
          <div className={`card ${kpiHaloByPnl(totalPnlDisp)}`}>
            <div className="kpi-title title-caps">PNL (Filtré)</div>
            <div className="val" style={{ color: totalPnlDisp>=0?C.pos:C.neg }}>{fmt(totalPnlDisp)}</div>
          </div>
          <div className="card">
            <div className="kpi-title title-caps">Capital Global</div>
            <div className="val">{fmt(capitalGlobal)}</div>
          </div>
          <div className={`card ${kpiHaloByDDpct(maxDDPct)}`}>
            <div className="kpi-title title-caps">Max DD (%)</div>
            <div className="val">{maxDDPct.toFixed(2)}%</div>
          </div>
          <div className={`card ${kpiHaloByDDpct(maxDDPct)}`}>
            <div className="kpi-title title-caps">Max DD (Montant)</div>
            <div className="val">{fmt(maxDDAbs)}</div>
          </div>
          <div className="card">
            <div className="kpi-title title-caps">Capital Tiers (Info)</div>
            <div className="val">
              {fmt(capitalTiers)}{' '}
              <button className="btn sm ghost" title="éditer"
                onClick={()=>{
                  const v = prompt('Capital tiers (même devise que l’affichage)', String(capitalTiers||0))
                  if(v==null) return
                  const n=Number(v); if(!isFinite(n)) return
                  setCapitalTiers(n)
                }}>✎</button>
            </div>
          </div>
        </div>

        {/* KPI RATIOS (neutre gris) */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12, marginTop:12 }}>
          <div className="card"><div className="kpi-title title-caps">Win Rate</div><div className="val muted">{wr.toFixed(2)}%</div></div>
          <div className="card"><div className="kpi-title title-caps">Risk/Reward (RR)</div><div className="val muted">{rr.toFixed(2)}</div></div>
          <div className="card"><div className="kpi-title title-caps">Expectancy / Trade</div><div className="val muted">{fmt(expectancy)}</div></div>
          <div className="card"><div className="kpi-title title-caps">Sharpe (Ann.)</div><div className="val muted">{sharpe.toFixed(2)}</div></div>
          <div className="card"><div className="kpi-title title-caps">Sortino (Ann.)</div><div className="val muted">{sortino.toFixed(2)}</div></div>
          <div className="card"><div className="kpi-title title-caps">Recovery Factor</div><div className="val muted">{recoveryFactor.toFixed(2)}</div></div>
        </div>

        {/* KPI OPÉRATIONNELS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:12 }}>
          <div className="card"><div className="kpi-title title-caps">Total Trades</div><div className="val muted">{totalTrades}</div></div>
          <div className="card"><div className="kpi-title title-caps">Jours Actifs</div><div className="val muted">{activeDays}</div></div>
          <div className="card"><div className="kpi-title title-caps">Durée Moyenne</div><div className="val muted">{avgTradeDurationMin.toFixed(0)} min</div></div>
          <div className="card"><div className="kpi-title title-caps">Equity Peak / Trough</div><div className="val muted">{fmt(peakEquity)} / {fmt(troughEquity)}</div></div>
        </div>
        {/* WIN RATE — Donut centré + Gagnants/Perdants */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
          <div className="card" style={{ height:260, position:'relative' }}>
            <div className="kpi-title title-caps">Win Rate (Donut)</div>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={[
                    { name:'Gagnants', value: wins },
                    { name:'Perdants', value: Math.max(0, losers) }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70} outerRadius={100}
                  stroke="none"
                >
                  <Cell key="w" fill="var(--green)" />
                  <Cell key="l" fill="var(--pink)" />
                </Pie>
                <Tooltip
                  contentStyle={{ background:C.panel, border:`1px solid var(--border)`, color:C.text, borderRadius:10 }}
                  labelStyle={{ color:C.text }} itemStyle={{ color:C.text }}
                  formatter={(v,n)=>[fmtNum(v), n]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Label centré */}
            <div style={{
              position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none'
            }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, color:C.white }}>{wr.toFixed(1)}%</div>
                <div className="muted" style={{ fontSize:12 }}>Win Rate</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="kpi-title title-caps">Gagnants / Perdants</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="card">
                <div className="kpi-title">Gagnants</div>
                <div className="val" style={{ color:C.pos }}>{wins}</div>
              </div>
              <div className="card">
                <div className="kpi-title">Perdants</div>
                <div className="val" style={{ color:C.neg }}>{losers}</div>
              </div>
            </div>
            <div style={{ marginTop:8, fontSize:12, color:C.muted }}>Total: {totalTrades}</div>
          </div>
        </div>

        {/* COURBE — Équité / PnL Global / Stratégies */}
        <div className="card" style={{height:460, marginTop:16}}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div className="kpi-title title-caps">
              {curveView==='equity' && 'Courbe D’Équité (Trading Seul / Avec Flux)'}
              {curveView==='pnl'    && 'PnL Global — Cumul (Base 0)'}
              {curveView==='strats' && 'PnL Par Stratégie — Cumul (Base 0)'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button className={`btn sm ${curveView==='equity'?'halo-good':''}`} onClick={()=>setCurveView('equity')}>Équité</button>
              <button className={`btn sm ${curveView==='pnl'?'halo-warn':''}`} onClick={()=>setCurveView('pnl')}>PnL Global</button>
              <button className={`btn sm ${curveView==='strats'?'halo-warn':''}`} onClick={()=>setCurveView('strats')}>Stratégie(s)</button>
              {curveView==='equity' && (
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.muted, marginLeft:6 }}>
                  <input type="checkbox" checked={showFlows} onChange={e=>setShowFlows(e.target.checked)} />
                  afficher « avec flux »
                </label>
              )}
            </div>
          </div>

          {/* Vue Équité */}
          {curveView==='equity' && (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={equitySeriesHL} margin={{ left:8, right:8, top:8, bottom:8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke:C.axis }} tick={{ fontSize:'var(--axis-font-size)' }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke:C.axis }} tick={{ fontSize:'var(--axis-font-size)' }} />
                <Tooltip contentStyle={{ background:C.panel, border:`1px solid var(--border)`, color:C.text, borderRadius:10 }} labelStyle={{color:C.text}} itemStyle={{color:C.text}} formatter={(v,n)=>[fmt(v), n]} />
                <Legend wrapperStyle={{ color:C.text }} />
                <Line type="monotone" dataKey="equity_trading" name="Équité (trading seul)" dot={false} stroke={C.white} strokeWidth={1.8} isAnimationActive={false} />
                {showFlows && (<Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#8a8f94" strokeWidth={1.4} strokeDasharray="5 4" />)}
                <Line type="monotone" dataKey="hwm" name="Plus Haut (HWM)" dot={false} stroke={C.pos} strokeWidth={1.2} strokeDasharray="4 3" />
                <Line type="monotone" dataKey="lwm" name="Plus Bas (LWM)" dot={false} stroke={C.neg} strokeWidth={1.2} strokeDasharray="4 3" />
                {showFlows && cashflowsInRange.map((c,i)=>{
                  const p = equitySeriesHL.find(x=>x.date===c.date)
                  const y = p? p.equity_with_flows : null
                  const color = c.amount>=0 ? C.pos : C.neg
                  return (y!=null) ? <ReferenceDot key={'cf'+i} x={c.date} y={y} r={4} fill={color} stroke="none" /> : null
                })}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Vue PnL global */}
          {curveView==='pnl' && (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={pnlCumulative} margin={{ left:8, right:8, top:8, bottom:8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke:C.axis }} tick={{ fontSize:'var(--axis-font-size)' }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke:C.axis }} tick={{ fontSize:'var(--axis-font-size)' }} />
                <Tooltip contentStyle={{ background:C.panel, border:`1px solid var(--border)`, color:C.text, borderRadius:10 }} labelStyle={{color:C.text}} itemStyle={{color:C.text}} formatter={(v)=>[fmt(v),'PnL cumul']} />
                <Legend wrapperStyle={{ color:C.text }} />
                <Line type="monotone" dataKey="pnl_cum" name="PnL cumul (base 0)" dot={false} stroke={C.white} strokeWidth={1.8} />
                <ReferenceLine y={0} stroke={C.axis} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Vue PnL par stratégie */}
          {curveView==='strats' && (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={stratPnlSeries.rows} margin={{ left:8, right:8, top:8, bottom:8 }}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke:C.axis }} tick={{ fontSize:'var(--axis-font-size)' }} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke:C.axis }} tick={{ fontSize:'var(--axis-font-size)' }} />
                <Tooltip contentStyle={{ background:C.panel, border:`1px solid var(--border)`, color:C.text, borderRadius:10 }} labelStyle={{color:C.text}} itemStyle={{color:C.text}} formatter={(v,n)=>[fmt(v), n]} />
                <Legend wrapperStyle={{ color:C.text }} />
                {stratPnlSeries.strats.map((s,i)=>(
                  <Line key={s} type="monotone" dataKey={s} name={s} dot={false} stroke={stratPalette[i%stratPalette.length]} strokeWidth={1.3} />
                ))}
                <ReferenceLine y={0} stroke={C.axis} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* MFE/MAE — Quotidien (moyenne) */}
        <div className="card" style={{height:360, marginTop:16}}>
          <div className="kpi-title title-caps">MFE / MAE — Quotidien (Moyenne)</div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{left:8,right:8,top:8,bottom:8}}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tick={{ fontSize:'var(--axis-font-size)' }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tick={{ fontSize:'var(--axis-font-size)' }} />
              <Tooltip
                contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}}
                formatter={(v,n)=>[
                  fmt(v),
                  n==='avgMFE' ? 'MFE Moyen' : 'MAE Moyen'
                ]}
              />
              <Legend wrapperStyle={{ color:C.text }} />
              <Line type="monotone" dataKey="avgMFE" name="MFE Moyen" dot={false} stroke={C.pos} strokeWidth={2} />
              <Line type="monotone" dataKey="avgMAE" name="MAE Moyen" dot={false} stroke={C.neg} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MFE/MAE — Cumul */}
        <div className="card" style={{height:360, marginTop:16}}>
          <div className="kpi-title title-caps">Cumul MFE / MAE</div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{left:8,right:8,top:8,bottom:8}}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tick={{ fontSize:'var(--axis-font-size)' }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tick={{ fontSize:'var(--axis-font-size)' }} />
              <Tooltip
                contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}}
                formatter={(v,n)=>[
                  fmt(v),
                  n==='cumMFE' ? 'Cumul MFE' : 'Cumul MAE'
                ]}
              />
              <Legend wrapperStyle={{ color:C.text }} />
              <Line type="monotone" dataKey="cumMFE" name="Cumul MFE" dot={false} stroke={C.pos} strokeWidth={2.2} />
              <Line type="monotone" dataKey="cumMAE" name="Cumul MAE" dot={false} stroke={C.neg} strokeWidth={2.2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TABLEAUX GAINS / PERTES — Heures / Jours / Mois */}
        <div className="card" style={{ marginTop:16 }}>
          <div className="kpi-title title-caps">Tableaux — Gains / Pertes (Filtrés)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {/* Heures */}
            <div className="mini">
              <div className="label">Par heure (00 → 23)</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="table-compact">
                  <thead>
                    <tr><th>heure</th><th className="right">gains</th><th className="right">pertes</th><th className="right">net</th></tr>
                  </thead>
                  <tbody>
                    {aggHours.map((r,i)=>(
                      <tr key={i} className={verdictClassByNet(r.net)}>
                        <td className="muted">{r.label}</td>
                        <td className="right" style={{color:'var(--green)'}}>{fmt(r.gain)}</td>
                        <td className="right" style={{color:'var(--pink)'}}>{fmt(r.loss)}</td>
                        <td className="right">{fmt(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Jours */}
            <div className="mini">
              <div className="label">Par jour (lun → dim)</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="table-compact">
                  <thead>
                    <tr><th>jour</th><th className="right">gains</th><th className="right">pertes</th><th className="right">net</th></tr>
                  </thead>
                  <tbody>
                    {aggWeek.map((r,i)=>(
                      <tr key={i} className={verdictClassByNet(r.net)}>
                        <td className="muted">{r.label}</td>
                        <td className="right" style={{color:'var(--green)'}}>{fmt(r.gain)}</td>
                        <td className="right" style={{color:'var(--pink)'}}>{fmt(r.loss)}</td>
                        <td className="right">{fmt(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Mois */}
            <div className="mini">
              <div className="label">Par mois (jan → déc)</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="table-compact">
                  <thead>
                    <tr><th>mois</th><th className="right">gains</th><th className="right">pertes</th><th className="right">net</th></tr>
                  </thead>
                  <tbody>
                    {aggMonths.map((r,i)=>(
                      <tr key={i} className={verdictClassByNet(r.net)}>
                        <td className="muted">{r.label}</td>
                        <td className="right" style={{color:'var(--green)'}}>{fmt(r.gain)}</td>
                        <td className="right" style={{color:'var(--pink)'}}>{fmt(r.loss)}</td>
                        <td className="right">{fmt(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* MATRICE DE CORRÉLATION */}
        <div className="card" style={{ marginTop:16 }}>
          <div className="kpi-title title-caps">Corrélation (PnL/Jour) Entre Stratégies</div>
          {(!corrMatrix.matrix.length || corrMatrix.labels.length<2) ? (
            <div className="muted">Pas assez de stratégies pour calculer une matrice (min. 2).</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="table-compact">
                <thead>
                  <tr>
                    <th style={{ width:140 }}>Stratégie</th>
                    {corrMatrix.labels.map((h,i)=><th key={i} className="right">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {corrMatrix.matrix.map((row, rIdx)=>(
                    <tr key={rIdx}>
                      <td className="muted">{corrMatrix.labels[rIdx]}</td>
                      {row.map((v,cIdx)=>(
                        <td key={cIdx} style={{ textAlign:'right', ...corrCellStyle(v) }}>
                          {Number.isFinite(v) ? v.toFixed(2) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CALENDRIER */}
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div className="kpi-title title-caps">Calendrier / {monthLabel}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn sm ghost" onClick={monthPrev}>◀</button>
              <button className="btn sm ghost" onClick={monthNext}>▶</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, color:C.muted, fontSize:12, margin:'4px 0 10px' }}>
            <span>Mensuel (trading) : <span style={{color: monthTradesPnl>=0?C.pos:C.neg}}>{fmt(monthTradesPnl)}</span></span>
            <span>Annuel (trading) : <span style={{color: yearTradesPnl>=0?C.pos:C.neg}}>{fmt(yearTradesPnl)}</span></span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>
              <div key={d} style={{textAlign:'center', color:C.muted, fontSize:12}}>{d}</div>
            )}
            {calDates.map(dt=>{
              const ret = dailyRetMap.get(dt)
              const dd  = monthDDMap.get(dt)
              const bg = ret==null ? '#0f0f10' : (ret>=0 ? 'rgba(32,227,214,0.15)' : 'rgba(255,95,162,0.15)')
              return (
                <div key={dt} className={calVerdict(dd)} style={{padding:'10px 8px', border:'1px solid #2a2a2a', borderRadius:8, background:bg}}>
                  <div style={{fontSize:11, opacity:.9}}>{Number(dt.slice(8,10))}</div>
                  <div style={{fontSize:12, color: ret>=0 ? C.pos : C.neg}}>
                    {ret!=null ? `${(ret*100).toFixed(2)}%` : '—'}
                  </div>
                  <div style={{fontSize:11, color:'#bfc5c9'}}>
                    {dd!=null ? `${Math.abs(dd*100).toFixed(2)}%` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MODAL — Ajouter un flux */}
        {showForm && (
          <div className="modal-overlay" onClick={()=>setShowForm(false)}>
            <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:14, color: C.text }}>Ajouter Un Flux</div>
                <button className="btn sm ghost" onClick={()=>setShowForm(false)}>Fermer</button>
              </div>
              <form onSubmit={submitFlow} style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(2,1fr)' }}>
                <label className="form-label"><span>Type</span>
                  <select value={flow.type} onChange={e=>setFlow(f=>({...f, type:e.target.value}))} className="sel">
                    {flowTypes.map(t=> <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="form-label"><span>Date</span>
                  <input type="date" value={flow.date} onChange={e=>setFlow(f=>({...f, date:e.target.value}))} className="sel" />
                </label>
                <label className="form-label"><span>Devise</span>
                  <select value={flow.ccy} onChange={e=>setFlow(f=>({...f, ccy:e.target.value}))} className="sel">
                    {['USD','EUR','CHF'].map(c=> <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-label"><span>Montant</span>
                  <input type="number" step="0.01" placeholder="ex: 250.00" value={flow.amount}
                         onChange={e=>setFlow(f=>({...f, amount:e.target.value}))} className="sel" />
                </label>
                <label className="form-label" style={{ gridColumn:'1 / -1' }}><span>Note</span>
                  <input type="text" placeholder="optionnel" value={flow.note}
                         onChange={e=>setFlow(f=>({...f, note:e.target.value}))} className="sel" />
                </label>
                <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8 }}>
                  <button type="button" className="btn sm ghost" onClick={()=>setShowForm(false)}>Annuler</button>
                  <button type="submit" className="btn sm">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    )
  } catch(e){
    console.error(e)
    return <div style={{ color:'#ff5fa2', padding:16 }}>Erreur dans App.jsx : {String(e.message || e)}</div>
  }
}

/* ================== Helpers calcul & CSV (après le composant) ================== */
function mean(a){ if(!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
function stddev(a){ if(!a.length) return 0; const m=mean(a); const v=mean(a.map(x=>(x-m)*(x-m))); return Math.sqrt(v) }
function pearson(a,b){
  const n=Math.min(a.length,b.length); if(n===0) return 0
  const ax=a.slice(0,n), bx=b.slice(0,n); const ma=mean(ax), mb=mean(bx)
  let num=0, da=0, db=0
  for(let i=0;i<n;i++){ const x=ax[i]-ma, y=bx[i]-mb; num+=x*y; da+=x*x; db+=y*y }
  const den=Math.sqrt(da*db); return den>0? num/den : 0
}

function parseCSV(text){
  const lines = String(text||'').trim().split(/\r?\n/); if(!lines.length) return []
  const headers = lines.shift().split(',').map(h=>h.trim().replace(/^"|"$/g,''))
  const rows=[]
  for(const line of lines){
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
    const obj={}
    headers.forEach((h,i)=> obj[h]=(cols[i]||'').replace(/^"|"$/g,''))
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
    const commission = Number(r['Commission'] || r['Commission, USD'] || r['Commissions'] || 0)
    const swap = Number(r['Swap'] || r['Storage'] || 0)
    return {
      date, asset, broker, strategy,
      pnl: Number((pnl||0).toFixed(2)), ccy:'USD',
      open_time: openTime, close_time: closeTime,
      mfe: Number((Math.abs(mfeRaw)||0).toFixed(2)),
      mae: Number((Math.abs(maeRaw)||0).toFixed(2)),
      commission: Number((commission||0).toFixed(2)),
      swap: Number((swap||0).toFixed(2)),
    }
  }).filter(r=>r.date)
}
