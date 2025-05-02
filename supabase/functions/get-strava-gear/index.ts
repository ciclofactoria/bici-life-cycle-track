
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función de registro con timestamp para mejor seguimiento
function logEvent(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] GET-STRAVA-GEAR: ${message}`, JSON.stringify(data));
}

serve(async (req) => {
  // Para registrar cada llamada a la función
  const requestId = crypto.randomUUID();
  logEvent(`Función invocada (ID: ${requestId})`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logEvent(`Solicitud CORS OPTIONS recibida (ID: ${requestId})`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { access_token } = await req.json()
    
    logEvent(`Solicitud recibida con token`, { 
      request_id: requestId,
      token_presente: Boolean(access_token),
      token_preview: access_token ? `${access_token.substring(0, 5)}...` : "token faltante" 
    });
    
    if (!access_token) {
      logEvent(`Error: Access token requerido pero no proporcionado (ID: ${requestId})`);
      throw new Error('Access token is required')
    }

    logEvent(`Llamando a API de Strava para obtener datos de atleta (ID: ${requestId})`);
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    const responseText = await response.text();
    logEvent(`Respuesta bruta recibida de Strava (ID: ${requestId})`, {
      status: response.status,
      response_length: responseText.length
    });
    
    let data;
    try {
      data = JSON.parse(responseText);
      
      // Let's extract scope information from the headers to help with debugging
      const scopesHeader = response.headers.get('x-oauth-scopes');
      
      logEvent(`Análisis de respuesta de Strava exitoso (ID: ${requestId})`, {
        status: response.status,
        ok: response.ok,
        id: data.id || "faltante",
        username: data.username || "faltante",
        firstname: data.firstname || "faltante",
        lastname: data.lastname || "faltante",
        has_bikes: Boolean(data.bikes) && Array.isArray(data.bikes),
        bike_count: data.bikes ? data.bikes.length : 0,
        scopes_from_header: scopesHeader || "no encontrado en headers"
      });
      
      if (data.bikes && data.bikes.length > 0) {
        logEvent(`Bicis encontradas (ID: ${requestId})`, {
          count: data.bikes.length,
          bikes: data.bikes.map(bike => ({
            id: bike.id,
            name: bike.name,
            type: bike.type || "Unknown",
            distance: bike.distance || 0
          }))
        });
      } else {
        logEvent(`No se encontraron bicis en datos de atleta (ID: ${requestId}). Verificar si profile:read_all scope está autorizado.`);
        
        // Print the resource state to understand what permissions we have
        logEvent(`Estado de recurso: ${data.resource_state || "desconocido"}`, {
          scopes: scopesHeader || "no disponible en headers",
          full_response: {
            id: data.id,
            username: data.username,
            resource_state: data.resource_state
          }
        });
      }
    } catch (error) {
      logEvent(`Error parseando respuesta de Strava: ${error.message} (ID: ${requestId})`);
      throw new Error(`Error parsing Strava response: ${responseText}`);
    }

    if (!response.ok) {
      logEvent(`Error de API de Strava (ID: ${requestId})`, {
        status: response.status,
        message: data.message || "Error desconocido"
      });
      throw new Error(`Strava API error: ${data.message || 'Failed to fetch athlete data'} (Status: ${response.status})`)
    }

    // Add default placeholder images to bikes that don't have images
    let bikesList = data.bikes || [];
    bikesList = bikesList.map((bike: any) => {
      return {
        ...bike,
        image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60'
      }
    });

    // Extract only the bikes array from the athlete data
    // Make sure we return a consistent structure even if no bikes are found
    const result = { 
      gear: bikesList,
      message: bikesList.length > 0 
        ? `Se encontraron ${bikesList.length} bicicletas en tu cuenta de Strava` 
        : 'No se encontraron bicicletas en tu cuenta de Strava. Asegúrate de tener el permiso profile:read_all activado.',
      request_id: requestId
    };
    
    logEvent(`Finalizando solicitud con éxito (ID: ${requestId})`, {
      bikes_count: result.gear.length,
      message: result.message
    });
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    logEvent(`Error en get-strava-gear: ${error.message || "Error desconocido"} (ID: ${requestId})`);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Error al obtener bicicletas de Strava. Verifica que has autorizado el permiso profile:read_all.",
      request_id: requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
