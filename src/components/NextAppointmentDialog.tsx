import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaintenanceAlertDialog from '@/components/MaintenanceAlertDialog';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeId: string;
  bikeName: string;
  onSaved: () => void;
  initialTab?: 'appointments' | 'alerts';
}

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  onOpenChange,
  bikeId,
  bikeName,
  onSaved,
  initialTab = 'appointments'
}) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (bikeId) {
      fetchAppointments();
    }
  }, [bikeId, open]);

  const fetchAppointments = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('bike_id', bikeId)
        .gte('date', today)
        .order('date', { ascending: true });
        
      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }
      
      setAppointments(data || []);
    } catch (err) {
      console.error('Error in fetchAppointments:', err);
    }
  };

  const handleSave = async () => {
    if (!date) {
      toast({
        title: t("error", language),
        description: "Por favor, selecciona una fecha",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          bike_id: bikeId,
          date: format(date, 'yyyy-MM-dd'),
          notes: notes,
        });

      if (error) throw error;

      toast({
        title: "Cita guardada",
        description: "La cita se ha guardado correctamente.",
      });
      
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: t("error", language),
        description: "No se pudo guardar la cita",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("manage_maintenance_plan", language)}</DialogTitle>
          <DialogDescription>
            {bikeName}: {t("upcoming_appointments", language)}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="appointments">Citas</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appointments" className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="date">{t("date", language)}</Label>
              <DatePicker id="date" onSelect={setDate} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes", language)}</Label>
              <Textarea 
                id="notes"
                placeholder={t("notes_placeholder", language)}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                {t("cancel", language)}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? t("saving", language) : t("add_appointment", language)}
              </Button>
            </DialogFooter>
            
            <div className="border-t pt-4 mt-2">
              <h3 className="text-lg font-semibold mb-2">
                {t("upcoming_appointments", language)}
              </h3>
              {appointments.length > 0 ? (
                <ul className="list-disc pl-5">
                  {appointments.map(appointment => (
                    <li key={appointment.id}>
                      {format(new Date(appointment.date), 'dd/MM/yyyy')} - {appointment.notes || t("additional_notes", language)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">{t("no_appointments", language)}</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4 py-2">
            <MaintenanceAlertDialog
              open={activeTab === 'alerts'}
              onOpenChange={(open) => {
                setIsAlertDialogOpen(open);
                if (!open) setActiveTab('appointments'); // Volver a la pestaña de citas al cerrar
              }}
              bikeId={bikeId}
              bikeName={bikeName}
              onSaved={onSaved}
            />
            
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                {t("cancel", language)}
              </Button>
              <Button type="button" onClick={() => setIsAlertDialogOpen(true)}>
                {t("configure_alert", language)}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
