
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { usePremiumFeatures } from '@/services/premiumService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const StravaConnectCard = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();

  const handleConnectStrava = async () => {
    try {
      setIsConnecting(true);
      
      // Si el usuario está cargando el estado premium, esperar un momento
      if (isPremiumLoading) {
        toast({
          title: 'Verificando estado premium',
          description: 'Espera un momento mientras verificamos tu suscripción',
        });
        // Esperar un breve periodo para dar tiempo a cargar el estado premium
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Verificar si el usuario es premium para conectar con Strava
      // Esta comprobación debe hacerse después de estar seguros de que se ha cargado el estado
      if (!isPremium) {
        toast({
          title: 'Función premium',
          description: 'La conexión con Strava está disponible solo para usuarios premium',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-strava-auth-url', {
          body: {
            redirect_uri: 'https://bici-life-cycle-track.lovable.app/strava-callback'
          }
        });
        
        if (error) {
          throw new Error(error.message || 'Error al generar la URL de autenticación de Strava');
        }
        
        if (!data || !data.authUrl) {
          throw new Error('No se recibió una URL de autenticación válida');
        }
        
        console.log('Redirigiendo a página de autorización de Strava:', data.authUrl);
        
        // Abrimos en la misma ventana para asegurar el manejo correcto de la redirección
        window.location.href = data.authUrl;
        
        toast({
          title: "Conectando con Strava",
          description: "Redirigiendo a la página de autorización de Strava...",
        });
      } catch (err) {
        console.error('Error generando URL de Strava:', err);
        toast({
          title: 'Error',
          description: 'No se pudo generar la URL de autenticación con Strava',
          variant: 'destructive',
        });
        setIsConnecting(false);
      }
      
    } catch (err) {
      console.error('Error al iniciar autenticación con Strava:', err);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la autenticación con Strava',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conectar con apps</CardTitle>
        <CardDescription>Conecta con otras aplicaciones para sincronizar datos</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleConnectStrava}
          className="w-full bg-[#FC4C02] hover:bg-[#e8440c] text-white"
          disabled={isConnecting || isPremiumLoading}
        >
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M12.0002944,0 C5.37321219,0 0,5.37360294 0,12.0002944 C0,18.627693 5.37321219,24 12.0002944,24 C18.6270837,24 24,18.627693 24,12.0002944 C24,5.37360294 18.6270837,0 12.0002944,0 Z M17.8255796,18 L14.9215449,18 L13.9998355,16.1545586 L11.0003824,16.1545586 L10.0792167,18 L7.17467572,18 L12.0000589,8 L17.8255796,18 Z M10.4127964,14.2344142 L11.9997767,11.2752987 L13.5879511,14.2344142 L10.4127964,14.2344142 Z"></path>
            </svg>
            <span>{isConnecting ? 'Conectando...' : 'Conectar con Strava'}</span>
          </div>
          {!isPremium && !isPremiumLoading && (
            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
              <img 
                src="/lovable-uploads/c55d72b0-c3b4-4c57-bdbf-fb609210b8dc.png" 
                className="h-3 w-3" 
                alt="Premium" 
              />
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
