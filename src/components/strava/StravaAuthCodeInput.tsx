
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StravaAuthCodeInputProps {
  authCode: string;
  setAuthCode: (code: string) => void;
  initiateStravaAuth: () => void;
}

const StravaAuthCodeInput = ({
  authCode,
  setAuthCode,
  initiateStravaAuth
}: StravaAuthCodeInputProps) => {
  const location = useLocation();
  
  // Extract code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setAuthCode(codeFromUrl);
      console.log("Se detectó un código de autorización en la URL:", codeFromUrl.substring(0, 5) + "...");
    }
  }, [location, setAuthCode]);
  
  return (
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
  );
};

export default StravaAuthCodeInput;
