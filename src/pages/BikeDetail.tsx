import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { generateMaintenancePDF } from '@/utils/pdfGenerator';
import { Button } from "@/components/ui/button";
import BikeHeader from '@/components/bike/BikeHeader';
import BikeStats from '@/components/bike/BikeStats';
import MaintenanceHistory from '@/components/bike/MaintenanceHistory';
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import AddMaintenanceDialog from '@/components/AddMaintenanceDialog';
import EditBikeDialog from '@/components/EditBikeDialog';
import FilterMaintenanceDialog from '@/components/FilterMaintenanceDialog';
import NextAppointmentDialog from '@/components/NextAppointmentDialog';
import { MaintenanceProps } from '@/components/MaintenanceItem';

interface Bike {
  id: string;
  name: string;
  type: string;
  year: number;
  image: string;
  totalSpent: number;
  lastMaintenance: string;
  next_check_date: string | null;
}

const BikeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bike, setBike] = useState<Bike | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceProps[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [realBikeId, setRealBikeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNextAppointmentDialogOpen, setIsNextAppointmentDialogOpen] = useState(false);

  useEffect(() => {
    const fetchBike = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching bike with ID:", id);
        
        const { data: userBikes, error: userBikesError } = await supabase
          .from('bikes')
          .select('*');
          
        if (userBikesError) {
          console.error("Error fetching bikes:", userBikesError);
          throw userBikesError;
        }
        
        console.log("All bikes:", userBikes);
        
        let selectedBike = null;
        
        if (id) {
          selectedBike = userBikes.find(b => b.id === id);
          
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

        const mappedBike: Bike = {
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

    if (id) {
      fetchBike();
    }
  }, [id, toast]);

  useEffect(() => {
    if (bike?.next_check_date) {
      try {
        const appointmentDate = new Date(bike.next_check_date);
        
        if (!isNaN(appointmentDate.getTime())) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          if (
            appointmentDate.getDate() === tomorrow.getDate() &&
            appointmentDate.getMonth() === tomorrow.getMonth() &&
            appointmentDate.getFullYear() === tomorrow.getFullYear()
          ) {
            toast({
              title: "Recordatorio de cita",
              description: `Tienes una cita programada mañana para tu bicicleta ${bike.name}`,
            });
          }
        }
      } catch (error) {
        console.error('Error processing appointment date:', error);
      }
    }
  }, [bike, toast]);

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

  const handleEditBike = () => {
    setIsEditDialogOpen(true);
  };

  const handleExportPDF = () => {
    if (!bike) return;
    
    try {
      generateMaintenancePDF(bike, maintenance);
      toast({
        title: "Exportado con éxito",
        description: "El historial de mantenimiento se ha exportado a PDF",
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el historial",
        variant: "destructive"
      });
    }
  };

  const handleOpenFilter = () => {
    setIsFilterDialogOpen(true);
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

      if (updatedBikeData) {
        const updatedBike: Bike = {
          ...bike!,
          name: updatedBikeData.name,
          type: updatedBikeData.type,
          year: updatedBikeData.year || 0,
          image: updatedBikeData.image || bike!.image
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

  const handleSetNextAppointment = async (date: Date | undefined) => {
    if (!realBikeId || !date) return;

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('bikes')
        .update({
          next_check_date: formattedDate
        })
        .eq('id', realBikeId);

      if (error) throw error;

      toast({
        title: "Cita programada",
        description: "La próxima cita ha sido programada correctamente",
      });

      if (bike) {
        setBike({
          ...bike,
          next_check_date: formattedDate
        });
      }
    } catch (error) {
      console.error('Error setting next appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo programar la cita",
        variant: "destructive"
      });
    }
  };

  const handleOpenNextAppointmentDialog = () => {
    setIsNextAppointmentDialogOpen(true);
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

  const formattedNextCheckDate = bike.next_check_date ? 
    (() => {
      try {
        const date = new Date(bike.next_check_date);
        return !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy') : undefined;
      } catch (error) {
        console.error('Error formatting next check date:', error);
        return undefined;
      }
    })() : 
    undefined;

  return (
    <div className="pb-16">
      <BikeHeader
        image={bike.image}
        name={bike.name}
        type={bike.type}
        year={bike.year}
        onBack={handleBack}
        onEdit={handleEditBike}
      />
      
      <div className="bici-container">
        <BikeStats
          totalSpent={bike.totalSpent}
          lastMaintenance={bike.lastMaintenance}
          nextCheckDate={formattedNextCheckDate}
          onScheduleAppointment={handleOpenNextAppointmentDialog}
        />
        
        <MaintenanceHistory
          maintenance={maintenance}
          onFilter={() => setIsFilterDialogOpen(true)}
          onExport={handleExportPDF}
          onAddMaintenance={handleAddMaintenance}
        />
      </div>
      
      <FloatingActionButton onClick={handleAddMaintenance} label="Agregar Mantenimiento" />
      
      <AddMaintenanceDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        bikeId={realBikeId || ''}
        onSuccess={handleMaintenanceSuccess}
      />
      <EditBikeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        bikeId={realBikeId || ''}
        bikeData={{
          name: bike.name,
          type: bike.type,
          year: bike.year,
          image: bike.image
        }}
        onSuccess={handleBikeUpdate}
      />
      <FilterMaintenanceDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        maintenance={maintenance}
      />
      <NextAppointmentDialog
        open={isNextAppointmentDialogOpen}
        onOpenChange={setIsNextAppointmentDialogOpen}
        currentDate={bike.next_check_date ? new Date(bike.next_check_date) : undefined}
        onDateSelect={handleSetNextAppointment}
      />
      <BottomNav activePage="/" />
    </div>
  );
};

export default BikeDetail;
