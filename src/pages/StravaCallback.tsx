
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  processStravaCallback, 
  handleAuthError, 
  handleMissingCode, 
  handleMissingUser,
  type StravaImportResult
} from '@/services/stravaService/callbackProcessor';
import { StravaLoading } from '@/components/strava/StravaLoading';
import { StravaError } from '@/components/strava/StravaError';
import { StravaSuccess } from '@/components/strava/StravaSuccess';

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Iniciando conexión...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StravaImportResult | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check for errors or missing requirements
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const scope = searchParams.get('scope');

        console.log('StravaCallback: Procesando callback con params:', {
          code: code ? `${code.substring(0, 5)}...` : 'ninguno',
          error: errorParam,
          scope,
          location: window.location.href
        });

        if (errorParam) {
          const errorMsg = handleAuthError(errorParam);
          setError(errorMsg);
          toast(errorMsg);
          setTimeout(() => navigate('/more'), 3000);
          return;
        }

        if (!code) {
          const errorMsg = handleMissingCode();
          setError(errorMsg);
          toast(errorMsg);
          setTimeout(() => navigate('/more'), 3000);
          return;
        }

        if (!user) {
          const errorMsg = handleMissingUser();
          setError(errorMsg);
          toast(errorMsg);
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

        setStatus('Llamando directamente a la función strava-auth...');
        
        // DIRECTO: Llamar directamente a la función strava-auth
        try {
          console.log('Llamando directamente a strava-auth con código:', code.substring(0, 5) + '...');
          
          const { data: stravaAuthData, error: stravaAuthError } = await supabase.functions.invoke('strava-auth', {
            body: {
              code: code,
              user_id: user.id,
              redirect_uri: 'https://bici-life-cycle-track.lovable.app/strava-callback'
            }
          });
          
          if (stravaAuthError) {
            console.error('Error llamando directamente a strava-auth:', stravaAuthError);
            throw new Error(`Error en strava-auth: ${stravaAuthError.message}`);
          }
          
          console.log('Respuesta de strava-auth:', stravaAuthData);
          
          if (stravaAuthData?.success) {
            setStatus('Conexión completada correctamente');
            setResult({
              totalBikes: stravaAuthData.importedBikes || 0,
              fromAthlete: stravaAuthData.importedBikes || 0,
              fromActivities: 0,
              scopes: scope || ''
            });
            
            toast('¡Conexión exitosa! Se importaron ' + (stravaAuthData.importedBikes || 0) + ' bicicletas de Strava.');
            
            setTimeout(() => {
              navigate('/');
            }, 3000);
            return;
          }
        } catch (directError: any) {
          console.error('Error en llamada directa a strava-auth:', directError);
          // Continuamos con el flujo normal si falla la llamada directa
          console.log('Continuando con el flujo normal del processStravaCallback');
        }

        // Process the callback using the normal flow as fallback
        setStatus('Procesando con flujo normal...');
        const { result: callbackResult, error: callbackError, status: currentStatus } = 
          await processStravaCallback(code, user.id);
        
        setStatus(currentStatus);
        
        if (callbackError) {
          setError(callbackError);
          toast(callbackError);
          setTimeout(() => navigate('/more'), 3000);
          return;
        }
        
        // Handle successful callback
        setResult(callbackResult);
        
        if (callbackResult && callbackResult.totalBikes > 0) {
          toast('¡Conexión exitosa! Se importaron ' + callbackResult.totalBikes + ' bicicletas de Strava.');
        } else {
          const hasProfileReadAll = callbackResult?.scopes?.includes('profile:read_all');
          
          if (!hasProfileReadAll) {
            toast('No se encontraron bicicletas. No se pudieron importar bicicletas. Faltan permisos necesarios. Intenta volver a conectar con Strava.');
          } else {
            toast('Conexión con Strava completada. No se encontraron bicicletas para importar. Prueba a usar tus bicicletas en actividades en Strava.');
          }
        }

        setTimeout(() => {
          navigate('/');
        }, 5000); // Dar más tiempo para ver el mensaje
        
      } catch (error: any) {
        setLoading(false);
        setError(error.message || 'Error inesperado durante el proceso');
        toast('Error: ' + (error.message || 'Error inesperado durante el proceso'));
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-bold text-center mb-6">Conexión con Strava</h1>
        
        {loading && <StravaLoading status={status} />}
        {error && <StravaError error={error} />}
        {result && <StravaSuccess result={result} />}
      </div>
    </div>
  );
};

export default StravaCallback;
