
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

interface EditMaintenanceDialogProps {
  maintenanceId: string;
  onClose: () => void;
}

const EditMaintenanceDialog: React.FC<EditMaintenanceDialogProps> = ({ maintenanceId, onClose }) => {
  const [maintenance, setMaintenance] = useState<any>(null);
  const [form, setForm] = useState({ type: '', date: '', cost: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMaintenance = async () => {
      const { data } = await supabase.from('maintenance').select('*').eq('id', maintenanceId).maybeSingle();
      if (data) {
        setMaintenance(data);
        setForm({
          type: data.type ?? '',
          date: data.date ? data.date.slice(0, 10) : '',
          cost: data.cost?.toString() ?? '',
          notes: data.notes ?? ''
        });
      }
    };
    fetchMaintenance();
  }, [maintenanceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    await supabase.from('maintenance').update({
      type: form.type,
      date: form.date,
      cost: parseFloat(form.cost),
      notes: form.notes
    }).eq('id', maintenanceId);
    toast({
      title: "Registro actualizado",
      description: "Los cambios se guardaron correctamente",
    });
    setLoading(false);
    onClose();
    window.location.reload();
  };

  if (!maintenance) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar mantenimiento</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <Input name="type" value={form.type} onChange={handleChange} placeholder="Tipo" required />
          <Input name="date" type="date" value={form.date} onChange={handleChange} required />
          <Input name="cost" type="number" value={form.cost} onChange={handleChange} required min={0} />
          <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Notas" />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMaintenanceDialog;
