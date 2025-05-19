
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Trash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  date: string;
  description: string;
  bike_id: string;
  bikes?: {
    name: string;
  }
}

interface AppointmentsListProps {
  appointments: Appointment[];
  formatDate: (dateString: string) => string;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({ appointments, formatDate }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: t("success", language),
        description: t("appointment_deleted", language),
      });
      
      // Refresh page to update the list
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: t("error", language),
        description: t("appointment_delete_error", language),
        variant: "destructive"
      });
    }
  };

  const filteredAppointments = appointments.filter(app => {
    // Only show future appointments
    const appDate = new Date(app.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appDate >= today;
  });

  // Sort by date (closest first)
  filteredAppointments.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="py-2">
      <h3 className="text-sm font-medium mb-2">{t("upcoming_appointments", language)}</h3>
      
      {filteredAppointments.length > 0 ? (
        <ul className="space-y-2">
          {filteredAppointments.map((appointment) => (
            <li key={appointment.id} className="flex items-center justify-between border rounded-md p-3">
              <div>
                <div className="flex items-center">
                  <CalendarCheck className="h-4 w-4 mr-2 text-blue-500" />
                  <p className="font-medium">{formatDate(appointment.date)}</p>
                </div>
                <p className="text-sm mt-1">{appointment.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {appointment.bikes?.name}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDelete(appointment.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          {t("no_upcoming_appointments", language)}
        </div>
      )}
    </div>
  );
};
