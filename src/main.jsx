import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Petit composant pour capturer et afficher les erreurs runtime
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null } }
  static getDerivedStateFromError(error){ return { error } }
  componentDidCatch(error, info){ console.error('Runtime error:', error, info) }
  render(){
    if (this.state.error) {
      return (
        <div style={{
          background:'#0a0a0b', color:'#ff5fa2', minHeight:'100vh',
          padding:16, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto'
        }}>
          <h2 style={{marginTop:0}}>Erreur d’exécution</h2>
          <pre style={{whiteSpace:'pre-wrap', color:'#e8ecef'}}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p style={{color:'#c2c7cc'}}>Ouvre la console (F12) pour le détail.</p>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
