
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bike, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const StravaCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importedBikes, setImportedBikes] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const handleStravaCallback = async () => {
      try {
        // Get the authorization code from the URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');
        const scope = searchParams.get('scope');
        const fullUrl = window.location.href;

        console.log('StravaCallback: Datos recibidos completos:', { 
          code: code || 'ausente',
          error: error || 'ninguno',
          state: state || 'ausente',
          scope: scope || 'ausente',
          fullUrl
        });

        // Check if Strava returned an error
        if (error) {
          throw new Error(`Strava devolvió un error: ${error}`);
        }

        if (!code) {
          throw new Error('No se recibió el código de autorización de Strava');
        }

        if (!user) {
          throw new Error('Debes iniciar sesión para conectar con Strava');
        }

        console.log('Procesando callback de Strava con código:', code);

        // Get the redirect URI the same way we build it in More.tsx
        const baseUrl = window.location.origin.replace(/\/+$/, '');
        const redirectUri = `${baseUrl}/strava-callback`;

        // Exchange the code for tokens using the edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('strava-auth', {
          body: { 
            code, 
            user_id: user.id,
            redirect_uri: redirectUri
          }
        });

        console.log('Respuesta completa de edge function:', data);

        if (exchangeError) {
          console.error('Error detallado al intercambiar código por token:', exchangeError);
          throw new Error('Error al intercambiar el código de autorización por el token de acceso');
        }

        if (!data || data.error) {
          console.error('Error en la respuesta de la edge function:', data?.error || 'Respuesta vacía');
          throw new Error(data?.error || 'Error en la respuesta del servidor');
        }

        if (data.success) {
          // Si la importación fue exitosa, mostramos mensaje
          setImportedBikes(data.importedBikes || 0);
          toast({
            title: 'Importación completada',
            description: data.importedBikes > 0 
              ? `Se importaron ${data.importedBikes} bicicletas desde Strava` 
              : 'Conexión con Strava establecida',
          });
        }

        // Redirect to the profile page
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      } catch (error: any) {
        console.error('Error completo durante el callback de Strava:', error);
        setError(error.message || 'Error al importar bicicletas de Strava');
        toast({
          title: 'Error de conexión',
          description: error.message || 'Error al importar bicicletas de Strava',
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
            <h2 className="text-xl font-bold mb-2">Importando bicicletas de Strava...</h2>
            <p className="text-muted-foreground">Estamos procesando tus datos de Strava.</p>
          </div>
        ) : error ? (
          <div className="text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error de conexión</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-4">Redirigiendo...</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-4">
              <Bike className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-600">¡Importación exitosa!</h2>
            {importedBikes > 0 ? (
              <p className="text-muted-foreground">Se importaron {importedBikes} bicicletas desde tu cuenta de Strava.</p>
            ) : (
              <p className="text-muted-foreground">Conexión con Strava establecida correctamente.</p>
            )}
            <p className="mt-4">Redirigiendo...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StravaCallback;
