import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import BracketPage from './pages/BracketPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bracket/:id" element={<BracketPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
