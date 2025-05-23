
import React from 'react';
import { Loader2 } from 'lucide-react';

interface StravaLoadingProps {
  status: string;
}

export const StravaLoading: React.FC<StravaLoadingProps> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <Loader2 className="h-10 w-10 text-orange-500 animate-spin mb-4" />
      <p className="text-gray-600 text-center">{status}</p>
      <p className="text-sm text-gray-500 mt-4">
        Estamos procesando tu conexión con Strava, por favor espera...
      </p>
    </div>
  );
};
