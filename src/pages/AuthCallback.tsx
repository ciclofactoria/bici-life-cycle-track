
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Handle the OAuth callback or email verification
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback iniciado");
        
        // Check for email confirmation token in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const type = hashParams.get('type') || queryParams.get('type');
        
        console.log("Tipo de autenticación:", type);
        
        if (type === 'recovery' || type === 'signup') {
          // Handle email confirmation
          console.log("Procesando confirmación de email");
          
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }
          
          if (data?.session) {
            toast({
              title: "Autenticación exitosa",
              description: "Tu cuenta ha sido verificada correctamente",
            });
            navigate('/', { replace: true });
          } else {
            // This should not happen normally after email verification
            toast({
              title: "Error de verificación",
              description: "No se pudo verificar tu cuenta. Intenta iniciar sesión normalmente.",
              variant: "destructive"
            });
            navigate('/auth', { replace: true });
          }
        } else {
          // Handle OAuth callback (Google, etc)
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
        }
      } catch (error: any) {
        console.error('Error durante el callback de autenticación:', error);
        setError(error.message || "Error durante la autenticación");
        toast({
          title: "Error de autenticación",
          description: error.message || "Error durante la autenticación",
          variant: "destructive"
        });
        navigate('/auth', { replace: true });
      }
    };
    
    handleAuthCallback();
  }, [navigate, toast]);

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
            <Loader2 className="animate-spin mb-4 h-8 w-8" />
            <h2 className="text-xl font-medium mb-2">Autenticando...</h2>
            <p className="text-muted-foreground">Te estamos redirigiendo a la aplicación.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
