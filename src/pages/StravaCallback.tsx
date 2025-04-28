
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Bike, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { exchangeCodeForToken, getStravaBikes, importBikesToDatabase, saveStravaToken } from '@/services/stravaService';

const StravaCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importedBikes, setImportedBikes] = useState(0);

  useEffect(() => {
    const handleStravaCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // este es el email
        const errorParam = searchParams.get('error');

        if (errorParam) {
          throw new Error(`Strava devolvió un error: ${errorParam}`);
        }

        if (!code || !state) {
          throw new Error('No se recibió el código de autorización o el estado');
        }

        console.log('✅ Código de Strava recibido:', code.substring(0, 5) + '...');

        // 1. Obtener token de Strava
        const tokenData = await exchangeCodeForToken(code, state);
        console.log('✅ Token obtenido:', tokenData);

        if (!tokenData.access_token) {
          throw new Error('No se recibió access_token al intercambiar el código');
        }

        // 2. Guardar token en Supabase
        if (user) {
          await saveStravaToken(user.id, state, tokenData);
          console.log('✅ Token guardado en Supabase para el usuario:', user.id);
        } else {
          throw new Error('Usuario no autenticado en Supabase');
        }

        // 3. Obtener bicis de Strava
        const bikes = await getStravaBikes(tokenData.access_token);
        console.log('✅ Bicis obtenidas de Strava:', bikes);

        if (!bikes || bikes.length === 0) {
          throw new Error('No se encontraron bicicletas en Strava');
        }

        // 4. Importar bicis a Supabase
        const importedCount = await importBikesToDatabase(user.id, bikes);
        console.log(`✅ Se importaron ${importedCount} de ${bikes.length} bicicletas`);

        setImportedBikes(importedCount);

        toast({
          title: 'Conexión exitosa',
          description: `Se importaron ${importedCount} bicicletas desde Strava`,
        });

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);

      } catch (err: any) {
        console.error('❌ Error en StravaCallback:', err);
        setError(err.message || 'Error desconocido');
        toast({
          title: 'Error de conexión',
          description: err.message || 'Error desconocido',
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
  }, [navigate, searchParams, toast, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin mb-4 h-8 w-8" />
            <h2 className="text-xl font-bold mb-2">Importando bicicletas...</h2>
            <p className="text-muted-foreground">Procesando datos de Strava...</p>
          </div>
        ) : error ? (
          <div className="text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-4">Redirigiendo...</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-4">
              <Bike className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-600">¡Importación exitosa!</h2>
            <p className="text-muted-foreground">Se importaron {importedBikes} bicicletas.</p>
            <p className="mt-4">Redirigiendo...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StravaCallback;
