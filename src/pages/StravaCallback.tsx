
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bike, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { importBikesToDatabase } from '@/services/stravaService'; 

const StravaCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: userLoading } = useAuth(); // <- Asegúrate de obtener también `loading` del AuthContext
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

        if (error) {
          throw new Error(`Strava devolvió un error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('No se recibió el código de autorización o estado de Strava');
        }

        const clientId = '157332';
        const clientSecret = '38c60b9891cea2fb7053e185750c5345fab850f5';

        const response = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code'
          })
        });

        const responseText = await response.text();
        let data = JSON.parse(responseText);

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
          throw new Error(`Error al guardar tokens: ${saveError.message}`);
        }

        const { data: gearData, error: gearError } = await supabase.functions.invoke('get-strava-gear', {
          body: { access_token: data.access_token }
        });

        if (gearError) {
          throw new Error(`Error al obtener bicicletas: ${gearError.message}`);
        }

        const bikes = gearData.gear || [];

        // ✅ ESPERAR A QUE EL USER ESTÉ LISTO
        if (!userLoading && user && bikes.length > 0) {
          const importedCount = await importBikesToDatabase(user.id, bikes);
          setImportedBikes(importedCount);
        } else {
          console.error("No se puede importar - usuario no disponible o no hay bicicletas", {
            userPresent: !!user,
            bikeCount: bikes.length
          });
          setImportedBikes(0);
        }

        toast({
          title: 'Conexión exitosa',
          description: `Se importaron ${bikes.length} bicicletas desde Strava`,
        });

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);

      } catch (error: any) {
        console.error('Error durante el callback de Strava:', error);
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

    // 👉 SOLO lanzar la función cuando:
    // - NO esté cargando user
    // - El usuario esté disponible
    if (!userLoading) {
      handleStravaCallback();
    }

  }, [navigate, searchParams, user, userLoading, toast]);

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
