
import React from 'react';
import { Filter, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MaintenanceItem, { MaintenanceProps } from '@/components/MaintenanceItem';
import EmptyState from '@/components/EmptyState';

interface MaintenanceHistoryProps {
  maintenance: MaintenanceProps[];
  onFilter: () => void;
  onExport: () => void;
  onAddMaintenance: () => void;
}

const MaintenanceHistory = ({ 
  maintenance, 
  onFilter, 
  onExport,
  onAddMaintenance 
}: MaintenanceHistoryProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Historial de Mantenimiento</h2>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 text-muted-foreground hover:text-bicicare-green"
            onClick={onFilter}
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">Filtrar</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 text-muted-foreground hover:text-bicicare-green"
            onClick={onExport}
            title="Exportar a Excel"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">Exportar</span>
          </Button>
        </div>
      </div>
      
      {maintenance.length > 0 ? (
        <div className="space-y-3 pb-4">
          {maintenance.map((item) => (
            <MaintenanceItem key={item.id} maintenance={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay registros de mantenimiento"
          description="Agrega tu primer registro de mantenimiento para comenzar a llevar el control"
          actionLabel="Agregar Registro"
          onAction={onAddMaintenance}
        />
      )}
    </div>
  );
};

export default MaintenanceHistory;
