
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

    // Parse the request body to get the email
    const { email }: CheckUserRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking if user with email ${email} exists in WordPress database`);

    try {
      // Call the WordPress API to check if the user exists
      const response = await fetch(`${wpApiUrl}/wp-json/bicicare/v1/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('WordPress API response status:', response.status);
      
      // Handle API errors - likely the endpoint doesn't exist yet
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
        
        // For now, simulate a "not found" response to not break the flow
        // This should be updated once the WordPress API endpoint is properly implemented
        return new Response(
          JSON.stringify({
            exists: false,
            message: 'Could not verify user status',
            error: `API returned ${response.status}: ${errorText}`
          }),
          { 
            status: 200, // We use 200 to not break the app flow
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
