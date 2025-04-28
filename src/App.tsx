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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/strava-callback" element={<StravaCallback />} />
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
              <Route path="/archived-bikes" element={<ProtectedRoute><ArchivedBikes /></ProtectedRoute>} />
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
  const scope = params.get('scope');
  const state = params.get('state');
  
  // If there's a code in the URL and scope includes 'read' or 'activity', this is likely a Strava redirect
  if (code && (scope?.includes('read') || scope?.includes('activity'))) {
    console.log("Detectado código de Strava en URL raíz:", { code, scope, state });
    
    // Redirect to the strava-callback page with all the parameters
    const redirectUrl = `/strava-callback?code=${code}`;
    
    // Add scope and state if they exist
    const fullRedirectUrl = scope 
      ? `${redirectUrl}&scope=${encodeURIComponent(scope || '')}&state=${encodeURIComponent(state || '')}`
      : redirectUrl;
      
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
