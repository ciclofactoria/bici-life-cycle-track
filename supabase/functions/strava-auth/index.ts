
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
    
    // Get Strava API credentials from environment variables
    const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
    const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
    
    console.log("Strava auth function called with:", { 
      code: code ? "PRESENT" : "MISSING", 
      user_id,
      hasClientId: Boolean(STRAVA_CLIENT_ID), 
      clientIdFirstChars: STRAVA_CLIENT_ID ? STRAVA_CLIENT_ID.substring(0, 5) + "..." : "MISSING",
      hasClientSecret: Boolean(STRAVA_CLIENT_SECRET),
      clientSecretLength: STRAVA_CLIENT_SECRET ? STRAVA_CLIENT_SECRET.length : 0
    })
    
    if (!code || !user_id) {
      console.error("Missing required parameters:", { code: Boolean(code), user_id: Boolean(user_id) })
      return new Response(
        JSON.stringify({ error: 'Code and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      console.error("Missing Strava API credentials in environment variables", { 
        hasClientId: Boolean(STRAVA_CLIENT_ID), 
        hasClientSecret: Boolean(STRAVA_CLIENT_SECRET) 
      })
      return new Response(
        JSON.stringify({ 
          error: 'Strava API credentials not configured',
          details: {
            STRAVA_CLIENT_ID: Boolean(STRAVA_CLIENT_ID),
            STRAVA_CLIENT_SECRET: Boolean(STRAVA_CLIENT_SECRET)
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Exchanging code for token with Strava API")
    
    // Exchange code for tokens - IMPORTANT: DO NOT send redirect_uri in token exchange
    // Strava doesn't expect the redirect_uri during token exchange, only during authorization
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

    const tokenData = await tokenResponse.json()
    
    console.log("Token response status:", tokenResponse.status)
    
    if (!tokenResponse.ok) {
      console.error('Error exchanging code for token:', tokenData)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to exchange code for token',
          details: tokenData.error || tokenData.message || 'Unknown error from Strava API',
          status: tokenResponse.status,
          requestBody: {
            client_id: STRAVA_CLIENT_ID,
            code: code,
            grant_type: 'authorization_code'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Successfully received tokens from Strava")
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Check if profiles table exists and if not, create it
    const { error: checkError, data: checkData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .limit(1)

    if (checkError) {
      console.error('Error checking profiles table:', checkError)
      
      // Attempt to create profiles table if needed
      try {
        const { error: createProfileError } = await supabase.rpc('create_profile_if_not_exists', {
          user_id: user_id,
          user_email: 'unknown@example.com' // We don't have the email here, will be updated later
        })
        
        if (createProfileError) {
          console.error('Error creating profile:', createProfileError)
          throw createProfileError
        }
      } catch (createError) {
        console.error('Exception creating profile:', createError)
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
      console.error('Error updating profile:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Profile updated successfully with Strava credentials")
    
    // Return successful response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Strava account connected successfully'
      }),
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
