
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
  const [progress, setProgress] = useState('Iniciando...');

  useEffect(() => {
    const processStravaCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        console.log('⚙️ Procesando callback de Strava...');
        
        if (error) {
          console.error('🔴 Error recibido en callback:', error);
          toast({
            title: 'Error de Strava',
            description: error,
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
          console.error('⚠️ Usuario no autenticado');
          toast({
            title: 'Sesión no encontrada',
            description: 'Debes estar autenticado para importar tus bicis.',
            variant: 'destructive',
          });
          return navigate('/more');
        }

        setProgress('Obteniendo token...');
        console.log('🔄 Intercambiando código por token...');
        const tokenData = await exchangeToken(code);
        console.log('✅ Token obtenido correctamente');
        
        setProgress('Obteniendo datos del atleta...');
        console.log('🔄 Obteniendo datos del atleta...');
        const athlete = await getAthleteData(tokenData.access_token);
        console.log('✅ Datos del atleta obtenidos:', athlete?.id ? 'ID: ' + athlete.id : 'Sin ID');

        // Importar bicis desde el objeto de atleta
        let countFromAthlete = 0;
        if (athlete?.bikes?.length) {
          setProgress(`Importando ${athlete.bikes.length} bicis del perfil...`);
          console.log(`🔄 Importando ${athlete.bikes.length} bicis desde el perfil del atleta...`);
          
          for (const gear of athlete.bikes) {
            console.log(`Procesando bici: ${gear.name} (${gear.id})`);
            const { error } = await supabase.from('bikes').upsert({
              user_id: user.id,
              strava_id: gear.id,
              name: gear.name,
              type: gear.frame_type === 1 ? 'Road' : 'Other',
              total_distance: gear.distance || 0,
              image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
            });
            
            if (!error) {
              countFromAthlete++;
              console.log(`✅ Bici importada: ${gear.name}`);
            } else {
              console.error(`❌ Error importando bici ${gear.name}:`, error);
            }
          }
        }

        // Importar bicis desde actividades recientes
        setProgress('Analizando actividades recientes...');
        console.log('🔄 Importando bicis desde actividades recientes...');
        const countFromActivities = await importBikesFromActivities(user.id, tokenData.access_token);

        console.log(`📦 Bicis importadas desde atleta: ${countFromAthlete}`);
        console.log(`📦 Bicis importadas desde actividades: ${countFromActivities}`);

        toast({
          title: '¡Conexión exitosa!',
          description: `Se importaron ${countFromAthlete + countFromActivities} bicicletas de Strava.`,
        });

        setProgress('Redirigiendo...');
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
          <p className="text-sm text-muted-foreground mt-2">{progress}</p>
        </div>
      ) : (
        <p className="text-muted">Redirigiendo...</p>
      )}
    </div>
  );
};

export default StravaCallback;
