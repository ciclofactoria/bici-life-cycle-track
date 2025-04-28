
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarClock } from 'lucide-react';

interface NextAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate?: Date | null;
  currentNotes?: string | null;
  onSave: (date: Date | undefined, notes: string) => void;
}

const NextAppointmentDialog = ({ 
  open, 
  onOpenChange, 
  currentDate, 
  currentNotes,
  onSave 
}: NextAppointmentDialogProps) => {
  const validCurrentDate = currentDate && !isNaN(currentDate.getTime()) ? currentDate : undefined;
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(validCurrentDate);
  const [notes, setNotes] = React.useState(currentNotes || '');

  // Reset form when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      setSelectedDate(validCurrentDate);
      setNotes(currentNotes || '');
    }
  }, [open, validCurrentDate, currentNotes]);

  const handleSave = () => {
    onSave(selectedDate, notes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Taller, tipo de reparación, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
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
