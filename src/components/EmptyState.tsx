
import React from 'react';
import { Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
}

const EmptyState = ({ title, description, actionLabel, onAction }: EmptyStateProps) => {
  const { language } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Bike className="h-8 w-8 text-bicicare-green" />
      </div>
      <h3 className="text-xl font-medium mb-2">{title || t('no_bikes_found', language)}</h3>
      <p className="text-muted-foreground mb-6 max-w-xs">{description || t('add_first_bike', language)}</p>
      <Button onClick={onAction} className="bg-bicicare-green hover:bg-bicicare-green/90 text-black">
        {actionLabel || t('add_bike', language)}
      </Button>
    </div>
  );
};

export default EmptyState;
