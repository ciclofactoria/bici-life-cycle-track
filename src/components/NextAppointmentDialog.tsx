
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { CalendarClock } from 'lucide-react';

interface NextAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate?: Date | null;
  onDateSelect: (date: Date | undefined) => void;
}

const NextAppointmentDialog = ({ 
  open, 
  onOpenChange, 
  currentDate, 
  onDateSelect 
}: NextAppointmentDialogProps) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    currentDate || undefined
  );

  const handleSave = () => {
    onDateSelect(selectedDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Programar próxima cita</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            initialFocus
            className="rounded-md border pointer-events-auto"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NextAppointmentDialog;
