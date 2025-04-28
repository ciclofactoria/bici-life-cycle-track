
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaintenanceItem, { MaintenanceProps } from '@/components/MaintenanceItem';
import FloatingActionButton from '@/components/FloatingActionButton';
import BottomNav from '@/components/BottomNav';
import EmptyState from '@/components/EmptyState';
import AddMaintenanceDialog from '@/components/AddMaintenanceDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Define Bike interface to match expected structure
interface Bike {
  id: string;
  name: string;
  type: string;
  year: number;
  image: string;
  totalSpent: number;
  lastMaintenance: string;
}

const BikeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bike, setBike] = useState<Bike | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceProps[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [realBikeId, setRealBikeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the actual bike by the display ID to get the UUID
    const fetchBike = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching bike with ID:", id);
        
        // Try to get all bikes first to find the correct one
        const { data: userBikes, error: userBikesError } = await supabase
          .from('bikes')
          .select('*');
          
        if (userBikesError) {
          console.error("Error fetching bikes:", userBikesError);
          throw userBikesError;
        }
        
        console.log("All bikes:", userBikes);
        
        // Find the bike by UUID or index
        let selectedBike = null;
        
        if (id) {
          // First try direct UUID match
          selectedBike = userBikes.find(b => b.id === id);
          
          // If not found, try by index position
          if (!selectedBike && userBikes.length > 0 && !isNaN(Number(id))) {
            const numId = parseInt(id);
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
        
        // Now fetch maintenance records for this bike
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance')
          .select('*')
          .eq('bike_id', selectedBike.id)
          .order('date', { ascending: false });
          
        if (maintenanceError) {
          console.error("Error fetching maintenance:", maintenanceError);
          throw maintenanceError;
        }
        
        // Calculate total spent and find last maintenance date
        let totalSpent = 0;
        let lastMaintenanceDate = null;
        
        if (maintenanceData && maintenanceData.length > 0) {
          totalSpent = maintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
          
          // Find most recent maintenance date
          const sortedMaintenance = [...maintenanceData].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          lastMaintenanceDate = sortedMaintenance[0].date;
          
          // Format maintenance records
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

        // Map the Supabase data to match our Bike interface
        const mappedBike: Bike = {
          id: selectedBike.id,
          name: selectedBike.name,
          type: selectedBike.type,
          year: selectedBike.year || 0,
          image: selectedBike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
          totalSpent: totalSpent,
          lastMaintenance: lastMaintenanceDate ? format(new Date(lastMaintenanceDate), 'dd/MM/yyyy') : 'N/A',
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

    if (id) {
      fetchBike();
    }
  }, [id, toast]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAddMaintenance = () => {
    if (!realBikeId) {
      toast({
        title: "Error",
        description: "No se puede agregar mantenimiento sin una bicicleta válida",
        variant: "destructive"
      });
      return;
    }
    setIsAddDialogOpen(true);
  };

  const handleMaintenanceSuccess = async () => {
    // Refetch bike and maintenance data to update the UI
    toast({
      title: "Registro creado",
      description: "El registro de mantenimiento se ha añadido correctamente",
    });
    
    // Reload data
    if (realBikeId) {
      try {
        const { data: maintenanceData } = await supabase
          .from('maintenance')
          .select('*')
          .eq('bike_id', realBikeId)
          .order('date', { ascending: false });
          
        if (maintenanceData) {
          const formattedMaintenance = maintenanceData.map(record => ({
            id: record.id,
            date: format(new Date(record.date), 'dd/MM/yyyy'),
            type: record.type,
            cost: record.cost,
            notes: record.notes || '',
            hasReceipt: record.has_receipt || false
          }));
          
          setMaintenance(formattedMaintenance);
          
          // Update total spent and last maintenance
          const totalSpent = maintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
          
          // Find most recent maintenance date
          if (maintenanceData.length > 0) {
            const sortedMaintenance = [...maintenanceData].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const lastMaintenanceDate = sortedMaintenance[0].date;
            
            if (bike) {
              const updatedBike = { 
                ...bike, 
                totalSpent,
                lastMaintenance: format(new Date(lastMaintenanceDate), 'dd/MM/yyyy')
              };
              setBike(updatedBike);
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing maintenance data:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="p-4 flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleBack}>Volver a inicio</Button>
        <BottomNav activePage="/" />
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-screen">
        <p className="mb-4">Bicicleta no encontrada</p>
        <Button onClick={handleBack}>Volver a inicio</Button>
        <BottomNav activePage="/" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="relative aspect-video w-full">
        <img 
          src={bike.image} 
          alt={bike.name} 
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex justify-between items-start p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full"
              onClick={() => console.log('Edit bike settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent pt-16 px-4 pb-4">
          <h1 className="text-2xl font-bold">{bike.name}</h1>
          <p className="text-muted-foreground">{bike.type}, {bike.year}</p>
        </div>
      </div>
      
      <div className="bici-container">
        <div className="grid grid-cols-2 gap-2 my-6 bg-card rounded-lg p-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Gasto Total</p>
            <p className="font-medium text-bicicare-green">${bike.totalSpent}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Último Servicio</p>
            <p className="font-medium">{bike.lastMaintenance}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Historial de Mantenimiento</h2>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 text-muted-foreground hover:text-bicicare-green"
            onClick={() => console.log('Export history')}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">Exportar</span>
          </Button>
        </div>
        
        {maintenance.length > 0 ? (
          <div className="space-y-3 pb-4">
            {maintenance.map((item) => (
              <MaintenanceItem key={item.id} maintenance={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay registros de mantenimiento"
            description="Agrega tu primer registro de mantenimiento para comenzar a llevar el control"
            actionLabel="Agregar Registro"
            onAction={handleAddMaintenance}
          />
        )}
      </div>
      
      <FloatingActionButton onClick={handleAddMaintenance} label="Agregar Mantenimiento" />
      <AddMaintenanceDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        bikeId={realBikeId || ''}
        onSuccess={handleMaintenanceSuccess}
      />
      <BottomNav activePage="/" />
    </div>
  );
};

export default BikeDetail;
