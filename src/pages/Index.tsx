
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BikeCard, { BikeProps } from '@/components/BikeCard';
import EmptyState from '@/components/EmptyState';
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import AddBikeDialog from '@/components/AddBikeDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bikeData, setBikeData] = useState<BikeProps[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleAddBike = () => {
    setIsAddDialogOpen(true);
  };

  const handleBikeClick = (bikeId: string) => {
    navigate(`/bike/${bikeId}`);
  };

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mis Bicicletas</h1>
        </div>
        
        {isLoading ? (
          <p className="text-center py-8">Cargando bicicletas...</p>
        ) : bikeData.length > 0 ? (
          <div>
            {bikeData.map((bike) => (
              <div key={bike.id} onClick={() => handleBikeClick(bike.id)} className="cursor-pointer">
                <BikeCard bike={bike} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No se encontraron bicicletas"
            description="Agrega tu primera bicicleta para comenzar a registrar el mantenimiento"
            actionLabel="Agregar Bicicleta"
            onAction={handleAddBike}
          />
        )}
      </div>
      
      <FloatingActionButton onClick={handleAddBike} label="Agregar Bicicleta" />
      <AddBikeDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchBikes}
      />
      <BottomNav activePage="/" />
    </div>
  );
};

export default Index;
