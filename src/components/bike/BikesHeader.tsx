
import React from 'react';
import StravaRefreshButton from '@/components/StravaRefreshButton';

interface BikesHeaderProps {
  onRefreshComplete: () => void;
}

const BikesHeader: React.FC<BikesHeaderProps> = ({ onRefreshComplete }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Mis Bicicletas</h1>
      <div className="flex-shrink-0">
        <StravaRefreshButton onRefreshComplete={onRefreshComplete} />
      </div>
    </div>
  );
};

export default BikesHeader;
