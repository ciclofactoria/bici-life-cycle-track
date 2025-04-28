
import { MoreVertical, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface BikeSettingsProps {
  bikeId: string;
}

export function BikeSettings({ bikeId }: BikeSettingsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleArchiveBike = async () => {
    try {
      const { error } = await supabase
        .from('bikes')
        .update({ archived: true })
        .eq('id', bikeId);

      if (error) throw error;

      toast({
        title: "Bicicleta archivada",
        description: "La bicicleta se ha archivado correctamente",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error archivando bicicleta:', error);
      toast({
        title: "Error",
        description: "No se pudo archivar la bicicleta",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBike = async () => {
    try {
      // Delete all maintenance records first
      const { error: maintenanceError } = await supabase
        .from('maintenance')
        .delete()
        .eq('bike_id', bikeId);

      if (maintenanceError) throw maintenanceError;

      // Then delete the bike
      const { error: bikeError } = await supabase
        .from('bikes')
        .delete()
        .eq('id', bikeId);

      if (bikeError) throw bikeError;

      toast({
        title: "Bicicleta eliminada",
        description: "La bicicleta y su historial se han eliminado correctamente",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error eliminando bicicleta:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la bicicleta",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleArchiveBike}>
            <Archive className="mr-2 h-4 w-4" />
            Archivar bicicleta
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar bicicleta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la bicicleta y todo su historial de mantenimiento. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBike}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
