
import { supabase } from '@/integrations/supabase/client';

/**
 * Intercambia el código de autorización por un token de acceso a Strava
 */
export const exchangeToken = async (code: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('strava-auth', {
      body: { 
        code,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }
    });
    
    if (error) {
      console.error('Error en exchangeToken:', error);
      throw new Error(error.message || 'Error al intercambiar el código por token');
    }
    
    if (!data || !data.access_token) {
      throw new Error('No se recibió un token válido');
    }
    
    return data;
  } catch (err: any) {
    console.error('Exception en exchangeToken:', err);
    throw new Error(err.message || 'Error al conectar con Strava');
  }
};

/**
 * Obtiene los datos del atleta desde Strava
 */
export const getAthleteData = async (accessToken: string) => {
  try {
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Error ${response.status} al obtener datos del atleta`);
    }
    
    return await response.json();
  } catch (err: any) {
    console.error('Error en getAthleteData:', err);
    throw new Error(err.message || 'Error al obtener datos del atleta');
  }
};

/**
 * Obtiene las actividades recientes del atleta desde Strava
 */
export const getAthleteActivities = async (accessToken: string, page = 1, perPage = 30) => {
  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Error ${response.status} al obtener actividades`);
    }
    
    return await response.json();
  } catch (err: any) {
    console.error('Error en getAthleteActivities:', err);
    throw new Error(err.message || 'Error al obtener actividades');
  }
};
