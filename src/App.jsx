import React, { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, ReferenceDot, PieChart, Pie, Cell, ReferenceArea
} from 'recharts'

export default function App(){
  try{
    /* ================== Constantes palette ================== */
    const C = { text:'var(--text)', axis:'var(--axis)', border:'var(--border)', panel:'var(--panel)', pos:'var(--green)', neg:'var(--pink)', white:'var(--white)'}

    /* ================== Sous-titre éditable ================== */
    const [subtitle, setSubtitle] = useState(()=> localStorage.getItem('zp_subtitle') || 'dashboard de performance minimaliste')
    const [editSub, setEditSub] = useState(false)
    useEffect(()=>{ localStorage.setItem('zp_subtitle', subtitle) }, [subtitle])

    /* ================== Démo data ================== */
    const ASSETS=['XAUUSD','US500','USTEC','BTCUSD']
    const BROKERS=['Darwinex','ICMarkets','Pepperstone']
    const STRATS=['Breakout','Reversal','ORB']

    const demoTrades = useMemo(()=>{
      const out=[]; const today=new Date()
      for(let i=180;i>=1;i--){
        const d=new Date(today); d.setDate(d.getDate()-i)
        const date=d.toISOString().slice(0,10)
        const n=2+Math.floor(Math.random()*3)
        for(let k=0;k<n;k++){
          const asset=ASSETS[(i+k)%ASSETS.length]
          const broker=BROKERS[(i+2*k)%BROKERS.length]
          const strategy=STRATS[(i+3*k)%STRATS.length]
          let pnl=(Math.random()-0.5)*(Math.random()<0.18?2000:600)
          pnl=round2(pnl)
          const open=new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(Math.random()*24), Math.floor(Math.random()*60))
          const close=new Date(open.getTime()+(15+Math.floor(Math.random()*480))*60000)
          const mfe=round2(Math.abs(pnl)*(0.8+Math.random()*0.8))
          const mae=round2(Math.abs(pnl)*(0.6+Math.random()*0.8))
          out.push({ date, asset, broker, strategy, pnl, ccy:'USD', open_time:open.toISOString(), close_time:close.toISOString(), mfe, mae })
        }
      }
      return out
    },[])

    /* ================== Devises & formatage ================== */
    const CAPITAL_INITIAL_USD=100000
    const [displayCcy, setDisplayCcy]=useState('USD')
    const fx={ USD:{USD:1,EUR:0.93,CHF:0.88}, EUR:{USD:1/0.93,EUR:1,CHF:0.88/0.93}, CHF:{USD:1/0.88,EUR:0.93/0.88,CHF:1} }
    const convert=(v,from='USD',to=displayCcy)=>{ if(v==null) return 0; if(from===to) return round2(v); const r=fx[from]?.[to]??1; return round2(v*r) }
    const fmtC=(v,ccy=displayCcy)=>{ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:ccy,minimumFractionDigits:2,maximumFractionDigits:2}).format(v??0)}catch{ return `${(v??0).toFixed(2)} ${ccy}` } }
    const numColor=(v)=> v>0?C.pos:(v<0?C.neg:C.text)

    /* ================== Persistance trades & flux ================== */
    const [userTrades,setUserTrades]=useState(()=>{ try{const r=localStorage.getItem('zp_user_trades'); return r?JSON.parse(r):[]}catch{return[]} })
    useEffect(()=>{ try{localStorage.setItem('zp_user_trades',JSON.stringify(userTrades))}catch{} },[userTrades])

    const [userCashflows,setUserCashflows]=useState(()=>{ try{const r=localStorage.getItem('zp_user_cashflows'); return r?JSON.parse(r):[]}catch{return[]} })
    useEffect(()=>{ try{localStorage.setItem('zp_user_cashflows',JSON.stringify(userCashflows))}catch{} },[userCashflows])

    /* ====== Capital tiers sous gestion ====== */
    const [managed, setManaged]=useState(()=>{ try{const r=localStorage.getItem('zp_managed_capital'); return r?JSON.parse(r):[]}catch{return[]} })
    useEffect(()=>{ try{localStorage.setItem('zp_managed_capital',JSON.stringify(managed))}catch{} },[managed])

    /* ================== Import CSV ================== */
    function parseCSV(text){ const lines=text.trim().split(/\r?\n/); if(!lines.length) return []; const headers=lines.shift().split(',').map(h=>h.trim().replace(/^"|"$/g,'')); const rows=[]; for(const line of lines){ const cols=line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)||[]; const obj={}; headers.forEach((h,i)=>obj[h]=(cols[i]||'').replace(/^"|"$/g,'')); rows.push(obj)} return rows }
    function mapMT5Rows(rows){ return rows.map(r=>{ const date=(r['Time']||r['Open time']||r['Open Time']||r['Date']||'').slice(0,10); const asset=r['Symbol']||r['Instrument']||r['Symbol name']||'UNKNOWN'; const broker=r['Broker']||'Unknown'; const strategy=r['Strategy']||'Unknown'; const pnl=Number(r['Profit']||r['PnL']||r['PL']||r['Net P/L']||0); const open=r['Time']||r['Open time']||r['Open Time']||''; const close=r['Close time']||r['Close Time']||''; const mfe=Number(r['MFE']||r['MFE Profit']||r['Max Favorable Excursion']||0); const mae=Number(r['MAE']||r['MAE Profit']||r['Max Adverse Excursion']||0); return { date, asset, broker, strategy, pnl:round2(pnl), ccy:'USD', open_time:open, close_time:close, mfe:round2(Math.abs(mfe)), mae:round2(Math.abs(mae)) } }).filter(r=>r.date) }

    /* ================== Filtres ================== */
    const tradesAll=useMemo(()=> demoTrades.concat(userTrades), [demoTrades,userTrades])
    const [asset,setAsset]=useState('All'); const [broker,setBroker]=useState('All'); const [strategy,setStrategy]=useState('All'); const [dateFrom,setDateFrom]=useState(''); const [dateTo,setDateTo]=useState('')
    const resetFilters=()=>{ setAsset('All'); setBroker('All'); setStrategy('All'); setDateFrom(''); setDateTo('') }
    const assets=useMemo(()=>Array.from(new Set(tradesAll.map(t=>t.asset))),[tradesAll])
    const brokers=useMemo(()=>Array.from(new Set(tradesAll.map(t=>t.broker))),[tradesAll])
    const strats=useMemo(()=>Array.from(new Set(tradesAll.map(t=>t.strategy))),[tradesAll])
    const filtered=useMemo(()=>tradesAll.filter(t=>{ if(asset!=='All'&&t.asset!==asset) return false; if(broker!=='All'&&t.broker!==broker) return false; if(strategy!=='All'&&t.strategy!==strategy) return false; if(dateFrom&&t.date<dateFrom) return false; if(dateTo&&t.date>dateTo) return false; return true }),[tradesAll,asset,broker,strategy,dateFrom,dateTo])

    /* ================== Cashflows ================== */
    const [showFlow,setShowFlow]=useState(false)
    const [flow,setFlow]=useState({ date:new Date().toISOString().slice(0,10), type:'deposit', amount:'', ccy:displayCcy, note:'' })
    useEffect(()=>{ setFlow(f=>({...f, ccy:displayCcy})) },[displayCcy])

    const flowTypes=[
      {value:'deposit',label:'Dépôt (apport)'},
      {value:'withdrawal',label:'Retrait'},
      {value:'prop_fee',label:'Paiement challenge (prop)'} ,
      {value:'prop_payout',label:'Prop firm — payout'},
      {value:'darwin_mgmt_fee',label:'Darwinex — management fee'},
      {value:'business_expense',label:'Charge business'},
      {value:'other_income',label:'Autre revenu'}
    ]
    const allCashflows=useMemo(()=>userCashflows,[userCashflows])
    const cashflowsInRange=useMemo(()=> allCashflows.filter(c=>{ if(dateFrom&&c.date<dateFrom) return false; if(dateTo&&c.date>dateTo) return false; return true }).map(c=>({...c, amount_disp:convert(c.amount,c.ccy,displayCcy)})), [allCashflows,dateFrom,dateTo,displayCcy])
    const submitFlow=(e)=>{ e.preventDefault(); const amt=Number(flow.amount); if(!flow.date||!flow.type||isNaN(amt)){ alert('merci de compléter date / type / montant'); return } setUserCashflows(p=>p.concat([{date:flow.date,type:flow.type,amount:amt,ccy:flow.ccy||displayCcy,note:flow.note||''}])); setShowFlow(false); setFlow({date:new Date().toISOString().slice(0,10),type:'deposit',amount:'',ccy:displayCcy,note:''}) }

    /* ================== Capital & KPIs ================== */
    const capitalInitialDisp=useMemo(()=> convert(CAPITAL_INITIAL_USD,'USD',displayCcy),[displayCcy])
    const cashFlowTotal=useMemo(()=> cashflowsInRange.reduce((a,c)=>a+(c.amount_disp||0),0),[cashflowsInRange])
    const capitalBase=useMemo(()=> round2(capitalInitialDisp+cashFlowTotal),[capitalInitialDisp,cashFlowTotal])

    const totalPnlDisp=useMemo(()=> filtered.reduce((s,t)=>s+convert(t.pnl,t.ccy||'USD',displayCcy),0),[filtered,displayCcy])
    const capitalGlobal=round2(capitalBase+totalPnlDisp)

    /* ====== Equity séries (trading seul / avec flux) ====== */
    function groupByDateSum(rows){ const m=new Map(); for(const r of rows){ const v=convert(r.pnl,r.ccy||'USD',displayCcy); m.set(r.date,(m.get(r.date)||0)+v) } return Array.from(m,([date,pnl])=>({date,pnl})).sort((a,b)=>a.date.localeCompare(b.date)) }
    const pnlByDate=useMemo(()=> groupByDateSum(filtered),[filtered,displayCcy])
    const cashByDate=useMemo(()=>{ const m=new Map(); for(const c of cashflowsInRange){ m.set(c.date,(m.get(c.date)||0)+(c.amount_disp||0)) } return Array.from(m,([date,cash])=>({date,cash})).sort((a,b)=>a.date.localeCompare(b.date)) },[cashflowsInRange])
    const mergedDates=useMemo(()=>{ const s=new Set(); pnlByDate.forEach(x=>s.add(x.date)); cashByDate.forEach(x=>s.add(x.date)); return Array.from(s).sort((a,b)=>a.localeCompare(b)) },[pnlByDate,cashByDate])
    const pnlMap=useMemo(()=>{ const m=new Map(); pnlByDate.forEach(p=>m.set(p.date,p.pnl)); return m },[pnlByDate])
    const cashCumMap=useMemo(()=>{ let cum=0; const m=new Map(); for(const c of cashByDate){ cum+=c.cash; m.set(c.date,round2(cum)) } return m },[cashByDate])

    const equityMerged=useMemo(()=>{ let eqTrading=capitalInitialDisp; const out=[]; for(const d of mergedDates){ eqTrading+=(pnlMap.get(d)||0); const cashCum=(cashCumMap.get(d)||0); out.push({ date:d, equity_trading:round2(eqTrading), equity_with_flows:round2(eqTrading+cashCum) }) } return out },[mergedDates,pnlMap,cashCumMap,capitalInitialDisp])

    const equityHL=useMemo(()=>{ let h=-Infinity,l=Infinity; return equityMerged.map(p=>{ h=Math.max(h,p.equity_trading); l=Math.min(l,p.equity_trading); return {...p, hwm:round2(h), lwm:round2(l)} }) },[equityMerged])
    const {peak,trough,maxDDAbs,maxDDPct}=useMemo(()=>{ if(!equityHL.length) return {peak:0,trough:0,maxDDAbs:0,maxDDPct:0}; let peakSeen=equityHL[0].equity_trading, maxDrop=0; for(const p of equityHL){ if(p.equity_trading>peakSeen) peakSeen=p.equity_trading; const drop=peakSeen-p.equity_trading; if(drop>maxDrop) maxDrop=drop } const pe=Math.max(...equityHL.map(e=>e.equity_trading)); const tr=Math.min(...equityHL.map(e=>e.equity_trading)); return { peak:pe, trough:tr, maxDDAbs:round2(maxDrop), maxDDPct: pe>0 ? (maxDrop/pe)*100 : 0 } },[equityHL])

    /* ====== Equity — vues multiples ====== */
    const [eqView,setEqView]=useState('equity') // 'equity' | 'pnl' | 'strat'
    const pnlCumul=useMemo(()=>{ let cum=0; return pnlByDate.map(d=>{ cum+=d.pnl; return { date:d.date, pnl_cum:round2(cum) } }) },[pnlByDate])

    // Par stratégie (index rebasé 100) et PnL cumulé par stratégie
    const byStratSeries=useMemo(()=>{
      const byStrat=new Map()
      for(const t of filtered){ const key=t.strategy; const v=convert(t.pnl,t.ccy||'USD',displayCcy); if(!byStrat.has(key)) byStrat.set(key,new Map()); const m=byStrat.get(key); m.set(t.date,(m.get(t.date)||0)+v) }
      const dates=Array.from(new Set(filtered.map(t=>t.date))).sort()
      const out={}
      for(const s of byStrat.keys()){
        let val=100; const arr=[]; for(const d of dates){ val += (byStrat.get(s).get(d)||0)/Math.max(1,capitalInitialDisp/10); arr.push({date:d, value:round2(val)}) } out[s]=arr
      }
      return {dates, series:out}
    },[filtered,displayCcy,capitalInitialDisp])

    const byStratPnl = useMemo(()=>{
      const byStrat = new Map()
      for(const t of filtered){
        const key = t.strategy
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        if(!byStrat.has(key)) byStrat.set(key, new Map())
        const m = byStrat.get(key)
        m.set(t.date, (m.get(t.date)||0) + v)
      }
      const dates = Array.from(new Set(filtered.map(t=>t.date))).sort()
      const out = {}
      for(const s of byStrat.keys()){
        let cum = 0
        const arr = []
        for(const d of dates){ cum += (byStrat.get(s).get(d)||0); arr.push({ date:d, value: round2(cum) }) }
        out[s] = arr
      }
      return { dates, series: out }
    }, [filtered, displayCcy])

    /* ====== Ratios & qualité ====== */
    const wins=filtered.filter(t=>t.pnl>0).length
    const wr=filtered.length? (wins/filtered.length) : 0
    const posVals=filtered.filter(t=>t.pnl>0).map(t=>convert(t.pnl,t.ccy||'USD',displayCcy))
    const negVals=filtered.filter(t=>t.pnl<0).map(t=>Math.abs(convert(t.pnl,t.ccy||'USD',displayCcy)))
    const avgWin=posVals.length? mean(posVals):0
    const avgLoss=negVals.length? mean(negVals):0
    const rr=avgLoss>0? (avgWin/avgLoss) : 0
    const expectancy=filtered.length? (posVals.reduce((a,b)=>a+b,0)-negVals.reduce((a,b)=>a+b,0))/filtered.length : 0

    // Edge Index (WR & RR combiné)
    const EI = (wr*rr) - (1-wr)
    const verdictEI = colorVerdict(EI, { good: 0.05, bad: -0.05 })

    // Données Win/Lose totales
    const winnersCount=wins
    const losersCount=filtered.length-wins

    /* ====== Pace annuel vs 20% (projection) ====== */
    const firstDate = filtered.length? filtered[0].date : (new Date().toISOString().slice(0,10))
    const days=daysBetween(firstDate, equityHL.at(-1)?.date || firstDate)
    const retPeriod = capitalBase>0? (totalPnlDisp/capitalBase) : 0
    const paceAnnual = days>0? (Math.pow(1+retPeriod, 365/Math.max(1,days)) - 1) : 0

    /* ====== MFE/MAE (quotidien & cumul) ====== */
    const mfeMaeDaily=useMemo(()=>{ const map=new Map(); for(const t of filtered){ const d=t.date; const mfe=convert(t.mfe??0,t.ccy||'USD',displayCcy); const mae=Math.abs(convert(t.mae??0,t.ccy||'USD',displayCcy)); if(!map.has(d)) map.set(d,{date:d,sMFE:0,sMAE:0,n:0}); const x=map.get(d); x.sMFE+=Math.max(0,mfe); x.sMAE+=Math.max(0,mae); x.n++ } const arr=Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date)); let cumM=0,cumA=0; return arr.map(r=>{ const avgM=r.n? r.sMFE/r.n : 0; const avgA=r.n? r.sMAE/r.n : 0; cumM+=r.sMFE; cumA+=r.sMAE; return {date:r.date, avgMFE:round2(avgM), avgMAE:round2(avgA), cumMFE:round2(cumM), cumMAE:round2(cumA)} }) },[filtered,displayCcy])

    /* ====== Corrélation: heatmap + glissante ====== */
    const corrMatrix=useMemo(()=> buildCorrMatrix(filtered,displayCcy,convert),[filtered,displayCcy])
    const [pair,setPair]=useState(()=>{ const ks=Object.keys(corrMatrix.series||{}); return ks.length>1? `${ks[0]}|${ks[1]}`:'' })
    const rolling=useMemo(()=> rollCorr(corrMatrix, pair, 30), [corrMatrix, pair])

    /* ====== Calendrier enrichi ====== */
    const lastDate = equityHL.at(-1)?.date || new Date().toISOString().slice(0,10)
    const [calYear,setCalYear]=useState(Number(lastDate.slice(0,4)))
    const [calMonth,setCalMonth]=useState(Number(lastDate.slice(5,7))-1)
    const calDates=useMemo(()=> monthDays(calYear,calMonth),[calYear,calMonth])

    const pnlDayMap=useMemo(()=>{ const m=new Map(); for(const t of filtered){ m.set(t.date,(m.get(t.date)||0)+convert(t.pnl,t.ccy||'USD',displayCcy)) } return m },[filtered,displayCcy])

    const equityMap=useMemo(()=>{ const m=new Map(); for(const e of equityHL){ m.set(e.date, e.equity_trading) } return m },[equityHL])

    const dailyRetMap=useMemo(()=>{ const m=new Map(); const dates=equityHL.map(e=>e.date); for(let i=1;i<dates.length;i++){ const prev=equityMap.get(dates[i-1])||0; const curr=equityMap.get(dates[i])||0; const r= prev>0 ? (curr-prev)/prev : 0; m.set(dates[i], r) } return m },[equityHL,equityMap])

    const ddDailyMap=useMemo(()=>{ const m=new Map(); let peak=-Infinity; for(const p of equityHL){ peak=Math.max(peak,p.equity_trading); const dd=peak>0? (p.equity_trading-peak)/peak : 0; m.set(p.date, dd) } return m },[equityHL])

    const countMap=useMemo(()=>{ const m=new Map(); for(const t of filtered){ m.set(t.date,(m.get(t.date)||0)+1) } return m },[filtered])

    /* ====== Heat helpers (cadres tricolores) ====== */
    const verdictReturn   = colorVerdict(retPeriod, { good: 0, warnLo: -0.05 })
    const verdictPace     = colorVerdict(paceAnnual, { good: 0.20, warnLo: 0.08 })
    const verdictCapDelta = colorVerdict(capitalGlobal-capitalBase, { good: 0, warnAbs: capitalBase*0.005 }) // +/-0.5%
    const verdictDD       = colorVerdict(-maxDDPct/100, { good: 0, warnLo: -0.25 })
    const recovery        = maxDDAbs>0? ((equityHL.at(-1)?.equity_trading||capitalInitialDisp)-capitalInitialDisp)/maxDDAbs : 0
    const verdictRecov    = classBy(recovery, [1.5, 0.7])
    const sharpe=calcSharpe(equityHL)
    const sortino=calcSortino(equityHL)
    const verdictSharpe   = classBy(sharpe, [1.0, 0.5])
    const verdictSortino  = classBy(sortino,[1.2, 0.8])
    const verdictExpect   = classBy(expectancy, [0.01, -0.01])
    const corrAvg = corrMatrix.avg ?? 0
    const verdictCorr     = classByRev(corrAvg, [0.20, 0.50])

    /* ====== Risque de ruine (KPI secondaire) ====== */
    const ruin = useMemo(()=>{
      const WR=wr; const q=1-WR
      const avgLossAbs = avgLoss || 0.001
      const r = capitalBase>0 ? (avgLossAbs/capitalBase) : 0.002
      const seuil=0.30
      const N = Math.ceil(Math.log(1-seuil)/Math.log(Math.max(1e-6,1-r)))
      const T = filtered.length
      const pSeq = Math.pow(q, N)
      const blocks = Math.max(1, Math.floor(T/Math.max(1,N)))
      const ROR = 1 - Math.pow(1-pSeq, blocks)
      return { ROR, N, r }
    },[wr,avgLoss,capitalBase,filtered.length])
    const verdictRuin = classByRev(ruin.ROR, [0.05, 0.20])

    /* ====== Vue Stratégies: sous-mode ====== */
    const [stratMode, setStratMode] = useState('index') // 'index' | 'pnl'

    /* ====== Palette couleurs stratégies ====== */
    const stratColors = useMemo(()=>{
      const base = ['#ffffff','#8a8f94','#20e3d6','#ff5fa2','#c9a44b','#7dd3fc','#a78bfa','#34d399','#fbbf24','#fb7185','#60a5fa','#22c55e']
      const names = Object.keys(byStratPnl.series||{})
      const map = {}
      names.forEach((n,i)=> map[n] = base[i % base.length])
      return map
    },[byStratPnl])

    /* ================== Fuseau horaire par broker ================== */
    const brokerTZ = {
      Darwinex: 'Europe/Madrid',
      ICMarkets: 'Australia/Sydney',
      Pepperstone: 'Australia/Melbourne'
    }
    // helpers TZ
    const getHourInTZ = (iso, tz) => {
      if(!iso) return null
      try{
        const parts = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hour12:false,timeZone:tz}).formatToParts(new Date(iso))
        const h = Number(parts.find(p=>p.type==='hour')?.value || '0')
        return isFinite(h)? h : null
      }catch{ return null }
    }
    const getWeekdayInTZ = (iso, tz) => {
      if(!iso) return null
      try{
        const parts = new Intl.DateTimeFormat('fr-FR',{weekday:'short', timeZone:tz}).formatToParts(new Date(iso))
        const w = parts.find(p=>p.type==='weekday')?.value?.toLowerCase() || ''
        const map = { 'lun.':1, 'mar.':2, 'mer.':3, 'jeu.':4, 'ven.':5, 'sam.':6, 'dim.':7 }
        return map[w] || null
      }catch{ return null }
    }
    const getMonthInTZ = (iso, tz) => {
      if(!iso) return null
      try{
        const parts = new Intl.DateTimeFormat('fr-FR',{month:'2-digit', timeZone:tz}).formatToParts(new Date(iso))
        const m = Number(parts.find(p=>p.type==='month')?.value || '1')
        return isFinite(m)? m : null
      }catch{ return null }
    }

    /* =========== Fenêtre par défaut pour les nouveaux graphiques (30j si pas de dates) =========== */
    const default30From = useMemo(()=>{
      if(dateFrom || dateTo) return null
      const d = new Date()
      d.setDate(d.getDate()-30)
      return d.toISOString().slice(0,10)
    },[dateFrom,dateTo])

    const filteredForTimeAgg = useMemo(()=>{
      if(default30From){
        return filtered.filter(t => t.date >= default30From)
      }
      return filtered
    },[filtered, default30From])

    /* =========== Agrégations heure / weekday / mois (en TZ broker) =========== */
    const hourlyAgg = useMemo(()=>{
      const base = Array.from({length:24}, (_,h)=>({ key: String(h).padStart(2,'0')+':00', gain:0, loss:0 }))
      const idx = (h)=> (h>=0 && h<=23)? h : null
      for(const t of filteredForTimeAgg){
        const tz = brokerTZ[t.broker] || 'UTC'
        const h = idx(getHourInTZ(t.open_time || (t.date+'T00:00:00Z'), tz))
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        if(h==null) continue
        if(v>=0) base[h].gain += v; else base[h].loss += Math.abs(v)
      }
      return base.map(b=> ({...b, gain:round2(b.gain), loss:round2(b.loss), net: round2(b.gain - b.loss)}))
    },[filteredForTimeAgg, displayCcy])

    const weekdayAgg = useMemo(()=>{
      const names = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
      const base = names.map((n,i)=>({ key:n, idx:i+1, gain:0, loss:0 }))
      for(const t of filteredForTimeAgg){
        const tz = brokerTZ[t.broker] || 'UTC'
        const w = getWeekdayInTZ(t.open_time || (t.date+'T00:00:00Z'), tz)
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        const b = base.find(x=>x.idx===w)
        if(!b) continue
        if(v>=0) b.gain += v; else b.loss += Math.abs(v)
      }
      return base.map(b=> ({...b, gain:round2(b.gain), loss:round2(b.loss), net: round2(b.gain - b.loss)}))
    },[filteredForTimeAgg, displayCcy])

    const monthAgg = useMemo(()=>{
      const names = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
      const base = names.map((n,i)=>({ key:n, idx:i+1, gain:0, loss:0 }))
      for(const t of filteredForTimeAgg){
        const tz = brokerTZ[t.broker] || 'UTC'
        const m = getMonthInTZ(t.open_time || (t.date+'T00:00:00Z'), tz)
        const v = convert(t.pnl, t.ccy||'USD', displayCcy)
        const b = base.find(x=>x.idx===m)
        if(!b) continue
        if(v>=0) b.gain += v; else b.loss += Math.abs(v)
      }
      return base.map(b=> ({...b, gain:round2(b.gain), loss:round2(b.loss), net: round2(b.gain - b.loss)}))
    },[filteredForTimeAgg, displayCcy])

    /* ================== UI Etat ================== */
    const [showManagedForm,setShowManagedForm]=useState(false)

    /* ====== Calendrier résumé mois ====== */
    const ymLabel = `${calYear}-${String(calMonth+1).padStart(2,'0')}`
    const monthPnl = useMemo(()=>{ let s=0; for(const [d,v] of pnlDayMap){ if(d.startsWith(ymLabel)) s+=v } return s },[pnlDayMap,ymLabel])
    const { monthDDPct, monthDDAbs } = useMemo(()=>{
      const pts = equityHL.filter(p => p.date.startsWith(ymLabel))
      if(!pts.length) return { monthDDPct: 0, monthDDAbs: 0 }
      let peakM = pts[0].equity_trading, maxDropAbs=0
      for(const p of pts){ peakM=Math.max(peakM,p.equity_trading); const drop=peakM-p.equity_trading; if(drop>maxDropAbs) maxDropAbs=drop }
      const pct = peakM>0 ? (maxDropAbs/peakM)*100 : 0
      return { monthDDPct: pct, monthDDAbs: maxDropAbs }
    },[equityHL,ymLabel])

    /* ================== Render ================== */
    return (
      <div className="container">
        {/* HEADER */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:12}}>
          <div>
            <h1 className="title-main">ZooProjectVision</h1>
            <div className="inline-edit">
              {editSub ? (
                <>
                  <input value={subtitle} onChange={e=>setSubtitle(e.target.value)} />
                  <button className="btn" onClick={()=>setEditSub(false)}>Valider</button>
                </>
              ) : (
                <>
                  <p className="subtitle">{subtitle}</p>
                  <button className="btn" onClick={()=>setEditSub(true)} title="Modifier le sous-titre">✏️</button>
                </>
              )}
            </div>
          </div>

          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            {/* Import CSV */}
            <label className="btn" style={{position:'relative'}}>
              Importer CSV
              <input type="file" accept=".csv" style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}
                onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; const fr=new FileReader(); fr.onload=()=>{ const rows=parseCSV(String(fr.result)); const mapped=mapMT5Rows(rows); if(!mapped.length){ alert('csv non reconnu (time/symbol/profit requis).'); return } setUserTrades(prev=>prev.concat(mapped)) }; fr.readAsText(f) }}/>
            </label>
            <button className="btn" onClick={()=>setShowFlow(true)}>Ajouter Flux</button>
            <button className="btn" onClick={()=>setShowManagedForm(true)}>Capital Tiers</button>
            <button className="btn" onClick={resetFilters}>Réinitialiser</button>
            <select className="select" value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)}>
              {['CHF','EUR','USD'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* FILTRES */}
        <div className="card" style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10}}>
          <Field label="Actif"><select className="select" value={asset} onChange={e=>setAsset(e.target.value)}><option>All</option>{assets.map(a=><option key={a}>{a}</option>)}</select></Field>
          <Field label="Broker"><select className="select" value={broker} onChange={e=>setBroker(e.target.value)}><option>All</option>{brokers.map(b=><option key={b}>{b}</option>)}</select></Field>
          <Field label="Stratégie"><select className="select" value={strategy} onChange={e=>setStrategy(e.target.value)}><option>All</option>{strats.map(s=><option key={s}>{s}</option>)}</select></Field>
          <Field label="Du"><input className="input" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></Field>
          <Field label="Au"><input className="input" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></Field>
        </div>

        {/* KPIs PRINCIPAUX */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:12, marginTop:12}}>
          <KPI title="Capital Initial" value={fmtC(capitalInitialDisp)} color={C.white} />
          <KPI title="Cash Flow" value={fmtC(cashFlowTotal)} color={numColor(cashFlowTotal)} />
          <KPI title="PNL (Filtré)" value={fmtC(totalPnlDisp)} color={numColor(totalPnlDisp)} />
          <KPI title="Capital Global" value={fmtC(capitalGlobal)} color={numColor(capitalGlobal-capitalBase)} />
          <KPI title="Total Trades" value={filtered.length} />
          <KPI title="Max DD (%)" value={`${maxDDPct.toFixed(2)}%`} />
          <KPI title="Max DD (Abs)" value={fmtC(maxDDAbs)} />
          <KPI title="Capital Tiers Sous Gestion" value={fmtC(sumManaged(managed, displayCcy, convert))} help="Somme des capitaux tiers actifs (début ≤ aujourd’hui ≤ fin/—). N’influence pas la courbe d’équité." />
        </div>

        {/* RATIOS PRIORITAIRES — KPI Win Rate & RR */}
        <div className={`card ${verdictEI}`} style={{marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
            <div className="kpi-title">Win Rate & Risk/Reward</div>
            <Help text="Verdict via Edge Index: EI = WR*RR − (1−WR). Vert ≥ +0.05, Jaune [−0.05;+0.05], Rouge < −0.05. Expectancy par trade affichée en devise."/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
            {/* Donut WR — centrage corrigé V4.2 */}
            <div className="card" style={{height:240, position:'relative', display:'flex', flexDirection:'column'}}>
              <div className="kpi-title">Win Rate</div>
              <div style={{position:'relative', flex:'1 1 auto'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{name:'Gagnants', value:winnersCount},{name:'Perdants', value:losersCount}]}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={82}
                      stroke="none"
                    >
                      <Cell fill={C.pos} /><Cell fill={C.neg} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                  pointerEvents:'none', color:'var(--text)'
                }}>
                  {(wr*100).toFixed(1)}%
                </div>
              </div>
            </div>
            {/* Barres gagnants/perdants */}
            <div className="card" style={{height:240}}>
              <div className="kpi-title">Gagnants / Perdants</div>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={[{type:'Gagnants', n:winnersCount},{type:'Perdants', n:losersCount}]}>
                  <CartesianGrid stroke="#2b2b2b" />
                  <XAxis dataKey="type" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                  <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                  <Tooltip content={<GLTooltip C={C} fmtC={fmtC} />} />
                  <Bar dataKey="n">
                    <Cell fill={C.pos} /><Cell fill={C.neg} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* RR + Expectancy */}
            <div className="card" style={{display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div><div className="kpi-title">Risk/Reward (RR)</div><div style={{color:C.text}}>{rr.toFixed(2)}</div></div>
              <div><div className="kpi-title">Expectancy / Trade</div><div style={{color:C.text}}>{fmtC(expectancy)}</div></div>
              <div style={{opacity:.85, color:'#bfc5c9'}}>Edge Index: {EI.toFixed(3)}</div>
            </div>
          </div>
        </div>

        {/* AUTRES RATIOS */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12, marginTop:12}}>
          <KPI title="Return (Période)" value={`${(retPeriod*100).toFixed(2)}%`} className={verdictReturn} help="PnL / (capital initial + cash-flows) sur la période filtrée." />
          <KPI title="Pace Annuel (vs 20%)" value={`${(paceAnnual*100).toFixed(2)}%`} className={verdictPace} help="Projection annualisée: (1+R)^(365/jours)−1." />
          <KPI title="Capital Global vs Base" value={fmtC(capitalGlobal-capitalBase)} className={verdictCapDelta} help="Delta vs capital de base (capital initial converti + cashflows)." />
          <KPI title="Sharpe (Ann.)" value={sharpe.toFixed(2)} className={verdictSharpe} />
          <KPI title="Sortino (Ann.)" value={sortino.toFixed(2)} className={verdictSortino} />
          <KPI title="Recovery Factor" value={recovery.toFixed(2)} className={verdictRecov} />
          <KPI title="Expectancy" value={fmtC(expectancy)} className={verdictExpect} />
          <KPI title="Corrélation Moyenne" value={corrAvg.toFixed(2)} className={verdictCorr} />
          <KPI title="Risque De Ruine" value={`${(ruin.ROR*100).toFixed(1)}%`} className={verdictRuin} help={`Seuil -30%. Estimation: r≈${(ruin.r*100).toFixed(2)}%/trade, N pertes d'affilée ≈ ${ruin.N}.`} />
        </div>

        {/* COURBE D’ÉQUITÉ — 3 VUES */}
        <div className="card" style={{height:460, marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
            <div className="kpi-title">Courbe — Équité / PnL Global / Stratégie(s)</div>
            <div style={{display:'flex', gap:8}}>
              {['equity','pnl','strat'].map(k => (
                <button key={k} className="btn" onClick={()=>setEqView(k)}>
                  {k==='equity' ? 'Équité' : k==='pnl' ? 'PnL Global' : 'Stratégie(s)'}
                </button>
              ))}
            </div>
          </div>

          {eqView==='equity' && (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={equityHL} margin={{left:8,right:8,top:8,bottom:8}}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <Tooltip contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}}
                         labelStyle={{color:C.text}} itemStyle={{color:C.text}}
                         formatter={(v,n)=>[fmtC(v), n]} />
                <Legend wrapperStyle={{fontSize:'var(--font-size)', color:C.text}} />
                <Line type="monotone" dataKey="equity_trading" name="Équité (trading seul)" dot={false} stroke={C.white} strokeWidth={1.8} isAnimationActive={false} />
                <Line type="monotone" dataKey="equity_with_flows" name="Équité (avec flux)" dot={false} stroke="#B6BCC1" strokeWidth={1.4} strokeDasharray="5 4" />
                <Line type="monotone" dataKey="hwm" name="HWM" dot={false} stroke={C.pos} strokeWidth={1.2} strokeDasharray="4 3" />
                <Line type="monotone" dataKey="lwm" name="LWM" dot={false} stroke={C.neg} strokeWidth={1.0} strokeDasharray="4 3" />
                {cashflowsInRange.map((c,i)=>{
                  const y = equityWithFlowsAt(equityHL,c.date)
                  if(y==null) return null
                  const color = c.amount>=0 ? C.pos : C.neg
                  return <ReferenceDot key={i} x={c.date} y={y} r={4} fill={color} stroke="none" />
                })}
              </LineChart>
            </ResponsiveContainer>
          )}

          {eqView==='pnl' && (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={pnlCumul} margin={{left:8,right:8,top:8,bottom:8}}>
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <Tooltip contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}} formatter={(v)=>fmtC(v)} />
                <Line type="monotone" dataKey="pnl_cum" name="PnL Cumulatif (base 0)" dot={false} stroke={C.white} strokeWidth={1.8} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {eqView==='strat' && (
            <>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginBottom:6}}>
                <button className="btn" onClick={()=>setStratMode('index')}>Index (base 100)</button>
                <button className="btn" onClick={()=>setStratMode('pnl')}>PnL</button>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart margin={{left:8,right:8,top:8,bottom:8}}>
                  <CartesianGrid stroke="#2b2b2b" />
                  <XAxis dataKey="date" type="category" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} allowDuplicatedCategory={false} />
                  <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                  <Tooltip contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}} />
                  {(stratMode==='index' ? Object.keys(byStratSeries.series) : Object.keys(byStratPnl.series)).map((s,i)=> (
                    <Line
                      key={s}
                      data={(stratMode==='index'? byStratSeries.series[s] : byStratPnl.series[s])}
                      dataKey="value"
                      name={s}
                      dot={false}
                      stroke={stratColors[s] || (i===0?C.white:'#8a8f94')}
                      strokeWidth={i===0?1.8:1.0}
                      strokeDasharray={i===0?undefined:'4 3'}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          <div style={{display:'flex', gap:16, color:C.text, marginTop:6}}>
            <span>Peak: <b style={{color:C.text}}>{fmtC(peak)}</b></span>
            <span>Trough: <b style={{color:C.text}}>{fmtC(trough)}</b></span>
            <span>Max DD: <b style={{color:C.text}}>{maxDDPct.toFixed(2)}%</b> ({fmtC(maxDDAbs)})</span>
          </div>
        </div>

        {/* NOUVEAUX GRAPHIQUES — PRIORITAIRES */}
        <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12, marginTop:16}}>
          {/* Horaire */}
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <div className="kpi-title">Gains / Pertes — Par Heure (TZ broker)</div>
              <Help text="Somme des PnL par heure d’ouverture (00–23) selon le fuseau du broker. Contours/halos rouges = heures net négatif."/>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={hourlyAgg} margin={{left:8,right:8,top:8,bottom:8}}>
                {hourlyAgg.filter(x=>x.net<0).map((x,i)=>{
                  const idx = hourlyAgg.findIndex(h=>h.key===x.key)
                  return <ReferenceArea key={'hbad'+i} x1={idx-0.5} x2={idx+0.5} fill="rgba(255,95,162,0.08)" stroke="rgba(255,95,162,0.6)" />
                })}
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="key" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <Tooltip content={<GLTooltip C={C} fmtC={fmtC} />} />
                <Legend wrapperStyle={{ color:C.text }} />
                <Bar dataKey="gain" name="Gains" fill={C.pos} />
                <Bar dataKey="loss" name="Pertes" fill={C.neg} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Jour de semaine */}
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <div className="kpi-title">Gains / Pertes — Par Jour De Semaine (TZ broker)</div>
              <Help text="Agrégé sur la période active: tous les lundis, tous les mardis, etc. Halo rouge = jour net négatif."/>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={weekdayAgg} margin={{left:8,right:8,top:8,bottom:8}}>
                {weekdayAgg.filter(x=>x.net<0).map((x,i)=>{
                  const idx = weekdayAgg.findIndex(h=>h.key===x.key)
                  return <ReferenceArea key={'wbad'+i} x1={idx-0.5} x2={idx+0.5} fill="rgba(255,95,162,0.08)" stroke="rgba(255,95,162,0.6)" />
                })}
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="key" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <Tooltip content={<GLTooltip C={C} fmtC={fmtC} />} />
                <Legend wrapperStyle={{ color:C.text }} />
                <Bar dataKey="gain" name="Gains" fill={C.pos} />
                <Bar dataKey="loss" name="Pertes" fill={C.neg} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mensuel */}
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <div className="kpi-title">Gains / Pertes — Par Mois (TZ broker)</div>
              <Help text="Agrégé par mois (Jan..Déc) sur l’intervalle actif (peut couvrir plusieurs années). Halo rouge = mois net négatif."/>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthAgg} margin={{left:8,right:8,top:8,bottom:8}}>
                {monthAgg.filter(x=>x.net<0).map((x,i)=>{
                  const idx = monthAgg.findIndex(h=>h.key===x.key)
                  return <ReferenceArea key={'mbad'+i} x1={idx-0.5} x2={idx+0.5} fill="rgba(255,95,162,0.08)" stroke="rgba(255,95,162,0.6)" />
                })}
                <CartesianGrid stroke="#2b2b2b" />
                <XAxis dataKey="key" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                <Tooltip content={<GLTooltip C={C} fmtC={fmtC} />} />
                <Legend wrapperStyle={{ color:C.text }} />
                <Bar dataKey="gain" name="Gains" fill={C.pos} />
                <Bar dataKey="loss" name="Pertes" fill={C.neg} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MFE/MAE */}
        <div className="card" style={{height:360, marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="kpi-title">MFE / MAE — Quotidien (moyenne)</div>
            <Help text="MFE: meilleur gain latent. MAE: pire perte latente. Moyennés par jour après filtres."/>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={mfeMaeDaily} margin={{left:8,right:8,top:8,bottom:8}}>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <YAxis stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
              <Tooltip contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}} formatter={(v,n)=>[fmtC(v), n==='avgMFE'?'MFE moyen':'MAE moyen']} />
              <Legend wrapperStyle={{ color:C.text }} />
              <Line type="monotone" dataKey="avgMFE" name="MFE Moyen" dot={false} stroke={C.pos} strokeWidth={2} />
              <Line type="monotone" dataKey="avgMAE" name="MAE Moyen" dot={false} stroke={C.neg} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Corrélation */}
        <div className="card" style={{marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
            <div className="kpi-title">Corrélation Des Stratégies</div>
            <Help text="Corrélations de Pearson des PnL quotidiens par stratégie; heatmap complète et corrélation glissante (30j) sur la paire sélectionnée."/>
          </div>
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead><tr><th>Stratégie</th>{corrMatrix.names.map(n=> <th key={'h'+n}>{n}</th>)}</tr></thead>
              <tbody>
                {corrMatrix.names.map((r,i)=> (
                  <tr key={'r'+r}>
                    <td><b>{r}</b></td>
                    {corrMatrix.names.map((c,j)=>{
                      const v = corrMatrix.matrix[i][j]
                      const col = heatCorr(v)
                      return <td key={r+'|'+c} style={{background:col}}>{v.toFixed(2)}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {corrMatrix.names.length>1 && (
            <div className="card" style={{marginTop:12, height:260}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div className="kpi-title">Corrélation Glissante (30j)</div>
                <select className="select" value={pair} onChange={e=>setPair(e.target.value)}>
                  {pairsOf(corrMatrix.names).map(p=> <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={rolling} margin={{left:8,right:8,top:8,bottom:8}}>
                  <CartesianGrid stroke="#2b2b2b" />
                  <XAxis dataKey="date" stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                  <YAxis domain={[-1,1]} stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}} />
                  <Tooltip contentStyle={{background:C.panel,border:`1px solid var(--border)`,color:C.text,borderRadius:10}} />
                  <Line type="monotone" dataKey="corr" dot={false} stroke={C.white} strokeWidth={1.8} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CALENDRIER enrichi */}
        <div className="card" style={{marginTop:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
            <div className="kpi-title">Calendrier</div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={()=>{ let m=calMonth-1, y=calYear; if(m<0){m=11;y--} setCalMonth(m); setCalYear(y) }}>◀</button>
              <button className="btn" onClick={()=>{ let m=calMonth+1, y=calYear; if(m>11){m=0;y++}  setCalMonth(m); setCalYear(y) }}>▶</button>
            </div>
          </div>
          <div style={{display:'flex', gap:12, color:'#b6bcc1', fontSize:12, margin:'4px 0 10px'}}>
            <span>PNL mois : <span style={{color: numColor(monthPnl)}}>{fmtC(monthPnl)}</span></span>
            <span>Max DD mois : <span style={{color: 'var(--text)'}}>{monthDDPct.toFixed(2)}%</span> · <span style={{color:'var(--text)'}}>{fmtC(monthDDAbs)}</span></span>
          </div>
          <div className="cal-head">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=><div key={d}>{d}</div>)}</div>
          <div className="cal-grid">
            {calDates.map(dt=>{
              const pnl=pnlDayMap.get(dt)
              const trades=countMap.get(dt)
              const ret=dailyRetMap.get(dt)
              const dd = ddDailyMap.get(dt)
              const hist = equityHL.filter(x=>x.date<=dt).map(x=>x.equity_trading)
              const peakTill = hist.length ? Math.max(...hist) : 0
              const eqAt = (equityMap.get(dt) || 0)
              const ddAbs = peakTill>0 ? Math.max(0, peakTill - eqAt) : 0
              const pos = (pnl ?? 0) >= 0
              return (
                <div key={dt} className="cal-cell">
                  <div className="cal-date">{Number(dt.slice(8,10))}</div>
                  <div className={pos? 'cal-pnl-pos':'cal-pnl-neg'}>{pnl!=null? fmtC(pnl) : '—'}</div>
                  <div className="cal-trades">{trades!=null? `${trades} trade(s)` : '—'}</div>
                  <div className="cal-dd">{ret!=null? `${(ret*100).toFixed(2)}% jour` : '—'}</div>
                  <div className="cal-dd">{dd!=null? `${Math.abs(dd*100).toFixed(2)}% DD · ${fmtC(ddAbs)}` : '—'}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MODALES */}
        {showFlow && (
          <div className="modal" onClick={()=>setShowFlow(false)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <div className="kpi-title">Ajouter Un Flux</div>
                <button className="btn" onClick={()=>setShowFlow(false)}>Fermer</button>
              </div>
              <form onSubmit={submitFlow} style={{display:'grid', gap:10, gridTemplateColumns:'repeat(2,1fr)'}}>
                <label><div className="kpi-title">Type</div>
                  <select className="select" value={flow.type} onChange={e=>setFlow(f=>({...f, type:e.target.value}))}>{flowTypes.map(t=> <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                </label>
                <label><div className="kpi-title">Date</div>
                  <input className="input" type="date" value={flow.date} onChange={e=>setFlow(f=>({...f, date:e.target.value}))} />
                </label>
                <label><div className="kpi-title">Devise</div>
                  <select className="select" value={flow.ccy} onChange={e=>setFlow(f=>({...f, ccy:e.target.value}))}>{['USD','EUR','CHF'].map(c=> <option key={c} value={c}>{c}</option>)}</select>
                </label>
                <label><div className="kpi-title">Montant</div>
                  <input className="input" type="number" step="0.01" placeholder="ex: 250.00" value={flow.amount} onChange={e=>setFlow(f=>({...f, amount:e.target.value}))} />
                </label>
                <label style={{gridColumn:'1 / -1'}}><div className="kpi-title">Note</div>
                  <input className="input" type="text" placeholder="optionnel" value={flow.note} onChange={e=>setFlow(f=>({...f, note:e.target.value}))} />
                </label>
                <div style={{gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8}}>
                  <button type="button" className="btn" onClick={()=>setShowFlow(false)}>Annuler</button>
                  <button type="submit" className="btn">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showManagedForm && (
          <div className="modal" onClick={()=>setShowManagedForm(false)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <div className="kpi-title">Capital Tiers — Ajouter</div>
                <button className="btn" onClick={()=>setShowManagedForm(false)}>Fermer</button>
              </div>
              <ManagedForm onAdd={(entry)=>{ setManaged(p=>p.concat([entry])); setShowManagedForm(false) }} displayCcy={displayCcy} />
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{textAlign:'center', color:C.text, marginTop:20}}>ZooProjectVision © {new Date().getFullYear()} — V4.2</div>
      </div>
    )
  }catch(e){
    console.error(e)
    return <div style={{ color:'var(--pink)', padding:16 }}>Erreur: {String(e.message||e)}</div>
  }
}

/* ================== Petits composants ================== */
function Field({label, children}){ return (<div><div className="kpi-title">{label}</div>{children}</div>) }
function KPI({title, value, color, className='', help}){
  return (
    <div className={`card ${className}`} style={{position:'relative'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div className="kpi-title">{title}</div>
        {help && (
          <span className="help-wrap">
            <span className="help" title="aide">?</span>
            <span className="help-bubble">{help}</span>
          </span>
        )}
      </div>
      <div style={{color: color||'var(--text)'}}>{value}</div>
    </div>
  )
}

function Help({text}){
  return (
    <span className="help-wrap">
      <span className="help" title="aide">?</span>
      <span className="help-bubble">{text}</span>
    </span>
  )
}

/* ===== Tooltip custom Gains/Pertes (couleurs valeurs) ===== */
function GLTooltip({active, payload, label, C, fmtC}){
  if(!active || !payload || !payload.length) return null
  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 10px', color:'var(--text)'}}>
      {label!=null && <div style={{marginBottom:6, opacity:.9}}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex', justifyContent:'space-between', gap:12}}>
          <span>{p.name}</span>
          <b style={{color: p.name==='Pertes' ? 'var(--pink)' : 'var(--green)'}}>{fmtC(p.value)}</b>
        </div>
      ))}
    </div>
  )
}

function ManagedForm({onAdd, displayCcy}){
  const [e,setE]=useState({ source:'Darwinex', amount:'', ccy:displayCcy, start:new Date().toISOString().slice(0,10), end:'', note:'' })
  return (
    <form onSubmit={(ev)=>{ ev.preventDefault(); const amt=Number(e.amount); if(isNaN(amt)||!e.start){ alert('montant et date de début requis'); return } onAdd({ ...e, amount:amt }) }} style={{display:'grid', gap:10, gridTemplateColumns:'repeat(2,1fr)'}}>
      <label><div className="kpi-title">Source</div>
        <select className="select" value={e.source} onChange={ev=>setE(s=>({...s, source:ev.target.value}))}>
          {['Darwinex','Prop Firm','AXI Select','Autre'].map(x=> <option key={x}>{x}</option>)}
        </select>
      </label>
      <label><div className="kpi-title">Montant</div>
        <input className="input" type="number" step="0.01" value={e.amount} onChange={ev=>setE(s=>({...s, amount:ev.target.value}))} />
      </label>
      <label><div className="kpi-title">Devise</div>
        <select className="select" value={e.ccy} onChange={ev=>setE(s=>({...s, ccy:ev.target.value}))}>{['USD','EUR','CHF'].map(c=> <option key={c}>{c}</option>)}</select>
      </label>
      <label><div className="kpi-title">Début</div>
        <input className="input" type="date" value={e.start} onChange={ev=>setE(s=>({...s, start:ev.target.value}))} />
      </label>
      <label><div className="kpi-title">Fin (optionnel)</div>
        <input className="input" type="date" value={e.end} onChange={ev=>setE(s=>({...s, end:ev.target.value}))} />
      </label>
      <label style={{gridColumn:'1 / -1'}}><div className="kpi-title">Note</div>
        <input className="input" type="text" value={e.note} onChange={ev=>setE(s=>({...s, note:ev.target.value}))} />
      </label>
      <div style={{gridColumn:'1 / -1', display:'flex', justifyContent:'flex-end', gap:8}}>
        <button type="submit" className="btn">Enregistrer</button>
      </div>
    </form>
  )
}

/* ================== Helpers calcul ================== */
function round2(x){ return Math.round((x??0)*100)/100 }
function mean(a){ if(!a.length) return 0; return a.reduce((x,y)=>x+y,0)/a.length }
function stddev(a){ if(!a.length) return 0; const m=mean(a); const v=mean(a.map(x=>(x-m)*(x-m))); return Math.sqrt(v) }
function daysBetween(a,b){ if(!a||!b) return 0; const d1=new Date(a), d2=new Date(b); return Math.floor((d2-d1)/86400000) }

function calcSharpe(equity){ const rets=[]; for(let i=1;i<equity.length;i++){ const p=equity[i-1].equity_trading, c=equity[i].equity_trading; rets.push(p>0 ? (c-p)/p : 0) } const mu=mean(rets), sd=stddev(rets); return sd>0? (mu/sd)*Math.sqrt(252) : 0 }
function calcSortino(equity){ const rets=[]; for(let i=1;i<equity.length;i++){ const p=equity[i-1].equity_trading, c=equity[i].equity_trading; rets.push(p>0 ? (c-p)/p : 0) } const mu=mean(rets), neg=rets.filter(r=>r<0), sdDown=stddev(neg); return sdDown>0? (mu/sdDown)*Math.sqrt(252) : 0 }

function equityWithFlowsAt(series,date){ const p=series.find(x=>x.date===date); return p? p.equity_with_flows : undefined }

function colorVerdict(value, {good=0, bad=0, warnLo=null, warnAbs=null}){
  if(warnAbs!=null){ if(Math.abs(value)<=warnAbs) return 'warn'; return value>0? 'good' : 'bad' }
  if(warnLo!=null){ if(value>=good) return 'good'; if(value>=warnLo) return 'warn'; return 'bad' }
  if(value>good) return 'good'; if(value<bad) return 'bad'; return 'warn'
}
function classBy(x, [g, w]){ if(x>=g) return 'good'; if(x>=w) return 'warn'; return 'bad' }
function classByRev(x, [g, w]){ if(x<=g) return 'good'; if(x<=w) return 'warn'; return 'bad' }

/* ===== Corrélation ===== */
function buildCorrMatrix(filtered, displayCcy, convert){
  const byDayByStrat=new Map()
  for(const t of filtered){ const d=t.date; if(!byDayByStrat.has(d)) byDayByStrat.set(d,new Map()); const m=byDayByStrat.get(d); const v=convert(t.pnl,t.ccy||'USD',displayCcy); m.set(t.strategy,(m.get(t.strategy)||0)+v) }
  const stratSet=new Set(); for(const m of byDayByStrat.values()) for(const k of m.keys()) stratSet.add(k)
  const names=Array.from(stratSet)
  const byStrat={}, dates=Array.from(byDayByStrat.keys()).sort()
  for(const s of names){ byStrat[s]=dates.map(d=> byDayByStrat.get(d).get(s)??0) }
  const matrix = names.map((r,i)=> names.map((c,j)=> pearson(byStrat[names[i]], byStrat[names[j]])))
  const pairs=[]
  for(let i=0;i<names.length;i++) for(let j=i+1;j<names.length;j++) pairs.push(matrix[i][j])
  const avg = pairs.length? mean(pairs.filter(Number.isFinite)) : 0
  return { names, matrix, series:byStrat, dates, avg }
}
function pearson(a,b){ const n=Math.min(a.length,b.length); if(n===0) return 0; const ax=a.slice(0,n), bx=b.slice(0,n); const ma=mean(ax), mb=mean(bx); let num=0,da=0,db=0; for(let i=0;i<n;i++){ const x=ax[i]-ma, y=bx[i]-mb; num+=x*y; da+=x*x; db+=y*y } const den=Math.sqrt(da*db); return den>0? num/den : 0 }
function pairsOf(arr){ const out=[]; for(let i=0;i<arr.length;i++) for(let j=i+1;j<arr.length;j++) out.push(`${arr[i]}|${arr[j]}`); return out }
function rollCorr(matrixObj, pair, win){ if(!pair) return []; const [a,b]=pair.split('|'); const A=matrixObj.series[a]||[], B=matrixObj.series[b]||[]; const dates=matrixObj.dates||[]; const out=[]; for(let i=win;i<=A.length;i++){ const sA=A.slice(i-win,i), sB=B.slice(i-win,i); out.push({ date:dates[i-1], corr: pearson(sA,sB) }) } return out }
function heatCorr(v){ const x=Math.max(-1,Math.min(1,v)); const g = x>0? Math.floor(255*(1-x)) : 255; const r = x>0? 255 : Math.floor(255*(1+ x)); const b = 180; return `rgba(${r},${g},${b},0.25)` }

/* ===== Managed capital helpers ===== */
function sumManaged(list, displayCcy, convert){ const today=new Date().toISOString().slice(0,10); let sum=0; for(const e of list){ const active = e.start<=today && (!e.end || today<=e.end); if(active){ sum += convert(Number(e.amount)||0, e.ccy||'USD', displayCcy) } } return round2(sum) }

/* ===== Calendrier util ===== */
function monthDays(year, monthIndex){
  const end = new Date(year, monthIndex + 1, 0).getDate()
  const arr = []
  for (let d = 1; d <= end; d++){
    const dt = new Date(year, monthIndex, d)
    arr.push(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString().slice(0,10))
  }
  return arr
}
