
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceFormData } from './MaintenanceForm';

interface MaintenanceCostFieldsProps {
  form: UseFormReturn<MaintenanceFormData>;
}

export const MaintenanceCostFields = ({ form }: MaintenanceCostFieldsProps) => {
  const { language } = useLanguage();

  return (
    <>
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
    </>
  );
};
