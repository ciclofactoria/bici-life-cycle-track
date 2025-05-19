
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast'; 
import { useStravaRefresh } from '@/hooks/useStravaRefresh';
import { StravaPremiumDialog } from './dialogs/StravaPremiumDialog';
import { StravaErrorDialog } from './dialogs/StravaErrorDialog';

interface StravaRefreshButtonProps {
  onRefreshComplete: () => void;
}

const StravaRefreshButton: React.FC<StravaRefreshButtonProps> = ({ onRefreshComplete }) => {
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    isLoading, 
    isPremiumLoading,
    refreshStravaConnection 
  } = useStravaRefresh({
    onPremiumRequired: () => setShowPremiumDialog(true),
    onError: (message) => {
      setErrorMessage(message);
      setShowErrorDialog(true);
    },
    onComplete: onRefreshComplete
  });

  const handleClick = () => {
    // Verificar si el usuario está autenticado antes de proceder
    if (!user) {
      toast({
        title: language === "en" ? "Authentication Required" : "Autenticación Requerida",
        description: language === "en" ? 
          "Please log in to sync with Strava" : 
          "Debes estar autenticado para sincronizar con Strava",
        variant: "destructive"
      });
      return;
    }
    
    refreshStravaConnection();
  };

  return (
    <>
      <Button 
        onClick={handleClick} 
        className="bg-[#F97316] hover:bg-[#ea6c10] text-white" 
        disabled={isLoading || isPremiumLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 
          (language === "en" ? "Syncing..." : "Sincronizando...") : 
          (language === "en" ? "Sync with Strava" : "Sincronizar con Strava")}
      </Button>

      {/* Dialogs */}
      <StravaPremiumDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
        language={language} 
      />
      
      <StravaErrorDialog 
        open={showErrorDialog} 
        onOpenChange={setShowErrorDialog} 
        errorMessage={errorMessage}
        language={language} 
      />
    </>
  );
};

export default StravaRefreshButton;
