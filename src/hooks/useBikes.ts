
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { BikeProps } from '@/components/BikeCard';
import { usePremiumFeatures } from '@/services/premiumService';

export const useBikes = () => {
  const [bikeData, setBikeData] = useState<BikeProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const { isPremium } = usePremiumFeatures();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUserId(data.user.id);
        
        // Check if user has Strava connection
        const { data: profileData } = await supabase
          .from('profiles')
          .select('strava_connected, strava_access_token')
          .eq('id', data.user.id)
          .maybeSingle();
          
        setIsStravaConnected(!!profileData?.strava_connected && !!profileData?.strava_access_token);
      }
    };
    
    getUser();
  }, []);

  const fetchBikes = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching bikes data...");
      const { data: bikes, error } = await supabase
        .from('bikes')
        .select('*, maintenance(date, cost)')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching bikes:", error);
        throw error;
      }

      console.log("Bikes data received:", bikes);
      
      if (bikes) {
        const mappedBikes: BikeProps[] = bikes.map(bike => {
          console.log("Processing bike:", bike);
          
          // Calculate total spent from maintenance records
          const totalSpent = bike.maintenance?.reduce((sum: number, record: any) => sum + (record.cost || 0), 0) || 0;
          
          // Find the most recent maintenance date
          let lastMaintenanceDate = null;
          if (bike.maintenance && bike.maintenance.length > 0) {
            // Sort maintenance by date (most recent first)
            const sortedMaintenance = [...bike.maintenance].sort((a: any, b: any) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            lastMaintenanceDate = sortedMaintenance[0].date;
          }

          return {
            id: bike.id,
            name: bike.name,
            type: bike.type,
            year: bike.year || 0,
            image: bike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
            totalSpent: totalSpent,
            lastMaintenance: lastMaintenanceDate ? format(new Date(lastMaintenanceDate), 'dd/MM/yyyy') : 'N/A',
            strava_id: bike.strava_id,
            total_distance: bike.total_distance
          };
        });
        
        console.log("Processed bikes:", mappedBikes);
        setBikeData(mappedBikes);
        
        // Si el usuario no es premium y tiene más de una bicicleta, mostrar el diálogo de degradación
        if (!isPremium && mappedBikes.length > 1) {
          setShowDowngradeDialog(true);
        }
      }
    } catch (error) {
      console.error('Error fetching bikes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las bicicletas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  // Cuando cambia el estado premium, volver a verificar las bicicletas
  useEffect(() => {
    fetchBikes();
  }, [isPremium]);

  return {
    bikeData,
    isLoading,
    userId,
    isPremium,
    showDowngradeDialog,
    setShowDowngradeDialog,
    fetchBikes,
    isStravaConnected
  };
};
