import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'       // styles globaux (pas de background ici)
import './theme-muso.css'   // laisser VIDE ou minimal si tu veux, mais pas de body{}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)






