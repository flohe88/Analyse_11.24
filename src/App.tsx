import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { AccommodationDetailsDashboard } from './components/dashboard/AccommodationDetailsDashboard'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<DashboardLayout />} />
          <Route path="/accommodation/:accommodationName" element={<AccommodationDetailsDashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
