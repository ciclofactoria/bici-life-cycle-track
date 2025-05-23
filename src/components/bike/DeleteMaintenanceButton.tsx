
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  maintenanceId: string;
  onDeleted?: () => void;
}

export const DeleteMaintenanceButton: React.FC<Props> = ({ maintenanceId, onDeleted }) => {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres borrar este registro?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', maintenanceId);

      if (error) {
        throw error;
      }

      toast({
        title: "Borrado",
        description: "Registro eliminado correctamente",
      });
      if (onDeleted) onDeleted();
      else window.location.reload();
    } catch {
      toast({
        title: "Error",
        description: "No se pudo borrar el registro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleDelete}
      aria-label="Borrar"
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};

export default DeleteMaintenanceButton;
