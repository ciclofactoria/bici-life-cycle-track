
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from '@/contexts/AuthContext';
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
