import RevenueChart from '../components/RevenueChart'
import ExpenseChart from '../components/ExpenseChart'
import CashflowChart from '../components/CashflowChart'

export default function Dashboard({ summary, revenues, expenses }:{
  summary?: any; revenues?: any[]; expenses?: any[]
}) {
  const s = summary || { total_revenue:0, total_expense:0, net_profit:0, by_revenue_type:{}, by_expense_category:{} }
  return (
    <div style={{ display:'grid', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:12 }}>
        <Card label="Revenu total" value={s.total_revenue} />
        <Card label="Charges" value={s.total_expense} />
        <Card label="Bénéfice net" value={s.net_profit} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:12 }}>
        <RevenueChart data={s.by_revenue_type} />
        <ExpenseChart data={s.by_expense_category} />
      </div>
      <CashflowChart revenues={revenues} expenses={expenses} />
    </div>
  )
}

function Card({ label, value }:{label:string; value:number}) {
  return (
    <div style={{ border:'1px solid #eee', borderRadius:12, padding:12, background:'#fff' }}>
      <div style={{ fontSize:12, color:'#666' }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, marginTop:4 }}>{Number(value||0).toFixed(2)} €</div>
    </div>
  )
}

