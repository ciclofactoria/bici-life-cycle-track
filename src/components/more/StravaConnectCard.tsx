
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { usePremiumFeatures } from '@/services/premiumService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export const StravaConnectCard = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isStravaConnected, setIsStravaConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

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
          title: "Error",
          description: t("user_not_authenticated", language),
          variant: "destructive"
        });
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
      // Esta comprobación debe hacerse después de estar seguros de que se ha cargado el estado
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
            redirect_uri: 'https://bici-life-cycle-track.lovable.app/strava-callback'
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
          title: "Error",
          description: t("user_not_authenticated", language),
          variant: "destructive"
        });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("connect_apps", language)}</CardTitle>
        <CardDescription>{t("connect_apps_desc", language)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Strava</span>
            {isCheckingConnection ? (
              <Badge variant="outline" className="bg-slate-100">
                {language === "en" ? "Checking..." : "Verificando..."}
              </Badge>
            ) : isStravaConnected ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {language === "en" ? "Connected" : "Conectado"}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-100 text-slate-800 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {language === "en" ? "Not connected" : "No conectado"}
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mb-3">
            {language === "en" ? 
              "Connect with Strava to automatically import your bikes and track your mileage." : 
              "Conecta con Strava para importar tus bicicletas automáticamente y seguir tu kilometraje."}
          </p>

          {isStravaConnected ? (
            <Button 
              onClick={handleDisconnectStrava}
              className="w-full border-[#FC4C02] bg-white text-[#FC4C02] hover:bg-[#fff8f6]"
              variant="outline"
              disabled={isConnecting || isPremiumLoading}
            >
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <path d="M12.0002944,0 C5.37321219,0 0,5.37360294 0,12.0002944 C0,18.627693 5.37321219,24 12.0002944,24 C18.6270837,24 24,18.627693 24,12.0002944 C24,5.37360294 18.6270837,0 12.0002944,0 Z M17.8255796,18 L14.9215449,18 L13.9998355,16.1545586 L11.0003824,16.1545586 L10.0792167,18 L7.17467572,18 L12.0000589,8 L17.8255796,18 Z M10.4127964,14.2344142 L11.9997767,11.2752987 L13.5879511,14.2344142 L10.4127964,14.2344142 Z"></path>
                </svg>
                <span>{isConnecting ? t("disconnecting", language) : t("disconnect_strava", language)}</span>
              </div>
            </Button>
          ) : (
            <Button 
              onClick={handleConnectStrava}
              className="w-full bg-[#FC4C02] hover:bg-[#e8440c] text-white"
              disabled={isConnecting || isPremiumLoading}
            >
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <path d="M12.0002944,0 C5.37321219,0 0,5.37360294 0,12.0002944 C0,18.627693 5.37321219,24 12.0002944,24 C18.6270837,24 24,18.627693 24,12.0002944 C24,5.37360294 18.6270837,0 12.0002944,0 Z M17.8255796,18 L14.9215449,18 L13.9998355,16.1545586 L11.0003824,16.1545586 L10.0792167,18 L7.17467572,18 L12.0000589,8 L17.8255796,18 Z M10.4127964,14.2344142 L11.9997767,11.2752987 L13.5879511,14.2344142 L10.4127964,14.2344142 Z"></path>
                </svg>
                <span>{isConnecting ? t("connecting", language) : t("connect_strava", language)}</span>
              </div>
              {!isPremium && !isPremiumLoading && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <img 
                    src="/lovable-uploads/c55d72b0-c3b4-4c57-bdbf-fb609210b8dc.png" 
                    className="h-3 w-3" 
                    alt="Premium" 
                  />
                </span>
              )}
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500 flex flex-col items-start">
        <p>
          {language === "en" ? 
            "Make sure you grant 'View profile and activities' permissions when connecting." : 
            "Asegúrate de conceder permisos 'Ver perfil y actividades' al conectar."} 
        </p>
      </CardFooter>
    </Card>
  );
};
