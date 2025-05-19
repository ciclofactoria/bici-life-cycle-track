
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

interface BikeInterface {
  id: string;
  name: string;
}

interface BikeSelectorProps {
  bikes: BikeInterface[];
  selectedBikeId: string | null;
  setSelectedBikeId: (id: string) => void;
}

export const BikeSelector: React.FC<BikeSelectorProps> = ({ bikes, selectedBikeId, setSelectedBikeId }) => {
  const { language } = useLanguage();

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{t("bike", language)}:</label>
      <Select
        value={selectedBikeId || ''}
        onValueChange={(value) => setSelectedBikeId(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("select_bike", language)} />
        </SelectTrigger>
        <SelectContent>
          {bikes.map((bike) => (
            <SelectItem key={bike.id} value={bike.id}>
              {bike.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
