// src/main.jsx — TEST MONTAGE REACT
import React from 'react'
import { createRoot } from 'react-dom/client'

// IMPORTANT: on ne charge QUE le strict minimum
import './styles.css'       // doit imposer color: var(--text)
import './theme-muso.css'   // ne doit PAS toucher body

function Probe() {
  return (
    <div style={{padding: 24}}>
      <h1 style={{color:'#0ff', margin:0}}>React monté ✅</h1>
      <p style={{color:'#ddd', marginTop:8}}>Si tu lis ceci, React tourne bien.</p>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Probe />
  </React.StrictMode>
)





