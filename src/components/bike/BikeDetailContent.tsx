
import React, { useEffect } from 'react';
import BikeHeader from './BikeHeader';
import BikeStats from './BikeStats';
import MaintenanceHistory from './MaintenanceHistory';
import { MaintenanceProps } from '@/components/MaintenanceItem';
import { format } from 'date-fns';
import { checkNextDayAppointments } from '@/utils/notifications';
import { checkNextDayAppointmentsMobile } from '@/utils/mobileNotifications';
import { isMobileApp } from '@/utils/notifications';

interface BikeDetailContentProps {
  bike: {
    id: string;
    name: string;
    type: string;
    year: number;
    image: string;
    totalSpent: number;
    lastMaintenance: string;
    next_check_date: string | null;
    total_distance?: number;
    strava_id?: string;
  };
  maintenance: MaintenanceProps[];
  onBack: () => void;
  onEdit: () => void;
  onFilter: () => void;
  onExport: () => void;
  onAddMaintenance: () => void;
  onScheduleAppointment: () => void;
}

const BikeDetailContent = ({
  bike,
  maintenance,
  onBack,
  onEdit,
  onFilter,
  onExport,
  onAddMaintenance,
  onScheduleAppointment
}: BikeDetailContentProps) => {
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

  useEffect(() => {
    if (isMobileApp()) {
      checkNextDayAppointmentsMobile(bike);
    } else {
      checkNextDayAppointments(bike);
    }
  }, [bike]);

  return (
    <div className="pb-16">
      <BikeHeader
        image={bike.image}
        name={bike.name}
        type={bike.type}
        year={bike.year}
        onBack={onBack}
        onEdit={onEdit}
        bikeId={bike.id}
      />
      
      <div className="bici-container">
        <BikeStats
          bikeId={bike.id}
          totalSpent={bike.totalSpent}
          lastMaintenance={bike.lastMaintenance}
          nextCheckDate={formattedNextCheckDate}
          onScheduleAppointment={onScheduleAppointment}
          totalDistance={bike.total_distance}
          stravaId={bike.strava_id}
        />
        
        <MaintenanceHistory
          maintenance={maintenance}
          onFilter={onFilter}
          onExport={onExport}
          onAddMaintenance={onAddMaintenance}
        />
      </div>
    </div>
  );
};

export default BikeDetailContent;
