
import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { maintenanceCategories } from '@/data/mockData';
import { Disc, Cog, Wrench } from 'lucide-react';

interface MaintenanceCategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

// Function to get the appropriate icon for a category
const getCategoryIcon = (categoryName: string) => {
  switch (categoryName) {
    case 'Ruedas':
      return <Cog className="h-4 w-4 mr-2" />; // Changed from Bicycle to Cog
    case 'Frenos':
      return <Disc className="h-4 w-4 mr-2" />;
    case 'Transmisión':
      return <Cog className="h-4 w-4 mr-2" />;
    case 'Dirección y suspensión':
      return <Wrench className="h-4 w-4 mr-2" />;
    default:
      return <Cog className="h-4 w-4 mr-2" />;
  }
};

const MaintenanceCategorySelect = ({ value, onValueChange }: MaintenanceCategorySelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona el tipo" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {maintenanceCategories.map((category) => (
          <SelectGroup key={category.name}>
            <SelectLabel className="flex items-center font-medium text-primary">
              {getCategoryIcon(category.name)}
              {category.name}
            </SelectLabel>
            {category.types.map((type) => (
              <SelectItem key={type} value={type} className="pl-8 text-sm">
                {type}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MaintenanceCategorySelect;
