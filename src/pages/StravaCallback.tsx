
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  const { toast } = useToast();
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
          toast({
            title: 'Error de Strava',
            description: errorMsg,
            variant: 'destructive',
          });
          setTimeout(() => navigate('/more'), 3000);
          return;
        }

        if (!code) {
          const errorMsg = handleMissingCode();
          setError(errorMsg);
          toast({
            title: 'Código ausente',
            description: errorMsg,
            variant: 'destructive',
          });
          setTimeout(() => navigate('/more'), 3000);
          return;
        }

        if (!user) {
          const errorMsg = handleMissingUser();
          setError(errorMsg);
          toast({
            title: 'Sesión no encontrada',
            description: errorMsg,
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

        // Process the callback
        const { result: callbackResult, error: callbackError, status: currentStatus } = 
          await processStravaCallback(code, user.id);
        
        setStatus(currentStatus);
        
        if (callbackError) {
          setError(callbackError);
          toast({
            title: 'Error',
            description: callbackError,
            variant: 'destructive',
          });
          setTimeout(() => navigate('/more'), 3000);
          return;
        }
        
        // Handle successful callback
        setResult(callbackResult);
        
        if (callbackResult && callbackResult.totalBikes > 0) {
          toast({
            title: '¡Conexión exitosa!',
            description: `Se importaron ${callbackResult.totalBikes} bicicletas de Strava.`,
          });
        } else {
          const hasProfileReadAll = callbackResult?.scopes?.includes('profile:read_all');
          
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
        
      } catch (error: any) {
        setLoading(false);
        setError(error.message || 'Error inesperado durante el proceso');
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, navigate, toast, user]);

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
