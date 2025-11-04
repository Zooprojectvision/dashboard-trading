import { useEffect, useState } from 'react'
import { fetchSummary, fetchRevenues, fetchExpenses } from './api/apiClient'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Revenues from './pages/Revenues'
import Expenses from './pages/Expenses'

export default function App(){
  const [route, setRoute] = useState(window.location.hash || '#/')
  const [summary, setSummary] = useState<any>(null)
  const [revenues, setRevenues] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    Promise.all([fetchSummary(), fetchRevenues(), fetchExpenses()])
      .then(([s, r, e]) => {
        setSummary(s || {})
        setRevenues(Array.isArray(r) ? r : [])
        setExpenses(Array.isArray(e) ? e : [])
      })
      .catch(() => {
        setSummary({ total_revenue:0, total_expense:0, net_profit:0, by_revenue_type:{}, by_expense_category:{} })
        setRevenues([])
        setExpenses([])
      })
  }, [])

  let page = <Dashboard summary={summary} revenues={revenues} expenses={expenses} />
  if (route.startsWith('#/revenues')) page = <Revenues rows={revenues} />
  if (route.startsWith('#/expenses')) page = <Expenses rows={expenses} />

  return <Layout>{page}</Layout>
}


