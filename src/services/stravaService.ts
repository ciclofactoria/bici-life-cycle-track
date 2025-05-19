import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { StravaApiClient } from './stravaService/stravaApiClient';

export const exchangeCodeForToken = async (authCode: string, userEmail: string) => {
  // Configuración de cliente y secreto - Estos vendrán de variables de entorno en producción
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
      grant_type: 'authorization_code',
      redirect_uri: 'https://bici-life-cycle-track.lovable.app/strava-callback'
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
  // Use our enhanced client instead
  return await StravaApiClient.getBikes(accessToken);
};

export const importBikesToDatabase = async (userId: string, bikes: any[]) => {
  console.log(`Importando ${bikes.length} bicicletas para el usuario ${userId}`);
  let importedCount = 0;

  for (const bike of bikes) {
    console.log("Importando bicicleta:", bike);

    // Primero verificamos si ya existe esta bicicleta para este usuario
    const { data: existingBike, error: checkError } = await supabase
      .from('bikes')
      .select('id, total_distance')
      .eq('strava_id', bike.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error(`Error al comprobar si la bici ${bike.name || bike.id} ya existe:`, checkError);
      continue;
    }

    try {
      if (existingBike) {
        // Si ya existe, actualizamos los datos (especialmente la distancia)
        console.log(`Bicicleta ${bike.name} ya existe, ID: ${existingBike.id}, actualizando datos...`);
        
        // Actualizamos solo si la nueva distancia es mayor que la existente
        if (bike.distance && (bike.distance > (existingBike.total_distance || 0))) {
          console.log(`Actualizando distancia de ${existingBike.total_distance}m a ${bike.distance}m`);
          
          const { error: updateError } = await supabase
            .from('bikes')
            .update({
              name: bike.name,
              total_distance: bike.distance,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBike.id);
            
          if (updateError) {
            console.error(`Error al actualizar bicicleta ${bike.name}:`, updateError);
            continue;
          }
          importedCount++;
        } else {
          console.log(`No se actualizó la distancia porque la actual (${existingBike.total_distance}m) es mayor o igual que la nueva (${bike.distance || 0}m)`);
          importedCount++; // Consideramos como "importada" aunque no haya cambios
        }
      } else {
        // Si no existe, la insertamos
        console.log(`Insertando nueva bici: ${bike.name} con ${bike.distance || 0}m`);
        
        const { error: insertError } = await supabase
          .from('bikes')
          .insert({
            name: bike.name || `Bicicleta ${bike.id.substring(0, 6)}`,
            type: bike.type || 'Road',
            strava_id: bike.id,
            user_id: userId,
            total_distance: bike.distance || 0,
            image: bike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
          });
          
        if (insertError) {
          console.error(`Error al insertar bicicleta ${bike.name}:`, insertError);
          continue;
        }
        importedCount++;
      }
      
      console.log(`Bicicleta ${bike.name} procesada correctamente`);
    } catch (err) {
      console.error(`Error al procesar bicicleta ${bike.name}:`, err);
    }
  }

  console.log(`Se importaron/actualizaron ${importedCount} de ${bikes.length} bicicletas`);
  return importedCount;
};

export const refreshStravaToken = async (email: string) => {
  // Use our enhanced client instead
  return await StravaApiClient.refreshToken(email);
};

// Función para manejar la desconexión de Strava
export const disconnectStrava = async (userId: string) => {
  if (!userId) {
    throw new Error("ID de usuario requerido para desconectar Strava");
  }
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        strava_connected: false,
        strava_access_token: null,
        strava_refresh_token: null,
        strava_token_expires_at: null,
        strava_athlete_id: null
      })
      .eq('id', userId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    console.error("Error al desconectar Strava:", err);
    throw err;
  }
};
