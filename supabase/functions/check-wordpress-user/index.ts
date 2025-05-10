
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

    // Asegúrate de usar la ruta correcta para verificar usuarios existentes
    // Call the WordPress API to check if the user exists
    const response = await fetch(`${wpApiUrl}/wp-json/bicicare/v1/check-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Log full response for debugging
    console.log('WordPress API response status:', response.status);
    
    // Para manejar respuestas distintas a 200 OK de forma más informativa
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('Error from WordPress API:', errorData);
      } catch (e) {
        console.error('Could not parse error response:', await response.text());
      }
      
      // Incluso si hay un error 404, asumimos que el usuario no existe
      // en lugar de lanzar un error que rompe el flujo
      return new Response(
        JSON.stringify({
          exists: false,
          message: 'User does not exist or could not verify user',
          error: response.status === 404 ? 'API endpoint not found' : 'Error checking user'
        }),
        { 
          status: 200, // Devolvemos 200 para que la app siga funcionando
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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
        status: 200, // Cambiado de 500 a 200 para que no rompa el flujo de la app
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
