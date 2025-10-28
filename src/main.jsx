// src/main.jsx — PROBE
import React from 'react'
import { createRoot } from 'react-dom/client'

// charge UNIQUEMENT le strict minimum
import './styles.css'
import './theme-muso.css'

function Probe() {
  return (
    <div style={{padding: 24}}>
      <h1 style={{color:'#0ff', margin:0}}>React monté ✅</h1>
      <p style={{color:'#ddd', marginTop:8}}>Si tu vois ce texte, React fonctionne.</p>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Probe />
  </React.StrictMode>
)





