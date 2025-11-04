import { useEffect, useState } from 'react'
import { fetchExpenses } from '@/api/apiClient'
import DataTable from '@/components/DataTable'

export default function Expenses(){
  const [rows, setRows] = useState<any[]>([])
  useEffect(()=>{ fetchExpenses().then(setRows) },[])
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dépenses</h2>
      <DataTable rows={rows} columns={[
        {key:'date', header:'Date'},
        {key:'vendor', header:'Fournisseur'},
        {key:'category', header:'Catégorie'},
        {key:'amount', header:'Montant'},
        {key:'currency', header:'Devise'},
        {key:'note', header:'Note'}
      ]} />
    </div>
  )
}
