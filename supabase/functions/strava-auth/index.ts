
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || "https://tyqmfhtfvrffkaqttbcf.supabase.co"
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cW1maHRmdnJmZmthcXR0YmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODQ3NjgsImV4cCI6MjA2MTM2MDc2OH0.yQvXxJe4SYcBDyIqKOg0Vl-4nyV3VF8EK3bplFr0SzU"

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData = await req.json()
    const { code, user_id, redirect_uri } = requestData
    
    console.log("Strava auth function llamada con:", { 
      code: code ? "PRESENTE" : "MISSING", 
      user_id: user_id || "MISSING",
      redirect_uri: redirect_uri || "MISSING (usando default)"
    })

    // HARDCODED ID Y SECRET - para evitar problemas con la encriptación
    // En un entorno real usaríamos los secrets correctamente 
    const STRAVA_CLIENT_ID = "157332";
    const STRAVA_CLIENT_SECRET = "a09a8b6e85b7a0c5c622fcbf97b1922c8e1bd864";
    
    // Verificar que tenemos las credenciales
    console.log("Información de credenciales de Strava:", { 
      clientIdPresenteHardcoded: Boolean(STRAVA_CLIENT_ID),
      clientId: STRAVA_CLIENT_ID,
      secretPresenteHardcoded: Boolean(STRAVA_CLIENT_SECRET),
      secretLength: STRAVA_CLIENT_SECRET ? STRAVA_CLIENT_SECRET.length : 0 
    })
    
    // Verificar los secrets del entorno (sin mostrar el contenido completo)
    const envClientId = Deno.env.get('STRAVA_CLIENT_ID');
    const envClientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    
    console.log("Variables de entorno de Strava:", {
      STRAVA_CLIENT_ID_env_presente: Boolean(envClientId),
      STRAVA_CLIENT_ID_env: envClientId || "NO DISPONIBLE",
      STRAVA_CLIENT_SECRET_env_presente: Boolean(envClientSecret),
      STRAVA_CLIENT_SECRET_env_length: envClientSecret ? envClientSecret.length : 0
    });
    
    if (!code || !user_id) {
      console.error("Faltan parámetros requeridos:", { code: Boolean(code), user_id: Boolean(user_id) })
      return new Response(
        JSON.stringify({ error: 'Code y user_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      console.error("Faltan credenciales de API de Strava en variables de entorno", { 
        hasClientId: Boolean(STRAVA_CLIENT_ID), 
        hasClientSecret: Boolean(STRAVA_CLIENT_SECRET) 
      })
      return new Response(
        JSON.stringify({ 
          error: 'Credenciales de API de Strava no configuradas',
          details: {
            STRAVA_CLIENT_ID_presente: Boolean(STRAVA_CLIENT_ID),
            STRAVA_CLIENT_SECRET_presente: Boolean(STRAVA_CLIENT_SECRET)
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Intercambiando código por token con API de Strava")
    
    // Preparar el cuerpo de la solicitud para el token
    const tokenRequestBody = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    }
    
    // Si se proporcionó un redirect_uri, incluirlo en la solicitud
    if (redirect_uri) {
      console.log("Usando redirect_uri proporcionado:", redirect_uri)
      tokenRequestBody.redirect_uri = redirect_uri
    }
    
    console.log("Cuerpo de solicitud de token:", {
      ...tokenRequestBody,
      client_secret: "[OCULTO]"
    })
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequestBody),
    })

    const tokenResponseText = await tokenResponse.text()
    console.log("Respuesta texto completa:", tokenResponseText)
    
    let tokenData
    
    try {
      tokenData = JSON.parse(tokenResponseText)
      console.log("Respuesta del token (status):", tokenResponse.status)
    } catch (e) {
      console.error("Error al analizar la respuesta del token:", e)
      console.log("Texto de respuesta del token:", tokenResponseText)
      return new Response(
        JSON.stringify({ 
          error: 'Falló al analizar la respuesta del token',
          rawResponse: tokenResponseText,
          status: tokenResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!tokenResponse.ok) {
      console.error('Error intercambiando código por token:', tokenData)
      return new Response(
        JSON.stringify({ 
          error: 'Falló al intercambiar código por token',
          details: tokenData.error || tokenData.message || 'Error desconocido de API de Strava',
          status: tokenResponse.status,
          requestBody: {
            client_id: STRAVA_CLIENT_ID,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirect_uri || undefined
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Token recibido correctamente de Strava")
    
    // Log de la respuesta de token (sin mostrar tokens completos)
    console.log("Resumen de respuesta de token:", {
      access_token_presente: Boolean(tokenData.access_token),
      access_token_primeros_chars: tokenData.access_token ? tokenData.access_token.substring(0, 5) + "..." : "MISSING",
      refresh_token_presente: Boolean(tokenData.refresh_token),
      expires_at_presente: Boolean(tokenData.expires_at),
      athlete_presente: Boolean(tokenData.athlete),
      athlete_id: tokenData.athlete?.id || "MISSING"
    })
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Check if profiles table exists and if not, create it
    const { error: checkError, data: checkData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .limit(1)

    if (checkError) {
      console.error('Error comprobando tabla de perfiles:', checkError)
      
      // Attempt to create profiles table if needed
      try {
        const { error: createProfileError } = await supabase.rpc('create_profile_if_not_exists', {
          user_id: user_id,
          user_email: 'unknown@example.com' // We don't have the email here, will be updated later
        })
        
        if (createProfileError) {
          console.error('Error creando perfil:', createProfileError)
          throw createProfileError
        }
      } catch (createError) {
        console.error('Excepción creando perfil:', createError)
      }
    }

    // Update user profile with Strava tokens
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        strava_connected: true,
        strava_access_token: tokenData.access_token,
        strava_refresh_token: tokenData.refresh_token,
        strava_token_expires_at: tokenData.expires_at,
        strava_athlete_id: tokenData.athlete?.id || null
      })
      .eq('id', user_id)

    if (updateError) {
      console.error('Error actualizando perfil:', updateError)
      return new Response(
        JSON.stringify({ error: 'Falló al actualizar perfil', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Fetch user bikes from Strava
    console.log("Obteniendo bicis de API de Strava")
    let importedBikes = 0
    
    try {
      const bikesResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      const athleteData = await bikesResponse.json();
      
      if (!bikesResponse.ok) {
        console.error('Error obteniendo datos de atleta:', athleteData);
      } else if (athleteData.bikes && athleteData.bikes.length > 0) {
        console.log(`Encontradas ${athleteData.bikes.length} bicis en Strava`);
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
            console.error('Error comprobando bici existente:', checkBikeError);
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
              console.error('Error actualizando bici desde Strava:', updateBikeError);
            } else {
              console.log(`Bici actualizada desde Strava: ${bike.name}`);
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
              console.error('Error insertando bici desde Strava:', insertBikeError);
            } else {
              console.log(`Bici importada desde Strava: ${bike.name}`);
            }
          }
        }
      } else {
        console.log('No se encontraron bicis en cuenta de Strava');
      }
    } catch (bikesError) {
      console.error('Excepción obteniendo bicis de Strava:', bikesError);
      // We don't want to fail the entire process if bike import fails
    }

    console.log("Perfil actualizado correctamente con credenciales de Strava")
    
    // Return successful response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cuenta de Strava conectada correctamente y bicis importadas',
        importedBikes: importedBikes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error procesando solicitud:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
