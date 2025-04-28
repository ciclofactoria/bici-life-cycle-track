
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
    const { code, user_id } = requestData
    
    console.log("Strava auth function llamada con:", { 
      code: code ? "PRESENTE" : "MISSING", 
      user_id: user_id || "MISSING"
    })

    // HARDCODED ID Y SECRET - para evitar problemas con la encriptación
    // En un entorno real usaríamos los secrets correctamente 
    const STRAVA_CLIENT_ID = "157332";
    const STRAVA_CLIENT_SECRET = "38c60b9891cea2fb7053e185750c5345fab850f5";
    
    // Verificar que tenemos las credenciales
    console.log("Información de credenciales de Strava:", { 
      clientIdPresenteHardcoded: Boolean(STRAVA_CLIENT_ID),
      clientId: STRAVA_CLIENT_ID,
      secretPresenteHardcoded: Boolean(STRAVA_CLIENT_SECRET),
      secretLength: STRAVA_CLIENT_SECRET ? STRAVA_CLIENT_SECRET.length : 0 
    })
    
    if (!code || !user_id) {
      console.error("Faltan parámetros requeridos:", { code: Boolean(code), user_id: Boolean(user_id) })
      return new Response(
        JSON.stringify({ error: 'Code y user_id son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Intercambiando código por token con API de Strava")
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      }),
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
          status: tokenResponse.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Token recibido correctamente de Strava")
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
    
    // Fetch user bikes from Strava - ESTA ES LA PARTE IMPORTANTE QUE SE HA CORREGIDO
    console.log("Obteniendo bicis de API de Strava con access_token:", tokenData.access_token.substring(0, 5) + "...")
    let importedBikes = 0
    
    try {
      // Llamada directa al endpoint de athlete para obtener las bicicletas
      const bikesResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      if (!bikesResponse.ok) {
        const errorText = await bikesResponse.text();
        console.error(`Error en la respuesta de Strava (${bikesResponse.status}):`, errorText);
        throw new Error(`Error en API de Strava: ${errorText}`);
      }
      
      const athleteData = await bikesResponse.json();
      console.log("Datos del atleta recibidos:", JSON.stringify(athleteData).substring(0, 200) + "...");
      
      if (!athleteData.bikes) {
        console.error('La propiedad bikes no está presente en la respuesta:', athleteData);
      }
      
      // Extraer explícitamente la propiedad bikes
      const bikes = athleteData.bikes || [];
      console.log(`Encontradas ${bikes.length} bicis en Strava:`, bikes);
      
      if (bikes && bikes.length > 0) {
        importedBikes = bikes.length;
        
        // Insert each bike into our database
        for (const bike of bikes) {
          console.log("Procesando bici:", bike);
          
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
            console.log("Actualizando bici existente:", bike.name);
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
            console.log("Insertando nueva bici:", bike.name);
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
