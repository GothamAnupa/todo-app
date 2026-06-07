import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './hooks/useToast'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
