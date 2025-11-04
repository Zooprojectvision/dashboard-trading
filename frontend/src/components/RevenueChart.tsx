import { ResponsiveContainer, PieChart, Pie, Tooltip } from 'recharts'

export default function RevenueChart({ data }:{ data?: Record<string, number> }) {
  const obj = data && typeof data === 'object' ? data : {}
  const items = Object.entries(obj).map(([name, value]) => ({ name, value }))
  if (!items.length) return <div>Aucune donnée revenus.</div>
  return (
    <div style={{ border:'1px solid #eee', borderRadius:12, padding:12, background:'#fff' }}>
      <h3>Répartition des revenus</h3>
      <div style={{ height:260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={items} dataKey="value" nameKey="name" label />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


