import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import './i18n.js'
import './styles.css'       // style principal (conserve ton fichier actuel)
import './theme-muso.css'   // arrière-plan (noir “brillant”)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


