// src/App.jsx — V5 (basé V4.3.1) — PARTIE 1/3
import React, { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, ReferenceLine, ReferenceDot,
  AreaChart, Area
} from 'recharts'

export default function App(){
  try{
    /* ====================== Thème / Couleurs ====================== */
    const C = {
      bg: '#0a0a0b',
      panel: '#141414',
      border: '#242424',
      axis: '#b6bcc1',          // gris très clair pour axes
      text: '#e8ecef',          // gris clair global
      muted: '#c8d0d6',         // gris plus pâle pour labels
      white: '#ffffff',
      pos: '#20e3d6',           // vert gloss
      pos2:'#18b8ad',
      neg: '#ff5fa2',           // rose gloss
      neg2:'#ff7cbf',
      orange: '#ff9f43'         // neutre/mitigé
    }

    /* ====================== Helpers num & stats ====================== */
    function round2(x){ return Math.round((x??0)*100)/100 }
    function mean(a){ if(!a||!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
    function stddev(a){ if(!a||!a.length) return 0; const m=mean(a); const v=mean(a.map(x=>(x-m)*(x-m))); return Math.sqrt(v) }
    function clamp(x, a=0, b=1){ return Math.min(b, Math.max(a, x)) }
    function mapTo01(value, [good, warn, bad]){
      if (value <= good) return 0
      if (value >= bad) return 1
      if (value <= warn) return (value - good) / (warn - good) * 0.5
      return 0.5 + (value - warn) / (bad - warn) * 0.5
    }
    function hhi(weights){ const s=weights.reduce((a,b)=>a+b,0)||1; return weights.map(w=>w/s).reduce((a,p)=>a+p*p,0) }
    function edgeIndex(wr, rr){ const w=clamp(wr/100,0,1); return w*rr - (1-w) }
    function projectPnL(dailyRets, days){
      if (!dailyRets.length || days<=0) return { median:0, p10:0, p90:0 }
      const mu = mean(dailyRets), sd = stddev(dailyRets)
      const m = mu * days, s = sd * Math.sqrt(days)
      return { median:m, p10:m+(-1.2816)*s, p90:m+(1.2816)*s }
    }
    function probHitDD(targetDD, equitySeries){
      if (!equitySeries || equitySeries.length < 3) return 0
      let peak = equitySeries[0].equity_trading || 0, worst = 0
      for (const p of equitySeries){
        const eq = p.equity_trading || 0
        peak = Math.max(peak, eq)
        const dd = peak>0 ? (peak - eq)/peak : 0
        worst = Math.max(worst, dd)
      }
      if (worst >= Math.abs(targetDD)) return 0.5
      const gap = Math.abs(targetDD) - worst
      return clamp(0.2 - gap*0.5, 0, 0.2)
    }
    function rollWindow(arr, idxFrom, days){
      if (!arr.length) return []
      const end = new Date(arr[idxFrom].date)
      const start = new Date(end); start.setDate(start.getDate()-days+1)
      const s = start.toISOString().slice(0,10), e = end.toISOString().slice(0,10)
      return arr.filter(r=> r.date>=s && r.date<=e)
    }

    /* ====================== Démo data ====================== */
    const ASSETS = ['XAUUSD','DAX','US500','USTEC','US30']
    const BROKERS = ['Darwinex','ICMarkets','Pepperstone']
    const STRATS = ['Strategy 1','Strategy 2','Breakout']

    const demoTrades = useMemo(()=>{
      const rows=[]
      const today = new Date()
      for(let i=120;i>=1;i--){
        const d = new Date(today); d.setDate(d.getDate()-i)
        const date = d.toISOString().slice(0,10)
        for(let k=0;k<6;k++){
          const asset = ASSETS[(i+k)%ASSETS.length]
          const broker= BROKERS[(i+k*2)%BROKERS.length]
          const strategy= STRATS[(i+k*3)%STRATS.length]
          let pnl = (Math.random()-0.5)*(Math.random()<0.15? 2500 : 900)
          pnl = Number(pnl.toFixed(2))
          const openH = Math.floor(Math.random()*24)
          const openM = Math.floor(Math.random()*60)
          const open = new Date(d.getFullYear(), d.getMonth(), d.getDate(), openH, openM)
          const durMin = 15 + Math.floor(Math.random()*(60*8))
          const close = new Date(open.getTime()+durMin*60000)
          const mfe = Number((Math.abs(pnl)*(0.8+Math.random()*0.8)).toFixed(2))
          const mae = Number((Math.abs(pnl)*(0.6+Math.random()*0.8)).toFixed(2))
          rows.push({
            date,
            asset, broker, strategy,
            pnl, ccy:'USD',
            open_time: open.toISOString(),
            close_time: close.toISOString(),
            mfe, mae,
            // commissions/swaps demo:
            commission: Number((Math.abs(pnl)*-0.002).toFixed(2)),
            swap: Number((Math.random()<0.3? -1 : 0)*Math.random()*3).toFixed(2)*1
          })
        }
      }
      return rows
    },[])

    const CAPITAL_INITIAL_USD = 100000
    const demoCash = [
      { date:'2025-01-05', type:'deposit', amount: 2000, ccy:'USD', note:'Apport' },
      { date:'2025-02-10', type:'prop_fee', amount: -500, ccy:'USD', note:'Prop challenge' },
      { date:'2025-03-15', type:'prop_payout', amount: 1000, ccy:'USD', note:'Payout prop' },
      { date:'2025-04-02', type:'darwin_mgmt_fee', amount: 250, ccy:'USD', note:'Darwinex fee' },
      { date:'2025-05-20', type:'withdrawal', amount: -800, ccy:'USD', note:'Retrait' }
    ]

    /* ====================== État, imports & persistance ====================== */
    const [userTrades, setUserTrades] = useState([])
    const [userCashflows, setUserCashflows] = useState(()=>{
      const raw = localStorage.getItem('zp_cashflows_custom')
      return raw ? JSON.parse(raw) : []
    })
    useEffect(()=>{ localStorage.setItem('zp_cashflows_custom', JSON.stringify(userCashflows)) }, [userCashflows])

    const tradesAll = useMemo(()=> demoTrades.concat(userTrades), [demoTrades, userTrades])
    const allCashflows = useMemo(()=> demoCash.concat(userCashflows), [userCashflows])

    /* ====================== Filtres ====================== */
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
      if (asset!=='All' && t.asset!==asset) return false
      if (broker!=='All' && t.broker!==broker) return false
      if (strategy!=='All' && t.strategy!==strategy) return false
      if (dateFrom && t.date < dateFrom) return false
      if (dateTo && t.date > dateTo) return false
      return true
    }), [tradesAll, asset, broker, strategy, dateFrom, dateTo])

    /* ====================== Devises (USD/EUR/CHF) ====================== */
    const [displayCcy, setDisplayCcy] = useState('USD')
    const fxFallback = {
      USD:{USD:1, EUR:0.93, CHF:0.88},
      EUR:{USD:1/0.93, EUR:1, CHF:0.88/0.93},
      CHF:{USD:1/0.88, EUR:0.93/0.88, CHF:1}
    }
    const [rates, setRates] = useState(null)
    useEffect(()=>{
      const key='fx_cache_v1'
      const cached = localStorage.getItem(key)
      const now = Date.now()
      if (cached){
        const {at, data} = JSON.parse(cached)
        if (now-at < 24*3600*1000){ setRates(data); return }
      }
      fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF')
        .then(r=>r.json())
        .then(j=>{
          const data = {
            USD:{USD:1, EUR:j?.rates?.EUR??0.93, CHF:j?.rates?.CHF??0.88},
            EUR:{USD:1/(j?.rates?.EUR??0.93), EUR:1, CHF:(j?.rates?.CHF??0.88)/(j?.rates?.EUR??0.93)},
            CHF:{USD:1/(j?.rates?.CHF??0.88), EUR:(j?.rates?.EUR??0.93)/(j?.rates?.CHF??0.88), CHF:1}
          }
          setRates(data)
          localStorage.setItem(key, JSON.stringify({at: now, data}))
        }).catch(()=>{})
    },[])
    function convert(val, from='USD', to=displayCcy){
      if (val==null) return 0
      if (from===to) return round2(val)
      const table = rates || fxFallback
      const r = (table[from] && table[from][to]) ? table[from][to] : 1
      return round2(val * r)
    }
    function fmt(v, ccy=displayCcy){
      try{
        return new Intl.NumberFormat(undefined, {style:'currency', currency:ccy, minimumFractionDigits:2, maximumFractionDigits:2}).format(v??0)
      }catch{ return `${(v??0).toFixed(2)} ${ccy}` }
    }

    /* ====================== Cashflows (filtrés & cumul) ====================== */
    const cashflowsInRange = useMemo(()=>{
      const list = allCashflows.filter(c=>{
        if (dateFrom && c.date < dateFrom) return false
        if (dateTo && c.date > dateTo) return false
        return true
      })
      return list.map(c=> ({ ...c, amount_disp: convert(c.amount, c.ccy||'USD', displayCcy) }))
    }, [allCashflows, dateFrom, dateTo, displayCcy, rates])

    const cashFlowTotal = useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0), [cashflowsInRange])
    const capitalInitialDisp = useMemo(()=> convert(CAPITAL_INITIAL_USD,'USD',displayCcy), [displayCcy, rates])
    const capitalBase = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp, cashFlowTotal])

    /* ====================== KPI principaux ====================== */
    const totalPnlDisp = useMemo(()=> filtered.reduce((s,t)=> s + convert(t.pnl, t.ccy||'USD', displayCcy), 0), [filtered, displayCcy, rates])
    const capitalGlobal = useMemo(()=> capitalBase + totalPnlDisp, [capitalBase, totalPnlDisp])

    const wins = filtered.filter(t=>t.pnl>0).length
    const wr = filtered.length ? (wins/filtered.length)*100 : 0
    const avgWin = (()=>{ const arr = filtered.filter(t=>t.pnl>0).map(t=>convert(t.pnl,t.ccy||'USD',displayCcy)); return arr.length? mean(arr):0 })()
    const avgLoss= (()=>{ const arr = filtered.filter(t=>t.pnl<0).map(t=>Math.abs(convert(t.pnl,t.ccy||'USD',displayCcy))); return arr.length? mean(arr):0 })()
    const rr = avgLoss>0 ? (avgWin/avgLoss) : (avgWin>0? Infinity : 0)
    const expectancy = useMemo(()=> filtered.length ? (totalPnlDisp/filtered.length) : 0, [totalPnlDisp, filtered.length])

    /* ====================== Équité — trading seul & avec flux ====================== */
    function sumPnlByDateDisp(rows){
      const m=new Map()
      for (const r of rows){
        const v = convert(r.pnl, r.ccy||'USD', displayCcy)
        m.set(r.date, (m.get(r.date)||0) + v)
      }
      return Array.from(m, ([date, pnl])=>({date,pnl})).sort((a,b)=>a.date.localeCompare(b.date))
    }
    const pnlByDate = useMemo(()=> sumPnlByDateDisp(filtered), [filtered, displayCcy, rates])

    const cashByDate = useMemo(()=>{
      const m=new Map()
      for (const c of cashflowsInRange) m.set(c.date, (m.get(c.date)||0) + (c.amount_disp||0))
      return Array.from(m, ([date, cash])=>({date, cash})).sort((a,b)=>a.date.localeCompare(b.date))
    }, [cashflowsInRange])

    const pnlMap = useMemo(()=>{ const m=new Map(); pnlByDate.forEach(p=>m.set(p.date,p.pnl)); return m }, [pnlByDate])
    const cashCumMap = useMemo(()=>{
      let cum=0; const m=new Map()
      for (const c of cashByDate){ cum += c.cash; m.set(c.date, round2(cum)) }
      return m
    }, [cashByDate])
    const mergedDates = useMemo(()=>{
      const s = new Set()
      pnlByDate.forEach(x=>s.add(x.date)); cashByDate.forEach(x=>s.add(x.date))
      return Array.from(s).sort((a,b)=>a.localeCompare(b))
    }, [pnlByDate, cashByDate])

    const equityMerged = useMemo(()=>{
      let eqTrading = capitalInitialDisp
      const out=[]
      for (const d of mergedDates){
        eqTrading += (pnlMap.get(d)||0)
        const cashCum = (cashCumMap.get(d)||0)
        out.push({
          date:d,
          equity_trading: round2(eqTrading),
          equity_with_flows: round2(eqTrading + cashCum)
        })
      }
      return out
    }, [mergedDates, pnlMap, cashCumMap, capitalInitialDisp])

    const equitySeriesHL = useMemo(()=>{
      let h=-Infinity, l=Infinity
      return equityMerged.map(p=>{
        h = Math.max(h, p.equity_trading)
        l = Math.min(l, p.equity_trading)
        return { ...p, hwm: round2(h), lwm: round2(l) }
      })
    }, [equityMerged])

    const { peakEquity, troughEquity, maxDDAbs } = useMemo(()=>{
      if (!equitySeriesHL.length) return { peakEquity:0, troughEquity:0, maxDDAbs:0 }
      let peakSeen = equitySeriesHL[0].equity_trading, maxDrop=0
      for (const p of equitySeriesHL){
        if (p.equity_trading > peakSeen) peakSeen = p.equity_trading
        const drop = peakSeen - p.equity_trading
        if (drop > maxDrop) maxDrop = drop
      }
      const pe = Math.max(...equitySeriesHL.map(e=>e.equity_trading))
      const tr = Math.min(...equitySeriesHL.map(e=>e.equity_trading))
      return { peakEquity: pe, troughEquity: tr, maxDDAbs: maxDrop }
    }, [equitySeriesHL])

    const dailyReturns = useMemo(()=>{
      const out=[]
      for (let i=1;i<equitySeriesHL.length;i++){
        const p=equitySeriesHL[i-1].equity_trading, c=equitySeriesHL[i].equity_trading
        out.push({ date: equitySeriesHL[i].date, ret: p>0? (c-p)/p : 0 })
      }
      return out
    }, [equitySeriesHL])

    const recoveryFactor = useMemo(()=>{
      const profitNet = (equitySeriesHL.at(-1)?.equity_trading || capitalInitialDisp) - capitalInitialDisp
      return maxDDAbs>0 ? (profitNet/maxDDAbs) : 0
    }, [equitySeriesHL, capitalInitialDisp, maxDDAbs])

    const sharpe = useMemo(()=>{
      const rets = dailyReturns.map(r=>r.ret)
      const mu = mean(rets), sd=stddev(rets)
      return sd>0 ? (mu/sd)*Math.sqrt(252) : 0
    }, [dailyReturns])
    const sortino = useMemo(()=>{
      const rets = dailyReturns.map(r=>r.ret)
      const mu=mean(rets), neg=rets.filter(r=>r<0), sdDown=stddev(neg)
      return sdDown>0 ? (mu/sdDown)*Math.sqrt(252) : 0
    }, [dailyReturns])

    const avgTradeDurationMin = useMemo(()=>{
      const mins = filtered.map(t=>{
        const o = t.open_time ? new Date(t.open_time).getTime() : NaN
        const c = t.close_time ? new Date(t.close_time).getTime() : NaN
        if (!isFinite(o)||!isFinite(c)) return null
        return (c-o)/60000
      }).filter(v=>v!=null)
      return mins.length? mean(mins):0
    }, [filtered])

    const activeDays = useMemo(()=> new Set(filtered.map(t=>t.date)).size, [filtered])

    const avgStrategyCorr = useMemo(()=>{
      const byDayByStrat = new Map()
      for (const t of filtered){
        const d=t.date
        if(!byDayByStrat.has(d)) byDayByStrat.set(d, new Map())
        const m = byDayByStrat.get(d)
        const val = convert(t.pnl, t.ccy||'USD', displayCcy)
        m.set(t.strategy, (m.get(t.strategy)||0) + val)
      }
      const stratSet = new Set()
      for (const m of byDayByStrat.values()) for(const k of m.keys()) stratSet.add(k)
      const strats = Array.from(stratSet)
      if (strats.length<2) return 0
      const series = {}; for(const s of strats) series[s]=[]
      const dates = Array.from(byDayByStrat.keys()).sort()
      for(const d of dates){
        const m = byDayByStrat.get(d)
        for(const s of strats) series[s].push(m.get(s)??0)
      }
      const pairCorr=[]
      function pearson(a,b){
        const n=Math.min(a.length,b.length); if(n===0) return 0
        const ax=a.slice(0,n), bx=b.slice(0,n)
        const ma=mean(ax), mb=mean(bx)
        let num=0, da=0, db=0
        for(let i=0;i<n;i++){ const x=ax[i]-ma, y=bx[i]-mb; num+=x*y; da+=x*x; db+=y*y }
        const den=Math.sqrt(da*db); return den>0? num/den : 0
      }
      for(let i=0;i<strats.length;i++){
        for(let j=i+1;j<strats.length;j++){
          pairCorr.push(pearson(series[strats[i]], series[strats[j]]))
        }
      }
      return mean(pairCorr.filter(x=>isFinite(x)))
    }, [filtered, displayCcy, rates])

    /* ====================== MFE/MAE — quotidiens & cumul ====================== */
    const mfeMaeDaily = useMemo(()=>{
      const map=new Map()
      for(const t of filtered){
        const d=t.date
        const mfe = convert(t.mfe??0, t.ccy||'USD', displayCcy)
        const mae = Math.abs(convert(t.mae??0, t.ccy||'USD', displayCcy))
        if(!map.has(d)) map.set(d, {date:d, sMFE:0, sMAE:0, n:0})
        const x=map.get(d); x.sMFE += Math.max(0,mfe); x.sMAE += Math.max(0,mae); x.n++
      }
      const arr = Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date))
      let cumM=0, cumA=0
      return arr.map(r=>{
        const avgMFE = r.n? r.sMFE/r.n : 0
        const avgMAE = r.n? r.sMAE/r.n : 0
        cumM += r.sMFE; cumA += r.sMAE
        return { date:r.date, avgMFE:round2(avgMFE), avgMAE:round2(avgMAE), cumMFE:round2(cumM), cumMAE:round2(cumA) }
      })
    }, [filtered, displayCcy, rates])

    /* ====================== KPIs dérivés ====================== */
    const globalReturnPct = useMemo(()=> capitalBase>0? (totalPnlDisp/capitalBase)*100 : 0, [totalPnlDisp, capitalBase])
    const maxDDPct = useMemo(()=> peakEquity>0? (maxDDAbs/peakEquity)*100 : 0, [maxDDAbs, peakEquity])

    /* ====================== État UI complémentaires ====================== */
    const [showFlows, setShowFlows] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [flow, setFlow] = useState({
      date: new Date().toISOString().slice(0,10),
      type:'darwin_mgmt_fee',
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
      if (!flow.date || !flow.type || isNaN(amt)){ alert('Merci de compléter Date / Type / Montant'); return }
      const row = { date:flow.date, type:flow.type, amount:amt, ccy: flow.ccy||displayCcy, note: flow.note||'' }
      setUserCashflows(prev=> prev.concat([row]))
      setShowForm(false)
      setFlow({ date:new Date().toISOString().slice(0,10), type:'darwin_mgmt_fee', amount:'', ccy:displayCcy, note:'' })
    }

    /* ====================== V4.4 — État Risque & Projection ====================== */
    const [showRisk, setShowRisk] = useState(false)
    const snoozeKey = 'zp_risk_snooze_until'
    function snooze(hours){ const until=Date.now()+hours*3600*1000; localStorage.setItem(snoozeKey,String(until)); setShowRisk(false) }
    function isSnoozed(){ const v=Number(localStorage.getItem(snoozeKey)||0); return v && Date.now()<v }

    /* ======= Suite (calculs V4.4 + V5 + UI) dans PARTIE 2/3 ======= */
    /* ====================== V4.4 — Score risque & projections ====================== */
    const EI = useMemo(()=> edgeIndex(wr, rr), [wr, rr])

    const subDD = useMemo(()=> mapTo01((peakEquity>0? (maxDDAbs/peakEquity)*100 : 0), [15,20,30]), [peakEquity, maxDDAbs])
    const subProfit = useMemo(()=>{
      const sEdge = mapTo01(-EI, [-0.05, 0.05, 0.20]) // edge négatif pèse plus
      const sExp  = expectancy>=0 ? 0 : clamp(Math.abs(expectancy)/(Math.abs(expectancy)+1),0,1)
      return clamp(0.7*sEdge + 0.3*sExp, 0, 1)
    }, [EI, expectancy])
    const subDown = useMemo(()=>{
      const missing = sortino>=1.2 ? 0 : (1.2 - Math.max(0, sortino))
      return clamp(missing/1.2, 0, 1)
    }, [sortino])
    const subConc = useMemo(()=>{
      const corr = Math.abs(avgStrategyCorr || 0)
      const weightsAbs = (()=>{ // impact absolu par actif (période filtrée)
        const m=new Map()
        for(const t of filtered){
          const v = Math.abs(convert(t.pnl, t.ccy||'USD', displayCcy))
          m.set(t.asset, (m.get(t.asset)||0) + v)
        }
        return Array.from(m.values())
      })()
      const hh = weightsAbs.length ? hhi(weightsAbs) : 0
      const sc = clamp(corr,0,1)
      const n = Math.max(1, weightsAbs.length), hhMin = 1/n, hhMax = 1
      const shh = n>1 ? clamp((hh - hhMin)/(hhMax - hhMin),0,1) : 1
      return clamp(0.6*sc + 0.4*shh, 0, 1)
    }, [avgStrategyCorr, filtered, displayCcy, rates])
    const subTime = useMemo(()=>{
      const byHour=new Map(), byDay=new Map()
      for(const t of filtered){
        const d = new Date(t.open_time || (t.date+'T00:00:00Z'))
        const h = d.getHours(), w = (d.getDay()+6)%7
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        byHour.set(h,(byHour.get(h)||0)+v); byDay.set(w,(byDay.get(w)||0)+v)
      }
      const sH = clamp(Array.from(byHour.values()).filter(x=>x<0).length/24,0,1)
      const sD = clamp(Array.from(byDay.values()).filter(x=>x<0).length/7,0,1)
      return clamp(0.6*sH+0.4*sD,0,1)
    }, [filtered, displayCcy, rates])

    const riskScore = useMemo(()=> Math.round(clamp(
      0.30*subDD + 0.25*subProfit + 0.20*subDown + 0.15*subConc + 0.10*subTime, 0, 1
    )*100), [subDD, subProfit, subDown, subConc, subTime])

    const riskLevel = useMemo(()=> riskScore>=70?'bad': riskScore>=40?'warn':'good', [riskScore])

    const rets = useMemo(()=> dailyReturns.map(r=>r.ret).filter(v=>isFinite(v)), [dailyReturns])
    const proj30 = useMemo(()=> projectPnL(rets, 30), [rets])
    const proj90 = useMemo(()=> projectPnL(rets, 90), [rets])
    const pDD15_30 = useMemo(()=> Math.round(probHitDD(-0.15, equitySeriesHL)*100), [equitySeriesHL])
    const pDD20_90 = useMemo(()=> Math.round(probHitDD(-0.20, equitySeriesHL)*100), [equitySeriesHL])

    useEffect(()=>{ if (!isSnoozed() && riskLevel==='bad') setShowRisk(true) }, [riskLevel])

    /* ====================== V5 — Underwater (DD%) & jours sous l'eau ====================== */
    const underwater = useMemo(()=>{
      let peak = capitalInitialDisp
      const out = equitySeriesHL.map(p=>{
        peak = Math.max(peak, p.equity_trading||0)
        const dd = peak>0? ((p.equity_trading||0) - peak)/peak : 0
        return { date:p.date, dd } // dd <= 0
      })
      return out
    }, [equitySeriesHL, capitalInitialDisp])

    const daysSinceHWM = useMemo(()=>{
      let peak = -Infinity, lastHWMDate=null
      for(const p of equitySeriesHL){ if ((p.equity_trading||0) > peak){ peak=p.equity_trading; lastHWMDate=p.date } }
      if (!lastHWMDate) return 0
      const end = equitySeriesHL.at(-1)?.date || lastHWMDate
      const d1 = new Date(lastHWMDate), d2 = new Date(end)
      return Math.max(0, Math.floor((d2 - d1)/86400000))
    }, [equitySeriesHL])

    /* ====================== V5 — Rolling 30j (WR · RR · Expectancy · Sortino) ====================== */
    const dailyPnl = useMemo(()=>{
      const m=new Map()
      for(const t of filtered){
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        m.set(t.date, (m.get(t.date)||0)+v)
      }
      return Array.from(m, ([date, pnl])=>({date, pnl})).sort((a,b)=>a.date.localeCompare(b.date))
    }, [filtered, displayCcy, rates])

    const rolling30 = useMemo(()=>{
      if (!dailyPnl.length || !equitySeriesHL.length) return []
      // Retours quotidiens sur la série d'équité (trading seul)
      const eqRets = equitySeriesHL.map((p,idx)=>({
        date: p.date,
        ret: idx>0 ? ((equitySeriesHL[idx].equity_trading - equitySeriesHL[idx-1].equity_trading) / (equitySeriesHL[idx-1].equity_trading||1)) : 0
      }))
      const out=[]
      for(let i=0;i<dailyPnl.length;i++){
        const window = rollWindow(dailyPnl, i, 30)
        const wins = window.filter(d=>d.pnl>0), losses = window.filter(d=>d.pnl<0)
        const wr30 = (wins.length + losses.length)>0 ? (wins.length/(wins.length+losses.length))*100 : 0
        const avgWin30 = wins.length? mean(wins.map(x=>x.pnl)) : 0
        const avgLoss30Abs = losses.length? mean(losses.map(x=>Math.abs(x.pnl))) : 0
        const rr30 = avgLoss30Abs>0 ? (avgWin30/avgLoss30Abs) : (avgWin30>0? Infinity:0)
        const exp30 = window.length? mean(window.map(x=>x.pnl)) : 0
        const rWin = rollWindow(eqRets, i, 30).map(r=>r.ret)
        const mu = mean(rWin), sdDown = stddev(rWin.filter(r=>r<0))
        const sort30 = sdDown>0 ? (mu/sdDown)*Math.sqrt(252) : 0
        out.push({ date: dailyPnl[i].date, wr30, rr30, exp30, sort30 })
      }
      return out
    }, [dailyPnl, equitySeriesHL])

    /* ====================== V5 — Attribution compacte ====================== */
    function aggBy(key){
      const m = new Map()
      for(const t of filtered){
        const k = t[key] || '—'
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        m.set(k, (m.get(k)||0) + v)
      }
      const rows = Array.from(m, ([name, value])=>({name, value}))
      const totAbs = rows.reduce((a,r)=>a+Math.abs(r.value),0) || 1
      return rows.map(r=>({...r, impact: Math.abs(r.value), pct: (Math.abs(r.value)/totAbs)*100 }))
                 .sort((a,b)=>Math.abs(b.value) - Math.abs(a.value))
    }
    const attrAsset = useMemo(()=> aggBy('asset'), [filtered, displayCcy, rates])
    const attrStrat = useMemo(()=> aggBy('strategy'), [filtered, displayCcy, rates])
    const attrBroker = useMemo(()=> aggBy('broker'), [filtered, displayCcy, rates])

    /* ====================== V5 — Waterfall mensuel ====================== */
    const ymNow = useMemo(()=>{
      const last = equitySeriesHL.at(-1)?.date || new Date().toISOString().slice(0,10)
      return last.slice(0,7)
    }, [equitySeriesHL])
    const monthly = useMemo(()=>{
      const firstDay = ymNow+'-01'
      let startEq = capitalInitialDisp
      for(const p of equitySeriesHL){
        if (p.date < firstDay){ startEq = p.equity_trading || startEq } else break
      }
      const tradesMonth = filtered.filter(t=> t.date.startsWith(ymNow))
      const tradingPnl = tradesMonth.reduce((s,t)=> s + convert(t.pnl, t.ccy||'USD', displayCcy), 0)
      const commission = tradesMonth.reduce((s,t)=> s + convert(t.commission||0, t.ccy||'USD', displayCcy), 0)
      const swap = tradesMonth.reduce((s,t)=> s + convert(t.swap||0, t.ccy||'USD', displayCcy), 0)
      const cashflowsM = allCashflows.filter(c=> c.date.startsWith(ymNow))
                                     .reduce((s,c)=> s + (c.amount_disp ?? convert(c.amount,c.ccy,displayCcy)), 0)
      const endEq = startEq + tradingPnl + commission + swap + cashflowsM
      return { startEq, tradingPnl, commission, swap, cashflowsM, endEq }
    }, [ymNow, equitySeriesHL, filtered, allCashflows, displayCcy, rates, capitalInitialDisp])

    /* ====================== V5 — Narratif auto (FR) ====================== */
    const narrativeFR = useMemo(()=>{
      const sign = x => x>=0 ? 'positif' : 'négatif'
      const bestA = attrAsset[0]?.name || '—', bestAScore = attrAsset[0]?.value||0
      const worstA = attrAsset.at(-1)?.name || '—', worstAScore = attrAsset.at(-1)?.value||0
      const corrTxt = (Math.abs(avgStrategyCorr||0)).toFixed(2)
      return [
        `Sur la période, la performance est ${sign(totalPnlDisp)} (${fmt(totalPnlDisp)}), avec un drawdown max de ${maxDDPct.toFixed(2)}% (${fmt(maxDDAbs)}).`,
        `Les ratios montrent un edge de ${edgeIndex(wr,rr).toFixed(2)} et un Sortino de ${sortino.toFixed(2)}.`,
        `Attribution : meilleur contributeur ${bestA} (${fmt(bestAScore)}), plus faible ${worstA} (${fmt(worstAScore)}).`,
        `Corrélation moyenne des stratégies : ${corrTxt}.`,
        `En ${ymNow}, le waterfall montre ${fmt(monthly.tradingPnl)} trading, coûts ${fmt(monthly.commission+monthly.swap)}, flux ${fmt(monthly.cashflowsM)}.`,
        `Jours sous l’eau : ${daysSinceHWM}.`
      ]
    }, [totalPnlDisp, maxDDPct, maxDDAbs, wr, rr, sortino, avgStrategyCorr, attrAsset, ymNow, monthly, daysSinceHWM, displayCcy, rates])

    /* ====================== RENDER — début ====================== */
    return (
      <div style={{ minHeight:'100vh', background:C.bg, color:C.text, padding:20, maxWidth:1540, margin:'0 auto' }}>
        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, gap:12 }}>
          <div>
            <h1 style={{ color:C.white, fontWeight:400, margin:0, fontSize:28 }}>ZooProjectVision — Control Center</h1>
            <p style={{ color:C.muted, fontSize:12, marginTop:4 }}>poste de pilotage trading — multi-actifs · multi-brokers · multi-stratégies</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {/* Import CSV */}
            <label className="btn">
              importer csv trades
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
            {/* Ajouter flux */}
            <button className="btn" onClick={()=>setShowForm(true)}>ajouter flux</button>
            {/* Réinitialiser */}
            <button className="btn" onClick={resetFilters}>réinitialiser filtres</button>
            {/* Devise */}
            <select className="sel" value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)}>
              {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
            </select>
            {/* Drawer Risque */}
            <button className="btn" onClick={()=>setShowRisk(true)}>risque & projection</button>
          </div>
        </div>

        {/* FILTRES */}
        <div className="card" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
          <div>
            <div className="label">actif</div>
            <select className="sel" value={asset} onChange={e=>setAsset(e.target.value)}>
              <option>All</option>{assets.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div className="label">broker</div>
            <select className="sel" value={broker} onChange={e=>setBroker(e.target.value)}>
              <option>All</option>{brokers.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div className="label">stratégie</div>
            <select className="sel" value={strategy} onChange={e=>setStrategy(e.target.value)}>
              <option>All</option>{strategies.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="label">du</div>
            <input className="sel" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          </div>
          <div>
            <div className="label">au</div>
            <input className="sel" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          </div>
          <div />
        </div>

        {/* KPI PRINCIPAUX */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12, marginTop:12 }}>
          <div className="card">
            <div className="kpi-title">capital initial</div>
            <div className="val">{fmt(capitalInitialDisp)}</div>
          </div>
          <div className={'card'}>
            <div className="kpi-title">cash flow</div>
            <div className={'val ' + (cashFlowTotal>=0?'pos':'neg')}>{fmt(cashFlowTotal)}</div>
          </div>
          <div className="card">
            <div className="kpi-title">pnl (filtré)</div>
            <div className={'val ' + (totalPnlDisp>=0?'pos':'neg')}>{fmt(totalPnlDisp)}</div>
          </div>
          <div className="card">
            <div className="kpi-title">capital global</div>
            <div className="val">{fmt(capitalGlobal)}</div>
          </div>
          <div className="card">
            <div className="kpi-title">rentabilité globale</div>
            <div className={'val ' + (globalReturnPct>=0?'pos':'neg')}>{globalReturnPct.toFixed(2)}%</div>
          </div>
          <div className="card">
            <div className="kpi-title">max dd</div>
            <div className="val">{maxDDPct.toFixed(2)}% · <span className="muted">{fmt(maxDDAbs)}</span></div>
          </div>
        </div>

        {/* KPI SECONDAIRES (exemple — wr/rr/expectancy/sortino/recovery) */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:12 }}>
          <div className="card">
            <div className="kpi-title">win rate / rr</div>
            <div style={{ fontSize:16 }}>
              <span className="muted">{wr.toFixed(2)}%</span>{' / '}<span className="muted">{(rr===Infinity?'∞':rr.toFixed(2))}</span>
            </div>
          </div>
          <div className="card">
            <div className="kpi-title">expectancy (par trade)</div>
            <div className="val muted">{fmt(expectancy)}</div>
          </div>
          <div className="card">
            <div className="kpi-title">sharpe / sortino</div>
            <div style={{ fontSize:16 }}><span className="muted">{sharpe.toFixed(2)}</span>{' / '}<span className="muted">{sortino.toFixed(2)}</span></div>
          </div>
          <div className="card">
            <div className="kpi-title">recovery factor / corr. stratégies</div>
            <div style={{ fontSize:16 }}><span className="muted">{recoveryFactor.toFixed(2)}</span>{' / '}<span className="muted">{(avgStrategyCorr||0).toFixed(2)}</span></div>
          </div>
        </div>

        {/* ===== La suite des sections (équité, underwater, rolling30, attribution, waterfall, narratif, drawer risque, MFE/MAE, H/J/M, calendrier, formulaires) est dans PARTIE 3/3 ===== */}
        {/* COURBE D’ÉQUITÉ (trading seul / avec flux) */}
        <div className="card" style={{height:460, marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
            <div className="kpi-title">courbe d’équité (trading seul / avec flux)</div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:C.muted }}>
              <input type="checkbox" checked={showFlows} onChange={e=>setShowFlows(e.target.checked)} />
              afficher « avec flux »
            </label>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={equitySeriesHL} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{ stroke: C.axis }} />
              <Tooltip
                contentStyle={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10 }}
                labelStyle={{ color: C.text }} itemStyle={{ color: C.text }}
                formatter={(v, n)=>[fmt(v), n]}
              />
              <Legend wrapperStyle={{ color: C.text }} />
              {/* Trading seul */}
              <Line type="monotone" dataKey="equity_trading" name="Équité (trading seul)" dot={false} stroke={C.white} strokeWidth={1.8} isAnimationActive={false} />
              {/* Avec flux (optionnel) */}
              {showFlows && (
                <Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#8a8f94" strokeWidth={1.4} strokeDasharray="5 4" />
              )}
              {/* HWM / LWM */}
              <Line type="monotone" dataKey="hwm" name="Plus haut (HWM)" dot={false} stroke={C.pos} strokeWidth={1.4} strokeDasharray="4 3" />
              <Line type="monotone" dataKey="lwm" name="Plus bas (LWM)" dot={false} stroke={C.neg} strokeWidth={1.2} strokeDasharray="4 3" />
              {/* Marqueurs de flux : points verts/roses (sans lignes verticales) sur la série “avec flux” */}
              {showFlows && cashflowsInRange.map((c,i)=>{
                const y = (()=>{ // y = équité “avec flux” au jour du flux
                  const p = equitySeriesHL.find(x=>x.date===c.date); return p? p.equity_with_flows : null
                })()
                const color = c.amount >= 0 ? C.pos : C.neg
                return (y!=null) ? <ReferenceDot key={'cf'+i} x={c.date} y={y} r={4} fill={color} stroke="none" /> : null
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* UNDERWATER (DD%) + jours sous l’eau */}
        <div className="card" style={{height:280, marginTop:16}}>
          <div className="kpi-title">underwater — drawdown (%) · jours sous l’eau : {daysSinceHWM}</div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={underwater} margin={{left:8,right:8,top:8,bottom:8}}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tickFormatter={(v)=> (v*100).toFixed(0)+'%'} />
              <Tooltip
                contentStyle={{background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:10}}
                formatter={(v)=>[(v*100).toFixed(2)+'%', 'DD']}
              />
              <Area type="monotone" dataKey="dd" stroke={C.neg} fill={C.neg} fillOpacity={0.15} />
              <ReferenceLine y={0} stroke={C.axis} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ROLLING 30 jours — WR · RR · Expectancy · Sortino */}
        <div className="card" style={{height:320, marginTop:16}}>
          <div className="kpi-title">rolling 30 jours — wr · rr · expectancy · sortino</div>
          <ResponsiveContainer width="100%" height="82%">
            <LineChart data={rolling30} margin={{left:8,right:8,top:8,bottom:8}}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <Tooltip contentStyle={{background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:10}} />
              <Legend wrapperStyle={{ color:C.text }} />
              <Line type="monotone" dataKey="wr30"   name="WR 30j (%)"    dot={false} stroke={C.white}  strokeWidth={1.6} />
              <Line type="monotone" dataKey="rr30"   name="RR 30j"       dot={false} stroke={C.orange} strokeWidth={1.6} />
              <Line type="monotone" dataKey="exp30"  name="Expectancy"   dot={false} stroke={C.pos}    strokeWidth={1.6} />
              <Line type="monotone" dataKey="sort30" name="Sortino 30j"  dot={false} stroke={C.muted}  strokeWidth={1.2} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ATTRIBUTION COMPACTE */}
        <div className="card" style={{marginTop:16}}>
          <div className="kpi-title">attribution compacte — top contributeurs (période filtrée)</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
            {[{t:'par actif',rows:attrAsset},{t:'par stratégie',rows:attrStrat},{t:'par broker',rows:attrBroker}].map((blk,i)=>(
              <div key={i} className="mini">
                <div className="label">{blk.t}</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr auto auto', gap:6}}>
                  {blk.rows.slice(0,8).map((r,idx)=>(
                    <React.Fragment key={r.name+'-'+idx}>
                      <div className="muted">{r.name}</div>
                      <div className={'val ' + (r.value>=0?'pos':'neg')} style={{textAlign:'right'}}>{fmt(r.value)}</div>
                      <div className="muted" style={{textAlign:'right'}}>{r.pct.toFixed(1)}%</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WATERFALL MENSUEL */}
        <div className="card" style={{height:320, marginTop:16}}>
          <div className="kpi-title">waterfall — {ymNow}</div>
          <ResponsiveContainer width="100%" height="82%">
            <BarChart data={[
              {name:'Start',      val: monthly.startEq},
              {name:'Trading',    val: monthly.tradingPnl},
              {name:'Commissions',val: monthly.commission},
              {name:'Swaps',      val: monthly.swap},
              {name:'Cashflows',  val: monthly.cashflowsM},
              {name:'End',        val: monthly.endEq}
            ]} margin={{left:8,right:8,top:8,bottom:8}}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="name" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} tickFormatter={(v)=>fmt(v)} />
              <Tooltip
                contentStyle={{background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:10}}
                formatter={(v,n)=>[fmt(v), n]}
              />
              <Bar dataKey="val" name="Valeur">
                {[monthly.startEq, monthly.tradingPnl, monthly.commission, monthly.swap, monthly.cashflowsM, monthly.endEq].map((v, i)=>(
                  <Cell key={i} fill={i===0||i===5 ? C.white : (v>=0? C.pos : C.neg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* NARRATIF AUTO */}
        <div className="card" style={{marginTop:16}}>
          <div className="kpi-title">bilan automatique (fr)</div>
          <div style={{fontSize:'var(--font-size)', color:C.text, lineHeight:1.7}}>
            {narrativeFR.map((p,idx)=> <div key={idx} style={{marginBottom:6}}>{p}</div>)}
          </div>
        </div>

        {/* MFE/MAE — QUOTIDIEN (MOYENNE) */}
        <div className="card" style={{height:360, marginTop:16}}>
          <div className="kpi-title">MFE / MAE — Quotidien (Moyenne)</div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{ left:8, right:8, top:8, bottom:8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <Tooltip
                contentStyle={{ background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:10 }}
                formatter={(v,n)=>[fmt(v), n==='avgMFE'?'MFE Moyen':'MAE Moyen']}
                labelStyle={{ color:C.text }}
                itemStyle={{ color:C.text }}
              />
              <Legend wrapperStyle={{ color:C.text }} />
              <Line type="monotone" dataKey="avgMFE" name="MFE Moyen" dot={false} stroke={C.pos} strokeWidth={2} />
              <Line type="monotone" dataKey="avgMAE" name="MAE Moyen" dot={false} stroke={C.neg} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MFE/MAE — CUMUL */}
        <div className="card" style={{height:360, marginTop:16}}>
          <div className="kpi-title">cumul MFE / MAE</div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{ left:8, right:8, top:8, bottom:8 }}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <Tooltip
                contentStyle={{ background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:10 }}
                formatter={(v,n)=>[fmt(v), n==='cumMFE'?'Cumul MFE':'Cumul MAE']}
                labelStyle={{ color:C.text }}
                itemStyle={{ color:C.text }}
              />
              <Legend wrapperStyle={{ color:C.text }} />
              <Line type="monotone" dataKey="cumMFE" name="Cumul MFE" dot={false} stroke={C.pos} strokeWidth={2.2} />
              <Line type="monotone" dataKey="cumMAE" name="Cumul MAE" dot={false} stroke={C.neg} strokeWidth={2.2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign:'center', color:C.muted, fontSize:12, marginTop:20 }}>
          ZooProjectVision © {new Date().getFullYear()}
        </div>

        {/* DRAWER — Risque & projection */}
        {showRisk && (
          <div className="drawer" onClick={()=>setShowRisk(false)}>
            <div className="overlay" />
            <div
              className={
                "drawer-card " + (riskLevel==='bad'?'verdict-bad':riskLevel==='warn'?'verdict-warn':'verdict-good')
              }
              onClick={e=>e.stopPropagation()}
            >
              <div className="drawer-head">
                <div className="drawer-title">risque actuel : {riskLevel==='bad'?'élevé':riskLevel==='warn'?'modéré':'faible'} · score {riskScore}/100</div>
                <div className="drawer-actions">
                  <button className="btn sm ghost" onClick={()=>snooze(24)}>snooze 24h</button>
                  <button className="btn sm ghost" onClick={()=>snooze(24*7)}>snooze 7j</button>
                  <button className="btn sm" onClick={()=>setShowRisk(false)}>fermer</button>
                </div>
              </div>
              <div className="drawer-body">
                <div className="card">
                  <div className="kpi-title">situation actuelle</div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
                    <div className="mini"><div className="label">pnl (période)</div><div className={'val ' + (totalPnlDisp>=0?'pos':'neg')}>{fmt(totalPnlDisp)}</div></div>
                    <div className="mini"><div className="label">max dd (%) / montant</div><div className="val">{maxDDPct.toFixed(2)}% · <span className="muted">{fmt(maxDDAbs)}</span></div></div>
                    <div className="mini"><div className="label">edge / sortino / corr</div><div className="val">{edgeIndex(wr,rr).toFixed(2)} · {sortino.toFixed(2)} · {(Math.abs(avgStrategyCorr||0)).toFixed(2)}</div></div>
                  </div>
                </div>
                <div className="card">
                  <div className="kpi-title">projection</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                    <div className="mini">
                      <div className="label">30 jours (médiane / p10 ; p90)</div>
                      <div className="val">{(proj30.median*100).toFixed(2)}% · [{(proj30.p10*100).toFixed(2)}% ; {(proj30.p90*100).toFixed(2)}%]</div>
                      <div className="label" style={{marginTop:6}}>P(DD ≥ 15%) sous 30j</div><div className="val">{pDD15_30}%</div>
                    </div>
                    <div className="mini">
                      <div className="label">90 jours (médiane / p10 ; p90)</div>
                      <div className="val">{(proj90.median*100).toFixed(2)}% · [{(proj90.p10*100).toFixed(2)}% ; {(proj90.p90*100).toFixed(2)}%]</div>
                      <div className="label" style={{marginTop:6}}>P(DD ≥ 20%) sous 90j</div><div className="val">{pDD20_90}%</div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="kpi-title">suggestions</div>
                  <ul style={{margin:'6px 0 0 18px', lineHeight:1.6}}>
                    <li>réduire l’exposition sur les créneaux/jours non rentables.</li>
                    <li>limiter l’actif le plus concentré si HHI élevé.</li>
                    <li>viser Sortino ≥ 1.2 avant d’augmenter la taille.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL — Ajouter un flux */}
        {showForm && (
          <div className="modal-overlay" onClick={()=>setShowForm(false)}>
            <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:14, color: C.text }}>ajouter un flux</div>
                <button className="btn sm ghost" onClick={()=>setShowForm(false)}>fermer</button>
              </div>
              <form onSubmit={submitFlow} style={{ display:'grid', gap:10, gridTemplateColumns:'repeat(2,1fr)' }}>
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
                  <button type="button" className="btn sm ghost" onClick={()=>setShowForm(false)}>annuler</button>
                  <button type="submit" className="btn sm">enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div> {/* /root wrapper */}
    )
  } catch(e){
    console.error(e)
    return <div style={{ color: '#ff5fa2', padding: 16 }}>Erreur dans App.jsx : {String(e.message || e)}</div>
  }
}

/* ====================== Helpers d'import CSV (après le composant) ====================== */
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
