import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ⚠️ Si tu veux le thème clair par overrides uniquement, laisse juste styles.css :
import './styles.css'

// Si tu veux réactiver le thème sombre + overrides clair par-dessus :
// import './theme-muso.css'
// import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
