import React from 'react';
import { Button } from "@/components/ui/button";
import { MaintenanceProps } from '@/components/MaintenanceItem';
import { Filter, ArrowUpDown } from 'lucide-react';

interface MaintenanceHistoryProps {
  maintenance: MaintenanceProps[];
  onFilter: () => void;
  onExport: () => void;
  onAddMaintenance: () => void;
  onConfigureAlert?: () => void;
}

const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({ 
  maintenance, 
  onFilter, 
  onExport, 
  onAddMaintenance 
}) => {
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
              className="p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer"
              onClick={() => {/* TODO: Implementar vista detallada */}}
            >
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
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceHistory;
