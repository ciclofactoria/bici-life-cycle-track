
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import BikeDetail from './pages/BikeDetail';
import ArchivedBikes from './pages/ArchivedBikes';
import Calendar from './pages/Calendar';
import More from './pages/More';
import Summary from './pages/Summary';
import Auth from './pages/Auth';
import StravaCallback from './pages/StravaCallback';
import AuthCallback from './pages/AuthCallback';
import PremiumInfo from './pages/PremiumInfo';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bike/:id"
              element={
                <ProtectedRoute>
                  <BikeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/archived"
              element={
                <ProtectedRoute>
                  <ArchivedBikes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/summary"
              element={
                <ProtectedRoute>
                  <Summary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/more"
              element={
                <ProtectedRoute>
                  <More />
                </ProtectedRoute>
              }
            />
            <Route
              path="/premium"
              element={
                <ProtectedRoute>
                  <PremiumInfo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strava-callback"
              element={<StravaCallback />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <SonnerToaster />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
