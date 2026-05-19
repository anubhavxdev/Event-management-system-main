import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'

import './index.css'
import App from './App.jsx'

import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem> 
     <AuthProvider>
        <App />
     </AuthProvider>
    </ThemeProvider>

  </StrictMode>,
)
