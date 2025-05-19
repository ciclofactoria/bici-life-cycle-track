
import React from 'react';
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { UseFormReturn } from 'react-hook-form';
import { MaintenanceFormData } from './MaintenanceForm';

interface MaintenanceDistanceFieldProps {
  form: UseFormReturn<MaintenanceFormData>;
  isLoadingDistance: boolean;
  stravaId?: string;
  isPremium: boolean;
}

export const MaintenanceDistanceField = ({ 
  form, 
  isLoadingDistance, 
  stravaId, 
  isPremium 
}: MaintenanceDistanceFieldProps) => {
  const { language } = useLanguage();

  return (
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
  );
};
