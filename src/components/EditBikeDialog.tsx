import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BikeImageUpload from './bike/BikeImageUpload';

interface BikeFormData {
  name: string;
  type: string;
  year?: number;
  image?: string;
}

interface EditBikeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeId: string;
  bikeData?: {
    name: string;
    type: string;
    year?: number;
    image?: string;
  };
  onSuccess?: () => void;
}

const EditBikeDialog = ({ open, onOpenChange, bikeId, bikeData, onSuccess }: EditBikeDialogProps) => {
  const { toast } = useToast();
  const form = useForm<BikeFormData>({
    defaultValues: {
      name: bikeData?.name || '',
      type: bikeData?.type || '',
      year: bikeData?.year || undefined,
      image: bikeData?.image || undefined
    },
  });

  const onSubmit = async (data: BikeFormData) => {
    try {
      const { error } = await supabase
        .from('bikes')
        .update({
          name: data.name,
          type: data.type,
          year: data.year || null,
          image: data.image
        })
        .eq('id', bikeId);

      if (error) throw error;

      toast({
        title: "Bicicleta actualizada",
        description: "La información de la bicicleta se ha actualizado correctamente",
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating bike:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la bicicleta",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Bicicleta</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <BikeImageUpload
              currentImage={form.watch('image')}
              onImageChange={(url) => form.setValue('image', url)}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi bicicleta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Input placeholder="MTB, Ruta, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="2024"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBikeDialog;
