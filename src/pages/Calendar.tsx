
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bike, Bell, CalendarClock, Plus } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import AppointmentDialog from '@/components/AppointmentDialog';
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

interface AppointmentDay {
  id: string;
  date: Date;
  type: 'maintenance' | 'appointment' | 'alert';
  bikeName: string;
  notes?: string | null;
  alertType?: 'distance' | 'time';
  maintenanceType?: string;
  bike_id?: string;
}

interface Bike {
  id: string;
  name: string;
}

const MaintenancePlanPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('calendar');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [selectedBikeName, setSelectedBikeName] = useState<string>('');
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [availableBikes, setAvailableBikes] = useState<Bike[]>([]);
  const { language } = useLanguage();
  
  // Get the current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUserId(data.session.user.id);
        fetchBikes(data.session.user.id);
      }
    };
    
    getUserId();
  }, []);
  
  // Fetch available bikes for the user
  const fetchBikes = async (userId: string) => {
    const { data, error } = await supabase
      .from('bikes')
      .select('id, name')
      .eq('user_id', userId)
      .eq('archived', false);
      
    if (error) {
      console.error('Error fetching bikes:', error);
    } else if (data) {
      setAvailableBikes(data);
    }
  };
  
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
            bikeName: maintenance.bikes?.name || bikesMap.get(maintenance.bike_id)?.name || t('bike', language),
            notes: maintenance.type,
            bike_id: maintenance.bike_id
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
            bikeName: appointment.bikes?.name || bikesMap.get(appointment.bike_id)?.name || t('bike', language),
            notes: appointment.notes,
            bike_id: appointment.bike_id
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
            const bikeName = bikesMap.get(alert.bike_id)?.name || t('bike', language);
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
              notes: `${maintenanceTypeLabel} (${t('automatic', language)})`,
              alertType: alert.alert_type as 'time' | 'distance',
              maintenanceType: maintenanceTypeLabel,
              bike_id: alert.bike_id
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

  // Function to handle deleting an alert
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: t("alert_deleted", language),
        description: t("alert_deleted_desc", language)
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: t("error", language),
        description: t("alert_delete_error", language),
        variant: "destructive"
      });
    }
  };

  const handleCompleteAlert = async (alertId: string, bikeId: string, maintenanceType: string) => {
    try {
      if (!userId) {
        toast({
          title: t("error", language),
          description: t("not_authenticated", language),
          variant: "destructive"
        });
        return;
      }
      
      // First, deactivate the alert
      const { error: alertError } = await supabase
        .from('maintenance_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (alertError) throw alertError;
      
      // Then, create a maintenance record
      const { error: maintenanceError } = await supabase
        .from('maintenance')
        .insert({
          bike_id: bikeId,
          user_id: userId,
          type: maintenanceType,
          date: new Date().toISOString(),
          cost: 0,
          notes: t("automatic_maintenance_alert", language),
        });

      if (maintenanceError) throw maintenanceError;
      
      toast({
        title: t("maintenance_recorded", language),
        description: t("maintenance_alert_completed", language)
      });
      
      refetch();
    } catch (error) {
      console.error('Error completing alert:', error);
      toast({
        title: t("error", language),
        description: t("operation_failed", language),
        variant: "destructive"
      });
    }
  };

  // Query to get active alerts
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
      
      // Process alerts to add additional information
      return alerts?.map(alert => {
        const bikeInfo = bikesMap.get(alert.bike_id);
        const bikeName = bikeInfo?.name || t('bike', language);
        const bikeDistance = bikeInfo?.totalDistance || 0;
        
        let status = t('pending', language);
        let progress = 0;
        
        // Calculate progress for distance-based alerts
        if (alert.alert_type === 'distance' && alert.distance_threshold) {
          const distanceAtCreation = alert.base_distance || 0;
          const targetDistance = distanceAtCreation + alert.distance_threshold;
          const currentDistance = bikeDistance;
          
          if (currentDistance >= targetDistance) {
            status = t('requires_attention', language);
            progress = 100;
          } else {
            progress = Math.round(((currentDistance - distanceAtCreation) / alert.distance_threshold) * 100);
            progress = Math.max(0, Math.min(99, progress)); // Between 0 and 99%
          }
        } 
        // Calculate progress for time-based alerts
        else if (alert.alert_type === 'time' && alert.time_threshold_months) {
          const createdDate = new Date(alert.created_at);
          const targetDate = new Date(createdDate);
          targetDate.setMonth(targetDate.getMonth() + alert.time_threshold_months);
          
          const totalDays = (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          const elapsedDays = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (new Date() >= targetDate) {
            status = t('requires_attention', language);
            progress = 100;
          } else {
            progress = Math.round((elapsedDays / totalDays) * 100);
            progress = Math.max(0, Math.min(99, progress)); // Between 0 and 99%
          }
        }
        
        // Format maintenance type
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
          <h1 className="text-2xl font-bold mb-6">{t("maintenance_plan", language)}</h1>
          <div className="text-center">{t("loading", language)}</div>
        </div>
        <BottomNav activePage="/calendar" />
      </div>
    );
  }

  // Group all appointments by date to show in table format
  const allAppointments = calendarData || [];
  const upcomingAppointments = allAppointments
    .filter(app => app.date >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
    
  // Determine date colors for calendar
  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Handle opening the appointment dialog with a selected bike
  const handleBikeSelect = (bikeId: string) => {
    const bike = availableBikes.find(b => b.id === bikeId);
    if (bike) {
      setSelectedBikeId(bikeId);
      setSelectedBikeName(bike.name);
      setIsAddDialogOpen(false);
      setIsAppointmentDialogOpen(true);
    }
  };

  const handleNewEntityClick = () => {
    if (availableBikes.length === 0) {
      toast({
        title: t("no_bikes", language),
        description: t("create_bike_first", language),
        variant: "destructive"
      });
      return;
    }
    setIsAddDialogOpen(true);
  };

  // Handle closing the appointment dialog
  const handleAppointmentDialogClose = () => {
    setIsAppointmentDialogOpen(false);
    setSelectedBikeId(null);
    refetch();
  };

  // Get the appropriate date-fns locale based on the current language
  const dateLocale = language === 'es' ? es : enUS;

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">{t("maintenance_plan", language)}</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="calendar">{t("calendar", language)}</TabsTrigger>
            <TabsTrigger value="alerts">
              {t("alerts", language)}
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
                  locale={dateLocale}
                  modifiers={{
                    pastMaintenance: (date) => 
                      calendarData?.some(app => 
                        app.date.toDateString() === date.toDateString() && 
                        app.type === 'maintenance' &&
                        isDateInPast(app.date)
                      ) || false,
                    currentMaintenance: (date) => 
                      calendarData?.some(app => 
                        app.date.toDateString() === date.toDateString() && 
                        app.type === 'maintenance' &&
                        isDateToday(app.date)
                      ) || false,
                    futureMaintenance: (date) => 
                      calendarData?.some(app => 
                        app.date.toDateString() === date.toDateString() && 
                        app.type === 'maintenance' &&
                        !isDateInPast(app.date) && !isDateToday(app.date)
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
                    pastMaintenance: { backgroundColor: '#f59e0b', color: 'white' },
                    currentMaintenance: { backgroundColor: 'rgb(34 197 94)', color: 'white' },
                    futureMaintenance: { backgroundColor: 'rgb(239 68 68)', color: 'white' },
                    appointment: { backgroundColor: 'rgb(239 68 68)', color: 'white' },
                    alert: { backgroundColor: 'rgb(245 158 11)', color: 'white' }
                  }}
                  className="rounded-md pointer-events-auto"
                />
              </div>

              <div className="rounded-lg border bg-card p-4 min-w-[350px]">
                <h2 className="font-semibold mb-4">
                  {selectedDate ? format(selectedDate, "d 'of' MMMM, yyyy", { locale: dateLocale }) : t("select_date", language)}
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
                          {app.type === 'maintenance' ? t("maintenance", language) : 
                           app.type === 'appointment' ? t("scheduled_appointment", language) : t("maintenance_alert", language)}
                        </p>
                        {app.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">{app.notes}</p>
                        )}
                      </div>
                    ))}
                    
                    {selectedDateAppointments(selectedDate).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t("no_events_for_day", language)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">{t("upcoming_appointments", language)}</h2>
              
              {upcomingAppointments.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("date", language)}</TableHead>
                        <TableHead>{t("bike", language)}</TableHead>
                        <TableHead>{t("type", language)}</TableHead>
                        <TableHead>{t("notes", language)}</TableHead>
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
                              {app.type === 'maintenance' ? t("maintenance", language) : 
                               app.type === 'appointment' ? t("appointment", language) : t("alert", language)}
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
                  {t("no_upcoming_appointments", language)}
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
                              t("every_distance", language, { distance: Math.round((alert.distance_threshold || 0) / 1000) }) : 
                              t("every_months", language, { months: alert.time_threshold_months })}
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
                          {t("complete", language)}
                        </Button>
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          {t("delete", language)}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center p-8 border rounded-lg">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">{t("no_active_alerts", language)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("configure_alerts_from_bikes", language)}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Floating action button */}
      <FloatingActionButton 
        onClick={handleNewEntityClick}
        label={t("add", language)}
      />
      
      {/* Dialog to select bike */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("select_bike", language)}</DialogTitle>
            <DialogDescription>
              {t("choose_bike_for_appointment", language)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableBikes.map(bike => (
              <Button 
                key={bike.id} 
                variant="outline" 
                className="w-full h-auto py-3 flex justify-between items-center"
                onClick={() => handleBikeSelect(bike.id)}
              >
                <span className="flex items-center gap-2">
                  <Bike className="h-4 w-4" />
                  {bike.name}
                </span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>{t("cancel", language)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Appointment Dialog */}
      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={setIsAppointmentDialogOpen}
        bikeId={selectedBikeId || ''}
        bikeName={selectedBikeName}
        onSaved={handleAppointmentDialogClose}
        initialTab='tabs'
      />
      
      <BottomNav activePage="/calendar" />
    </div>
  );
};

export default MaintenancePlanPage;
