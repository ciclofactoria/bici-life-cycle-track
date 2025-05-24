
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  next_check_notes: string | null;
  total_distance?: number;
  strava_id?: string;
}

export const useBikeDetail = (bikeId: string | undefined) => {
  const [bike, setBike] = useState<BikeData | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceProps[]>([]);
  const [realBikeId, setRealBikeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBike = async () => {
      if (!bikeId) {
        setError("No se especificó una bicicleta");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching bike with ID:", bikeId);
        
        // Primero obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Usuario no autenticado");
          setIsLoading(false);
          return;
        }
        
        const { data: userBikes, error: userBikesError } = await supabase
          .from('bikes')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', false);
          
        if (userBikesError) {
          console.error("Error fetching bikes:", userBikesError);
          setError("Error al obtener las bicicletas");
          setIsLoading(false);
          return;
        }
        
        console.log("All bikes:", userBikes);
        
        if (!userBikes || userBikes.length === 0) {
          setError("No tienes bicicletas registradas");
          setIsLoading(false);
          return;
        }
        
        let selectedBike = null;
        
        // Buscar la bicicleta por ID exacto
        selectedBike = userBikes.find(b => b.id === bikeId);
        
        // Si no se encuentra por ID exacto, intentar buscar por índice (para compatibilidad)
        if (!selectedBike && !isNaN(Number(bikeId))) {
          const numId = parseInt(bikeId);
          if (numId > 0 && numId <= userBikes.length) {
            selectedBike = userBikes[numId - 1];
          }
        }
        
        if (!selectedBike) {
          setError("Bicicleta no encontrada");
          setIsLoading(false);
          return;
        }
        
        console.log("Found bike:", selectedBike);
        setRealBikeId(selectedBike.id);
        
        // Obtener el mantenimiento de la bicicleta
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance')
          .select('*')
          .eq('bike_id', selectedBike.id)
          .order('date', { ascending: false });
          
        if (maintenanceError) {
          console.error("Error fetching maintenance:", maintenanceError);
          // No es un error crítico, continuar sin mantenimiento
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
            hasReceipt: record.has_receipt || false,
            distance_at_maintenance: record.distance_at_maintenance
          }));
          
          setMaintenance(formattedMaintenance);
        }

        // Asegurar que total_distance se trate como número, no como string
        const totalDistance = selectedBike.total_distance ? Number(selectedBike.total_distance) : undefined;

        const mappedBike: BikeData = {
          id: selectedBike.id,
          name: selectedBike.name,
          type: selectedBike.type,
          year: selectedBike.year || 0,
          image: selectedBike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
          totalSpent: totalSpent,
          lastMaintenance: lastMaintenanceDate ? format(new Date(lastMaintenanceDate), 'dd/MM/yyyy') : 'N/A',
          next_check_date: selectedBike.next_check_date,
          next_check_notes: selectedBike.next_check_notes,
          total_distance: totalDistance,
          strava_id: selectedBike.strava_id
        };
        
        setBike(mappedBike);
        
      } catch (error: any) {
        console.error('Error fetching bike:', error);
        setError("Error al cargar la bicicleta: " + (error.message || "Error desconocido"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBike();
  }, [bikeId]);

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
