
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StravaConnectButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  isPremium: boolean;
  isPremiumLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const StravaConnectButton: React.FC<StravaConnectButtonProps> = ({
  isConnected,
  isConnecting,
  isPremium,
  isPremiumLoading,
  onConnect,
  onDisconnect
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Crear funciones de control que verifican la autenticación
  const handleConnectClick = () => {
    if (!user) {
      navigate('/auth', { state: { returnTo: '/more' } });
      return;
    }
    
    onConnect();
  };

  const handleDisconnectClick = () => {
    if (!user) {
      navigate('/auth', { state: { returnTo: '/more' } });
      return;
    }
    
    onDisconnect();
  };

  return isConnected ? (
    <Button 
      onClick={handleDisconnectClick}
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
      onClick={handleConnectClick}
      className="w-full bg-[#FC4C02] hover:bg-[#ea6c10] text-white"
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
  );
};
