import DataTable from '../components/DataTable'

export default function Expenses({ rows }:{ rows?: any[] }) {
  return (
    <div style={{ display:'grid', gap:16 }}>
      <h2>Dépenses</h2>
      <DataTable rows={rows} columns={[
        {key:'date', header:'Date'},
        {key:'vendor', header:'Fournisseur'},
        {key:'category', header:'Catégorie'},
        {key:'amount', header:'Montant'},
        {key:'currency', header:'Devise'},
        {key:'note', header:'Note'},
      ]} />
    </div>
  )
}


