import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { Revenue, Expense } from '../api/apiClient'

export default function CashflowChart({ revenues, expenses }:{ revenues:Revenue[]; expenses:Expense[] }){
  const map: Record<string, number> = {}
  revenues.forEach(r => { map[r.date] = (map[r.date]||0) + r.amount })
  expenses.forEach(e => { map[e.date] = (map[e.date]||0) - e.amount })
  const series = Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([date, val])=>({ date, value: val }))
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold mb-2">Flux de trésorerie (net par date)</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
