
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface StravaErrorProps {
  error: string;
}

export const StravaError: React.FC<StravaErrorProps> = ({ error }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="bg-red-100 rounded-full p-3 mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-lg font-medium text-red-700 mb-2">Error al conectar con Strava</h2>
      <p className="text-gray-600 text-center">{error}</p>
      <p className="text-sm text-gray-500 mt-4">
        Serás redirigido automáticamente en unos segundos...
      </p>
    </div>
  );
};
