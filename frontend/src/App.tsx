import { useEffect, useState } from 'react'
import { fetchSummary, fetchRevenues, fetchExpenses } from './api/apiClient'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'

export default function App(){
  const [summary, setSummary] = useState<any>(null)
  const [revenues, setRevenues] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(() => {
    Promise.all([fetchSummary(), fetchRevenues(), fetchExpenses()])
      .then(([s, r, e]) => {
        setSummary(s || {})
        setRevenues(Array.isArray(r) ? r : [])
        setExpenses(Array.isArray(e) ? e : [])
      })
      .catch(() => {
        setSummary({ total_revenue:0, total_expense:0, net_profit:0, by_revenue_type:{}, by_expense_category:{} })
      })
  }, [])

  return <Layout><Dashboard summary={summary} revenues={revenues} expenses={expenses} /></Layout>
}
