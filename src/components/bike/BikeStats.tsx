
import React, { useState, useEffect } from 'react';
import { CalendarClock, Bike } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BikeStatsProps {
  bikeId: string;
  totalSpent: number;
  lastMaintenance: string;
  nextCheckDate?: string | null;
  onScheduleAppointment: () => void;
  totalDistance?: number;
  stravaId?: string;
}

const BikeStats = ({ 
  bikeId, 
  totalSpent, 
  lastMaintenance, 
  nextCheckDate, 
  onScheduleAppointment,
  totalDistance,
  stravaId
}: BikeStatsProps) => {
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  
  useEffect(() => {
    if (bikeId) {
      fetchAppointments();
      fetchAlerts();
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

  const fetchAlerts = async () => {
    try {
      const { data: alerts, error } = await supabase
        .from('maintenance_alerts')
        .select('*')
        .eq('bike_id', bikeId)
        .eq('is_active', true);
        
      if (error) {
        console.error('Error fetching maintenance alerts:', error);
        return;
      }
      
      // Actualizar contador de alertas
      setAlertCount(alerts?.length || 0);
    } catch (err) {
      console.error('Error in fetchAlerts:', err);
    }
  };

  // Format distance in kilometers with appropriate number formatting - displaying full number
  const formattedDistance = totalDistance ? 
    `${Math.floor(totalDistance / 1000).toLocaleString('es-ES')} km` : 
    'No disponible';

  return (
    <div className="bg-card rounded-lg p-4 my-6">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">Gasto Total</p>
          <p className="font-medium text-bicicare-green">{totalSpent} €</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">Último Servicio</p>
          <p className="font-medium">{lastMaintenance}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            {stravaId ? 
              <Bike className="h-3 w-3 text-orange-500 mr-1" /> : 
              null
            }
            <p>Distancia Total</p>
          </div>
          <p className="font-medium">{formattedDistance}</p>
        </div>
      </div>
      
      <div className="border-t pt-4 mt-2">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-4 w-4 text-bicicare-green" />
            <p className="text-xs text-muted-foreground">
              {appointmentCount > 0 || alertCount > 0
                ? `Plan de mantenimiento (${appointmentCount + alertCount} total)` 
                : 'Plan de Mantenimiento'}
            </p>
          </div>
          <p className="font-medium mb-2">{nextAppointment || 'No programado'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onScheduleAppointment}
          >
            Gestionar Plan de Mantenimiento
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BikeStats;
