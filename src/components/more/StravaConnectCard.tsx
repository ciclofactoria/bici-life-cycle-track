
import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";
import { useStravaConnection } from '@/hooks/useStravaConnection';
import { StravaConnectionStatus } from './strava/StravaConnectionStatus';
import { StravaConnectButton } from './strava/StravaConnectButton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const StravaConnectCard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    isStravaConnected,
    isCheckingConnection,
    isConnecting,
    isPremium,
    isPremiumLoading,
    handleConnectStrava,
    handleDisconnectStrava
  } = useStravaConnection();

  // Si no hay usuario autenticado, redirigimos a la página de autenticación
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Si el usuario no está autenticado, no mostramos el contenido del componente
  if (!user) {
    return null;
  }

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
            <StravaConnectionStatus 
              isConnected={isStravaConnected} 
              isCheckingConnection={isCheckingConnection}
              language={language}
            />
          </div>
          
          <p className="text-sm text-gray-500 mb-3">
            {language === "en" ? 
              "Connect with Strava to automatically import your bikes and track your mileage." : 
              "Conecta con Strava para importar tus bicicletas automáticamente y seguir tu kilometraje."}
          </p>

          <StravaConnectButton 
            isConnected={!!isStravaConnected}
            isConnecting={isConnecting}
            isPremium={isPremium}
            isPremiumLoading={isPremiumLoading}
            onConnect={handleConnectStrava}
            onDisconnect={handleDisconnectStrava}
          />
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
