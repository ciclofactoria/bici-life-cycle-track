
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const StravaCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleStravaCallback = async () => {
      try {
        // Get the authorization code from the URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const scope = searchParams.get('scope');

        console.log('StravaCallback: Datos recibidos:', { 
          code: code ? 'presente' : 'ausente', 
          state: state || 'ausente',
          scope: scope || 'ausente',
          fullUrl: window.location.href
        });

        if (!code) {
          throw new Error('No se recibió el código de autorización de Strava');
        }

        if (!user) {
          throw new Error('Debes iniciar sesión para conectar con Strava');
        }

        console.log('Procesando callback de Strava con código:', code);

        // Exchange the code for tokens using the edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('strava-auth', {
          body: { 
            code, 
            user_id: user.id,
          }
        });

        console.log('Respuesta de edge function:', { data, error: exchangeError });

        if (exchangeError) {
          console.error('Error al intercambiar código por token:', exchangeError);
          throw new Error('Error al intercambiar el código de autorización por el token de acceso');
        }

        toast({
          title: 'Cuenta de Strava conectada',
          description: 'Tu cuenta de Strava ha sido conectada exitosamente',
        });

        // Redirect to the profile page
        navigate('/more', { replace: true });
      } catch (error: any) {
        console.error('Error durante el callback de Strava:', error);
        setError(error.message || 'Error al conectar con Strava');
        toast({
          title: 'Error de conexión',
          description: error.message || 'Error al conectar con Strava',
          variant: 'destructive'
        });
        
        // Still redirect after an error
        setTimeout(() => {
          navigate('/more', { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleStravaCallback();
  }, [navigate, searchParams, user, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin mb-4 h-8 w-8" />
            <h2 className="text-xl font-bold mb-2">Conectando con Strava...</h2>
            <p className="text-muted-foreground">Estamos procesando tu autenticación de Strava.</p>
          </div>
        ) : error ? (
          <div className="text-red-500">
            <h2 className="text-xl font-bold mb-2">Error de conexión</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-4">Redirigiendo...</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-2 text-green-600">¡Conexión exitosa!</h2>
            <p className="text-muted-foreground">Tu cuenta de Strava ha sido conectada correctamente.</p>
            <p className="mt-4">Redirigiendo...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StravaCallback;
