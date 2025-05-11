
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckUserRequest {
  email: string;
}

interface WordPressResponse {
  exists: boolean;
  message: string;
  error?: string;
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
      return createResponse({
        exists: true,
        message: 'Test user exists in WordPress'
      });
    }

    try {
      // First attempt: Call the dedicated check-user endpoint
      const response = await callWordPressEndpoint(
        `${wpApiUrl}/wp-json/bicicare/v1/check-user`,
        apiKey,
        email
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Response from WordPress check-user endpoint:', data);
        return createResponse(data);
      }

      // Second attempt: Fall back to verify-subscription endpoint
      console.log('Attempting fallback to verify-subscription endpoint');
      const fallbackResponse = await callWordPressEndpoint(
        `${wpApiUrl}/wp-json/bicicare/v1/verify-subscription`,
        apiKey,
        email
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('Response from verify-subscription endpoint:', fallbackData);
        
        // If we get a meaningful response that's not "Usuario no encontrado",
        // we can consider this user exists
        if (fallbackData.message && fallbackData.message !== 'Usuario no encontrado') {
          return createResponse({
            exists: true,
            message: 'User exists in WordPress (verified via subscription check)'
          });
        }
      }

      // If both endpoints fail or user not found
      console.log('User not found in WordPress or API error');
      return createResponse({
        exists: false,
        message: 'User not found or API error'
      });

    } catch (fetchError) {
      console.error('Error fetching from WordPress API:', fetchError);
      return createResponse({ 
        exists: false, 
        message: 'Connection error checking WordPress user',
        error: fetchError.message 
      });
    }
  } catch (error) {
    console.error('Error checking WordPress user:', error);
    return createResponse({ 
      exists: false, 
      message: 'Error processing request',
      error: error.message 
    });
  }
});

// Helper function to call WordPress endpoints
async function callWordPressEndpoint(url: string, apiKey: string, email: string): Promise<Response> {
  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ email }),
  });
}

// Helper function to create consistent response format
function createResponse(data: WordPressResponse): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status: 200, // Use 200 to not break the app flow
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
