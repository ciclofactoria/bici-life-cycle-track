
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceFormData } from './MaintenanceForm';

interface MaintenanceNotesFieldProps {
  form: UseFormReturn<MaintenanceFormData>;
}

export const MaintenanceNotesField = ({ form }: MaintenanceNotesFieldProps) => {
  const { language } = useLanguage();

  return (
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
  );
};
