import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePremiumFeatures } from '@/services/premiumService';
import { importBikesFromActivities } from '@/services/stravaService/importBikesFromActivities';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";

interface StravaRefreshButtonProps {
  onRefreshComplete: () => void;
}

const StravaRefreshButton: React.FC<StravaRefreshButtonProps> = ({ onRefreshComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const { toast } = useToast();
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();
  const { language } = useLanguage();

  const refreshStravaConnection = async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para usar esta función",
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
        setIsLoading(false);
        return;
      }

      // Check if user has a Strava connection in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData || !profileData.strava_access_token) {
        toast({
          title: "No hay conexión con Strava",
          description: "Primero debes conectar tu cuenta de Strava en la sección 'Más'",
          variant: "destructive"
        });
        return;
      }

      // Refresh token if needed
      const now = Math.floor(Date.now() / 1000);
      if (profileData.strava_token_expires_at <= now) {
        console.log("El token ha expirado, refrescando...");
        const { data: refreshData, error: refreshError } = await supabase.functions.invoke('refresh-strava-token', {
          body: { email: userData.user.email }
        });

        if (refreshError) throw refreshError;
        if (!refreshData || !refreshData.access_token) {
          throw new Error("Error al refrescar el token de Strava");
        }

        console.log("Token de Strava actualizado con éxito");
      }

      // Use the current or refreshed token to import bikes
      const currentToken = profileData.strava_token_expires_at <= now ? 
        (await supabase.functions.invoke('refresh-strava-token', { body: { email: userData.user.email } })).data?.access_token : 
        profileData.strava_access_token;

      if (!currentToken) {
        throw new Error("No se pudo obtener un token de acceso válido");
      }

      // Import bikes from Strava activities
      const importedCount = await importBikesFromActivities(userData.user.id, currentToken);
      
      toast({
        title: "Sincronización completada",
        description: `Se han importado/actualizado ${importedCount} bicicletas desde Strava`,
      });
      
      // Refresh the bike list
      onRefreshComplete();
    } catch (error: any) {
      console.error("Error al sincronizar con Strava:", error);
      toast({
        title: "Error de sincronización",
        description: error.message || "No se pudieron importar las bicicletas de Strava",
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
        <RefreshCw className="h-4 w-4 mr-2" />
        {isLoading ? "Sincronizando..." : "Sincronizar con Strava"}
      </Button>

      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("premium_feature", language)}</DialogTitle>
            <DialogDescription>
              {t("strava_sync_premium_desc", language)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Actualiza a Premium para desbloquear todas las funciones.
              </AlertDescription>
            </Alert>
            
            <h3 className="font-medium text-lg">Con Premium obtendrás:</h3>
            
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
              Ver Planes Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StravaRefreshButton;
