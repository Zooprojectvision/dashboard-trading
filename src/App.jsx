import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

/** ==========
 *   Démo data
 *   ========== */
const symbolsFXCFD = ['EURUSD','GBPUSD','USDJPY','USDCHF','XAUUSD','DAX40','US30','US500','USTEC','USOIL'];
const brokersCFD  = ['Darwinex','ICMarkets','Pepperstone','Eightcap','InteractiveBrokers'];
const strategiesAll = ['Strategy 1','Strategy 2','Strategy 3','Breakout','MeanRevert','Scalp'];

function randBetween(min, max){ return min + Math.random()*(max-min) }
function pick(a){ return a[Math.floor(Math.random()*a.length)] }
const START_EQUITY_USD = 100000;
const days = 260;

const demoEquity = (() => {
  let e = START_EQUITY_USD;
  const out = [];
  for (let i = days; i >= 1; i--) {
    let r = randBetween(-0.03, 0.03);
    if (Math.random() < 0.05) r = randBetween(-0.06, 0.06);
    e = Math.max(2000, e * (1 + r));
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0,10), equity: Number(e.toFixed(2)), account_ccy: 'USD' });
  }
  return out;
})();

const demoTrades = Array.from({ length: 500 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*220));
  const openHour = Math.floor(randBetween(7, 22));
  const side = Math.random()>0.5?'BUY':'SELL';
  const qty  = Number(randBetween(1, 5).toFixed(2));
  const price= Number(randBetween(10, 250).toFixed(2));
  let pnl = (Math.random()-0.5) * randBetween(1500, 3000);
  if (Math.random() < 0.12) pnl = (Math.random()>0.5?1:-1) * randBetween(3000, 9000);
  pnl = Number(pnl.toFixed(2));
  const openISO = new Date(d.getFullYear(), d.getMonth(), d.getDate(), openHour).toISOString();
  return {
    trade_id: `T${10000+i}`,
    date: d.toISOString().slice(0,10),
    open_time: openISO,
    open_hour: openHour,
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

const demoCashflows = [
  { date: '2025-01-05', ccy:'USD', amount: +2000,  type:'deposit',            note:'apport' },
  { date: '2025-02-10', ccy:'USD', amount: -500,   type:'prop_fee',           note:'challenge TheTradingPit' },
  { date: '2025-03-15', ccy:'USD', amount: +1000,  type:'prop_payout',        note:'payout prop' },
  { date: '2025-04-02', ccy:'USD', amount: +250,   type:'darwin_mgmt_fee',    note:'Darwinex mgmt fee' },
  { date: '2025-05-20', ccy:'USD', amount: -800,   type:'withdrawal',         note:'prélèvement perso' },
];

/** ==========
 *  Helpers
 *  ========== */
function dailyReturns(eq){ const r=[]; for(let i=1;i<eq.length;i++){ const p=eq[i-1].equity,c=eq[i].equity; r.push({date:eq[i].date, ret: p===0?0:(c-p)/p}) } return r }
function drawdownSeries(eq){ let peak=-Infinity; return eq.map(p=>{ peak=Math.max(peak,p.equity); const dd=(p.equity-peak)/peak; return {date:p.date, dd} }) }
function maxDrawdown(eq){ return Math.min(...drawdownSeries(eq).map(d=>d.dd)) }
function sharpe(returns, rf=0){ if(!returns.length) return 0; const a=returns.map(x=>x.ret); const avg=a.reduce((x,y)=>x+y,0)/a.length; const varc=a.reduce((s,v)=>s+Math.pow(v-avg,2),0)/(a.length||1); const vol=Math.sqrt(varc)*Math.sqrt(252); return vol===0?0:avg/vol }
function sortino(returns, rf=0){ if(!returns.length) return 0; const a=returns.map(x=>x.ret); const avg=a.reduce((x,y)=>x+y,0)/a.length - rf/252; const downs=a.filter(v=>v<0); const dvar=downs.reduce((s,v)=>s+v*v,0)/(downs.length||1); const ddev=Math.sqrt(dvar)*Math.sqrt(252); return ddev===0?0:avg/ddev }
function profitFactor(tr){ const g=tr.filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0); const l=tr.filter(t=>t.pnl<0).reduce((s,t)=>s+Math.abs(t.pnl),0); return l===0?Infinity:g/l }
function hitRatio(tr){ if(!tr.length) return 0; const w=tr.filter(t=>t.pnl>0).length; return w/tr.length }
function pct(x){ return `${((x||0)*100).toFixed(2)}%` }
function classNeg(v){ return v<0 ? 'bad' : '' }
function fmtShort2(v){ return Number(v).toFixed(2) }
function monthDays(year, monthIndex){ const days=[]; const end=new Date(year, monthIndex+1, 0); for(let d=1; d<=end.getDate(); d++){ const dt=new Date(year, monthIndex, d); days.push(dt.toISOString().slice(0,10)); } return days }
function colorForRet(ret){ if(ret == null) return 'background:#121212;border:1px solid #1f1f1f;'; const mag=Math.min(1, Math.abs(ret)*10); if(ret>=0) return `background: rgba(32,227,214,${0.10+0.25*mag}); border:1px solid rgba(90,170,170,.35);`; return `background: rgba(255,95,162,${0.10+0.25*mag}); border:1px solid rgba(255,95,162,.35);`; }
function inlineStyle(cssText){ const out={}; cssText.split(';').forEach(rule=>{ const [k,v]=rule.split(':').map(x=>x&&x.trim()); if(!k||!v) return; const jsKey=k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()); out[jsKey]=v }); return out }
function fmtCCY(v, ccy='USD'){ try{ return new Intl.NumberFormat(undefined,{ style:'currency',currency:ccy, minimumFractionDigits:2, maximumFractionDigits:2 }).format(v ?? 0)}catch{ const x=(v ?? 0).toFixed(2); return `${x} ${ccy}` }}

/** HWM / LWM séries */
function hwmLwmSeries(equity){
  let hwm = -Infinity, lwm = Infinity;
  return equity.map(p=>{
    hwm = Math.max(hwm, p.equity);
    lwm = Math.min(lwm, p.equity);
    return { date: p.date, hwm, lwm };
  });
}

/** FX */
const DISPLAY_CURRENCIES = ['USD','EUR','CHF']
const fxFallback = {
  USD: { USD:1,  EUR:0.93, CHF:0.88 },
  EUR: { USD:1/0.93, EUR:1, CHF:0.88/0.93 },
  CHF: { USD:1/0.88, EUR:0.93/0.88, CHF:1 }
}

/** Actifs (≥X% majors) */
function splitSymbolsByShare(trades, threshold = 0.10) {
  const count = new Map();
  for (const t of trades) count.set(t.symbol, (count.get(t.symbol) || 0) + 1);
  const total = Array.from(count.values()).reduce((a,b)=>a+b,0) || 1;
  const share = new Map(Array.from(count, ([s,v]) => [s, v/total]));
  const major = new Set(Array.from(share).filter(([,p]) => p >= threshold).map(([s]) => s));
  const minor = new Set(Array.from(share).filter(([,p]) => p < threshold).map(([s]) => s));
  return { major, minor, share };
}

/** Multi-courbes par actif + "Autres" */
function buildSymbolEquitiesGrouped(dates, trades, displayCcy, majorSet, dateToGlobal, convertFn, othersLabel = 'Autres') {
  const symbols = Array.from(new Set(trades.map(t=>t.symbol))).sort();
  const base = 10000;
  const byDay = new Map(); // date__symbol -> pnl
  for (const t of trades) {
    const k = `${t.date}__${t.symbol}`;
    const v = convertFn(t.pnl, t.instrument_ccy || 'USD', displayCcy);
    byDay.set(k, (byDay.get(k) || 0) + v);
  }
  const majors = Array.from(majorSet);
  const cumMaj = new Map(majors.map(s => [s, base]));
  let cumOthers = base;
  const rows = [];
  for (const d of dates) {
    const row = { date: d, __GLOBAL__: Number((dateToGlobal.get(d) || 0).toFixed(2)) };
    for (const s of majors) {
      const add = byDay.get(`${d}__${s}`) || 0;
      cumMaj.set(s, Number((cumMaj.get(s) + add).toFixed(2)));
      row[s] = cumMaj.get(s);
    }
    const othersAdd = symbols.filter(s => !majorSet.has(s)).reduce((acc, s) => acc + (byDay.get(`${d}__${s}`) || 0), 0);
    cumOthers = Number((cumOthers + othersAdd).toFixed(2));
    if (symbols.some(s => !majorSet.has(s))) row[othersLabel] = cumOthers;
    rows.push(row);
  }
  const plotSymbols = [...majors];
  if (symbols.some(s => !majorSet.has(s))) plotSymbols.push(othersLabel);
  return { rows, plotSymbols };
}

/** ==========
 *  App
 *  ========== */
export default function App(){
  // CSV optionnel (imports locaux) + persistance cashflows
  const [userTrades, setUserTrades] = useState(null);
  const [userCashflows, setUserCashflows] = useState(()=>{
    const saved = localStorage.getItem('zp_cashflows_v1');
    return saved ? JSON.parse(saved) : null;
  });
  const [userExtraCashflows, setUserExtraCashflows] = useState(()=>{
    try{
      const raw = localStorage.getItem('zp_cashflows_custom');
      return raw ? JSON.parse(raw) : [];
    }catch{return []}
  });

  const tradesSource = userTrades ?? demoTrades;
  const cashflows = (userCashflows ?? demoCashflows).concat(userExtraCashflows);

  useEffect(()=>{
    if(userCashflows){
      localStorage.setItem('zp_cashflows_v1', JSON.stringify(userCashflows));
    }
  },[userCashflows]);

  // Filtres (inclut symbole)
  const [account, setAccount] = useState('ALL')
  const [broker, setBroker]   = useState('ALL')
  const [strategy, setStrategy] = useState('ALL')
  const [symbol, setSymbol] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [displayCcy, setDisplayCcy] = useState('USD')
  const [minShare, setMinShare] = useState(10) // <= UNIQUE (corrigé)

  const accounts = useMemo(()=>Array.from(new Set(tradesSource.map(t=>t.account))),[tradesSource])
  const brokers  = useMemo(()=>Array.from(new Set(tradesSource.map(t=>t.broker || ''))).filter(Boolean),[tradesSource])
  const strategies = useMemo(()=>Array.from(new Set(tradesSource.map(t=>t.strategy))),[tradesSource])
  const symbols = useMemo(()=>Array.from(new Set(tradesSource.map(t=>t.symbol))).sort(),[tradesSource])

  // FX (live fallback->static)
  const [liveFx, setLiveFx] = useState(null)
  useEffect(() => {
    const key = 'fx_cache_v1';
    const cached = localStorage.getItem(key);
    const now = Date.now();
    if (cached) {
      const { at, rates } = JSON.parse(cached);
      if (now - at < 24*60*60*1000) { setLiveFx(rates); return; }
    }
    fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF')
      .then(r => r.json())
      .then(j => {
        const rates = { USD: {USD:1, EUR:j.rates.EUR, CHF:j.rates.CHF} };
        rates.EUR = { USD:1/j.rates.EUR, EUR:1, CHF:j.rates.CHF/j.rates.EUR };
        rates.CHF = { USD:1/j.rates.CHF, EUR:j.rates.EUR/j.rates.CHF, CHF:1 };
        localStorage.setItem(key, JSON.stringify({ at: now, rates }));
        setLiveFx(rates);
      })
      .catch(()=>{});
  }, []);
  const convert = useCallback((value, from='USD', to='USD') => {
    if (value==null || from===to) return Number((value||0).toFixed(2));
    const table = liveFx || fxFallback;
    const res = value * (table[from]?.[to] ?? 1);
    return Number(res.toFixed(2));
  }, [liveFx]);

  // Filtre trades
  const filteredTrades = useMemo(()=>tradesSource.filter(t=>{
    if(account!=='ALL' && t.account!==account) return false
    if(broker!=='ALL' && t.broker!==broker) return false
    if(strategy!=='ALL' && t.strategy!==strategy) return false
    if(symbol!=='ALL' && t.symbol!==symbol) return false
    if(dateFrom && t.date < dateFrom) return false
    if(dateTo && t.date > dateTo) return false
    return true
  }),[tradesSource,account,broker,strategy,symbol,dateFrom,dateTo])

  // Équité ref et conversions
  const equityRef = useMemo(()=>{
    return demoEquity.filter(p=>{
      if(dateFrom && p.date < dateFrom) return false
      if(dateTo && p.date > dateTo) return false
      return true
    }).map(p=>({
      date: p.date,
      equity: convert(p.equity, p.account_ccy || 'USD', displayCcy),
      account_ccy: displayCcy
    }))
  },[dateFrom, dateTo, displayCcy, convert])

  const tradesConverted = useMemo(()=>filteredTrades.map(t=>({
    ...t, pnl_disp: convert(t.pnl, t.instrument_ccy || 'USD', displayCcy)
  })),[filteredTrades, displayCcy, convert])

  // Cashflows conversions
  const cashflowsDisp = useMemo(()=>cashflows.map(c => ({
    ...c, amount_disp: convert(c.amount, c.ccy || 'USD', displayCcy)
  })),[cashflows, displayCcy, convert]);

  // Filtrage cashflows pour capital filtré (les flux globaux restent inclus)
  const cashflowsFiltered = useMemo(()=> cashflowsDisp.filter(c=>{
    if(dateFrom && c.date < dateFrom) return false;
    if(dateTo && c.date > dateTo) return false;
    if(account !== 'ALL'  && c.account  && c.account  !== account)  return false;
    if(broker  !== 'ALL'  && c.broker   && c.broker   !== broker)   return false;
    if(strategy!== 'ALL'  && c.strategy && c.strategy !== strategy) return false;
    if(symbol  !== 'ALL'  && c.symbol   && c.symbol   !== symbol)   return false;
    return true;
  }),[cashflowsDisp, dateFrom, dateTo, account, broker, strategy, symbol]);

  // Capital global (figé) & capital filtré (pour analyses)
  const startConverted = useMemo(()=> convert(START_EQUITY_USD, 'USD', displayCcy), [displayCcy, convert]);
  const capitalGlobal = useMemo(()=> startConverted + cashflowsDisp.reduce((a,c)=>a+(c.amount_disp||0),0), [startConverted, cashflowsDisp]);
  const capitalFiltre = useMemo(()=> startConverted + cashflowsFiltered.reduce((a,c)=>a+(c.amount_disp||0),0), [startConverted, cashflowsFiltered]);

  // PnL / Équité filtrée
  const pnlByDate = useMemo(()=>{ const m=new Map(); tradesConverted.forEach(t=>m.set(t.date, (m.get(t.date)||0)+t.pnl_disp)); return m },[tradesConverted]);
  const allDatesInRange = useMemo(()=> equityRef.map(p=>p.date), [equityRef]);
  const equityFromTrades = useMemo(()=>{
    let cum = capitalFiltre;
    return allDatesInRange.map(d=>{
      const add = pnlByDate.get(d) || 0;
      cum = Number((cum + add).toFixed(2));
      return { date: d, equity: cum };
    });
  },[allDatesInRange, pnlByDate, capitalFiltre]);

  const hwmLwm = useMemo(()=>hwmLwmSeries(equityFromTrades),[equityFromTrades]);

  // Séries métriques dynamiques
  const returns = useMemo(()=>dailyReturns(equityFromTrades),[equityFromTrades]);
  const ddSeries = useMemo(()=>drawdownSeries(equityFromTrades),[equityFromTrades]);
  const pnlFiltered = useMemo(()=> tradesConverted.reduce((a,t)=>a+(t.pnl_disp||0),0), [tradesConverted]);
  const totalFiltered = useMemo(()=> capitalFiltre + pnlFiltered, [capitalFiltre, pnlFiltered]);

  const calcMTD = (rets)=>{ if(!rets.length) return 0; const month = rets.at(-1).date.slice(0,7); return rets.filter(r=>r.date.startsWith(month)).reduce((a,b)=>a+b.ret,0) }
  const calcYTD = (eq)=>{ if(!eq.length) return 0; const year = eq.at(-1).date.slice(0,4); const pts = eq.filter(p=>p.date.startsWith(year)); if(pts.length<2) return 0; return (pts.at(-1).equity/pts[0].equity)-1 }
  const calcLast12M = (eq)=>{ if(eq.length<2) return 0; const n=eq.length; const end=eq[n-1].equity; const start=eq[Math.max(0,n-252)].equity; return end/start - 1 }

  const lastDayRet = returns.at(-1)?.ret ?? 0;
  const mtd = calcMTD(returns);
  const ytd = calcYTD(equityFromTrades);
  const ann = calcLast12M(equityFromTrades);

  const kpi = useMemo(()=>({
    sharpe: sharpe(returns),
    sortino: sortino(returns),
    maxDD: maxDrawdown(equityFromTrades),
    profitFactor: profitFactor(tradesConverted),
    hitRatio: hitRatio(tradesConverted),
  }),[returns, tradesConverted, equityFromTrades]);

  // Bloc rentabilité (WR/RR/RoR)
  const rentab = useMemo(()=>{
    const wins = tradesConverted.filter(t => t.pnl_disp > 0);
    const losses = tradesConverted.filter(t => t.pnl_disp < 0);
    const WR = (wins.length + losses.length) ? wins.length / (wins.length + losses.length) : 0;
    const avgWin = wins.length ? wins.reduce((a,t)=>a+t.pnl_disp,0)/wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a,t)=>a+t.pnl_disp,0)/losses.length) : 0;
    const RR = avgLoss>0 ? avgWin/avgLoss : 0;
    const expectancy = WR*RR - (1-WR);
    const riskPerTrade = 0.01;
    const RoR = Math.pow((1 - (expectancy/(RR+1))) / (1 + (expectancy/(RR+1))), 1 / Math.max(1e-6,riskPerTrade));
    return { WR, RR, expectancy, RoR };
  },[tradesConverted]);

  // Groupement actifs (répartition + multicourbes si besoin)
  const othersLabel = useMemo(() => `Autres (<${minShare}%)`, [minShare])
  const { major: majorSet } = useMemo(
    () => splitSymbolsByShare(filteredTrades, minShare/100),
    [filteredTrades, minShare]
  )
  const allDates = useMemo(() => equityRef.map(p => p.date), [equityRef])
  const dateToGlobal = useMemo(() => new Map(equityRef.map(p => [p.date, p.equity])), [equityRef])
  const { rows: equityBySymbolRows, plotSymbols } = useMemo(
    () => buildSymbolEquitiesGrouped(allDates, filteredTrades, displayCcy, majorSet, dateToGlobal, convert, othersLabel),
    [allDates, filteredTrades, displayCcy, majorSet, dateToGlobal, othersLabel, convert]
  )

  // Répartition actifs / stratégies
  const assetSplit = useMemo(() => {
    const counts = new Map();
    filteredTrades.forEach(t => counts.set(t.symbol, (counts.get(t.symbol)||0) + 1));
    const total = Array.from(counts.values()).reduce((a,b)=>a+b,0) || 1;
    const majors = []; let othersSum = 0;
    for (const [name, value] of counts) { const share = value / total; if (share >= (minShare/100)) majors.push({ name, value }); else othersSum += value; }
    if (othersSum > 0) majors.push({ name: othersLabel, value: othersSum });
    return majors.sort((a,b)=>b.value-a.value);
  }, [filteredTrades, minShare, othersLabel]);

  const strategySplit = useMemo(()=>{
    const m=new Map(); filteredTrades.forEach(t=>m.set(t.strategy,(m.get(t.strategy)||0)+1));
    return Array.from(m, ([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[filteredTrades]);

  // Top/Flop mensuels
  const monthKey = useMemo(()=>{
    const last = filteredTrades.map(t=>t.date).sort().pop() || new Date().toISOString().slice(0,10);
    return last.slice(0,7);
  },[filteredTrades]);
  const monthTrades = useMemo(()=> filteredTrades.filter(t=>t.date.startsWith(monthKey)), [filteredTrades,monthKey]);

  function topFlop(list, key){
    const map = new Map();
    for(const t of list){ const k=t[key]; map.set(k,(map.get(k)||0)+t.pnl_disp); }
    const arr = Array.from(map, ([name, value]) => ({ name, value }));
    const best = [...arr].sort((a,b)=>b.value-a.value).slice(0,3);
    const worst = [...arr].sort((a,b)=>a.value-b.value).slice(0,3);
    return { best, worst };
  }
  const tfSymbols = useMemo(()=>topFlop(monthTrades,'symbol'),[monthTrades])
  const tfStrats  = useMemo(()=>topFlop(monthTrades,'strategy'),[monthTrades])

  // Heures d’ouverture (bars)
  const hourlyBars = useMemo(()=>{
    const base = Array.from({length:24}, (_,h)=>({ hour: `${String(h).padStart(2,'0')}:00`, gains:0, losses:0 }))
    for(const t of filteredTrades){
      const h = typeof t.open_hour === 'number' ? t.open_hour : new Date(t.open_time||`${t.date}T00:00:00Z`).getHours()
      if(h>=0 && h<24){
        if(t.pnl > 0) base[h].gains += convert(t.pnl,'USD',displayCcy);
        else if(t.pnl < 0) base[h].losses += Math.abs(convert(t.pnl,'USD',displayCcy));
      }
    }
    return base.map(r=>({ ...r, gains:Number(r.gains.toFixed(2)), losses:Number(r.losses.toFixed(2)) }))
  },[filteredTrades, displayCcy, convert])

  // Revenus par type (filtrent par dates et affectations)
  const cashflowsInRange = useMemo(()=> cashflowsDisp.filter(c=>{
    if(dateFrom && c.date < dateFrom) return false;
    if(dateTo && c.date > dateTo) return false;
    if(account !== 'ALL'  && c.account  && c.account  !== account)  return false;
    if(broker  !== 'ALL'  && c.broker   && c.broker   !== broker)   return false;
    if(strategy!== 'ALL'  && c.strategy && c.strategy !== strategy) return false;
    if(symbol  !== 'ALL'  && c.symbol   && c.symbol   !== symbol)   return false;
    return true;
  }),[cashflowsDisp, dateFrom, dateTo, account, broker, strategy, symbol]);
  const revenueByType = useMemo(()=>{
    const m=new Map(); for(const c of cashflowsInRange){ m.set(c.type,(m.get(c.type)||0)+(c.amount_disp||0)); }
    return Array.from(m, ([name, value]) => ({ name, value }));
  },[cashflowsInRange]);
  const revenueTotal = useMemo(()=> revenueByType.reduce((a,b)=>a+b.value,0) || 1, [revenueByType]);

  // Alertes risque (mois courant) — trades>1%, positions>2%
  const onePct = totalFiltered * 0.01;
  const twoPct = totalFiltered * 0.02;
  const alertsTrades = useMemo(()=>monthTrades
    .filter(t => Math.abs(t.pnl_disp) > onePct)
    .map(t => ({ id:t.trade_id, symbol:t.symbol, pnl:t.pnl_disp, date:t.date }))
  ,[monthTrades, onePct]);
  const alertsPositions = useMemo(()=>{
    const grp = new Map();
    for(const t of monthTrades){
      const openDay = (t.open_time||`${t.date}T00:00:00Z`).slice(0,10);
      const key = `${t.symbol}__${openDay}`;
      grp.set(key, (grp.get(key)||0)+t.pnl_disp);
    }
    return Array.from(grp, ([key, pnl])=>{
      const [symbol, day] = key.split('__');
      return { key, symbol, day, pnl };
    }).filter(x => Math.abs(x.pnl) > twoPct);
  },[monthTrades, twoPct]);

  // Calendrier
  const lastDate = equityRef.at(-1)?.date
  const [calYear, setCalYear] = useState(lastDate ? Number(lastDate.slice(0,4)) : new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(lastDate ? Number(lastDate.slice(5,7))-1 : new Date().getMonth())
  const monthDates = useMemo(()=>monthDays(calYear, calMonth),[calYear, calMonth])
  const monthLabel = useMemo(()=>{
    const dt = new Date(calYear, calMonth, 1)
    return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  },[calYear, calMonth])
  const returnsMap = useMemo(()=>{ const m=new Map(); dailyReturns(equityFromTrades).forEach(r=>m.set(r.date, r.ret)); return m },[equityFromTrades])
  const ddSeries = useMemo(()=>drawdownSeries(equityFromTrades),[equityFromTrades])
  const calendarMap = useMemo(()=>{
    const map = new Map()
    const ddByDate = new Map(ddSeries.map(x=>[x.date, x.dd]))
    for(const p of equityFromTrades.slice(1)){
      const prev = equityFromTrades.find(q=>q.date===p.date) // déjà trié; simplifié
      const ret = returnsMap.get(p.date)
      map.set(p.date, { ret, dd: ddByDate.get(p.date) ?? null })
    }
    return map
  },[equityFromTrades, ddSeries, returnsMap])
  const monthSummary = useMemo(()=>{
    const ym = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
    const monthPoints = equityFromTrades.filter(p=>p.date.startsWith(ym));
    if (monthPoints.length < 2) return { amt:0, pct:0, dd:0 };
    const start = monthPoints[0].equity, end = monthPoints.at(-1).equity;
    const pctV = end/start - 1;
    const ddV = Math.min(...drawdownSeries(monthPoints).map(x=>x.dd));
    return { amt: end - start, pct: pctV, dd: Math.abs(ddV) };
  },[equityFromTrades, calYear, calMonth]);
  const monthDailyBestWorst = useMemo(()=>{
    const ym = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
    const days = dailyReturns(equityFromTrades).filter(r=>r.date.startsWith(ym));
    if(!days.length) return { bestDate:null, worstDate:null };
    let best = days[0], worst = days[0];
    for(const d of days){ if(d.ret > best.ret) best=d; if(d.ret < worst.ret) worst=d; }
    return { bestDate: best.date, worstDate: worst.date };
  },[equityFromTrades, calYear, calMonth]);

  // Alertes comportement (stratégies/heures/jours) — fenêtres 30j vs 120j
  const RECENT_DAYS = 30, BASELINE_LOOKBACK_DAYS = 120, MIN_TRADES_BASELINE=20, MIN_TRADES_RECENT=15, LOSS_RATE_THRESHOLD=0.80, MIN_TRADES_BUCKET=10, Z_THRESHOLD=2.0;
  function daysAgoISO(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10) }
  function groupBy(arr, keyFn){ const m=new Map(); for(const x of arr){ const k=keyFn(x); m.set(k,(m.get(k)||[]).concat([x])); } return m; }
  const cutoffRecent = daysAgoISO(RECENT_DAYS);
  const cutoffBaseline = daysAgoISO(BASELINE_LOOKBACK_DAYS);
  const tradesRecent = useMemo(()=> filteredTrades.filter(t => t.date >= cutoffRecent), [filteredTrades, cutoffRecent]);
  const tradesBaseline = useMemo(()=> filteredTrades.filter(t => t.date < cutoffRecent && t.date >= cutoffBaseline), [filteredTrades, cutoffRecent, cutoffBaseline]);

  const strategyBehaviorAlerts = useMemo(()=>{
    const out = [];
    const byStratRecent = groupBy(tradesRecent, t=>t.strategy||'Unknown');
    const byStratBase   = groupBy(tradesBaseline, t=>t.strategy||'Unknown');
    for(const [strat, recentList] of byStratRecent.entries()){
      const baseList = byStratBase.get(strat) || [];
      const nR = recentList.length, nB = baseList.length;
      if(nR < MIN_TRADES_RECENT || nB < MIN_TRADES_BASELINE) continue;
      const wr = (list)=> (list.filter(t=>t.pnl>0).length / list.length);
      const avg = (list)=> list.reduce((a,t)=>a+t.pnl,0) / list.length;
      const wrR = wr(recentList), wrB = wr(baseList);
      const avgR = avg(recentList), avgB = avg(baseList);
      const varB = wrB*(1-wrB)/nB; const sdB = Math.sqrt(Math.max(varB, 1e-9));
      const z = (wrR - wrB) / sdB;
      const bigDrop = Math.abs(avgB)>0 ? (avgR < avgB && Math.abs((avgR-avgB)/avgB) > 0.5) : (avgR < avgB - 50);
      if(Math.abs(z) >= Z_THRESHOLD){
        out.push({ type:'strategy-z', strategy: strat, msg: `Changement win rate (z=${z.toFixed(2)})`, detail: `Réc: ${(wrR*100).toFixed(1)}% vs Base: ${(wrB*100).toFixed(1)}% (${nR}/${nB})`, severity: (z<0?'bad':'good') });
      }
      if(bigDrop){ out.push({ type:'strategy-pnl', strategy:strat, msg:'Baisse PnL moyen/trade', detail:`Réc: ${fmtCCY(avgR, displayCcy)} vs Base: ${fmtCCY(avgB, displayCcy)} (${nR}/${nB})`, severity:'bad' }) }
    }
    return out;
  }, [tradesRecent, tradesBaseline, displayCcy]);

  const timeBehaviorAlerts = useMemo(()=>{
    const out = [];
    if(!tradesRecent.length) return out;
    const byHour = groupBy(tradesRecent, t => {
      const h = typeof t.open_hour === 'number' ? t.open_hour : new Date(t.open_time||`${t.date}T00:00:00Z`).getHours();
      return isFinite(h) ? h : 0;
    });
    for(const [h, list] of byHour.entries()){
      const n = list.length; if(n < MIN_TRADES_BUCKET) continue;
      const losses = list.filter(t=>t.pnl < 0).length;
      const lossRate = losses / n;
      if(lossRate >= LOSS_RATE_THRESHOLD){
        out.push({ type:'hour-loss', bucket: `${String(h).padStart(2,'0')}:00–${String((h+1)%24).padStart(2,'0')}:00`, msg:`${(lossRate*100).toFixed(0)}% pertes (${n} trades)`, severity:'bad' });
      }
    }
    const dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    const byDow = groupBy(tradesRecent, t => new Date(t.date+'T00:00:00Z').getDay());
    for(const [dow, list] of byDow.entries()){
      const n = list.length; if(n < MIN_TRADES_BUCKET) continue;
      const losses = list.filter(t=>t.pnl < 0).length;
      const lossRate = losses / n;
      if(lossRate >= LOSS_RATE_THRESHOLD){
        out.push({ type:'dow-loss', bucket: dayNames[dow], msg:`${(lossRate*100).toFixed(0)}% pertes (${n} trades)`, severity:'bad' });
      }
    }
    return out;
  }, [tradesRecent]);

  const behaviorAlerts = useMemo(()=>[
    ...strategyBehaviorAlerts, ...timeBehaviorAlerts
  ], [strategyBehaviorAlerts, timeBehaviorAlerts]);

  // Clochette & panneau alertes
  const alertsCount = (behaviorAlerts?.length || 0) + (alertsTrades?.length || 0) + (alertsPositions?.length || 0);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  function buildAlertSummaryText() {
    const lines = [];
    lines.push(`ZooProjectVision — Alertes (${new Date().toLocaleString()})`);
    if (behaviorAlerts.length) {
      lines.push(`• Anomalies comportement :`);
      behaviorAlerts.forEach(a => lines.push(`   - ${a.type.includes('strategy') ? 'Strat' : a.type==='hour-loss' ? 'Heure' : 'Jour'} ${a.strategy||a.bucket}: ${a.msg}${a.detail ? ' — ' + a.detail : ''}`));
    }
    if (alertsTrades.length) {
      lines.push(`• Trades > 1% :`);
      alertsTrades.forEach(x => lines.push(`   - ${x.date} ${x.symbol}: ${x.pnl.toFixed(2)} ${displayCcy}`));
    }
    if (alertsPositions.length) {
      lines.push(`• Positions > 2% :`);
      alertsPositions.forEach(x => lines.push(`   - ${x.day} ${x.symbol}: ${x.pnl.toFixed(2)} ${displayCcy}`));
    }
    if (lines.length === 1) lines.push('Aucune alerte active.');
    return lines.join('\n');
  }

  // Tooltips
  const tooltipProps = {
    contentStyle: { background:'#121212', border:'1px solid #3a3a3a', color:'#e9ecef', borderRadius:10 },
    itemStyle: { color:'#e9ecef' },
    labelStyle: { color:'#d6d9dc' }
  };

  // Modal “ajouter flux”
  const [showFlowForm, setShowFlowForm] = useState(false);
  const [flowForm, setFlowForm] = useState({
    date: new Date().toISOString().slice(0,10),
    ccy: 'USD',
    amount: '',
    type: 'darwin_mgmt_fee',
    note: '',
    account: 'ALL',
    broker: 'ALL',
    strategy: 'ALL',
    symbol: 'ALL'
  });
  const flowTypes = [
    { value:'darwin_mgmt_fee', label:'Darwinex – management fee' },
    { value:'prop_payout',     label:'Prop firm – payout' },
    { value:'prop_fee',        label:'Prop firm – fee challenge' },
    { value:'deposit',         label:'Dépôt' },
    { value:'withdrawal',      label:'Retrait' },
    { value:'business_expense',label:'Charge business' },
    { value:'other_income',    label:'Autre revenu' }
  ];
  const resetFlowForm = ()=> setFlowForm({
    date: new Date().toISOString().slice(0,10),
    ccy: displayCcy,
    amount: '',
    type: 'darwin_mgmt_fee',
    note: '',
    account: 'ALL', broker:'ALL', strategy:'ALL', symbol:'ALL'
  });
  const submitFlowForm = (e)=>{
    e.preventDefault();
    const amt = Number(flowForm.amount);
    if(!flowForm.date || isNaN(amt) || !flowForm.ccy || !flowForm.type){
      alert('Merci de compléter Date, Montant, Devise et Type'); return;
    }
    const newRow = {
      date: flowForm.date,
      ccy: flowForm.ccy,
      amount: amt,
      type: flowForm.type,
      note: flowForm.note?.trim() || '',
      account: flowForm.account === 'ALL' ? undefined : flowForm.account,
      broker:  flowForm.broker  === 'ALL' ? undefined : flowForm.broker,
      strategy:flowForm.strategy=== 'ALL' ? undefined : flowForm.strategy,
      symbol:  flowForm.symbol  === 'ALL' ? undefined : flowForm.symbol
    };
    const updated = [...(userCashflows ?? demoCashflows), newRow];
    setUserCashflows(updated);
    setShowFlowForm(false);
    resetFlowForm();
  };

  // Rapport texte
  function buildReportText(){
    const lines = [];
    lines.push(`ZooProjectVision — Rapport (${new Date().toLocaleString()})`);
    lines.push(`Devise d’affichage : ${displayCcy}`);
    lines.push('');
    lines.push('— Résumé —');
    lines.push(`Capital (global): ${fmtCCY(capitalGlobal, displayCcy)}`);
    lines.push(`Base (filtrée): ${fmtCCY(capitalFiltre, displayCcy)} | PnL (filtré): ${fmtCCY(pnlFiltered, displayCcy)} | Total: ${fmtCCY(totalFiltered, displayCcy)}`);
    lines.push(`Jour: ${(lastDayRet*100).toFixed(2)}% | MTD: ${(mtd*100).toFixed(2)}% | YTD: ${(ytd*100).toFixed(2)}% | 12m: ${(ann*100).toFixed(2)}%`);
    lines.push(`Max DD: ${(kpi.maxDD*100).toFixed(2)}% | WR: ${(kpi.hitRatio*100).toFixed(2)}% | RR: ${rentab.RR.toFixed(2)} | RoR: ${(rentab.RoR*100).toFixed(1)}% | PF: ${kpi.profitFactor.toFixed(2)} | Sharpe: ${kpi.sharpe.toFixed(2)} | Sortino: ${kpi.sortino.toFixed(2)}`);
    lines.push('');
    lines.push('— Contributions —');
    lines.push('Actifs (Top/Flop du mois):');
    lines.push('  Top:  ' + tfSymbols.best.map(x=>`${x.name} ${fmtCCY(x.value, displayCcy)}`).join(' | '));
    lines.push('  Flop: ' + tfSymbols.worst.map(x=>`${x.name} ${fmtCCY(x.value, displayCcy)}`).join(' | '));
    lines.push('Stratégies (Top/Flop du mois):');
    lines.push('  Top:  ' + tfStrats.best.map(x=>`${x.name} ${fmtCCY(x.value, displayCcy)}`).join(' | '));
    lines.push('  Flop: ' + tfStrats.worst.map(x=>`${x.name} ${fmtCCY(x.value, displayCcy)}`).join(' | '));
    lines.push('');
    lines.push('— Calendrier —');
    lines.push(`Perf mensuelle: ${fmtCCY(monthSummary.amt, displayCcy)} (${(monthSummary.pct*100).toFixed(2)}%), DD mois: ${(monthSummary.dd*100).toFixed(2)}%`);
    if (monthDailyBestWorst.bestDate) lines.push(`Meilleur jour: ${monthDailyBestWorst.bestDate}`);
    if (monthDailyBestWorst.worstDate) lines.push(`Pire jour: ${monthDailyBestWorst.worstDate}`);
    lines.push('');
    lines.push('— Alertes —');
    if (!alertsTrades.length && !alertsPositions.length && !behaviorAlerts.length) {
      lines.push('Aucune alerte active.');
    } else {
      behaviorAlerts.forEach(a => lines.push(`* ${a.type.includes('strategy') ? 'Strat' : a.type==='hour-loss' ? 'Heure' : 'Jour'} ${a.strategy||a.bucket}: ${a.msg}${a.detail ? ' — ' + a.detail : ''}`));
      alertsTrades.forEach(x => lines.push(`* Trade >1%: ${x.date} ${x.symbol} ${fmtCCY(x.pnl, displayCcy)}`));
      alertsPositions.forEach(x => lines.push(`* Position >2%: ${x.day} ${x.symbol} ${fmtCCY(x.pnl, displayCcy)}`));
    }
    return lines.join('\n');
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1 style={{color:'#20e3d6', fontWeight:400}}>ZooProjectVision</h1>
          <div className="tagline">multi-comptes • multi-brokers • {displayCcy} • calendrier p&l • heures d’ouverture</div>
        </div>
        <div className="btns" style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
          <label className="btn" style={{position:'relative', overflow:'hidden'}}>
            importer trades csv
            <input type="file" accept=".csv" style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}
              onChange={e=>{
                const f = e.target.files?.[0]; if(!f) return;
                const fr = new FileReader();
                fr.onload = () => {
                  const rows = parseCSV(String(fr.result));
                  const mapped = rows.map((r, i)=>({
                    trade_id: r.trade_id || `U${i}`,
                    date: r.date,
                    open_time: r.open_time || null,
                    open_hour: r.open_hour ? Number(r.open_hour) : (r.open_time ? new Date(r.open_time).getHours() : null),
                    account: r.account || 'ACC-1',
                    broker: r.broker || '',
                    strategy: r.strategy || 'Unknown',
                    symbol: r.symbol || 'UNKNOWN',
                    instrument_ccy: r.instrument_ccy || 'USD',
                    side: r.side || 'BUY',
                    qty: Number(r.qty||0),
                    price: Number(r.price||0),
                    fee: Number(r.fee||0),
                    pnl: Number(r.pnl||0),
                    pnl_disp: Number(r.pnl||0), // sera reconverti
                    notes: r.notes || ''
                  }));
                  setUserTrades(mapped);
                };
                fr.readAsText(f);
              }}
            />
          </label>
          <label className="btn" style={{position:'relative', overflow:'hidden'}}>
            importer cashflows csv
            <input type="file" accept=".csv" style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}
              onChange={e=>{
                const f = e.target.files?.[0]; if(!f) return;
                const fr = new FileReader();
                fr.onload = () => {
                  const rows = parseCSV(String(fr.result));
                  const mapped = rows.map(r=>({
                    date: r.date,
                    ccy: r.ccy || 'USD',
                    amount: Number(r.amount || 0),
                    type: r.type || 'other',
                    note: r.note || '',
                    account: r.account || undefined,
                    broker: r.broker || undefined,
                    strategy: r.strategy || undefined,
                    symbol: r.symbol || undefined
                  }));
                  setUserCashflows(mapped);
                };
                fr.readAsText(f);
              }}
            />
          </label>

          <button className="btn" onClick={()=>window.location.reload()}>actualiser</button>
          <button className="btn" onClick={()=>setShowFlowForm(true)}>ajouter flux</button>
          <button className="btn" onClick={()=>{
            const text = buildReportText();
            navigator.clipboard.writeText(text).catch(()=>{});
            alert('Rapport copié dans le presse-papiers ✅');
          }}>générer le rapport</button>
          <button className="btn" onClick={()=>{
            const text = buildReportText();
            const blob = new Blob([text], {type:'text/plain;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href=url; a.download='rapport.txt'; a.click();
            URL.revokeObjectURL(url);
          }}>télécharger rapport</button>
          <button className="btn" onClick={async ()=>{
            try{
              const text = buildReportText();
              const res = await fetch('/api/notify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channel:'whatsapp', message: text }) });
              if(!res.ok) throw new Error('Notify failed');
              alert('Rapport envoyé sur WhatsApp ✅');
            }catch(e){ alert('Impossible d’envoyer sur WhatsApp (config requise).') }
          }}>envoyer whatsapp</button>

          <button className="icon-bell" onClick={()=>setShowAlertsPanel(s=>!s)} aria-label="Voir les alertes">
            <span className={`bell ${alertsCount>0?'hot':''}`}>🔔</span>
            {alertsCount>0 && <span className="badge">{alertsCount}</span>}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card controls">
        <div className="item"><label>Compte</label>
          <select value={account} onChange={e=>setAccount(e.target.value)}>
            <option value="ALL">Tous</option>
            {accounts.map(a=>(<option key={a} value={a}>{a}</option>))}
          </select>
        </div>
        <div className="item"><label>Broker</label>
          <select value={broker} onChange={e=>setBroker(e.target.value)}>
            <option value="ALL">Tous</option>
            {brokers.map(b=>(<option key={b} value={b}>{b}</option>))}
          </select>
        </div>
        <div className="item"><label>Stratégie</label>
          <select value={strategy} onChange={e=>setStrategy(e.target.value)}>
            <option value="ALL">Toutes</option>
            {strategies.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="item"><label>Actif</label>
          <select value={symbol} onChange={e=>setSymbol(e.target.value)}>
            <option value="ALL">Tous</option>
            {symbols.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="item"><label>Du</label><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></div>
        <div className="item"><label>Au</label><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></div>
        <div className="item"><label>Devise d’affichage</label>
          <select value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)}>{DISPLAY_CURRENCIES.map(c=> <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="item"><label>Seuil actifs (≥%)</label>
          <select value={minShare} onChange={e=>setMinShare(Number(e.target.value))}>
            <option value={5}>5%</option><option value={10}>10%</option><option value={15}>15%</option>
          </select>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi">
        <div className="card item"><h3>Capital (global)</h3><div className="val">{fmtCCY(capitalGlobal, displayCcy)}</div></div>
        <div className="card item"><h3>Capital (filtré)</h3><div className="val">{fmtCCY(capitalFiltre, displayCcy)}</div></div>
        <div className="card item"><h3>PnL (filtré)</h3><div className={`val ${classNeg(pnlFiltered)}`}>{fmtCCY(pnlFiltered, displayCcy)}</div></div>
        <div className="card item"><h3>Total (filtré)</h3><div className={`val ${classNeg(totalFiltered)}`}>{fmtCCY(totalFiltered, displayCcy)}</div></div>
        <div className="card item"><h3>Jour</h3><div className={`val ${classNeg(lastDayRet)}`}>{pct(lastDayRet)}</div></div>
        <div className="card item"><h3>Mtd</h3><div className={`val ${classNeg(mtd)}`}>{pct(mtd)}</div></div>
        <div className="card item"><h3>Ytd</h3><div className={`val ${classNeg(ytd)}`}>{pct(ytd)}</div></div>
        <div className="card item"><h3>Annuel (12m)</h3><div className={`val ${classNeg(ann)}`}>{pct(ann)}</div></div>
        <div className="card item"><h3>Max dd</h3><div className="val bad">{pct(kpi.maxDD)}</div></div>
        <div className="card item"><h3>Wr / Rr / Ror</h3>
          <div className={`val ${rentab.expectancy>0?'':'bad'}`}>{(kpi.hitRatio*100).toFixed(1)}% / {rentab.RR.toFixed(2)} / {(rentab.RoR*100).toFixed(1)}%</div>
          <div className="sub">{rentab.expectancy>0?'🟢 Système rentable':'🔴 Non rentable'}</div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid">
        {/* Équité filtrée + HWM/LWM */}
        <div className="card chart-card chart-xl">
          <h3>Courbe d’équité (filtrée)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={equityFromTrades} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="turqStroke" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20e3d6"/><stop offset="100%" stopColor="#18b8ad"/></linearGradient>
                <linearGradient id="pinkStroke" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5fa2"/><stop offset="100%" stopColor="#ff7cbf"/></linearGradient>
              </defs>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke="#7a7a7a" tickLine={false} axisLine={{stroke:'#7a7a7a'}} tick={{fontSize:10}} tickMargin={6}/>
              <YAxis stroke="#7a7a7a" tickLine={false} axisLine={{stroke:'#7a7a7a'}} tick={{fontSize:10}} tickFormatter={fmtShort2} tickMargin={8}/>
              <Tooltip {...tooltipProps} />
              <Legend wrapperStyle={{ fontSize: 12, color:'#e9ecef' }} />
              <Line type="monotone" dataKey="equity" name="Équité" dot={false} stroke="#ffffff" strokeWidth={3.2} isAnimationActive={false} activeDot={false} />
              <Line type="monotone" data={hwmLwm} dataKey="hwm" name="Plus haut" dot={false} stroke="url(#turqStroke)" strokeWidth={1.6} isAnimationActive={false} activeDot={false} />
              <Line type="monotone" data={hwmLwm} dataKey="lwm" name="Plus bas" dot={false} stroke="url(#pinkStroke)" strokeWidth={1.6} isAnimationActive={false} activeDot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Drawdown */}
        <div className="card chart-card chart-xl">
          <h3>Drawdown</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={ddSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs><linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5fa2"/><stop offset="100%" stopColor="#ff7cbf"/></linearGradient></defs>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="date" stroke="#7a7a7a" tickLine={false} axisLine={{stroke:'#7a7a7a'}} tick={{fontSize:10}} tickMargin={6}/>
              <YAxis stroke="#7a7a7a" tickLine={false} axisLine={{stroke:'#7a7a7a'}} tick={{fontSize:10}} tickFormatter={(v)=>`${(v*100).toFixed(2)}%`} tickMargin={8}/>
              <Tooltip {...tooltipProps} formatter={(v)=>`${(v*100).toFixed(2)}%`} />
              <Area type="monotone" dataKey="dd" name="Dd" activeDot={false} fill="url(#ddFill)" stroke="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Calendrier */}
        <div className="card" style={{padding:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom:8}}>
            <h3 style={{margin:0}}>Calendrier – {monthLabel}</h3>
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={()=>{ let m = calMonth-1, y = calYear; if(m<0){ m=11; y=y-1 } setCalYear(y); setCalMonth(m) }}>◀</button>
              <button className="btn" onClick={()=>{ let m = calMonth+1, y = calYear; if(m>11){ m=0; y=y+1 } setCalYear(y); setCalMonth(m) }}>▶</button>
            </div>
          </div>
          <Calendar monthDates={monthDates} calYear={calYear} calMonth={calMonth}
                    returns={dailyReturns(equityFromTrades)} ddSeries={ddSeries} displayCcy={displayCcy} />
        </div>
      </div>

      {/* Top/Flop + Heures + Répartition type revenus */}
      <div className="grid">
        <TopFlopCard title={`Top / Flop du mois – Actifs (${monthKey})`} data={tfSymbols} displayCcy={displayCcy} />
        <TopFlopCard title={`Top / Flop du mois – Stratégies (${monthKey})`} data={tfStrats}  displayCcy={displayCcy} />
        <div className="card chart-card" style={{height:360}}>
          <h3>Gain / Perte par heure d’ouverture</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={hourlyBars} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="turqGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20e3d6"/><stop offset="100%" stopColor="#18b8ad"/></linearGradient>
                <linearGradient id="pinkGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5fa2"/><stop offset="100%" stopColor="#ff7cbf"/></linearGradient>
              </defs>
              <CartesianGrid stroke="#2b2b2b" />
              <XAxis dataKey="hour" stroke="#7a7a7a" axisLine={{stroke:'#7a7a7a'}} tickLine={false} tick={{fontSize:10}} tickMargin={6}/>
              <YAxis stroke="#7a7a7a" axisLine={{stroke:'#7a7a7a'}} tickLine={false} tick={{fontSize:10}} tickFormatter={(v)=>fmtCCY(v, displayCcy)} tickMargin={8}/>
              <Tooltip {...tooltipProps} formatter={(v)=>fmtCCY(v, displayCcy)} />
              <Legend wrapperStyle={{ fontSize: 12, color:'#e9ecef' }} />
              <Bar dataKey="gains" name="Gains" fill="url(#turqGloss)" />
              <Bar dataKey="losses" name="Pertes" fill="url(#pinkGloss)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition + revenus par type + alertes risque */}
      <div className="grid">
        <PieBlock title="Répartition des actifs" data={assetSplit} />
        <PieBlock title="Répartition par stratégie" data={strategySplit} />
        <div className="card chart-card" style={{height:320, overflow:'auto'}}>
          <h3>Revenus par type</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <defs>
                <linearGradient id="pieTurq3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20e3d6"/><stop offset="100%" stopColor="#18b8ad"/></linearGradient>
                <linearGradient id="piePink3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5fa2"/><stop offset="100%" stopColor="#ff7cbf"/></linearGradient>
                <linearGradient id="pieBlue3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6aa6ff"/><stop offset="100%" stopColor="#4e86d8"/></linearGradient>
                <linearGradient id="pieViolet3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c792ea"/><stop offset="100%" stopColor="#a878cf"/></linearGradient>
              </defs>
              <Pie data={revenueByType} dataKey="value" nameKey="name" outerRadius={100} stroke="none">
                {revenueByType.map((seg, i) => {
                  const fills = ['url(#pieTurq3)','url(#piePink3)','url(#pieBlue3)','url(#pieViolet3)'];
                  return <Cell key={i} fill={fills[i % fills.length]} stroke="none" />;
                })}
              </Pie>
              <Tooltip
                {...tooltipProps}
                formatter={(v, n, ctx) => {
                  const pct = ((ctx.payload.value/revenueTotal)*100).toFixed(2)+'%';
                  return [`${fmtCCY(ctx.payload.value, displayCcy)} (${pct})`, ctx.payload.name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color:'#e9ecef' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Alertes risque */}
        <div className="card" style={{height:320, overflow:'auto'}}>
          <h3>Alertes risque (trade & position – mois)</h3>
          <div style={{fontSize:12, color:'#bfc5c9', marginBottom:8}}>
            trade &gt; 1% · position &gt; 2% (basé sur Total filtré)
          </div>
          <div className="two-cols">
            <div>
              <div className="pill">Trades &gt; 1%</div>
              {alertsTrades.length===0 && <div className="row-kv"><span>Aucune</span><span>-</span></div>}
              {alertsTrades.map(x=>(
                <div key={x.id} className="row-kv"><span>{x.date} · {x.symbol}</span><span className="pink">{fmtCCY(x.pnl, displayCcy)}</span></div>
              ))}
            </div>
            <div>
              <div className="pill">Positions &gt; 2%</div>
              {alertsPositions.length===0 && <div className="row-kv"><span>Aucune</span><span>-</span></div>}
              {alertsPositions.map(x=>(
                <div key={x.key} className="row-kv"><span>{x.day} · {x.symbol}</span><span className="pink">{fmtCCY(x.pnl, displayCcy)}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Centre d'alertes (clochette) */}
      {showAlertsPanel && (
        <div className="card" style={{padding:12}}>
          <h3>Centre d’alertes</h3>
          {alertsCount===0 ? <div className="row-kv"><span>Aucune alerte</span><span>—</span></div> : (
            <>
              {behaviorAlerts.map((a, i)=>(
                <div key={'ba'+i} className="row-kv" style={{border:'1px solid #3a3a3a'}}>
                  <span>
                    {a.type.includes('strategy') ? `Stratégie · ${a.strategy}` : a.type==='hour-loss' ? `Heure · ${a.bucket}` : `Jour · ${a.bucket}`}
                    <div style={{fontSize:12, color:'#bfc5c9'}}>{a.msg}</div>
                  </span>
                  <span style={{fontSize:12, color:'#bfc5c9'}}>{a.detail || ''}</span>
                </div>
              ))}
              {alertsTrades.map((x,i)=>(
                <div key={'tr'+i} className="row-kv"><span>Trade &gt; 1% — {x.date} · {x.symbol}</span><span className="pink">{fmtCCY(x.pnl, displayCcy)}</span></div>
              ))}
              {alertsPositions.map((x,i)=>(
                <div key={'po'+i} className="row-kv"><span>Position &gt; 2% — {x.day} · {x.symbol}</span><span className="pink">{fmtCCY(x.pnl, displayCcy)}</span></div>
              ))}

              <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                <button className="btn" onClick={()=>{
                  if (Notification && Notification.permission !== 'granted') {
                    Notification.requestPermission().then(p=>{
                      if(p==='granted'){ new Notification('ZooProjectVision — alertes', { body:'Résumé copié.' }) }
                    });
                  } else if (Notification && Notification.permission==='granted'){
                    new Notification('ZooProjectVision — alertes', { body:'Résumé copié.' })
                  }
                  navigator.clipboard.writeText(buildAlertSummaryText()).catch(()=>{});
                }}>copier le résumé</button>

                <a className="btn" target="_blank" rel="noreferrer"
                   href={`mailto:?subject=Alertes%20ZooProjectVision&body=${encodeURIComponent(buildAlertSummaryText())}`}>
                  envoyer par email
                </a>

                <button className="btn" onClick={async ()=>{
                  try{
                    const res = await fetch('/api/notify', {
                      method: 'POST',
                      headers: { 'Content-Type':'application/json' },
                      body: JSON.stringify({ channel:'whatsapp', message: buildAlertSummaryText() })
                    });
                    if(!res.ok) throw new Error('notify failed');
                    alert('Notification WhatsApp envoyée ✅');
                  }catch(e){ alert('WhatsApp indisponible (config requise).') }
                }}>envoyer sur WhatsApp</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Rapport mensuel */}
      <MonthlyReport equityFromTrades={equityFromTrades} tradesConverted={tradesConverted} displayCcy={displayCcy} />

      {/* Tableau de trades */}
      <div className="card table-wrap" style={{padding:'12px', marginTop:12}}>
        <h3 style={{marginBottom:8}}>Trades ({filteredTrades.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Heure ouv.</th><th>Compte</th><th>Broker</th><th>Stratégie</th><th>Symbole</th>
              <th>Sens</th><th>Qté</th><th>Prix</th><th>Frais</th><th>PnL ({displayCcy})</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.slice(0, 500).map(t=>{
              const pnlDisp = convert(t.pnl, t.instrument_ccy || 'USD', displayCcy);
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

      <div className="footer">© {new Date().getFullYear()} – ZooProjectVision (démo). Données démo — remplace par tes exports/API brokers.</div>

      {/* Modal “ajouter flux” */}
      {showFlowForm && (
        <div className="modal-overlay" onClick={()=>setShowFlowForm(false)}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Ajouter un flux</div>
              <button className="btn btn-ghost" onClick={()=>setShowFlowForm(false)}>fermer</button>
            </div>
            <form className="form-grid" onSubmit={submitFlowForm}>
              <label>
                <span>Type</span>
                <select value={flowForm.type} onChange={e=>setFlowForm(f=>({...f, type:e.target.value}))}>
                  {flowTypes.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label>
                <span>Date</span>
                <input type="date" value={flowForm.date} onChange={e=>setFlowForm(f=>({...f, date:e.target.value}))}/>
              </label>
              <label>
                <span>Devise</span>
                <select value={flowForm.ccy} onChange={e=>setFlowForm(f=>({...f, ccy:e.target.value}))}>
                  {DISPLAY_CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>
                <span>Montant</span>
                <input type="number" step="0.01" placeholder="ex: 250.00"
                       value={flowForm.amount} onChange={e=>setFlowForm(f=>({...f, amount:e.target.value}))}/>
              </label>
              <label className="full">
                <span>Note</span>
                <input type="text" placeholder="optionnel" value={flowForm.note}
                       onChange={e=>setFlowForm(f=>({...f, note:e.target.value}))}/>
              </label>
              <label>
                <span>Compte (opt.)</span>
                <select value={flowForm.account} onChange={e=>setFlowForm(f=>({...f, account:e.target.value}))}>
                  <option value="ALL">Global</option>
                  {accounts.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label>
                <span>Broker (opt.)</span>
                <select value={flowForm.broker} onChange={e=>setFlowForm(f=>({...f, broker:e.target.value}))}>
                  <option value="ALL">Global</option>
                  {brokers.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </label>
              <label>
                <span>Stratégie (opt.)</span>
                <select value={flowForm.strategy} onChange={e=>setFlowForm(f=>({...f, strategy:e.target.value}))}>
                  <option value="ALL">Global</option>
                  {strategies.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                <span>Actif (opt.)</span>
                <select value={flowForm.symbol} onChange={e=>setFlowForm(f=>({...f, symbol:e.target.value}))}>
                  <option value="ALL">Global</option>
                  {symbols.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={()=>setShowFlowForm(false)}>annuler</button>
                <button type="submit" className="btn">enregistrer</button>
              </div>
            </form>
            <div className="modal-hint">
              Astuce : <em>prop_fee</em>, <em>prop_payout</em>, <em>darwin_mgmt_fee</em>, <em>business_expense</em>, <em>deposit</em>, <em>withdrawal</em>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** ====== Petits composants ====== */
function TopFlopCard({ title, data, displayCcy }){
  return (
    <div className="card" style={{height:360}}>
      <h3>{title}</h3>
      <div className="two-cols">
        <div>
          <div className="pill">Top</div>
          {data.best.map(x=>(
            <div key={'b'+x.name} className="row-kv">
              <span>{x.name}</span><span className="turq">{fmtCCY(x.value, displayCcy)}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="pill">Flop</div>
          {data.worst.map(x=>(
            <div key={'w'+x.name} className="row-kv">
              <span>{x.name}</span><span className="pink">{fmtCCY(x.value, displayCcy)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Calendar({ monthDates, calYear, calMonth, returns, ddSeries }){
  const ddByDate = new Map(ddSeries.map(x=>[x.date, x.dd]));
  const retMap = new Map(returns.map(r=>[r.date, r.ret]));
  const first = new Date(calYear, calMonth, 1)
  const shift = (first.getDay()+6)%7
  const blanks = Array.from({length:shift}).map((_,i)=><div key={'b'+i}></div>)
  const cells = monthDates.map(dt=>{
    const ret = retMap.get(dt) ?? null
    const dd  = ddByDate.get(dt) ?? null
    const style = inlineStyle(colorForRet(ret))
    return (
      <div key={dt} style={{padding:'10px 8px', borderRadius:8, ...style}}>
        <div style={{fontSize:11, opacity:.9}}>{Number(dt.slice(8,10))}</div>
        <div style={{fontSize:12}} className={ret<0?'bad':'turq'}>{ret!=null ? `${(ret*100).toFixed(2)}%` : '—'}</div>
        <div style={{fontSize:11, opacity:.95}} className={dd<0?'bad':'turq'}>{dd!=null ? `${Math.abs(dd*100).toFixed(2)}%` : '—'}</div>
      </div>
    )
  })
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8}}>
      {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>(
        <div key={d} style={{textAlign:'center', color:'#c8cdd2', fontSize:12}}>{d}</div>
      ))}
      {[...blanks, ...cells]}
    </div>
  )
}

function MonthlyReport({ equityFromTrades, tradesConverted, displayCcy }){
  function dailyReturns(eq){ const r=[]; for(let i=1;i<eq.length;i++){ const p=eq[i-1].equity,c=eq[i].equity; r.push({date:eq[i].date, ret: p===0?0:(c-p)/p}) } return r }
  function maxDrawdown(eq){ let peak=-Infinity, m=0; for(const p of eq){ peak=Math.max(peak,p.equity); m=Math.min(m,(p.equity-peak)/peak) } return m }
  function sharpe(returns){ if(!returns.length) return 0; const a=returns.map(x=>x.ret); const avg=a.reduce((x,y)=>x+y,0)/a.length; const varc=a.reduce((s,v)=>s+Math.pow(v-avg,2),0)/(a.length||1); const vol=Math.sqrt(varc)*Math.sqrt(252); return vol===0?0:avg/vol }
  function profitFactor(tr){ const g=tr.filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0); const l=tr.filter(t=>t.pnl<0).reduce((s,t)=>s+Math.abs(t.pnl),0); return l===0?Infinity:g/l }
  function hitRatio(tr){ if(!tr.length) return 0; const w=tr.filter(t=>t.pnl>0).length; return 100*w/tr.length }

  const ymOf = (d)=> d?.slice(0,7);
  const currYM = ymOf(equityFromTrades.at(-1)?.date) || ymOf(new Date().toISOString());
  const prevYM = (()=>{ const [y,m]=currYM.split('-').map(Number); const d=new Date(y, m-2, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })();

  function monthMetrics(ym){
    const eq = equityFromTrades.filter(p=>p.date.startsWith(ym));
    const rets = dailyReturns(eq);
    const tr = tradesConverted.filter(t=> t.date.startsWith(ym));
    const pnl = tr.reduce((a,t)=>a+t.pnl_disp,0);
    return {
      ym,
      trades: tr.length,
      pnl,
      winRate: hitRatio(tr),
      profitFactor: profitFactor(tr),
      rr: (()=>{ const w=tr.filter(t=>t.pnl_disp>0).map(t=>t.pnl_disp); const l=tr.filter(t=>t.pnl_disp<0).map(t=>Math.abs(t.pnl_disp));
        const aw = w.length ? w.reduce((a,b)=>a+b,0)/w.length : 0; const al = l.length ? l.reduce((a,b)=>a+b,0)/l.length : 0; return al ? aw/al : 0 })(),
      sharpe: sharpe(rets),
      maxDD: maxDrawdown(eq),
      mtdPct: (eq.length>=2) ? (eq.at(-1).equity/eq[0].equity - 1) : 0
    }
  }

  const reportCurr = monthMetrics(currYM);
  const reportPrev = monthMetrics(prevYM);

  return (
    <div className="card" style={{padding:16}}>
      <h3>Rapport mensuel</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
        <div>
          <div style={{color:'#bfc5c9', fontSize:12}}>Mois courant ({reportCurr.ym})</div>
          <div style={{fontSize:12}}>Trades : {reportCurr.trades}</div>
          <div style={{fontSize:12}}>PnL : {fmtCCY(reportCurr.pnl, displayCcy)}</div>
          <div style={{fontSize:12}}>Win rate : {reportCurr.winRate.toFixed(2)}%</div>
          <div style={{fontSize:12}}>PF : {reportCurr.profitFactor.toFixed(2)}</div>
          <div style={{fontSize:12}}>RR : {reportCurr.rr.toFixed(2)}</div>
          <div style={{fontSize:12}}>Sharpe : {reportCurr.sharpe.toFixed(2)}</div>
          <div style={{fontSize:12}}>Max DD : {(reportCurr.maxDD*100).toFixed(2)}%</div>
          <div style={{fontSize:12}}>Perf mois : {(reportCurr.mtdPct*100).toFixed(2)}%</div>
        </div>
        <div>
          <div style={{color:'#bfc5c9', fontSize:12}}>Mois précédent ({reportPrev.ym})</div>
          <div style={{fontSize:12}}>Trades : {reportPrev.trades}</div>
          <div style={{fontSize:12}}>PnL : {fmtCCY(reportPrev.pnl, displayCcy)}</div>
          <div style={{fontSize:12}}>Win rate : {reportPrev.winRate.toFixed(2)}%</div>
          <div style={{fontSize:12}}>PF : {reportPrev.profitFactor.toFixed(2)}</div>
          <div style={{fontSize:12}}>RR : {reportPrev.rr.toFixed(2)}</div>
          <div style={{fontSize:12}}>Sharpe : {reportPrev.sharpe.toFixed(2)}</div>
          <div style={{fontSize:12}}>Max DD : {(reportPrev.maxDD*100).toFixed(2)}%</div>
          <div style={{fontSize:12}}>Perf mois : {(reportPrev.mtdPct*100).toFixed(2)}%</div>
        </div>
        <div>
          <div style={{color:'#bfc5c9', fontSize:12}}>Note</div>
          <div style={{fontSize:12}}>Tous les indicateurs suivent les filtres (sauf capital global).</div>
          <div style={{fontSize:12}}>Utilise le filtre “Actif” pour isoler XAUUSD, etc.</div>
          <div style={{fontSize:12}}>HWM/LWM calculés sur l’équité filtrée.</div>
        </div>
      </div>
    </div>
  )
}

/** CSV utils */
function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(h=>h.trim());
  return lines.map(line=>{
    const cols = line.split(',').map(c=>c.trim().replace(/^"|"$/g,''));
    const row = {}; headers.forEach((h,i)=> row[h] = cols[i] ?? '');
    return row;
  });
}
