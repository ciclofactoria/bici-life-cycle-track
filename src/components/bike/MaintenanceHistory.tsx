

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MaintenanceProps } from '@/components/MaintenanceItem';
import { Filter, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import EditMaintenanceDialog from '@/components/EditMaintenanceDialog';

interface MaintenanceHistoryProps {
  maintenance: MaintenanceProps[];
  onFilter: () => void;
  onExport: () => void;
  onAddMaintenance: () => void;
}

const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({ 
  maintenance, 
  onFilter, 
  onExport, 
  onAddMaintenance 
}) => {
  const [editId, setEditId] = useState<string | null>(null);

  const handleEdit = (id: string) => setEditId(id);
  const handleCloseDialog = () => setEditId(null);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Historial de Mantenimiento</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onFilter}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtrar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {maintenance.length === 0 ? (
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground mb-4">No hay registros de mantenimiento</p>
          <Button onClick={onAddMaintenance}>
            Agregar Mantenimiento
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {maintenance.map((item) => (
            <div 
              key={item.id} 
              className="p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer flex items-center justify-between"
              onClick={() => {/* Opcional: mostrar detalles */}}
            >
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.cost}€</p>
                    {item.distance_at_maintenance && (
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(item.distance_at_maintenance / 1000).toLocaleString()} km
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(item.id)}
                  aria-label="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <DeleteMaintenanceButton maintenanceId={item.id} />
              </div>
            </div>
          ))}
        </div>
      )}
      {editId && (
        <EditMaintenanceDialog 
          maintenanceId={editId} 
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
};

export default MaintenanceHistory;

// Botón modularizado borrado
const DeleteMaintenanceButton = ({ maintenanceId }: { maintenanceId: string }) => {
  const [loading, setLoading] = React.useState(false);
  const { toast } = require('@/hooks/use-toast');

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres borrar este registro?")) return;
    setLoading(true);
    try {
      const { supabase } = require('@/integrations/supabase/client');
      // Borrado lógico: marca como deleted
      await supabase
        .from('maintenance')
        .update({ deleted: true })
        .eq('id', maintenanceId);

      toast({
        title: "Borrado",
        description: "Registro eliminado correctamente",
      });
      window.location.reload(); // Forzar refresco de la vista. Mejorable con states!
    } catch (error) {
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

