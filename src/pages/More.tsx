
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
import { FileText, Archive, LogOut, ChevronRight, Clock, ArrowRightCircle, Bike } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { generateFullMaintenanceExcel } from '@/utils/excelGenerator';

const More = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

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
      const { data, error } = await supabase.functions.invoke('strava-auth', {
        body: { redirect_url: window.location.origin + '/strava-callback' },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No se recibió URL de autorización');

      // Redirigir a la URL de autorización de Strava
      window.location.href = data.url;
    } catch (err) {
      console.error('Error initiating Strava auth:', err);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la autenticación con Strava',
        variant: 'destructive',
      });
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
                disabled={isExporting}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{isExporting ? 'Exportando...' : 'Exportar historial completo'}</span>
                </div>
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
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <path d="M12.0002944,0 C5.37321219,0 0,5.37360294 0,12.0002944 C0,18.627693 5.37321219,24 12.0002944,24 C18.6270837,24 24,18.627693 24,12.0002944 C24,5.37360294 18.6270837,0 12.0002944,0 Z M17.8255796,18 L14.9215449,18 L13.9998355,16.1545586 L11.0003824,16.1545586 L10.0792167,18 L7.17467572,18 L12.0000589,8 L17.8255796,18 Z M10.4127964,14.2344142 L11.9997767,11.2752987 L13.5879511,14.2344142 L10.4127964,14.2344142 Z"></path>
                  </svg>
                  <span>Conectar con Strava</span>
                </div>
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
