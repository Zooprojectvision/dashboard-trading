export default function DataTable({ rows, columns }:{ rows:any[]; columns:{key:string; header:string}[] }){
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map(c => <th key={c.key} className="text-left px-3 py-2 text-slate-500">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=> (
            <tr key={i} className="odd:bg-slate-50">
              {columns.map(c => <td key={c.key} className="px-3 py-2">{String(r[c.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
