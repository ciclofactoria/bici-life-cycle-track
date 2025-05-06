
import { supabase } from '@/integrations/supabase/client';

/**
 * Intercambia el código de autorización por un token de acceso a Strava
 * Esta función ahora hace la llamada directamente a la API de Strava
 */
export const exchangeToken = async (code: string) => {
  try {
    console.log('Exchange token iniciado con código', code.substring(0, 5) + '...');
    
    // Realiza la llamada directamente a la API de Strava con el secreto actualizado
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '157332',
        client_secret: '38c60b9891cea2fb7053e185750c5345fab850f5',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:8080/strava-callback' // Actualizado a la nueva URL
      })
    });
    
    console.log('Respuesta de Strava status:', response.status);
    const responseText = await response.text();
    console.log('Respuesta bruta de Strava:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      
      // Log scopes that were authorized
      if (data.scope) {
        console.log('Scopes autorizados:', data.scope);
        
        // Verificar si tenemos el scope necesario para ver las bicis
        const hasProfileReadAll = data.scope.includes('profile:read_all');
        console.log('¿Tiene permiso profile:read_all?', hasProfileReadAll ? 'SÍ' : 'NO');
        
        if (!hasProfileReadAll) {
          console.warn('⚠️ ¡No se ha autorizado el scope profile:read_all! No se podrán obtener las bicis');
        }
      }
    } catch (e) {
      console.error('Error al parsear respuesta:', e);
      throw new Error(`Error al procesar la respuesta: ${responseText}`);
    }
    
    if (!response.ok) {
      console.error('Error en respuesta directa de token:', data);
      throw new Error(data.message || data.error || `Error ${response.status} al intercambiar token`);
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
