
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePremiumFeatures } from '@/services/premiumService';
import { getStravaBikes, importBikesToDatabase, refreshStravaToken } from '@/services/stravaService';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";
import { useAuth } from '@/contexts/AuthContext';

interface StravaRefreshButtonProps {
  onRefreshComplete: () => void;
}

const StravaRefreshButton: React.FC<StravaRefreshButtonProps> = ({ onRefreshComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();
  const { language } = useLanguage();
  const { user } = useAuth();

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
          title: t("error", language),
          description: t("user_not_authenticated", language),
          variant: "destructive"
        });
        return;
      }

      // Si estamos cargando el estado premium, esperar un momento
      if (isPremiumLoading) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      if (!isPremium) {
        setShowPremiumDialog(true);
        return;
      }

      // Verificar si el usuario tiene una conexión con Strava
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData || !profileData.strava_access_token) {
        toast({
          title: language === "en" ? "No Strava Connection" : "No hay conexión con Strava",
          description: language === "en" ? 
            "You must connect your Strava account first in the 'More' section" : 
            "Primero debes conectar tu cuenta de Strava en la sección 'Más'",
          variant: "destructive"
        });
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
          console.error("Error al refrescar el token:", refreshError);
          setErrorMessage(language === "en" ? 
            "Your Strava token has expired. Please reconnect your account in the 'More' section." : 
            "Tu token de Strava ha expirado. Por favor, reconecta tu cuenta en la sección 'Más'."
          );
          setShowErrorDialog(true);
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
          onRefreshComplete();
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
        onRefreshComplete();
      } catch (stravaError: any) {
        console.error("Error al obtener bicicletas de Strava:", stravaError);
        
        // Si el error está relacionado con token expirado, ofrecer reconexión
        if (stravaError.message && (stravaError.message.includes("expirado") || stravaError.message.includes("expired"))) {
          setErrorMessage(language === "en" ? 
            "Your Strava token has expired. Please reconnect your account in the 'More' section." : 
            "Tu token de Strava ha expirado. Por favor, reconecta tu cuenta en la sección 'Más'."
          );
          setShowErrorDialog(true);
        } else {
          toast({
            title: language === "en" ? "Sync Error" : "Error de sincronización",
            description: stravaError.message || (language === "en" ? 
              "Could not import bikes from Strava" : 
              "No se pudieron importar las bicicletas de Strava"),
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error("Error al sincronizar con Strava:", error);
      toast({
        title: language === "en" ? "Sync Error" : "Error de sincronización",
        description: error.message || (language === "en" ? 
          "Could not import bikes from Strava" : 
          "No se pudieron importar las bicicletas de Strava"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={refreshStravaConnection} 
        className="bg-[#F97316] hover:bg-[#ea6c10] text-white" 
        disabled={isLoading || isPremiumLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 
          (language === "en" ? "Syncing..." : "Sincronizando...") : 
          (language === "en" ? "Sync with Strava" : "Sincronizar con Strava")}
      </Button>

      {/* Dialog premium */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("premium_popup_title", language)}</DialogTitle>
            <DialogDescription>
              {t("strava_sync_premium_desc", language)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {language === "en" ? "Upgrade to Premium to unlock all features." : "Actualiza a Premium para desbloquear todas las funciones."}
              </AlertDescription>
            </Alert>
            
            <h3 className="font-medium text-lg">{language === "en" ? "With Premium you'll get:" : "Con Premium obtendrás:"}</h3>
            
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("multiple_bikes", language)}</li>
              <li>{t("auto_strava_sync", language)}</li>
              <li>{t("import_strava_bikes", language)}</li>
              <li>{t("advanced_stats", language)}</li>
              <li>{t("maintenance_export", language)}</li>
              <li>{t("custom_alerts", language)}</li>
            </ul>
            
            <Button 
              onClick={() => window.location.href = "/premium"} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {language === "en" ? "View Premium Plans" : "Ver Planes Premium"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de error */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "en" ? "Strava Connection Error" : "Error de Conexión con Strava"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {language === "en" ? "Authentication Error" : "Error de Autenticación"}
              </AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-gray-600">
              {language === "en" ? 
                "To fix this issue, please disconnect and reconnect your Strava account in the 'More' section." : 
                "Para solucionar este problema, desconecta y vuelve a conectar tu cuenta de Strava en la sección 'Más'."}
            </p>
            
            <Button 
              onClick={() => window.location.href = "/more"}
              className="w-full"
            >
              {language === "en" ? "Go to More Section" : "Ir a la Sección Más"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StravaRefreshButton;
