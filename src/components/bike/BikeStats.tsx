
import React, { useState, useEffect } from 'react';
import { CalendarClock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BikeStatsProps {
  bikeId: string;
  totalSpent: number;
  lastMaintenance: string;
  nextCheckDate?: string | null;
  onScheduleAppointment: () => void;
}

const BikeStats = ({ 
  bikeId, 
  totalSpent, 
  lastMaintenance, 
  nextCheckDate, 
  onScheduleAppointment 
}: BikeStatsProps) => {
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<string | null>(null);
  
  useEffect(() => {
    if (bikeId) {
      fetchAppointments();
    }
  }, [bikeId]);

  const fetchAppointments = async () => {
    try {
      // Obtener citas futuras
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('bike_id', bikeId)
        .gte('date', today)
        .order('date', { ascending: true });
        
      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }
      
      // Actualizar contador de citas
      setAppointmentCount(appointments?.length || 0);
      
      // Establecer la próxima cita (si existe)
      if (appointments && appointments.length > 0) {
        try {
          const nextDate = format(new Date(appointments[0].date), 'dd/MM/yyyy');
          setNextAppointment(nextDate);
        } catch (err) {
          console.error('Error formatting appointment date:', err);
        }
      } else {
        setNextAppointment(null);
      }
    } catch (err) {
      console.error('Error in fetchAppointments:', err);
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 my-6">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">Gasto Total</p>
          <p className="font-medium text-bicicare-green">{totalSpent} €</p>
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
            <p className="text-xs text-muted-foreground">
              {appointmentCount > 0 
                ? `Próxima Cita (${appointmentCount} total)` 
                : 'Próxima Cita'}
            </p>
          </div>
          <p className="font-medium mb-2">{nextAppointment || 'No programada'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onScheduleAppointment}
          >
            {appointmentCount > 0 ? 'Gestionar citas' : 'Programar cita'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BikeStats;
