
import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceFormData {
  type: string;
  distance_at_maintenance?: number;
  labor_cost: number;
  materials_cost: number;
  date: string;
  notes?: string;
}

interface AddMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeId: string;
  onSuccess?: () => void;
}

const AddMaintenanceDialog = ({ open, onOpenChange, bikeId, onSuccess }: AddMaintenanceDialogProps) => {
  const { toast } = useToast();
  const form = useForm<MaintenanceFormData>({
    defaultValues: {
      type: '',
      labor_cost: 0,
      materials_cost: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const { data: maintenanceTypes } = useQuery({
    queryKey: ['maintenanceTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      const totalCost = Number(data.labor_cost) + Number(data.materials_cost);
      
      const { error } = await supabase
        .from('maintenance')
        .insert({
          bike_id: bikeId,
          type: data.type,
          date: data.date,
          distance_at_maintenance: data.distance_at_maintenance,
          labor_cost: data.labor_cost,
          materials_cost: data.materials_cost,
          cost: totalCost,
          notes: data.notes,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Mantenimiento registrado",
        description: "El registro se ha creado correctamente",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el registro de mantenimiento",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Mantenimiento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de mantenimiento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maintenanceTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distance_at_maintenance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilometraje actual</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="labor_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mano de obra (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="materials_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materiales (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Input placeholder="Notas adicionales" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaintenanceDialog;
