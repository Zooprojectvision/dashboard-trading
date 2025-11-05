import axios from 'axios'
const baseURL = import.meta.env.VITE_API_BASE || ''
export const api = axios.create({ baseURL })

export type RevenueType = 'PNL' | 'MANAGEMENT_FEE' | 'PROP_PAYOUT'
export type ExpenseCategory = 'CHALLENGE' | 'COMMISSION' | 'TOOLS' | 'VPS' | 'OTHER'

export interface Revenue { id:number; date:string; source:string; type:RevenueType; amount:number; currency:string; note:string }
export interface Expense { id:number; date:string; category:ExpenseCategory; vendor:string; amount:number; currency:string; note:string }

const demo = { /* … (même démo qu’avant) … */ }
// (garde ton objet demo précédent ici)

async function getOrDemo<T>(path: string, fallback: T): Promise<T> {
  try {
    if (!baseURL) throw new Error('No API baseURL (demo mode)')
    const res = await api.get<T>(path)
    return res.data as T
  } catch { return fallback }
}

export const fetchSummary = async () => getOrDemo('/summary', demo.summary)
export const fetchRevenues = async () => getOrDemo<Revenue[]>('/revenues', demo.revenues)
export const fetchExpenses = async () => getOrDemo<Expense[]>('/expenses', demo.expenses)

// --- AJOUTS: création depuis formulaires ---
export async function createRevenue(payload: Omit<Revenue,'id'>) {
  if (!baseURL) throw new Error('Pas d’API en ligne: configure VITE_API_BASE')
  const { data } = await api.post<Revenue>('/revenues', payload)
  return data
}
export async function createExpense(payload: Omit<Expense,'id'>) {
  if (!baseURL) throw new Error('Pas d’API en ligne: configure VITE_API_BASE')
  const { data } = await api.post<Expense>('/expenses', payload)
  return data
}

// --- AJOUTS: URLs d’export CSV (côté client, on fera window.open) ---
export const exportRevenuesCsvUrl = `${baseURL?.replace(/\/+$/,'')}/export/csv/revenues`
export const exportExpensesCsvUrl = `${baseURL?.replace(/\/+$/,'')}/export/csv/expenses`

// --- AJOUT: rapport mensuel ---
export async function fetchMonthReport(year: number, month: number) {
  return getOrDemo(`/report/month?year=${year}&month=${month}`, demo.summary)
}
