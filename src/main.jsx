// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'

// PAS de CSS, PAS d'App.jsx
function Ping() {
  return (
    <div style={{
      color:'#fff',
      background:'#111',
      padding: 24,
      fontFamily:'Inter, system-ui, Arial',
      fontSize: 18
    }}>
      PING OK — React monte bien ✅
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Ping/>)

