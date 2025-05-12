
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || "https://tyqmfhtfvrffkaqttbcf.supabase.co"
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cW1maHRmdnJmZmthcXR0YmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODQ3NjgsImV4cCI6MjA2MTM2MDc2OH0.yQvXxJe4SYcBDyIqKOg0Vl-4nyV3VF8EK3bplFr0SzU"

// Función de registro con timestamp para mejor seguimiento
function logEvent(message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] STRAVA-AUTH-URL: ${message}`, JSON.stringify(data));
}

serve(async (req) => {
  // Para registrar cada llamada a la función
  const requestId = crypto.randomUUID();
  logEvent(`Función invocada (ID: ${requestId})`);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    logEvent(`Solicitud CORS OPTIONS recibida (ID: ${requestId})`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autorización
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      logEvent(`Error: No se proporcionó token de autorización`, { requestId });
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      logEvent(`Error: Usuario no autenticado`, { requestId, error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'No autorizado', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logEvent(`Usuario autenticado: ${user.id}`, { requestId });

    // Obtener valores desde las variables de entorno
    const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID') || "157332";
    const STRAVA_REDIRECT_URI = Deno.env.get('STRAVA_REDIRECT_URI') || "https://bici-life-cycle-track.lovable.app/strava-callback";
    
    // Verificar que los valores necesarios están disponibles
    if (!STRAVA_CLIENT_ID) {
      logEvent(`Error: STRAVA_CLIENT_ID no está configurado`, { requestId });
      return new Response(
        JSON.stringify({ error: 'Configuración de Strava incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Construir la URL de autenticación de Strava
    const responseType = 'code';
    const approvalPrompt = 'auto';
    const scope = encodeURIComponent('read,profile:read_all,activity:read_all');
    
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=${responseType}&scope=${scope}&approval_prompt=${approvalPrompt}`;
    
    logEvent(`URL de autenticación de Strava generada`, { 
      requestId, 
      clientId: STRAVA_CLIENT_ID,
      redirectUri: STRAVA_REDIRECT_URI,
      scope: decodeURIComponent(scope)
    });
    
    // Retornar la URL generada
    return new Response(
      JSON.stringify({ 
        authUrl: stravaAuthUrl,
        redirectUri: STRAVA_REDIRECT_URI,
        scopes: decodeURIComponent(scope)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logEvent(`Error general: ${error.message || "Error desconocido"}`, { requestId });
    return new Response(
      JSON.stringify({ error: 'Error del servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
