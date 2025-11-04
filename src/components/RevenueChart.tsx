import { ResponsiveContainer, PieChart, Pie, Tooltip } from 'recharts'

export default function RevenueChart({ data }: { data: Record<string, number> }){
  const items = Object.entries(data).map(([name, value]) => ({ name, value }))
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold mb-2">Répartition des revenus</h3>
      <div className="h-64">
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
