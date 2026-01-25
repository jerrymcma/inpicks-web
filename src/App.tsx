import './App.css'
import { Header } from './components/Header/Header'
import { Dashboard } from './components/Dashboard/Dashboard'

function App() {

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <main>
        <Dashboard />
      </main>
    </div>
  )
}

export default App