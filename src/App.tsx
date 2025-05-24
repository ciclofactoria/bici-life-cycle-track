
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Calendar from './pages/Calendar';
import Summary from './pages/Summary';
import More from './pages/More';
import Auth from './pages/Auth';
import BikeDetail from './pages/BikeDetail';
import StravaCallback from './pages/StravaCallback';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PremiumProvider from './services/PremiumProvider';
import { Toaster } from './components/ui/toaster';
import { ToastProvider } from './hooks/use-toast';
import { Toaster as SonnerToaster } from 'sonner';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <LanguageProvider>
            <PremiumProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/summary" element={<Summary />} />
                <Route path="/more" element={<More />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/bike/:id" element={<BikeDetail />} />
                <Route path="/strava-callback" element={<StravaCallback />} />
                <Route path="/auth/callback" element={<StravaCallback />} />
              </Routes>
              <Toaster />
              <SonnerToaster position="top-center" />
            </PremiumProvider>
          </LanguageProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
