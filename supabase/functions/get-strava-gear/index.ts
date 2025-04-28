
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { access_token } = await req.json()
    
    console.log("Edge Function get-strava-gear llamada con token:", 
      access_token ? `${access_token.substring(0, 5)}...` : "token ausente");
    
    if (!access_token) {
      throw new Error('Access token is required')
    }

    console.log("Llamando a API de Strava para obtener datos del atleta");
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    const responseText = await response.text();
    console.log("Respuesta bruta de Strava API:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      
      console.log("Respuesta de Strava API parseada:", {
        status: response.status,
        ok: response.ok,
        id: data.id || "ausente",
        username: data.username || "ausente",
        firstname: data.firstname || "ausente",
        lastname: data.lastname || "ausente",
        tiene_bicis: Boolean(data.bikes) && Array.isArray(data.bikes),
        numero_bicis: data.bikes ? data.bikes.length : 0
      });
      
      if (data.bikes && data.bikes.length > 0) {
        console.log("Bicis encontradas:", data.bikes);
      } else {
        console.log("No se encontraron bicicletas en los datos del atleta");
      }
    } catch (error) {
      console.error("Error al parsear respuesta de Strava:", error);
      throw new Error(`Error al parsear respuesta de Strava: ${responseText}`);
    }

    if (!response.ok) {
      console.error("Error de API de Strava:", {
        status: response.status,
        message: data.message || "Error desconocido"
      });
      throw new Error(`Strava API error: ${data.message || 'Failed to fetch athlete data'} (Status: ${response.status})`)
    }

    // Extract only the bikes array from the athlete data
    const result = { gear: data.bikes || [] };
    console.log(`Devolviendo ${result.gear.length} bicicletas`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Error en get-strava-gear:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
