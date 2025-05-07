import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        title: "Error",
        description: "Por favor introduce un tipo de mantenimiento personalizado",
        variant: "destructive"
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
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
        title: "Alerta configurada",
        description: `Se ha configurado una alerta de mantenimiento para ${bikeName}`,
      });
      
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving maintenance alert:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la alerta de mantenimiento",
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
          <DialogTitle>Configurar Alerta de Mantenimiento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="alertType">Tipo de Alerta</Label>
            <Tabs value={alertType} onValueChange={(v) => setAlertType(v as AlertType)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="distance">Por Distancia</TabsTrigger>
                <TabsTrigger value="time">Por Tiempo</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceType">Tipo de Mantenimiento</Label>
            <Select value={maintenanceType} onValueChange={(v) => setMaintenanceType(v as MaintenanceType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de mantenimiento" />
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
              <Label htmlFor="customType">Tipo Personalizado</Label>
              <Input
                id="customType"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Ej: Cambio suspensión"
              />
            </div>
          )}

          {alertType === 'distance' ? (
            <div className="space-y-2">
              <Label htmlFor="distanceValue">Kilómetros</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="distanceValue"
                  type="number"
                  min={1}
                  value={distanceValue}
                  onChange={(e) => setDistanceValue(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">km</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Se creará una alerta cuando la bicicleta alcance {distanceValue} km adicionales desde ahora.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="timeMonths">Meses</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="timeMonths"
                  type="number"
                  min={1}
                  max={60}
                  value={timeMonths}
                  onChange={(e) => setTimeMonths(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">meses</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Se creará una alerta para dentro de {timeMonths} meses.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceAlertDialog;
