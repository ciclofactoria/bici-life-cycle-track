
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface StravaSuccessProps {
  result: {
    totalBikes: number;
    fromAthlete: number;
    fromActivities: number;
    scopes?: string;
  };
}

export const StravaSuccess = ({ result }: StravaSuccessProps) => {
  return (
    <div className="mt-4 mb-4">
      <Alert className={result.totalBikes > 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
        <AlertTitle className={result.totalBikes > 0 ? "text-green-800" : "text-amber-800"}>
          {result.totalBikes > 0 ? "Conexión exitosa con Strava" : "Conexión realizada con Strava"}
        </AlertTitle>
        <AlertDescription>
          <div className={result.totalBikes > 0 ? "mt-2 text-green-700" : "mt-2 text-amber-700"}>
            {result.totalBikes > 0 ? (
              <>
                <p className="font-medium">Se importaron {result.totalBikes} bicicletas:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {result.fromAthlete > 0 && (
                    <li>{result.fromAthlete} desde perfil de atleta</li>
                  )}
                  {result.fromActivities > 0 && (
                    <li>{result.fromActivities} desde actividades recientes</li>
                  )}
                </ul>
              </>
            ) : (
              <>
                <p>No se encontraron bicicletas para importar en tu cuenta de Strava.</p>
                {result.scopes && !result.scopes.includes('profile:read_all') && (
                  <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300">
                    <p className="font-medium">⚠️ Faltan permisos necesarios</p>
                    <p className="text-sm mt-1">
                      No se ha autorizado el permiso para leer el perfil completo (profile:read_all).
                      Este permiso es necesario para acceder a tus bicicletas.
                    </p>
                    <p className="text-sm mt-1">
                      Por favor, desconecta y vuelve a conectar con Strava asegurándote de autorizar todos los permisos.
                    </p>
                  </div>
                )}
              </>
            )}
            <p className="mt-2">Redirigiendo a la página principal...</p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
