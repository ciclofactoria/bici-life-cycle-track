
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface StravaConnectionStatusProps {
  isConnected: boolean | null;
  isCheckingConnection: boolean;
  language: 'en' | 'es';
}

export const StravaConnectionStatus: React.FC<StravaConnectionStatusProps> = ({
  isConnected,
  isCheckingConnection,
  language
}) => {
  if (isCheckingConnection) {
    return (
      <Badge variant="outline" className="bg-slate-100">
        {language === "en" ? "Checking..." : "Verificando..."}
      </Badge>
    );
  }
  
  if (isConnected) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        {language === "en" ? "Connected" : "Conectado"}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-slate-100 text-slate-800 flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      {language === "en" ? "Not connected" : "No conectado"}
    </Badge>
  );
};
