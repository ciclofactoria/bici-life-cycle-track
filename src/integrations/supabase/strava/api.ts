
import { supabase } from '@/integrations/supabase/client';

/**
 * Intercambia el código de autorización por un token de acceso a Strava
 * Esta función ahora hace la llamada directamente a la API de Strava
 */
export const exchangeToken = async (code: string) => {
  try {
    // Realiza la llamada directamente a la API de Strava
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '157332',
        client_secret: 'a09a8b6e85b7a0c5c622fcbf97b1922c8e1bd864',
        code: code,
        grant_type: 'authorization_code'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en respuesta directa de token:', errorData);
      throw new Error(errorData.message || `Error ${response.status} al intercambiar token`);
    }
    
    const data = await response.json();
    
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
    console.log('Obteniendo datos del atleta con token:', accessToken.substring(0, 5) + '...');
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status} al obtener datos del atleta. Respuesta:`, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Error ${response.status} al obtener datos del atleta`);
    }
    
    const data = await response.json();
    console.log('Datos del atleta recibidos correctamente');
    return data;
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
    console.log(`Obteniendo actividades del atleta (página ${page}, ${perPage} por página)`);
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status} al obtener actividades. Respuesta:`, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Error ${response.status} al obtener actividades`);
    }
    
    const data = await response.json();
    console.log(`Recibidas ${data.length} actividades`);
    return data;
  } catch (err: any) {
    console.error('Error en getAthleteActivities:', err);
    throw new Error(err.message || 'Error al obtener actividades');
  }
};
