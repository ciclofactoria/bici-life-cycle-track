
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

    // Call the WordPress API to check if the user exists
    const response = await fetch(`${wpApiUrl}/wp-json/bicicare/v1/check-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from WordPress API:', errorData);
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Response from WordPress:', data);

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error checking WordPress user:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred checking WordPress user',
        exists: false // Default response for error cases
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
