
import { Loader2, AlertTriangle, CheckCircle, Bike } from 'lucide-react';

interface StravaTestResultsProps {
  isLoading: boolean;
  error: string | null;
  result: any;
}

const StravaTestResults = ({ isLoading, error, result }: StravaTestResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Procesando intercambio de código...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error en la prueba</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Prueba exitosa</p>
            <p className="text-green-700 text-sm mt-1">{result.message}</p>
            
            {result.bikes && result.bikes.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-medium">Bicicletas encontradas:</p>
                <ul className="mt-2 space-y-1">
                  {result.bikes.map((bike: any, index: number) => (
                    <li key={index} className="text-sm flex items-center">
                      <Bike className="h-4 w-4 mr-2 text-green-600" />
                      {bike.name} ({bike.distance ? `${Math.round(bike.distance/1000)} km` : 'Sin distancia'})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm mt-2">No se encontraron bicicletas.</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default StravaTestResults;
