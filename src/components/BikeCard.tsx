
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ChartBar, CalendarClock } from "lucide-react";

export interface BikeProps {
  id: string;
  name: string;
  type: string;
  year?: number;
  image?: string;
  totalSpent?: number;
  lastMaintenance?: string;
  next_check_date?: string;
  strava_id?: string;
  total_distance?: number;
}

const BikeCard = ({ bike }: { bike: BikeProps }) => {
  return (
    <Card className="overflow-hidden mb-4 bg-card hover:bg-secondary transition-colors cursor-pointer animate-fade-in">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={bike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60'} 
          alt={bike.name} 
          className="object-cover w-full h-full"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-xl font-bold text-white">{bike.name}</h3>
          <p className="text-sm text-gray-300">
            {bike.type}
            {bike.year ? `, ${bike.year}` : ''}
            {bike.strava_id ? ' (Strava)' : ''}
          </p>
        </div>
      </div>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <ChartBar className="h-5 w-5 text-bicicare-green mb-1" />
            <p className="text-xs text-muted-foreground">Gasto Total</p>
            <p className="font-medium">{bike.totalSpent || 0} €</p>
          </div>
          <div className="flex flex-col items-center">
            <Wrench className="h-5 w-5 text-bicicare-green mb-1" />
            <p className="text-xs text-muted-foreground">Último Servicio</p>
            <p className="font-medium">{bike.lastMaintenance || 'N/A'}</p>
          </div>
          <div className="flex flex-col items-center">
            <CalendarClock className="h-5 w-5 text-bicicare-green mb-1" />
            <p className="text-xs text-muted-foreground">Próxima Cita</p>
            <p className="font-medium">{bike.next_check_date || 'No programada'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BikeCard;
