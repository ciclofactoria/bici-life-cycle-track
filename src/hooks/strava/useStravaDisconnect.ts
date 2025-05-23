
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Hook para gestionar la desconexión de Strava
 */
export function useStravaDisconnect() {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const disconnectFromStrava = async () => {
    try {
      if (!user) {
        toast({
          title: language === "en" ? "Authentication Required" : "Autenticación Requerida",
          description: language === "en" ? 
            "Please log in to disconnect from Strava" : 
            "Por favor inicia sesión para desconectar de Strava",
          variant: "destructive"
        });
        
        // Redirect to auth page
        navigate('/auth', { state: { returnTo: '/more' } });
        return;
      }

      setIsDisconnecting(true);

      // Actualizar el perfil para desconectar Strava
      const { error } = await supabase
        .from('profiles')
        .update({
          strava_connected: false,
          strava_access_token: null,
          strava_refresh_token: null,
          strava_token_expires_at: null,
          strava_athlete_id: null
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: t("strava_disconnected", language),
        description: t("strava_disconnect_success", language),
      });

      return { success: true };
    } catch (err) {
      console.error('Error al desconectar Strava:', err);
      toast({
        title: t('error', language),
        description: t('strava_disconnect_error', language),
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsDisconnecting(false);
    }
  };

  return {
    isDisconnecting,
    disconnectFromStrava
  };
}
