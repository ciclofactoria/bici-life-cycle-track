
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Función de registro con timestamp para mejor seguimiento
function logEvent(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] STRAVA-AUTH-URL: ${message}`, JSON.stringify(data));
}

serve(async (req) => {
  // Para registrar cada llamada a la función
  const requestId = crypto.randomUUID();
  logEvent(`Función invocada (ID: ${requestId})`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logEvent(`Solicitud CORS OPTIONS recibida (ID: ${requestId})`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializa el cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || "https://tyqmfhtfvrffkaqttbcf.supabase.co";
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cW1maHRmdnJmZmthcXR0YmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODQ3NjgsImV4cCI6MjA2MTM2MDc2OH0.yQvXxJe4SYcBDyIqKOg0Vl-4nyV3VF8EK3bplFr0SzU";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Obtener el ID del usuario del JWT token
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Token de autorización no proporcionado');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('No se pudo autenticar al usuario');
    }
    
    logEvent(`Usuario autenticado: ${user.id}`, { requestId });

    // Configuración de Strava
    const clientId = "157332";
    const scope = "read,profile:read_all,activity:read_all";
    
    let body: Record<string, any> = {};
    try {
      if (req.method === 'POST') {
        body = await req.json();
      }
    } catch (e) {
      // Si el cuerpo no es JSON o está vacío, seguimos adelante con valores predeterminados
    }
    
    // Usar el redirect_uri proporcionado o el predeterminado
    const redirectUri = body.redirect_uri || 'https://bici-life-cycle-track.lovable.app/strava-callback';
    
    // Añadir un parámetro timestamp para evitar problemas de caché en la redirección
    const timestamp = body.timestamp || Date.now();
    
    // Añadir approval_prompt=force para asegurar que Strava siempre muestre la pantalla de autorización
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&approval_prompt=force&_t=${timestamp}`;
    
    logEvent(`URL de autenticación de Strava generada`, {
      requestId,
      clientId,
      redirectUri,
      scope,
      timestamp
    });
    
    return new Response(
      JSON.stringify({ 
        authUrl,
        redirectUri
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    logEvent(`Error: ${error.message}`, { requestId: requestId });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
