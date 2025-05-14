import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

interface MaintenanceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeId: string;
  bikeName: string;
  onSaved: () => void;
}

type AlertType = 'distance' | 'time';
type MaintenanceType = 'tubeless' | 'cubiertas' | 'cadena' | 'piñones' | 'fundas' | 'puesta' | 'custom';

interface MaintenanceTypeOption {
  value: MaintenanceType;
  label: string;
}

const maintenanceTypes: MaintenanceTypeOption[] = [
  { value: 'tubeless', label: 'Rellenar tubeless' },
  { value: 'cubiertas', label: 'Sustituir cubiertas' },
  { value: 'cadena', label: 'Sustituir cadena' },
  { value: 'piñones', label: 'Sustituir piñones' },
  { value: 'fundas', label: 'Sustituir fundas y cables' },
  { value: 'puesta', label: 'Puesta a punto' },
  { value: 'custom', label: 'Otro (personalizado)' }
];

const MaintenanceAlertDialog: React.FC<MaintenanceAlertDialogProps> = ({
  open,
  onOpenChange,
  bikeId,
  bikeName,
  onSaved
}) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [alertType, setAlertType] = useState<AlertType>('distance');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('tubeless');
  const [customType, setCustomType] = useState<string>('');
  const [distanceValue, setDistanceValue] = useState<number>(1000);
  const [timeMonths, setTimeMonths] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    
    getUserId();
  }, []);

  const handleSave = async () => {
    if (maintenanceType === 'custom' && !customType.trim()) {
      toast({
        title: t("error", language),
        description: t("custom_maintenance_required", language),
        variant: "destructive"
      });
      return;
    }
    if (!userId) {
      toast({
        title: t("error", language),
        description: t("not_authenticated", language),
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    
    try {
      // Obtener la distancia actual de la bicicleta si es alerta por distancia
      let baseDistance = null;
      if (alertType === 'distance') {
        const { data, error } = await supabase
          .from('bikes')
          .select('total_distance')
          .eq('id', bikeId)
          .single();
          
        if (error) throw error;
        baseDistance = data?.total_distance || 0;
      }
      
      const { error } = await supabase
        .from('maintenance_alerts')
        .insert({
          bike_id: bikeId,
          user_id: userId,
          alert_type: alertType,
          maintenance_type: maintenanceType,
          custom_type: maintenanceType === 'custom' ? customType.trim() : null,
          distance_threshold: alertType === 'distance' ? distanceValue * 1000 : null, // Convert to meters
          time_threshold_months: alertType === 'time' ? timeMonths : null,
          base_distance: baseDistance,
          is_active: true,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: t("alert_set", language),
        description: t("alert_set_desc", language, { bikeName }),
      });
      
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving maintenance alert:', error);
      toast({
        title: t("error", language),
        description: t("alert_save_failed", language),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("configure_alert", language)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="alertType">{t("alert_type", language)}</Label>
            <Tabs value={alertType} onValueChange={(v) => setAlertType(v as AlertType)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="distance">{t("by_distance", language)}</TabsTrigger>
                <TabsTrigger value="time">{t("by_time", language)}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceType">{t("maintenance_type", language)}</Label>
            <Select value={maintenanceType} onValueChange={(v) => setMaintenanceType(v as MaintenanceType)}>
              <SelectTrigger>
                <SelectValue placeholder={t("select_maintenance_type", language)} />
              </SelectTrigger>
              <SelectContent>
                {maintenanceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {maintenanceType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customType">{t("custom_type", language)}</Label>
              <Input
                id="customType"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder={t("custom_type_placeholder", language)}
              />
            </div>
          )}

          {alertType === 'distance' ? (
            <div className="space-y-2">
              <Label htmlFor="distanceValue">{t("kilometers", language)}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="distanceValue"
                  type="number"
                  min={1}
                  value={distanceValue}
                  onChange={(e) => setDistanceValue(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">{t("km", language)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("alert_distance_desc", language, { distanceValue })}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="timeMonths">{t("months", language)}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="timeMonths"
                  type="number"
                  min={1}
                  max={60}
                  value={timeMonths}
                  onChange={(e) => setTimeMonths(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">{t("months_unit", language)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("alert_time_desc", language, { timeMonths })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel", language)}</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("saving", language) : t("save", language)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceAlertDialog;
