
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";
import { useNavigate } from 'react-router-dom';

/**
 * Hook para gestionar la conexión con Strava
 */
export function useStravaConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const connectToStrava = async () => {
    try {
      setIsConnecting(true);
      
      console.log('Generando URL de autenticación de Strava...');
      const { data, error } = await supabase.functions.invoke('generate-strava-auth-url', {
        body: {
          redirect_uri: 'https://bici-life-cycle-track.lovable.app/strava-callback',
          // Usar un timestamp para evitar problemas de caché
          timestamp: Date.now()
        }
      });
      
      if (error) {
        console.error('Error generando URL de Strava:', error);
        throw new Error(error.message || 'Error al generar la URL de autenticación de Strava');
      }
      
      if (!data || !data.authUrl) {
        console.error('No se recibió una URL válida:', data);
        throw new Error('No se recibió una URL de autenticación válida');
      }
      
      console.log('Redirigiendo a página de autorización de Strava:', data.authUrl);
      
      // Abrimos en la misma ventana para asegurar el manejo correcto de la redirección
      window.location.href = data.authUrl;
      
      toast(t("connecting_strava", language), {
        description: t("redirecting_strava", language)
      });
      
    } catch (err) {
      console.error('Error generando URL de Strava:', err);
      toast(t('error', language), {
        description: t('strava_auth_url_error', language)
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    isConnecting,
    connectToStrava
  };
}
