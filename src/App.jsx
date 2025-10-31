import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Scatter, ComposedChart
} from 'recharts'

import { dict, LOCALES } from './i18n'
import { APP_VERSION } from './version'

/* ===== i18n: valeurs par défaut + merge ===== */
const I18N_DEFAULTS = {
  brand: "ZooProjectVision",
  subtitle_default: "Tableau de bord multi-actifs, multi-brokers, multi-stratégies.",
  actions: {
    Help: "Aide",
    Import_csv: "Importer CSV",
    Add_Flow: "Ajouter un Flux",
    Third_Capital: "Capital Tiers",
    Recap: "Récap",
    Reset: "Réinitialiser",
    About: "À Propos",
  },
  filters: {
    Asset: "Actif",
    Broker: "Broker",
    Strategy: "Stratégie",
    From: "Du",
    To: "Au",
    All: "All",
  },
  kpis: {
    Capital_Initial: "Capital Initial",
    Cashflow: "Cashflow",
    Pnl_Filtered: "PnL (Filtré)",
    Capital_Total: "Capital Total",
    Return_pct: "Rentabilité",
    Maxdd_pct: "Max DD (%)",
    Maxdd_Abs: "Max DD (Abs.)",
    Active_Days: "Jours Actifs",
    Third_Capital: "Capital Tiers",
  },
};

/** Fusion profonde (b simple écrase a, objets fusionnés, tableaux remplacés) */
function deepMerge(a, b) {
  if (b == null) return a;
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== "object" || typeof b !== "object") return b ?? a;
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = deepMerge(a[k], b[k]);
  return out;
}

/* ===== Couleurs / helpers ===== */
const C = {
  axis:"#c9cdd1", white:"#ffffff", green:"#20e3d6", pink:"#ff5fa2", orange:"#ffb347", blue:"#4da3ff"
}
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0
const std = a => { if(!a.length) return 0; const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)*(x-m)))) }
const downsideStd = a => { if(!a.length) return 0; const m=mean(a); const n=a.filter(x=>x<m); if(!n.length) return 0; return Math.sqrt(mean(n.map(x=>(x-m)*(x-m)))) }
const sum = a => a.reduce((s,x)=>s+x,0)
const styleNum = v => ({ color: (Number(v) < 0 ? 'var(--pink)' : 'var(--text)') })

function HelpTooltip({ text }) {
  return (
    <span
      className="help-tooltip"
      title={text}
      aria-label="Aide"
      style={{
        display:'inline-flex',
        alignItems:'center',
        justifyContent:'center',
        width:18, height:18,
        border:'1px solid var(--border)',
        borderRadius:'50%',
        fontSize:12,
        cursor:'help',
        marginLeft:6,
        opacity:.9
      }}
    >
      ?
    </span>
  )
}

/* ===== CSV utils (MQL4/MQL5 exports) ===== */
function parseCSV(text){
  const lines=String(text||'').trim().split(/\r?\n/); if(!lines.length) return []
  const headers=lines.shift().split(',').map(h=>h.trim().replace(/^"|"$/g,''))
  const rows=[]
  for(const line of lines){
    const cols=line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)||[]
    const obj={}
    headers.forEach((h,i)=> obj[h]=(cols[i]||'').replace(/^"|"$/g,''))
    rows.push(obj)
  }
  return rows
}
function mapMT5Rows(rows){
  return rows.map((r)=>{
    const date   = (r['Time'] || r['Open time'] || r['Open Time'] || r['Date'] || '').slice(0,10)
    const asset  = r['Symbol'] || r['Instrument'] || r['Symbol name'] || 'UNKNOWN'
    const broker = r['Broker'] || 'Unknown'
    const strategy = r['Strategy'] || 'Unknown'
    const pnl = Number(r['Profit'] || r['PnL'] || r['PL'] || r['Net P/L'] || 0)
    const mfe = Number(r['MFE'] || r['MFE Profit'] || r['Max Favorable Excursion'] || 0)
    const mae = Number(r['MAE'] || r['MAE Profit'] || r['Max Adverse Excursion'] || 0)

    return {
      date,
      asset,
      broker,
      strategy,
      pnl: Number((pnl || 0).toFixed(2)),
      ccy: 'USD',
      mfe: Number((Math.abs(mfe) || 0).toFixed(2)),
      mae: Number((Math.abs(mae) || 0).toFixed(2)),
    }
  }).filter(r => r.date)
}

/* ===== Démo 90 jours (Darwinex + Axi Select) ===== */
function genDemoTrades(){
  const ASSETS=["XAUUSD","DAX","US500","USTEC","US30"]
  const BROKERS=["Darwinex","Axi Select"]
  const STRATS=["Breakout","MeanRevert","Momentum"]
  const rows=[], today=new Date()
  for(let i=90;i>=1;i--){
    const d=new Date(today); d.setDate(d.getDate()-i)
    const date=d.toISOString().slice(0,10)
    for(let k=0;k<5;k++){
      const asset=ASSETS[(i+k)%ASSETS.length]
      const broker=BROKERS[(i+k*2)%BROKERS.length]
      const strategy=STRATS[(i+k*3)%STRATS.length]
      let pnl=(Math.random()-0.5)*(Math.random()<0.15?2600:900); pnl=Number(pnl.toFixed(2))
      const mfe=Number((Math.abs(pnl)*(0.8+Math.random()*0.8)).toFixed(2))
      const mae=Number((Math.abs(pnl)*(0.6+Math.random()*0.8)).toFixed(2))
      rows.push({ date, asset, broker, strategy, pnl, ccy:'USD', mfe, mae })
    }
  }
  return rows
}

/* ===== Modale générique ===== */

function AboutModal({ openHook }) {
  const [open, setOpen] = openHook || [false, () => {}];
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="À Propos">
      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
        <div className="kpi-title">ZooProjectVision</div>
        <div style={{ marginTop: 6 }}>
          <div>Version : <b>V{APP_VERSION}</b></div>
          <div style={{ opacity: .85, marginTop: 6 }}>
            Consulte le changelog pour les nouveautés et correctifs.
          </div>
          <div style={{ marginTop: 10 }}>
            <a
              href="/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost sm"
            >
              Ouvrir le changelog
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ open, onClose, title, actions, children, inline=false }){
  if(!open) return null
  if (inline) {
    return (
      <div className="modal-card" style={{ marginTop: 8 }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div className="kpi-title" style={{fontSize:16}}>{title}</div>
          <div style={{display:'flex',gap:8}}>
            {actions}
            <button className="btn ghost sm" onClick={onClose}>fermer</button>
          </div>
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div className="kpi-title" style={{fontSize:16}}>{title}</div>
          <div style={{display:'flex',gap:8}}>
            {actions}
            <button className="btn ghost sm" onClick={onClose}>fermer</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ===== Guide ===== */
function GuidePanel({ lang }){
  const [open,setOpen]=React.useState(false)
  const [data,setData]=React.useState(null)
  React.useEffect(()=>{
    let alive=true
    const url = lang==='en'?'/guide.en.json':lang==='es'?'/guide.es.json':'/guide.fr.json'
    fetch(url)
      .then(r=>r.json())
      .then(j=>{ if(alive) setData(j) })
      .catch(()=>setData(null))
    return ()=>{alive=false}
  },[lang])
  return (
    <>
      <button className="btn ghost" onClick={()=>setOpen(true)}>
  {(dict[lang]?.actions?.Help) || I18N_DEFAULTS.actions.Help}
</button>
      <Modal open={open} onClose={()=>setOpen(false)} title={data?.title||'Aide & Guide'}>
        <div style={{color:'var(--text)',fontSize:12,lineHeight:1.6}}>
          {data?.intro && <p>{data.intro}</p>}
          {(data?.sections||[]).map((sec,i)=>(
            <details key={i} className="card tinted" style={{margin:'8px 0'}}>
              <summary className="kpi-title" style={{cursor:'pointer'}}>{sec.title}</summary>
              <div style={{paddingTop:6}}>
                {Array.isArray(sec.points)?(
                  <ul style={{margin:'6px 0 0 18px'}}>
                    {sec.points.map((p,idx)=><li key={idx} style={{margin:'4px 0'}}>{p}</li>)}
                  </ul>
                ):<p style={{margin:0}}>{sec.content}</p>}
              </div>
            </details>
          ))}
        </div>
      </Modal>
    </>
  )
}

/* ===== Flux : ajout ===== */
function FlowModal({ openHook, onSave, ccy, inline=false }){
  const [open,setOpen]=openHook||[false,()=>{}]
  const [flow,setFlow]=React.useState({
    date:new Date().toISOString().slice(0,10),
    type:'deposit',
    amount:'',
    ccy,
    note:''
  })
  const types=[
    {value:'deposit',label:'dépôt'},
    {value:'withdrawal',label:'retrait'},
    {value:'prop_payout',label:'payout prop'},
    {value:'prop_fee',label:'frais challenge prop'},
    {value:'darwin_mgmt_fee',label:'darwinex – management fee'},
    {value:'business_expense',label:'charge business'},
    {value:'other_income',label:'autre revenu'}
  ]
  const submit=e=>{
    e.preventDefault()
    const amt=Number(flow.amount)
    if(!flow.date||!flow.type||!Number.isFinite(amt)){
      alert('date/type/montant requis'); return
    }
    onSave?.({ ...flow, amount:amt })
    setOpen(false)
    setFlow({
      date:new Date().toISOString().slice(0,10),
      type:'deposit',
      amount:'',
      ccy,
      note:''
    })
  }
  return (
    <Modal open={open} onClose={()=>setOpen(false)} title="Ajouter un flux" inline={inline}>
      <form onSubmit={submit} style={{display:'grid',gap:10,gridTemplateColumns:'repeat(2,1fr)'}}>
        <label className="form-label"><span>type</span>
          <select className="sel" value={flow.type} onChange={e=>setFlow(f=>({...f,type:e.target.value}))}>
            {types.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="form-label"><span>date</span>
          <input className="sel" type="date" value={flow.date} onChange={e=>setFlow(f=>({...f,date:e.target.value}))}/>
        </label>
        <label className="form-label"><span>devise</span>
          <select className="sel" value={flow.ccy} onChange={e=>setFlow(f=>({...f,ccy:e.target.value}))}>
            {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="form-label"><span>montant</span>
          <input className="sel" type="number" step="0.01" value={flow.amount} onChange={e=>setFlow(f=>({...f,amount:e.target.value}))}/>
        </label>
        <label className="form-label" style={{gridColumn:'1 / -1'}}><span>note</span>
          <input className="sel" placeholder="optionnel" value={flow.note} onChange={e=>setFlow(f=>({...f,note:e.target.value}))}/>
        </label>
        <div style={{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end',gap:8}}>
          <button type="button" className="btn ghost" onClick={()=>setOpen(false)}>annuler</button>
          <button type="submit" className="btn">enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}

/* ===== Capital Tiers ===== */
function CapitalTiersModal({ openHook, onAdd, displayCcy, inline=false }){
  const [open,setOpen]=openHook||[false,()=>{}]
  const [form,setForm]=React.useState({
    date:new Date().toISOString().slice(0,10),
    source:'Prop firm',
    amount:'',
    ccy:displayCcy,
    note:''
  })
  const sources=['Prop firm','Darwinex invest','Axi Select','Investisseur','Autre']
  const submit=e=>{
    e.preventDefault()
    const amt=Number(form.amount)
    if(!form.date||!form.source||!Number.isFinite(amt)){
      alert('date/source/montant requis'); return
    }
    onAdd?.({ ...form, amount:amt })
    setOpen(false)
  }
  return (
    <Modal open={open} onClose={()=>setOpen(false)} title="Capital tiers" inline={inline}>
      <form onSubmit={submit} style={{display:'grid',gap:10,gridTemplateColumns:'repeat(2,1fr)'}}>
        <label className="form-label"><span>source</span>
          <select className="sel" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
            {sources.map(s=><option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="form-label"><span>date</span>
          <input className="sel" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        </label>
        <label className="form-label"><span>devise</span>
          <select className="sel" value={form.ccy} onChange={e=>setForm(f=>({...f,ccy:e.target.value}))}>
            {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="form-label"><span>montant</span>
          <input className="sel" type="number" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
        </label>
        <label className="form-label" style={{gridColumn:'1 / -1'}}><span>note</span>
          <input className="sel" placeholder="optionnel" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
        </label>
        <div style={{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end',gap:8}}>
          <button type="button" className="btn ghost" onClick={()=>setOpen(false)}>annuler</button>
          <button type="submit" className="btn">enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}

/* ===== WinRate (Donut seul) ===== */
function WinRateBlock({ rows }) {
  const counts = React.useMemo(() => {
    let w = 0, l = 0;
    rows.forEach(t => { if (t.pnl > 0) w++; else if (t.pnl < 0) l++; });
    const total = w + l;
    const wr = total ? (w / total) * 100 : 0;
    return { w, l, total, wr };
  }, [rows])

  const donut = [
    { name: 'Gagnants', value: counts.w },
    { name: 'Perdants', value: counts.l }
  ]

    return (
    <div className="wr-donut" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={donut}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={84}
            paddingAngle={1.5}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="var(--green)" />
            <Cell fill="var(--pink)" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="wr-center">
        <div className="wr-pct">{counts.wr.toFixed(1)}%</div>
        <div className="wr-sub">sur {counts.total} trades</div>
      </div>
    </div>
  );
}

/* ===== Ratios Pro ===== */
function RatiosBlock({ rows, convert, ccy }){
  const byDate=React.useMemo(()=>{
    const m=new Map()
    rows.forEach(t=>{
      const v=convert(t.pnl,t.ccy||'USD',ccy)
      m.set(t.date,(m.get(t.date)||0)+v)
    })
    return Array.from(m,([date,pnl])=>({date,pnl})).sort((a,b)=>a.date.localeCompare(b.date))
  },[rows,ccy,convert])
  const daily=byDate.map(r=>r.pnl)
  const avg=mean(daily), sd=std(daily), dsd=downsideStd(daily)
  const wins=rows.filter(t=>t.pnl>0).map(t=>convert(t.pnl,t.ccy||'USD',ccy))
  const loss=rows.filter(t=>t.pnl<0).map(t=>Math.abs(convert(t.pnl,t.ccy||'USD',ccy)))
  const p= rows.length ? wins.length/rows.length : 0, q=1-p
  const avgW= wins.length? mean(wins):0, avgL= loss.length? mean(loss):0
  const RR= avgL>0? (avgW/avgL):0
  const expectancy= rows.length? (sum(daily)/rows.length):0
  const sharpe= sd>0? (avg/sd)*Math.sqrt(252):0
  const sortino= dsd>0? (avg/dsd)*Math.sqrt(252):0
  const kelly = avgL>0? (p - (q/(RR||1))):0
  const edge = (p*avgW) - (q*avgL)
  const ror = (edge<=0)? 1 : Math.max(0, Math.pow(q/Math.max(p,1e-6), 5)) // approx

  const verdict=(s)=> s>=1 ? 'halo-good' : (s>=0.4 ? 'halo-warn' : 'halo-bad')
  const V=({v,suffix=''})=><span className="val" style={styleNum(v)}>{Number.isFinite(v)? v.toFixed(2)+suffix : '—'}</span>

  return (
  <div className={`card ${verdict(sharpe)}`}>
    <div className="grid-3">
      <div className="card halo-neutral tinted">
  <div className="kpi-title">Expectancy par Trade</div>
  <V v={expectancy} />
</div>

      <div className="card halo-neutral tinted">
        <div className="kpi-title">Sharpe (Ann.)</div>
        <V v={sharpe} />
        <div className="kpi-title" style={{ marginTop: 8 }}>Sortino (Ann.)</div>
        <V v={sortino} />
      </div>

      <div className="card halo-neutral tinted">
        <div className="kpi-title">Risk / Reward</div>
        <V v={RR} />
        <div className="kpi-title" style={{ marginTop: 8 }}>Kelly (Indicatif)</div>
        <V v={kelly} />
        <div className="kpi-title" style={{ marginTop: 8 }}>Risque de Ruine (≈)</div>
        <V v={ror * 100} suffix="%" />
      </div>
    </div>
  </div>
)
}
/* ===== Corrélation des stratégies ===== */
function CorrelationBlock({ rows, convert, ccy }) {
  // 1. Liste des stratégies uniques
  const strats = React.useMemo(() => {
    return Array.from(new Set(rows.map(r => r.strategy))).sort();
  }, [rows]);

  // 2. Agrégation PnL par date et par stratégie
  const byDateStrat = React.useMemo(() => {
    const m = new Map();
    rows.forEach(t => {
      const d = t.date;
      const s = t.strategy;
      const v = convert(t.pnl, t.ccy || 'USD', ccy);
      if (!m.has(d)) m.set(d, new Map());
      const mm = m.get(d);
      mm.set(s, (mm.get(s) || 0) + v);
    });
    return m;
  }, [rows, ccy, convert]);

  // 3. Toutes les dates triées
  const dates = React.useMemo(() => {
    return Array.from(byDateStrat.keys()).sort();
  }, [byDateStrat]);

  // 4. Série par stratégie (tableau des PnL jour par jour)
  const series = React.useMemo(() => {
    const s = {};
    strats.forEach(st => {
      s[st] = dates.map(d => {
        const mm = byDateStrat.get(d) || new Map();
        return mm.get(st) || 0;
      });
    });
    return s;
  }, [strats, dates, byDateStrat]);

  // 5. Helpers pour corrélation
  const meanArr = a => (a.length ? a.reduce((sum, x) => sum + x, 0) / a.length : 0);

  const corr = (a, b) => {
    const n = Math.min(a.length, b.length);
    if (!n) return 0;
    const ax = a.slice(0, n);
    const bx = b.slice(0, n);
    const ma = meanArr(ax);
    const mb = meanArr(bx);
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
      const x = ax[i] - ma;
      const y = bx[i] - mb;
      num += x * y;
      da += x * x;
      db += y * y;
    }
    const den = Math.sqrt(da * db);
    return den > 0 ? num / den : 0;
  };

  const verdict = c => {
    const a = Math.abs(c);
    if (a <= 0.30) return 'halo-good';
    if (a <= 0.60) return 'halo-warn';
    return 'halo-bad';
  };

  // 6. Matrice de corrélation
  const matrix = React.useMemo(() => {
    return strats.map((s1, i) =>
      strats.map((s2, j) => (i === j ? 1 : corr(series[s1] || [], series[s2] || [])))
    );
  }, [strats, series]);

  // 7. *** Maintenant SEULEMENT on décide d'afficher ou pas ***
  if (strats.length < 2) {
    // pas assez de stratégies -> rien à afficher
    return (
      <div className="kpi-sub" style={{opacity:0.8, fontSize:12, padding:'8px 0'}}>
        Pas assez de stratégies pour calculer une corrélation.
      </div>
    );
  }

  // 8. Rendu normal
  return (
    <div style={{overflowX:'auto', marginTop:8}}>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            {strats.map(s => <th key={s}>{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th>{strats[i]}</th>
              {row.map((c, j) => (
                <td key={j}>
                  <div
                    className="card halo-neutral"
                    style={{
                      padding:'8px 10px',
                      textAlign:'center',
                      borderRadius:12,
                      border:'1px solid var(--border)'
                    }}
                  >
                    <div
                      className={`val ${verdict(c)}`}
                      style={{border:'none'}}
                    >
                      {c.toFixed(2)}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===== Mapping Stratégie × Broker ===== */
function MappingTable({ rows, convert, ccy }){
  const map=new Map()
  rows.forEach(r=>{
    const k=`${r.strategy}||${r.broker}`
    const v=convert(r.pnl,r.ccy||'USD',ccy)
    const o=map.get(k)||{ pnl:0, n:0 }
    o.pnl+=v; o.n+=1
    map.set(k,o)
  })

  const items = Array.from(map.entries()).map(([k,v])=>{
    const [strategy, broker]=k.split('||')
    return {
      strategy,
      broker,
      pnl:v.pnl,
      n:v.n,
      expectancy: v.n? v.pnl/v.n : 0
    }
  }).sort((a,b)=>
    a.strategy.localeCompare(b.strategy)||a.broker.localeCompare(b.broker)
  )

  return (
    <>
      <table className="table" style={{marginTop:6}}>
        <thead>
          <tr>
            <th>Stratégie</th>
            <th>Broker</th>
            <th style={{textAlign:'right'}}>Pnl</th>
            <th style={{textAlign:'right'}}>Trades</th>
            <th style={{textAlign:'right'}}>Expectancy</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r,i)=>(
            <tr key={i}>
              <td>{r.strategy}</td>
              <td>{r.broker}</td>
              <td style={{textAlign:'right'}}>
                <span className="val" style={styleNum(r.pnl)}>{r.pnl.toFixed(2)}</span>
              </td>
              <td style={{textAlign:'right'}}>{r.n}</td>
              <td style={{textAlign:'right'}}>
                <span className="val" style={styleNum(r.expectancy)}>{r.expectancy.toFixed(2)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/* ===== Activité (heure/jour/mois) ===== */
function ActivityBlocks({ rows }){
  const hour=new Array(24).fill(0).map((_,h)=>({h, win:0, loss:0}))
  const dow=new Array(7).fill(0).map((_,d)=>({d, win:0, loss:0}))
  const mon=new Array(12).fill(0).map((_,m)=>({m, win:0, loss:0}))
  rows.forEach(t=>{
    const rndH=(Math.random()*24)|0  // si pas d’heure précise dans CSV
    const dt=new Date(t.date+'T12:00:00Z')
    const d=(dt.getUTCDay()+6)%7
    const m=dt.getUTCMonth()
    if(t.pnl>0){ hour[rndH].win++; dow[d].win++; mon[m].win++; }
    else if(t.pnl<0){ hour[rndH].loss++; dow[d].loss++; mon[m].loss++; }
  })
  const bar=(data,xKey)=>(
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="#2b2b2b"/>
        <XAxis dataKey={xKey} stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}}/>
        <YAxis allowDecimals={false} stroke={C.axis} tickLine={false} axisLine={{stroke:C.axis}}/>
        <Tooltip/><Legend/>
        <Bar dataKey="win" name="Gagnants" fill="var(--green)"/>
        <Bar dataKey="loss" name="Perdants" fill="var(--pink)"/>
      </BarChart>
    </ResponsiveContainer>
  )
  const dowLabel=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  const monLabel=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']
  return (
    <div className="grid-3">
      <div className="card">
        <div className="kpi-title">Activité par Heure</div>
        {bar(hour,'h')}
      </div>
      <div className="card">
        <div className="kpi-title">Activité par Jour (Lundi…Dimanche)</div>
        {bar(dow.map((x,i)=>({...x,d:dowLabel[i]})),'d')}
      </div>
      <div className="card">
        <div className="kpi-title">Activité par Mois (Janvier…Décembre)</div>
        {bar(mon.map((x,i)=>({...x,m:monLabel[i]})),'m')}
      </div>
    </div>
  )
}

/* ===== Calendrier mensuel (V5.1.1) ===== */
function CalendarMonthly({ rows, convert, ccy, startEquity }) {
  // agrégation par date
  const map = new Map();
  rows.forEach(t => {
    const v = convert(t.pnl, t.ccy || 'USD', ccy);
    const o = map.get(t.date) || { pnl: 0, n: 0 };
    o.pnl += v; o.n++;
    map.set(t.date, o);
  });

  // cible = mois du dernier trade filtré, sinon mois courant
  const lastDateStr = rows.length ? rows[rows.length - 1].date : new Date().toISOString().slice(0,10);
  const base = new Date(lastDateStr + 'T12:00:00Z');
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth(); // 0..11

  // bornes du mois (UTC)
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const lastOfMonth  = new Date(Date.UTC(year, month + 1, 0));

  // construire les jours affichés de Lundi à Dimanche
  const start = new Date(firstOfMonth);
  const startDow = (start.getUTCDay() + 6) % 7; // lundi=0
  start.setUTCDate(start.getUTCDate() - startDow);

  const end = new Date(lastOfMonth);
  const endDow = (end.getUTCDay() + 6) % 7;
  end.setUTCDate(end.getUTCDate() + (6 - endDow));

  // générer la grille
  const days = [];
  let eq = startEquity, peak = eq;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0,10);
    const isInMonth = d.getUTCMonth() === month;
    const dayData = map.get(date) || { pnl: 0, n: 0 };
    // on calcule l’équité uniquement pour afficher un DD local indicatif
    const prev = eq;
    eq += isInMonth ? dayData.pnl : 0;
    peak = Math.max(peak, eq);
    const ddAbs = Math.max(0, peak - eq);
    const retPct = prev > 0 ? (dayData.pnl / prev) * 100 : 0;

    days.push({
      date, inMonth: isInMonth, pnl: isInMonth ? dayData.pnl : null,
      n: isInMonth ? dayData.n : 0,
      retPct: isInMonth ? retPct : null,
      ddAbs: isInMonth ? ddAbs : null
    });
  }

  const verdict = v => v == null ? 'halo-neutral' : v >= 0 ? 'halo-good' : (v > -300 ? 'halo-warn' : 'halo-bad');

  const weekDays = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  return (
    <div className="card">
      <div className="block-head">
        <div className="block-title cap">Calendrier Mensuel</div>
        <div className="block-tools">
          <HelpTooltip text="Vue calendrier du mois (Lundi → Dimanche) avec week-end. Chaque case montre PnL du jour, rentabilité% et drawdown local." />
        </div>
      </div>

      <div className="month-grid">
        {/* En-têtes des jours */}
        <div className="month-head">
          {weekDays.map(d => (
            <div key={d} className="cap">{d}</div>
          ))}
        </div>

        {/* Jours */}
        {days.map(d => (
          <div key={d.date} className={`day-cell ${verdict(d.pnl)}`}>
            <div className="day-top">
              <span className={d.inMonth ? '' : 'day-muted'}>{d.date.slice(8,10)}/{d.date.slice(5,7)}</span>
              <span className="day-muted">{d.n ? `${d.n} t.` : ''}</span>
            </div>
            {d.inMonth ? (
              <>
                <div className="day-metric">
                  <span className="cap">PnL</span>
                  <span className="val" style={styleNum(d.pnl)}>{(d.pnl ?? 0).toFixed(2)}</span>
                </div>
                <div className="day-metric">
                  <span className="cap">Rentabilité</span>
                  <span className="val" style={styleNum(d.retPct)}>{Number(d.retPct ?? 0).toFixed(2)}%</span>
                </div>
                <div className="day-metric">
                  <span className="cap">DD Abs</span>
                  <span className="val">{Number(d.ddAbs ?? 0).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="day-muted" style={{fontSize:12}}>—</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Courbe d’équité (V5.1.1) ===== */
function EquityBlock({ rows, cashflows, initial, convert, ccy }) {
  const [mode, setMode] = React.useState('global'); // 'global' | 'strat'

  // Série agrégée par date
  const byDate = React.useMemo(() => {
    const m = new Map();
    rows.forEach(r => {
      const v = convert(r.pnl, r.ccy || 'USD', ccy);
      m.set(r.date, (m.get(r.date) || 0) + v);
    });
    return [...m.entries()]
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [rows, ccy, convert]);

  // Equity globale + Peak + DD (abs)
  let eq = convert(initial, 'USD', ccy);
  let peak = eq;
  const globalSeries = byDate.map(d => {
    eq += d.pnl;
    peak = Math.max(peak, eq);
    const drawdownAbs = Math.max(0, peak - eq);
    return {
      date: d.date,
      equity: eq,
      pnl: d.pnl,
      peakEquity: peak,
      drawdownAbs
    };
  });

  const fluxDates = new Set(cashflows.map(c => c.date));
  const scatterFlux = globalSeries
    .filter(x => fluxDates.has(x.date))
    .map(x => ({ date: x.date, equity: x.equity }));
  const scatterLoss = globalSeries
    .filter(x => x.pnl < 0)
    .map(x => ({ date: x.date, equity: x.equity }));

  // Série cumulée par stratégie
  const strats = React.useMemo(
    () => Array.from(new Set(rows.map(r => r.strategy))).sort(),
    [rows]
  );
  const byDateStrat = React.useMemo(() => {
    const m = new Map();
    rows.forEach(r => {
      const v = convert(r.pnl, r.ccy || 'USD', ccy);
      if (!m.has(r.date)) m.set(r.date, new Map());
      const mm = m.get(r.date);
      mm.set(r.strategy, (mm.get(r.strategy) || 0) + v);
    });
    return m;
  }, [rows, ccy, convert]);
  const dates = React.useMemo(
    () => Array.from(new Set(globalSeries.map(d => d.date))).sort(),
    [globalSeries]
  );
  const stratSeries = React.useMemo(() => {
    const acc = {};
    strats.forEach(s => (acc[s] = 0));
    const out = dates.map(date => {
      const mm = byDateStrat.get(date) || new Map();
      const row = { date };
      strats.forEach(s => {
        acc[s] += mm.get(s) || 0;
        row[s] = acc[s];
      });
      return row;
    });
    return out;
  }, [strats, dates, byDateStrat]);

  return (
    <div className="card">
      <div className="block-head">
        <div className="block-title cap">Courbe d’Équité</div>
        <div className="block-tools">
          <HelpTooltip text="Équité cumulée. En mode Global, les pointillés montrent le Plus Haut (peak) et le Drawdown (écart au plus haut) après chaque jour/trade."/>
          <span className="kpi-sub" style={{opacity:.85}}>Vue</span>
          <select className="sel" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="global">Global (PnL cumulé)</option>
            <option value="strat">Par Stratégie (PnL cumulé)</option>
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        {mode === 'global' ? (
          <ComposedChart data={globalSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis
              dataKey="date"
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: 'var(--axis-text)' }}
              tick={{ fontSize: 11, fill: 'var(--axis-text)' }}
            />
            <YAxis
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: 'var(--axis-text)' }}
              tick={{ fontSize: 11, fill: 'var(--axis-text)' }}
            />
            <Tooltip />
            <Legend />

            {/* Équité principale */}
            <Line
              type="monotone"
              dataKey="equity"
              name="Équité"
              dot={false}
              stroke="var(--white)"
              strokeWidth={1.8}
            />

            {/* Peak (plus haut atteint) – pointillé */}
            <Line
              type="monotone"
              dataKey="peakEquity"
              name="Peak"
              dot={false}
              stroke="var(--text)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />

            {/* Drawdown absolu – pointillé (on l’affiche sur l’axe principal pour lisibilité) */}
            <Line
              type="monotone"
              dataKey="drawdownAbs"
              name="DD (abs.)"
              dot={false}
              stroke="var(--pink)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Points info */}
            <Scatter data={scatterLoss} dataKey="equity" name="Perte" fill="var(--pink)" />
            <Scatter data={scatterFlux} dataKey="equity" name="Flux"  fill="var(--accent)" />
          </ComposedChart>
        ) : (
          <LineChart data={stratSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid stroke="#2b2b2b" />
            <XAxis
              dataKey="date"
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: 'var(--axis-text)' }}
              tick={{ fontSize: 11, fill: 'var(--axis-text)' }}
            />
            <YAxis
              stroke="var(--axis-text)"
              tickLine={false}
              axisLine={{ stroke: 'var(--axis-text)' }}
              tick={{ fontSize: 11, fill: 'var(--axis-text)' }}
            />
            <Tooltip />
            <Legend />
            {strats.map((s, i) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                name={s}
                dot={false}
                stroke={['var(--white)','var(--green)','var(--pink)','var(--orange)'][i % 4]}
                strokeWidth={1.6}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
      <div style={{marginTop:8, fontSize:12, color:'var(--text)'}}>
        <span style={{opacity:.9}}>Pointillés :</span> Peak (gris), DD (rose). •
        <span style={{opacity:.85}}>  points bleus = flux, points roses = jours perdants</span>
      </div>
    </div>
  );
}

/* ===== Cashflows (récap + export) ===== */
function CashflowsModal({ openHook, rows, inline=false }){
  const [open,setOpen]=openHook||[false,()=>{}]
  const exportCSV=()=>{
    const headers=['Date','Type','Montant','Devise','Note']
    const lines=rows.map(c=>[
      c.date,
      c.type,
      c.amount,
      c.ccy||'USD',
      c.note||''
    ])
    const csv=[headers,...lines].map(r=>r.map(x=>{
      const s=String(x??'')
      return /[",;\n]/.test(s)
        ?`"${s.replace(/"/g,'""')}"`
        :s
    }).join(',')).join('\n')
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download=`cashflows_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  return (
    <Modal
      open={open}
      onClose={()=>setOpen(false)}
      title="Cashflows (récapitulatif)"
      actions={
        <button className="btn ghost sm" onClick={exportCSV}>exporter</button>
      }
      inline={inline}
    >
      <table className="table">
        <thead>
          <tr>
            <th>date</th>
            <th>type</th>
            <th style={{textAlign:'right'}}>montant</th>
            <th>devise</th>
            <th>note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.type}</td>
              <td style={{textAlign:'right'}}>
                <span className="val" style={styleNum(r.amount)}>
                  {Number(r.amount).toFixed(2)}
                </span>
              </td>
              <td>{r.ccy||'USD'}</td>
              <td>{r.note||''}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan="5" style={{textAlign:'center',opacity:.8}}>
                aucun flux
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Modal>
  )
}

/* ===== Hub (accueil) ===== */
function HubCard({ title, subtitle, tooltip, onClick }) {
  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        textAlign:'left',
        padding:18,
        border:'1px solid var(--border)',
        borderRadius:16,
        width:'100%',
        cursor:'pointer'
      }}
    >
      <div
        className="kpi-title"
        style={{
          display:'flex',
          alignItems:'center',
          gap:6
        }}
      >
        {/* Titre en blanc */}
        <span style={{ color: 'var(--white)', fontWeight: 500 }}>
          {title}
        </span>

        <HelpTooltip text={tooltip}/>
      </div>

      {/* Sous-texte reste gris / normal */}
      <div
        style={{
          marginTop:6,
          color:'var(--text)',
          opacity:.85,
          fontSize:13
        }}
      >
        {subtitle}
      </div>
    </button>
  )
}

function HomeHub({ setView, t, subtitle }) {
  return (
    <div className="home-hero">
      <h1 className="brand" style={{justifyContent:'center', gap:10}}>
        {t?.brand || 'ZooProjectVision'}
      </h1>

      <p className="subtitle home-subtitle" style={{justifyContent:'center'}}>
        {subtitle || 'Le tableau de bord de performance trading Edouard & Michel Jimenez'}
      </p>

      <div className="grid-3 home-grid" style={{textAlign:'left'}}>
        <HubCard
          title="Centre de Contrôle"
          subtitle="Vue complète: filtres, equity, corrélation, calendrier, activité."
          tooltip="Tableau de bord principal. Toutes les métriques en un coup d'œil."
          onClick={()=>setView('control')}
        />
        <HubCard
          title="Comptabilité Entreprise"
          subtitle="Suivi des flux (payouts, frais, dépôts), catégories et exports."
          tooltip="Regroupe et catégorise les flux pour une vision 'entreprise'."
          onClick={()=>setView('compta')}
        />
        <HubCard
          title="Gestion du Risque"
          subtitle="Seuils, verdicts, et recommandations d’ajustement."
          tooltip="Analyse des risques et propositions (taille de lot, horaires, TP/SL)."
          onClick={()=>setView('risk')}
        />
      </div>
    </div>
  )
}

/* ===== Footer global ===== */
function AppFooter() {
  return (
    <div
      className="footer"
      style={{
        textAlign:'center',
        color:'var(--text)',
        opacity:.7,
        fontSize:12,
        marginTop:20
      }}
    >
      Designed &amp; Built by ZooProjectVision V{APP_VERSION} @ {new Date().getFullYear()}
    </div>
  );
}

/* ===== APP (main) ===== */
export default function App(){

  // --- Navigation simple ---
  const [view, setView] = React.useState('home') // 'home' | 'control' | 'compta' | 'risk'

  // --- Langue (avec fallback) ---
  const [lang, setLang] = React.useState('fr')
  const t = React.useMemo(
    () => deepMerge(I18N_DEFAULTS, dict[lang] || {}),
    [lang]
  )

  // --- Devise d’affichage ---
  const [displayCcy, setDisplayCcy] = React.useState('USD')

  // --- FX (cache + fallback) ---
  const fallback = {
    USD:{USD:1,EUR:0.93,CHF:0.88},
    EUR:{USD:1/0.93,EUR:1,CHF:0.88/0.93},
    CHF:{USD:1/0.88,EUR:0.93/0.88,CHF:1}
  }

  const [rates, setRates] = React.useState(null)

  React.useEffect(()=>{
    const key='fx_cache_v1'
    const now=Date.now()
    try{
      const cached=localStorage.getItem(key)
      if(cached){
        const {at,data}=JSON.parse(cached)
        if(now-at < 24*3600*1000){
          setRates(data)
          return
        }
      }
    }catch{}

    fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR,CHF')
      .then(r=>r.json())
      .then(j=>{
        const data={
          USD:{USD:1,EUR:j.rates.EUR,CHF:j.rates.CHF},
          EUR:{USD:1/j.rates.EUR,EUR:1,CHF:j.rates.CHF/j.rates.EUR},
          CHF:{USD:1/j.rates.CHF,EUR:j.rates.EUR/j.rates.CHF,CHF:1}
        }
        setRates(data)
        localStorage.setItem(key,JSON.stringify({at:now,data}))
      })
      .catch(()=>{})
  },[])

  const convert = (val, from='USD', to=displayCcy) => {
    if (val == null) return 0
    if (from === to) return Number(Number(val).toFixed(2))
    const tab = rates || fallback
    const r = (tab[from] && tab[from][to]) ? tab[from][to] : 1
    return Number((Number(val) * r).toFixed(2))
  }

  const fmt = (v, ccy=displayCcy) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style:'currency',
        currency:ccy,
        minimumFractionDigits:2,
        maximumFractionDigits:2
      }).format(v ?? 0)
    } catch {
      // fallback simple string
      return `${(v ?? 0).toFixed(2)} ${ccy}`
    }
  }

  // --- Données trades (démo + imports utilisateur) ---
  const demo = React.useMemo(() => genDemoTrades(), [])
  const [userTrades, setUserTrades] = React.useState([])
  const tradesAll = React.useMemo(
    () => demo.concat(userTrades),
    [demo, userTrades]
  )

  // --- Capital & flux ---
  const CAPITAL_INITIAL_USD = 100000

  const [flows, setFlows] = React.useState(() => {
    try {
      const raw = localStorage.getItem('zpv_flows')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  React.useEffect(() => {
    try { localStorage.setItem('zpv_flows', JSON.stringify(flows)) } catch {}
  }, [flows])

  const [tiers, setTiers] = React.useState(() => {
    try {
      const raw = localStorage.getItem('zpv_tiers')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  React.useEffect(() => {
    try { localStorage.setItem('zpv_tiers', JSON.stringify(tiers)) } catch {}
  }, [tiers])

  // --- Filtres ---
  const [asset,setAsset] = React.useState('All')
  const [broker,setBroker] = React.useState('All')
  const [strategy,setStrategy] = React.useState('All')
  const [dateFrom,setDateFrom] = React.useState('')
  const [dateTo,setDateTo] = React.useState('')

  const reset = () => {
    setAsset('All')
    setBroker('All')
    setStrategy('All')
    setDateFrom('')
    setDateTo('')
  }

  const assets = React.useMemo(
    () => Array.from(new Set(tradesAll.map(t => t.asset))),
    [tradesAll]
  )
  const brokers = React.useMemo(
    () => Array.from(new Set(tradesAll.map(t => t.broker))),
    [tradesAll]
  )
  const strategies = React.useMemo(
    () => Array.from(new Set(tradesAll.map(t => t.strategy))),
    [tradesAll]
  )

  const filtered = React.useMemo(() => tradesAll.filter(t => {
    if (asset !== 'All' && t.asset !== asset) return false
    if (broker !== 'All' && t.broker !== broker) return false
    if (strategy !== 'All' && t.strategy !== strategy) return false
    if (dateFrom && t.date < dateFrom) return false
    if (dateTo && t.date > dateTo) return false
    return true
  }), [tradesAll, asset, broker, strategy, dateFrom, dateTo])

  // --- Cashflows selon période sélectionnée ---
  const cashflowsAll = flows
  const cashflowsInRange = React.useMemo(() => cashflowsAll.filter(c => (
    (!dateFrom || c.date >= dateFrom) && (!dateTo || c.date <= dateTo)
  )), [cashflowsAll, dateFrom, dateTo])

  // --- KPI Capital / PnL / DD ---
  const capitalInitialDisp = React.useMemo(
    () => convert(CAPITAL_INITIAL_USD,'USD',displayCcy),
    [displayCcy, rates]
  )

  const cashFlowTotal = React.useMemo(
    () => cashflowsInRange.reduce((acc, c) =>
      acc + convert(c.amount, c.ccy || 'USD', displayCcy)
    , 0),
    [cashflowsInRange, displayCcy, rates]
  )

  const pnlFiltered = React.useMemo(
    () => filtered.reduce((acc, t) =>
      acc + convert(t.pnl, t.ccy || 'USD', displayCcy)
    , 0),
    [filtered, displayCcy, rates]
  )

  const capitalBase   = capitalInitialDisp + cashFlowTotal
  const capitalGlobal = capitalBase + pnlFiltered

  const returnPct = React.useMemo(
    () => (capitalBase > 0 ? (pnlFiltered / capitalBase) * 100 : 0),
    [capitalBase, pnlFiltered]
  )

  // Drawdown
  const byDate = React.useMemo(() => {
    const m = new Map()
    filtered.forEach(t => {
      const v = convert(t.pnl, t.ccy || 'USD', displayCcy)
      m.set(t.date, (m.get(t.date) || 0) + v)
    })
    return [...m.entries()]
      .map(([date,pnl]) => ({ date, pnl }))
      .sort((a,b) => a.date.localeCompare(b.date))
  }, [filtered, displayCcy, rates])

  let eq = capitalInitialDisp
  let peak = eq
  let maxDrop = 0
  byDate.forEach(p => {
    eq += p.pnl
    peak = Math.max(peak, eq)
    maxDrop = Math.max(maxDrop, peak - eq)
  })
  const maxDDAbs = maxDrop
  const maxDDPct = peak > 0 ? (maxDrop / peak) * 100 : 0

  // --- Capital Tiers total ---
  const tiersTotal = React.useMemo(
    () => tiers.reduce((s, r) =>
      s + convert(Number(r.amount) || 0, r.ccy || 'USD', displayCcy)
    , 0),
    [tiers, displayCcy, rates]
  )

  // --- États pour les modales ---
  const [openFlow,setOpenFlow] = React.useState(false)
  const [openTiers,setOpenTiers] = React.useState(false)
  const [openRecap,setOpenRecap] = React.useState(false)
  const [openAbout,setOpenAbout] = React.useState(false)

  // --- Sous-titre editable ---
  const [subtitle,setSubtitle] = React.useState(() => {
    try {
      return localStorage.getItem('zpv_subtitle') || t.subtitle_default
    } catch {
      return t.subtitle_default
    }
  })
  const [editSub,setEditSub] = React.useState(false)

  React.useEffect(() => {
    try {
      if (!editSub) {
        localStorage.setItem('zpv_subtitle', subtitle)
      }
    } catch {}
  }, [subtitle, editSub, t])

  // --- noData (⚠ c'est ICI et uniquement ici) ---
  const noData = filtered.length === 0


  // ============================
  // RENDER
  // ============================
  return (
    <div className="wrap">
      {view === 'home' ? (
        <HomeHub setView={setView} t={t} subtitle={subtitle} />
      ) : (
        <>
          {/* Barre de navigation locale */}
          <div
            className="header"
            style={{
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center'
            }}
          >
            <button className="btn ghost" onClick={()=>setView('home')}>← Accueil</button>
            <div style={{ opacity:.8, fontSize:12 }}>
              {view === 'control'
                ? 'Centre de contrôle'
                : view === 'compta'
                ? 'Comptabilité entreprise'
                : 'Gestion du risque'}
            </div>
          </div>

          {view === 'control' && (
            <div className="control-page">

              {/* Bandeau haut : Titre + sous-titre + actions principales */}
              <div className="card">
                <div className="block-head">
                  <div>
                    <h1 className="brand" style={{fontSize:28, margin:0}}>{t.brand}</h1>
                    {!editSub ? (
                      <p className="subtitle cap" style={{marginTop:6}}>
                        {subtitle}
                        <button className="edit-pencil" onClick={()=>setEditSub(true)}>✏️</button>
                      </p>
                    ) : (
                      <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}>
                        <input className="sel" value={subtitle} onChange={e=>setSubtitle(e.target.value)} />
                        <button className="btn sm" onClick={()=>setEditSub(false)}>OK</button>
                      </div>
                    )}
                  </div>

                  <div className="block-tools" style={{flexWrap:'wrap', justifyContent:'flex-end'}}>
                    <label className="btn">
                      {t.actions?.Import_csv || I18N_DEFAULTS.actions.Import_csv}
                      <input
                        type="file"
                        accept=".csv"
                        style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}}
                        onChange={e=>{
                          const f=e.target.files?.[0]; if(!f) return;
                          const fr=new FileReader();
                          fr.onload=()=>{
                            const rows=parseCSV(String(fr.result));
                            const mapped=mapMT5Rows(rows);
                            if(!mapped.length){
                              alert('CSV non reconnu. (Time/Symbol/Profit requis)');
                              return
                            }
                            setUserTrades(prev=>prev.concat(mapped));
                          };
                          fr.readAsText(f);
                        }}
                      />
                    </label>

                    <button className="btn" onClick={()=>setOpenFlow(true)}>
                      {t.actions?.Add_Flow || I18N_DEFAULTS.actions.Add_Flow}
                    </button>
                    <button className="btn" onClick={()=>setOpenTiers(true)}>
                      {t.actions?.Third_Capital || I18N_DEFAULTS.actions.Third_Capital}
                    </button>
                    <button className="btn ghost" onClick={()=>setOpenRecap(true)}>
                      {t.actions?.Recap || I18N_DEFAULTS.actions.Recap}
                    </button>
                    <GuidePanel lang={lang}/>
                    <button className="btn ghost" onClick={reset}>
                      {t.actions?.Reset || I18N_DEFAULTS.actions.Reset}
                    </button>
                    <button className="btn ghost" onClick={()=>setOpenAbout(true)}>
                      {t.actions?.About || I18N_DEFAULTS.actions.About}
                    </button>

                    {/* Devise / Langue */}
                    <div className="kpi-title cap" style={{marginLeft:10}}>Devise</div>
                    <select className="sel" style={{width:110}} value={displayCcy} onChange={e=>setDisplayCcy(e.target.value)}>
                      {['USD','EUR','CHF'].map(c=> <option key={c}>{c}</option>)}
                    </select>

                    <div className="kpi-title cap" style={{marginLeft:10}}>Langue</div>
                    <select className="sel" style={{width:150}} value={lang} onChange={e=>setLang(e.target.value)}>
                      {LOCALES.map(l=> <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Formulaires inline */}
                <FlowModal
                  openHook={[openFlow,setOpenFlow]}
                  onSave={row=>setFlows(p=>p.concat([row]))}
                  ccy={displayCcy}
                  inline
                />
                <CapitalTiersModal
                  openHook={[openTiers,setOpenTiers]}
                  onAdd={row=>setTiers(p=>p.concat([row]))}
                  displayCcy={displayCcy}
                  inline
                />
                <CashflowsModal
                  openHook={[openRecap,setOpenRecap]}
                  rows={cashflowsAll}
                  inline
                />
                <AboutModal
                  openHook={[openAbout, setOpenAbout]}
                />
              </div>

              {/* Filtres */}
              <div className="control-section">
                <div className="card">
                  <div className="block-head">
                    <div className="block-title cap">Filtres</div>
                    <div className="block-tools">
                      <HelpTooltip text="Filtre les données visibles (Actif, Broker, Stratégie, Période)." />
                    </div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10}}>
                    <div>
                      <div className="kpi-title cap">Actif</div>
                      <select className="sel" value={asset} onChange={e=>setAsset(e.target.value)}>
                        <option>All</option>
                        {assets.map(a=> <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="kpi-title cap">Broker</div>
                      <select className="sel" value={broker} onChange={e=>setBroker(e.target.value)}>
                        <option>All</option>
                        {brokers.map(a=> <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="kpi-title cap">Stratégie</div>
                      <select className="sel" value={strategy} onChange={e=>setStrategy(e.target.value)}>
                        <option>All</option>
                        {strategies.map(a=> <option key={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="kpi-title cap">Du</div>
                      <input className="sel" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ fontFamily:'inherit', fontSize:14 }}/>
                    </div>
                    <div>
                      <div className="kpi-title cap">Au</div>
                      <input className="sel" type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ fontFamily:'inherit', fontSize:14 }}/>
                    </div>
                    <div/>
                    <div/>
                  </div>
                </div>
              </div>

              {/* KPIs principaux */}
              <div className="control-section">
                <div className="block-head" style={{marginBottom:6}}>
                  <div className="block-title cap">Indicateurs Principaux</div>
                  <div className="block-tools">
                    <HelpTooltip text="Vue d’ensemble: Capital, Flux, PnL Filtré, Drawdown, Jours Actifs, Capital Tiers, Nombre de Trades."/>
                  </div>
                </div>

                <div className="kpi-grid">
                  <div className="card halo-neutral">
                    <div className="kpi-title cap">Capital Initial</div>
                    <div className="val val-main">{fmt(capitalInitialDisp)}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Cashflow</div>
                    <div className={`val ${cashFlowTotal<0?'neg':'pos'}`}>{fmt(cashFlowTotal)}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">PnL (Filtré)</div>
                    <div className={`val ${pnlFiltered<0?'neg':'pos'}`}>{fmt(pnlFiltered)}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Capital Total</div>
                    <div className={`val ${pnlFiltered<0?'neg':'pos'}`}>{fmt(capitalGlobal)}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Rentabilité</div>
                    <div className={`val ${returnPct<0?'neg':'pos'}`}>{returnPct.toFixed(2)}%</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Max DD %</div>
                    <div className="val val-main">{maxDDPct.toFixed(2)}%</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Max DD (Abs.)</div>
                    <div className="val val-main">{fmt(maxDDAbs)}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Jours Actifs</div>
                    <div className="val val-main">{new Set(filtered.map(t => t.date)).size}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Capital Tiers</div>
                    <div className="val val-main">{fmt(tiersTotal)}</div>
                  </div>
                  <div className="card">
                    <div className="kpi-title cap">Trades Total</div>
                    <div className="val val-main">{filtered.length}</div>
                  </div>
                </div>
              </div>

              {/* Grille principale */}
              <div className="control-section control-grid">
                {/* Equité (col-8) */}
                <div className="col-8">
                  <EquityBlock
                    rows={filtered}
                    cashflows={cashflowsAll}
                    initial={CAPITAL_INITIAL_USD}
                    convert={convert}
                    ccy={displayCcy}
                  />
                </div>

                {/* Win rate + Ratios (col-4) */}
                <div className="col-4">
                  <div className="grid-2">
                    <div className="card">
                      <div className="block-head">
                        <div className="block-title cap">Taux de Réussite</div>
                        <div className="block-tools">
                          <HelpTooltip text="Part des trades gagnants vs perdants sur la période filtrée." />
                        </div>
                      </div>
                      <WinRateBlock rows={filtered}/>
                    </div>

                    <div className="card">
                      <div className="block-head">
                        <div className="block-title cap">Ratios (Pro)</div>
                        <div className="block-tools">
                          <HelpTooltip text="Expectancy, Sharpe, Sortino, Risk/Reward, Kelly (indicatif), Risque de Ruine (~). Le badge couleur résume la qualité du risque." />
                        </div>
                      </div>
                      <RatiosBlock rows={filtered} convert={convert} ccy={displayCcy}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corrélation & Mapping */}
              <div className="control-section control-grid">
                <div className="col-6">
                  <div className="card">
                    <div className="block-head">
                      <div className="block-title cap">Corrélation Entre Stratégies</div>
                      <div className="block-tools">
                        <HelpTooltip text="Mesure de proximité entre stratégies. Faible corrélation = meilleure diversification." />
                      </div>
                    </div>
                    <CorrelationBlock rows={filtered} convert={convert} ccy={displayCcy}/>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card">
                    <div className="block-head">
                      <div className="block-title cap">Mapping Stratégie × Broker</div>
                      <div className="block-tools">
                        <HelpTooltip text="Performance agrégée par couple Stratégie/Broker : PnL, Nombre de Trades, Expectancy." />
                      </div>
                    </div>
                    <MappingTable rows={filtered} convert={convert} ccy={displayCcy}/>
                  </div>
                </div>
              </div>

              {/* Calendrier mensuel */}
              <div className="control-section">
                <CalendarMonthly
                  rows={filtered}
                  convert={convert}
                  ccy={displayCcy}
                  startEquity={convert(CAPITAL_INITIAL_USD,'USD',displayCcy)}
                />
              </div>

              {/* Activité */}
              <div className="control-section">
                <div className="card">
                  <div className="block-head">
                    <div className="block-title cap">Activité</div>
                    <div className="block-tools">
                      <HelpTooltip text="Répartition des trades gagnants/perdants par heure, par jour de semaine, par mois." />
                    </div>
                  </div>
                  <ActivityBlocks rows={filtered}/>
                </div>
              </div>

              {/* Message si pas de données (optionnel) */}
              {noData && (
                <div className="card halo-warn" style={{marginTop:20, textAlign:'center'}}>
                  <div className="kpi-title cap">Aucune Donnée</div>
                  <div style={{fontSize:13, opacity:.8, marginTop:6}}>
                    Ajuste les filtres ou importe un CSV pour voir les stats.
                  </div>
                </div>
              )}

            </div>
          )}

          {view === 'compta' && (
            <div className="page-outer">
              <div className="page-content">
                <div className="card" style={{ padding: 16 }}>
                  <div
                    className="kpi-title"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Vue Comptable</span>
                    <HelpTooltip text="Regroupe les flux par catégorie, exports CSV, etc." />
                  </div>
                  <p style={{ marginTop: 8, opacity: .8 }}>À venir…</p>
                </div>
              </div>
            </div>
          )}

          {view === 'risk' && (
            <div className="page-outer">
              <div className="page-content">
                <div className="card" style={{ padding: 16 }}>
                  <div
                    className="kpi-title"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Analyse de Risque</span>
                    <HelpTooltip text="Seuils, verdicts, et recommandations. (Bientôt)" />
                  </div>
                  <p style={{ marginTop: 8, opacity: .8 }}>À venir…</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer visible sur toutes les pages */}
      <AppFooter />
    </div>
  )
} // <--- très important : ça ferme la fonction App
