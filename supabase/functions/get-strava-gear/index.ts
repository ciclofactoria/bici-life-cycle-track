
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

    console.log("Calling Strava API to get athlete data");
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
        console.log("No bikes found in athlete data");
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

    // Extract only the bikes array from the athlete data
    const result = { gear: data.bikes || [] };
    console.log(`Returning ${result.gear.length} bikes with consistent format`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Error in get-strava-gear:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
