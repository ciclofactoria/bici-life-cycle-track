
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

const PremiumBikeAlert: React.FC = () => {
  const { language } = useLanguage();
  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        {t("premium_bike_alert", language)}
      </AlertDescription>
    </Alert>
  );
};

export default PremiumBikeAlert;
