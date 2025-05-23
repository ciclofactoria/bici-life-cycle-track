
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BikeSettings } from "./BikeSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";

interface BikeHeaderProps {
  image: string;
  name: string;
  type: string;
  year: number;
  onBack: () => void;
  onEdit: () => void;
  bikeId: string;
}

const BikeHeader = ({
  image,
  name,
  type,
  year,
  onBack,
  onEdit,
  bikeId
}: BikeHeaderProps) => {
  const { language } = useLanguage();
  
  return (
    <div className="relative">
      <div className="h-48 bg-gray-200">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        <Button
          variant="secondary"
          size="icon"
          className="bg-secondary/90 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="bg-secondary/90 hover:bg-secondary"
            onClick={onEdit}
          >
            {t("edit", language)}
          </Button>
          <div className="bg-secondary/90 hover:bg-secondary rounded-md">
            <BikeSettings bikeId={bikeId} />
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-background border-b">
        <h1 className="text-2xl font-bold mb-1">{name}</h1>
        <p className="text-muted-foreground">
          {type} • {year}
        </p>
      </div>
    </div>
  );
};

export default BikeHeader;
