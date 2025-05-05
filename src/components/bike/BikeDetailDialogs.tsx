
import React from 'react';
import AddMaintenanceDialog from '@/components/AddMaintenanceDialog';
import EditBikeDialog from '@/components/EditBikeDialog';
import FilterMaintenanceDialog from '@/components/FilterMaintenanceDialog';
import AppointmentDialog from '@/components/AppointmentDialog';
import { MaintenanceProps } from '@/components/MaintenanceItem';

interface BikeDetailDialogsProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  isFilterDialogOpen: boolean;
  setIsFilterDialogOpen: (open: boolean) => void;
  isAppointmentDialogOpen: boolean;
  setIsAppointmentDialogOpen: (open: boolean) => void;
  realBikeId: string | null;
  bikeName?: string;
  bikeData?: {
    name: string;
    type: string;
    year: number;
    image: string;
  };
  maintenance: MaintenanceProps[];
  onMaintenanceSuccess: () => void;
  onBikeUpdate: () => void;
  onAppointmentSuccess: () => void;
}

const BikeDetailDialogs: React.FC<BikeDetailDialogsProps> = ({
  isAddDialogOpen,
  setIsAddDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isFilterDialogOpen,
  setIsFilterDialogOpen,
  isAppointmentDialogOpen,
  setIsAppointmentDialogOpen,
  realBikeId,
  bikeName,
  bikeData,
  maintenance,
  onMaintenanceSuccess,
  onBikeUpdate,
  onAppointmentSuccess
}) => {
  return (
    <>
      <AddMaintenanceDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        bikeId={realBikeId || ''}
        onSuccess={onMaintenanceSuccess}
      />
      
      {bikeData && (
        <EditBikeDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          bikeId={realBikeId || ''}
          bikeData={bikeData}
          onSuccess={onBikeUpdate}
        />
      )}
      
      <FilterMaintenanceDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        maintenance={maintenance}
      />
      
      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={setIsAppointmentDialogOpen}
        bikeId={realBikeId || ''}
        bikeName={bikeName || ''}
        onSaved={onAppointmentSuccess}
      />
    </>
  );
};

export default BikeDetailDialogs;
