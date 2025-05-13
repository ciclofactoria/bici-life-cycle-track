
import { supabase } from '@/integrations/supabase/client';
import { exchangeToken, getAthleteData } from '@/integrations/supabase/strava/api';
import { importBikesFromActivities } from '@/services/stravaService/importBikesFromActivities';
import { getStravaBikes } from '@/services/stravaService';

export interface StravaImportResult {
  totalBikes: number;
  fromAthlete: number;
  fromActivities: number;
  scopes?: string;
}

export const handleAuthError = (error: string | null) => {
  console.error('🔴 Error recibido en callback:', error);
  return `Strava ha rechazado la conexión: ${error}`;
};

export const handleMissingCode = () => {
  console.error('⚠️ No se recibió el código de autorización');
  return 'No se recibió ningún código desde Strava.';
};

export const handleMissingUser = () => {
  return 'Debes estar autenticado para importar tus bicis.';
};

export const processStravaCallback = async (code: string, userId: string): Promise<{
  result: StravaImportResult | null;
  error: string | null;
  status: string;
}> => {
  let status = 'Iniciando conexión...';
  
  try {
    // Intentar llamar directamente a la función strava-auth
    status = 'Llamando a la función strava-auth...';
    console.log('Intentando llamar a strava-auth con código:', code.substring(0, 5) + '...');
    
    try {
      const { data: stravaAuthResult, error: stravaAuthError } = await supabase.functions.invoke('strava-auth', {
        body: {
          code: code,
          user_id: userId,
          redirect_uri: 'https://bici-life-cycle-track.lovable.app/strava-callback'
        }
      });
      
      if (stravaAuthError) {
        console.error('Error al llamar a strava-auth:', stravaAuthError);
      } else if (stravaAuthResult?.success) {
        console.log('Resultado exitoso de strava-auth:', stravaAuthResult);
        return {
          result: {
            totalBikes: stravaAuthResult.importedBikes || 0,
            fromAthlete: stravaAuthResult.importedBikes || 0,
            fromActivities: 0,
            scopes: stravaAuthResult.scopes || ''
          },
          error: null,
          status: 'Importación completada mediante strava-auth'
        };
      }
    } catch (directCallError) {
      console.error('Error en llamada directa a strava-auth:', directCallError);
      // Continuamos con el flujo tradicional si falla la llamada directa
    }
    
    // Si la llamada directa falló, procedemos con el flujo tradicional
    status = 'Intercambiando código por token...';
    console.log('Intercambiando código por token usando flujo tradicional...');
    
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
    }
    
    // Preparar objeto de actualización para el perfil con solo los campos conocidos
    const updateData: any = {
      strava_connected: true,
      strava_access_token: tokenData.access_token,
      strava_refresh_token: tokenData.refresh_token,
      strava_token_expires_at: tokenData.expires_at
    };
    
    // Solo intentar actualizar el ID del atleta si existe en los datos del token
    if (tokenData.athlete?.id) {
      // Primero verificamos si la columna existe en la tabla profiles
      await supabase.rpc('column_exists', {
        p_table_name: 'profiles',
        p_column_name: 'strava_athlete_id'
      }).then(({ data: exists, error }) => {
        if (!error && exists) {
          updateData.strava_athlete_id = tokenData.athlete.id;
        } else {
          console.log('La columna strava_athlete_id no existe o hubo un error al verificarla.');
        }
      }).catch(err => {
        console.error('Error al verificar columna:', err);
      });
    }
    
    // Guardar datos del token en el perfil del usuario
    status = 'Guardando token en perfil de usuario...';
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error actualizando perfil:', updateError);
      throw new Error(`Error al actualizar perfil: ${updateError.message}`);
    }

    // Obtener datos del atleta
    status = 'Obteniendo datos del atleta...';
    const athlete = await getAthleteData(tokenData.access_token);
    console.log('Datos del atleta recibidos:', { 
      id: athlete.id,
      username: athlete.username,
      bikes: athlete.bikes?.length || 0
    });

    // Importar bicis desde el objeto de atleta
    status = 'Importando bicicletas del perfil...';
    let countFromAthlete = 0;
    if (athlete?.bikes?.length) {
      console.log(`Encontradas ${athlete.bikes.length} bicicletas en el perfil de atleta`);
      for (const gear of athlete.bikes) {
        console.log('Importando bicicleta desde datos de atleta:', gear.name);
        const { error } = await supabase.from('bikes').upsert({
          user_id: userId,
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
      status = 'Intentando obtener bicis mediante función Edge...';
      try {
        const stravaBikes = await getStravaBikes(tokenData.access_token);
        if (stravaBikes && stravaBikes.length > 0) {
          console.log(`Obtenidas ${stravaBikes.length} bicis mediante Edge Function`);
          for (const bike of stravaBikes) {
            const { error } = await supabase.from('bikes').upsert({
              user_id: userId,
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
    status = 'Importando desde actividades recientes...';
    const countFromActivities = await importBikesFromActivities(userId, tokenData.access_token);

    console.log(`📦 Bicis importadas desde atleta: ${countFromAthlete}`);
    console.log(`📦 Bicis importadas desde actividades: ${countFromActivities}`);

    const totalImported = countFromAthlete + countFromActivities;
    
    // Guardar el resultado para mostrarlo en la UI
    const result = {
      totalBikes: totalImported,
      fromAthlete: countFromAthlete,
      fromActivities: countFromActivities,
      scopes: authorizedScopes
    };
    
    return { result, error: null, status };
  } catch (err: any) {
    console.error('❌ Error al importar bicis de Strava:', err);
    return { 
      result: null,
      error: err.message || 'Error desconocido al conectar con Strava',
      status
    };
  }
};
