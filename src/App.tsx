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
import ArchivedBikes from "./pages/ArchivedBikes";
import PremiumInfo from "./pages/PremiumInfo";
import { ToastProvider } from "@/hooks/use-toast";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Desactivamos temporalmente las notificaciones móviles
    // Mantenemos las notificaciones web para desarrollo
    const isMobileApp = false; // Forzamos a false mientras estamos en pruebas
    
    if (isMobileApp) {
      // No inicializamos notificaciones móviles por ahora
      console.log("Las notificaciones móviles se activarán cuando la app esté lista para producción");
    } else {
      // Solo inicializamos las notificaciones web en desarrollo
      registerServiceWorker();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/strava-callback" element={<StravaCallback />} />
                <Route path="/auth/strava/callback" element={<Navigate to="/strava-callback" replace />} />
                {/* Handle Strava redirect at root domain level */}
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
                <Route path="/premium" element={
                  <ProtectedRoute>
                    <PremiumInfo />
                  </ProtectedRoute>
                } />
                <Route path="/archived-bikes" element={<ProtectedRoute><ArchivedBikes /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

// Component to handle root route and Strava redirects
const RootRouteHandler = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const scope = params.get('scope');
  
  // If there's a code in the URL and scope contains anything, this is likely a Strava redirect
  if (code && scope) {
    console.log("Detectado código de Strava en URL raíz:", { code: code.substring(0, 5) + '...', scope });
    
    // Redirect to the strava-callback page with all the parameters
    const redirectUrl = `/strava-callback?code=${code}&scope=${encodeURIComponent(scope)}`;
    
    // Add any other parameters that might be present
    const state = params.get('state');
    const fullRedirectUrl = state 
      ? `${redirectUrl}&state=${encodeURIComponent(state)}`
      : redirectUrl;
      
    console.log("Redirigiendo a:", fullRedirectUrl);
    return <Navigate to={fullRedirectUrl} replace />;
  }
  
  // Otherwise, show the normal home page
  return (
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  );
};

export default App;
