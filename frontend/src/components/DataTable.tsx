export default function DataTable({ rows, columns }:{
  rows?: any[]; columns: {key:string; header:string}[]
}) {
  const data = Array.isArray(rows) ? rows : []
  return (
    <div style={{ border:'1px solid #eee', borderRadius:12, padding:12, background:'#fff', overflow:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
        <thead>
          <tr>{columns.map(c =>
            <th key={c.key} style={{ textAlign:'left', padding:'8px 10px', color:'#555' }}>{c.header}</th>
          )}</tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} style={{ background: i%2? '#fafafa':'#fff' }}>
              {columns.map(c =>
                <td key={c.key} style={{ padding:'8px 10px' }}>{String(r?.[c.key] ?? '')}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

