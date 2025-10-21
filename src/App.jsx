import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LabelList
} from 'recharts'

/** =========================
 *   Données démo — Forex & Indices CFD (volatilité élevée)
 *   ========================= */
const symbolsFXCFD = ['EURUSD','GBPUSD','USDJPY','USDCHF','XAUUSD','DAX40','US30','US500','USTEC','USOIL'];
const brokersCFD  = ['ICMarkets','Pepperstone','Eightcap','InteractiveBrokers','MetaTrader5'];
const strategiesAll = ['Breakout','MeanRevert','Swing','News','Scalp']

function randBetween(min, max){ return min + Math.random()*(max-min) }
function pick(a){ return a[Math.floor(Math.random()*a.length)] }
function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)) }
function fmtPct(x){ return `${((x||0)*100).toFixed(2)}%` }
function classNeg(v){ return v<0 ? 'pink' : 'turq' }

/* === Helpers & Formats === */

// --- Win Rate Card (AJOUT) ---
function WinRateCard({ trades }){
  const stats = React.useMemo(()=>{
    let wins=0, losses=0, total=0;
    trades.forEach(t=>{
      const pnl = Number(t.pnl)||0;
      if (pnl>0) wins++;
      else if (pnl<0) losses++;
      total++;
    });
    const rate = total ? wins/total : 0;
    return {wins, losses, total, rate};
  },[trades]);
  return (
    <div className="card" style={{height:140, display:'flex', flexDirection:'column'}}>
      <h3>win rate</h3>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
        <div style={{fontSize:28, color:'var(--text)'}}>{(stats.rate*100).toFixed(0)}%</div>
        <div style={{fontSize:12, color:'var(--muted)'}}>gagnés: {stats.wins} · perdus: {stats.losses}</div>
      </div>
    </div>
  );
}

/** =========================
 *   Equity démo (synthétique)
 *   ========================= */
const demoEquity = (() => {
  const days = 220;
  const out = [];
  let e = 10000;
  for (let i=0;i<days;i++){
    const r = (Math.random()-0.5) * 0.06; // ±3% env
    e = Math.max(2000, e * (1 + r));
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0,10), equity: Number(e.toFixed(2)) });
  }
  return out.reverse();
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
  if (Math.random() < 0.12) pnl = (Math.random()-0.5) * randBetween(3000, 9000);
  pnl = Number(pnl.toFixed(2));
  const symbol = pick(symbolsFXCFD);
  return {
    trade_id: `T${i+1}`,
    date: d.toISOString().slice(0,10),
    open_time: new Date(d.getFullYear(), d.getMonth(), d.getDate(), openHour).toISOString(),
    side, qty, price, pnl,
    symbol,
    instrument_ccy: 'USD',
    broker: pick(brokersCFD),
    strategy: pick(strategiesAll),
  };
});

/** =========================
 *   Composant principal
 *   ========================= */
export default function App(){
  const [account, setAccount] = useState('ALL')
  const [broker, setBroker]   = useState('ALL')
  const [strategy, setStrategy] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  // Options de filtres (déduites des données)
  const accounts = useMemo(()=>['ALL','ACC-Alpha','ACC-Beta','ACC-Gamma'],[])
  const brokers  = useMemo(()=>['ALL', ...Array.from(new Set(demoTrades.map(t=>t.broker || ''))).filter(Boolean)],[ ])
  const strategies = useMemo(()=>['ALL', ...Array.from(new Set(demoTrades.map(t=>t.strategy)))],[ ])

  // === FX live (exchangerate.host) avec cache local 24h ===
  const [liveFx, setLiveFx] = useState(null)
  useEffect(() => {
    const cached = localStorage.getItem('fx_usd_eur_chf');
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
        setLiveFx(rates);
        localStorage.setItem('fx_usd_eur_chf', JSON.stringify({ at: now, rates }));
      })
      .catch(()=>{ /* silencieux en démo */ });
  },[])

  const convert = useCallback((amount, from='USD', to='USD')=>{
    if (!liveFx || from===to) return amount||0;
    const r = liveFx[from]?.[to];
    return r ? (amount||0) * r : amount||0;
  },[liveFx])

  // Filtrage principal
  const tradesSource = demoTrades; // remplace par feed réel
  const filteredTrades = useMemo(()=> tradesSource.filter(t=>{
    if(account!=='ALL' && (t.account||'')!==account) return false
    if(broker!=='ALL' && t.broker!==broker) return false
    if(strategy!=='ALL' && t.strategy!==strategy) return false
    if(dateFrom && t.date < dateFrom) return false
    if(dateTo && t.date > dateTo) return false
    return true
  }),[tradesSource,account,broker,strategy,dateFrom,dateTo])

  // Equity filtrée + conversion (courbe globale)
  const equityBase = useMemo(()=>{
    const startConverted = convert(demoEquity[0].equity,'USD','USD')
    return demoEquity.map((d)=>({
      date: d.date,
      equity: convert(d.equity,'USD','USD') - startConverted + 10000
    }))
  },[convert])

  // Répartition par ACTIF (≥X% majors, <X% regroupés)
  const [minShare, setMinShare] = useState(10) // seuil % regroupement
  const assetSplitRaw = useMemo(()=>{
    const m=new Map();
    filteredTrades.forEach(t=>{
      const key = t.symbol || 'UNKNOWN';
      const val = m.get(key) || 0;
      m.set(key, val + Math.abs(convert(t.pnl, t.instrument_ccy||'USD','USD')));
    })
    const arr = Array.from(m, ([name,value])=>({name,value}));
    const total = arr.reduce((s,a)=>s+a.value,0) || 1;
    return arr.map(a=>({ ...a, share: a.value/total }));
  },[filteredTrades,convert])
  const { major: majorSeries, othersLabel } = useMemo(()=>{
    const label = `Autres (<${minShare}%)`
    const major = []
    let other=0
    for(const a of assetSplitRaw){
      if (a.share*100 >= minShare) major.push({name:a.name, value:a.share})
      else other += a.share
    }
    if (other>0) major.push({name:label, value:other})
    return { major, othersLabel: label }
  },[assetSplitRaw,minShare])
  const assetSplit = majorSeries;

  // Répartition par STRATÉGIE
  const strategySplit = useMemo(()=>{
    const m=new Map();
    filteredTrades.forEach(t=>m.set(t.strategy,(m.get(t.strategy)||0) + Math.abs(convert(t.pnl,t.instrument_ccy||'USD','USD'))))
    const arr = Array.from(m, ([name,value])=>({name,value}))
    const total = arr.reduce((s,a)=>s+a.value,0) || 1
    return arr.map(a=>({ name:a.name, value:a.value/total })).sort((a,b)=>b.value-a.value)
  },[filteredTrades,convert])

  // Top/Flop du mois courant (actifs/stratégies)
  const now = new Date()
  const monthKey = now.toISOString().slice(0,7) // YYYY-MM
  const monthTrades = useMemo(()=>filteredTrades.filter(t => (t.date||'').startsWith(monthKey)),[filteredTrades, monthKey])
  const topFlop = (rows, key) => {
    const m=new Map();
    rows.forEach(t=>{
      const k = key==='strategy'? t.strategy : t.symbol;
      m.set(k,(m.get(k)||0) + convert(t.pnl,t.instrument_ccy||'USD','USD'));
    })
    const arr = Array.from(m, ([name,pnl])=>({name,pnl}))
    arr.sort((a,b)=>b.pnl-a.pnl)
    return {
      top: arr.slice(0,5),
      flop: [...arr].reverse().slice(0,5)
    }
  }
  const tfAssets = useMemo(()=>topFlop(monthTrades,'symbol'),[monthTrades])
  const tfStrats  = useMemo(()=>topFlop(monthTrades,'strategy'),[monthTrades])

  // Gains/pertes par HEURE d'ouverture
  const pnlByHour = useMemo(()=>{
    const m=new Map();
    filteredTrades.forEach(t=>{
      const h = t.open_time
        ? new Date(t.open_time).toISOString().slice(11,13)+':00'
        : new Date(`${t.date}T00:00:00Z`).toISOString().slice(11,13)+':00';
      m.set(h,(m.get(h)||0) + convert(t.pnl, t.instrument_ccy||'USD','USD'));
    })
    return Array.from({length:24}).map((_,h)=>{
      const key = String(h).padStart(2,'0')+':00'
      return { hour:key, pnl: Number((m.get(key)||0).toFixed(2)) }
    })
  },[filteredTrades,convert])

  // Alertes risque (trades >1% equity, positions >2% equity) — DÉMO
  const capitalNow = equityBase[equityBase.length-1].equity
  const onePct = capitalNow * 0.01;
  const twoPct = capitalNow * 0.02;

  const alertsTrades = useMemo(()=>{
    return filteredTrades
      .filter(t => Math.abs(convert(t.pnl, t.instrument_ccy||'USD','USD')) > onePct)
      .map(t => ({ id:t.trade_id, symbol:t.symbol, pnl:convert(t.pnl,'USD','USD'), date:t.date }))
  },[filteredTrades, onePct, convert])

  const alertsPositions = useMemo(()=>{
    // démo: on génère des positions synthétiques
    const m = new Map();
    filteredTrades.forEach(t=>{
      const key = `${t.symbol}__${t.strategy}`
      const prev = m.get(key) || { key, symbol:t.symbol, strategy:t.strategy, pnl:0, date: t.date }
      prev.pnl += convert(t.pnl, t.instrument_ccy||'USD','USD')
      prev.date = t.date
      m.set(key, prev)
    })
    return Array.from(m.values()).filter(x=>Math.abs(x.pnl)>twoPct)
  },[filteredTrades, twoPct, convert])

  // >>> AJOUT : filtrer les alertes sur le MOIS EN COURS uniquement
  const alertsTradesThisMonth = alertsTrades.filter(x => (x.date||'').startsWith(monthKey));
  const alertsPositionsThisMonth = alertsPositions.filter(x => (x.date||'').startsWith(monthKey));

  // UI helpers
  const fmtCCY = (v, ccy='USD') => new Intl.NumberFormat('fr-CH',{ style:'currency', currency: ccy }).format(v)

  // Export CSV (démo)
  const downloadCSV = (rows, name) => {
    const keys = Object.keys(rows[0]||{});
    const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${name}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>tradelio – gestion trading</h1>
          <div className="tagline">dashboard démo — remplace les données par tes flux réels</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={()=>window.location.reload()}>rafraîchir</button>
          <button className="btn" onClick={()=>downloadCSV(filteredTrades,'trades-filtrés')}>export csv</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="controls">
        <div className="control">
          <label>compte</label>
          <select value={account} onChange={e=>setAccount(e.target.value)}>
            {accounts.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="control">
          <label>broker</label>
          <select value={broker} onChange={e=>setBroker(e.target.value)}>
            {brokers.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="control">
          <label>stratégie</label>
          <select value={strategy} onChange={e=>setStrategy(e.target.value)}>
            <option value="ALL">toutes</option>
            {strategies.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="control">
          <label>du</label>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
        </div>
        <div className="control">
          <label>au</label>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
        </div>
        <div className="control">
          <label>seuil actifs (≥%)</label>
          <select value={minShare} onChange={e=>setMinShare(Number(e.target.value))}>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
          </select>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi">
        <div className="item">
          <h3>capital</h3>
          <div className="val">{fmtCCY(equityBase[equityBase.length-1].equity,'USD')}</div>
          <div className="sub">équity actuelle</div>
        </div>
        <div className="item">
          <h3>pnl mois</h3>
          <div className="val">
            {fmtCCY(monthTrades.reduce((s,t)=>s+convert(t.pnl,t.instrument_ccy||'USD','USD'),0),'USD')}
          </div>
          <div className="sub">mois en cours</div>
        </div>
        <div className="item">
          <h3>pnl total</h3>
          <div className="val">
            {fmtCCY(filteredTrades.reduce((s,t)=>s+convert(t.pnl,t.instrument_ccy||'USD','USD'),0),'USD')}
          </div>
          <div className="sub">depuis le début</div>
        </div>

        {/* AJOUT: Win Rate */}
        <div className="item" style={{gridColumn:'span 2'}}>
          <WinRateCard trades={filteredTrades} />
        </div>
      </div>

      {/* Equity */}
      <div className="grid">
        <div className="card chart-card chart-xl">
          <h3>courbe d’équity</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={equityBase}>
              <CartesianGrid stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#bfc5c9' }} tickMargin={8} />
              <YAxis tick={{ fill: '#bfc5c9' }} tickMargin={8} />
              <Tooltip />
              <Line type="monotone" dataKey="equity" stroke="#20e3d6" strokeWidth={1.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition actifs (avec % AJOUTés) */}
        <div className="card chart-card">
          <h3>répartition par actifs</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={assetSplit} dataKey="value" nameKey="name" outerRadius={100}>
                <LabelList position="outside" formatter={(v)=> (v*100).toFixed(0)+'%'} />
                {assetSplit.map((s, i) => {
                  const palette = ['#dfe3e6','#20e3d6','#6aa6ff','#ff8a65','#c79bd6','#ffd166','#06d6a0','#ef476f','#8ecae6','#adb5bd'];
                  return <Cell key={i} fill={palette[i % palette.length]} />;
                })}
              </Pie>
              <Tooltip formatter={(val, name) => [fmtPct(val), name]} />
              <Legend verticalAlign="bottom" height={24} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition stratégies (avec % AJOUTés) */}
        <div className="card chart-card">
          <h3>répartition par stratégies</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={strategySplit} dataKey="value" nameKey="name" outerRadius={100}>
                <LabelList position="outside" formatter={(v)=> (v*100).toFixed(0)+'%'} />
                {strategySplit.map((s, i) => {
                  const palette = ['#20e3d6','#dfe3e6','#6aa6ff','#c79bd6','#ffd166','#06d6a0','#ef476f','#8ecae6','#adb5bd','#ff8a65'];
                  return <Cell key={i} fill={palette[i % palette.length]} />;
                })}
              </Pie>
              <Tooltip formatter={(val, name) => [fmtPct(val), name]} />
              <Legend verticalAlign="bottom" height={24} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top / Flop du mois */}
      <div className="grid">
        <div className="card chart-card" style={{height:360}}>
          <h3>top / flop du mois – actifs ({monthKey})</h3>
          <div className="two-cols">
            <div>
              {tfAssets.top.map(x=>(
                <div key={x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className={x.pnl<0?'pink':'turq'}>{fmtCCY(x.pnl,'USD')}</b>
                </div>
              ))}
            </div>
            <div>
              {tfAssets.flop.map(x=>(
                <div key={x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className="pink">{fmtCCY(x.pnl,'USD')}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card chart-card" style={{height:360}}>
          <h3>top / flop du mois – stratégies ({monthKey})</h3>
          <div className="two-cols">
            <div>
              {tfStrats.top.map(x=>(
                <div key={x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className={x.pnl<0?'pink':'turq'}>{fmtCCY(x.pnl,'USD')}</b>
                </div>
              ))}
            </div>
            <div>
              {tfStrats.flop.map(x=>(
                <div key={x.name} className="row-kv">
                  <span>{x.name}</span>
                  <b className="pink">{fmtCCY(x.pnl,'USD')}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PnL par heure d'ouverture */}
        <div className="card chart-card">
          <h3>gain / perte par heure</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={pnlByHour}>
              <CartesianGrid stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#bfc5c9' }} tickMargin={8} />
              <YAxis tick={{ fill: '#bfc5c9' }} tickMargin={8} />
              <Tooltip formatter={(v)=>[fmtCCY(v,'USD'),'PNL']} />
              <Bar dataKey="pnl">
                {pnlByHour.map((d,i)=><Cell key={i} fill={d.pnl>=0?'#20e3d6':'#ff5fa2'} />)}
                <LabelList dataKey="pnl" position="top" formatter={(v)=> (v>=0?'+':'')+Number(v).toFixed(0)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertes risque — MOIS EN COURS UNIQUEMENT */}
      <div className="grid">
        <div className="card" style={{height:320, overflow:'auto'}}>
          <h3>alertes risque – trades (mois en cours)</h3>
          <div className="pill">trades &gt; 1%</div>
          {alertsTradesThisMonth.length===0 && <div className="row-kv"><span>aucune</span></div>}
          {alertsTradesThisMonth.map(x=>(
            <div key={x.id} className="row-kv">
              <span>{x.date} · {x.symbol}</span>
              <b className="pink">{fmtCCY(x.pnl, 'USD')}</b>
            </div>
          ))}
        </div>

        <div className="card" style={{height:320, overflow:'auto'}}>
          <h3>alertes risque – positions (mois en cours)</h3>
          <div className="pill">positions &gt; 2%</div>
          {alertsPositionsThisMonth.length===0 && <div className="row-kv"><span>aucune</span></div>}
          {alertsPositionsThisMonth.map(x=>(
            <div key={x.key} className="row-kv">
              <span>{x.date} · {x.symbol} · {x.strategy}</span>
              <b className="pink">{fmtCCY(x.pnl, 'USD')}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">© {new Date().getFullYear()} – ZooProjectVision (démo). données démo — remplace par ton feed.</div>
    </div>
  )
}

