
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MaintenanceCategorySelect from '../MaintenanceCategorySelect';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceFormData } from './MaintenanceForm';

interface MaintenanceTypeFieldProps {
  form: UseFormReturn<MaintenanceFormData>;
}

export const MaintenanceTypeField = ({ form }: MaintenanceTypeFieldProps) => {
  const { toast } = useToast();
  const [newTypeName, setNewTypeName] = useState("");
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [showAddTypeHelp, setShowAddTypeHelp] = useState(true);
  const { language } = useLanguage();

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

  // Hide the help tooltip after a few seconds
  React.useEffect(() => {
    if (showAddTypeHelp) {
      const timer = setTimeout(() => {
        setShowAddTypeHelp(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showAddTypeHelp]);

  return (
    <>
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
    </>
  );
};
