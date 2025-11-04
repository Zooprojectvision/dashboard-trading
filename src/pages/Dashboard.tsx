import { useEffect, useState } from 'react'
import { fetchSummary, fetchRevenues, fetchExpenses } from '@/api/apiClient'
import { Stat } from '@/components/SummaryCards'
import RevenueChart from '@/components/RevenueChart'
import ExpenseChart from '@/components/ExpenseChart'
import CashflowChart from '@/components/CashflowChart'

export default function Dashboard(){
  const [summary, setSummary] = useState<any>(null)
  const [revenues, setRevenues] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(()=>{
    fetchSummary().then(setSummary)
    fetchRevenues().then(setRevenues)
    fetchExpenses().then(setExpenses)
  },[])

  if(!summary) return <div>Chargement…</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Revenu total" value={`${summary.total_revenue.toFixed(2)} €`} />
        <Stat label="Charges" value={`${summary.total_expense.toFixed(2)} €`} />
        <Stat label="Bénéfice net" value={`${summary.net_profit.toFixed(2)} €`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={summary.by_revenue_type} />
        <ExpenseChart data={summary.by_expense_category} />
      </div>

      <CashflowChart revenues={revenues} expenses={expenses} />
    </div>
  )
}
