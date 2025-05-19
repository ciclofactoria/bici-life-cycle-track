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

// Helper function to standardize error responses
function errorResponse(message, status = 400, details = null) {
  const errorBody = {
    error: message,
    message: message,
    details: details,
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID()
  };
  
  return new Response(JSON.stringify(errorBody), {
    status: status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
    // Validate request body
    let bodyJson;
    try {
      bodyJson = await req.json();
    } catch (bodyError) {
      logEvent(`Error parsing request body: ${bodyError.message} (ID: ${requestId})`);
      return errorResponse('Invalid request body', 400, { request_id: requestId });
    }
    
    const { access_token } = bodyJson;
    
    logEvent(`Solicitud recibida con token`, { 
      request_id: requestId,
      token_presente: Boolean(access_token),
      token_preview: access_token ? `${access_token.substring(0, 5)}...` : "token faltante" 
    });
    
    if (!access_token) {
      logEvent(`Error: Access token requerido pero no proporcionado (ID: ${requestId})`);
      return errorResponse('Access token is required', 400, { request_id: requestId });
    }

    logEvent(`Llamando a API de Strava para obtener datos de atleta (ID: ${requestId})`);
    
    // Primero obtener los datos principales del atleta
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    const responseText = await response.text();
    logEvent(`Respuesta bruta recibida de Strava (ID: ${requestId})`, {
      status: response.status,
      response_length: responseText.length
    });
    
    let data;
    try {
      data = JSON.parse(responseText);
      
      // Extraer información de scopes del header para debugging
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

      if (!response.ok) {
        if (response.status === 401) {
          logEvent(`Token expirado o inválido. Necesita actualización (ID: ${requestId})`);
          return errorResponse(
            "El token de Strava ha expirado o no es válido. Por favor, reconecta tu cuenta de Strava.",
            401,
            { need_refresh: true, request_id: requestId }
          );
        }
        
        logEvent(`Error de API de Strava (ID: ${requestId})`, {
          status: response.status,
          message: data.message || "Error desconocido"
        });
        
        return errorResponse(
          `Strava API error: ${data.message || 'Failed to fetch athlete data'} (Status: ${response.status})`,
          response.status,
          { request_id: requestId }
        );
      }
      
      if (!data.bikes || data.bikes.length === 0) {
        // Si no tenemos bicicletas, intentemos obtenerlas de otra manera
        logEvent(`No se encontraron bicis en datos de atleta o falta profile:read_all (ID: ${requestId}).`);
        logEvent(`Intentando obtener equipo directamente (ID: ${requestId})`);
        
        // Intentemos obtener el equipo directamente - esto requiere scope read_all
        const gearResponse = await fetch('https://www.strava.com/api/v3/athlete/gear', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });
        
        if (gearResponse.ok) {
          const gearData = await gearResponse.json();
          
          if (gearData && Array.isArray(gearData) && gearData.length > 0) {
            logEvent(`Se encontraron ${gearData.length} bicis en endpoint de equipo (ID: ${requestId})`);
            
            // Filtrar solo las bicis (excluir zapatos, etc.)
            const bikes = gearData.filter(item => item.resource_state === 3 && item.type === 'bike');
            
            if (bikes.length > 0) {
              data.bikes = bikes;
              logEvent(`Se filtraron ${bikes.length} bicis del equipo (ID: ${requestId})`);
            }
          } else {
            logEvent(`No se encontraron bicicletas en endpoint de equipo (ID: ${requestId})`);
          }
        } else {
          logEvent(`Error al consultar endpoint de equipo: ${gearResponse.status} (ID: ${requestId})`);
        }
        
        // Si aún no tenemos bicis, intentemos consultar actividades recientes para extraer IDs de bicis
        if (!data.bikes || data.bikes.length === 0) {
          logEvent(`Intentando extraer bicis de actividades recientes (ID: ${requestId})`);
          
          try {
            const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100', {
              headers: {
                'Authorization': `Bearer ${access_token}`,
              },
            });
            
            if (activitiesResponse.ok) {
              const activities = await activitiesResponse.json();
              
              if (activities && Array.isArray(activities) && activities.length > 0) {
                logEvent(`Se encontraron ${activities.length} actividades para analizar (ID: ${requestId})`);
                
                // Extraer IDs de bicis únicas de las actividades
                const bikeIds = new Set();
                const bikesMap = new Map();
                
                activities.forEach(activity => {
                  if ((activity.type === 'Ride' || activity.type === 'VirtualRide') && activity.gear_id && activity.gear_id.startsWith('b')) {
                    bikeIds.add(activity.gear_id);
                    if (!bikesMap.has(activity.gear_id)) {
                      bikesMap.set(activity.gear_id, {
                        id: activity.gear_id,
                        name: activity.gear_name || `Bike ${activity.gear_id.substring(1, 6)}`,
                        primary: false,
                        distance: 0,
                        activities: 0,
                        type: 'Road', // Valor por defecto
                      });
                    }
                    
                    // Acumular distancia y contar actividades
                    const bikeInfo = bikesMap.get(activity.gear_id);
                    bikeInfo.distance += activity.distance || 0;
                    bikeInfo.activities += 1;
                  }
                });
                
                if (bikesMap.size > 0) {
                  // Convertir el Map a un array para data.bikes
                  data.bikes = Array.from(bikesMap.values());
                  logEvent(`Se extrajeron ${data.bikes.length} bicis de actividades recientes (ID: ${requestId})`);
                } else {
                  logEvent(`No se encontraron bicis en actividades recientes (ID: ${requestId})`);
                }
              }
            } else {
              logEvent(`Error al consultar actividades: ${activitiesResponse.status} (ID: ${requestId})`);
            }
          } catch (activitiesError) {
            logEvent(`Error obteniendo actividades: ${activitiesError.message} (ID: ${requestId})`);
          }
        }
      }
      
      // Log final sobre bicis encontradas
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
        logEvent(`No se encontraron bicis por ningún medio (ID: ${requestId})`);
        
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

    // Add default placeholder images to bikes that don't have images
    let bikesList = data.bikes || [];
    const placeholderImages = [
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=60',
      'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=900&q=60'
    ];
    
    bikesList = bikesList.map((bike: any, index: number) => {
      // Asignar imagen por rotación
      const imageUrl = placeholderImages[index % placeholderImages.length];
      return {
        ...bike,
        image: imageUrl
      }
    });

    // Asegurarse de devolver una estructura consistente
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
    return errorResponse(
      "Error al obtener bicicletas de Strava. Verifica que has autorizado el permiso profile:read_all.",
      500, 
      { request_id: requestId }
    );
  }
})
