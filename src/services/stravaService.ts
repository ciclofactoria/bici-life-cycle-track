
import { supabase } from '@/integrations/supabase/client';

export const exchangeCodeForToken = async (authCode: string, userEmail: string) => {
  // Configuración de cliente y secreto
  const clientId = '157332';
  const clientSecret = '38c60b9891cea2fb7053e185750c5345fab850f5';
  
  console.log("Realizando intercambio de código por token");
  console.log("Usando código de autorización:", authCode.substring(0, 5) + "...");
  
  // Realizar el intercambio de código por token
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      grant_type: 'authorization_code'
    })
  });
  
  const responseText = await response.text();
  console.log("Respuesta bruta de intercambio:", responseText);
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Error al parsear respuesta: ${responseText}`);
  }
  
  if (!response.ok) {
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Error: ${data.errors[0].resource} - ${data.errors[0].field} - ${data.errors[0].code}`);
    } else {
      throw new Error(`Error: ${data.message || JSON.stringify(data)} (Status: ${response.status})`);
    }
  }
  
  return data;
};

export const saveStravaToken = async (userId: string, userEmail: string, data: any) => {
  // Guardar el token en Supabase
  const { error: saveError } = await supabase.functions.invoke('save-strava-token', {
    body: {
      email: userEmail,
      strava_user_id: data.athlete?.id?.toString(),
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at
    }
  });
  
  if (saveError) {
    throw new Error(`Error al guardar token: ${saveError.message}`);
  }
};

export const getStravaBikes = async (accessToken: string) => {
  // Obtener bicicletas con el token
  console.log("Obteniendo bicicletas con el token:", accessToken.substring(0, 5) + "...");
  
  try {
    const { data, error } = await supabase.functions.invoke('get-strava-gear', {
      body: { access_token: accessToken }
    });
    
    if (error) {
      console.error("Error en la función get-strava-gear:", error);
      throw new Error(`Error al obtener bicicletas: ${error.message}`);
    }
    
    if (!data) {
      console.error("No se recibieron datos de get-strava-gear");
      return [];
    }
    
    if (!data.gear || !Array.isArray(data.gear)) {
      console.error("Formato de datos incorrecto:", data);
      return [];
    }
    
    console.log(`Se encontraron ${data.gear.length} bicicletas desde get-strava-gear:`, data.gear);
    return data.gear || [];
  } catch (err) {
    console.error("Error al obtener bicicletas de Strava:", err);
    throw err;
  }
};

export const importBikesToDatabase = async (userId: string, bikes: any[]) => {
  console.log(`Importando ${bikes.length} bicicletas para el usuario ${userId}`);
  let importedCount = 0;

  for (const bike of bikes) {
    console.log("Importando bicicleta:", bike);

    const { error } = await supabase
      .from('bikes')
      .upsert({
        name: bike.name || `Bicicleta ${bike.id}`,
        type: bike.type || 'Road',
        strava_id: bike.id,
        total_distance: bike.distance || 0,
        image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
        user_id: userId // 👈 AÑADIDO para cumplir la Policy de seguridad
      });

    if (!error) {
      importedCount++;
      console.log(`Bicicleta ${bike.name || bike.id} importada correctamente`);
    } else {
      console.error(`Error al importar bicicleta ${bike.name || bike.id}:`, error);
    }
  }

  console.log(`Se importaron ${importedCount} de ${bikes.length} bicicletas`);
  return importedCount;
};
