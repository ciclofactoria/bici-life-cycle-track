
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bike, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const StravaTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  
  // Extract code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setAuthCode(codeFromUrl);
      console.log("Se detectó un código de autorización en la URL:", codeFromUrl.substring(0, 5) + "...");
    }
  }, [location]);
  
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
    
    const clientId = '157332';
    const redirectUri = encodeURIComponent(window.location.href);
    const scope = 'read,profile:read_all';
    
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${user.email}`;
    
    console.log("Redirigiendo a Strava para autorización:", authUrl);
    window.location.href = authUrl;
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
      console.log("Usando código de autorización:", authCode.substring(0, 5) + "...");
      
      // Configuración de cliente y secreto
      const clientId = '157332';
      const clientSecret = '38c60b9891cea2fb7053e185750c5345fab850f5';
      
      console.log("Realizando intercambio de código por token");
      
      // Realizar el intercambio de código por token
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: authCode,
          grant_type: 'authorization_code'
        })
      });
      
      const responseText = await response.text();
      console.log("Respuesta bruta de intercambio:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Error al parsear respuesta: ${responseText}`);
      }
      
      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          throw new Error(`Error: ${data.errors[0].resource} - ${data.errors[0].field} - ${data.errors[0].code}`);
        } else {
          throw new Error(`Error: ${data.message || JSON.stringify(data)} (Status: ${response.status})`);
        }
      }
      
      console.log("Token obtenido exitosamente:", {
        token_type: data.token_type,
        access_token_presente: Boolean(data.access_token),
        refresh_token_presente: Boolean(data.refresh_token),
        expires_at: data.expires_at,
        athlete_presente: Boolean(data.athlete)
      });
      
      // Guardar el token en Supabase
      const { error: saveError } = await supabase.functions.invoke('save-strava-token', {
        body: {
          email: user.email,
          strava_user_id: data.athlete?.id?.toString(),
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at
        }
      });
      
      if (saveError) {
        throw new Error(`Error al guardar token: ${saveError.message}`);
      }
      
      // Obtener bicicletas con el token
      console.log("Obteniendo bicicletas con el token...");
      const { data: gearData, error: gearError } = await supabase.functions.invoke('get-strava-gear', {
        body: { access_token: data.access_token }
      });
      
      if (gearError) {
        throw new Error(`Error al obtener bicicletas: ${gearError.message}`);
      }
      
      const bikes = gearData.gear || [];
      console.log(`Se encontraron ${bikes.length} bicicletas:`, bikes);
      
      // Importar bicicletas a la base de datos
      let importedCount = 0;
      for (const bike of bikes) {
        const { error: bikeError } = await supabase
          .from('bikes')
          .upsert({
            name: bike.name || `Bicicleta ${bike.id}`,
            type: bike.type || 'Road',
            strava_id: bike.id,
            user_id: user.id,
            total_distance: bike.distance || 0,
            image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60'
          });
          
        if (!bikeError) {
          importedCount++;
        }
      }
      
      setResult({
        success: true,
        message: `Proceso completado. Se importaron ${importedCount} bicicletas.`,
        bikes: bikes
      });
      
      toast({
        title: "Prueba exitosa",
        description: `Se importaron ${importedCount} bicicletas desde Strava`,
      });
      
      // Limpiar el código de la URL para evitar reutilizaciones accidentales
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
            
            <div className="space-y-2">
              <Label htmlFor="auth-code">Código de autorización</Label>
              <div className="flex gap-2">
                <Input 
                  id="auth-code" 
                  value={authCode} 
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Código de autorización de Strava"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={initiateStravaAuth}
                  className="whitespace-nowrap"
                >
                  Obtener código
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {authCode ? 
                  "Código detectado. Puedes probar la conexión ahora." : 
                  "No hay código disponible. Obtén uno nuevo con el botón."
                }
              </p>
            </div>
          
            {isLoading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Procesando intercambio de código...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Error en la prueba</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            ) : result ? (
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
            ) : null}
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
