
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
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');
        const scope = searchParams.get('scope');
        
        console.log('StravaCallback: Datos recibidos:', { 
          code: code ? `${code.substring(0, 5)}...` : 'ausente', // Show only first 5 chars for security
          error: error || 'ninguno',
          state: state || 'ausente',
          scope: scope || 'ausente'
        });

        if (error) {
          throw new Error(`Strava devolvió un error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('No se recibió el código de autorización o estado de Strava');
        }

        console.log("Iniciando intercambio de código por token...");
        
        // Use the hardcoded client values for simplicity and reliability
        const clientId = '157332';
        const clientSecret = '38c60b9891cea2fb7053e185750c5345fab850f5';
        
        console.log("Datos para solicitud de token:", {
          client_id: clientId,
          code: `${code.substring(0, 5)}...`, // Show only first 5 chars for security
          grant_type: 'authorization_code'
        });

        const response = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code'
          })
        });

        const responseText = await response.text();
        console.log("Respuesta bruta del intercambio de token:", responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          
          console.log("Respuesta del token analizada:", {
            status: response.status,
            ok: response.ok,
            token_type: data.token_type || 'ausente',
            access_token_presente: Boolean(data.access_token),
            access_token_inicio: data.access_token ? `${data.access_token.substring(0, 5)}...` : 'ausente',
            refresh_token_presente: Boolean(data.refresh_token),
            expires_at_presente: Boolean(data.expires_at),
            athlete_presente: Boolean(data.athlete),
            athlete_id: data.athlete?.id || 'ausente'
          });
        } catch (error) {
          console.error("Error al parsear respuesta JSON:", error);
          throw new Error(`Error al parsear respuesta: ${responseText}`);
        }
        
        if (!response.ok) {
          throw new Error(`Error al obtener token: ${data.message || responseText}`);
        }

        const { error: saveError } = await supabase.functions.invoke('save-strava-token', {
          body: {
            email: state,
            strava_user_id: data.athlete?.id?.toString(),
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at
          }
        });

        if (saveError) {
          console.error("Error al guardar token:", saveError);
          throw new Error(`Error al guardar tokens: ${saveError.message}`);
        }
        
        console.log("Token guardado correctamente, obteniendo bicicletas...");

        const { data: gearData, error: gearError } = await supabase.functions.invoke('get-strava-gear', {
          body: { access_token: data.access_token }
        });
        
        console.log("Respuesta de get-strava-gear:", gearData);

        if (gearError) {
          console.error("Error al obtener bicicletas:", gearError);
          throw new Error(`Error al obtener bicicletas: ${gearError.message}`);
        }

        const bikes = gearData.gear || [];
        console.log(`Se encontraron ${bikes.length} bicicletas:`, bikes);
        
        setImportedBikes(bikes.length);

        for (const bike of bikes) {
          console.log("Importando bicicleta:", bike);
          
          const { error: bikeError } = await supabase
            .from('bikes')
            .upsert({
              name: bike.name || `Bicicleta ${bike.id}`,
              type: bike.type || 'Road',
              strava_id: bike.id,
              user_id: user?.id,
              total_distance: bike.distance || 0,
              image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60'
            });

          if (bikeError) {
            console.error('Error importing bike:', bikeError);
          } else {
            console.log(`Bicicleta ${bike.name} importada correctamente`);
          }
        }

        toast({
          title: 'Conexión exitosa',
          description: `Se importaron ${bikes.length} bicicletas desde Strava`,
        });

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
