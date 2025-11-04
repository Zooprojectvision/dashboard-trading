import axios from 'axios'

export const api = axios.create({ baseURL: 'http://localhost:8000' })

export type RevenueType = 'PNL' | 'MANAGEMENT_FEE' | 'PROP_PAYOUT'
export type ExpenseCategory = 'CHALLENGE' | 'COMMISSION' | 'TOOLS' | 'VPS' | 'OTHER'

export interface Revenue { id:number; date:string; source:string; type:RevenueType; amount:number; currency:string; note:string }
export interface Expense { id:number; date:string; category:ExpenseCategory; vendor:string; amount:number; currency:string; note:string }

export const fetchSummary = async () => (await api.get('/summary')).data
export const fetchRevenues = async () => (await api.get<Revenue[]>('/revenues')).data
export const fetchExpenses = async () => (await api.get<Expense[]>('/expenses')).data
