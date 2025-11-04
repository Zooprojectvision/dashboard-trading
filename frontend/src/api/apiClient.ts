// frontend/src/api/apiClient.ts
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE || '' // si vide: mode démo
export const api = axios.create({ baseURL })

export type RevenueType = 'PNL' | 'MANAGEMENT_FEE' | 'PROP_PAYOUT'
export type ExpenseCategory = 'CHALLENGE' | 'COMMISSION' | 'TOOLS' | 'VPS' | 'OTHER'

export interface Revenue { id:number; date:string; source:string; type:RevenueType; amount:number; currency:string; note:string }
export interface Expense { id:number; date:string; category:ExpenseCategory; vendor:string; amount:number; currency:string; note:string }

// Données de démonstration (fallback)
const demo = {
  summary: {
    period: 'demo',
    total_revenue: 3490,
    total_expense: 278,
    net_profit: 3212,
    by_revenue_type: { PNL: 1280, MANAGEMENT_FEE: 370, PROP_PAYOUT: 1840 },
    by_expense_category: { CHALLENGE: 155, TOOLS: 29, VPS: 19, COMMISSION: 75 },
  },
  revenues: [
    { id:1, date:'2025-10-10', source:'FTMO', type:'PROP_PAYOUT', amount:1500, currency:'EUR', note:'Payout FTMO' },
    { id:2, date:'2025-10-25', source:'MFF', type:'PROP_PAYOUT', amount:800, currency:'EUR', note:'Payout MFF' },
    { id:3, date:'2025-09-03', source:'Darwinex', type:'PNL', amount:980, currency:'EUR', note:'PnL swing' },
    { id:4, date:'2025-10-31', source:'DARWIN', type:'MANAGEMENT_FEE', amount:210, currency:'EUR', note:'DARWIN fees Oct' },
  ] as Revenue[],
  expenses: [
    { id:1, date:'2025-08-01', category:'CHALLENGE', vendor:'FTMO', amount:155, currency:'EUR', note:'Challenge 10k' },
    { id:2, date:'2025-08-02', category:'TOOLS', vendor:'ChartIQ', amount:29, currency:'EUR', note:'Licence' },
    { id:3, date:'2025-09-15', category:'VPS', vendor:'Contabo', amount:19, currency:'EUR', note:'VPS' },
    { id:4, date:'2025-10-05', category:'COMMISSION', vendor:'Darwinex', amount:75, currency:'EUR', note:'Commissions' },
  ] as Expense[],
}

async function getOrDemo<T>(path: string, fallback: T): Promise<T> {
  try {
    if (!baseURL) throw new Error('No API baseURL (demo mode)')
    const res = await api.get<T>(path)
    return res.data as T
  } catch {
    return fallback
  }
}

export const fetchSummary = async () => getOrDemo('/summary', demo.summary)
export const fetchRevenues = async () => getOrDemo<Revenue[]>('/revenues', demo.revenues)
export const fetchExpenses = async () => getOrDemo<Expense[]>('/expenses', demo.expenses)
