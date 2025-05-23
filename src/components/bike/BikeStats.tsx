
import React, { useState, useEffect } from 'react';
import { CalendarClock, Bike } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

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
  const { language } = useLanguage();
  
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

  // Formato para la distancia - diferenciando entre Strava (metros) y manual (kilómetros)
  const formatDistance = (distance?: number) => {
    if (!distance || distance === 0) {
      return t("not_available", language);
    }
    
    let km: number;
    
    // Si tiene stravaId, la distancia viene en metros desde Strava
    if (stravaId) {
      km = distance / 1000;
    } else {
      // Si no tiene stravaId, es una bicicleta manual y la distancia ya está en kilómetros
      km = distance;
    }
    
    // Formatear el número con separadores de miles y mostrar como entero si no tiene decimales
    if (km % 1 === 0) {
      return `${Math.floor(km).toLocaleString()} km`;
    } else {
      return `${km.toFixed(1).replace(/\.0$/, '')} km`;
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 my-6">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">{t("total_spent", language)}</p>
          <p className="font-medium text-bicicare-green">{totalSpent} €</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xs text-muted-foreground">{t("last_service", language)}</p>
          <p className="font-medium">{lastMaintenance}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            {stravaId ? 
              <Bike className="h-3 w-3 text-orange-500 mr-1" /> : 
              null
            }
            <p>{t("distance", language)}</p>
          </div>
          <p className="font-medium">{formatDistance(totalDistance)}</p>
        </div>
      </div>
      <div className="border-t pt-4 mt-2">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-4 w-4 text-bicicare-green" />
            <p className="text-xs text-muted-foreground">
              {appointmentCount > 0 || alertCount > 0
                ? `${t("maintenance_plan", language)} (${appointmentCount + alertCount} ${t("total", language)})` 
                : t("maintenance_plan", language)}
            </p>
          </div>
          <p className="font-medium mb-2">{nextAppointment || t("not_scheduled", language)}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onScheduleAppointment}
          >
            {t("manage_plan", language)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BikeStats;
