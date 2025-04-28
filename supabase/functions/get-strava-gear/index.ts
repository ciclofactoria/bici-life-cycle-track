
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
    
    if (!access_token) {
      throw new Error('Access token is required')
    }

    const response = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Strava API error: ${data.message || 'Failed to fetch athlete data'}`)
    }

    // Extract only the bikes array from the athlete data
    return new Response(JSON.stringify({ gear: data.bikes || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
