import React, { useMemo, useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceDot
} from 'recharts'

/* ===================== Couleurs & styles ===================== */
const makeColors = () => ({
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
})
const card = (c) => ({ background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14, padding: 14 })
const btn  = (c) => ({ border:`1px solid ${c.gold}`, background:'transparent', color:c.text, padding:'8px 12px', borderRadius:10, cursor:'pointer', fontSize:12 })
const sel  = (c) => ({ width:'100%', padding:'9px 12px', fontSize:12, color:c.text, background:'#0f0f10', border:`1px solid ${c.border}`, borderRadius:10, outline:'none' })
const kpiTitle = (c) => ({ color: c.muted, fontWeight: 400, fontSize: 13, margin: "0 0 6px", textTransform:'capitalize' })
const kpiVal = { fontWeight: 400, fontSize: 18, lineHeight: 1.2 }

/* ===================== i18n (FR / EN / ES) ===================== */
const I18N = {
  fr: {
    titleDefault: "ZooProjectVision",
    titlePlaceholder: "Modifier le nom du dashboard…",
    buttons: { refresh: "Actualiser", reset: "Réinitialiser Filtres", language: "Langue" },
    header: { subtitle: "Dashboard de performance multi-actifs, multi-brokers, multi-stratégies" },
    filters: { asset: "Actif", broker: "Broker", strategy: "Stratégie", from: "Du", to: "Au", currency: "Devise" },
    kpi: {
      capitalInitial: "Capital Initial",
      cashFlow: "Cash Flow",
      pnlFiltered: "PNL (Filtré)",
      capitalGlobal: "Capital Global",
      globalReturn: "Rentabilité Globale",
      maxDD: "Max DD % / Max DD",
      winRateRR: "Win Rate / RR",
      expectancy: "Expectancy (Par Trade)",
      avgWinLoss: "Gain Moyen / Perte Moyenne",
      avgDur: "Durée Moyenne Gains / Pertes",
      sharpeSortinoRec: "Sharpe / Sortino / Recovery",
      mfeMae: "MFE Moyen / MAE Moyen",
      corr: "Corrélation (Stratégies)"
    },
    charts: {
      equity: "Courbe D’Équité (Avec Flux)",
      barHour: "Gains / Pertes Par Heure D’Ouverture",
      barDay:  "Gains / Pertes Par Jour D’Ouverture",
      barMonth:"Gains / Pertes Par Mois D’Ouverture",
      alerts:  "Alertes Horaires (Zones À Éviter)",
      calendar:"Calendrier"
    },
    calendar: { monthly:"Mensuel", yearly:"Annuel", capitalBase:"Capital Réel (Initial + Cash-Flow)", top:"Top", flop:"Flop",
      months: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
      dow: ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"], dd:"DD"
    }
  },
  en: {
    titleDefault: "ZooProjectVision",
    titlePlaceholder: "Edit dashboard name…",
    buttons: { refresh: "Refresh", reset: "Reset Filters", language: "Language" },
    header: { subtitle: "Multi-asset / multi-broker / multi-strategy performance dashboard" },
    filters: { asset: "Asset", broker: "Broker", strategy: "Strategy", from: "From", to: "To", currency: "Currency" },
    kpi: {
      capitalInitial: "Initial Capital",
      cashFlow: "Cash Flow",
      pnlFiltered: "PnL (Filtered)",
      capitalGlobal: "Total Capital",
      globalReturn: "Global Return",
      maxDD: "Max DD % / Max DD",
      winRateRR: "Win Rate / RR",
      expectancy: "Expectancy (Per Trade)",
      avgWinLoss: "Avg Win / Avg Loss",
      avgDur: "Avg Duration Wins / Losses",
      sharpeSortinoRec: "Sharpe / Sortino / Recovery",
      mfeMae: "Avg MFE / Avg MAE",
      corr: "Correlation (Strategies)"
    },
    charts: {
      equity: "Equity Curve (Incl. Flows)",
      barHour: "P/L by Open Hour",
      barDay:  "P/L by Open Day",
      barMonth:"P/L by Open Month",
      alerts:  "Hourly Alerts (Avoid Zones)",
      calendar:"Calendar"
    },
    calendar: { monthly:"Monthly", yearly:"Yearly", capitalBase:"Real Capital (Initial + Cash Flow)", top:"Top", flop:"Worst",
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      dow: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], dd:"DD"
    }
  },
  es: {
    titleDefault: "ZooProjectVision",
    titlePlaceholder: "Editar nombre del panel…",
    buttons: { refresh: "Actualizar", reset: "Reiniciar Filtros", language: "Idioma" },
    header: { subtitle: "Panel de rendimiento multi-activos, multi-brókers y multi-estrategias" },
    filters: { asset: "Activo", broker: "Bróker", strategy: "Estrategia", from: "Desde", to: "Hasta", currency: "Moneda" },
    kpi: {
      capitalInitial: "Capital Inicial",
      cashFlow: "Flujo de Caja",
      pnlFiltered: "P/L (Filtrado)",
      capitalGlobal: "Capital Total",
      globalReturn: "Rentabilidad Global",
      maxDD: "Máx DD % / Máx DD",
      winRateRR: "Tasa Éxito / RR",
      expectancy: "Expectativa (Por Operación)",
      avgWinLoss: "Ganancia Prom. / Pérdida Prom.",
      avgDur: "Duración Prom. Ganancias / Pérdidas",
      sharpeSortinoRec: "Sharpe / Sortino / Recovery",
      mfeMae: "MFE Prom. / MAE Prom.",
      corr: "Correlación (Estrategias)"
    },
    charts: {
      equity: "Curva de Equity (Con Flujos)",
      barHour: "P/G por Hora de Apertura",
      barDay:  "P/G por Día de Apertura",
      barMonth:"P/G por Mes de Apertura",
      alerts:  "Alertas por Hora (Evitar)",
      calendar:"Calendario"
    },
    calendar: { monthly:"Mensual", yearly:"Anual", capitalBase:"Capital Real (Inicial + Flujo)", top:"Top", flop:"Peor",
      months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
      dow: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"], dd:"DD"
    }
  }
}
const makeTranslator = (lang) => (path) => {
  try { return path.split('.').reduce((acc,k)=>acc[k], I18N[lang]) ?? path }
  catch { return path }
}

/* ===================== Helpers stats & util ===================== */
const sum = (a)=>a.reduce((x,y)=>x+y,0)
const mean = (a)=> a.length? sum(a)/a.length : 0
const stdev = (a)=>{ if(a.length<=1) return 0; const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)*(x-m)))) }
const downsideDev = (a)=>{ if(!a.length) return 0; const neg=a.map(x=>Math.min(0,x)); const mneg=mean(neg); return Math.sqrt(mean(neg.map(x=>(x-mneg)*(x-mneg)))) }
const pearson = (x,y)=>{ const n=Math.min(x.length,y.length); if(n<2) return 0; const mx=mean(x.slice(0,n)), my=mean(y.slice(0,n)); let num=0,dx=0,dy=0; for(let i=0;i<n;i++){const a=x[i]-mx,b=y[i]-my; num+=a*b; dx+=a*a; dy+=b*b} return (dx>0&&dy>0)? num/Math.sqrt(dx*dy):0 }
const fix2 = (x)=>Number((x||0).toFixed(2))

/* ===================== Modèle principal ===================== */
function useDashboardModel(){
  const colors = makeColors()

  // --- Démo : référentiels
  const ASSETS = ["XAUUSD", "DAX", "US500", "USTEC", "US30"]
  const BROKERS = ["Darwinex", "ICMarkets", "Pepperstone"]
  const STRATS  = ["Strategy 1", "Strategy 2", "Breakout"]

  // --- Démo : trades simulés (multi-jours, MFE/MAE)
  const demoTrades = useMemo(()=>{
    const rows=[], today=new Date()
    for(let i=150;i>=1;i--){
      const d=new Date(today); d.setDate(d.getDate()-i)
      const date=d.toISOString().slice(0,10)
      for(let k=0;k<6;k++){
        const asset=ASSETS[(i+k)%ASSETS.length]
        const broker=BROKERS[(i+2*k)%BROKERS.length]
        const strategy=STRATS[(i+3*k)%STRATS.length]
        let pnl=(Math.random()-0.5)*(Math.random()<0.15?2500:900); pnl=Number(pnl.toFixed(2))
        const openH=Math.floor(Math.random()*24), openM=Math.floor(Math.random()*60)
        const open=new Date(d.getFullYear(),d.getMonth(),d.getDate(),openH,openM)
        const durMin=15+Math.floor(Math.random()*(60*8))
        const close=new Date(open.getTime()+durMin*60*1000)
        const mfe=Number((Math.abs(pnl)*(0.8+Math.random()*0.8)).toFixed(2))
        const mae=Number((Math.abs(pnl)*(0.6+Math.random()*0.8)).toFixed(2))
        rows.push({ date, asset, broker, strategy, pnl, ccy:'USD', open_time:open.toISOString(), close_time:close.toISOString(), mfe, mae })
      }
    }
    return rows
  },[])

  // --- Démo : flux (apports/retraits/fees)
  const CAPITAL_INITIAL_USD = 100000
  const demoCashflows = [
    { date:'2025-01-05', type:'deposit',         amount: 2000, ccy:'USD', note:'Apport' },
    { date:'2025-02-10', type:'prop_fee',        amount: -500, ccy:'USD', note:'Prop challenge' },
    { date:'2025-03-15', type:'prop_payout',     amount: 1000, ccy:'USD', note:'Payout prop' },
    { date:'2025-04-02', type:'darwin_mgmt_fee', amount: 250,  ccy:'USD', note:'Darwinex mgmt fee' },
    { date:'2025-05-20', type:'withdrawal',      amount: -800, ccy:'USD', note:'Retrait' }
  ]

  /* --------- États et filtres --------- */
  const [asset,setAsset]=useState("All")
  const [broker,setBroker]=useState("All")
  const [strategy,setStrategy]=useState("All")
  const [dateFrom,setDateFrom]=useState("")
  const [dateTo,setDateTo]=useState("")
  const resetFilters=()=>{ setAsset("All"); setBroker("All"); setStrategy("All"); setDateFrom(""); setDateTo("") }

  const assets=useMemo(()=>Array.from(new Set(demoTrades.map(t=>t.asset))),[demoTrades])
  const brokers=useMemo(()=>Array.from(new Set(demoTrades.map(t=>t.broker))),[demoTrades])
  const strategies=useMemo(()=>Array.from(new Set(demoTrades.map(t=>t.strategy))),[demoTrades])

  const filtered=useMemo(()=>demoTrades.filter(t=>{
    if(asset!=="All" && t.asset!==asset) return false
    if(broker!=="All" && t.broker!==broker) return false
    if(strategy!=="All" && t.strategy!==strategy) return false
    if(dateFrom && t.date < dateFrom && (t.close_time ? t.close_time.slice(0,10) : t.date) < dateFrom) return false
    if(dateTo   && t.date > dateTo   && (t.close_time ? t.close_time.slice(0,10) : t.date) > dateTo) return false
    return true
  }),[demoTrades,asset,broker,strategy,dateFrom,dateTo])

  /* --------- Devises & conversion --------- */
  const [displayCcy,setDisplayCcy]=useState('USD')
  const fxFallback={ USD:{USD:1,EUR:0.93,CHF:0.88}, EUR:{USD:1/0.93,EUR:1,CHF:0.88/0.93}, CHF:{USD:1/0.88,EUR:0.93/0.88,CHF:1} }
  const [rates,setRates]=useState(null)
  useEffect(()=>{
    const key='fx_cache_v1', cached=localStorage.getItem(key), now=Date.now()
    if(cached){ const {at,data}=JSON.parse(cached); if(now-at<24*60*60*1000){ setRates(data); return } }
    fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF')
      .then(r=>r.json()).then(j=>{
        const data={ USD:{USD:1,EUR:j.rates.EUR,CHF:j.rates.CHF}, EUR:{USD:1/j.rates.EUR,EUR:1,CHF:j.rates.CHF/j.rates.EUR}, CHF:{USD:1/j.rates.CHF,EUR:j.rates.EUR/j.rates.CHF,CHF:1} }
        setRates(data); localStorage.setItem(key,JSON.stringify({at:now,data}))
      }).catch(()=>{})
  },[])
  const convert=(val,from='USD',to=displayCcy)=>{ if(val==null) return 0; if(from===to) return Number(val.toFixed(2)); const table=rates||fxFallback; const r=(table[from]&&table[from][to])?table[from][to]:1; return Number((val*r).toFixed(2)) }
  const fmtLocal=(v,ccy=displayCcy)=>{ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:ccy,minimumFractionDigits:2,maximumFractionDigits:2}).format(v??0)}catch{return `${(v??0).toFixed(2)} ${ccy}`} }

  /* --------- Cashflows & équité --------- */
  const cashflowsInRange=useMemo(()=>{
    return demoCashflows
      .filter(c=>(!dateFrom||c.date>=dateFrom)&&(!dateTo||c.date<=dateTo))
      .map(c=>({...c, amount_disp: convert(c.amount,c.ccy,displayCcy)}))
  },[demoCashflows,dateFrom,dateTo,displayCcy,rates])

  const cashByDate=useMemo(()=>{
    const m=new Map(); for(const c of cashflowsInRange){ m.set(c.date,(m.get(c.date)||0)+(c.amount_disp||0)) }
    return Array.from(m,([date,cash])=>({date,cash})).sort((a,b)=>a.date.localeCompare(b.date))
  },[cashflowsInRange])
  const cashCumMap=useMemo(()=>{ let cum=0; const m=new Map(); for(const c of cashByDate){ cum+=c.cash; m.set(c.date, Number(cum.toFixed(2))) } return m },[cashByDate])

  const capitalInitialDisp=useMemo(()=>convert(CAPITAL_INITIAL_USD,'USD',displayCcy),[displayCcy,rates])

  // PnL par date d'OUVERTURE (pour la série equity jour)
  const pnlByDate = useMemo(()=>{
    const m=new Map()
    for(const t of filtered){ const v=convert(t.pnl,t.ccy,displayCcy); m.set(t.date,(m.get(t.date)||0)+v) }
    return Array.from(m,([date,pnl])=>({date,pnl})).sort((a,b)=>a.date.localeCompare(b.date))
  },[filtered,displayCcy,rates])
  const pnlMap = useMemo(()=>{ const m=new Map(); pnlByDate.forEach(x=>m.set(x.date,x.pnl)); return m },[pnlByDate])

  // Dates fusionnées PnL & cash
  const mergedDates = useMemo(()=>{
    const s=new Set(); pnlByDate.forEach(x=>s.add(x.date)); cashByDate.forEach(x=>s.add(x.date)); return Array.from(s).sort((a,b)=>a.localeCompare(b))
  },[pnlByDate,cashByDate])

  // Équité (capital initial + PnL + flux), une seule courbe
  const equityWithFlowsSeries = useMemo(()=>{
    let eq=capitalInitialDisp, prevCashCum=0; const out=[]
    for(const d of mergedDates){
      const pnl=(pnlMap.get(d)||0)
      const cashCum=(cashCumMap.get(d)||0)
      const cashDelta=cashCum-prevCashCum; prevCashCum=cashCum
      eq += pnl + cashDelta
      out.push({ date:d, equity_with_flows: Number(eq.toFixed(2)) })
    }
    return out
  },[mergedDates,pnlMap,cashCumMap,capitalInitialDisp])

  /* --------- KPI --------- */
  const totalPnlDisp = useMemo(()=> sum(filtered.map(t=>convert(t.pnl,t.ccy,displayCcy))), [filtered,displayCcy,rates])
  const cashFlowTotal = useMemo(()=> sum(cashflowsInRange.map(c=>c.amount_disp||0)), [cashflowsInRange])
  const capitalBase = useMemo(()=> capitalInitialDisp + cashFlowTotal, [capitalInitialDisp,cashFlowTotal])
  const capitalGlobal = useMemo(()=> capitalBase + totalPnlDisp, [capitalBase,totalPnlDisp])

  // Max DD sur la courbe equity_with_flows
  const { peakEquity, maxDDAbs } = useMemo(()=>{
    if(!equityWithFlowsSeries.length) return { peakEquity:0, maxDDAbs:0 }
    let peak=equityWithFlowsSeries[0].equity_with_flows, mdd=0
    for(const p of equityWithFlowsSeries){
      if(p.equity_with_flows>peak) peak=p.equity_with_flows
      const drop=peak-p.equity_with_flows; if(drop>mdd) mdd=drop
    }
    return { peakEquity:peak, maxDDAbs:mdd }
  },[equityWithFlowsSeries])
  const maxDDPct = useMemo(()=> peakEquity>0? (maxDDAbs/peakEquity)*100 : 0, [maxDDAbs,peakEquity])

  const wins = filtered.filter(t=>t.pnl>0), losses = filtered.filter(t=>t.pnl<0)
  const wr = filtered.length ? (wins.length/filtered.length)*100 : 0
  const avgWin = useMemo(()=> wins.length? mean(wins.map(t=>convert(t.pnl,t.ccy,displayCcy))) : 0, [wins,displayCcy,rates])
  const avgLoss = useMemo(()=> losses.length? Math.abs(mean(losses.map(t=>convert(t.pnl,t.ccy,displayCcy)))) : 0, [losses,displayCcy,rates])
  const rr = useMemo(()=> avgLoss>0? avgWin/avgLoss : 0, [avgWin,avgLoss])
  const expectancy = useMemo(()=> filtered.length? totalPnlDisp/filtered.length : 0, [totalPnlDisp,filtered.length])
  const globalReturnPct = useMemo(()=> capitalBase>0? (totalPnlDisp/capitalBase)*100 : 0, [totalPnlDisp,capitalBase])

  // Durées moyennes
  const avgWinDurMin = useMemo(()=>{
    const mins = wins.map(t=> (new Date(t.close_time).getTime()-new Date(t.open_time).getTime())/60000 ).filter(v=>isFinite(v))
    return mins.length? mean(mins) : 0
  },[wins])
  const avgLossDurMin = useMemo(()=>{
    const mins = losses.map(t=> (new Date(t.close_time).getTime()-new Date(t.open_time).getTime())/60000 ).filter(v=>isFinite(v))
    return mins.length? mean(mins) : 0
  },[losses])

  // Retours journaliers (date de clôture) pour Sharpe/Sortino
  const dailyPnl = useMemo(()=>{
    const m=new Map()
    for(const t of filtered){ const d=(t.close_time?t.close_time.slice(0,10):t.date); const v=convert(t.pnl,t.ccy,displayCcy); m.set(d,(m.get(d)||0)+v) }
    return Array.from(m,([date,pnl])=>({date,pnl})).sort((a,b)=>a.date.localeCompare(b.date))
  },[filtered,displayCcy,rates])
  const dailyReturns = useMemo(()=>{ const base=Math.max(1,capitalBase); return dailyPnl.map(x=>x.pnl/base) },[dailyPnl,capitalBase])
  const sharpe = useMemo(()=>{ const sd=stdev(dailyReturns); return sd>0? (mean(dailyReturns)/sd)*Math.sqrt(252):0 },[dailyReturns])
  const sortino = useMemo(()=>{ const dd=downsideDev(dailyReturns); return dd>0? (mean(dailyReturns)/dd)*Math.sqrt(252):0 },[dailyReturns])
  const recovery = useMemo(()=> maxDDAbs>0? totalPnlDisp/maxDDAbs : 0, [totalPnlDisp,maxDDAbs])

  // MFE/MAE moyens (info rapide)
  const mfeMaeAvg = useMemo(()=>{
    const avgMFE = mean(filtered.map(t=>Math.abs(convert(t.mfe||0,t.ccy,displayCcy))))
    const avgMAE = mean(filtered.map(t=>Math.abs(convert(t.mae||0,t.ccy,displayCcy))))
    return { avgMFE:fix2(avgMFE), avgMAE:fix2(avgMAE) }
  },[filtered,displayCcy,rates])

  // Histogrammes Heures/Jours/Mois (gains/pertes séparés)
  const gainsLossByHour = useMemo(()=>{
    const arr=Array.from({length:24},(_,h)=>({ hour:`${String(h).padStart(2,'0')}:00`, gain:0, loss:0, n:0, wins:0 }))
    for(const t of filtered){
      const h=new Date(t.open_time || (t.date+'T00:00:00Z')).getHours()
      const v=convert(t.pnl,t.ccy,displayCcy)
      if(v>=0){ arr[h].gain+=v; arr[h].wins+=1 } else { arr[h].loss+=Math.abs(v) }
      arr[h].n+=1
    }
    return arr.map(x=>({ ...x, gain:fix2(x.gain), loss:fix2(x.loss), wr:x.n? (x.wins/x.n)*100:0 }))
  },[filtered,displayCcy,rates])

  const gainsLossByDay = useMemo(()=>{
    const map=new Map()
    for(const t of filtered){
      const d=(t.open_time?t.open_time.slice(0,10):t.date)
      const v=convert(t.pnl,t.ccy,displayCcy)
      if(!map.has(d)) map.set(d,{ day:d, gain:0, loss:0, n:0, wins:0 })
      const x=map.get(d); if(v>=0){ x.gain+=v; x.wins+=1 } else { x.loss+=Math.abs(v) } x.n+=1
    }
    const arr=Array.from(map.values()).sort((a,b)=>a.day.localeCompare(b.day))
    return arr.map(x=>({ ...x, gain:fix2(x.gain), loss:fix2(x.loss), wr:x.n? (x.wins/x.n)*100:0 }))
  },[filtered,displayCcy,rates])

  const gainsLossByMonth = useMemo(()=>{
    const map=new Map()
    for(const t of filtered){
      const d=new Date(t.open_time || (t.date+'T00:00:00Z'))
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const v=convert(t.pnl,t.ccy,displayCcy)
      if(!map.has(key)) map.set(key,{ month:key, gain:0, loss:0, n:0, wins:0 })
      const x=map.get(key); if(v>=0){ x.gain+=v; x.wins+=1 } else { x.loss+=Math.abs(v) } x.n+=1
    }
    const arr=Array.from(map.values()).sort((a,b)=>a.month.localeCompare(b.month))
    return arr.map(x=>({ ...x, gain:fix2(x.gain), loss:fix2(x.loss), wr:x.n? (x.wins/x.n)*100:0 }))
  },[filtered,displayCcy,rates])

  // Corrélation par stratégie (retours journaliers)
  const strategyDailyReturns = useMemo(()=>{
    const map=new Map()
    for(const t of filtered){
      const d=(t.close_time?t.close_time.slice(0,10):t.date)
      const v=convert(t.pnl,t.ccy,displayCcy)
      if(!map.has(t.strategy)) map.set(t.strategy,new Map())
      map.get(t.strategy).set(d,(map.get(t.strategy).get(d)||0)+v)
    }
    const dates=Array.from(new Set(Array.from(map.values()).flatMap(m=>Array.from(m.keys())))).sort((a,b)=>a.localeCompare(b))
    const base=Math.max(1,capitalBase)
    const out={}
    for(const s of Array.from(map.keys())) out[s]=dates.map(d=>(map.get(s).get(d)||0)/base)
    return out
  },[filtered,displayCcy,rates,capitalBase])
  const strategiesList=useMemo(()=>Array.from(new Set(filtered.map(t=>t.strategy))).sort(),[filtered])
  const correlationMatrix=useMemo(()=>{
    const L=strategiesList, mat=L.map(()=>L.map(()=>0))
    for(let i=0;i<L.length;i++) for(let j=0;j<L.length;j++) mat[i][j]=pearson(strategyDailyReturns[L[i]]||[],strategyDailyReturns[L[j]]||[])
    return { labels:L, values:mat }
  },[strategiesList,strategyDailyReturns])

  // Alertes horaires (≥8 trades ET (WR<35% ou pertes>gains))
  const hourAlerts=useMemo(()=>{
    const out=[]; gainsLossByHour.forEach(h=>{ if(h.n>=8 && (h.wr<35 || h.loss>h.gain)){ out.push({ hour:h.hour, n:h.n, wr:fix2(h.wr), net:fix2(h.gain-h.loss) }) }})
    return out
  },[gainsLossByHour])

  // Calendrier (sélection mois/année)
  const today=new Date()
  const [calYear,setCalYear]=useState(today.getFullYear())
  const [calMonth,setCalMonth]=useState(today.getMonth())

  return {
    // style
    colors, card: card(colors),

    // filtres
    assets, brokers, strategies,
    asset,setAsset, broker,setBroker, strategy,setStrategy,
    dateFrom,setDateFrom, dateTo,setDateTo, resetFilters,

    // devises
    displayCcy,setDisplayCcy, fmtLocal,

    // séries cash & equity
    cashflowsInRange, cashByDate, cashCumMap,
    capitalInitialDisp, pnlByDate, equityWithFlowsSeries,

    // KPI
    totalPnlDisp, cashFlowTotal, capitalBase, capitalGlobal,
    peakEquity, maxDDAbs, maxDDPct, wr, avgWin, avgLoss, rr, expectancy, globalReturnPct,
    avgWinDurMin, avgLossDurMin, sharpe, sortino, recovery,
    mfeMaeAvg,

    // histogrammes
    gainsLossByHour, gainsLossByDay, gainsLossByMonth,

    // corrélations & alertes
    correlationMatrix, hourAlerts,

    // calendrier
    dailyPnl, calYear, setCalYear, calMonth, setCalMonth
  }
}
/* ===================== Composant App (UI) ===================== */
export default function App(){
  const m = useDashboardModel()
  const c = m.colors

  // === Langue (FR / EN / ES) persistée ===
  const [lang, setLang] = React.useState(() => localStorage.getItem('zp_lang') || 'fr')
  React.useEffect(()=> localStorage.setItem('zp_lang', lang), [lang])
  const t = React.useMemo(()=> makeTranslator(lang), [lang])

  // === Titre personnalisable + icône crayon ===
  const [userTitle, setUserTitle] = React.useState(() => localStorage.getItem('zp_custom_title') || '')
  const [editingTitle, setEditingTitle] = React.useState(false)
  React.useEffect(()=> localStorage.setItem('zp_custom_title', userTitle), [userTitle])
  const titleToShow = (userTitle && userTitle.trim()) ? userTitle.trim() : t('titleDefault')

  const fmtPct = (v)=>`${v>=0?'+':''}${(v||0).toFixed(2)}%`

  return (
    <div style={{
      minHeight:'100vh', background:c.bg, color:c.text, padding:20,
      maxWidth:1540, margin:'0 auto',
      fontFamily:'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {!editingTitle ? (
              <>
                <h1 style={{ color:c.turq, fontWeight:400, margin:0, fontSize:32 }}>{titleToShow}</h1>
                <button
                  onClick={()=> setEditingTitle(true)}
                  title="Modifier le titre"
                  style={{ border:'none', background:'transparent', color:c.turq, cursor:'pointer', fontSize:18, lineHeight:1 }}
                >✎</button>
              </>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  autoFocus
                  value={userTitle}
                  onChange={e=> setUserTitle(e.target.value)}
                  onKeyDown={e=> (e.key==='Enter') && setEditingTitle(false)}
                  onBlur={()=> setEditingTitle(false)}
                  placeholder={I18N[lang].titlePlaceholder}
                  style={{
                    padding:'6px 10px', border:`1px solid ${c.border}`,
                    background:'#0f0f10', color:c.text, borderRadius:8, fontSize:14, minWidth:260
                  }}
                />
                <button onClick={()=> setEditingTitle(false)} style={{...btn(c)}}>OK</button>
              </div>
            )}
          </div>
          <p style={{ color:c.muted, fontSize:12, marginTop:4 }}>{I18N[lang].header.subtitle}</p>
        </div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <button style={btn(c)} onClick={()=>window.location.reload()}>{I18N[lang].buttons.refresh}</button>
          <button style={btn(c)} onClick={m.resetFilters}>{I18N[lang].buttons.reset}</button>

          {/* Sélecteur de langue */}
          <select aria-label={I18N[lang].buttons.language} style={{...sel(c), width:120}} value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>

          {/* Devise */}
          <select style={sel(c)} value={m.displayCcy} onChange={e=>m.setDisplayCcy(e.target.value)}>
            <option>USD</option><option>EUR</option><option>CHF</option>
          </select>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ ...m.card, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10 }}>
        <div>
          <div style={kpiTitle(c)}>{I18N[lang].filters.asset}</div>
          <select style={sel(c)} value={m.asset} onChange={e=>m.setAsset(e.target.value)}>
            <option>All</option>{m.assets.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={kpiTitle(c)}>{I18N[lang].filters.broker}</div>
          <select style={sel(c)} value={m.broker} onChange={e=>m.setBroker(e.target.value)}>
            <option>All</option>{m.brokers.map(b=><option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <div style={kpiTitle(c)}>{I18N[lang].filters.strategy}</div>
          <select style={sel(c)} value={m.strategy} onChange={e=>m.setStrategy(e.target.value)}>
            <option>All</option>{m.strategies.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={kpiTitle(c)}>{I18N[lang].filters.from}</div>
          <input type="date" style={sel(c)} value={m.dateFrom} onChange={e=>m.setDateFrom(e.target.value)} />
        </div>
        <div>
          <div style={kpiTitle(c)}>{I18N[lang].filters.to}</div>
          <input type="date" style={sel(c)} value={m.dateTo} onChange={e=>m.setDateTo(e.target.value)} />
        </div>
        <div />
        <div />
      </div>

      {/* KPI — ligne 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginTop:12 }}>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.capitalInitial}</div><div style={kpiVal}>{m.fmtLocal(m.capitalInitialDisp)}</div></div>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.cashFlow}</div><div style={{...kpiVal,color:m.cashFlowTotal>=0?c.turq:c.pink}}>{m.fmtLocal(m.cashFlowTotal)}</div></div>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.pnlFiltered}</div><div style={{...kpiVal,color:m.totalPnlDisp>=0?c.turq:c.pink}}>{m.fmtLocal(m.totalPnlDisp)}</div></div>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.capitalGlobal}</div><div style={kpiVal}>{m.fmtLocal(m.capitalGlobal)}</div></div>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.globalReturn}</div><div style={{...kpiVal,color:m.globalReturnPct>=0?c.turq:c.pink}}>{fmtPct(m.globalReturnPct)}</div></div>
        <div style={m.card}>
          <div style={kpiTitle(c)}>{I18N[lang].kpi.maxDD}</div>
          <div style={kpiVal}>
            <span style={{color: m.maxDDPct<10?'#fff': m.maxDDPct<=25?'#c8d0d6':c.pink }}>{(m.maxDDPct||0).toFixed(2)}%</span>
            {' / '}
            {m.fmtLocal(m.maxDDAbs)}
          </div>
        </div>
      </div>

      {/* KPI — ligne 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:12 }}>
        <div style={m.card}>
          <div style={kpiTitle(c)}>{I18N[lang].kpi.winRateRR}</div>
          <div style={{...kpiVal, color: ((m.wr>=60 && m.rr>=0.5) || (m.wr>=40 && m.rr>=1.0)) ? '#fff' : c.pink }}>
            {(m.wr||0).toFixed(2)}% / {(m.rr||0).toFixed(2)}
          </div>
        </div>
        <div style={m.card}>
          <div style={kpiTitle(c)}>{I18N[lang].kpi.expectancy}</div>
          <div style={{...kpiVal,color:m.expectancy>=0?'#fff':c.pink}}>{m.fmtLocal(m.expectancy)}</div>
        </div>
        <div style={m.card}>
          <div style={kpiTitle(c)}>{I18N[lang].kpi.avgWinLoss}</div>
          <div style={kpiVal}><span style={{color:c.turq}}>{m.fmtLocal(m.avgWin)}</span> / <span style={{color:c.pink}}>{m.fmtLocal(m.avgLoss)}</span></div>
        </div>
        <div style={m.card}>
          <div style={kpiTitle(c)}>{I18N[lang].kpi.avgDur}</div>
          <div style={kpiVal}><span style={{color:c.turq}}>{(m.avgWinDurMin||0).toFixed(0)} min</span> / <span style={{color:c.pink}}>{(m.avgLossDurMin||0).toFixed(0)} min</span></div>
        </div>
      </div>

      {/* KPI — ligne 3 (avancés) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:12 }}>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.sharpeSortinoRec}</div><div style={kpiVal}>{(m.sharpe||0).toFixed(2)} / {(m.sortino||0).toFixed(2)} / {(m.recovery||0).toFixed(2)}</div></div>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.mfeMae}</div><div style={kpiVal}><span style={{color:c.turq}}>{m.fmtLocal(m.mfeMaeAvg.avgMFE)}</span> / <span style={{color:c.pink}}>{m.fmtLocal(m.mfeMaeAvg.avgMAE)}</span></div></div>
        <div style={m.card}><div style={kpiTitle(c)}>{I18N[lang].kpi.corr}</div>
          <div style={{ fontSize:13, color:c.muted }}>Max |ρ|: {Number(Math.max(0,...(m.correlationMatrix.values.flat().map(v=>Math.abs(v))))).toFixed(2)}</div>
        </div>
      </div>

      {/* Courbe d’Équité (une seule courbe + points de flux) */}
      <div style={{ ...m.card, height: 420, marginTop: 16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={kpiTitle(c)}>{I18N[lang].charts.equity}</div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={m.equityWithFlowsSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke={c.axis} strokeDasharray="1 3" vertical={false} />
            <XAxis dataKey="date" stroke={c.axis} tickLine={false} axisLine={{ stroke: c.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
            <YAxis stroke={c.axis} tickLine={false} axisLine={{ stroke: c.axis, strokeWidth: 0.6 }} tick={{ fontSize: 10 }} />
            <Tooltip content={<EquityTooltip colors={c} fmt={m.fmtLocal} cashflows={m.cashflowsInRange} />} />
            <Legend wrapperStyle={{ fontSize: 12, color: c.muted, paddingTop: 4 }} />
            <Line type="monotone" dataKey="equity_with_flows" name="Equity" dot={false} stroke="#ffffff" strokeWidth={3} isAnimationActive={false} />
            {m.cashflowsInRange
              .filter(cf=>['deposit','withdrawal','prop_fee','prop_payout','darwin_mgmt_fee'].includes(cf.type))
              .map((cfi,i)=>{
                const y = m.equityWithFlowsSeries.find(p=>p.date===cfi.date)?.equity_with_flows
                if(!y) return null
                const color = cfi.amount>=0 ? c.turq : c.pink
                return <ReferenceDot key={'cf'+i} x={cfi.date} y={y} r={4} fill={color} stroke="none" />
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Histogrammes Heure / Jour / Mois */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px,1fr))', gap:14, marginTop:16 }}>
        <BarCard title={I18N[lang].charts.barHour}  data={m.gainsLossByHour}  xKey="hour"  colors={c} fmt={m.fmtLocal} />
        <BarCard title={I18N[lang].charts.barDay}   data={m.gainsLossByDay}   xKey="day"   colors={c} fmt={m.fmtLocal} />
        <BarCard title={I18N[lang].charts.barMonth} data={m.gainsLossByMonth} xKey="month" colors={c} fmt={m.fmtLocal} />
      </div>

      {/* Alertes horaires */}
      <div style={{ ...m.card, marginTop: 24 }}>
        <div style={kpiTitle(c)}>{I18N[lang].charts.alerts}</div>
        <AlertsCard colors={c} hourAlerts={m.hourAlerts} fmt={m.fmtLocal} />
      </div>

      {/* Calendrier détaillé (mois courant) */}
      <div style={{ ...m.card, marginTop: 24 }}>
        <CalendarCard
          colors={c}
          fmt={m.fmtLocal}
          lang={lang}
          displayCcy={m.displayCcy}
          dailyPnl={m.dailyPnl}
          cashflows={m.cashflowsInRange}
          equityWithFlowsSeries={m.equityWithFlowsSeries}
          capitalInitialDisp={m.capitalInitialDisp}
          calYear={m.calYear} setCalYear={m.setCalYear}
          calMonth={m.calMonth} setCalMonth={m.setCalMonth}
        />
      </div>

      <div style={{ textAlign:'center', color:c.muted, fontSize:12, marginTop:20 }}>
        ZooProjectVision © {new Date().getFullYear()}
      </div>
    </div>
  )
}
/* ===================== Composants secondaires ===================== */

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
      <div style={{ marginBottom: 6 }}>Équité: <b style={{ fontWeight:400 }}>{fmt(equity)}</b></div>
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

function BarCard({ title, data, xKey, colors, fmt }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, height: 320 }}>
      <div style={{ color: colors.muted, fontWeight:400, fontSize:13, margin:"0 0 6px" }}>{title}</div>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid stroke={colors.axis} vertical={false} />
          <XAxis dataKey={xKey} stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 11, fill: colors.muted }} />
          <YAxis stroke={colors.axis} tickLine={false} axisLine={{ stroke: colors.axis, strokeWidth: 0.6 }} tick={{ fontSize: 11, fill: colors.muted }} />
          <Tooltip
            contentStyle={{ background: "#0f1011", border:`1px solid ${colors.border}`, color: colors.text, borderRadius:12 }}
            itemStyle={{ color: colors.text }} labelStyle={{ color: colors.muted, fontSize: 11 }}
            formatter={(v, n)=>[fmt(v), n==='gain'?'Gains':'Pertes']}
          />
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
          <Bar dataKey="gain" name="Gains" fill="url(#turqGloss)" radius={[4,4,0,0]} />
          <Bar dataKey="loss" name="Pertes" fill="url(#pinkGloss)" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function AlertsCard({ colors, hourAlerts, fmt }) {
  if (!hourAlerts || hourAlerts.length === 0) {
    return <div style={{ color: colors.muted, fontSize: 13 }}>Aucune alerte — RAS sur les créneaux horaires.</div>
  }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:10 }}>
      {hourAlerts.map(a=>(
        <div key={a.hour} style={{ border:`1px solid ${colors.border}`, borderRadius:10, padding:10, background:'#121213' }}>
          <div style={{ color: colors.text, fontSize:14, marginBottom:6 }}>Heure : <span style={{ color: colors.pink }}>{a.hour}</span></div>
          <div style={{ color: colors.muted, fontSize:12 }}>Trades : {a.n} • WR : {a.wr.toFixed(1)}%</div>
          <div style={{ color: a.net>=0?colors.turq:colors.pink, fontSize:12 }}>Net : {fmt(a.net)}</div>
          <div style={{ color: colors.muted, fontSize:12, marginTop:6 }}>Suggestion : réduire l’exposition à cette heure, vérifier la logique d’entrée/sortie.</div>
        </div>
      ))}
    </div>
  )
}

function CalendarCard({
  colors, fmt, lang,
  displayCcy,
  dailyPnl, cashflows, equityWithFlowsSeries,
  capitalInitialDisp,
  calYear, setCalYear, calMonth, setCalMonth
}) {
  const cal = I18N[lang].calendar
  const equityMap = new Map(equityWithFlowsSeries.map(p=>[p.date, p.equity_with_flows]))
  const firstDay = new Date(calYear, calMonth, 1)
  const lastDay  = new Date(calYear, calMonth+1, 0)
  const firstStr = firstDay.toISOString().slice(0,10)
  const lastStr  = lastDay.toISOString().slice(0,10)

  // baseline = dernière equity avant le 1er jour
  let baseline = capitalInitialDisp
  for (const p of equityWithFlowsSeries){ if(p.date < firstStr) baseline = p.equity_with_flows; else break }

  // map pnl (par date de clôture)
  const pnlMap = new Map(dailyPnl.map(x=>[x.date, x.pnl]))
  const cashByDay = new Map()
  cashflows.forEach(c=> cashByDay.set(c.date, (cashByDay.get(c.date)||[]).concat([c])) )

  // calcul jours
  const days=[]
  const d = new Date(firstDay); let peak=baseline, eq=baseline
  while(d<=lastDay){
    const ds = d.toISOString().slice(0,10)
    const eqKnown = equityMap.get(ds)
    if(typeof eqKnown==='number'){ eq = eqKnown }
    else {
      const pnl = pnlMap.get(ds)||0
      const flows = (cashByDay.get(ds)||[]).reduce((a,c)=>a+(c.amount_disp||0),0)
      eq = eq + pnl + flows
    }
    peak = Math.max(peak, eq)
    const ddAbs = Math.max(0, peak - eq)
    const ddPct = peak>0 ? (ddAbs/peak)*100 : 0
    const pnl = pnlMap.get(ds)||0
    const flows = cashByDay.get(ds)||[]
    const pct = baseline>0 ? (pnl / baseline)*100 : 0
    days.push({ date: ds, eq, ddAbs, ddPct, pnl, pct, flows })
    d.setDate(d.getDate()+1)
  }

  const monthly = { sum: sum(days.map(x=>x.pnl)), pct: baseline>0? (sum(days.map(x=>x.pnl))/baseline)*100 : 0 }
  const yearPnl = sum(dailyPnl.filter(x=>x.date.startsWith(String(calYear)+'-')).map(x=>x.pnl))
  const yearly = { sum: yearPnl, pct: baseline>0? (yearPnl/baseline)*100 : 0 }

  const best = days.length? days.reduce((a,b)=> b.pnl>a.pnl?b:a, days[0]) : null
  const worst= days.length? days.reduce((a,b)=> b.pnl<a.pnl?b:a, days[0]) : null

  const startWeekday = (firstDay.getDay()+6)%7 // Lundi=0
  const totalCells = startWeekday + days.length
  const rows = Math.ceil(totalCells/7)
  const grid = Array.from({length: rows*7}, (_,i)=>{ const idx=i-startWeekday; return (idx>=0 && idx<days.length)? days[idx] : null })

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ color: colors.muted, fontWeight:400, fontSize:13 }}>
          {I18N[lang].charts.calendar} / {cal.months[calMonth]} {calYear}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={btn(colors)} onClick={()=>{ let m=calMonth-1, y=calYear; if(m<0){m=11;y--} setCalMonth(m); setCalYear(y) }}>◀</button>
          <button style={btn(colors)} onClick={()=>{ let m=calMonth+1, y=calYear; if(m>11){m=0;y++} setCalMonth(m); setCalYear(y) }}>▶</button>
        </div>
      </div>

      {/* Bandeau synthèse mois & année */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:12 }}>
        <div style={{ border:`1px solid ${colors.border}`, borderRadius:10, padding:10, background:'#121213' }}>
          <div style={{ color:colors.muted, fontSize:12, marginBottom:6 }}>{cal.monthly}</div>
          <div style={{ fontSize:16 }}>
            <span style={{ color: monthly.sum>=0?colors.turq:colors.pink }}>{fmt(monthly.sum, displayCcy)}</span>
            {'  •  '}
            <span style={{ color: monthly.pct>=0?colors.turq:colors.pink }}>{(monthly.pct||0).toFixed(2)}%</span>
          </div>
        </div>
        <div style={{ border:`1px solid ${colors.border}`, borderRadius:10, padding:10, background:'#121213' }}>
          <div style={{ color:colors.muted, fontSize:12, marginBottom:6 }}>{cal.yearly}</div>
          <div style={{ fontSize:16 }}>
            <span style={{ color: yearly.sum>=0?colors.turq:colors.pink }}>{fmt(yearly.sum, displayCcy)}</span>
            {'  •  '}
            <span style={{ color: yearly.pct>=0?colors.turq:colors.pink }}>{(yearly.pct||0).toFixed(2)}%</span>
          </div>
        </div>
        <div style={{ border:`1px solid ${colors.border}`, borderRadius:10, padding:10, background:'#121213' }}>
          <div style={{ color:colors.muted, fontSize:12, marginBottom:6 }}>{cal.capitalBase}</div>
          <div style={{ fontSize:16 }}>{fmt(baseline, displayCcy)}</div>
        </div>
      </div>

      {/* Entêtes jours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8, marginBottom:8, color:colors.muted, fontSize:12 }}>
        {cal.dow.map(d=> <div key={d} style={{ textAlign:'center' }}>{d}</div>)}
      </div>

      {/* Grille jours */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
        {grid.map((cell, idx) => {
          if (!cell) return <div key={idx} style={{ height:88, border:`1px dashed ${colors.border}`, borderRadius:10 }} />
          const dayNum = Number(cell.date.slice(-2))
          const isBest = best && best.date===cell.date
          const isWorst = worst && worst.date===cell.date
          const pos = cell.pnl>=0
          return (
            <div key={cell.date} title={[
              cell.date,
              `PNL: ${fmt(cell.pnl, displayCcy)} (${(cell.pct>=0?'+':'')+(cell.pct||0).toFixed(2)}%)`,
              `${cal.dd}: ${Math.abs(cell.ddPct||0).toFixed(2)}%`,
              cell.flows.length ? `Flux: ${cell.flows.map(f=>(f.amount>=0?'+':'')+fmt(f.amount_disp, displayCcy)).join(', ')}` : ''
            ].filter(Boolean).join('\n')}
              style={{ height: 88, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 8, background: '#121213', position:'relative' }}
            >
              <div style={{ fontSize:12, color: colors.muted }}>{String(dayNum).padStart(2,'0')}</div>
              <div style={{ marginTop:4, fontSize:12, color: pos ? colors.turq : colors.pink }}>{fmt(cell.pnl, displayCcy)}</div>
              <div style={{ fontSize:11, color: pos ? colors.turq : colors.pink }}>{(cell.pct>=0?'+':'')+(cell.pct||0).toFixed(2)}%</div>
              <div style={{ fontSize:11, color: colors.text }}>{cal.dd}: {Math.abs(cell.ddPct||0).toFixed(2)}%</div>
              {cell.flows.length>0 && (
                <div style={{ position:'absolute', right:8, top:8, width:8, height:8, borderRadius:'50%', background: cell.flows.some(f=>f.amount<0) ? colors.pink : colors.turq }} />
              )}
              {isBest && <Badge label={cal.top} colors={colors} turq />}
              {isWorst && <Badge label={cal.flop} colors={colors} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Badge({ label, colors, turq=false }){
  return (
    <div style={{
      position:'absolute', left:8, bottom:8, fontSize:10, padding:'2px 6px',
      borderRadius:8, border:`1px solid ${turq?colors.turq:colors.pink}`, color: turq?colors.turq:colors.pink
    }}>{label}</div>
  )
}

/* ===================== Helpers locaux ===================== */
function fmt(v, ccy='USD'){
  try { return new Intl.NumberFormat(undefined,{ style:'currency', currency:ccy, minimumFractionDigits:2, maximumFractionDigits:2 }).format(v ?? 0) }
  catch { return `${(v??0).toFixed(2)} ${ccy}` }
}
