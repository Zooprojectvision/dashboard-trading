import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function ExpenseChart({ data }:{ data?: Record<string, number> }) {
  const obj = data && typeof data === 'object' ? data : {}
  const items = Object.entries(obj).map(([name, value]) => ({ name, value }))
  if (!items.length) return <div>Aucune donnée dépenses.</div>
  return (
    <div style={{ border:'1px solid #eee', borderRadius:12, padding:12, background:'#fff' }}>
      <h3>Dépenses par catégorie</h3>
      <div style={{ height:260 }}>
        <ResponsiveContainer>
          <BarChart data={items}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

