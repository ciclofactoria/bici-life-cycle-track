
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import BottomNav from '@/components/BottomNav';

interface AppointmentDay {
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
      const [maintenanceResult, bikesResult] = await Promise.all([
        supabase
          .from('maintenance')
          .select('date, type, bike_id, bikes(name)')
          .order('date'),
        supabase
          .from('bikes')
          .select('name, next_check_date, next_check_notes')
          .not('next_check_date', 'is', null)
      ]);

      if (maintenanceResult.error) throw maintenanceResult.error;
      if (bikesResult.error) throw bikesResult.error;

      const appointments: AppointmentDay[] = [];

      // Add maintenance dates
      maintenanceResult.data.forEach(maintenance => {
        appointments.push({
          date: new Date(maintenance.date),
          type: 'maintenance',
          bikeName: maintenance.bikes?.name || 'Bicicleta',
          notes: maintenance.type
        });
      });

      // Add scheduled appointments
      bikesResult.data.forEach(bike => {
        if (bike.next_check_date) {
          appointments.push({
            date: new Date(bike.next_check_date),
            type: 'appointment',
            bikeName: bike.name,
            notes: bike.next_check_notes
          });
        }
      });

      return appointments;
    }
  });

  const getDateStyle = (date: Date) => {
    if (!calendarData) return {};

    const appointment = calendarData.find(
      app => app.date.toDateString() === date.toDateString()
    );

    if (!appointment) return {};

    return {
      className: appointment.type === 'maintenance' 
        ? 'bg-green-500 text-white hover:bg-green-600' 
        : 'bg-red-500 text-white hover:bg-red-600'
    };
  };

  const selectedDateAppointments = (date: Date) => {
    if (!calendarData) return [];
    return calendarData.filter(
      app => app.date.toDateString() === date.toDateString()
    );
  };

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

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

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Calendario</h1>
        
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
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
              className="rounded-md"
            />
          </div>

          <div className="rounded-lg border bg-card p-4">
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
      </div>
      <BottomNav activePage="/calendar" />
    </div>
  );
};

export default CalendarPage;
