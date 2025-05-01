
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { exchangeToken, getAthleteData } from '@/integrations/supabase/strava/api';
import { importBikesFromActivities } from '@/services/stravaService/importBikesFromActivities';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Iniciando conexión...');

  useEffect(() => {
    const processStravaCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('🔴 Error recibido en callback:', error);
        toast({
          title: 'Error de Strava',
          description: `Strava ha rechazado la conexión: ${error}`,
          variant: 'destructive',
        });
        return navigate('/more');
      }

      if (!code) {
        console.error('⚠️ No se recibió el código de autorización');
        toast({
          title: 'Código ausente',
          description: 'No se recibió ningún código desde Strava.',
          variant: 'destructive',
        });
        return navigate('/more');
      }

      if (!user) {
        toast({
          title: 'Sesión no encontrada',
          description: 'Debes estar autenticado para importar tus bicis.',
          variant: 'destructive',
        });
        return navigate('/more');
      }

      try {
        setStatus('Intercambiando código por token...');
        console.log('Intercambiando código por token...', code.substring(0, 5) + '...');
        
        // Usando la función de intercambio de token de la API
        const tokenData = await exchangeToken(code);
        
        if (!tokenData || !tokenData.access_token) {
          throw new Error('No se recibió un token válido de Strava');
        }
        
        console.log('Token recibido:', { 
          access_token: tokenData.access_token ? tokenData.access_token.substring(0, 5) + '...' : 'no disponible',
          expires_at: tokenData.expires_at,
          has_refresh: Boolean(tokenData.refresh_token), 
          athlete: tokenData.athlete ? tokenData.athlete.id : 'no disponible' 
        });
        
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
        setStatus('Importando bicicletas...');
        let countFromAthlete = 0;
        if (athlete?.bikes?.length) {
          for (const gear of athlete.bikes) {
            console.log('Importando bicicleta:', gear.name);
            const { error } = await supabase.from('bikes').upsert({
              user_id: user.id,
              strava_id: gear.id,
              name: gear.name,
              type: gear.frame_type === 1 ? 'Road' : 'Other',
              total_distance: gear.distance || 0,
              image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
            });
            if (!error) countFromAthlete++;
          }
        }

        // Importar bicis desde actividades recientes
        setStatus('Importando desde actividades recientes...');
        const countFromActivities = await importBikesFromActivities(user.id, tokenData.access_token);

        console.log(`📦 Bicis importadas desde atleta: ${countFromAthlete}`);
        console.log(`📦 Bicis importadas desde actividades: ${countFromActivities}`);

        toast({
          title: '¡Conexión exitosa!',
          description: `Se importaron ${countFromAthlete + countFromActivities} bicicletas de Strava.`,
        });

        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (err: any) {
        console.error('❌ Error al importar bicis de Strava:', err);
        toast({
          title: 'Error',
          description: err.message || 'Error desconocido al conectar con Strava',
          variant: 'destructive',
        });
        navigate('/more');
      } finally {
        setLoading(false);
      }
    };

    processStravaCallback();
  }, [searchParams, navigate, toast, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? (
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 h-8 w-8 text-muted" />
          <p className="text-lg">Conectando con Strava...</p>
          <p className="text-sm text-muted-foreground mt-2">{status}</p>
        </div>
      ) : (
        <p className="text-muted">Redirigiendo...</p>
      )}
    </div>
  );
};

export default StravaCallback;
