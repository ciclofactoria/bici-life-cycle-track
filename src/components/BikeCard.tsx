
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ChartBar, Bike } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

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

const BIKE_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=60',
  'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=900&q=60'
];

const BikeCard = ({ bike }: { bike: BikeProps }) => {
  const { language } = useLanguage();

  const getPlaceholderImage = () => {
    if (bike.image) return bike.image;
    const hash = bike.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const index = hash % BIKE_PLACEHOLDER_IMAGES.length;
    return BIKE_PLACEHOLDER_IMAGES[index];
  };

  // Formato consistente para la distancia - igual que en Strava
  const formatDistance = (distance?: number) => {
    if (!distance || distance === 0) {
      return language === "en" ? "N/A" : "No disponible";
    }
    
    // Convertir metros a kilómetros
    const km = distance / 1000;
    
    // Para valores grandes (más de 100 km), mostrar sin decimales
    if (km >= 100) {
      return `${Math.floor(km).toLocaleString()} km`;
    }
    // Para valores medianos (más de 10 km), mostrar con 1 decimal
    else if (km >= 10) {
      return `${km.toFixed(1)} km`;
    }
    // Para valores pequeños (menos de 10 km), mostrar con 2 decimales si es necesario
    else {
      // Si tiene decimales significativos, mostrar con precisión
      if (km % 1 !== 0) {
        return `${km.toFixed(2).replace(/\.?0+$/, '')} km`;
      } else {
        return `${Math.floor(km)} km`;
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = BIKE_PLACEHOLDER_IMAGES[0];
  };

  if (!bike || !bike.id) {
    console.error('BikeCard: Invalid bike data', bike);
    return null;
  }

  return (
    <Card className="overflow-hidden mb-4 bg-card hover:bg-secondary transition-colors cursor-pointer animate-fade-in">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={getPlaceholderImage()} 
          alt={bike.name || 'Bicicleta'} 
          className="object-cover w-full h-full"
          onError={handleImageError}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-white">{bike.name}</h3>
            {bike.strava_id && (
              <div className="ml-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center">
                <Bike className="h-3 w-3 mr-1" />
                {t('strava', language)}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-300">
            {bike.type}{bike.year ? `, ${bike.year}` : ''}
          </p>
        </div>
      </div>
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <ChartBar className="h-5 w-5 text-bicicare-green mb-1" />
            <p className="text-xs text-muted-foreground">{t("total_spent", language)}</p>
            <p className="font-medium">{bike.totalSpent || 0} €</p>
          </div>
          <div className="flex flex-col items-center">
            <Wrench className="h-5 w-5 text-bicicare-green mb-1" />
            <p className="text-xs text-muted-foreground">{t("last_service", language)}</p>
            <p className="font-medium">{bike.lastMaintenance || (language === "en" ? "N/A" : "No disponible")}</p>
          </div>
          <div className="flex flex-col items-center">
            <Bike className="h-5 w-5 text-orange-500 mb-1" />
            <p className="text-xs text-muted-foreground">{t("distance", language)}</p>
            <p className="font-medium">{formatDistance(bike.total_distance)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BikeCard;
