
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    
    if (!email) {
      throw new Error('Email is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current token data
    const { data: tokenData, error: fetchError } = await supabase
      .from('strava_tokens')
      .select('refresh_token')
      .eq('email', email)
      .single()

    if (fetchError || !tokenData) {
      throw new Error('No token found for this email')
    }

    // Request new access token from Strava
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: Deno.env.get('STRAVA_CLIENT_ID'),
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const stravaData = await response.json()

    if (!response.ok) {
      throw new Error(`Strava API error: ${stravaData.message || 'Failed to refresh token'}`)
    }

    // Update token in database
    const { error: updateError } = await supabase
      .from('strava_tokens')
      .update({
        access_token: stravaData.access_token,
        refresh_token: stravaData.refresh_token,
        expires_at: stravaData.expires_at,
      })
      .eq('email', email)

    if (updateError) throw updateError

    return new Response(JSON.stringify({
      access_token: stravaData.access_token,
      expires_at: stravaData.expires_at,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
