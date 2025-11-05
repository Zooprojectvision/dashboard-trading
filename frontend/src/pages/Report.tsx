import { useEffect, useState } from 'react'
import { fetchMonthReport, exportRevenuesCsvUrl, exportExpensesCsvUrl } from '../api/apiClient'

export default function Report(){
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth()+1)
  const [data, setData] = useState<any>(null)

  useEffect(()=>{ load() },[]) // charge au montage (mois courant)

  async function load(){
    const r = await fetchMonthReport(year, month)
    setData(r || {})
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Rapport mensuel</h2>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-slate-600">Année</label>
          <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))}
                 className="border rounded px-2 py-1 w-28" />
        </div>
        <div>
          <label className="block text-xs text-slate-600">Mois</label>
          <input type="number" min={1} max={12} value={month} onChange={e=>setMonth(Number(e.target.value))}
                 className="border rounded px-2 py-1 w-20" />
        </div>
        <button onClick={load} className="bg-indigo-600 text-white px-3 py-2 rounded">Charger</button>
        <a className="ml-auto bg-slate-700 text-white px-3 py-2 rounded" href={exportRevenuesCsvUrl} target="_blank">Export Revenus CSV</a>
        <a className="bg-slate-700 text-white px-3 py-2 rounded" href={exportExpensesCsvUrl} target="_blank">Export Dépenses CSV</a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Revenu total" value={data?.total_revenue||0} />
        <Card label="Charges" value={data?.total_expense||0} />
        <Card label="Bénéfice net" value={data?.net_profit||0} />
      </div>

      <div className="text-sm text-slate-600">
        Période : {data?.period || `${year}-${String(month).padStart(2,'0')}`}
      </div>
    </div>
  )
}

function Card({ label, value }:{label:string; value:number}){
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{Number(value||0).toFixed(2)} €</div>
    </div>
  )
}
