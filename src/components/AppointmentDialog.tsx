
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarClock, Trash2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface Appointment {
  id?: string;
  date: Date;
  notes: string;
}

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (open) {
      setSelectedDate(new Date());
      setNotes('');
      fetchAppointments();
    }
  }, [open, bikeId]);

  const handleSave = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Selecciona una fecha para la cita",
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

  const handleDelete = async (appointmentId: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestión de citas: {bikeName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulario para añadir nueva cita */}
          <div className="space-y-4">
            <h3 className="font-medium">Nueva cita</h3>
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
              onClick={handleSave} 
              disabled={loading || !selectedDate}
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
                      onClick={() => appointment.id && handleDelete(appointment.id)}
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
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
