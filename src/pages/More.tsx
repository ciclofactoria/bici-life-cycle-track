
import React from 'react';
import { Settings, Archive, FileText, Bike, LogOut, Tool } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const STRAVA_CLIENT_ID = '157332'; // Client ID de Strava

const SettingsItem = ({ icon: Icon, label, onClick }: { 
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <div 
    className="flex items-center gap-3 p-4 hover:bg-muted rounded-lg cursor-pointer"
    onClick={onClick}
  >
    <div className="bg-secondary p-2 rounded-lg">
      <Icon className="h-5 w-5 text-bicicare-green" />
    </div>
    <span>{label}</span>
  </div>
);

const More = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleStravaConnect = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para importar bicicletas de Strava",
        variant: "destructive"
      });
      return;
    }

    // Use the corrected scope as provided, which includes profile:read_all
    const scope = 'read,profile:read_all';
    
    // Use the specific redirect URI provided
    const redirectUri = encodeURIComponent("https://lovable.dev/projects/6eada54a-286e-4a45-a44f-46739891e395");
    
    console.log("URL de redirección para Strava:", redirectUri);
    
    // Construct the authorization URL with the proper redirect URI and scopes
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${user.email}`;
    
    console.log("URL completa de autorización Strava:", authUrl);
    
    // Open in external browser by using window.open
    window.open(authUrl, '_blank');
  };

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Más</h1>
        
        {user && (
          <div className="mb-6 p-4 bg-card rounded-lg">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-lg font-semibold">
                  {user.email?.[0].toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium">{user.user_metadata?.full_name || 'Usuario'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-card rounded-lg divide-y divide-border">
          <SettingsItem 
            icon={Settings}
            label="Configuración"
            onClick={() => console.log('Settings clicked')}
          />
          <SettingsItem 
            icon={Archive}
            label="Bicicletas Archivadas"
            onClick={() => navigate('/archived-bikes')}
          />
          <SettingsItem 
            icon={FileText}
            label="Exportar Datos"
            onClick={() => console.log('Export data clicked')}
          />
          <SettingsItem 
            icon={Bike}
            label="Importar bicicletas de Strava"
            onClick={handleStravaConnect}
          />
          <SettingsItem 
            icon={Tool}
            label="Prueba de conexión Strava"
            onClick={() => navigate('/strava-test')}
          />
          <SettingsItem 
            icon={LogOut}
            label="Cerrar Sesión"
            onClick={signOut}
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">BiciCare v1.0.0</p>
        </div>
      </div>
      <BottomNav activePage="/more" />
    </div>
  );
};

export default More;
