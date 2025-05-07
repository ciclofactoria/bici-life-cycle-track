
import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bike, Bell, CalendarClock } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import BottomNav from '@/components/BottomNav';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AppointmentDay {
  id: string;
  date: Date;
  type: 'maintenance' | 'appointment' | 'alert';
  bikeName: string;
  notes?: string | null;
  alertType?: 'distance' | 'time';
  maintenanceType?: string;
}

const MaintenancePlanPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('calendar');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get the current user ID
  React.useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    
    getUserId();
  }, []);
  
  // Fetch all maintenance dates, appointments, and alerts
  const { data: calendarData, isLoading, refetch } = useQuery({
    queryKey: ['calendar-dates'],
    queryFn: async () => {
      const [maintenanceResult, appointmentsResult, bikesResult] = await Promise.all([
        supabase
          .from('maintenance')
          .select('id, date, type, bike_id, bikes(name), distance_at_maintenance')
          .order('date'),
        supabase
          .from('appointments')
          .select('id, date, notes, bike_id, bikes(name)')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date'),
        supabase
          .from('bikes')
          .select('id, name, total_distance')
      ]);

      if (maintenanceResult.error) throw maintenanceResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;
      if (bikesResult.error) throw bikesResult.error;

      const appointments: AppointmentDay[] = [];
      const bikesMap = new Map();
      
      // Create bikes map for quick lookup
      if (bikesResult.data) {
        bikesResult.data.forEach(bike => {
          bikesMap.set(bike.id, {
            name: bike.name,
            totalDistance: bike.total_distance
          });
        });
      }

      // Add maintenance dates
      if (maintenanceResult.data) {
        maintenanceResult.data.forEach(maintenance => {
          appointments.push({
            id: maintenance.id,
            date: new Date(maintenance.date),
            type: 'maintenance',
            bikeName: maintenance.bikes?.name || bikesMap.get(maintenance.bike_id)?.name || 'Bicicleta',
            notes: maintenance.type,
          });
        });
      }

      // Add scheduled appointments
      if (appointmentsResult.data) {
        appointmentsResult.data.forEach(appointment => {
          appointments.push({
            id: appointment.id,
            date: new Date(appointment.date),
            type: 'appointment',
            bikeName: appointment.bikes?.name || bikesMap.get(appointment.bike_id)?.name || 'Bicicleta',
            notes: appointment.notes
          });
        });
      }
      
      // Now fetch and process alerts that include time-based ones
      const { data: alertsData, error: alertsError } = await supabase
        .from('maintenance_alerts')
        .select('*')
        .eq('is_active', true);
        
      if (alertsError) throw alertsError;
      
      // Add alerts with time thresholds to calendar
      if (alertsData) {
        alertsData.forEach(alert => {
          if (alert.alert_type === 'time' && alert.time_threshold_months) {
            const bikeName = bikesMap.get(alert.bike_id)?.name || 'Bicicleta';
            const maintenanceTypeLabel = alert.custom_type || alert.maintenance_type;
            
            // Calculate target date for time-based alerts
            const createdDate = new Date(alert.created_at);
            const targetDate = new Date(createdDate);
            targetDate.setMonth(targetDate.getMonth() + alert.time_threshold_months);
            
            appointments.push({
              id: alert.id,
              date: targetDate,
              type: 'alert',
              bikeName: bikeName,
              notes: `${maintenanceTypeLabel} (automático)`,
              alertType: 'time',
              maintenanceType: maintenanceTypeLabel
            });
          }
        });
      }

      return appointments;
    }
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const selectedDateAppointments = (date: Date) => {
    if (!calendarData || !date) return [];
    return calendarData.filter(
      app => app.date.toDateString() === date.toDateString()
    );
  };

  // Función para eliminar una alerta
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Alerta eliminada",
        description: "La alerta de mantenimiento ha sido eliminada correctamente"
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la alerta",
        variant: "destructive"
      });
    }
  };

  const handleCompleteAlert = async (alertId: string, bikeId: string, maintenanceType: string) => {
    try {
      if (!userId) {
        toast({
          title: "Error",
          description: "Usuario no autenticado",
          variant: "destructive"
        });
        return;
      }
      
      // Primero, desactiva la alerta
      const { error: alertError } = await supabase
        .from('maintenance_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (alertError) throw alertError;
      
      // Luego, crea un registro de mantenimiento
      const { error: maintenanceError } = await supabase
        .from('maintenance')
        .insert({
          bike_id: bikeId,
          user_id: userId,
          type: maintenanceType,
          date: new Date().toISOString(),
          cost: 0,
          notes: `Mantenimiento automático por alerta`,
        });

      if (maintenanceError) throw maintenanceError;
      
      toast({
        title: "Mantenimiento registrado",
        description: "Se ha registrado el mantenimiento y desactivado la alerta"
      });
      
      refetch();
    } catch (error) {
      console.error('Error completing alert:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la operación",
        variant: "destructive"
      });
    }
  };

  // Consulta para obtener alertas activas
  const { data: activeAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      const { data: bikes } = await supabase
        .from('bikes')
        .select('id, name, total_distance');
      
      const bikesMap = new Map();
      if (bikes) {
        bikes.forEach(bike => {
          bikesMap.set(bike.id, {
            name: bike.name,
            totalDistance: bike.total_distance || 0
          });
        });
      }
      
      const { data: alerts, error } = await supabase
        .from('maintenance_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Procesar alertas para añadir información adicional
      return alerts?.map(alert => {
        const bikeInfo = bikesMap.get(alert.bike_id);
        const bikeName = bikeInfo?.name || 'Bicicleta';
        const bikeDistance = bikeInfo?.totalDistance || 0;
        
        let status = 'Pendiente';
        let progress = 0;
        
        // Calcular progreso para alertas basadas en distancia
        if (alert.alert_type === 'distance' && alert.distance_threshold) {
          const distanceAtCreation = alert.base_distance || 0;
          const targetDistance = distanceAtCreation + alert.distance_threshold;
          const currentDistance = bikeDistance;
          
          if (currentDistance >= targetDistance) {
            status = 'Requiere atención';
            progress = 100;
          } else {
            progress = Math.round(((currentDistance - distanceAtCreation) / alert.distance_threshold) * 100);
            progress = Math.max(0, Math.min(99, progress)); // Entre 0 y 99%
          }
        } 
        // Calcular progreso para alertas basadas en tiempo
        else if (alert.alert_type === 'time' && alert.time_threshold_months) {
          const createdDate = new Date(alert.created_at);
          const targetDate = new Date(createdDate);
          targetDate.setMonth(targetDate.getMonth() + alert.time_threshold_months);
          
          const totalDays = (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          const elapsedDays = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (new Date() >= targetDate) {
            status = 'Requiere atención';
            progress = 100;
          } else {
            progress = Math.round((elapsedDays / totalDays) * 100);
            progress = Math.max(0, Math.min(99, progress)); // Entre 0 y 99%
          }
        }
        
        // Formatear el tipo de mantenimiento
        const maintenanceTypeLabel = alert.custom_type || alert.maintenance_type;
        
        return {
          ...alert,
          bikeName,
          status,
          progress,
          maintenanceType: maintenanceTypeLabel,
        };
      }) || [];
    }
  });

  if (isLoading || alertsLoading) {
    return (
      <div className="pb-16">
        <div className="bici-container pt-6">
          <h1 className="text-2xl font-bold mb-6">Plan de Mantenimiento</h1>
          <div className="text-center">Cargando...</div>
        </div>
        <BottomNav activePage="/calendar" />
      </div>
    );
  }

  // Agrupar todas las citas por fecha para mostrarlas en formato de tabla
  const allAppointments = calendarData || [];
  const upcomingAppointments = allAppointments
    .filter(app => app.date >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Plan de Mantenimiento</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas
              {activeAlerts && activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">{activeAlerts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-4">
            <div className="grid gap-6 md:grid-cols-[1fr_auto]">
              <div className="rounded-lg border bg-card p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    maintenance: (date) => 
                      calendarData?.some(app => 
                        app.date.toDateString() === date.toDateString() && 
                        app.type === 'maintenance'
                      ) || false,
                    appointment: (date) => 
                      calendarData?.some(app => 
                        app.date.toDateString() === date.toDateString() && 
                        app.type === 'appointment'
                      ) || false,
                    alert: (date) => 
                      calendarData?.some(app => 
                        app.date.toDateString() === date.toDateString() && 
                        app.type === 'alert'
                      ) || false
                  }}
                  modifiersStyles={{
                    maintenance: { backgroundColor: 'rgb(34 197 94)', color: 'white' },
                    appointment: { backgroundColor: 'rgb(239 68 68)', color: 'white' },
                    alert: { backgroundColor: 'rgb(245 158 11)', color: 'white' }
                  }}
                  className="rounded-md pointer-events-auto"
                />
              </div>

              <div className="rounded-lg border bg-card p-4 min-w-[350px]">
                <h2 className="font-semibold mb-4">
                  {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : 'Selecciona una fecha'}
                </h2>
                
                {selectedDate && (
                  <div className="space-y-4">
                    {selectedDateAppointments(selectedDate).map((app, idx) => (
                      <div key={idx} className="p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          {app.type === 'maintenance' && <CalendarClock className="h-4 w-4 text-green-500" />}
                          {app.type === 'appointment' && <CalendarClock className="h-4 w-4 text-red-500" />}
                          {app.type === 'alert' && <Bell className="h-4 w-4 text-amber-500" />}
                          <span className="font-medium">{app.bikeName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {app.type === 'maintenance' ? 'Mantenimiento' : 
                           app.type === 'appointment' ? 'Cita programada' : 'Alerta de mantenimiento'}
                        </p>
                        {app.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">{app.notes}</p>
                        )}
                      </div>
                    ))}
                    
                    {selectedDateAppointments(selectedDate).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay eventos programados para este día
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Próximas citas</h2>
              
              {upcomingAppointments.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Bicicleta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingAppointments.map((app) => (
                        <TableRow key={`${app.id}-${app.type}`}>
                          <TableCell className="font-medium">{format(app.date, 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Bike className="h-4 w-4" />
                              {app.bikeName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              app.type === 'maintenance' ? 'bg-green-100 text-green-800' : 
                              app.type === 'appointment' ? 'bg-red-100 text-red-800' : 
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {app.type === 'maintenance' ? 'Mantenimiento' : 
                               app.type === 'appointment' ? 'Cita' : 'Alerta'}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{app.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-4 border rounded-lg">
                  No hay citas programadas próximamente
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="alerts" className="mt-4">
            <div className="space-y-4">
              {activeAlerts && activeAlerts.length > 0 ? (
                activeAlerts.map((alert) => (
                  <Card key={alert.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Bike className="h-4 w-4 text-primary" />
                          <h3 className="font-medium">{alert.bikeName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.maintenanceType}</p>
                        
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            {alert.alert_type === 'distance' ? 
                              `Cada ${Math.round((alert.distance_threshold || 0) / 1000)} km` : 
                              `Cada ${alert.time_threshold_months} meses`}
                          </p>
                        </div>
                        
                        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              alert.progress < 80 ? 'bg-green-500' : 
                              alert.progress < 100 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${alert.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="mt-1">
                          <span className={`text-xs font-medium ${
                            alert.progress < 80 ? 'text-green-700' : 
                            alert.progress < 100 ? 'text-amber-700' : 'text-red-700'
                          }`}>
                            {alert.status} - {alert.progress}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleCompleteAlert(alert.id, alert.bike_id, alert.maintenanceType)}
                        >
                          Completar
                        </Button>
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center p-8 border rounded-lg">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">No hay alertas activas</h3>
                  <p className="text-sm text-muted-foreground">
                    Configura alertas automáticas desde la ficha de cada bicicleta
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav activePage="/calendar" />
    </div>
  );
};

export default MaintenancePlanPage;
