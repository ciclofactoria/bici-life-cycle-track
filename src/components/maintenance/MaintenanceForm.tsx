
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { usePremiumFeatures } from '@/services/premiumService';
import { MaintenanceTypeField } from './MaintenanceTypeField';
import { MaintenanceDistanceField } from './MaintenanceDistanceField';
import { MaintenanceCostFields } from './MaintenanceCostFields';
import { MaintenanceDateField } from './MaintenanceDateField';
import { MaintenanceNotesField } from './MaintenanceNotesField';

export interface MaintenanceFormData {
  type: string;
  distance_at_maintenance?: number;
  labor_cost: number;
  materials_cost: number;
  date: string;
  notes?: string;
}

interface MaintenanceFormProps {
  bikeId: string;
  stravaId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const MaintenanceForm = ({ bikeId, stravaId, onCancel, onSuccess }: MaintenanceFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isPremium } = usePremiumFeatures();
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);
  const { language } = useLanguage();

  const form = useForm<MaintenanceFormData>({
    defaultValues: {
      type: '',
      labor_cost: 0,
      materials_cost: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch bike data to get current total distance when form opens
  useEffect(() => {
    if (bikeId) {
      const fetchBikeData = async () => {
        try {
          const { data, error } = await supabase
            .from('bikes')
            .select('total_distance')
            .eq('id', bikeId)
            .single();
            
          if (error) {
            console.error('Error fetching bike distance:', error);
          } else if (data && data.total_distance) {
            form.setValue('distance_at_maintenance', data.total_distance);
          }
        } catch (err) {
          console.error('Error in fetchBikeData:', err);
        }
      };
      
      fetchBikeData();
    }
  }, [bikeId, form]);

  // Auto-fill distance from Strava for premium users when date changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'date' && value.date && isPremium && stravaId) {
        fetchStravaDistanceForDate(value.date as string);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, isPremium, stravaId]);

  const fetchStravaDistanceForDate = async (date: string) => {
    if (!isPremium || !stravaId) return;
    
    try {
      setIsLoadingDistance(true);
      
      // Get current user to check for Strava connection
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) {
        console.error('No authenticated user found');
        return;
      }
      
      // Check if user has Strava connection
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('strava_connected, strava_access_token')
        .eq('id', userData.user.id)
        .single();
        
      if (profileError || !profile || !profile.strava_connected) {
        console.log('User has no valid Strava connection');
        return;
      }
      
      // This would need to be implemented on the backend
      // to get the distance at a specific date from Strava
      // For now, we'll just use the bike's current total distance
      
      const { data: bikeData, error: bikeError } = await supabase
        .from('bikes')
        .select('total_distance')
        .eq('id', bikeId)
        .single();
        
      if (!bikeError && bikeData?.total_distance) {
        form.setValue('distance_at_maintenance', bikeData.total_distance);
        toast({
          title: "Información de Strava",
          description: "Distancia actualizada según los datos de Strava"
        });
      }
    } catch (err) {
      console.error('Error fetching Strava distance:', err);
    } finally {
      setIsLoadingDistance(false);
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
      onSuccess();
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <MaintenanceTypeField form={form} />
        
        <MaintenanceDistanceField 
          form={form} 
          isLoadingDistance={isLoadingDistance} 
          stravaId={stravaId} 
          isPremium={isPremium} 
        />
        
        <MaintenanceCostFields form={form} />
        
        <MaintenanceDateField form={form} />
        
        <MaintenanceNotesField form={form} />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel", language)}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("creating", language) : t("create", language)}
          </Button>
        </div>
      </form>
    </Form>
  );
};
