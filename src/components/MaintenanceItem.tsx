
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileImage, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface MaintenanceProps {
  id: string;
  date: string;
  type: string;
  cost: number;
  notes?: string;
  hasReceipt: boolean;
  distance_at_maintenance?: number;
}

const MaintenanceItem = ({ maintenance }: { maintenance: MaintenanceProps }) => {
  // Format distance in kilometers if available
  const formattedDistance = maintenance.distance_at_maintenance 
    ? `${Math.round(maintenance.distance_at_maintenance / 1000)} km` 
    : null;

  return (
    <Card className="mb-3 bg-card border-border hover:border-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{maintenance.date}</p>
            <h4 className="font-medium text-lg">{maintenance.type}</h4>
            {maintenance.notes && (
              <p className="text-sm mt-1 text-muted-foreground">{maintenance.notes}</p>
            )}
            {formattedDistance && (
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <Bike className="h-3 w-3 mr-1" />
                {formattedDistance}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-bicicare-green font-medium">{maintenance.cost} €</p>
            {maintenance.hasReceipt && (
              <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground">
                <FileImage className="h-3 w-3 mr-1" />
                Factura
              </div>
            )}
          </div>
        </div>
        <div className="mt-3">
          <Badge variant="outline" className="bg-muted text-xs">
            {maintenance.type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceItem;
