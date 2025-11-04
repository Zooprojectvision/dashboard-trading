import { useEffect, useState } from 'react'
import { fetchRevenues } from '@/api/apiClient'
import DataTable from '@/components/DataTable'

export default function Revenues(){
  const [rows, setRows] = useState<any[]>([])
  useEffect(()=>{ fetchRevenues().then(setRows) },[])
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Revenus</h2>
      <DataTable rows={rows} columns={[
        {key:'date', header:'Date'},
        {key:'source', header:'Source'},
        {key:'type', header:'Type'},
        {key:'amount', header:'Montant'},
        {key:'currency', header:'Devise'},
        {key:'note', header:'Note'}
      ]} />
    </div>
  )
}
