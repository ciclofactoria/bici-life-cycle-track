
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumFeatures } from '@/services/premiumService';
import { useNavigate } from 'react-router-dom';

export function useStravaConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isStravaConnected, setIsStravaConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const navigate = useNavigate();

  // Verificar si el usuario ya tiene una conexión con Strava
  useEffect(() => {
    const checkStravaConnection = async () => {
      if (!user) {
        setIsStravaConnected(false);
        setIsCheckingConnection(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('strava_connected, strava_access_token')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        setIsStravaConnected(!!profileData?.strava_connected && !!profileData?.strava_access_token);
      } catch (err) {
        console.error('Error al verificar conexión con Strava:', err);
        setIsStravaConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    checkStravaConnection();
  }, [user]);

  const handleConnectStrava = async () => {
    try {
      // Verificar que el usuario esté autenticado
      if (!user) {
        toast({
          title: language === "en" ? "Authentication Required" : "Autenticación Requerida",
          description: language === "en" ? 
            "Please log in to connect with Strava" : 
            "Por favor inicia sesión para conectar con Strava",
          variant: "destructive"
        });
        
        // Redirect to auth page con estado para volver a la página actual
        navigate('/auth', { state: { returnTo: '/more' } });
        return;
      }
      
      setIsConnecting(true);
      
      // Si el usuario está cargando el estado premium, esperar un momento
      if (isPremiumLoading) {
        toast({
          title: t('verifying_premium', language),
          description: t('wait_verifying_subscription', language),
        });
        // Esperar un breve periodo para dar tiempo a cargar el estado premium
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Verificar si el usuario es premium para conectar con Strava
      if (!isPremium) {
        toast({
          title: t('premium_feature', language),
          description: t('strava_premium_only', language),
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }
      
      try {
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
        
        toast({
          title: t("connecting_strava", language),
          description: t("redirecting_strava", language),
        });
        
      } catch (err) {
        console.error('Error generando URL de Strava:', err);
        toast({
          title: t('error', language),
          description: t('strava_auth_url_error', language),
          variant: 'destructive',
        });
        setIsConnecting(false);
      }
      
    } catch (err) {
      console.error('Error al iniciar autenticación con Strava:', err);
      toast({
        title: t('error', language),
        description: t('strava_auth_start_error', language),
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectStrava = async () => {
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

      setIsConnecting(true);

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

      setIsStravaConnected(false);
      
      toast({
        title: t("strava_disconnected", language),
        description: t("strava_disconnect_success", language),
      });
    } catch (err) {
      console.error('Error al desconectar Strava:', err);
      toast({
        title: t('error', language),
        description: t('strava_disconnect_error', language),
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    isStravaConnected,
    isCheckingConnection,
    isConnecting,
    isPremium,
    isPremiumLoading,
    handleConnectStrava,
    handleDisconnectStrava
  };
}
