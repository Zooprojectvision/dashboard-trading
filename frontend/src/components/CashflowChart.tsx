import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function CashflowChart({ revenues, expenses }:{
  revenues?: any[]; expenses?: any[]
}) {
  const r = Array.isArray(revenues) ? revenues : []
  const e = Array.isArray(expenses) ? expenses : []
  const map: Record<string, number> = {}
  r.forEach((x:any)=> { if (x?.date && typeof x.amount==='number') map[x.date]=(map[x.date]||0)+x.amount })
  e.forEach((x:any)=> { if (x?.date && typeof x.amount==='number') map[x.date]=(map[x.date]||0)-x.amount })
  const series = Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([date, value])=>({ date, value }))
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

