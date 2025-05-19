
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface StravaErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage: string;
  language: 'en' | 'es';
}

export const StravaErrorDialog: React.FC<StravaErrorDialogProps> = ({ 
  open, 
  onOpenChange,
  errorMessage,
  language 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
};
