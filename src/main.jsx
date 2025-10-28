// src/main.jsx
console.log('[main] chargé');
window.addEventListener('error', e => console.error('[global error]', e.error || e.message));
window.addEventListener('unhandledrejection', e => console.error('[unhandled promise]', e.reason));

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './i18n.js'
import './styles.css'
import './theme-muso.css'

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.insertAdjacentHTML('beforeend', '<div style="color:#fff">#root introuvable</div>');
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}




