
import { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from '@/hooks/use-toast';
import { t } from "@/utils/i18n";
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumFeatures } from '@/services/premiumService';
import { useNavigate } from 'react-router-dom';
import { useStravaStatus } from './useStravaStatus';
import { useStravaConnect } from './useStravaConnect';
import { useStravaDisconnect } from './useStravaDisconnect';

/**
 * Hook principal que combina toda la funcionalidad de conexión con Strava
 */
export function useStravaConnection() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();
  
  // Usar los hooks individuales
  const { isStravaConnected, isCheckingConnection } = useStravaStatus();
  const { isConnecting, connectToStrava } = useStravaConnect();
  const { isDisconnecting, disconnectFromStrava } = useStravaDisconnect();

  // Estado combinado para mantener el mismo comportamiento
  const isBusyConnecting = isConnecting || isDisconnecting;

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
        return;
      }
      
      await connectToStrava();
      
    } catch (err) {
      console.error('Error al iniciar autenticación con Strava:', err);
      toast({
        title: t('error', language),
        description: t('strava_auth_start_error', language),
        variant: 'destructive',
      });
    }
  };

  return {
    isStravaConnected,
    isCheckingConnection,
    isConnecting: isBusyConnecting,
    isPremium,
    isPremiumLoading,
    handleConnectStrava,
    handleDisconnectStrava: disconnectFromStrava
  };
}
