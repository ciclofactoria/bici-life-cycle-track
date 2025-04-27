
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const App = () => (
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
            {/* Añade esta ruta para manejar la redirección desde la raíz cuando hay un código de Strava */}
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

// Componente para manejar la redirección de Strava en la raíz
const RootRouteHandler = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  // Si hay un código en la URL, esto es probablemente una redirección de Strava
  if (code && state) {
    return <Navigate to={`/strava-callback?code=${code}&state=${state}`} replace />;
  }
  
  // De lo contrario, muestra la página de inicio normal
  return (
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  );
};

export default App;
