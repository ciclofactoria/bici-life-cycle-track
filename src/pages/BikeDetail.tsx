
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

  useEffect(() => {
    // Fetch the actual bike by the display ID to get the UUID
    const fetchBike = async () => {
      try {
        const { data, error } = await supabase
          .from('bikes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          // If not found by UUID, try to find by numeric ID or display ID
          // This is a fallback for development with mock data
          console.log('Using mock bike data as fallback');
          setRealBikeId(id);
        } else if (data) {
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
        }
      } catch (error) {
        console.error('Error fetching bike:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la bicicleta",
          variant: "destructive"
        });
      }
    };

    if (id) {
      fetchBike();
      
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
  }, [id, toast]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAddMaintenance = () => {
    setIsAddDialogOpen(true);
  };

  const handleMaintenanceSuccess = async () => {
    // Here you would fetch the updated maintenance list
    toast({
      title: "Registro creado",
      description: "El registro de mantenimiento se ha añadido correctamente",
    });
  };

  if (!bike) {
    return <div>Bicicleta no encontrada</div>;
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
