
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BikeProps } from '@/components/BikeCard';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePremiumFeatures } from '@/services/premiumService';

interface PremiumDowngradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const PremiumDowngradeDialog = ({ open, onOpenChange, userId }: PremiumDowngradeDialogProps) => {
  const { toast } = useToast();
  const [activeBikes, setActiveBikes] = useState<BikeProps[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isPremium } = usePremiumFeatures();
  const navigate = useNavigate();

  // Si el usuario es premium, cerrar automáticamente el diálogo
  useEffect(() => {
    if (isPremium && open) {
      onOpenChange(false);
    }
  }, [isPremium, open, onOpenChange]);

  useEffect(() => {
    const fetchActiveBikes = async () => {
      if (open && userId && !isPremium) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('bikes')
            .select('*')
            .eq('user_id', userId)
            .eq('archived', false);

          if (error) throw error;

          if (data && data.length > 0) {
            const mappedBikes = data.map(bike => ({
              id: bike.id,
              name: bike.name,
              type: bike.type,
              year: bike.year || 0,
              image: bike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
              totalSpent: 0,
              lastMaintenance: 'N/A'
            }));
            
            setActiveBikes(mappedBikes);
            setSelectedBikeId(mappedBikes[0].id);
          }
        } catch (error) {
          console.error('Error fetching bikes:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las bicicletas",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchActiveBikes();
  }, [open, userId, toast, isPremium]);

  const handleSaveBikeSelection = async () => {
    if (!selectedBikeId) return;
    
    setIsLoading(true);
    try {
      // Archivar todas las bicicletas excepto la seleccionada
      for (const bike of activeBikes) {
        if (bike.id !== selectedBikeId) {
          const { error } = await supabase
            .from('bikes')
            .update({ archived: true })
            .eq('id', bike.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Cambios guardados",
        description: "Las otras bicicletas se han movido a archivadas y podrás recuperarlas si renuevas tu suscripción premium.",
      });
      
      onOpenChange(false);
      
      // Redirigir a la página principal para refrescar la vista
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error archiving bikes:', error);
      toast({
        title: "Error",
        description: "No se pudieron archivar las bicicletas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Si el usuario es premium, no mostrar el diálogo
  if (isPremium) {
    return null;
  }

  return (
    <AlertDialog open={open && !isPremium} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tu plan premium ha caducado</AlertDialogTitle>
          <AlertDialogDescription>
            Como usuario no premium, solo puedes mantener una bicicleta activa. 
            Por favor, selecciona la bicicleta que deseas mantener. Las demás se moverán 
            a archivadas y podrás recuperarlas si renuevas tu suscripción.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <RadioGroup
            value={selectedBikeId}
            onValueChange={setSelectedBikeId}
            className="mt-2 space-y-3"
          >
            {activeBikes.map((bike) => (
              <div key={bike.id} className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value={bike.id} id={`bike-${bike.id}`} />
                <Label htmlFor={`bike-${bike.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img 
                      src={bike.image} 
                      alt={bike.name} 
                      className="w-12 h-12 object-cover rounded-md" 
                    />
                    <div>
                      <p className="font-medium">{bike.name}</p>
                      <p className="text-sm text-muted-foreground">{bike.type}</p>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button 
            onClick={handleSaveBikeSelection} 
            disabled={isLoading || !selectedBikeId}
            className="bg-bicicare-green hover:bg-bicicare-green/80"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar selección"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PremiumDowngradeDialog;
