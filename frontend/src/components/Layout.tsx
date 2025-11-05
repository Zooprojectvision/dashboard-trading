
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="text-emerald-600">Zoo</span>Project<span className="text-emerald-600">Vision</span>
          </h1>
          <nav className="text-sm text-slate-600 space-x-4">
            <a href="#/" className="hover:text-emerald-600">Dashboard</a>
            <a href="#/revenues" className="hover:text-emerald-600">Revenus</a>
            <a href="#/expenses" className="hover:text-emerald-600">Dépenses</a>
            <a href="#/import" className="hover:text-emerald-600">Importer</a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-slate-500 py-6">© {new Date().getFullYear()} ZooProjectVision</footer>
    </div>
  )
}

// …
<nav className="text-sm text-slate-600 space-x-4">
  <a href="#/" className="hover:text-emerald-600">Dashboard</a>
  <a href="#/revenues" className="hover:text-emerald-600">Revenus</a>
  <a href="#/expenses" className="hover:text-emerald-600">Dépenses</a>
  <a href="#/new" className="hover:text-emerald-600">Saisir</a>
  <a href="#/report" className="hover:text-emerald-600">Rapport</a>
</nav>
// …
