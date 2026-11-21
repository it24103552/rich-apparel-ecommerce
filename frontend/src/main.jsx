import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { CartProviderWrapper } from './context/CartProviderWrapper'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProviderWrapper>
        <App />
        <Toaster position="top-right" containerStyle={{ zIndex: 60 }} />
      </CartProviderWrapper>
    </AuthProvider>
  </StrictMode>,
)
