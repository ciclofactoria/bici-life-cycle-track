
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bike } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import StravaAuthCodeInput from '@/components/strava/StravaAuthCodeInput';
import StravaTestResults from '@/components/strava/StravaTestResults';
import { 
  exchangeCodeForToken, 
  saveStravaToken,
  getStravaBikes, 
  importBikesToDatabase,
  initiateStravaAuthorization
} from '@/services/stravaService';

const StravaTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  
  // Function to initiate Strava authorization
  const initiateStravaAuth = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta prueba",
        variant: "destructive"
      });
      return;
    }
    
    initiateStravaAuthorization(user.email);
  };
  
  const handleTestExchange = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta prueba",
        variant: "destructive"
      });
      return;
    }
    
    if (!authCode) {
      toast({
        title: "Error",
        description: "Se requiere un código de autorización. Obtén uno nuevo usando el botón 'Obtener código de Strava'",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log("Iniciando prueba de intercambio de código...");
      
      // Exchange code for token
      const tokenData = await exchangeCodeForToken(authCode, user.email);
      
      console.log("Token obtenido exitosamente:", {
        token_type: tokenData.token_type,
        access_token_presente: Boolean(tokenData.access_token),
        refresh_token_presente: Boolean(tokenData.refresh_token),
        expires_at: tokenData.expires_at,
        athlete_presente: Boolean(tokenData.athlete)
      });
      
      // Save token to Supabase
      await saveStravaToken(user.id, user.email, tokenData);
      
      // Get bikes
      const bikes = await getStravaBikes(tokenData.access_token);
      console.log(`Se encontraron ${bikes.length} bicicletas:`, bikes);
      
      // Import bikes to database
      const importedCount = await importBikesToDatabase(user.id, bikes);
      
      setResult({
        success: true,
        message: `Proceso completado. Se importaron ${importedCount} bicicletas.`,
        bikes: bikes
      });
      
      toast({
        title: "Prueba exitosa",
        description: `Se importaron ${importedCount} bicicletas desde Strava`,
      });
      
      // Clean up URL
      if (location.search) {
        navigate('/strava-test', { replace: true });
      }
    } catch (err: any) {
      console.error("Error en prueba de Strava:", err);
      setError(err.message || "Error desconocido durante la prueba");
      toast({
        title: "Error en la prueba",
        description: err.message || "Error desconocido durante la prueba",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 px-4 pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de integración con Strava</CardTitle>
          <CardDescription>
            Esta página permite probar el intercambio de código por token con Strava.
            Utiliza el botón para obtener un código de autorización nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-sm text-orange-700">
                Los códigos de autorización de Strava son válidos por un solo uso y expiran rápidamente. 
                Si obtienes un error, solicita un nuevo código con el botón "Obtener código de Strava".
              </p>
            </div>
            
            <StravaAuthCodeInput 
              authCode={authCode}
              setAuthCode={setAuthCode}
              initiateStravaAuth={initiateStravaAuth}
            />
          
            <StravaTestResults 
              isLoading={isLoading}
              error={error}
              result={result}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/more')}>
            Volver
          </Button>
          <Button 
            onClick={handleTestExchange} 
            disabled={isLoading || !authCode}
            className="flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Bike className="h-4 w-4 mr-1" />
            Probar conexión con Strava
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StravaTest;
