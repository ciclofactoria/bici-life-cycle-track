
import React from 'react';
import BikeHeader from './BikeHeader';
import BikeStats from './BikeStats';
import MaintenanceHistory from './MaintenanceHistory';
import { MaintenanceProps } from '@/components/MaintenanceItem';
import { format } from 'date-fns';

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

  return (
    <div className="pb-16">
      <BikeHeader
        image={bike.image}
        name={bike.name}
        type={bike.type}
        year={bike.year}
        onBack={onBack}
        onEdit={onEdit}
      />
      
      <div className="bici-container">
        <BikeStats
          totalSpent={bike.totalSpent}
          lastMaintenance={bike.lastMaintenance}
          nextCheckDate={formattedNextCheckDate}
          onScheduleAppointment={onScheduleAppointment}
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
