
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { access_token } = await req.json()
    
    console.log("Edge Function get-strava-gear called with token:", 
      access_token ? `${access_token.substring(0, 5)}...` : "token missing");
    
    if (!access_token) {
      throw new Error('Access token is required')
    }

    console.log("Calling Strava API to get athlete data with profile:read_all scope");
    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    const responseText = await response.text();
    console.log("Raw response from Strava API:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      
      console.log("Parsed Strava API response:", {
        status: response.status,
        ok: response.ok,
        id: data.id || "missing",
        username: data.username || "missing",
        firstname: data.firstname || "missing",
        lastname: data.lastname || "missing",
        has_bikes: Boolean(data.bikes) && Array.isArray(data.bikes),
        bike_count: data.bikes ? data.bikes.length : 0
      });
      
      if (data.bikes && data.bikes.length > 0) {
        console.log("Bikes found:", data.bikes);
      } else {
        console.log("No bikes found in athlete data. Check if profile:read_all scope is authorized.");
        console.log("Authorized scopes:", data.resource_state || "unknown resource state");
        
        // Print the full response to see what permissions we have
        console.log("Full response to debug permissions:", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error parsing Strava response:", error);
      throw new Error(`Error parsing Strava response: ${responseText}`);
    }

    if (!response.ok) {
      console.error("Strava API error:", {
        status: response.status,
        message: data.message || "Unknown error"
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
        : 'No se encontraron bicicletas en tu cuenta de Strava. Asegúrate de tener el permiso profile:read_all activado.'
    };
    
    console.log(`Returning ${result.gear.length} bikes with consistent format and message: ${result.message}`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Error in get-strava-gear:", error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Error al obtener bicicletas de Strava. Verifica que has autorizado el permiso profile:read_all."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
