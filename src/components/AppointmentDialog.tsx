
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarClock, Trash2, Bell, CalendarPlus, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id?: string;
  date: Date;
  notes: string;
}

interface MaintenanceAlert {
  id: string;
  maintenanceType: string;
  alertType: 'distance' | 'time';
  distanceThreshold?: number;
  timeThresholdMonths?: number;
  progress: number;
  status: string;
  isActive: boolean;
}

type AlertType = 'distance' | 'time';
type MaintenanceType = 'tubeless' | 'cubiertas' | 'cadena' | 'piñones' | 'fundas' | 'puesta' | 'custom';

interface MaintenanceTypeOption {
  value: MaintenanceType;
  label: string;
}

const maintenanceTypes: MaintenanceTypeOption[] = [
  { value: 'tubeless', label: 'Rellenar tubeless' },
  { value: 'cubiertas', label: 'Sustituir cubiertas' },
  { value: 'cadena', label: 'Sustituir cadena' },
  { value: 'piñones', label: 'Sustituir piñones' },
  { value: 'fundas', label: 'Sustituir fundas y cables' },
  { value: 'puesta', label: 'Puesta a punto' },
  { value: 'custom', label: 'Otro (personalizado)' }
];

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeId: string;
  bikeName: string;
  onSaved: () => void;
}

const AppointmentDialog = ({ 
  open, 
  onOpenChange, 
  bikeId,
  bikeName,
  onSaved 
}: AppointmentDialogProps) => {
  const { toast } = useToast();
  
  // Estado general
  const [activeTab, setActiveTab] = useState<string>('appointments');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estado para citas
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Estado para alertas
  const [alertType, setAlertType] = useState<AlertType>('distance');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('tubeless');
  const [customType, setCustomType] = useState<string>('');
  const [distanceValue, setDistanceValue] = useState<number>(1000);
  const [timeMonths, setTimeMonths] = useState<number>(3);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);

  useEffect(() => {
    // Obtener el ID del usuario actual
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    
    getUserId();
  }, []);

  const fetchAppointments = async () => {
    if (!bikeId) return;
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('bike_id', bikeId)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setAppointments(data.map(app => ({
          id: app.id,
          date: new Date(app.date),
          notes: app.notes || ''
        })));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas programadas",
        variant: "destructive"
      });
    }
  };
  
  const fetchAlerts = async () => {
    if (!bikeId) return;
    
    try {
      // Obtener información de la bicicleta para cálculos de progreso
      const { data: bikeData, error: bikeError } = await supabase
        .from('bikes')
        .select('total_distance')
        .eq('id', bikeId)
        .single();
      
      if (bikeError) throw bikeError;
      
      const currentDistance = bikeData?.total_distance || 0;
      
      // Obtener alertas de mantenimiento
      const { data, error } = await supabase
        .from('maintenance_alerts')
        .select('*')
        .eq('bike_id', bikeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const processedAlerts = data.map(alert => {
          let status = 'Pendiente';
          let progress = 0;
          
          // Calcular progreso para alertas basadas en distancia
          if (alert.alert_type === 'distance' && alert.distance_threshold) {
            const distanceAtCreation = alert.base_distance || 0;
            const targetDistance = distanceAtCreation + alert.distance_threshold;
            
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
            id: alert.id,
            maintenanceType: maintenanceTypeLabel,
            alertType: alert.alert_type,
            distanceThreshold: alert.distance_threshold,
            timeThresholdMonths: alert.time_threshold_months,
            progress,
            status,
            isActive: alert.is_active
          };
        });
        
        setAlerts(processedAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas de mantenimiento",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedDate(new Date());
      setNotes('');
      setActiveTab('appointments');
      fetchAppointments();
      fetchAlerts();
      resetAlertForm();
    }
  }, [open, bikeId]);

  const resetAlertForm = () => {
    setAlertType('distance');
    setMaintenanceType('tubeless');
    setCustomType('');
    setDistanceValue(1000);
    setTimeMonths(3);
  };

  const handleSaveAppointment = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Selecciona una fecha para la cita",
        variant: "destructive"
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Formatear fecha en formato ISO (YYYY-MM-DD)
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          bike_id: bikeId,
          user_id: userId,
          date: formattedDate,
          notes: notes.trim(),
        });
      
      if (error) throw error;
      
      toast({
        title: "Cita guardada",
        description: "La cita ha sido programada correctamente"
      });
      
      // Limpiar formulario
      setSelectedDate(new Date());
      setNotes('');
      
      // Actualizar lista de citas
      fetchAppointments();
      
      // Notificar al componente padre
      onSaved();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la cita",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveAlert = async () => {
    if (maintenanceType === 'custom' && !customType.trim()) {
      toast({
        title: "Error",
        description: "Por favor introduce un tipo de mantenimiento personalizado",
        variant: "destructive"
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Obtener la distancia actual de la bicicleta si es alerta por distancia
      let baseDistance = null;
      if (alertType === 'distance') {
        const { data, error } = await supabase
          .from('bikes')
          .select('total_distance')
          .eq('id', bikeId)
          .single();
          
        if (error) throw error;
        baseDistance = data?.total_distance || 0;
      }
      
      const { error } = await supabase
        .from('maintenance_alerts')
        .insert({
          bike_id: bikeId,
          user_id: userId,
          alert_type: alertType,
          maintenance_type: maintenanceType,
          custom_type: maintenanceType === 'custom' ? customType.trim() : null,
          distance_threshold: alertType === 'distance' ? distanceValue * 1000 : null, // Convert to meters
          time_threshold_months: alertType === 'time' ? timeMonths : null,
          base_distance: baseDistance,
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Alerta configurada",
        description: `Se ha configurado una alerta de mantenimiento para ${bikeName}`,
      });
      
      // Resetear formulario
      resetAlertForm();
      
      // Actualizar lista de alertas
      fetchAlerts();
      
      // Notificar al componente padre
      onSaved();
    } catch (error) {
      console.error('Error saving maintenance alert:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la alerta de mantenimiento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      // Actualizar lista excluyendo la cita eliminada
      setAppointments(current => current.filter(app => app.id !== appointmentId));
      
      toast({
        title: "Cita eliminada",
        description: "La cita ha sido eliminada correctamente"
      });
      
      // Notificar al componente padre
      onSaved();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;
      
      // Actualizar lista de alertas
      setAlerts(current => current.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alerta eliminada",
        description: "La alerta de mantenimiento ha sido eliminada correctamente"
      });
      
      // Notificar al componente padre
      onSaved();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la alerta",
        variant: "destructive"
      });
    }
  };
  
  const handleCompleteAlert = async (alertId: string) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) return;
      
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
          type: alert.maintenanceType,
          date: new Date().toISOString(),
          cost: 0,
          notes: `Mantenimiento automático por alerta`,
        });

      if (maintenanceError) throw maintenanceError;
      
      // Actualizar lista de alertas
      setAlerts(current => current.filter(a => a.id !== alertId));
      
      toast({
        title: "Mantenimiento registrado",
        description: "Se ha registrado el mantenimiento y desactivado la alerta"
      });
      
      // Notificar al componente padre
      onSaved();
    } catch (error) {
      console.error('Error completing alert:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la operación",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Plan de Mantenimiento: {bikeName}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="appointments" className="flex items-center gap-1">
              <CalendarPlus className="h-4 w-4" />
              <span>Citas</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span>Alarmas</span>
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">{alerts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appointments" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formulario para añadir nueva cita */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-primary" />
                  Nueva cita
                </h3>
                <div className="rounded-md border overflow-hidden">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border pointer-events-auto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas adicionales</Label>
                  <Textarea
                    id="notes"
                    placeholder="Taller, tipo de reparación, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <Button 
                  onClick={handleSaveAppointment} 
                  disabled={loading || !selectedDate || !userId}
                  className="w-full"
                >
                  Añadir cita
                </Button>
              </div>
              
              {/* Lista de citas existentes */}
              <div>
                <h3 className="font-medium mb-4">Citas programadas</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <div 
                        key={appointment.id} 
                        className="p-3 border rounded-lg flex justify-between items-start"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {format(appointment.date, 'dd/MM/yyyy')}
                            </p>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => appointment.id && handleDeleteAppointment(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      No hay citas programadas
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="alerts" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formulario para añadir nueva alerta */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  Nueva alarma
                </h3>
                
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="alertType">Tipo de Alerta</Label>
                    <Tabs value={alertType} onValueChange={(v) => setAlertType(v as AlertType)} className="w-full">
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="distance">Por Distancia</TabsTrigger>
                        <TabsTrigger value="time">Por Tiempo</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenanceType">Tipo de Mantenimiento</Label>
                    <Select value={maintenanceType} onValueChange={(v) => setMaintenanceType(v as MaintenanceType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo de mantenimiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {maintenanceType === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="customType">Tipo Personalizado</Label>
                      <Input
                        id="customType"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        placeholder="Ej: Cambio suspensión"
                      />
                    </div>
                  )}

                  {alertType === 'distance' ? (
                    <div className="space-y-2">
                      <Label htmlFor="distanceValue">Kilómetros</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="distanceValue"
                          type="number"
                          min={1}
                          value={distanceValue}
                          onChange={(e) => setDistanceValue(Number(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">km</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se creará una alerta cuando la bicicleta alcance {distanceValue} km adicionales desde ahora.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="timeMonths">Meses</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="timeMonths"
                          type="number"
                          min={1}
                          max={60}
                          value={timeMonths}
                          onChange={(e) => setTimeMonths(Number(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">meses</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se creará una alerta para dentro de {timeMonths} meses.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSaveAlert} 
                    disabled={loading || !userId}
                    className="w-full mt-2"
                  >
                    {loading ? 'Guardando...' : 'Guardar Alarma'}
                  </Button>
                </div>
              </div>
              
              {/* Lista de alertas existentes */}
              <div>
                <h3 className="font-medium mb-4">Alarmas configuradas</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex justify-between mb-2">
                          <h4 className="font-medium">{alert.maintenanceType}</h4>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => handleCompleteAlert(alert.id)}
                            >
                              Completar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 px-2 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteAlert(alert.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <Badge variant={alert.alertType === 'distance' ? 'outline' : 'secondary'} className="text-xs py-0">
                            {alert.alertType === 'distance' 
                              ? `Cada ${alert.distanceThreshold ? Math.round(alert.distanceThreshold / 1000) : 0} km` 
                              : `Cada ${alert.timeThresholdMonths} meses`}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
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
                    ))
                  ) : (
                    <div className="text-center p-8 border rounded-lg">
                      <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay alarmas configuradas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
