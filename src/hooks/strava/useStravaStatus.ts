
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para verificar el estado de conexión con Strava
 */
export function useStravaStatus() {
  const { user } = useAuth();
  const [isStravaConnected, setIsStravaConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Verificar si el usuario ya tiene una conexión con Strava
  useEffect(() => {
    const checkStravaConnection = async () => {
      if (!user) {
        setIsStravaConnected(false);
        setIsCheckingConnection(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('strava_connected, strava_access_token')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        setIsStravaConnected(!!profileData?.strava_connected && !!profileData?.strava_access_token);
      } catch (err) {
        console.error('Error al verificar conexión con Strava:', err);
        setIsStravaConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    checkStravaConnection();
  }, [user]);

  return {
    isStravaConnected,
    isCheckingConnection
  };
}
