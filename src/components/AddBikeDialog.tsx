
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BikeImageUpload from "@/components/bike/BikeImageUpload";

interface BikeFormData {
  name: string;
  type: string;
  year?: number;
  total_distance?: number;
}

interface AddBikeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddBikeDialog = ({ open, onOpenChange, onSuccess }: AddBikeDialogProps) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>('');
  const form = useForm<BikeFormData>({
    defaultValues: {
      name: '',
      type: '',
      year: undefined,
      total_distance: 0,
    },
  });

  const onSubmit = async (data: BikeFormData) => {
    try {
      // Primero obtenemos la sesión actual para conseguir el ID del usuario
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session?.user?.id) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para crear una bicicleta",
          variant: "destructive",
        });
        return;
      }
      
      const userId = sessionData.session.user.id;
      
      // Ahora insertamos con el user_id incluido
      const { error } = await supabase
        .from('bikes')
        .insert({
          name: data.name,
          type: data.type,
          year: data.year || null,
          user_id: userId,
          image: imageUrl || null,
          total_distance: data.total_distance || 0,
        });

      if (error) throw error;

      toast({
        title: "Bicicleta creada",
        description: "La bicicleta se ha creado correctamente",
      });

      form.reset();
      setImageUrl('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating bike:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la bicicleta",
        variant: "destructive",
      });
    }
  };

  const handleImageChange = (url: string) => {
    setImageUrl(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Bicicleta</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <BikeImageUpload 
              currentImage={imageUrl} 
              onImageChange={handleImageChange}
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
            <FormField
              control={form.control}
              name="total_distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilometraje actual</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
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
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBikeDialog;
