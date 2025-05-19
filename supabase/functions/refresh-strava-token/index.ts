
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function logEvent(message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] REFRESH-STRAVA-TOKEN: ${message}`, JSON.stringify(data));
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  logEvent(`Función invocada (ID: ${requestId})`);

  if (req.method === 'OPTIONS') {
    logEvent(`Solicitud CORS OPTIONS recibida (ID: ${requestId})`);
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      logEvent(`Error: Email requerido pero no proporcionado (ID: ${requestId})`);
      throw new Error('Email is required');
    }

    logEvent(`Procesando solicitud para email: ${email} (ID: ${requestId})`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener el perfil actual con datos de token
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('strava_refresh_token')
      .eq('email', email)
      .single();

    if (userError || !userData || !userData.strava_refresh_token) {
      logEvent(`Error al obtener token de refresco: ${userError?.message || 'Token no encontrado'} (ID: ${requestId})`);
      throw new Error('No Strava token found for this email');
    }

    // Pedir nuevo token de acceso a Strava
    logEvent(`Solicitando nuevo token a Strava con refresh token (ID: ${requestId})`);
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: Deno.env.get('STRAVA_CLIENT_ID'),
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
        refresh_token: userData.strava_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const responseText = await response.text();
    logEvent(`Respuesta bruta recibida de Strava (ID: ${requestId})`, {
      status: response.status,
      response_length: responseText.length
    });
    
    let stravaData;
    try {
      stravaData = JSON.parse(responseText);
    } catch (e) {
      logEvent(`Error parseando respuesta de Strava: ${e.message} (ID: ${requestId})`);
      throw new Error(`Error parsing Strava response: ${responseText}`);
    }

    if (!response.ok) {
      logEvent(`Error de API de Strava (ID: ${requestId})`, {
        status: response.status,
        message: stravaData.message || "Error desconocido"
      });
      throw new Error(`Strava API error: ${stravaData.message || 'Failed to refresh token'} (Status: ${response.status})`);
    }

    // Actualizar token en base de datos
    logEvent(`Actualizando token en base de datos (ID: ${requestId})`);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        strava_access_token: stravaData.access_token,
        strava_refresh_token: stravaData.refresh_token,
        strava_token_expires_at: stravaData.expires_at,
      })
      .eq('email', email);

    if (updateError) {
      logEvent(`Error actualizando token en base de datos: ${updateError.message} (ID: ${requestId})`);
      throw updateError;
    }

    logEvent(`Token actualizado exitosamente (ID: ${requestId})`);
    
    return new Response(JSON.stringify({
      access_token: stravaData.access_token,
      expires_at: stravaData.expires_at,
      message: "Token refrescado exitosamente",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logEvent(`Error en refresh-strava-token: ${error.message || "Error desconocido"} (ID: ${requestId})`);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: "Error al refrescar token de Strava",
      request_id: requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
