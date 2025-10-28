import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './i18n.js'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './i18n.js'
import './styles.css'       // ton style principal
import './theme-muso.css'   // l’override DOIT venir en dernier

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
