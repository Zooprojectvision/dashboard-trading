import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Revenues from '@/pages/Revenues'
import Expenses from '@/pages/Expenses'

export default function App(){
  const [route, setRoute] = useState(window.location.hash)
  useEffect(()=>{
    const onHash = ()=> setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return ()=> window.removeEventListener('hashchange', onHash)
  },[])
  let page = <Dashboard />
  if(route.startsWith('#/revenues')) page = <Revenues />
  if(route.startsWith('#/expenses')) page = <Expenses />
  return <Layout>{page}</Layout>
}
