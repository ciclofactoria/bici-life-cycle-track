
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceFormData } from './MaintenanceForm';

interface MaintenanceDateFieldProps {
  form: UseFormReturn<MaintenanceFormData>;
}

export const MaintenanceDateField = ({ form }: MaintenanceDateFieldProps) => {
  const { language } = useLanguage();

  return (
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
  );
};
