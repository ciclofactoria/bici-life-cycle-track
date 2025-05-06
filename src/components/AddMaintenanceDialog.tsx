import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle } from "lucide-react";
import MaintenanceCategorySelect from './MaintenanceCategorySelect';

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
  const [newTypeName, setNewTypeName] = useState("");
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<MaintenanceFormData>({
    defaultValues: {
      type: '',
      labor_cost: 0,
      materials_cost: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const { data: maintenanceTypes, refetch } = useQuery({
    queryKey: ['maintenanceTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_types')
        .select('*')
        .order('name');
      if (error) throw error;
      
      // Remove duplicates by name
      const uniqueTypes = data.filter((type, index, self) => 
        index === self.findIndex(t => t.name === type.name)
      );
      
      return uniqueTypes;
    },
  });

  const handleAddNewType = async () => {
    if (!newTypeName.trim()) return;
    
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('maintenance_types')
        .insert({
          name: newTypeName.trim(),
          user_id: user.user?.id
        });
        
      if (error) throw error;
      
      toast({
        title: "Tipo agregado",
        description: "Nuevo tipo de mantenimiento creado"
      });
      
      // Select the new type
      form.setValue("type", newTypeName.trim());
      
      // Reset UI state
      setNewTypeName("");
      setShowNewTypeInput(false);
      
      // Refresh the types list
      refetch();
    } catch (error) {
      console.error("Error creating new maintenance type:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el nuevo tipo de mantenimiento",
        variant: "destructive"
      });
    }
  };

  const validateBikeId = (id: string): boolean => {
    if (!id || id.trim() === '') {
      console.error("No bike ID provided");
      return false;
    }
    
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValid = uuidRegex.test(id);
    
    if (!isValid) {
      console.error("Invalid bike ID format:", id);
    }
    
    return isValid;
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate that we have a bikeId
      if (!validateBikeId(bikeId)) {
        toast({
          title: "Error",
          description: "ID de bicicleta no válido. Por favor, vuelve a intentarlo.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      console.log("Submitting maintenance with bike ID:", bikeId);
      
      const totalCost = Number(data.labor_cost) + Number(data.materials_cost);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error("Usuario no autenticado");
      }
      
      const { data: result, error } = await supabase
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
          user_id: user.user.id,
        })
        .select();

      if (error) {
        console.error("Error inserting maintenance:", error);
        throw error;
      }
      
      console.log("Maintenance record created:", result);

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
    } finally {
      setIsSubmitting(false);
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
            {showNewTypeInput ? (
              <div className="space-y-2">
                <FormLabel>Nuevo tipo de mantenimiento</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Nombre del nuevo tipo"
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    <Button type="button" onClick={handleAddNewType}>
                      Guardar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewTypeInput(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de mantenimiento</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <MaintenanceCategorySelect 
                          value={field.value} 
                          onValueChange={field.onChange}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-background">
                          <DropdownMenuItem onClick={() => setShowNewTypeInput(true)}>
                            Añadir nuevo tipo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaintenanceDialog;
