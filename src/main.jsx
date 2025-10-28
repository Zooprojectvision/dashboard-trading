// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import './styles.css'     // styles globaux (pas de background ici)
import './theme-muso.css' // fond noir (optionnel, peut être vide si index.html gère le fond)

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
