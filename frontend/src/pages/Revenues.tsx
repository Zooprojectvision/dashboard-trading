import DataTable from '../components/DataTable'

export default function Revenues({ rows }:{ rows?: any[] }) {
  return (
    <div style={{ display:'grid', gap:16 }}>
      <h2>Revenus</h2>
      <DataTable rows={rows} columns={[
        {key:'date', header:'Date'},
        {key:'source', header:'Source'},
        {key:'type', header:'Type'},
        {key:'amount', header:'Montant'},
        {key:'currency', header:'Devise'},
        {key:'note', header:'Note'},
      ]} />
    </div>
  )
}

