// Preview build - test du 21 octobre 2025
import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

/** =========================
 *   Données démo — Forex & Indices CFD (volatilité élevée)
 *   ========================= */
const symbolsFXCFD = ['EURUSD','GBPUSD','USDJPY','USDCHF','XAUUSD','DAX40','US30','US500','USTEC','USOIL'];
const brokersCFD  = ['ICMarkets','Pepperstone','Eightcap','InteractiveBrokers','MetaTrader5'];
const strategiesAll = ['Breakout','MeanRevert','Swing','News','Scalp']

function randBetween(min, max){ return min + Math.random()*(max-min) }
function pick(a){ return a[Math.floor(Math.random()*a.length)] }

// Équité simulée via rendements composés (±3%, spikes ±6%)
const startEquity = 100000;
const days = 260; // ~1 année de trading
const demoEquity = (() => {
  let e = startEquity;
  const out = [];
  for (let i = days; i >= 1; i--) {
    let r = randBetween(-0.03, 0.03);
    if (Math.random() < 0.05) r = randBetween(-0.06, 0.06); // spikes occasionnels
    e = Math.max(2000, e * (1 + r));
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0,10), equity: Number(e.toFixed(2)), account_ccy: 'USD' });
  }
  return out;
})();

// Trades démo avec heure d'ouverture (00..23).
// NB: la stat "par heure" s'appuie exclusivement sur l'heure d'OUVERTURE.
const demoTrades = Array.from({ length: 450 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*220));
  const openHour = Math.floor(randBetween(7, 22)); // 7h -> 21h
  const side = Math.random()>0.5?'BUY':'SELL';
  const qty  = Number(randBetween(1, 5).toFixed(2));
  const price= Number(randBetween(10, 250).toFixed(2));
  // Amplitude ±1.5k à ±3k, 12% des cas ±3k à ±9k
  let pnl = (Math.random()-0.5) * randBetween(1500, 3000);
  if (Math.random() < 0.12) pnl = (Math.random()>0.5?1:-1) * randBetween(3000, 9000);
  pnl = Number(pnl.toFixed(2));
  const openISO = new Date(d.getFullYear(), d.getMonth(), d.getDate(), openHour).toISOString();

  return {
    trade_id: `T${10000+i}`,
    date: d.toISOString().slice(0,10),               // date de clôture (pour la démo)
    open_time: openISO,                              // date+heure d'ouverture
    open_hour: openHour,                             // heure (0..23)
    account: pick(['ACC-Alpha','ACC-Beta','ACC-Gamma']),
    broker: pick(brokersCFD),
    strategy: pick(strategiesAll),
    symbol: pick(symbolsFXCFD),
    instrument_ccy: 'USD',
    side, qty, price,
    fee: Number(randBetween(0.50, 3.00).toFixed(2)),
    pnl,
    notes: ''
  }
})

/** =========================
 *   Helpers & métriques
 *   ========================= */
function dailyReturns(eq){
  const r=[]; for(let i=1;i<eq.length;i++){ const p=eq[i-1].equity,c=eq[i].equity; r.push({date:eq[i].date, ret: p===0?0:(c-p)/p}) }
  return r
}
function drawdownSeries(eq){ let peak=-Infinity; return eq.map(p=>{ peak=Math.max(peak,p.equity); const dd=(p.equity-peak)/peak; return {date:p.date, dd} }) }
function maxDrawdown(eq){ return Math.min(...drawdownSeries(eq).map(d=>d.dd)) }
function sharpe(returns, rf=0){ if(!returns.length) return 0; const a=returns.map(x=>x.ret); const avg=a.reduce((x,y)=>x+y,0)/a.length; const excess=avg-rf/252; const varc=a.reduce((s,v)=>s+Math.pow(v-avg,2),0)/(a.length||1); const vol=Math.sqrt(varc)*Math.sqrt(252); return vol===0?0:excess/vol }
function sortino(returns, rf=0){ if(!returns.length) return 0; const a=returns.map(x=>x.ret); const avg=a.reduce((x,y)=>x+y,0)/a.length - rf/252; const downs=a.filter(v=>v<0); const dvar=downs.reduce((s,v)=>s+v*v,0)/(downs.length||1); const ddev=Math.sqrt(dvar)*Math.sqrt(252); return ddev===0?0:avg/ddev }
function profitFactor(tr){ const g=tr.filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0); const l=tr.filter(t=>t.pnl<0).reduce((s,t)=>s+Math.abs(t.pnl),0); return l===0?Infinity:g/l }
function hitRatio(tr){ if(!tr.length) return 0; const w=tr.filter(t=>t.pnl>0).length; return w/tr.length }
function fmtCCY(v, ccy='USD'){
  try{
    return new Intl.NumberFormat(undefined,{
      style:'currency',currency:ccy,
      minimumFractionDigits:2, maximumFractionDigits:2
    }).format(v ?? 0)
  }catch{
    const x = (v ?? 0).toFixed(2);
    return `${x} ${ccy}`;
  }
}
function pct(x){ return `${((x||0)*100).toFixed(2)}%` }
function classNeg(v){ return v<0 ? 'bad' : '' }
function fmtShort2(v){ return Number(v).toFixed(2) }

/** Conversion devises (démo locale) */
const DISPLAY_CURRENCIES = ['USD','EUR','CHF']
const fx = {
  USD: { USD:1,  EUR:0.93, CHF:0.88 },
  EUR: { USD:1/0.93, EUR:1, CHF:0.88/0.93 },
  CHF: { USD:1/0.88, EUR:0.93/0.88, CHF:1 }
}
function convertAmount(value, fromCcy='USD', toCcy='USD') {
  if (value==null || fromCcy===toCcy) return Number((value||0).toFixed(2));
  const res = value * (fx[fromCcy]?.[toCcy] ?? 1);
  return Number(res.toFixed(2));
}

/** Agrégations période */
function calcMTD(returns){
  if(!returns.length) return 0;
  const month = returns.at(-1).date.slice(0,7);
  const arr = returns.filter(r=>r.date.startsWith(month)).map(r=>r.ret);
  return arr.reduce((a,b)=>a+b,0);
}
function calcYTD(equity){
  if(!equity.length) return 0;
  const year = equity.at(-1).date.slice(0,4);
  const yearPoints = equity.filter(p=>p.date.startsWith(year));
  if(yearPoints.length<2) return 0;
  return (yearPoints.at(-1).equity / yearPoints[0].equity) - 1;
}
function calcLast12M(equity){
  if(equity.length<2) return 0;
  const n = equity.length;
  const end = equity[n-1].equity;
  const start = equity[Math.max(0, n-252)].equity; // ~12m
  return end/start - 1;
}

/** Calendrier utils */
function monthDays(year, monthIndex){
  const days = [];
  const end = new Date(year, monthIndex+1, 0);
  for(let d=1; d<=end.getDate(); d++){
    const dt = new Date(year, monthIndex, d);
    days.push(dt.toISOString().slice(0,10));
  }
  return days;
}
function colorForRet(ret){
  // Palette sombre : turquoise/rose "stabilo" sur fond noir
  if(ret == null) return 'background:#0a0a0a;border:1px solid #191919;';
  const mag = Math.min(1, Math.abs(ret)*10);
  if(ret >= 0) return `background: rgba(32,227,214,${0.10+0.25*mag}); border:1px solid rgba(32,227,214,.35);`;
  return `background: rgba(255,95,162,${0.10+0.25*mag}); border:1px solid rgba(255,95,162,.35);`;
}
function inlineStyle(cssText){
  const out = {}
  cssText.split(';').forEach(rule=>{
    const [k,v] = rule.split(':').map(x=>x&&x.trim())
    if(!k||!v) return
    const jsKey = k.replace(/-([a-z])/g, (_,c)=>c.toUpperCase())
    out[jsKey] = v
  })
  return out
}

/** =========================
 *   Groupes d'actifs (≥X% majors, <X% Autres)
 *   ========================= */
function splitSymbolsByShare(trades, threshold = 0.10) {
  const count = new Map();
  for (const t of trades) count.set(t.symbol, (count.get(t.symbol) || 0) + 1);
  const total = Array.from(count.values()).reduce((a,b)=>a+b,0) || 1;
  const share = new Map(Array.from(count, ([s,v]) => [s, v/total]));
  const major = new Set(Array.from(share).filter(([,p]) => p >= threshold).map(([s]) => s));
  const minor = new Set(Array.from(share).filter(([,p]) => p < threshold).map(([s]) => s));
  return { major, minor, share };
}

/** Multi-courbes par actif (base 10'000) + regroupement "Autres" + courbe globale */
function buildSymbolEquitiesGrouped(dates, trades, displayCcy, majorSet, dateToGlobal, othersLabel = 'Autres') {
  const symbols = Array.from(new Set(trades.map(t=>t.symbol))).sort();
  const base = 10000;

  // agrège PnL par date & symbole (converti)
  const byDay = new Map(); // key: date__symbol -> pnl
  for (const t of trades) {
    const k = `${t.date}__${t.symbol}`;
    const v = convertAmount(t.pnl, t.instrument_ccy || 'USD', displayCcy);
    byDay.set(k, (byDay.get(k) || 0) + v);
  }

  // cumuls par symbole majeur + cumuls "Autres"
  const majors = Array.from(majorSet);
  const cumMaj = new Map(majors.map(s => [s, base]));
  let cumOthers = base;

  const rows = [];
  for (const d of dates) {
    const row = { date: d, __GLOBAL__: Number((dateToGlobal.get(d) || 0).toFixed(2)) };

    // majors
    for (const s of majors) {
      const add = byDay.get(`${d}__${s}`) || 0;
      cumMaj.set(s, Number((cumMaj.get(s) + add).toFixed(2)));
      row[s] = cumMaj.get(s);
    }
    // others
    const othersAdd = symbols
      .filter(s => !majorSet.has(s))
      .reduce((acc, s) => acc + (byDay.get(`${d}__${s}`) || 0), 0);
    cumOthers = Number((cumOthers + othersAdd).toFixed(2));
    if (symbols.some(s => !majorSet.has(s))) row[othersLabel] = cumOthers;

    rows.push(row);
  }

  const plotSymbols = [...majors];
  if (symbols.some(s => !majorSet.has(s))) plotSymbols.push(othersLabel);
  return { rows, plotSymbols };
}

/** =========================
 *   Composant principal
 *   ========================= */
export default function App(){
  const [equity] = useState(demoEquity)
  const [trades] = useState(demoTrades)

  // Filtres (sans filtre PnL)
  const [account, setAccount] = useState('ALL')
  const [broker, setBroker]   = useState('ALL')
  const [strategy, setStrategy] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [displayCcy, setDisplayCcy] = useState('USD')
  const [minShare, setMinShare] = useState(10) // seuil en %

  const accounts = useMemo(()=>Array.from(new Set(trades.map(t=>t.account))),[trades])
  const brokers  = useMemo(()=>Array.from(new Set(trades.map(t=>t.broker || ''))).filter(Boolean),[trades])
  const strategies = useMemo(()=>Array.from(new Set(trades.map(t=>t.strategy))),[trades])

  // Filtre trades (sans PnL)
  const filteredTrades = useMemo(()=>trades.filter(t=>{
    if(account!=='ALL' && t.account!==account) return false
    if(broker!=='ALL' && t.broker!==broker) return false
    if(strategy!=='ALL' && t.strategy!==strategy) return false
    if(dateFrom && t.date < dateFrom) return false
    if(dateTo && t.date > dateTo) return false
    return true
  }),[trades,account,broker,strategy,dateFrom,dateTo])

  // Équité filtrée + conversion (courbe globale)
  const equityFiltered = useMemo(()=>{
    return equity.filter(p=>{
      if(dateFrom && p.date < dateFrom) return false
      if(dateTo && p.date > dateTo) return false
      return true
    }).map(p=>({
      date: p.date,
      equity: convertAmount(p.equity, p.account_ccy || 'USD', displayCcy),
      account_ccy: displayCcy
    }))
  },[equity, dateFrom, dateTo, displayCcy])

  // Séries dérivées
  const returns = useMemo(()=>dailyReturns(equityFiltered),[equityFiltered])
  const ddSeries = useMemo(()=>drawdownSeries(equityFiltered),[equityFiltered])

  // KPI
  const tradesConverted = useMemo(()=>filteredTrades.map(t=>({
    ...t, pnl_disp: convertAmount(t.pnl, t.instrument_ccy || 'USD', displayCcy)
  })),[filteredTrades, displayCcy])

  const kpi = useMemo(()=>({
    sharpe: sharpe(returns),
    sortino: sortino(returns),
    maxDD: maxDrawdown(equityFiltered),
    profitFactor: profitFactor(tradesConverted),
    hitRatio: hitRatio(tradesConverted),
    totalPnL: tradesConverted.reduce((a,t)=>a+(t.pnl_disp||0),0),
    lastEquity: equityFiltered.at(-1)?.equity ?? 0,
  }),[returns, tradesConverted, equityFiltered])

  // Rentabilités période
  const lastDayRet = returns.at(-1)?.ret ?? 0
  const mtd = calcMTD(returns)
  const ytd = calcYTD(equityFiltered)
  const ann = calcLast12M(equityFiltered)

  // Seuil & labels dynamiques
  const othersLabel = useMemo(() => `Autres (<${minShare}%)`, [minShare])

  // Part des actifs : majors (≥ seuil)
  const { major: majorSet } = useMemo(
    () => splitSymbolsByShare(filteredTrades, minShare/100),
    [filteredTrades, minShare]
  )

  // Dates & map date -> équité globale (pour injecter "__GLOBAL__")
  const allDates = useMemo(() => equityFiltered.map(p => p.date), [equityFiltered])
  const dateToGlobal = useMemo(() => new Map(equityFiltered.map(p => [p.date, p.equity])), [equityFiltered])

  // Séries multi-actifs groupées + courbe globale
  const { rows: equityBySymbolRows, plotSymbols } = useMemo(
    () => buildSymbolEquitiesGrouped(allDates, filteredTrades, displayCcy, majorSet, dateToGlobal, othersLabel),
    [allDates, filteredTrades, displayCcy, majorSet, dateToGlobal, othersLabel]
  )

  // Couleurs pour lignes d'actifs (sur noir)
  const lineColors = ['#20e3d6','#5aa9ff','#ffd166','#c792ea','#7bd88f','#ff8a65','#9bb6ff','#f472b6','#8bd3dd']

  // Répartition des actifs (≥ seuil + "Autres")
  const assetSplit = useMemo(() => {
    const counts = new Map();
    filteredTrades.forEach(t => counts.set(t.symbol, (counts.get(t.symbol)||0)+1));
    const total = Array.from(counts.values()).reduce((a,b)=>a+b,0) || 1;

    const majors = [];
    let othersSum = 0;
    for (const [name, value] of counts) {
      const share = value / total;
      if (share >= (minShare/100)) majors.push({ name, value });
      else othersSum += value;
    }
    if (othersSum > 0) majors.push({ name: othersLabel, value: othersSum });
    return majors.sort((a,b)=>b.value-a.value);
  }, [filteredTrades, minShare, othersLabel]);

  // ==== Top / Flop mensuels (actifs & stratégies) ====
  const monthKey = useMemo(()=>{
    const last = filteredTrades.map(t=>t.date).sort().pop() || new Date().toISOString().slice(0,10);
    return last.slice(0,7); // YYYY-MM
  },[filteredTrades])

  const monthTrades = useMemo(
    () => filteredTrades.filter(t => t.date.startsWith(monthKey)),
    [filteredTrades, monthKey]
  )

  function topFlop(list, key){
    const map = new Map();
    for(const t of list){
      const k = t[key];
      map.set(k, (map.get(k)||0) + t.pnl_disp);
    }
    const arr = Array.from(map, ([name, value]) => ({ name, value }));
    const best = [...arr].sort((a,b)=>b.value-a.value).slice(0,3);
    const worst = [...arr].sort((a,b)=>a.value-b.value).slice(0,3);
    return { best, worst };
  }

  const tfSymbols = useMemo(()=>topFlop(monthTrades.map(t=>({...t, pnl_disp: convertAmount(t.pnl,'USD',displayCcy)})),'symbol'),[monthTrades,displayCcy])
  const tfStrats  = useMemo(()=>topFlop(monthTrades.map(t=>({...t, pnl_disp: convertAmount(t.pnl,'USD',displayCcy)})),'strategy'),[monthTrades,displayCcy])

  // ==== Histogramme gains/pertes par HEURE d'ouverture ====
  const hourlyBars = useMemo(()=>{
    const base = Array.from({length:24}, (_,h)=>({ hour: `${String(h).padStart(2,'0')}:00`, gains:0, losses:0 }))
    for(const t of filteredTrades){
      const h = typeof t.open_hour === 'number' ? t.open_hour : new Date(t.open_time||`${t.date}T00:00:00Z`).getHours()
      if(h>=0 && h<24){
        if(t.pnl > 0) base[h].gains += convertAmount(t.pnl,'USD',displayCcy);
        else if(t.pnl < 0) base[h].losses += Math.abs(convertAmount(t.pnl,'USD',displayCcy));
      }
    }
    // arrondis 2 décimales
    return base.map(r=>({ ...r, gains:Number(r.gains.toFixed(2)), losses:Number(r.losses.toFixed(2)) }))
  },[filteredTrades, displayCcy])

  // Calendrier (mois courant par défaut)
  const lastDate = equityFiltered.at(-1)?.date
  const [calYear, setCalYear] = useState(lastDate ? Number(lastDate.slice(0,4)) : new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(lastDate ? Number(lastDate.slice(5,7))-1 : new Date().getMonth())
  const monthDates = useMemo(()=>monthDays(calYear, calMonth),[calYear, calMonth])
  const monthLabel = useMemo(()=>{
    const dt = new Date(calYear, calMonth, 1)
    return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  },[calYear, calMonth])

  // Map {date -> {ret, dd}}
  const calendarMap = useMemo(()=>{
    const map = new Map()
    const ddByDate = new Map(ddSeries.map(x=>[x.date, x.dd]))
    for(const r of returns){
      map.set(r.date, { ret: r.ret, dd: ddByDate.get(r.date) ?? null })
    }
    return map
  },[returns, ddSeries])

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>ZooProject Vision</h1>
          <div className="tagline">Multi-comptes • Multi-brokers • {displayCcy} • Calendrier P&L • Heures d’ouverture</div>
        </div>
        <div className="btns">
          <button className="btn" onClick={()=>window.location.reload()}>Actualiser</button>
          <button className="btn" onClick={()=>downloadCSV('trades.csv', filteredTrades)}>Export CSV</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card controls">
        <div className="item">
          <label>Compte</label>
          <select value={account} onChange={e=>setAccount(e.target.value)}>
            <option value="ALL">Tous</option>
            {accounts.map(a=>(<option key={a} value={a}>{a}</option>))}
          </select>
        </div>
        <div className="item">
          <label>Broker</label>
          <select value={broker} onChange={e=>setBroker(e.target.value)}>
            <option value="ALL">Tous</option>
            {brokers.map(b=>(<option key={b} value={b}>{b}</option>))}
          </select>
        </div>
        <div className="item">
          <label>Stratégie</label>
          <select value={strategy} onChange={e=>setStrategy(e.target.value)}>
            <option value="ALL">Toutes</option>
            {strategies.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="item">
          <label>Du</label>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
        </div>
        <div className="item">
          <label>Au</label>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
        </div>
        <div className="item">
          <label>Devise d’affichage</label>
          <select value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)}>
            {DISPLAY_CURRENCIES.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="item">
          <label>Seuil actifs (≥%)</label>
          <select value={minShare} onChange={e=>setMinShare(Number(e.target.value))}>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
          </select>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi">
        <div className="card item"><h3>Valeur actuelle</h3><div className="val">{fmtCCY(kpi.lastEquity, displayCcy)}</div></div>
        <div className="card item"><h3>PnL (filtré)</h3><div className={`val ${classNeg(kpi.totalPnL)}`}>{fmtCCY(kpi.totalPnL, displayCcy)}</div></div>
        <div className="card item"><h3>Jour</h3><div className={`val ${classNeg(lastDayRet)}`}>{pct(lastDayRet)}</div></div>
        <div className="card item"><h3>MTD</h3><div className={`val ${classNeg(mtd)}`}>{pct(mtd)}</div></div>
        <div className="card item"><h3>YTD</h3><div className={`val ${classNeg(ytd)}`}>{pct(ytd)}</div></div>
        <div className="card item"><h3>Annuel (12m)</h3><div className={`val ${classNeg(ann)}`}>{pct(ann)}</div></div>
        <div className="card item"><h3>Max DD</h3><div className={`val ${classNeg(kpi.maxDD)}`}>{pct(kpi.maxDD)}</div></div>
      </div>

      {/* Graphiques principaux — XL */}
      <div className="grid">
        {/* Courbe d'équité (globale blanche + lignes par actif) */}
        <div className="card chart-card chart-xl">
          <h3>Courbe d'équité (globale + actifs)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={equityBySymbolRows} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#3a3a3a" tick={{fontSize:10}} tickLine={false} />
              <YAxis stroke="#3a3a3a" tick={{fontSize:10}} tickLine={false} tickFormatter={fmtShort2} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {/* Équité globale (BLANCHE & ÉPAISSE) */}
              <Line type="monotone" dataKey="__GLOBAL__" name="Équité globale" dot={false}
                    stroke="#ffffff" strokeWidth={3.5} isAnimationActive={false} />
              {/* Lignes par actif (majors + 'Autres' si présent), fines */}
              {plotSymbols.map((s, i)=>(
                <Line key={s} type="monotone" dataKey={s} name={s} dot={false}
                      stroke={lineColors[i % lineColors.length]} strokeWidth={1.25} opacity={0.95}
                      isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Drawdown */}
        <div className="card chart-card chart-xl">
          <h3>Drawdown</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={ddSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#3a3a3a" tick={{fontSize:10}} tickLine={false} />
              <YAxis stroke="#3a3a3a" tick={{fontSize:10}} tickLine={false} tickFormatter={(v)=>`${(v*100).toFixed(2)}%`} />
              <Tooltip formatter={(v)=>`${(v*100).toFixed(2)}%`} />
              <Area type="monotone" dataKey="dd" name="DD" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Calendrier */}
        <div className="card" style={{padding:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom:8}}>
            <h3 style={{margin:0}}>Calendrier – {monthLabel}</h3>
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={()=>{
                let m = calMonth-1, y = calYear; if(m<0){ m=11; y=y-1 } setCalYear(y); setCalMonth(m)
              }}>◀</button>
              <button className="btn" onClick={()=>{
                let m = calMonth+1, y = calYear; if(m>11){ m=0; y=y+1 } setCalYear(y); setCalMonth(m)
              }}>▶</button>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8}}>
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>(
              <div key={d} style={{textAlign:'center', color:'#20e3d6cc', fontSize:12}}>{d}</div>
            ))}
            {renderMonthGrid(calYear, calMonth, monthDates, calendarMap)}
          </div>
          <div style={{marginTop:8, color:'#20e3d6b0', fontSize:12}}>
            <span style={{marginRight:12}}>🟩 gain</span>
            <span>🟥 perte</span>
          </div>
        </div>
      </div>

      {/* Top/Flop mensuels + Histogramme par heure */}
      <div className="grid">
        {/* Top/Flop Actifs */}
        <div className="card" style={{height:360}}>
          <h3>Top / Flop du mois – Actifs ({monthKey})</h3>
          <div className="two-cols">
            <div>
              <div className="pill good">Top</div>
              {tfSymbols.best.map(x=>(
                <div key={'b'+x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className="turq">{fmtCCY(x.value, displayCcy)}</b>
                </div>
              ))}
            </div>
            <div>
              <div className="pill bad">Flop</div>
              {tfSymbols.worst.map(x=>(
                <div key={'w'+x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className="pink">{fmtCCY(x.value, displayCcy)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top/Flop Stratégies */}
        <div className="card" style={{height:360}}>
          <h3>Top / Flop du mois – Stratégies ({monthKey})</h3>
          <div className="two-cols">
            <div>
              <div className="pill good">Top</div>
              {tfStrats.best.map(x=>(
                <div key={'sb'+x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className="turq">{fmtCCY(x.value, displayCcy)}</b>
                </div>
              ))}
            </div>
            <div>
              <div className="pill bad">Flop</div>
              {tfStrats.worst.map(x=>(
                <div key={'sw'+x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className="pink">{fmtCCY(x.value, displayCcy)}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gains / Pertes par heure d'ouverture */}
        <div className="card chart-card" style={{height:360}}>
          <h3>Gains / Pertes par heure d’ouverture</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={hourlyBars} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" stroke="#3a3a3a" tick={{fontSize:10}} tickLine={false} />
              <YAxis stroke="#3a3a3a" tick={{fontSize:10}} tickLine={false} tickFormatter={(v)=>fmtCCY(v, displayCcy)} />
              <Tooltip formatter={(v)=>fmtCCY(v, displayCcy)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="gains" name="Gains" />
              <Bar dataKey="losses" name="Pertes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau de trades */}
      <div className="card table-wrap" style={{padding:'12px', marginTop:12}}>
        <h3 style={{marginBottom:8}}>Trades ({filteredTrades.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Heure Ouv.</th><th>Compte</th><th>Broker</th><th>Stratégie</th><th>Symbole</th>
              <th>Sens</th><th>Qté</th><th>Prix</th><th>Frais</th><th>PnL ({displayCcy})</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.slice(0, 500).map(t=>{
              const pnlDisp = convertAmount(t.pnl, t.instrument_ccy || 'USD', displayCcy);
              const hour = typeof t.open_hour === 'number'
                ? String(t.open_hour).padStart(2,'0')+':00'
                : new Date(t.open_time||`${t.date}T00:00:00Z`).toISOString().slice(11,13)+':00';
              return (
                <tr key={t.trade_id}>
                  <td>{t.date}</td>
                  <td>{hour}</td>
                  <td>{t.account}</td>
                  <td>{t.broker || '-'}</td>
                  <td>{t.strategy}</td>
                  <td>{t.symbol}</td>
                  <td className={t.side==='BUY'?'':'bad'}>{t.side}</td>
                  <td>{t.qty.toFixed(2)}</td>
                  <td>{t.price.toFixed(2)}</td>
                  <td>{t.fee.toFixed(2)}</td>
                  <td className={classNeg(pnlDisp)}>{fmtCCY(pnlDisp, displayCcy)}</td>
                  <td>{t.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="footer">© {new Date().getFullYear()} – ZooProject Vision (démo).</div>
    </div>
  )
}

/** ====== CSV util ====== */
function toCSV(rows){
  if(!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for(const r of rows){
    lines.push(headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  }
  return lines.join('\n')
}
function downloadCSV(filename, rows){
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/** ====== Rendu calendrier (sombre) ====== */
function renderMonthGrid(year, monthIndex, monthDates, calendarMap){
  // Décale le 1er jour sur Lundi
  const first = new Date(year, monthIndex, 1)
  const shift = (first.getDay()+6)%7 // 0=lundi
  const blanks = Array.from({length:shift}).map((_,i)=><div key={'b'+i}></div>)
  const cells = monthDates.map(dt=>{
    const info = calendarMap.get(dt) || null
    const ret = info?.ret ?? null
    const dd = info?.dd ?? null
    const style = colorForRet(ret)
    return (
      <div
        key={dt}
        title={`${dt}\nRet: ${ret!=null ? (ret*100).toFixed(2)+'%' : '-'}\nDD: ${dd!=null ? (dd*100).toFixed(2)+'%' : '-'}`}
        style={{padding:'10px 8px', borderRadius:8, ...inlineStyle(style)}}
      >
        <div style={{fontSize:11, opacity:.9}}>{Number(dt.slice(8,10))}</div>
        <div style={{fontSize:12, fontWeight:700}} className={ret<0?'bad':'turq'}>
          {ret!=null ? `${(ret*100).toFixed(2)}%` : '—'}
        </div>
        <div style={{fontSize:11, opacity:.95}} className={dd<0?'bad':'turq'}>
          {dd!=null ? `${(dd*100).toFixed(2)}%` : '—'}
        </div>
      </div>
    )
  })
  return [...blanks, ...cells]
}
preview build test
