import RevenueChart from '../components/RevenueChart'
import ExpenseChart from '../components/ExpenseChart'
import CashflowChart from '../components/CashflowChart'

export default function Dashboard({ summary, revenues, expenses }:{
  summary?: any; revenues?: any[]; expenses?: any[]
}) {
  const s = summary || { total_revenue:0, total_expense:0, net_profit:0, by_revenue_type:{}, by_expense_category:{} }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Revenu total" value={s.total_revenue} accent="text-emerald-600" />
        <Card label="Charges" value={s.total_expense} accent="text-rose-600" />
        <Card label="Bénéfice net" value={s.net_profit} accent="text-indigo-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={s.by_revenue_type} />
        <ExpenseChart data={s.by_expense_category} />
      </div>
      <CashflowChart revenues={revenues} expenses={expenses} />
    </div>
  )
}

function Card({ label, value, accent }:{label:string; value:number; accent:string}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent}`}>{Number(value||0).toFixed(2)} €</div>
    </div>
  )
}
