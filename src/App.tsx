import { AuthProvider } from './context/AuthContext'
import { Header } from './components/Header/Header'
import { Dashboard } from './components/Dashboard/Dashboard'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-900">
        <Header />
        <Dashboard />
      </div>
    </AuthProvider>
  )
}

export default App
