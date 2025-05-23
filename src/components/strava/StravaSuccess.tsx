
import React from 'react';
import { CheckCircle } from 'lucide-react';
import type { StravaImportResult } from '@/services/stravaService/callbackProcessor';

interface StravaSuccessProps {
  result: StravaImportResult;
}

export const StravaSuccess: React.FC<StravaSuccessProps> = ({ result }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="bg-green-100 rounded-full p-3 mb-4">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <h2 className="text-lg font-medium text-green-700 mb-2">¡Conexión exitosa!</h2>
      
      {result.totalBikes > 0 ? (
        <div className="text-center">
          <p className="text-gray-700">
            Se importaron <span className="font-medium">{result.totalBikes}</span> bicicletas desde Strava.
          </p>
          <div className="text-sm text-gray-600 mt-2">
            <p>• {result.fromAthlete} desde perfil de atleta</p>
            <p>• {result.fromActivities} desde actividades</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-center">
          Conexión completada pero no se encontraron bicicletas para importar. 
          Prueba a usar tus bicicletas en actividades en Strava.
        </p>
      )}
      
      <p className="text-sm text-gray-500 mt-4">
        Serás redirigido automáticamente en unos segundos...
      </p>
    </div>
  );
};
