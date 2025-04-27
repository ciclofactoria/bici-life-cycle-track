
import React from 'react';
import { Settings, Archive, FileText, Bike } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const STRAVA_CLIENT_ID = '117183';
const REDIRECT_URI = 'https://lovable.dev/strava-callback';

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

  const handleStravaConnect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para conectar con Strava",
        variant: "destructive"
      });
      return;
    }

    const scope = 'read,activity:read';
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&state=${user.id}`;
    window.location.href = authUrl;
  };

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Más</h1>
        
        <div className="bg-card rounded-lg divide-y divide-border">
          <SettingsItem 
            icon={Settings}
            label="Configuración"
            onClick={() => console.log('Settings clicked')}
          />
          <SettingsItem 
            icon={Archive}
            label="Bicicletas Archivadas"
            onClick={() => console.log('Archived bikes clicked')}
          />
          <SettingsItem 
            icon={FileText}
            label="Exportar Datos"
            onClick={() => console.log('Export data clicked')}
          />
          <SettingsItem 
            icon={Bike}
            label="Conectar con Strava"
            onClick={handleStravaConnect}
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
