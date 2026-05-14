import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './AdminApp.jsx'

const root = createRoot(document.getElementById('root'))

const renderApp = () => {
  const isAdmin = window.location.hash.startsWith('#/admin');
  root.render(
    <StrictMode>
      {isAdmin ? <AdminApp /> : <App />}
    </StrictMode>
  )
}

window.addEventListener('hashchange', renderApp);
renderApp();
