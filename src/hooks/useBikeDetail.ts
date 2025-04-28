
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MaintenanceProps } from '@/components/MaintenanceItem';

export interface BikeData {
  id: string;
  name: string;
  type: string;
  year: number;
  image: string;
  totalSpent: number;
  lastMaintenance: string;
  next_check_date: string | null;
}

export const useBikeDetail = (bikeId: string | undefined) => {
  const { toast } = useToast();
  const [bike, setBike] = useState<BikeData | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceProps[]>([]);
  const [realBikeId, setRealBikeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBike = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching bike with ID:", bikeId);
        
        const { data: userBikes, error: userBikesError } = await supabase
          .from('bikes')
          .select('*');
          
        if (userBikesError) {
          console.error("Error fetching bikes:", userBikesError);
          throw userBikesError;
        }
        
        console.log("All bikes:", userBikes);
        
        let selectedBike = null;
        
        if (bikeId) {
          selectedBike = userBikes.find(b => b.id === bikeId);
          
          if (!selectedBike && userBikes.length > 0 && !isNaN(Number(bikeId))) {
            const numId = parseInt(bikeId);
            if (numId > 0 && numId <= userBikes.length) {
              selectedBike = userBikes[numId - 1];
            }
          }
        }
        
        if (!selectedBike) {
          setError("No se encontró la bicicleta especificada");
          setIsLoading(false);
          return;
        }
        
        console.log("Found bike:", selectedBike);
        setRealBikeId(selectedBike.id);
        
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance')
          .select('*')
          .eq('bike_id', selectedBike.id)
          .order('date', { ascending: false });
          
        if (maintenanceError) {
          console.error("Error fetching maintenance:", maintenanceError);
          throw maintenanceError;
        }
        
        let totalSpent = 0;
        let lastMaintenanceDate = null;
        
        if (maintenanceData && maintenanceData.length > 0) {
          totalSpent = maintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
          
          const sortedMaintenance = [...maintenanceData].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          lastMaintenanceDate = sortedMaintenance[0].date;
          
          const formattedMaintenance = maintenanceData.map(record => ({
            id: record.id,
            date: format(new Date(record.date), 'dd/MM/yyyy'),
            type: record.type,
            cost: record.cost,
            notes: record.notes || '',
            hasReceipt: record.has_receipt || false
          }));
          
          setMaintenance(formattedMaintenance);
        }

        const mappedBike: BikeData = {
          id: selectedBike.id,
          name: selectedBike.name,
          type: selectedBike.type,
          year: selectedBike.year || 0,
          image: selectedBike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
          totalSpent: totalSpent,
          lastMaintenance: lastMaintenanceDate ? format(new Date(lastMaintenanceDate), 'dd/MM/yyyy') : 'N/A',
          next_check_date: selectedBike.next_check_date
        };
        
        setBike(mappedBike);
      } catch (error) {
        console.error('Error fetching bike:', error);
        setError("No se pudo cargar la bicicleta");
        toast({
          title: "Error",
          description: "No se pudo cargar la bicicleta",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (bikeId) {
      fetchBike();
    }
  }, [bikeId, toast]);

  return {
    bike,
    setBike,
    maintenance,
    setMaintenance,
    realBikeId,
    isLoading,
    error
  };
};
