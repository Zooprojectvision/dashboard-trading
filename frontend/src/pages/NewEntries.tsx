import { useState } from 'react'
import { createRevenue, createExpense, RevenueType, ExpenseCategory } from '../api/apiClient'

function Field({label, children}:{label:string; children:React.ReactNode}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

export default function NewEntries(){
  const [msg, setMsg] = useState<string>('')

  async function submitRevenue(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    try{
      await createRevenue({
        date: String(f.get('date')),
        source: String(f.get('source')),
        type: f.get('type') as RevenueType,
        amount: Number(f.get('amount')),
        currency: String(f.get('currency')||'EUR'),
        note: String(f.get('note')||''),
        id: 0 as any // ignored by API
      } as any)
      setMsg('✅ Revenu enregistré'); (e.target as HTMLFormElement).reset()
    }catch(err:any){ setMsg('❌ ' + err.message) }
  }

  async function submitExpense(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    try{
      await createExpense({
        date: String(f.get('date')),
        vendor: String(f.get('vendor')),
        category: f.get('category') as ExpenseCategory,
        amount: Number(f.get('amount')),
        currency: String(f.get('currency')||'EUR'),
        note: String(f.get('note')||''),
        id: 0 as any
      } as any)
      setMsg('✅ Dépense enregistrée'); (e.target as HTMLFormElement).reset()
    }catch(err:any){ setMsg('❌ ' + err.message) }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Saisir des éléments</h2>
      {msg && <div className="p-2 rounded border bg-white">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Revenu */}
        <form onSubmit={submitRevenue} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-emerald-700">Ajouter un revenu</h3>
          <Field label="Date"><input name="date" type="date" required className="border rounded px-2 py-1 w-full" /></Field>
          <Field label="Source (ex: Darwinex, FTMO, MFF)">
            <input name="source" required className="border rounded px-2 py-1 w-full" />
          </Field>
          <Field label="Type">
            <select name="type" className="border rounded px-2 py-1 w-full">
              <option value="PNL">PNL</option>
              <option value="MANAGEMENT_FEE">MANAGEMENT_FEE</option>
              <option value="PROP_PAYOUT">PROP_PAYOUT</option>
            </select>
          </Field>
          <Field label="Montant"><input name="amount" type="number" step="0.01" required className="border rounded px-2 py-1 w-full" /></Field>
          <Field label="Devise"><input name="currency" defaultValue="EUR" className="border rounded px-2 py-1 w-full" /></Field>
          <Field label="Note"><input name="note" className="border rounded px-2 py-1 w-full" /></Field>
          <button className="bg-emerald-600 text-white px-3 py-2 rounded">Enregistrer revenu</button>
        </form>

        {/* Form Dépense */}
        <form onSubmit={submitExpense} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-rose-700">Ajouter une dépense</h3>
          <Field label="Date"><input name="date" type="date" required className="border rounded px-2 py-1 w-full" /></Field>
          <Field label="Fournisseur"><input name="vendor" required className="border rounded px-2 py-1 w-full" /></Field>
          <Field label="Catégorie">
            <select name="category" className="border rounded px-2 py-1 w-full">
              <option value="CHALLENGE">CHALLENGE</option>
              <option value="COMMISSION">COMMISSION</option>
              <option value="TOOLS">TOOLS</option>
              <option value="VPS">VPS</option>
              <option value="OTHER">OTHER</option>
            </select>
          </Field>
          <Field label="Montant"><input name="amount" type="number" step="0.01" required className="border rounded px-2 py-1 w-full" /></Field>
          <Field label="Devise"><input name="currency" defaultValue="EUR" className="border rounded px-2 py-1 w-full" /></Field>
          <Field label="Note"><input name="note" className="border rounded px-2 py-1 w-full" /></Field>
          <button className="bg-rose-600 text-white px-3 py-2 rounded">Enregistrer dépense</button>
        </form>
      </div>

      <p className="text-sm text-slate-500">
        ⚠️ Les formulaires nécessitent une API en ligne (variable Vercel <code>VITE_API_BASE</code>).  
        Sans API, tu verras “Pas d’API en ligne”.
      </p>
    </div>
  )
}
