
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ChartBar, Bike } from "lucide-react";

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

// Array of placeholder bike images to use when no image is available
const BIKE_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=60',
  'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=900&q=60'
];

const BikeCard = ({ bike }: { bike: BikeProps }) => {
  // Get a consistent but random-looking placeholder based on bike id
  const getPlaceholderImage = () => {
    if (bike.image) return bike.image;
    
    // Use a hash of the bike ID to pick a consistent image from the array
    const hash = bike.id.split('').reduce((a, b) => {
      return a + b.charCodeAt(0);
    }, 0);
    
    const index = hash % BIKE_PLACEHOLDER_IMAGES.length;
    return BIKE_PLACEHOLDER_IMAGES[index];
  };

  // Format distance in km with appropriate number formatting
  const formattedDistance = bike.total_distance ? 
    `${Math.floor(bike.total_distance / 1000).toLocaleString()} km` : 
    'N/A';

  return (
    <Card className="overflow-hidden mb-4 bg-card hover:bg-secondary transition-colors cursor-pointer animate-fade-in">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={getPlaceholderImage()} 
          alt={bike.name} 
          className="object-cover w-full h-full"
          onError={(e) => {
            // If image fails to load, use the first placeholder
            (e.target as HTMLImageElement).src = BIKE_PLACEHOLDER_IMAGES[0];
          }}
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
            <Bike className="h-5 w-5 text-orange-500 mb-1" />
            <p className="text-xs text-muted-foreground">Distancia</p>
            <p className="font-medium">{formattedDistance}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BikeCard;
