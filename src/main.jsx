import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Admin from './Admin.jsx'

// Inter Font — Self-Hosted, DSGVO-konform (keine Übermittlung an Google)
// Voraussetzung: npm install @fontsource/inter
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'

const isAdmin = window.location.pathname === '/admin' ||
                window.location.pathname.startsWith('/admin/')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <Admin /> : <App />}
  </React.StrictMode>,
)
