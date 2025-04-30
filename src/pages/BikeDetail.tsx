import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { generateMaintenanceExcel } from '@/utils/excelGenerator';
import { Button } from "@/components/ui/button";
import BikeDetailContent from '@/components/bike/BikeDetailContent';
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import AddMaintenanceDialog from '@/components/AddMaintenanceDialog';
import EditBikeDialog from '@/components/EditBikeDialog';
import FilterMaintenanceDialog from '@/components/FilterMaintenanceDialog';
import NextAppointmentDialog from '@/components/NextAppointmentDialog';
import AppointmentDialog from '@/components/AppointmentDialog';
import { useBikeDetail } from '@/hooks/useBikeDetail';
import { checkNextDayAppointments } from '@/utils/notifications';

const BikeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isNextAppointmentDialogOpen, setIsNextAppointmentDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);

  const {
    bike,
    setBike,
    maintenance,
    setMaintenance,
    realBikeId,
    isLoading,
    error
  } = useBikeDetail(id);

  useEffect(() => {
    if (bike) {
      checkNextDayAppointments(bike);
    }
  }, [bike]);

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

  const handleExportExcel = () => {
    if (!bike) return;
    
    try {
      generateMaintenanceExcel(bike, maintenance);
      toast({
        title: "Exportado con éxito",
        description: "El historial de mantenimiento se ha exportado a Excel",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el historial",
        variant: "destructive"
      });
    }
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

  const handleSetNextAppointment = async (date: Date | undefined, notes: string) => {
    if (!realBikeId || !date) return;

    try {
      // Obtener el ID del usuario actual
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user?.id) {
        toast({
          title: "Error",
          description: "Usuario no autenticado",
          variant: "destructive"
        });
        return;
      }

      const userId = sessionData.session.user.id;
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          bike_id: realBikeId,
          user_id: userId,
          date: formattedDate,
          notes: notes
        });

      if (error) throw error;

      toast({
        title: "Cita programada",
        description: "La cita ha sido programada correctamente",
      });

    } catch (error) {
      console.error('Error setting next appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo programar la cita",
        variant: "destructive"
      });
    }
  };

  const handleAppointmentSuccess = () => {
    // Actualizar la vista después de cambios en citas
    if (bike) {
      // Forzar actualización del componente
      setBike({...bike});
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
    <>
      <BikeDetailContent
        bike={bike}
        maintenance={maintenance}
        onBack={handleBack}
        onEdit={handleEditBike}
        onFilter={() => setIsFilterDialogOpen(true)}
        onExport={handleExportExcel}
        onAddMaintenance={handleAddMaintenance}
        onScheduleAppointment={() => setIsAppointmentDialogOpen(true)}
      />
      
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
      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={setIsAppointmentDialogOpen}
        bikeId={realBikeId || ''}
        bikeName={bike.name}
        onSaved={handleAppointmentSuccess}
      />
      <BottomNav activePage="/" />
    </>
  );
};

export default BikeDetail;
