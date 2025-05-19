
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from "@/contexts/LanguageContext";
import { getStravaBikes, importBikesToDatabase, refreshStravaToken } from '@/services/stravaService';
import { useAuth } from '@/contexts/AuthContext';
import { useStravaErrorHandler } from '@/utils/stravaErrorHandler';
import { usePremiumFeatures } from '@/services/premiumService';
import { useNavigate } from 'react-router-dom';

interface UseStravaRefreshOptions {
  onPremiumRequired: () => void;
  onError: (message: string) => void;
  onComplete: () => void;
}

export function useStravaRefresh({
  onPremiumRequired,
  onError,
  onComplete
}: UseStravaRefreshOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { handleStravaError } = useStravaErrorHandler();
  const navigate = useNavigate();

  const handleTokenRefresh = async () => {
    if (!user?.email) return null;
    
    try {
      const refreshData = await refreshStravaToken(user.email);
      if (!refreshData || !refreshData.access_token) {
        throw new Error("No se pudo refrescar el token de Strava");
      }
      return refreshData.access_token;
    } catch (error) {
      console.error("Error al refrescar el token:", error);
      throw new Error("Error al refrescar la conexión con Strava. Por favor, reconecta tu cuenta.");
    }
  };

  const refreshStravaConnection = async () => {
    try {
      setIsLoading(true);

      // Verificar que el usuario esté autenticado
      if (!user) {
        toast({
          title: language === "en" ? "Authentication Required" : "Autenticación Requerida",
          description: language === "en" ? 
            "Please log in to sync with Strava" : 
            "Por favor inicia sesión para sincronizar con Strava",
          variant: "destructive"
        });
        
        // Redirect to auth page
        setTimeout(() => {
          navigate('/auth', { state: { returnTo: '/' } });
        }, 1500);
        
        return;
      }

      // Si estamos cargando el estado premium, esperar un momento
      if (isPremiumLoading) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      if (!isPremium) {
        onPremiumRequired();
        setIsLoading(false);
        return;
      }

      // Verificar si el usuario tiene una conexión con Strava
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        handleStravaError(profileError);
        setIsLoading(false);
        return;
      }

      if (!profileData || !profileData.strava_access_token) {
        toast({
          title: language === "en" ? "No Strava Connection" : "No hay conexión con Strava",
          description: language === "en" ? 
            "You must connect your Strava account first in the 'More' section" : 
            "Primero debes conectar tu cuenta de Strava en la sección 'Más'",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Determinar si necesitamos refrescar el token
      let currentToken = profileData.strava_access_token;
      const now = Math.floor(Date.now() / 1000);
      
      if (profileData.strava_token_expires_at <= now) {
        console.log("El token ha expirado, refrescando...");
        try {
          currentToken = await handleTokenRefresh();
          console.log("Token refrescado con éxito");
        } catch (refreshError) {
          const errorMsg = language === "en" ? 
            "Your Strava token has expired. Please reconnect your account in the 'More' section." : 
            "Tu token de Strava ha expirado. Por favor, reconecta tu cuenta en la sección 'Más'.";
          
          onError(errorMsg);
          setIsLoading(false);
          return;
        }
      }

      // Obtener bicicletas de Strava
      try {
        console.log("Obteniendo bicicletas con token:", currentToken.substring(0, 5) + "...");
        const bikes = await getStravaBikes(currentToken);
        
        if (!bikes || bikes.length === 0) {
          console.log("No se encontraron bicicletas en Strava");
          toast({
            title: language === "en" ? "No Bikes Found" : "Sin bicicletas",
            description: language === "en" ? 
              "No bikes were found in your Strava account" : 
              "No se encontraron bicicletas en tu cuenta de Strava",
            variant: "default"
          });
          onComplete();
          setIsLoading(false);
          return;
        }
        
        console.log(`Se encontraron ${bikes.length} bicicletas en Strava:`, bikes);
        
        // Importar bicicletas a la base de datos
        const importedCount = await importBikesToDatabase(user.id, bikes);
        
        toast({
          title: language === "en" ? "Sync Complete" : "Sincronización completada",
          description: language === "en" ? 
            `${importedCount} bikes have been imported/updated from Strava` : 
            `Se han importado/actualizado ${importedCount} bicicletas desde Strava`
        });
        
        // Refrescar la lista de bicicletas
        onComplete();
      } catch (stravaError: any) {
        console.error("Error al obtener bicicletas de Strava:", stravaError);
        
        // Si el error está relacionado con token expirado, ofrecer reconexión
        if (stravaError.message && (stravaError.message.includes("expirado") || stravaError.message.includes("expired"))) {
          onError(language === "en" ? 
            "Your Strava token has expired. Please reconnect your account in the 'More' section." : 
            "Tu token de Strava ha expirado. Por favor, reconecta tu cuenta en la sección 'Más'."
          );
        } else {
          // Use our new error handler
          handleStravaError(stravaError, language === "en" ? "Sync Error" : "Error de sincronización");
        }
      }
    } catch (error: any) {
      handleStravaError(error, language === "en" ? "Sync Error" : "Error de sincronización");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isPremiumLoading,
    isPremium,
    refreshStravaConnection
  };
}
