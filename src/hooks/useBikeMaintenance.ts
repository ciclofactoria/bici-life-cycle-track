
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
  next_check_notes: string | null;
}

export const useBikeMaintenance = (
  bike: BikeData | null,
  setBike: React.Dispatch<React.SetStateAction<BikeData | null>>,
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceProps[]>>,
  realBikeId: string | null
) => {
  const { toast } = useToast();

  const handleExportExcel = () => {
    if (!bike) return;
    
    toast({
      title: "Exportación iniciada",
      description: "Preparando archivo de Excel...",
    });
  };

  const handleMaintenanceSuccess = async () => {
    toast({
      title: "Registro creado",
      description: "El registro de mantenimiento se ha añadido correctamente",
    });
    
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
          
          const totalSpent = maintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
          
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

  const handleBikeUpdate = async () => {
    if (!realBikeId) return;

    try {
      const { data: updatedBikeData, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('id', realBikeId)
        .single();

      if (error) throw error;

      if (updatedBikeData && bike) {
        const updatedBike = {
          ...bike,
          name: updatedBikeData.name,
          type: updatedBikeData.type,
          year: updatedBikeData.year || 0,
          image: updatedBikeData.image || bike.image
        };
        
        setBike(updatedBike);
        toast({
          title: "Bicicleta actualizada",
          description: "Los datos de la bicicleta se han actualizado correctamente",
        });
      }
    } catch (error) {
      console.error('Error fetching updated bike data:', error);
    }
  };

  return {
    handleExportExcel,
    handleMaintenanceSuccess,
    handleBikeUpdate
  };
};
