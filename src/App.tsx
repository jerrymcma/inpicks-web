import { useState } from 'react'
import './App.css'
import { Header } from './components/Header/Header'
import { Dashboard } from './components/Dashboard/Dashboard'
import { Record } from './components/Record/Record'

type View = 'dashboard' | 'record'

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')

  const handleViewChange = (view: View) => {
    setCurrentView(view)
  }

  return (
    <div className="min-h-screen">
      <Header onViewChange={handleViewChange} currentView={currentView} />
      <main>
        {currentView === 'dashboard' ? <Dashboard /> : <Record />}
      </main>
    </div>
  )
}

export default App