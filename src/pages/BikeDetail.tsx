
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import BikeDetailContent from '@/components/bike/BikeDetailContent';
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import { useBikeDetail } from '@/hooks/useBikeDetail';
import { checkNextDayAppointments } from '@/utils/notifications';
import BikeDetailDialogs from '@/components/bike/BikeDetailDialogs';
import { useMaintenanceExport } from '@/hooks/useMaintenanceExport';
import { useBikeMaintenance } from '@/hooks/useBikeMaintenance';
import { useBikeAppointments } from '@/hooks/useBikeAppointments';

const BikeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  // Custom hooks
  const {
    bike,
    setBike,
    maintenance,
    setMaintenance,
    realBikeId,
    isLoading,
    error
  } = useBikeDetail(id);

  const { handleExportExcel } = useMaintenanceExport();
  
  const {
    handleMaintenanceSuccess,
    handleBikeUpdate
  } = useBikeMaintenance(bike, setBike, setMaintenance, realBikeId);
  
  const { handleSetNextAppointment } = useBikeAppointments(realBikeId, bike?.name);

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
      toast("Error", {
        description: "No se puede agregar mantenimiento sin una bicicleta válida"
      });
      return;
    }
    setIsAddDialogOpen(true);
  };

  const handleEditBike = () => {
    setIsEditDialogOpen(true);
  };

  const handleAppointmentSuccess = () => {
    // Actualizar la vista después de cambios en citas
    if (bike) {
      // Forzar actualización del componente
      setBike({...bike});
    }
  };

  const handleAlertSuccess = () => {
    // Actualizar la vista después de cambios en las alertas
    if (bike) {
      // Forzar actualización del componente
      setBike({...bike});
    }
    toast("Alerta configurada", {
      description: "Se ha configurado una nueva alerta de mantenimiento"
    });
  };

  const handleMaintenanceClick = () => {
    // Mostrar ambos diálogos en un modal de pestañas
    setIsAppointmentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4 pb-20 max-w-md">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Cargando bicicleta...</p>
        </div>
        <BottomNav activePage="/" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-4 pb-20 max-w-md">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4 text-center">{error}</p>
          <Button onClick={handleBack}>Volver a inicio</Button>
        </div>
        <BottomNav activePage="/" />
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="container mx-auto px-4 py-4 pb-20 max-w-md">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="mb-4 text-center">Bicicleta no encontrada</p>
          <Button onClick={handleBack}>Volver a inicio</Button>
        </div>
        <BottomNav activePage="/" />
      </div>
    );
  }

  const bikeData = {
    name: bike.name,
    type: bike.type,
    year: bike.year,
    image: bike.image,
    strava_id: bike.strava_id,
    total_distance: bike.total_distance
  };

  return (
    <div className="pb-28">
      <BikeDetailContent
        bike={bike}
        maintenance={maintenance}
        onBack={handleBack}
        onEdit={handleEditBike}
        onFilter={() => setIsFilterDialogOpen(true)}
        onExport={() => handleExportExcel(bike, maintenance)}
        onAddMaintenance={handleAddMaintenance}
        onScheduleAppointment={handleMaintenanceClick}
      />
      
      <FloatingActionButton onClick={handleAddMaintenance} label="Agregar Mantenimiento" />
      
      <BikeDetailDialogs 
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        isFilterDialogOpen={isFilterDialogOpen}
        setIsFilterDialogOpen={setIsFilterDialogOpen}
        isAppointmentDialogOpen={isAppointmentDialogOpen}
        setIsAppointmentDialogOpen={setIsAppointmentDialogOpen}
        isAlertDialogOpen={isAlertDialogOpen}
        setIsAlertDialogOpen={setIsAlertDialogOpen}
        realBikeId={realBikeId}
        bikeName={bike.name}
        bikeData={bikeData}
        maintenance={maintenance}
        onMaintenanceSuccess={handleMaintenanceSuccess}
        onBikeUpdate={handleBikeUpdate}
        onAppointmentSuccess={handleAppointmentSuccess}
        onAlertSuccess={handleAlertSuccess}
      />
      
      <BottomNav activePage="/" />
    </div>
  );
};

export default BikeDetail;
