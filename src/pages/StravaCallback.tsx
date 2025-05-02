
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { exchangeToken, getAthleteData } from '@/integrations/supabase/strava/api';
import { importBikesFromActivities } from '@/services/stravaService/importBikesFromActivities';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { getStravaBikes } from '@/services/stravaService';

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Iniciando conexión...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    totalBikes: number;
    fromAthlete: number;
    fromActivities: number;
    scopes?: string;
  } | null>(null);

  useEffect(() => {
    const processStravaCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const scope = searchParams.get('scope');

        if (error) {
          console.error('🔴 Error recibido en callback:', error);
          setError(`Strava ha rechazado la conexión: ${error}`);
          toast({
            title: 'Error de Strava',
            description: `Strava ha rechazado la conexión: ${error}`,
            variant: 'destructive',
          });
          setTimeout(() => navigate('/more'), 3000);
          return;
        }

        if (!code) {
          console.error('⚠️ No se recibió el código de autorización');
          setError('No se recibió ningún código desde Strava.');
          toast({
            title: 'Código ausente',
            description: 'No se recibió ningún código desde Strava.',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/more'), 3000);
          return;
        }

        if (!user) {
          setError('Debes estar autenticado para importar tus bicis.');
          toast({
            title: 'Sesión no encontrada',
            description: 'Debes estar autenticado para importar tus bicis.',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/more'), 3000);
          return;
        }

        // Log the scope from the URL if present
        if (scope) {
          console.log('Scope recibido en la URL:', scope);
          const hasProfileReadAll = scope.includes('profile:read_all');
          console.log('¿Tiene permiso profile:read_all en la URL?', hasProfileReadAll ? 'SÍ' : 'NO');
        } else {
          console.log('No se recibió scope en la URL');
        }

        try {
          setStatus('Intercambiando código por token...');
          console.log('Intercambiando código por token...', code.substring(0, 5) + '...');
          
          // Usando la función de intercambio de token de la API
          const tokenData = await exchangeToken(code);
          
          if (!tokenData || !tokenData.access_token) {
            throw new Error('No se recibió un token válido de Strava');
          }
          
          // Check if we received the profile:read_all scope
          const authorizedScopes = tokenData.scope || '';
          const hasProfileReadAll = authorizedScopes.includes('profile:read_all');
          
          console.log('Token recibido:', { 
            access_token: tokenData.access_token ? tokenData.access_token.substring(0, 5) + '...' : 'no disponible',
            expires_at: tokenData.expires_at,
            has_refresh: Boolean(tokenData.refresh_token), 
            athlete: tokenData.athlete ? tokenData.athlete.id : 'no disponible',
            scopes: authorizedScopes,
            profile_read_all_scope: hasProfileReadAll ? 'SÍ' : 'NO'
          });
          
          if (!hasProfileReadAll) {
            console.warn('⚠️ ADVERTENCIA: No se ha autorizado el scope profile:read_all. Es posible que no se puedan obtener las bicis del perfil de atleta.');
            toast({
              title: 'Permisos limitados',
              description: 'No se ha autorizado el permiso para leer el perfil completo. Es posible que no se puedan importar todas las bicis.',
              variant: 'warning'
            });
          }
          
          // Guardar datos del token en el perfil del usuario
          setStatus('Guardando token en perfil de usuario...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              strava_connected: true,
              strava_access_token: tokenData.access_token,
              strava_refresh_token: tokenData.refresh_token,
              strava_token_expires_at: tokenData.expires_at,
              strava_athlete_id: tokenData.athlete?.id || null
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error actualizando perfil:', updateError);
            throw new Error(`Error al actualizar perfil: ${updateError.message}`);
          }

          // Obtener datos del atleta
          setStatus('Obteniendo datos del atleta...');
          const athlete = await getAthleteData(tokenData.access_token);
          console.log('Datos del atleta recibidos:', { 
            id: athlete.id,
            username: athlete.username,
            bikes: athlete.bikes?.length || 0
          });

          // Importar bicis desde el objeto de atleta
          setStatus('Importando bicicletas del perfil...');
          let countFromAthlete = 0;
          if (athlete?.bikes?.length) {
            console.log(`Encontradas ${athlete.bikes.length} bicicletas en el perfil de atleta`);
            for (const gear of athlete.bikes) {
              console.log('Importando bicicleta desde datos de atleta:', gear.name);
              const { error } = await supabase.from('bikes').upsert({
                user_id: user.id,
                strava_id: gear.id,
                name: gear.name,
                type: gear.frame_type === 1 ? 'Road' : 'Other',
                total_distance: gear.distance || 0,
                image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
              });
              if (!error) countFromAthlete++;
              else console.error('Error importando bici desde datos de atleta:', error);
            }
          } else {
            console.log('No se encontraron bicis en los datos del atleta, intentando con actividades');
            
            // Try getting bikes directly through edge function
            setStatus('Intentando obtener bicis mediante función Edge...');
            try {
              const stravaBikes = await getStravaBikes(tokenData.access_token);
              if (stravaBikes && stravaBikes.length > 0) {
                console.log(`Obtenidas ${stravaBikes.length} bicis mediante Edge Function`);
                for (const bike of stravaBikes) {
                  const { error } = await supabase.from('bikes').upsert({
                    user_id: user.id,
                    strava_id: bike.id,
                    name: bike.name,
                    type: bike.type || 'Other',
                    total_distance: bike.distance || 0,
                    image: bike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
                  });
                  if (!error) countFromAthlete++;
                  else console.error('Error importando bici desde Edge Function:', error);
                }
              }
            } catch (err) {
              console.error('Error obteniendo bicis mediante Edge Function:', err);
            }
          }

          // Importar bicis desde actividades recientes
          setStatus('Importando desde actividades recientes...');
          const countFromActivities = await importBikesFromActivities(user.id, tokenData.access_token);

          console.log(`📦 Bicis importadas desde atleta: ${countFromAthlete}`);
          console.log(`📦 Bicis importadas desde actividades: ${countFromActivities}`);

          const totalImported = countFromAthlete + countFromActivities;
          
          // Guardar el resultado para mostrarlo en la UI
          setResult({
            totalBikes: totalImported,
            fromAthlete: countFromAthlete,
            fromActivities: countFromActivities,
            scopes: authorizedScopes
          });
          
          if (totalImported > 0) {
            toast({
              title: '¡Conexión exitosa!',
              description: `Se importaron ${totalImported} bicicletas de Strava.`,
            });
          } else {
            if (!hasProfileReadAll) {
              toast({
                title: 'No se encontraron bicicletas',
                description: 'No se pudieron importar bicicletas. Faltan permisos necesarios. Intenta volver a conectar con Strava.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Conexión con Strava completada',
                description: 'No se encontraron bicicletas para importar. Prueba a usar tus bicicletas en actividades en Strava.',
              });
            }
          }

          setTimeout(() => {
            navigate('/');
          }, 5000); // Dar más tiempo para ver el mensaje
        } catch (err: any) {
          console.error('❌ Error al importar bicis de Strava:', err);
          setError(err.message || 'Error desconocido al conectar con Strava');
          toast({
            title: 'Error',
            description: err.message || 'Error desconocido al conectar con Strava',
            variant: 'destructive',
          });
          setTimeout(() => navigate('/more'), 3000);
        } finally {
          setLoading(false);
        }
      } catch (error: any) {
        setLoading(false);
        setError(error.message || 'Error inesperado durante el proceso');
      }
    };

    processStravaCallback();
  }, [searchParams, navigate, toast, user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-bold text-center mb-6">Conexión con Strava</h1>
        
        {loading && (
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 h-8 w-8 text-orange-500" />
            <p className="text-lg mb-2">Conectando con Strava...</p>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="mt-4 mb-4">
            <Alert className={result.totalBikes > 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
              <AlertTitle className={result.totalBikes > 0 ? "text-green-800" : "text-amber-800"}>
                {result.totalBikes > 0 ? "Conexión exitosa con Strava" : "Conexión realizada con Strava"}
              </AlertTitle>
              <AlertDescription>
                <div className={result.totalBikes > 0 ? "mt-2 text-green-700" : "mt-2 text-amber-700"}>
                  {result.totalBikes > 0 ? (
                    <>
                      <p className="font-medium">Se importaron {result.totalBikes} bicicletas:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {result.fromAthlete > 0 && (
                          <li>{result.fromAthlete} desde perfil de atleta</li>
                        )}
                        {result.fromActivities > 0 && (
                          <li>{result.fromActivities} desde actividades recientes</li>
                        )}
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>No se encontraron bicicletas para importar en tu cuenta de Strava.</p>
                      {result.scopes && !result.scopes.includes('profile:read_all') && (
                        <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300">
                          <p className="font-medium">⚠️ Faltan permisos necesarios</p>
                          <p className="text-sm mt-1">
                            No se ha autorizado el permiso para leer el perfil completo (profile:read_all).
                            Este permiso es necesario para acceder a tus bicicletas.
                          </p>
                          <p className="text-sm mt-1">
                            Por favor, desconecta y vuelve a conectar con Strava asegurándote de autorizar todos los permisos.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <p className="mt-2">Redirigiendo a la página principal...</p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};

export default StravaCallback;
