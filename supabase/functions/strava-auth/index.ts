
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = "https://tyqmfhtfvrffkaqttbcf.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cW1maHRmdnJmZmthcXR0YmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODQ3NjgsImV4cCI6MjA2MTM2MDc2OH0.yQvXxJe4SYcBDyIqKOg0Vl-4nyV3VF8EK3bplFr0SzU"

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData = await req.json()
    const { code, user_id } = requestData
    
    console.log("Strava auth function called with:", { code: "REDACTED", user_id })
    
    if (!code || !user_id) {
      console.error("Missing required parameters:", { code: Boolean(code), user_id: Boolean(user_id) })
      return new Response(
        JSON.stringify({ error: 'Code and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Strava API credentials from environment variables
    const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
    const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
    
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      console.error("Missing Strava API credentials in environment variables")
      return new Response(
        JSON.stringify({ error: 'Strava API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Exchanging code for token with Strava API")
    
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
        grant_type: 'authorization_code',
      }),
    })

    const data = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Error exchanging code for token:', data)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to exchange code for token',
          details: data.error || 'Unknown error from Strava API'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Successfully received tokens from Strava")
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Update user profile with Strava tokens
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        strava_connected: true,
        strava_access_token: data.access_token,
        strava_refresh_token: data.refresh_token,
        strava_token_expires_at: data.expires_at,
        strava_athlete_id: data.athlete?.id || null
      })
      .eq('id', user_id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Profile updated successfully with Strava credentials")
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
