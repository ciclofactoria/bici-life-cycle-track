
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const PremiumBikeAlert: React.FC = () => {
  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        Los usuarios premium pueden registrar múltiples bicicletas e importarlas desde Strava
      </AlertDescription>
    </Alert>
  );
};

export default PremiumBikeAlert;
