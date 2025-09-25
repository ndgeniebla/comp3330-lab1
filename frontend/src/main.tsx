import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { KindeProvider } from '@kinde-oss/kinde-auth-react'
import { env } from './env'
import { AppRouter } from './router' // from Lab 8

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <KindeProvider
        domain={env.VITE_KINDE_DOMAIN}
        clientId={env.VITE_KINDE_CLIENT_ID}
        audience={env.VITE_KINDE_AUDIENCE}
        redirectUri={env.VITE_KINDE_REDIRECT_URL}
        logoutUri={env.VITE_KINDE_LOGOUT_URL}
      >
        <AppRouter />
      </KindeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
