// src/App.jsx
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
    help: "Aide",
    import_csv: "Importer CSV",
    add_flow: "Ajouter Un Flux",
    third_capital: "Capital Tiers",
    recap: "Récap",
    reset: "Réinitialiser",
    about: "À Propos",
  },
  filters: {
    asset: "Actif",
    broker: "Broker",
    strategy: "Stratégie",
    from: "Du",
    to: "Au",
    all: "All",
  },
  kpis: {
    capital_initial: "Capital Initial",
    cashflow: "Cashflow",
    pnl_filtered: "PnL (Filtré)",
    capital_total: "Capital Total",
    return_pct: "Rentabilité",
    maxdd_pct: "Max DD %",
    maxdd_abs: "Max DD (Abs.)",
    active_days: "Jours Actifs",
    third_capital: "Capital Tiers",
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
  axis: "var(--text)",
  white: "var(--white)",
  green: "var(--green)",
  pink: "var(--pink)",
  orange: "var(--orange)",
  blue: "var(--accent)"
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
    >
      ?
    </span>
  )
}

/* ===== CSV utils ===== */
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
    const date=(r['Time']||r['Open time']||r['Open Time']||r['Date']||'').slice(0,10)
    const asset=r['Symbol']||r['Instrument']||r['Symbol name']||'UNKNOWN'
    const broker=r['Broker']||'Unknown'
    const strategy=r['Strategy']||'Unknown'
    const pnl=Number(r['Profit']||r['PnL']||r['PL']||r['Net P/L']||0)
    const mfe=Number(r['MFE']||r['MFE Profit']||r['Max Favorable Excursion']||0)
    const mae=Number(r['MAE']||r['MAE Profit']||r['Max Adverse Excursion']||0)
    return {
      date,
      asset,
      broker,
      strategy,
      pnl:Number((pnl||0).toFixed(2)),
      ccy:'USD',
      mfe:Number((Math.abs(mfe)||0).toFixed(2)),
      mae:Number((Math.abs(mae)||0).toFixed(2))
    }
  }).filter(r=>r.date)
}

/* ===== Modale générique ===== */
function Modal({ open, onClose, title, actions, children, inline=false }){
  if(!open) return null
  if (inline) {
    return (
      <div className="modal-card">
        <div className="modal-head-row">
          <div className="block-head-title">{title}</div>
          <div className="modal-head-actions">
            {actions}
            <button className="btn ghost sm" onClick={onClose}>Fermer</button>
          </div>
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <div className="modal-head-row">
          <div className="block-head-title">{title}</div>
          <div className="modal-head-actions">
            {actions}
            <button className="btn ghost sm" onClick={onClose}>Fermer</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function AboutModal({ openHook }) {
  const [open, setOpen] = openHook || [false, () => {}];
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="À Propos">
      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
        <div className="kpi-title">ZooProjectVision</div>
        <div style={{ marginTop: 6 }}>
          <div>Version : <b>V{APP_VERSION}</b></div>
          <div style={{ opacity: .85, marginTop: 6 }}>
            Consulte Le Changelog Pour Les Nouveautés Et Correctifs.
          </div>
          <div style={{ marginTop: 10 }}>
            <a
              href="/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost sm"
            >
              Ouvrir Le Changelog
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
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
        {(dict[lang]?.actions?.help) || I18N_DEFAULTS.actions.help}
      </button>
      <Modal
        open={open}
        onClose={()=>setOpen(false)}
        title={data?.title||'Aide & Guide'}
      >
        <div className="block-desc">
          {data?.intro && <p>{data.intro}</p>}
          {(data?.sections||[]).map((sec,i)=>(
            <details key={i} className="card tinted" style={{margin:'8px 0'}}>
              <summary className="kpi-title" style={{cursor:'pointer', textTransform:'capitalize'}}>{sec.title}</summary>
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
    {value:'deposit',label:'Dépôt'},
    {value:'withdrawal',label:'Retrait'},
    {value:'prop_payout',label:'Payout Prop'},
    {value:'prop_fee',label:'Frais Challenge Prop'},
    {value:'darwin_mgmt_fee',label:'Darwinex – Management Fee'},
    {value:'business_expense',label:'Charge Business'},
    {value:'other_income',label:'Autre Revenu'}
  ]
  const submit=e=>{
    e.preventDefault()
    const amt=Number(flow.amount)
    if(!flow.date||!flow.type||!Number.isFinite(amt)){
      alert('Date / Type / Montant Requis'); return
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
    <Modal open={open} onClose={()=>setOpen(false)} title="Ajouter Un Flux" inline={inline}>
      <form onSubmit={submit} className="form-grid-2col">
        <label className="form-label"><span>Type</span>
          <select className="sel" value={flow.type} onChange={e=>setFlow(f=>({...f,type:e.target.value}))}>
            {types.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="form-label"><span>Date</span>
          <input className="sel" type="date" value={flow.date} onChange={e=>setFlow(f=>({...f,date:e.target.value}))}/>
        </label>
        <label className="form-label"><span>Devise</span>
          <select className="sel" value={flow.ccy} onChange={e=>setFlow(f=>({...f,ccy:e.target.value}))}>
            {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="form-label"><span>Montant</span>
          <input className="sel" type="number" step="0.01" value={flow.amount} onChange={e=>setFlow(f=>({...f,amount:e.target.value}))}/>
        </label>
        <label className="form-label form-span-2"><span>Note</span>
          <input className="sel" placeholder="Optionnel" value={flow.note} onChange={e=>setFlow(f=>({...f,note:e.target.value}))}/>
        </label>
        <div className="form-footer-row">
          <button type="button" className="btn ghost" onClick={()=>setOpen(false)}>Annuler</button>
          <button type="submit" className="btn">Enregistrer</button>
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
    source:'Prop Firm',
    amount:'',
    ccy:displayCcy,
    note:''
  })
  const sources=['Prop Firm','Darwinex Invest','Axi Select','Investisseur','Autre']
  const submit=e=>{
    e.preventDefault()
    const amt=Number(form.amount)
    if(!form.date||!form.source||!Number.isFinite(amt)){
      alert('Date / Source / Montant Requis'); return
    }
    onAdd?.({ ...form, amount:amt })
    setOpen(false)
  }
  return (
    <Modal open={open} onClose={()=>setOpen(false)} title="Capital Tiers" inline={inline}>
      <form onSubmit={submit} className="form-grid-2col">
        <label className="form-label"><span>Source</span>
          <select className="sel" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
            {sources.map(s=><option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="form-label"><span>Date</span>
          <input className="sel" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
        </label>
        <label className="form-label"><span>Devise</span>
          <select className="sel" value={form.ccy} onChange={e=>setForm(f=>({...f,ccy:e.target.value}))}>
            {['USD','EUR','CHF'].map(c=><option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="form-label"><span>Montant</span>
          <input className="sel" type="number" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
        </label>
        <label className="form-label form-span-2"><span>Note</span>
          <input className="sel" placeholder="Optionnel" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
        </label>
        <div className="form-footer-row">
          <button type="button" className="btn ghost" onClick={()=>setOpen(false)}>Annuler</button>
          <button type="submit" className="btn">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}

/* ===== WinRate (Donut) ===== */
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
    <div className="module-card">
      <div className="block-head">
        <div className="block-head-left">
          <div className="block-head-title">Taux De Réussite</div>
          <HelpTooltip text="Répartition Des Trades Gagnants Et Perdants. Indique La Probabilité De Gain D’Un Trade."/>
        </div>
      </div>

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
          <div className="wr-sub block-desc" style={{textAlign:'center'}}>Sur {counts.total} Trades</div>
        </div>
      </div>
    </div>
  )
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

  const verdictSharpe = sharpe>=1 ? 'good' : (sharpe>=0.4 ? 'warn' : 'bad')

  const V = ({v,suffix=''}) => (
    <div className="kpi-value" style={styleNum(v)}>
      {Number.isFinite(v)? Number(v).toFixed(2)+suffix : '—'}
    </div>
  )

  return (
    <div className="module-card">
      <div className="block-head">
        <div className="block-head-left">
          <div className="block-head-title">
            Ratios De Performance
          </div>
          <HelpTooltip text="Analyse De La Qualité Du Risque (Sharpe, Sortino, Expectancy, Kelly). Vert = Solide, Orange = À Surveiller, Rose = Risqué."/>
        </div>
        <div className={`risk-badge risk-${verdictSharpe}`}>
          Risque
        </div>
      </div>

      <div className="grid-3">
        <div className="subcard">
          <div className="kpi-title">Expectancy Par Trade</div>
          <div className="kpi-value" style={styleNum(expectancy)}>{expectancy.toFixed(2)}</div>
        </div>

        <div className="subcard">
          <div className="kpi-title">Sharpe (Ann.)</div>
          <V v={sharpe}/>
          <div className="kpi-title" style={{marginTop:8}}>Sortino (Ann.)</div>
          <V v={sortino}/>
        </div>

        <div className="subcard">
          <div className="kpi-title">Risk / Reward</div>
          <V v={RR}/>
          <div className="kpi-title" style={{marginTop:8}}>Kelly (Indicatif)</div>
          <V v={kelly}/>
          <div className="kpi-title" style={{marginTop:8}}>Risque De Ruine (≈)</div>
          <V v={ror*100} suffix="%"/>
        </div>
      </div>
    </div>
  )
}

/* ===== Corrélation des stratégies ===== */
function CorrelationBlock({ rows, convert, ccy }){
  const strats=React.useMemo(()=>Array.from(new Set(rows.map(r=>r.strategy))).sort(),[rows])
  if(strats.length<2) return (
    <div className="module-card">
      <div className="block-head">
        <div className="block-head-left">
          <div className="block-head-title">Corrélation Entre Stratégies</div>
          <HelpTooltip text="Mesure À Quel Point Les Stratégies Bougent Ensemble. Faible Corrélation = Diversification."/>
        </div>
      </div>
      <div className="block-desc">Pas Assez De Stratégies Pour Calculer Une Corrélation.</div>
    </div>
  )

  const byDateStrat=React.useMemo(()=>{
    const m=new Map()
    rows.forEach(t=>{
      const d=t.date, s=t.strategy, v=convert(t.pnl,t.ccy||'USD',ccy)
      if(!m.has(d)) m.set(d,new Map())
      const mm=m.get(d)
      mm.set(s,(mm.get(s)||0)+v)
    })
    return m
  },[rows,ccy,convert])
  const dates=React.useMemo(()=>Array.from(byDateStrat.keys()).sort(),[byDateStrat])
  const series=React.useMemo(()=>{
    const s={}
    strats.forEach(st=>{
      s[st]=dates.map(d=> (byDateStrat.get(d).get(st)||0))
    })
    return s
  },[strats,dates,byDateStrat])
  const corr=(a,b)=>{
    const n=Math.min(a.length,b.length); if(!n) return 0
    const ax=a.slice(0,n), bx=b.slice(0,n)
    const ma=mean(ax), mb=mean(bx)
    let num=0,da=0,db=0
    for(let i=0;i<n;i++){
      const x=ax[i]-ma, y=bx[i]-mb
      num+=x*y; da+=x*x; db+=y*y
    }
    const den=Math.sqrt(da*db)
    return den>0? num/den : 0
  }
  const verdict=c=>{
    const a=Math.abs(c)
    if(a<=0.30) return 'good'
    if(a<=0.60) return 'warn'
    return 'bad'
  }
  const matrix=strats.map((s1,i)=>
    strats.map((s2,j)=> i===j?1:corr(series[s1],series[s2]))
  )

  return (
    <div className="module-card">
      <div className="block-head">
        <div className="block-head-left">
          <div className="block-head-title">Corrélation Entre Stratégies</div>
          <HelpTooltip text="Plus La Valeur Est Faible, Plus Les Stratégies Sont Indépendantes (Diversification). Rose = Très Corrélées."/>
        </div>
      </div>

      <div className="table-scroll">
        <table className="table corr-table">
          <thead>
            <tr>
              <th></th>
              {strats.map(s=><th key={s}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row,i)=>(
              <tr key={i}>
                <th>{strats[i]}</th>
                {row.map((c,j)=>(
                  <td key={j}>
                    <div className={`corr-cell badge-${verdict(c)}`}>
                      {c.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
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
    <div className="module-card">
      <div className="block-head">
        <div className="block-head-left">
          <div className="block-head-title">Mapping Stratégie × Broker</div>
          <HelpTooltip text="Performance Par Stratégie Et Par Broker. Expectancy = Gain Moyen Par Trade."/>
        </div>
      </div>

      <table className="table" style={{marginTop:6, fontSize:13}}>
        <thead>
          <tr>
            <th>Stratégie</th>
            <th>Broker</th>
            <th style={{textAlign:'right'}}>PnL</th>
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
                <span className="kpi-value" style={styleNum(r.pnl)}>{r.pnl.toFixed(2)}</span>
              </td>
              <td style={{textAlign:'right'}}>{r.n}</td>
              <td style={{textAlign:'right'}}>
                <span className="kpi-value" style={styleNum(r.expectancy)}>{r.expectancy.toFixed(2)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ===== Calendrier mensuel ===== */
function MonthlyCalendar({ rows, convert, ccy, startEquity }){
  // Agréger pnl par jour
  const dailyMap=new Map()
  rows.forEach(t=>{
    const v=convert(t.pnl,t.ccy||'USD',ccy)
    const o=dailyMap.get(t.date)||{ pnl:0, n:0 }
    o.pnl+=v; o.n++; dailyMap.set(t.date,o)
  })
  const daysSorted=[...dailyMap.entries()]
    .map(([date,o])=>({ date, pnl:o.pnl, n:o.n }))
    .sort((a,b)=>a.date.localeCompare(b.date))

  // Construire l'équité cumulée jour par jour pour calcul dd journalier
  let eq=startEquity
  let peak=eq
  const enriched=daysSorted.map(d=>{
    const prev=eq
    eq+=d.pnl
    peak=Math.max(peak,eq)
    const ddAbs = Math.max(0, peak - eq)
    const ddPct = peak>0 ? (ddAbs/peak)*100 : 0
    const retPct = prev>0 ? (d.pnl/prev)*100 : 0
    return { ...d, eq, retPct, ddAbs, ddPct }
  })

  // Déterminer le mois affiché = mois du dernier trade filtré (sinon mois courant)
  const refDateStr = enriched.length ? enriched[enriched.length-1].date : new Date().toISOString().slice(0,10)
  const refDate = new Date(refDateStr+"T00:00:00Z")
  const year = refDate.getUTCFullYear()
  const month = refDate.getUTCMonth() // 0-11

  // Générer toutes les cases du calendrier (Lundi->Dimanche)
  // On veut lundi = 0 ... dimanche = 6 dans l'affichage
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month+1, 0))
  const firstWeekday = (firstDay.getUTCDay()+6)%7 // 0=lundi
  const daysInMonth = lastDay.getUTCDate()

  const cells=[]
  // cellules vides avant le 1er du mois
  for(let i=0;i<firstWeekday;i++){
    cells.push({empty:true,id:`pre-${i}`})
  }
  // jours du mois
  for(let d=1; d<=daysInMonth; d++){
    const iso = new Date(Date.UTC(year,month,d)).toISOString().slice(0,10)
    const found = enriched.find(x=>x.date===iso)
    cells.push({
      empty:false,
      id:iso,
      date:iso,
      pnl:found?found.pnl:0,
      n:found?found.n:0,
      retPct:found?found.retPct:0,
      ddAbs:found?found.ddAbs:0,
      ddPct:found?found.ddPct:0,
      hasData:!!found
    })
  }
  // compléter à un multiple de 7
  while(cells.length%7!==0){
    cells.push({empty:true,id:`post-${cells.length}`})
  }

  const verdict = v => v>=0 ? 'good' : (v>-300 ? 'warn' : 'bad')

  return (
    <div className="module-card">
      <div className="block-head">
        <div className="block-head-left">
          <div className="block-head-title">Calendrier Mensuel</div>
          <HelpTooltip text="Performance Jour Par Jour Sur Le Mois Courant (Week-End Inclus). Couleur = Qualité Du Jour."/>
        </div>
      </div>

      <div className="calendar-month-grid">
        {/* en-têtes des jours */}
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((d,i)=>(
          <div key={i} className="calendar-weekday">{d}</div>
        ))}

        {/* cases jour */}
        {cells.map(cell=>{
          if(cell.empty){
            return <div key={cell.id} className="calendar-cell-empty"></div>
          }
          const badgeClass = cell.hasData ? `calendar-cell badge-${verdict(cell.pnl)}` : "calendar-cell"
          return (
            <div key={cell.id} className={badgeClass}>
              <div className="calendar-top">
                <span>{cell.date.slice(8,10)}/{cell.date.slice(5,7)}</span>
                <span>{cell.n} T.</span>
              </div>
              <div className="calendar-metric">
                <span>PnL</span>
                <span className="kpi-value" style={styleNum(cell.pnl)}>{cell.pnl.toFixed(2)}</span>
              </div>
              <div className="calendar-metric">
                <span>Rendement</span>
                <span className="kpi-value" style={styleNum(cell.retPct)}>{cell.retPct.toFixed(2)}%</span>
              </div>
              <div className="calendar-metric">
                <span>DD%</span>
                <span className="kpi-value">{cell.ddPct.toFixed(2)}%</span>
              </div>
              <div className="calendar-metric">
                <span>DD Abs</span>
                <span className="kpi-value">{cell.ddAbs.toFixed(2)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ===== Activité (heure/jour/mois) ===== */
function ActivityBlocks({ rows }){
  const hour=new Array(24).fill(0).map((_,h)=>({h, win:0, loss:0}))
  const dow=new Array(7).fill(0).map((_,d)=>({d, win:0, loss:0}))
  const mon=new Array(12).fill(0).map((_,m)=>({m, win:0, loss:0}))
  rows.forEach(t=>{
    const rndH=(Math.random()*24)|0
    const dt=new Date(t.date+'T12:00:00Z')
    const d=(dt.getUTCDay()+6)%7
    const m=dt.getUTCMonth()
    if(t.pnl>0){ hour[rndH].win++; dow[d].win++; mon[m].win++; }
    else if(t.pnl<0){ hour[rndH].loss++; dow[d].loss++; mon[m].loss++; }
  })
  const dowLabel=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  const monLabel=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']

  const bar=(data,xKey)=>(
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="var(--axis)"/>
        <XAxis
          dataKey={xKey}
          stroke={C.axis}
          tickLine={false}
          axisLine={{stroke:C.axis}}
          tick={{fill:C.axis,fontSize:11}}
        />
        <YAxis
          allowDecimals={false}
          stroke={C.axis}
          tickLine={false}
          axisLine={{stroke:C.axis}}
          tick={{fill:C.axis,fontSize:11}}
        />
        <Tooltip/>
        <Legend wrapperStyle={{color:'var(--text)', fontSize:11}}/>
        <Bar dataKey="win" name="Gagnants" fill="var(--green)"/>
        <Bar dataKey="loss" name="Perdants" fill="var(--pink)"/>
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="module-card">
      <div className="block-head">
        <div className="block-head-left">
          <div className="block-head-title">Activité De Trading</div>
          <HelpTooltip text="Heure, Jour Et Mois Où Les Trades Ont Eu Lieu. Permet D’Identifier Les Périodes Les Plus Risquées Ou Les Plus Rentables."/>
        </div>
      </div>

      <div className="grid-3">
        <div className="subcard">
          <div className="kpi-title">Activité Par Heure</div>
          {bar(hour,'h')}
        </div>
        <div className="subcard">
          <div className="kpi-title">Activité Par Jour (Lundi…Dimanche)</div>
          {bar(dow.map((x,i)=>({...x,d:dowLabel[i]})),'d')}
        </div>
        <div className="subcard">
          <div className="kpi-title">Activité Par Mois (Janvier…Décembre)</div>
          {bar(mon.map((x,i)=>({...x,m:monLabel[i]})),'m')}
        </div>
      </div>
    </div>
  )
}

/* ===== Courbe d’équité (mise à jour) ===== */
function EquityBlock({ rows, cashflows, initial, convert, ccy }){
  const [mode,setMode]=React.useState('global') // 'global' | 'strat'

  const byDate=React.useMemo(()=>{
    const m=new Map()
    rows.forEach(r=>{
      const v=convert(r.pnl,r.ccy||'USD',ccy)
      m.set(r.date,(m.get(r.date)||0)+v)
    })
    return [...m.entries()]
      .map(([date,pnl])=>({date,pnl}))
      .sort((a,b)=>a.date.localeCompare(b.date))
  },[rows,ccy,convert])

  const strats=React.useMemo(
    ()=>Array.from(new Set(rows.map(r=>r.strategy))).sort(),
    [rows]
  )

  const byDateStrat=React.useMemo(()=>{
    const m=new Map()
    rows.forEach(r=>{
      const v=convert(r.pnl,r.ccy||'USD',ccy)
      if(!m.has(r.date)) m.set(r.date,new Map())
      const mm=m.get(r.date)
      mm.set(r.strategy,(mm.get(r.strategy)||0)+v)
    })
    return m
  },[rows,ccy,convert])

  const dates=React.useMemo(
    ()=>Array.from(new Set([...byDate.map(d=>d.date)])).sort(),
    [byDate]
  )

  // Série globale : equity cumulative, peak, drawdown
  let eq=convert(initial,'USD',ccy)
  let peak=eq
  let maxDrop=0
  const globalSeries=byDate.map(d=>{
    eq+=d.pnl
    if(eq>peak) peak=eq
    const ddAbs = peak - eq
    if(ddAbs>maxDrop) maxDrop=dd
