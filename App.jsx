import React, { useMemo, useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar, Legend } from 'recharts'

// ----- Données démo -----
const demoEquity = Array.from({ length: 180 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (180 - i));
  const base = 100000, drift = i * 7.5, noise = Math.sin(i/7)*400 + Math.random()*250 - 100;
  return { date: d.toISOString().slice(0,10), equity: Math.max(50000, Math.round(base + drift + noise)) }
})
const demoTrades = Array.from({ length: 220 }).map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random()*170));
  const side = Math.random()>0.5?'BUY':'SELL', qty = Math.round(Math.random()*5)+1, price = 50 + Math.random()*150;
  const pnl = Math.round((Math.random()-0.45)*600);
  const accounts = ['IB-001','MT5-Alpha','Binance-Spot']; const strategies=['Breakout','MeanRevert','Swing','Scalp']; const symbols=['AAPL','ES','EURUSD','BTCUSDT','DAX'];
  return { trade_id: `T${10000+i}`, date:d.toISOString().slice(0,10), account:pick(accounts), strategy:pick(strategies), symbol:pick(symbols), side, qty, price:Number(price.toFixed(2)), fee:Number((Math.random()*2).toFixed(2)), pnl, notes: Math.random()>0.9?'News spike':'' }
})
function pick(a){return a[Math.floor(Math.random()*a.length)]}

// ----- Helpers & métriques -----
function dailyReturns(eq){ const r=[]; for(let i=1;i<eq.length;i++){ const p=eq[i-1].equity,c=eq[i].equity; r.push(p===0?0:(c-p)/p)} return r }
function drawdownSeries(eq){ let peak=-Infinity; return eq.map(p=>{ peak=Math.max(peak,p.equity); const dd=(p.equity-peak)/peak; return {date:p.date, dd} }) }
function maxDrawdown(eq){ return Math.min(...drawdownSeries(eq).map(d=>d.dd)) }
function sharpe(returns, rf=0){ if(!returns.length) return 0; const avg=returns.reduce((a,b)=>a+b,0)/returns.length; const excess=avg-rf/252; const variance=returns.reduce((a,b)=>a+Math.pow(b-avg,2),0)/(returns.length||1); const vol=Math.sqrt(variance)*Math.sqrt(252); return vol===0?0:excess/vol }
function sortino(returns, rf=0){ if(!returns.length) return 0; const avg=returns.reduce((a,b)=>a+b,0)/returns.length - rf/252; const downs=returns.filter(r=>r<0); const downVar=downs.reduce((a,b)=>a+Math.pow(b,2),0)/(downs.length||1); const downDev=Math.sqrt(downVar)*Math.sqrt(252); return downDev===0?0:avg/downDev }
function profitFactor(tr){ const g=tr.filter(t=>t.pnl>0).reduce((a,t)=>a+t.pnl,0); const l=tr.filter(t=>t.pnl<0).reduce((a,t)=>a+Math.abs(t.pnl),0); return l===0?Infinity:g/l }
function hitRatio(tr){ if(!tr.length) return 0; const w=tr.filter(t=>t.pnl>0).length; return w/tr.length }
function fmtCCY(v, ccy='USD'){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:ccy}).format(v||0) }catch{ return (v??0).toLocaleString() } }

export default function App(){
  const [equity, setEquity] = useState(demoEquity)
  const [trades, setTrades] = useState(demoTrades)
  const [account, setAccount] = useState('ALL')
  const [strategy, setStrategy] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minPnL, setMinPnL] = useState(-1000)
  const accounts = useMemo(()=>Array.from(new Set(trades.map(t=>t.account))),[trades])
  const strategies = useMemo(()=>Array.from(new Set(trades.map(t=>t.strategy))),[trades])

  const filteredTrades = useMemo(()=>trades.filter(t=>{
    if(account!=='ALL' && t.account!==account) return false
    if(strategy!=='ALL' && t.strategy!==strategy) return false
    if(dateFrom && t.date < dateFrom) return false
    if(dateTo && t.date > dateTo) return false
    if(t.pnl < minPnL) return false
    return true
  }),[trades,account,strategy,dateFrom,dateTo,minPnL])

  const equityFiltered = useMemo(()=>equity.filter(p=>{
    if(dateFrom && p.date < dateFrom) return false
    if(dateTo && p.date > dateTo) return false
    return true
  }),[equity,dateFrom,dateTo])

  const returns = useMemo(()=>dailyReturns(equityFiltered),[equityFiltered])
  const kpi = useMemo(()=>{
    const mdd = maxDrawdown(equityFiltered)
    return {
      sharpe: sharpe(returns),
      sortino: sortino(returns),
      maxDD: mdd,
      profitFactor: profitFactor(filteredTrades),
      hitRatio: hitRatio(filteredTrades),
      totalPnL: filteredTrades.reduce((a,t)=>a+t.pnl,0),
      lastEquity: equityFiltered.at(-1)?.equity ?? 0,
    }
  },[returns,filteredTrades,equityFiltered])
  const ddSeries = useMemo(()=>drawdownSeries(equityFiltered),[equityFiltered])

  const [tab, setTab] = useState('equity')
  const [bins, setBins] = useState(12)
  const histogram = useMemo(()=>{
    if(!filteredTrades.length) return []
    const min = Math.min(...filteredTrades.map(t=>t.pnl))
    const max = Math.max(...filteredTrades.map(t=>t.pnl))
    const step = (max-min)/bins || 1
    const arr = Array.from({length:bins}).map((_,i)=>({bin:String(Math.round(min+i*step)), count:0}))
    for(const t of filteredTrades){
      const idx = Math.min(bins-1, Math.max(0, Math.floor((t.pnl-min)/step)))
      arr[idx].count += 1
    }
    return arr
  },[filteredTrades,bins])

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Tableau de bord – Résultats de Trading</h1>
          <div style={{color:'var(--muted)'}}>Démo prête à déployer. Vous pourrez brancher vos données plus tard.</div>
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
        <div className="item" style={{gridColumn:'span 2'}}>
          <label>Filtre PnL minimum: <span className="tag">{minPnL}</span></label>
          <input type="range" min="-2000" max="1000" step="50" value={minPnL} onChange={e=>setMinPnL(Number(e.target.value))} />
        </div>
      </div>

      {/* KPI */}
      <div className="kpi">
        <div className="card item"><h3>Valeur actuelle</h3><div className="val">{fmtCCY(kpi.lastEquity)}</div></div>
        <div className="card item"><h3>PnL filtré</h3><div className="val">{fmtCCY(kpi.totalPnL)}</div></div>
        <div className="card item"><h3>Sharpe</h3><div className="val">{kpi.sharpe.toFixed(2)}</div></div>
        <div className="card item"><h3>Sortino</h3><div className="val">{kpi.sortino.toFixed(2)}</div></div>
        <div className="card item"><h3>Max Drawdown</h3><div className="val">{(kpi.maxDD*100).toFixed(2)}%</div></div>
        <div className="card item"><h3>Profit Factor</h3><div className="val">{Number.isFinite(kpi.profitFactor)?kpi.profitFactor.toFixed(2):'∞'}</div></div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab==='equity'?'active':''}`} onClick={()=>setTab('equity')}>Équité</button>
        <button className={`tab ${tab==='drawdown'?'active':''}`} onClick={()=>setTab('drawdown')}>Drawdown</button>
        <button className={`tab ${tab==='dist'?'active':''}`} onClick={()=>setTab('dist')}>Distribution PnL</button>
      </div>

      {/* Charts */}
      {tab==='equity' && (
        <div className="card" style={{padding:'12px', height:360}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityFiltered} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v)=>fmtCCY(v)} />
              <Legend />
              <Line type="monotone" dataKey="equity" dot={false} name="Équité" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab==='drawdown' && (
        <div className="card" style={{padding:'12px', height:360}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ddSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v)=>`${(v*100).toFixed(0)}%`} />
              <Tooltip formatter={(v)=>`${(v*100).toFixed(2)}%`} />
              <Area type="monotone" dataKey="dd" name="Drawdown" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab==='dist' && (
        <div className="card" style={{padding:'12px', height:360}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Nombre de trades" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid">
        <div className="card table-wrap" style={{padding:'12px'}}>
          <h3 style={{marginBottom:8}}>Trades ({filteredTrades.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Compte</th><th>Stratégie</th><th>Symbole</th><th>Sens</th><th>Qté</th><th>Prix</th><th>Frais</th><th>PnL</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.slice(0, 300).map(t=>(
                <tr key={t.trade_id}>
                  <td>{t.date}</td>
                  <td>{t.account}</td>
                  <td>{t.strategy}</td>
                  <td>{t.symbol}</td>
                  <td>{t.side}</td>
                  <td>{t.qty}</td>
                  <td>{t.price.toFixed(2)}</td>
                  <td>{t.fee.toFixed(2)}</td>
                  <td className={t.pnl>=0?'good':'bad'}>{fmtCCY(t.pnl)}</td>
                  <td>{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="footer">© {new Date().getFullYear()} – Démo. Pour brancher vos données réelles, exposez des routes /equity et /trades (JSON).</div>
    </div>
  )
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
