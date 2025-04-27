
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback iniciado");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error en auth callback:", error);
          setError(error.message);
          throw error;
        }
        
        if (data?.session) {
          // Successfully authenticated
          console.log("Autenticación exitosa, redirigiendo a inicio");
          navigate('/', { replace: true });
        } else {
          // No session found, redirect to auth page
          console.log("No se encontró sesión, redirigiendo a auth");
          navigate('/auth', { replace: true });
        }
      } catch (error: any) {
        console.error('Error durante el callback de autenticación:', error);
        setError(error.message || "Error durante la autenticación");
        navigate('/auth', { replace: true });
      }
    };
    
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="text-red-500">
            <h2 className="text-xl font-medium mb-2">Error de autenticación</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Spinner className="animate-spin mb-4 h-8 w-8" />
            <h2 className="text-xl font-medium mb-2">Autenticando...</h2>
            <p className="text-muted-foreground">Te estamos redirigiendo a la aplicación.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
