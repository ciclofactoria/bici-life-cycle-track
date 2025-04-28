
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ChartBar, CalendarClock, Bike } from "lucide-react";

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
  // Formato para mostrar la distancia en km con 2 decimales
  const formattedDistance = bike.total_distance ? 
    `${(bike.total_distance / 1000).toFixed(0)} km` : 
    'N/A';

  return (
    <Card className="overflow-hidden mb-4 bg-card hover:bg-secondary transition-colors cursor-pointer animate-fade-in">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={bike.image || 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60'} 
          alt={bike.name} 
          className="object-cover w-full h-full"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-white">{bike.name}</h3>
            {bike.strava_id && (
              <div className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center">
                <Bike className="h-3 w-3 mr-1" />
                Strava
              </div>
            )}
          </div>
          <p className="text-sm text-gray-300">
            {bike.type}
            {bike.year ? `, ${bike.year}` : ''}
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
            {bike.strava_id ? (
              <>
                <Bike className="h-5 w-5 text-orange-500 mb-1" />
                <p className="text-xs text-muted-foreground">Distancia</p>
                <p className="font-medium">{formattedDistance}</p>
              </>
            ) : (
              <>
                <CalendarClock className="h-5 w-5 text-bicicare-green mb-1" />
                <p className="text-xs text-muted-foreground">Próxima Cita</p>
                <p className="font-medium">{bike.next_check_date || 'No programada'}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BikeCard;
