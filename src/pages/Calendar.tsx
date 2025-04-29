
import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar as CalendarIcon, Bike } from 'lucide-react';
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

interface AppointmentDay {
  id: string;
  date: Date;
  type: 'maintenance' | 'appointment';
  bikeName: string;
  notes?: string | null;
}

const CalendarPage = () => {
  // Fetch all maintenance dates and appointments
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar-dates'],
    queryFn: async () => {
      const [maintenanceResult, appointmentsResult, bikesResult] = await Promise.all([
        supabase
          .from('maintenance')
          .select('id, date, type, bike_id, bikes(name)')
          .order('date'),
        supabase
          .from('appointments')
          .select('id, date, notes, bike_id')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date'),
        supabase
          .from('bikes')
          .select('id, name')
      ]);

      if (maintenanceResult.error) throw maintenanceResult.error;
      if (appointmentsResult.error) throw appointmentsResult.error;
      if (bikesResult.error) throw bikesResult.error;

      const appointments: AppointmentDay[] = [];
      const bikesMap = new Map();
      
      // Crear mapa de bicicletas para búsqueda rápida
      if (bikesResult.data) {
        bikesResult.data.forEach(bike => {
          bikesMap.set(bike.id, bike.name);
        });
      }

      // Add maintenance dates
      maintenanceResult.data.forEach(maintenance => {
        appointments.push({
          id: maintenance.id,
          date: new Date(maintenance.date),
          type: 'maintenance',
          bikeName: maintenance.bikes?.name || bikesMap.get(maintenance.bike_id) || 'Bicicleta',
          notes: maintenance.type
        });
      });

      // Add scheduled appointments
      appointmentsResult.data.forEach(appointment => {
        appointments.push({
          id: appointment.id,
          date: new Date(appointment.date),
          type: 'appointment',
          bikeName: bikesMap.get(appointment.bike_id) || 'Bicicleta',
          notes: appointment.notes
        });
      });

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

  if (isLoading) {
    return (
      <div className="pb-16">
        <div className="bici-container pt-6">
          <h1 className="text-2xl font-bold mb-6">Calendario</h1>
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
        <h1 className="text-2xl font-bold mb-6">Calendario</h1>
        
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
                  ) || false
              }}
              modifiersStyles={{
                maintenance: { backgroundColor: 'rgb(34 197 94)', color: 'white' },
                appointment: { backgroundColor: 'rgb(239 68 68)', color: 'white' }
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
                      <CalendarIcon className={`h-4 w-4 ${app.type === 'maintenance' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="font-medium">{app.bikeName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {app.type === 'maintenance' ? 'Mantenimiento' : 'Cita programada'}
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
                          app.type === 'maintenance' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {app.type === 'maintenance' ? 'Mantenimiento' : 'Cita'}
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
      </div>
      <BottomNav activePage="/calendar" />
    </div>
  );
};

export default CalendarPage;
