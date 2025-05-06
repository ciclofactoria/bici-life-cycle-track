
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

interface MaintenanceCategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const MaintenanceCategorySelect = ({ value, onValueChange }: MaintenanceCategorySelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona el tipo" />
      </SelectTrigger>
      <SelectContent>
        {maintenanceCategories.map((category) => (
          <SelectGroup key={category.name}>
            <SelectLabel>{category.name}</SelectLabel>
            {category.types.map((type) => (
              <SelectItem key={type} value={type}>
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
