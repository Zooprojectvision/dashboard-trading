import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function ExpenseChart({ data }: { data: Record<string, number> }){
  const items = Object.entries(data).map(([name, value]) => ({ name, value }))
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold mb-2">Dépenses par catégorie</h3>
      <div className="h-64">
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
