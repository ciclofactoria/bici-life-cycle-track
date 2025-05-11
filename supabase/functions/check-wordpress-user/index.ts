
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckUserRequest {
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the WordPress API URL from environment variables
    const wpApiUrl = Deno.env.get('WORDPRESS_API_URL');
    if (!wpApiUrl) {
      throw new Error('WORDPRESS_API_URL environment variable not set');
    }

    const apiKey = "@gkeG@Lgjh(5z!gqbZ83pEy4"; // API Key fija - same as in verify-wordpress-premium

    // Parse the request body to get the email
    const { email }: CheckUserRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking if user with email ${email} exists in WordPress database`);

    // Test mode for emails ending with @wordpress.test
    if (email.toLowerCase().endsWith('@wordpress.test')) {
      console.log('Test email detected, simulating WordPress user existence');
      return new Response(
        JSON.stringify({
          exists: true,
          message: 'Test user exists in WordPress'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    try {
      // Call the WordPress API to check if the user exists
      // The endpoint should be similar to the verify-subscription one but for checking users
      const response = await fetch(`${wpApiUrl}/wp-json/bicicare/v1/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ email }),
      });

      console.log('WordPress API response status:', response.status);
      
      // Handle API errors
      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          console.error('Error from WordPress API:', errorData);
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text();
          console.error('Could not parse error response:', errorText);
        }
        
        // Fallback to check existing endpoint
        console.log('Attempting fallback to verify-subscription endpoint to check user existence');
        const fallbackResponse = await fetch(`${wpApiUrl}/wp-json/bicicare/v1/verify-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ email }),
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback response:', fallbackData);
          
          // If the fallback response contains a message that is not "Usuario no encontrado",
          // we can consider the user exists in WordPress
          if (fallbackData.message && fallbackData.message !== 'Usuario no encontrado') {
            return new Response(
              JSON.stringify({
                exists: true,
                message: 'User exists in WordPress (verified via subscription check)'
              }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
        
        // If both endpoints fail or user not found, return not exists
        console.log('User not found in WordPress or API error');
        return new Response(
          JSON.stringify({
            exists: false,
            message: 'User not found or API error',
            error: `API returned ${response.status}: ${errorText}`
          }),
          { 
            status: 200, // Use 200 to not break the app flow
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const data = await response.json();
      console.log('Response from WordPress:', data);
      
      // Return the WordPress API response
      return new Response(
        JSON.stringify(data),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (fetchError) {
      console.error('Error fetching from WordPress API:', fetchError);
      
      // Return a clearer error message that won't break the app flow
      return new Response(
        JSON.stringify({ 
          exists: false, 
          message: 'Connection error checking WordPress user',
          error: fetchError.message 
        }),
        { 
          status: 200, // We use 200 to keep the app running
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error checking WordPress user:', error);
    
    // Return a general error that won't break the app flow
    return new Response(
      JSON.stringify({ 
        exists: false, 
        message: 'Error processing request',
        error: error.message 
      }),
      { 
        status: 200, // We use 200 to keep the app running
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
