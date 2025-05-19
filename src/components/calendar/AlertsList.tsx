
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  bike_id: string;
  maintenance_type: string;
  is_distance_based: boolean;
  alert_distance?: number;
  alert_months?: number;
  bikes?: {
    name: string;
  }
}

interface AlertsListProps {
  alerts: Alert[];
  selectedBikeId: string | null;
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts, selectedBikeId }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_alerts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: t("alert_deleted", language),
        description: t("alert_deleted_desc", language),
      });
      
      // Refresh page to update the list
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: t("error", language),
        description: t("alert_delete_error", language),
        variant: "destructive"
      });
    }
  };
  
  const handleComplete = async (alert: Alert) => {
    try {
      // 1. Create maintenance record
      const { error: maintenanceError } = await supabase
        .from('maintenance')
        .insert({
          bike_id: alert.bike_id,
          type: alert.maintenance_type,
          date: new Date().toISOString().split('T')[0],
          cost: 0, // Default cost
          notes: t("automatic_maintenance_alert", language),
        });
        
      if (maintenanceError) throw maintenanceError;
      
      // 2. Deactivate the alert
      const { error: updateError } = await supabase
        .from('maintenance_alerts')
        .update({ is_active: false })
        .eq('id', alert.id);
        
      if (updateError) throw updateError;
      
      toast({
        title: t("maintenance_recorded", language),
        description: t("maintenance_alert_completed", language),
      });
      
      // Refresh page
      window.location.reload();
      
    } catch (error) {
      console.error('Error completing maintenance alert:', error);
      toast({
        title: t("error", language),
        description: t("operation_failed", language),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="py-2">
      <h3 className="text-sm font-medium mb-2">{t("active_alerts", language)}</h3>
      
      {alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                  <p className="font-medium">{alert.maintenance_type}</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleComplete(alert)}
                    title={t("complete", language)}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(alert.id)}
                    title={t("delete", language)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {alert.is_distance_based 
                  ? t("every_distance", language, { distance: alert.alert_distance }) 
                  : t("every_months", language, { months: alert.alert_months })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {alert.bikes?.name}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          {t("no_active_alerts", language)}
          <p className="text-xs mt-1">{t("configure_alerts_from_bikes", language)}</p>
        </div>
      )}
    </div>
  );
};
