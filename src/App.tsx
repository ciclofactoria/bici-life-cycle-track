import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { registerServiceWorker } from "@/utils/notifications";
import { initPushNotifications } from "@/utils/mobileNotifications";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import BikeDetail from "./pages/BikeDetail";
import Calendar from "./pages/Calendar";
import Summary from "./pages/Summary";
import More from "./pages/More";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import StravaCallback from "./pages/StravaCallback";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Detectar si estamos en un entorno móvil o web
    const isMobileApp = window.matchMedia('(display-mode: standalone)').matches || 
                      (window as any).Capacitor !== undefined;
    
    if (isMobileApp) {
      // Inicializar notificaciones móviles si estamos en app capacitor
      initPushNotifications();
    } else {
      // Inicializar notificaciones web
      registerServiceWorker();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/strava-callback" element={<StravaCallback />} />
              {/* Handle Strava redirect at the root */}
              <Route path="/" element={
                <RootRouteHandler />
              } />
              <Route path="/bike/:id" element={
                <ProtectedRoute>
                  <BikeDetail />
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } />
              <Route path="/summary" element={
                <ProtectedRoute>
                  <Summary />
                </ProtectedRoute>
              } />
              <Route path="/more" element={
                <ProtectedRoute>
                  <More />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Component to handle root route and Strava redirects
const RootRouteHandler = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  
  // If there's a code in the URL, this is likely a Strava redirect
  if (code) {
    console.log("Detectado código de Strava en URL raíz:", { code });
    // Get the state from localStorage instead of URL
    const state = localStorage.getItem('stravaAuthState');
    localStorage.removeItem('stravaAuthState'); // Clean up
    
    return <Navigate to={`/strava-callback?code=${code}&state=${state || ''}`} replace />;
  }
  
  // Otherwise, show the normal home page
  return (
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  );
};

export default App;
