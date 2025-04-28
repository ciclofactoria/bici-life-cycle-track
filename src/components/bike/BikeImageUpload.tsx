
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BikeImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
}

const BikeImageUpload = ({ currentImage, onImageChange }: BikeImageUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      toast({
        title: "Formato no válido",
        description: "Por favor sube una imagen en formato jpg, png, gif o webp",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo permitido es 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('bike-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('bike-images')
        .getPublicUrl(filePath);

      if (publicUrl) {
        onImageChange(publicUrl.publicUrl);
      }

      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      });
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

  return (
    <div className="mb-4">
      <div className="relative aspect-video mb-2 overflow-hidden rounded-md bg-muted">
        {currentImage ? (
          <img 
            src={currentImage} 
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
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageUpload}
          disabled={isUploading}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Formatos permitidos: JPG, PNG, GIF, WEBP. Máximo 5MB
        </p>
      </div>
    </div>
  );
};

export default BikeImageUpload;
