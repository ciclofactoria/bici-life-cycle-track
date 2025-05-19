
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from "@/utils/i18n";

interface StravaPremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'es';
}

export const StravaPremiumDialog: React.FC<StravaPremiumDialogProps> = ({ 
  open, 
  onOpenChange,
  language 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
};
