
import React from 'react';

interface BikeStatsProps {
  totalSpent: number;
  lastMaintenance: string;
}

const BikeStats = ({ totalSpent, lastMaintenance }: BikeStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 my-6 bg-card rounded-lg p-4">
      <div className="flex flex-col items-center">
        <p className="text-xs text-muted-foreground">Gasto Total</p>
        <p className="font-medium text-bicicare-green">${totalSpent}</p>
      </div>
      <div className="flex flex-col items-center">
        <p className="text-xs text-muted-foreground">Último Servicio</p>
        <p className="font-medium">{lastMaintenance}</p>
      </div>
    </div>
  );
};

export default BikeStats;
