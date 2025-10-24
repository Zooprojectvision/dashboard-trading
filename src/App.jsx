import React, { useEffect, useMemo, useState } from 'react'
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
<button className="btn" onClick={()=>{ let m=calMonth+1, y=calYear; if(m>11){m=0;y++} setCalMonth(m); setCalYear(y) }}>▶</button>
</div>
</div>
<div className="cal-head">{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=><div key={d}>{d}</div>)}</div>
<div className="cal-grid">
{calDates.map(dt=>{
const pnl=pnlDayMap.get(dt)
const trades=countMap.get(dt)
const ret=dailyRetMap.get(dt)
const dd = ddDailyMap.get(dt) // ≤ 0
const ddAbs = (equityMap.get(dt)!=null) ? Math.max(0, ( (Math.max(...equityHL.filter(x=>x.date<=dt).map(x=>x.equity_trading))||0) - (equityMap.get(dt)||0) )) : 0
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
<div className="modal" onClick={()=>set
