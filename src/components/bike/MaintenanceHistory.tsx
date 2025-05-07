
import React from 'react';
import { Filter, FileText, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MaintenanceItem, { MaintenanceProps } from '@/components/MaintenanceItem';
import EmptyState from '@/components/EmptyState';
import { usePremiumFeatures } from '@/services/premiumService';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceHistoryProps {
  maintenance: MaintenanceProps[];
  onFilter: () => void;
  onExport: () => void;
  onAddMaintenance: () => void;
  onConfigureAlert: () => void;
}

const MaintenanceHistory = ({ 
  maintenance, 
  onFilter, 
  onExport,
  onAddMaintenance,
  onConfigureAlert 
}: MaintenanceHistoryProps) => {
  const { isPremium } = usePremiumFeatures();
  const { toast } = useToast();

  const handleExportClick = () => {
    if (isPremium) {
      onExport();
    } else {
      toast({
        title: 'Función premium',
        description: 'Las exportaciones a Excel están disponibles solo para usuarios premium',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Historial de Mantenimiento</h2>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 text-muted-foreground hover:text-bicicare-green"
            onClick={onConfigureAlert}
          >
            <Bell className="h-4 w-4" />
            <span className="text-sm">Plan</span>
          </Button>
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
            onClick={handleExportClick}
            title="Exportar a Excel"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">
              Exportar
              {!isPremium && (
                <span className="ml-1 text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded-sm flex items-center gap-1 inline-flex">
                  <img 
                    src="/lovable-uploads/c55d72b0-c3b4-4c57-bdbf-fb609210b8dc.png" 
                    className="h-3 w-3" 
                    alt="Premium" 
                  />
                </span>
              )}
            </span>
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
