export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header style={{
        position:'sticky', top:0, background:'#fff', borderBottom:'1px solid #eee',
        display:'flex', justifyContent:'space-between', padding:'12px 16px'
      }}>
        <strong>ZooProjectVision</strong>
        <nav style={{display:'flex', gap:12}}>
          <a href="#/">Dashboard</a>
          <a href="#/revenues">Revenus</a>
          <a href="#/expenses">Dépenses</a>
        </nav>
      </header>
      <main style={{ padding:16 }}>{children}</main>
    </div>
  )
}
