
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const useBikeAppointments = (bikeId: string | null, bikeName: string | undefined) => {
  const handleSetNextAppointment = async (date: Date | undefined, notes: string) => {
    if (!bikeId || !date) return;

    try {
      // Obtener el ID del usuario actual
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user?.id) {
        toast({
          title: "Error",
          description: "Usuario no autenticado",
          variant: "destructive"
        });
        return;
      }

      const userId = sessionData.session.user.id;
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          bike_id: bikeId,
          user_id: userId,
          date: formattedDate,
          notes: notes
        });

      if (error) throw error;

      toast({
        title: "Cita programada",
        description: "La cita ha sido programada correctamente",
      });

    } catch (error) {
      console.error('Error setting next appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo programar la cita",
        variant: "destructive"
      });
    }
  };

  return {
    handleSetNextAppointment
  };
};
