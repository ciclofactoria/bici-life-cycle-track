
import React from 'react';
import StravaRefreshButton from '@/components/strava/StravaRefreshButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

interface BikesHeaderProps {
  onRefreshComplete: () => void;
}

const BikesHeader: React.FC<BikesHeaderProps> = ({ onRefreshComplete }) => {
  const { language } = useLanguage();

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{t('my_bikes', language)}</h1>
      <div className="flex-shrink-0">
        <StravaRefreshButton onRefreshComplete={onRefreshComplete} />
      </div>
    </div>
  );
};

export default BikesHeader;
