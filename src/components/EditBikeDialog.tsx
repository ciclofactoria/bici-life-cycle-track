
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [imageUrl, setImageUrl] = useState<string | undefined>(bikeData?.image);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<BikeFormData>({
    defaultValues: {
      name: bikeData?.name || '',
      type: bikeData?.type || '',
      year: bikeData?.year || undefined,
      image: bikeData?.image || undefined
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `bikes/${fileName}`;

    setIsUploading(true);

    try {
      // Create bucket if it doesn't exist
      const { data: bucketExists } = await supabase.storage.getBucket('bike-images');
      if (!bucketExists) {
        await supabase.storage.createBucket('bike-images', {
          public: true
        });
      }
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('bike-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrl } = supabase.storage
        .from('bike-images')
        .getPublicUrl(filePath);

      if (publicUrl) {
        setImageUrl(publicUrl.publicUrl);
        form.setValue('image', publicUrl.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BikeFormData) => {
    try {
      // Update the bike data
      const { error } = await supabase
        .from('bikes')
        .update({
          name: data.name,
          type: data.type,
          year: data.year || null,
          image: imageUrl || data.image
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
            {/* Image Upload Preview */}
            <div className="mb-4">
              <div className="relative aspect-video mb-2 overflow-hidden rounded-md bg-muted">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Vista previa" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Subiendo imagen...' : 'No hay imagen'}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label 
                  htmlFor="picture" 
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3"
                >
                  {isUploading ? 'Subiendo...' : 'Cambiar imagen'}
                </label>
                <input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </div>
            </div>
            
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
              <Button type="submit" disabled={isUploading}>Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBikeDialog;
