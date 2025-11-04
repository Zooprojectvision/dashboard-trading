import { useEffect, useState } from 'react'
import { fetchSummary, fetchRevenues, fetchExpenses } from './api/apiClient'

export default function App(){
  const [summary, setSummary] = useState<any>(null)
  const [revenues, setRevenues] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    Promise.all([fetchSummary(), fetchRevenues(), fetchExpenses()])
      .then(([s, r, e]) => {
        setSummary(s)
        setRevenues(Array.isArray(r) ? r : [])
        setExpenses(Array.isArray(e) ? e : [])
      })
      .catch(ex => setErr(String(ex)))
  }, [])

  if (err) return <pre style={{color:'red', padding:16}}>{err}</pre>
  if (!summary) return <div style={{padding:16}}>Chargement…</div>

  return (
    <div style={{ fontFamily:'system-ui, sans-serif', padding:16, lineHeight:1.5 }}>
      <h1>ZooProjectVision — démo stable</h1>

      <h2>Résumé</h2>
      <ul>
        <li><b>Revenu total:</b> {summary.total_revenue}</li>
        <li><b>Charges:</b> {summary.total_expense}</li>
        <li><b>Bénéfice net:</b> {summary.net_profit}</li>
      </ul>

      <h2>Revenus ({revenues.length})</h2>
      <ul>
        {(Array.isArray(revenues) ? revenues : []).map(r =>
          <li key={r.id}>{r.date} · {r.source} · {r.type} · {r.amount}</li>
        )}
      </ul>

      <h2>Dépenses ({expenses.length})</h2>
      <ul>
        {(Array.isArray(expenses) ? expenses : []).map(e =>
          <li key={e.id}>{e.date} · {e.vendor} · {e.category} · {e.amount}</li>
        )}
      </ul>
    </div>
  )
}


