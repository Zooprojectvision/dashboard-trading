import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }){
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">ZooProjectVision</h1>
          <nav className="text-sm text-slate-600 space-x-4">
            <a href="#/" className="hover:underline">Dashboard</a>
            <a href="#/revenues" className="hover:underline">Revenus</a>
            <a href="#/expenses" className="hover:underline">Dépenses</a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
