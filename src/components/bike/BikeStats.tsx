
import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface BikeStatsProps {
  totalSpent: number;
  lastMaintenance: string;
  nextCheckDate?: string;
  onScheduleAppointment: () => void;
}

const BikeStats = ({ totalSpent, lastMaintenance, nextCheckDate, onScheduleAppointment }: BikeStatsProps) => {
  return (
    <div className="bg-card rounded-lg p-4 my-6">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">Gasto Total</p>
          <p className="font-medium text-bicicare-green">${totalSpent}</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">Último Servicio</p>
          <p className="font-medium">{lastMaintenance}</p>
        </div>
      </div>
      
      <div className="border-t pt-4 mt-2">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-4 w-4 text-bicicare-green" />
            <p className="text-xs text-muted-foreground">Próxima Cita</p>
          </div>
          <p className="font-medium mb-2">{nextCheckDate || 'No programada'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onScheduleAppointment}
          >
            {nextCheckDate ? 'Cambiar cita' : 'Programar cita'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BikeStats;
