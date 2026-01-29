import './App.css'
import { Header } from './components/Header/Header'
import { Dashboard } from './components/Dashboard/Dashboard'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Dashboard />
      </main>
    </div>
  )
}

export default App