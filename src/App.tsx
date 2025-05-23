
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Calendar from './pages/Calendar';
import Summary from './pages/Summary';
import More from './pages/More';
import Auth from './pages/Auth';
import StravaCallback from './pages/StravaCallback';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PremiumProvider from './services/PremiumProvider';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <PremiumProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/summary" element={<Summary />} />
              <Route path="/more" element={<More />} />
              <Route path="/auth" element={<Auth />} />
              {/* Asegurándonos de que la ruta al StravaCallback está incluida */}
              <Route path="/strava-callback" element={<StravaCallback />} />
            </Routes>
          </PremiumProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
