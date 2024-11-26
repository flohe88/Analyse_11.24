import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { AccommodationDetailsDashboard } from './components/dashboard/AccommodationDetailsDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<DashboardLayout />} />
            <Route path="/accommodation/:id" element={<AccommodationDetailsDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
