import React, { useMemo, useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar, Legend } from 'recharts'

/** =========================
 *   Données démo (inchangées)
 *   ========================= */
const demoEquity = Array.from({ length: 220 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (220 - i));
  const base = 100000, drift = i * 8, noise = Math.sin(i/7)*400 + Math.random()*220 - 100;
  return { date: d.toISOString().slice(0,10), equity: Math.max(50000, Math.round(base + drift + noise)), account_ccy: 'USD' }
})
const demoTrades = Array.from({ length: 260 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*200));
  const side = Math.random()>0.5?'BUY':'SELL', qty = Math.round(Math.random()*5)+1, price = 50 + Math.random()*150;
  const pnl = Math.round((Math.random()-0.45)*600);
  const accounts = ['IB-001','MT5-Alpha','Binance-Spot']; 
  const strategies=['Breakout','MeanRevert','Swing','Scalp']; 
  const symbols=['XAUUSD','DAX','US30','US500','USTEC'];
  const brokers = ['InteractiveBrokers','MetaTrader5','Binance'];
  const instrument_ccy = ['USD','EUR','USD','USD','USD'][Math.floor(Math.random()*5)] || 'USD';
  return { 
    trade_id: `T${10000+i}`, 
    date: d.toISOString().slice(0,10), 
    account: pick(accounts), 
    broker: pick(brokers),
    strategy: pick(strategies), 
    symbol: pick(symbols),
    instrument_ccy,
    side, qty, price:Number(price.toFixed(2)), fee:Number((Math.random()*2).toFixed(2)), 
    pnl, notes: Math.random()>0.9?'News spike':'' 
  }
})
function pick(a){return a[Math.floor(Math.random()*a.length)]}

/** =========================
 *   Helpers & métriques
 *   ========================= */
function dailyReturns(eq){ const r=[]; for(let i=1;i<eq.length;i++){ const p=eq[i-1].equity,c=eq[i].equity; r.push({date:eq[i].date, ret: p===0?0:(c-p)/p}) } return r }
function drawdownSeries(eq){ let peak=-Infinity; return eq.map(p=>{ peak=Math.max(peak,p.equity); const dd=(p.equity-peak)/peak; return {date:p.date, dd} }) }
function maxDrawdown(eq){ return Math.min(...drawdownSeries(eq).map(d=>d.dd)) }
function sharpe(returns, rf=0){ if(!returns.length) return 0; const only = returns.map(x=>x.ret); const avg=only.reduce((a,b)=>a+b,0)/only.length; const excess=avg - rf/252; const variance=only.reduce((a,b)=>a+Math.pow(b-avg,2),0)/(only.length||1); const vol=Math.sqrt(variance)*Math.sqrt(252); return vol===0?0:excess/vol }
function sortino(returns, rf=0){ if(!returns.length) return 0; const only = returns.map(x=>x.ret); const avg=only.reduce((a,b)=>a+b,0)/only.length - rf/252; const downs=only.filter(r=>r<0); const downVar=downs.reduce((a,b)=>a+Math.pow(b,2),0)/(downs.length||1); const downDev=Math.sqrt(downVar)*Math.sqrt(252); return downDev===0?0:avg/downDev }
function profitFactor(tr){ const g=tr.filter(t=>t.pnl>0).reduce((a,t)=>a+t.pnl,0); const l=tr.filter(t=>t.pnl<0).reduce((a,t)=>a+Math.abs(t.pnl),0); return l===0?Infinity:g/l }
function hitRatio(tr){ if(!tr.length) return 0; const w=tr.filter(t=>t.pnl>0).length; return w/tr.length }
function fmtCCY(v, ccy='USD'){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:ccy, maximumFractionDigits:0}).format(v||0) }catch{ return (v??0).toLocaleString() } }
function pct(x){ return `${(x*100).toFixed(2)}%` }
function classNeg(v){ return v<0 ? 'bad' : '' }

/** Conversion devises (démo statique — remplace plus tard par /fx depuis ton backend) */
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
function groupByMonth(returns){ 
  const m = new Map();
  for(const r of returns){
    const ym = r.date.slice(0,7);
    if(!m.has(ym)) m.set(ym, []);
    m.get(ym).push(r.ret);
  }
  return Array.from(m.entries()).map(([ym, arr]) => ({ ym, ret: arr.reduce((a,b)=>a+(b||0),0) }));
}
function groupByYear(equity){
  const y = new Map(); // year -> {first,last}
  for(const p of equity){
    const yr = p.date.slice(0,4);
    if(!y.has(yr)) y.set(yr,{first:p.equity,last:p.equity});
    const v = y.get(yr);
    v.last = p.equity;
  }
  return Array.from(y.entries()).map(([yr, o]) => ({ year: yr, ret: (o.last/o.first - 1) }));
}
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
  // prend 252 jours de trading ~ 12m ; si peu de points, prend le premier
  const start = equity[Math.max(0, n-252)].equity;
  return end/start - 1;
}

/** Calendrier mensuel simple (heatmap) */
function monthDays(year, monthIndex){ // 0-based month
  const days = [];
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex+1, 0);
  for(let d=1; d<=end.getDate(); d++){
    const dt = new Date(year, monthIndex, d);
    days.push(dt.toISOString().slice(0,10));
  }
  return days;
}
function colorForRet(ret){
  if(ret == null) return 'background:#111317;border:1px solid #1a1a1a;';
  const mag = Math.min(1, Math.abs(ret)*10); // intensité
  if(ret >= 0) return `background: rgba(15,185,177,${0.08+0.25*mag}); border:1px solid rgba(15,185,177,.35);`;
  return `background: rgba(255,95,95,${0.10+0.25*mag}); border:1px solid rgba(255,95,95,.35);`;
}

/** =========================
 *   Composant principal
 *   ========================= */
export default function App(){
  const [equity, setEquity] = useState(demoEquity)
  const [trades, setTrades] = useState(demoTrades)

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

  // Applique filtres trades
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

  // Filtre l’équité par dates + conversion devise
  const equityFiltered = useMemo(()=>{
    const arr = equity.filter(p=>{
      if(dateFrom && p.date < dateFrom) return false
      if(dateTo && p.date > dateTo) return false
      return true
    }).map(p=>({
      date: p.date,
      equity: convertAmount(p.equity, p.account_ccy || 'USD', displayCcy),
      account_ccy: displayCcy
    }))
    return arr
  },[equity, dateFrom, dateTo, displayCcy])

  // KPI principaux
  const returns = useMemo(()=>dailyReturns(equityFiltered),[equityFiltered])
  const ddSeries = useMemo(()=>drawdownSeries(equityFiltered),[equityFiltered])

  const kpi = useMemo(()=>{
    const mdd = maxDrawdown(equityFiltered);
    const tradesConverted = filteredTrades.map(t=>({
      ...t, pnl_disp: convertAmount(t.pnl, t.instrument_ccy || 'USD', displayCcy)
    }))
    return {
      sharpe: sharpe(returns),
      sortino: sortino(returns),
      maxDD: mdd,
      profitFactor: profitFactor(tradesConverted),
      hitRatio: hitRatio(tradesConverted),
      totalPnL: tradesConverted.reduce((a,t)=>a+(t.pnl_disp||0),0),
      lastEquity: equityFiltered.at(-1)?.equity ?? 0,
    }
  },[returns, filteredTrades, equityFiltered, displayCcy])

  // Rentabilités période
  const lastDayRet = returns.at(-1)?.ret ?? 0
  const mtd = calcMTD(returns)
  const ytd = calcYTD(equityFiltered)
  const ann = calcLast12M(equityFiltered)

  // Histogramme PnL (affiché converti & couleurs négatives)
  const [bins, setBins] = useState(12)
  const histogram = useMemo(()=>{
    const list = filteredTrades.map(t=>convertAmount(t.pnl, t.instrument_ccy || 'USD', displayCcy))
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
  },[filteredTrades, bins, displayCcy])

  // Calendrier: map {date -> {ret, dd}}
  const calendarMap = useMemo(()=>{
    const map = new Map()
    const ddByDate = new Map(ddSeries.map(x=>[x.date, x.dd]))
    for(const r of returns){
      map.set(r.date, { ret: r.ret, dd: ddByDate.get(r.date) ?? null })
    }
    return map
  },[returns, ddSeries])

  // Mois affiché dans le calendrier (par défaut = dernier mois)
  const lastDate = equityFiltered.at(-1)?.date
  const [calYear, setCalYear] = useState(lastDate ? Number(lastDate.slice(0,4)) : new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(lastDate ? Number(lastDate.slice(5,7))-1 : new Date().getMonth()) // 0-based

  const monthDates = useMemo(()=>monthDays(calYear, calMonth),[calYear, calMonth])
  const monthLabel = useMemo(()=>{
    const dt = new Date(calYear, calMonth, 1)
    return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  },[calYear, calMonth])

  return (
    <div className="container">
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

      {/* KPIs (incl. rentabilités) */}
      <div className="kpi">
        <div className="card item"><h3>Valeur actuelle</h3><div className="val">{fmtCCY(kpi.lastEquity, displayCcy)}</div></div>
        <div className="card item"><h3>PnL (filtré)</h3><div className={`val ${classNeg(kpi.totalPnL)}`}>{fmtCCY(kpi.totalPnL, displayCcy)}</div></div>
        <div className="card item"><h3>Jour</h3><div className={`val ${classNeg(lastDayRet)}`}>{pct(lastDayRet)}</div></div>
        <div className="card item"><h3>MTD</h3><div className={`val ${classNeg(mtd)}`}>{pct(mtd)}</div></div>
        <div className="card item"><h3>YTD</h3><div className={`val ${classNeg(ytd)}`}>{pct(ytd)}</div></div>
        <div className="card item"><h3>Annuel (12m)</h3><div className={`val ${classNeg(ann)}`}>{pct(ann)}</div></div>
      </div>

      {/* Graphiques */}
      <div className="tabs">
        <button className="tab active">Équité</button>
        <button className="tab">Drawdown</button>
        <button className="tab">Distribution PnL</button>
      </div>

      <div className="grid">
        {/* Équité */}
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

        {/* Drawdown */}
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

        {/* Distribution PnL */}
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

        {/* Calendrier des rendements (mois courant sélectionné) */}
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

      {/* Tableau des trades */}
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

/** ====== Petites utilitaires d’affichage ====== */
function fmtShort(v){
  if(Math.abs(v)>=1_000_000) return (v/1_000_000).toFixed(1)+'M'
  if(Math.abs(v)>=1_000) return (v/1_000).toFixed(1)+'k'
  return Math.round(v).toString()
}
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

/** ====== Rendu calendrier (grille 7 colonnes) ====== */
function renderMonthGrid(year, monthIndex, monthDates, calendarMap){
  // Décaler le 1er jour sur Lundi (locale EU)
  const first = new Date(year, monthIndex, 1)
  const shift = (first.getDay()+6)%7 // 0=lundi
  const blanks = Array.from({length:shift}).map((_,i)=><div key={'b'+i}></div>)
  const cells = monthDates.map(dt=>{
    const info = calendarMap.get(dt) || null
    const ret = info?.ret ?? null
    const dd = info?.dd ?? null
    const style = colorForRet(ret)
    return (
      <div key={dt} title={`${dt}\nRet: ${ret!=null?pct(ret):'-'}\nDD: ${dd!=null?pct(dd):'-'}`} 
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
