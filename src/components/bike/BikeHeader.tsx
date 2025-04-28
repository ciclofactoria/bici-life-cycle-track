
import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface BikeHeaderProps {
  image: string;
  name: string;
  type: string;
  year: number;
  onBack: () => void;
  onEdit: () => void;
}

const BikeHeader = ({ image, name, type, year, onBack, onEdit }: BikeHeaderProps) => {
  return (
    <div className="relative aspect-video w-full">
      <img 
        src={image} 
        alt={name} 
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-start p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full"
            onClick={onEdit}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent pt-16 px-4 pb-4">
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-muted-foreground">{type}, {year}</p>
      </div>
    </div>
  );
};

export default BikeHeader;
