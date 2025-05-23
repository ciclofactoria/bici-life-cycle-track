
import { toast } from '@/components/ui/use-toast';
import { generateMaintenanceExcel } from '@/utils/excelGenerator';
import { usePremiumFeatures } from '@/services/premiumService';

export const useMaintenanceExport = () => {
  const { isPremium } = usePremiumFeatures();

  const handleExportExcel = (bike: any, maintenance: any[]) => {
    if (!bike) return;
    
    // Verificar si el usuario es premium antes de exportar
    if (!isPremium) {
      toast("Función premium", {
        description: 'Las exportaciones a Excel están disponibles solo para usuarios premium',
      });
      return;
    }
    
    try {
      generateMaintenanceExcel(bike, maintenance);
      toast("Exportado con éxito", {
        description: "El historial de mantenimiento se ha exportado a Excel",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast("Error", {
        description: "No se pudo exportar el historial",
      });
    }
  };

  return { handleExportExcel };
};
