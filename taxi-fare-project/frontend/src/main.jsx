import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

// ── Mount ─────────────────────────────────────────────────────────────────────
const container = document.getElementById('root')

if (!container) {
  throw new Error(
    '[FARECAST] Root element #root not found. ' +
    'Make sure index.html contains <div id="root"></div>.'
  )
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)