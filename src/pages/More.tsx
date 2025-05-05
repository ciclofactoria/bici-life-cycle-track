
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Archive, LogOut, ChevronRight, Diamond } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { generateFullMaintenanceExcel } from '@/utils/excelGenerator';
import { usePremiumFeatures } from '@/services/premiumService';
import PremiumStatus from '@/components/PremiumStatus';

const More = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleConnectStrava = async () => {
    try {
      // Verificar si el usuario es premium para conectar con Strava
      if (!isPremium) {
        toast({
          title: 'Función premium',
          description: 'La conexión con Strava está disponible solo para usuarios premium',
          variant: 'destructive',
        });
        return;
      }
      
      setIsConnecting(true);
      
      // Actualizado con los valores correctos según lo proporcionado por el usuario
      const clientId = '157332';
      
      // IMPORTANTE: Usamos la URL exacta registrada en la aplicación de Strava
      // En este caso, debe coincidir exactamente con lo que has registrado en Strava
      const redirectUri = encodeURIComponent('https://lovable.dev/strava-callback');
      
      // Ajustamos los scopes para incluir profile:read_all que es necesario para acceder a la lista de bicicletas
      // Añadimos explícitamente todos los scopes que necesitamos
      const scope = encodeURIComponent('read,profile:read_all,activity:read_all');
      const responseType = 'code';
      const approvalPrompt = 'auto';
      
      // URL formateada según la documentación oficial de Strava
      const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&approval_prompt=${approvalPrompt}`;
      
      console.log('Redirigiendo a página de autorización de Strava con scopes:', scope);
      
      // Abrimos en una nueva ventana del navegador para asegurar que se usa el navegador externo
      window.open(stravaAuthUrl, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Conectando con Strava",
        description: "Se ha abierto una nueva ventana para autorizar a Strava. Por favor completa el proceso allí.",
      });
      
      setIsConnecting(false);
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

  const handleExportFullHistory = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Necesitas iniciar sesión para exportar",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar si el usuario es premium para exportar
    if (!isPremium) {
      toast({
        title: 'Función premium',
        description: 'Las exportaciones a Excel están disponibles solo para usuarios premium',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      await generateFullMaintenanceExcel(user.id);
      toast({
        title: "Exportado con éxito",
        description: "El historial completo se ha exportado a Excel",
      });
    } catch (error) {
      console.error("Error exportando historial completo:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el historial completo",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Más</h1>
        
        <PremiumStatus />
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/archived-bikes')}
              >
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  <span>Bicicletas archivadas</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={handleExportFullHistory}
                disabled={isExporting || isPremiumLoading}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{isExporting ? 'Exportando...' : 'Exportar historial completo'}</span>
                </div>
                {!isPremium && !isPremiumLoading && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Diamond className="h-3 w-3 text-primary" /> Premium
                  </span>
                )}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
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
                    <Diamond className="h-3 w-3 text-primary" /> Premium
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Cerrar sesión</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Quieres cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tendrás que volver a iniciar sesión para acceder a tus datos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Cerrar sesión</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <BottomNav activePage="/more" />
    </div>
  );
};

export default More;
