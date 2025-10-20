import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

/** =========================
 *   Données démo — Forex & Indices CFD (volatilité + élevée)
 *   ========================= */
const symbolsFXCFD = ['EURUSD','GBPUSD','USDJPY','USDCHF','XAUUSD','DAX40','US30','US500','USTEC','USOIL'];
const brokersCFD  = ['ICMarkets','Pepperstone','Eightcap','InteractiveBrokers','MetaTrader5'];

function randBetween(min, max){ return min + Math.random()*(max-min) }
function pick(a){ return a[Math.floor(Math.random()*a.length)] }

// Équité simulée via rendements composés (volatilité quotidienne +/-3%, spikes +/-6%)
const startEquity = 100000;
const days = 260; // ~1 année de trading
const demoEquity = (() => {
  let e = startEquity;
  const out = [];
  for (let i = days; i >= 1; i--) {
    // rendements quotidiens typés trading CFD/FX
    let r = randBetween(-0.03, 0.03);       // -3% à +3%
    if (Math.random() < 0.05) r = randBetween(-0.06, 0.06); // spikes 5% de proba
    e = Math.max(2000, e * (1 + r));        // protège de l’équité négative
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString().slice(0,10), equity: Number(e.toFixed(2)), account_ccy: 'USD' });
  }
  return out;
})();

// Trades plus “violents” (PnL en USD) avec dispersion large
const demoTrades = Array.from({ length: 400 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*220));
  const side = Math.random()>0.5?'BUY':'SELL';
  const qty  = Math.round(randBetween(1, 5));
  const price= Number(randBetween(10, 250).toFixed(2));
  // PnL ondule fort : moyenne proche de 0, amplitude +/- 3k, parfois +/- 8k
  let pnl = (Math.random()-0.5) * randBetween(1500, 3000);
  if (Math.random() < 0.10) pnl = (Math.random()>0.5?1:-1) * randBetween(3000, 8000);
  pnl = Math.round(pnl*100)/100;

  return {
    trade_id: `T${10000+i}`,
    date: d.toISOString().slice(0,10),
    account: pick(['ACC-Alpha','ACC-Beta','ACC-Gamma']),
    broker: pick(brokersCFD),
    strategy: pick(['Breakout','MeanRevert','Swing','News','Scalp']),
    symbol: pick(symbolsFXCFD),
    instrument_ccy: 'USD',
    side, qty, price,
    fee: Number(randBetween(0.5, 3.0).toFixed(2)),
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
function sharpe(returns, rf=0){ if(!returns.length) return 0; const only=returns.map(x=>x.ret); const avg=only.reduce((a,b)=>a+b,0)/only.length; const excess=avg-rf/252; const variance=only.reduce((a,b)=>a+Math.pow(b-avg,2),0)/(only.length||1); const vol=Math.sqrt(variance)*Math.sqrt(252); return vol===0?0:excess/vol }
function sortino(returns, rf=0){ if(!returns.length) return 0; const only=returns.map(x=>x.ret); const avg=only.reduce((a,b)=>a+b,0)/only.length - rf/252; const downs=only.filter(r=>r<0); const downVar=downs.reduce((a,b)=>a+Math.pow(b,2),0)/(downs.length||1); const downDev=Math.sqrt(downVar)*Math.sqrt(252); return downDev===0?0:avg/downDev }
function profitFactor(tr){ const g=tr.filter(t=>t.pnl>0).reduce((a,t)=>a+t.pnl,0); const l=tr.filter(t=>t.pnl<0).reduce((a,t)=>a+Math.abs(t.pnl),0); return l===0?Infinity:g/l }
function hitRatio(tr){ if(!tr.length) return 0; const w=tr.filter(t=>t.pnl>0).length; return w/tr.length }
function fmtCCY(v, ccy='USD'){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:ccy, maximumFractionDigits:0}).format(v||0) }catch{ return (v??0).toLocaleString() } }
function pct(x){ return `${(x*100).toFixed(2)}%` }
function classNeg(v){ return v<0 ? 'bad' : '' }
function fmtShort(v){ if(Math.abs(v)>=1_000_000) return (v/1_000_000).toFixed(1)+'M'; if(Math.abs(v)>=1_000) return (v/1_000).toFixed(1)+'k'; return Math.round(v).toString() }

/** Conversion devises (démo locale) */
const DISPLAY_CURRENCIES = ['USD','EUR','CHF']
const fx = {
  USD: { USD:1,  EUR:0.93, CHF:0.88 },
  EUR: { USD:1/0.93, EUR:1, CHF:0.88/0.93 },
  CHF: { USD:1/0.88, EUR:0.93/0.88, CHF:1 }
}
function convertAmount(value, fromCcy='USD', toCcy='USD') {
  if (!value || fromCcy===toCcy) return value||0;
  return value * (fx[fromCcy]?.[toCcy] ?? 1);
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

/** Calendrier */
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
  if(ret == null) return 'background:#111317;border:1px solid #1a1a1a;';
  const mag = Math.min(1, Math.abs(ret)*10);
  if(ret >= 0) return `background: rgba(15,185,177,${0.08+0.25*mag}); border:1px solid rgba(15,185,177,.35);`;
  return `background: rgba(255,95,95,${0.10+0.25*mag}); border:1px solid rgba(255,95,95,.35);`;
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
 *   Composant principal
 *   ========================= */
export default function App(){
  const [equity] = useState(demoEquity)
  const [trades] = useState(demoTrades)

  // Filtres
  const [account, setAccount] = useState('ALL')
  const [broker, setBroker]   = useState('ALL')
  const [symbol, setSymbol]   = useState('ALL')
  const [strategy, setStrategy] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [minPnL, setMinPnL]     = useState(-1000)
  const [displayCcy, setDisplayCcy] = useState('USD')

  const accounts = useMemo(()=>Array.from(new Set(trades.map(t=>t.account))),[trades])
  const brokers  = useMemo(()=>Array.from(new Set(trades.map(t=>t.broker || ''))).filter(Boolean),[trades])
  const symbols  = useMemo(()=>Array.from(new Set(trades.map(t=>t.symbol))),[trades])
  const strategies = useMemo(()=>Array.from(new Set(trades.map(t=>t.strategy))),[trades])

  // Filtre trades
  const filteredTrades = useMemo(()=>trades.filter(t=>{
    if(account!=='ALL' && t.account!==account) return false
    if(broker!=='ALL' && t.broker!==broker) return false
    if(symbol!=='ALL' && t.symbol!==symbol) return false
    if(strategy!=='ALL' && t.strategy!==strategy) return false
    if(dateFrom && t.date < dateFrom) return false
    if(dateTo && t.date > dateTo) return false
    if(t.pnl < minPnL) return false
    return true
  }),[trades,account,broker,symbol,strategy,dateFrom,dateTo,minPnL])

  // Équité filtrée + conversion
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

  // Histogramme PnL
  const bins = 12
  const histogram = useMemo(()=>{
    const list = tradesConverted.map(t=>t.pnl_disp)
    if(!list.length) return []
    const min = Math.min(...list)
    const max = Math.max(...list)
    const step = (max-min)/bins || 1
    const arr = Array.from({length:bins}).map((_,i)=>({bin:String(Math.round(min+i*step)), count:0}))
    for(const v of list){
      const idx = Math.min(bins-1, Math.max(0, Math.floor((v-min)/step)))
      arr[idx].count += 1
    }
    return arr
  },[tradesConverted])

  // Win rate / RR / répartition actifs
  const winLoss = useMemo(()=>{
    const arr = tradesConverted.map(t=>t.pnl_disp);
    const wins = arr.filter(v=>v>0);
    const losses = arr.filter(v=>v<0);
    const wr = arr.length ? wins.length/arr.length : 0;
    const avgWin = wins.length ? wins.reduce((a,b)=>a+b,0)/wins.length : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a,b)=>a+b,0))/losses.length : 0;
    const rr = avgLoss ? avgWin/avgLoss : 0;
    return { wr, avgWin, avgLoss, rr, wins:wins.length, losses:losses.length };
  }, [tradesConverted])

  const assetSplit = useMemo(()=>{
    const m = new Map();
    filteredTrades.forEach(t => m.set(t.symbol, (m.get(t.symbol)||0)+1));
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [filteredTrades])

  const chartColors = ['#d4af37','#0fb9b1','#6aa6ff','#ff8a65','#c792ea','#7bd88f','#ffd166']

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
          <div className="tagline">Multi-comptes • Multi-brokers • Conversion {displayCcy} • Calendrier P&L</div>
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
          <label>Actif</label>
          <select value={symbol} onChange={e=>setSymbol(e.target.value)}>
            <option value="ALL">Tous</option>
            {symbols.map(s=>(<option key={s} value={s}>{s}</option>))}
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
        <div className="item" style={{gridColumn:'span 2'}}>
          <label>Filtre PnL minimum: <span className="tag">{minPnL}</span></label>
          <input type="range" min="-2000" max="1000" step="50" value={minPnL} onChange={e=>setMinPnL(Number(e.target.value))} />
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

      {/* Graphiques principaux */}
      <div className="grid">
        <div className="card chart-card">
          <h3>Courbe d'équité</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={equityFiltered} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v)=>fmtShort(v)} />
              <Tooltip formatter={(v)=>fmtCCY(v, displayCcy)} />
              <Legend />
              <Line type="monotone" dataKey="equity" dot={false} name="Équité" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Drawdown</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={ddSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v)=>`${(v*100).toFixed(0)}%`} />
              <Tooltip formatter={(v)=>`${(v*100).toFixed(2)}%`} />
              <Area type="monotone" dataKey="dd" name="DD" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Distribution du PnL (trades filtrés)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={histogram} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Nombre de trades" />
            </BarChart>
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
              <div key={d} style={{textAlign:'center', color:'#b9c2cf', fontSize:12}}>{d}</div>
            ))}
            {renderMonthGrid(calYear, calMonth, monthDates, calendarMap)}
          </div>
          <div style={{marginTop:8, color:'#b9c2cf', fontSize:12}}>
            <span style={{marginRight:12}}>🟩 gain</span>
            <span>🟥 perte</span>
          </div>
        </div>
      </div>

      {/* Mini-dash : Win Rate, RR, Répartition actifs */}
      <div className="grid">
        {/* Win Rate (donut) */}
        <div className="card chart-card" style={{height:320}}>
          <h3>Win Rate</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={[
                  { name:'Gagnants', value: winLoss.wins },
                  { name:'Perdants', value: winLoss.losses }
                ]}
                innerRadius={70}
                outerRadius={100}
                dataKey="value"
              >
                <Cell fill="#2dd4bf" />
                <Cell fill="#ff6b6b" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{textAlign:'center', marginTop:-12, fontWeight:700}}>
            {(winLoss.wr*100).toFixed(1)}%
          </div>
        </div>

        {/* Risk-Reward */}
        <div className="card chart-card" style={{height:320}}>
          <h3>Risk–Reward</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={[
              { name:'Gain moyen', value: winLoss.avgWin },
              { name:'Perte moyenne', value: -winLoss.avgLoss }
            ]} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v)=>fmtCCY(v, displayCcy)} />
              <Tooltip formatter={(v)=>fmtCCY(v, displayCcy)} />
              <Bar dataKey="value">
                <Cell fill="#2dd4bf" />
                <Cell fill="#ff6b6b" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{textAlign:'center', marginTop:-12}}>
            R:R ≈ <b>{winLoss.rr.toFixed(2)}</b>
          </div>
        </div>

        {/* Répartition des actifs */}
        <div className="card chart-card" style={{height:320}}>
          <h3>Répartition des actifs</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={assetSplit} dataKey="value" nameKey="name" outerRadius={100}>
                {assetSplit.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau de trades */}
      <div className="card table-wrap" style={{padding:'12px', marginTop:12}}>
        <h3 style={{marginBottom:8}}>Trades ({filteredTrades.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Compte</th><th>Broker</th><th>Stratégie</th><th>Symbole</th>
              <th>Sens</th><th>Qté</th><th>Prix</th><th>Frais</th><th>PnL ({displayCcy})</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.slice(0, 500).map(t=>{
              const pnlDisp = convertAmount(t.pnl, t.instrument_ccy || 'USD', displayCcy);
              return (
                <tr key={t.trade_id}>
                  <td>{t.date}</td>
                  <td>{t.account}</td>
                  <td>{t.broker || '-'}</td>
                  <td>{t.strategy}</td>
                  <td>{t.symbol}</td>
                  <td className={t.side==='BUY'?'':'bad'}>{t.side}</td>
                  <td>{t.qty}</td>
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

      <div className="footer">© {new Date().getFullYear()} – ZooProject Vision (démo). Remplace les données par ton API pour passer en production.</div>
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

/** ====== Rendu calendrier ====== */
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
      <div key={dt} title={`${dt}\nRet: ${ret!=null?(ret*100).toFixed(2)+'%':'-'}\nDD: ${dd!=null?(dd*100).toFixed(0)+'%':'-'}`}
           style={{padding:'10px 8px', borderRadius:8, ...inlineStyle(style)}}>
        <div style={{fontSize:11, opacity:.9}}>{Number(dt.slice(8,10))}</div>
        <div style={{fontSize:12, fontWeight:600}} className={ret<0?'bad':''}>
          {ret!=null ? `${(ret*100).toFixed(1)}%` : '—'}
        </div>
        <div style={{fontSize:11, opacity:.8}} className={dd<0?'bad':''}>
          {dd!=null ? `${(dd*100).toFixed(0)}%` : '—'}
        </div>
      </div>
    )
  })
  return [...blanks, ...cells]
}
