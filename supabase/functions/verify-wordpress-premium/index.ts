
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Define CORS headers para permitir solicitudes desde el frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Función para verificar el estado premium con WordPress
async function verifyWordPressSubscription(email: string): Promise<any> {
  try {
    // Esta es la URL de tu endpoint de WordPress que verificará la suscripción
    const wordpressUrl = Deno.env.get("WORDPRESS_API_URL") || "https://ciclofactoria.com";
    const apiKey = "@gkeG@Lgjh(5z!gqbZ83pEy4"; // API Key fija

    if (!wordpressUrl) {
      console.error("No se configuró la URL de WordPress");
      return { error: "Configuración de WordPress incompleta" };
    }

    // Asegúrate de que la URL no termine con una barra
    const baseUrl = wordpressUrl.endsWith('/') 
      ? wordpressUrl.slice(0, -1) 
      : wordpressUrl;

    // Realizar la solicitud a WordPress
    console.log(`Enviando solicitud a WordPress: ${baseUrl}/wp-json/bicicare/v1/verify-subscription para verificar email: ${email}`);
    const response = await fetch(`${baseUrl}/wp-json/bicicare/v1/verify-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ email })
    });

    console.log("Respuesta HTTP:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error de WordPress: ${response.status} - ${errorText}`);
      return { error: `Error al verificar suscripción: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    console.log("Respuesta de WordPress:", data);

    return {
      isPremium: data.is_premium === true,
      premiumUntil: data.premium_until || null,
      message: data.message || "Verificación completa"
    };
  } catch (error) {
    console.error("Error al conectar con WordPress:", error.message);
    return { error: `Error al conectar con WordPress: ${error.message}` };
  }
}

serve(async (req) => {
  console.log(`Recibida solicitud: ${req.method} ${req.url}`);
  
  // Manejar solicitudes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Configurar cliente de Supabase con credenciales de servicio
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó token de autenticación" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Error de autenticación:", authError);
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Obtener datos del cuerpo de la solicitud
    const requestData = await req.json();
    const { userId, email } = requestData;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Se requiere el email del usuario" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verificar estado premium con WordPress
    const wordpressResult = await verifyWordPressSubscription(email);

    if (wordpressResult.error) {
      console.error("Error en verificación WordPress:", wordpressResult.error);
      return new Response(
        JSON.stringify({ error: wordpressResult.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Actualizar la tabla user_subscriptions con el estado verificado
    // Independientemente de si es premium o no
    const { error: upsertError } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: userId || user.id,
        is_premium: wordpressResult.isPremium,
        premium_until: wordpressResult.premiumUntil,
        last_verified_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (upsertError) {
      console.error("Error actualizando estado en la base de datos:", upsertError);
    } else {
      console.log(`Actualizado correctamente el estado en la base de datos: isPremium = ${wordpressResult.isPremium}`);
    }

    // Devolver resultado
    return new Response(
      JSON.stringify({
        isPremium: wordpressResult.isPremium,
        premiumUntil: wordpressResult.premiumUntil,
        message: wordpressResult.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error en la edge function:", error);
    return new Response(
      JSON.stringify({ error: `Error interno del servidor: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
