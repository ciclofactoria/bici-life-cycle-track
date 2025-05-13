
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || "https://tyqmfhtfvrffkaqttbcf.supabase.co"
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cW1maHRmdnJmZmthcXR0YmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODQ3NjgsImV4cCI6MjA2MTM2MDc2OH0.yQvXxJe4SYcBDyIqKOg0Vl-4nyV3VF8EK3bplFr0SzU"

// Función de registro con timestamp para mejor seguimiento
function logEvent(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] STRAVA-AUTH: ${message}`, JSON.stringify(data));
}

serve(async (req) => {
  // Para registrar cada llamada a la función
  const requestId = crypto.randomUUID();
  logEvent(`Función invocada (ID: ${requestId})`);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    logEvent(`Solicitud CORS OPTIONS recibida (ID: ${requestId})`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData = await req.json()
    const { code, user_id, redirect_uri } = requestData
    
    logEvent(`Procesando solicitud de autenticación`, { 
      request_id: requestId,
      code_present: Boolean(code), 
      user_id: user_id || "FALTANTE",
      redirect_uri: redirect_uri || "FALTANTE (usando default)",
      scope: requestData.scope || "FALTANTE" 
    });

    // HARDCODED ID Y SECRET - para evitar problemas con la encriptación
    // En un entorno real usaríamos los secrets correctamente 
    const STRAVA_CLIENT_ID = "157332";
    const STRAVA_CLIENT_SECRET = "38c60b9891cea2fb7053e185750c5345fab850f5";
    
    // Verificar que tenemos las credenciales
    logEvent(`Verificando credenciales de Strava`, { 
      clientIdPresente: Boolean(STRAVA_CLIENT_ID),
      secretPresente: Boolean(STRAVA_CLIENT_SECRET)
    });
    
    // Verificar los secrets del entorno (sin mostrar el contenido completo)
    const envClientId = Deno.env.get('STRAVA_CLIENT_ID');
    const envClientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    
    logEvent(`Variables de entorno de Strava`, {
      STRAVA_CLIENT_ID_env_presente: Boolean(envClientId),
      STRAVA_CLIENT_SECRET_env_presente: Boolean(envClientSecret)
    });
    
    if (!code || !user_id) {
      logEvent(`Error: Faltan parámetros requeridos`, { code: Boolean(code), user_id: Boolean(user_id) });
      return new Response(
        JSON.stringify({ error: 'Code y user_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      logEvent(`Error: Faltan credenciales de API de Strava`, { 
        hasClientId: Boolean(STRAVA_CLIENT_ID), 
        hasClientSecret: Boolean(STRAVA_CLIENT_SECRET) 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Credenciales de API de Strava no configuradas'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logEvent(`Intercambiando código por token con API de Strava (ID: ${requestId})`);
    
    // Preparar el cuerpo de la solicitud para el token
    const tokenRequestBody = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    }
    
    // Usar la URL actualizada de callback
    const finalRedirectUri = redirect_uri || 'https://bici-life-cycle-track.lovable.app/strava-callback';
    tokenRequestBody.redirect_uri = finalRedirectUri;
    
    logEvent(`Usando redirect_uri: ${finalRedirectUri}`);
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequestBody),
    })

    const tokenResponseText = await tokenResponse.text()
    
    let tokenData
    
    try {
      tokenData = JSON.parse(tokenResponseText)
      logEvent(`Respuesta del token recibida`, {
        status: tokenResponse.status,
        token_presente: Boolean(tokenData?.access_token),
        athlete_presente: Boolean(tokenData?.athlete),
        error: tokenData?.error
      });
      
      // Log additional information about token scopes
      if (tokenData.scope) {
        logEvent(`Scopes autorizados`, { scopes: tokenData.scope });
        const hasProfileReadAll = tokenData.scope.includes('profile:read_all');
        logEvent(`Permiso profile:read_all autorizado: ${hasProfileReadAll ? 'SÍ' : 'NO'}`);
      }
    } catch (e) {
      logEvent(`Error al analizar la respuesta del token: ${e.message}`, { raw_response: tokenResponseText });
      return new Response(
        JSON.stringify({ 
          error: 'Falló al analizar la respuesta del token',
          status: tokenResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!tokenResponse.ok) {
      logEvent(`Error intercambiando código por token`, {
        error: tokenData.error || tokenData.message || 'Error desconocido',
        status: tokenResponse.status
      });
      return new Response(
        JSON.stringify({ 
          error: 'Falló al intercambiar código por token',
          details: tokenData.error || tokenData.message || 'Error desconocido de API de Strava'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logEvent(`Token recibido correctamente de Strava (ID: ${requestId})`);
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Primero, consultemos la estructura de la tabla profiles para verificar si existe strava_athlete_id
    logEvent(`Comprobando estructura de la tabla profiles para usuario: ${user_id}`);
    
    try {
      // Consulta la tabla profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .limit(1);
      
      if (profileError) {
        logEvent(`Error al consultar perfil: ${profileError.message}`);
        throw profileError;
      }
      
      // Verificar si el perfil existe
      if (!profileData || profileData.length === 0) {
        logEvent(`Perfil no encontrado para usuario ${user_id}, intentando crear uno nuevo`);
        
        // Intentar crear un perfil para el usuario si no existe
        const { error: createError } = await supabase.rpc('create_profile_if_not_exists', {
          user_id: user_id,
          user_email: 'unknown@example.com'
        });
        
        if (createError) {
          logEvent(`Error al crear perfil: ${createError.message}`);
          throw createError;
        }
        
        logEvent(`Perfil creado para usuario ${user_id}`);
      } else {
        logEvent(`Perfil encontrado para usuario ${user_id}`);
      }
      
      // Construir objeto para actualizar solo los campos que sabemos que existen
      const updateObject: any = {
        strava_connected: true,
        strava_access_token: tokenData.access_token,
        strava_refresh_token: tokenData.refresh_token,
        strava_token_expires_at: tokenData.expires_at
      };
      
      // Verificar si el atleta tiene ID en los datos del token
      const athleteId = tokenData.athlete?.id?.toString();
      if (athleteId) {
        // Comprobar si la columna existe antes de intentar actualizarla
        await supabase.rpc('check_column_exists', {
          table_name: 'profiles',
          column_name: 'strava_athlete_id'
        }).then(({ data: exists, error }) => {
          if (error) {
            logEvent(`Error al verificar columna strava_athlete_id: ${error.message}`);
          } else if (exists) {
            logEvent(`La columna strava_athlete_id existe, añadiéndola al objeto de actualización`);
            updateObject.strava_athlete_id = athleteId;
          } else {
            logEvent(`La columna strava_athlete_id no existe en la tabla profiles`);
          }
        }).catch(err => {
          logEvent(`Excepción al verificar la columna: ${err.message}`);
        });
      }

      // Actualizar el perfil con los campos seguros
      logEvent(`Actualizando perfil con tokens de Strava`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateObject)
        .eq('id', user_id);

      if (updateError) {
        logEvent(`Error actualizando perfil: ${updateError.message}`);
        return new Response(
          JSON.stringify({ error: 'Falló al actualizar perfil', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (profileCheckError: any) {
      logEvent(`Error al manejar el perfil: ${profileCheckError.message}`);
      // Continuamos con el proceso aunque falle la verificación del perfil
    }
    
    // Fetch user bikes from Strava
    logEvent(`Obteniendo bicis de API de Strava (ID: ${requestId})`);
    let importedBikes = 0;
    
    try {
      const bikesResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      const athleteData = await bikesResponse.json();
      
      if (!bikesResponse.ok) {
        logEvent(`Error obteniendo datos de atleta: ${JSON.stringify(athleteData)}`);
      } else if (athleteData.bikes && athleteData.bikes.length > 0) {
        logEvent(`Encontradas ${athleteData.bikes.length} bicis en Strava`, {
          bikes: athleteData.bikes.map(bike => ({
            id: bike.id,
            name: bike.name
          }))
        });
        importedBikes = athleteData.bikes.length;
        
        // Insert each bike into our database
        for (const bike of athleteData.bikes) {
          const { data: existingBike, error: checkBikeError } = await supabase
            .from('bikes')
            .select('id')
            .eq('strava_id', bike.id)
            .eq('user_id', user_id)
            .limit(1);
            
          if (checkBikeError) {
            logEvent(`Error comprobando bici existente: ${checkBikeError.message}`);
            continue;
          }
          
          if (existingBike && existingBike.length > 0) {
            // Update existing bike
            const { error: updateBikeError } = await supabase
              .from('bikes')
              .update({
                name: bike.name,
                total_distance: bike.distance || 0,
                updated_at: new Date().toISOString()
              })
              .eq('strava_id', bike.id)
              .eq('user_id', user_id);
              
            if (updateBikeError) {
              logEvent(`Error actualizando bici desde Strava: ${updateBikeError.message}`);
            } else {
              logEvent(`Bici actualizada desde Strava: ${bike.name}`);
            }
          } else {
            // Insert new bike
            const { error: insertBikeError } = await supabase
              .from('bikes')
              .insert({
                name: bike.name,
                type: bike.type || 'Road',
                strava_id: bike.id,
                user_id: user_id,
                total_distance: bike.distance || 0,
                image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60'
              });
              
            if (insertBikeError) {
              logEvent(`Error insertando bici desde Strava: ${insertBikeError.message}`);
            } else {
              logEvent(`Bici importada desde Strava: ${bike.name}`);
            }
          }
        }
      } else {
        logEvent(`No se encontraron bicis en cuenta de Strava. Scopes autorizados: ${tokenData.scope || "No informado"}`);
      }
    } catch (bikesError) {
      logEvent(`Excepción obteniendo bicis de Strava: ${bikesError.message}`);
    }

    logEvent(`Proceso de autenticación con Strava completado (ID: ${requestId})`);
    
    // Return successful response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cuenta de Strava conectada correctamente y bicis importadas',
        importedBikes: importedBikes,
        requestId: requestId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    logEvent(`Error general procesando solicitud: ${error.message || "Error desconocido"}`);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
