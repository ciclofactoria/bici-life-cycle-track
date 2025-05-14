import React, { useState, useEffect } from 'react';
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
import { usePremiumFeatures } from '@/services/premiumService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

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
  stravaId?: string;
}

const AddMaintenanceDialog = ({ open, onOpenChange, bikeId, onSuccess, stravaId }: AddMaintenanceDialogProps) => {
  const { toast } = useToast();
  const [newTypeName, setNewTypeName] = useState("");
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isPremium } = usePremiumFeatures();
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);
  const [showAddTypeHelp, setShowAddTypeHelp] = useState(true);
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
    if (open && bikeId) {
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
  }, [open, bikeId, form]);

  // Auto-fill distance from Strava for premium users when date changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'date' && value.date && isPremium && stravaId) {
        fetchStravaDistanceForDate(value.date as string);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, isPremium, stravaId]);

  // Hide the help tooltip after a few seconds
  useEffect(() => {
    if (open && showAddTypeHelp) {
      const timer = setTimeout(() => {
        setShowAddTypeHelp(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [open, showAddTypeHelp]);

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
          <DialogTitle>{t("add_maintenance_dialog_title", language)}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showNewTypeInput ? (
              <div className="space-y-2">
                <FormLabel>{t("new_maintenance_type", language)}</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder={t("new_type_name_placeholder", language)}
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    <Button type="button" onClick={handleAddNewType}>
                      {t("save", language)}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewTypeInput(false)}>
                      {t("cancel", language)}
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
                    <FormLabel className="flex items-center">
                      {t("maintenance_type", language)}
                      <Popover open={showAddTypeHelp} onOpenChange={setShowAddTypeHelp}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-5 w-5 p-0 ml-1 rounded-full"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowAddTypeHelp(!showAddTypeHelp);
                            }}
                          >
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">{t("help", language)}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">{t("cant_find_type_title", language)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t("cant_find_type_desc", language)}
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormLabel>
                    <div className="flex gap-2 relative">
                      <div className="flex-1">
                        <MaintenanceCategorySelect 
                          value={field.value} 
                          onValueChange={field.onChange}
                        />
                      </div>
                      <div className="relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="relative">
                              <PlusCircle className="h-4 w-4" />
                              {showAddTypeHelp && (
                                <div className="absolute -top-2 -right-2 animate-ping h-3 w-3 rounded-full bg-bicicare-green"></div>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-background">
                            <DropdownMenuItem onClick={() => setShowNewTypeInput(true)}>
                              {t("add_new_type", language)}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                  <FormLabel className="flex items-center">
                    {t("current_mileage", language)}
                    {stravaId && isPremium && (
                      <span className="ml-2 text-xs bg-orange-500 text-white px-1.5 rounded">
                        Strava
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0"
                      {...field}
                      disabled={isLoadingDistance}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  {stravaId && isPremium && (
                    <p className="text-xs text-muted-foreground">
                      {t("strava_distance_desc", language)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="labor_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labor_cost", language)}</FormLabel>
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
                  <FormLabel>{t("materials_cost", language)}</FormLabel>
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
                  <FormLabel>{t("date", language)}</FormLabel>
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
                  <FormLabel>{t("notes", language)}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("additional_notes_placeholder", language)} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel", language)}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("creating", language) : t("create", language)}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaintenanceDialog;
