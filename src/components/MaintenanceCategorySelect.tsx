
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { maintenanceCategories } from "@/data/mockData";
import { Disc, Cog, Wrench } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, TranslationKey } from "@/utils/i18n";

interface MaintenanceCategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

// Function to get the appropriate icon for a category
const getCategoryIcon = (categoryName: string) => {
  switch (categoryName) {
    case "Ruedas":
    case "Wheels":
      return <Cog className="h-4 w-4 mr-2" />;
    case "Frenos":
    case "Brakes":
      return <Disc className="h-4 w-4 mr-2" />;
    case "Transmisión":
    case "Transmission":
      return <Cog className="h-4 w-4 mr-2" />;
    case "Dirección y suspensión":
    case "Steering and suspension":
      return <Wrench className="h-4 w-4 mr-2" />;
    case "Montaje y ajustes generales":
    case "Assembly and general adjustments":
      return <Wrench className="h-4 w-4 mr-2" />;
    default:
      return <Cog className="h-4 w-4 mr-2" />;
  }
};

const MaintenanceCategorySelect = ({
  value,
  onValueChange,
}: MaintenanceCategorySelectProps) => {
  const { language } = useLanguage();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("maintenance_type", language)} />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-lg z-50">
        <ScrollArea className="h-[280px] w-full">
          <div className="p-1">
            {maintenanceCategories.map((category) => (
              <SelectGroup key={category.name}>
                <SelectLabel className="flex items-center font-medium text-primary px-2 py-1.5 sticky top-0 bg-background">
                  {getCategoryIcon(category.name)}
                  {t(category.name as TranslationKey, language)}
                </SelectLabel>
                {category.types.map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type} 
                    className="pl-8 text-sm py-2 cursor-pointer hover:bg-accent focus:bg-accent"
                  >
                    {t(type as TranslationKey, language)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </div>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default MaintenanceCategorySelect;
