
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MaintenanceProps } from '@/components/MaintenanceItem';
import { Filter, ArrowUpDown, Edit } from 'lucide-react';
import EditMaintenanceDialog from '@/components/EditMaintenanceDialog';
import DeleteMaintenanceButton from "./DeleteMaintenanceButton";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

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
  const { language } = useLanguage();

  const handleEdit = (id: string) => setEditId(id);
  const handleCloseDialog = () => setEditId(null);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t("maintenance_history", language)}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onFilter}
          >
            <Filter className="h-4 w-4 mr-1" />
            {t("filter", language)}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            {t("export", language)}
          </Button>
        </div>
      </div>
      {maintenance.length === 0 ? (
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground mb-4">{t("no_maintenance_records", language)}</p>
          <Button onClick={onAddMaintenance}>
            {t("add_maintenance", language)}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {maintenance.map((item) => (
            <div 
              key={item.id} 
              className="p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer flex items-center justify-between"
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
                  aria-label={t("edit", language)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <DeleteMaintenanceButton 
                  maintenanceId={item.id} 
                  onDeleted={() => window.location.reload()} 
                />
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
