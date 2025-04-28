
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaintenanceItem, { MaintenanceProps } from '@/components/MaintenanceItem';
import FloatingActionButton from '@/components/FloatingActionButton';
import BottomNav from '@/components/BottomNav';
import { bikes, maintenanceLogs } from '@/data/mockData';
import EmptyState from '@/components/EmptyState';
import AddMaintenanceDialog from '@/components/AddMaintenanceDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const BikeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bike, setBike] = useState(bikes.find((b) => b.id === id));
  const [maintenance, setMaintenance] = useState<MaintenanceProps[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [realBikeId, setRealBikeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the actual bike by the display ID to get the UUID
    const fetchBike = async () => {
      setIsLoading(true);
      try {
        // First try to fetch by ID directly (in case it's already a UUID)
        let { data, error } = await supabase
          .from('bikes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          // If that fails, try to fetch by numeric ID (fallback for non-UUID IDs)
          console.log('Could not find bike by direct ID, trying other methods');
          
          // Get all bikes for the current user and find the one with matching display ID
          const { data: userBikes, error: userBikesError } = await supabase
            .from('bikes')
            .select('*');
            
          if (userBikesError) {
            throw userBikesError;
          }
          
          // Find the bike that matches either by ID or by position in the list
          data = userBikes.find((b, index) => b.id === id || (id && index + 1 === parseInt(id)));
          
          if (!data) {
            // If still not found, use mock data as fallback
            console.log('Using mock bike data as fallback');
            setRealBikeId(id);
            setIsLoading(false);
            return;
          }
        }
        
        if (data) {
          // Map the Supabase data to match our Bike interface
          const mappedBike = {
            id: data.id,
            name: data.name,
            type: data.type,
            year: data.year || 0,
            image: data.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
            totalSpent: 0, // We'll calculate this from maintenance records later
            lastMaintenance: data.last_maintenance_date ? format(new Date(data.last_maintenance_date), 'MMM dd') : 'N/A',
            nextCheck: data.next_check_date ? format(new Date(data.next_check_date), 'MMM dd') : 'N/A'
          };
          
          setBike(mappedBike);
          setRealBikeId(data.id);
          
          // Now fetch maintenance records for this bike
          const { data: maintenanceData, error: maintenanceError } = await supabase
            .from('maintenance')
            .select('*')
            .eq('bike_id', data.id)
            .order('date', { ascending: false });
            
          if (!maintenanceError && maintenanceData) {
            const formattedMaintenance = maintenanceData.map(record => ({
              id: record.id,
              date: format(new Date(record.date), 'dd/MM/yyyy'),
              type: record.type,
              cost: record.cost,
              notes: record.notes || '',
              hasReceipt: record.has_receipt || false
            }));
            
            setMaintenance(formattedMaintenance);
            
            // Calculate total spent
            const totalSpent = maintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
            mappedBike.totalSpent = totalSpent;
            setBike(mappedBike);
          } else {
            // Fallback to mock maintenance data
            const filteredLogs = maintenanceLogs
              .filter((log) => log.bikeId === id)
              .map((log) => ({ 
                id: log.id,
                date: log.date,
                type: log.type,
                cost: log.cost,
                notes: log.notes,
                hasReceipt: log.hasReceipt
              }));
            
            setMaintenance(filteredLogs);
          }
        }
      } catch (error) {
        console.error('Error fetching bike:', error);
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
          
          // Update total spent
          const totalSpent = maintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
          if (bike) {
            const updatedBike = { ...bike, totalSpent };
            setBike(updatedBike);
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

  if (!bike) {
    return <div className="p-4">Bicicleta no encontrada</div>;
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
        <div className="grid grid-cols-3 gap-2 my-6 bg-card rounded-lg p-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Gasto Total</p>
            <p className="font-medium text-bicicare-green">${bike.totalSpent}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Último Servicio</p>
            <p className="font-medium">{bike.lastMaintenance}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Próxima Revisión</p>
            <p className="font-medium">{bike.nextCheck}</p>
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
