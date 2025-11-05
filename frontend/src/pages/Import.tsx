import { useState } from 'react'
import { uploadRevenuesCsv, uploadExpensesCsv } from '../api/apiClient'

function Box({title, children}:{title:string; children:React.ReactNode}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function TemplateButton({filename, content}:{filename:string; content:string}) {
  const href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content.trim() + '\n')
  return <a className="text-xs text-emerald-700 underline" href={href} download={filename}>Télécharger le modèle</a>
}

export default function ImportPage(){
  const [msg, setMsg] = useState<string>('')

  async function onRev(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const file = f.get('file') as File
    const source = String(f.get('source') || 'CSV')
    if(!file || !file.name) return setMsg('❌ Choisis un fichier revenus.csv')
    try{
      const res = await uploadRevenuesCsv(file, source)
      setMsg(`✅ Revenus importés: ${res?.imported ?? 0}`)
      ;(e.target as HTMLFormElement).reset()
    }catch(err:any){ setMsg('❌ ' + (err?.message || String(err))) }
  }

  async function onExp(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const file = f.get('file') as File
    if(!file || !file.name) return setMsg('❌ Choisis un fichier expenses.csv')
    try{
      const res = await uploadExpensesCsv(file)
      setMsg(`✅ Dépenses importées: ${res?.imported ?? 0}`)
      ;(e.target as HTMLFormElement).reset()
    }catch(err:any){ setMsg('❌ ' + (err?.message || String(err))) }
  }

  const revTemplate = `
date,source,type,amount,currency,note
2025-10-10,FTMO,PROP_PAYOUT,1500,EUR,Payout FTMO
2025-09-03,Darwinex,PNL,980,EUR,PnL swing
2025-10-31,DARWIN,MANAGEMENT_FEE,210,EUR,DARWIN fees Oct`
  const expTemplate = `
date,vendor,category,amount,currency,note
2025-08-01,FTMO,CHALLENGE,155,EUR,Challenge 10k
2025-10-05,Darwinex,COMMISSION,75,EUR,Commissions trading
2025-09-15,Contabo,VPS,19,EUR,VPS`

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Importer des données (CSV)</h2>
      {msg && <div className="p-2 rounded border bg-white">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Box title="Importer Revenus CSV">
          <p className="text-sm text-slate-600">
            Colonnes requises : <code>date, source, type, amount, currency, note</code><br/>
            <span className="text-xs">type ∈ PNL | MANAGEMENT_FEE | PROP_PAYOUT</span>
          </p>
          <TemplateButton filename="revenues.template.csv" content={revTemplate} />
          <form onSubmit={onRev} className="space-y-2">
            <label className="block text-sm">
              <span className="text-slate-600">Source par défaut (ex: FTMO)</span>
              <input name="source" className="border rounded px-2 py-1 w-full" placeholder="FTMO" />
            </label>
            <input name="file" type="file" accept=".csv,text/csv" className="block" />
            <button className="bg-emerald-600 text-white px-3 py-2 rounded">Importer revenus</button>
          </form>
        </Box>

        <Box title="Importer Dépenses CSV">
          <p className="text-sm text-slate-600">
            Colonnes requises : <code>date, vendor, category, amount, currency, note</code><br/>
            <span className="text-xs">category ∈ CHALLENGE | COMMISSION | TOOLS | VPS | OTHER</span>
          </p>
          <TemplateButton filename="expenses.template.csv" content={expTemplate} />
          <form onSubmit={onExp} className="space-y-2">
            <input name="file" type="file" accept=".csv,text/csv" className="block" />
            <button className="bg-rose-600 text-white px-3 py-2 rounded">Importer dépenses</button>
          </form>
        </Box>
      </div>

      <p className="text-sm text-slate-500">
        ℹ️ Nécessite un backend en ligne (FastAPI). Sur Vercel, assure-toi d’avoir configuré la variable
        <code> VITE_API_BASE</code> avec l’URL de l’API, puis redéploie.
      </p>
    </div>
  )
}
