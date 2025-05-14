
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DatePickerInlineProps {
  id?: string;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}

export const DatePickerInline: React.FC<DatePickerInlineProps> = ({
  id,
  selected,
  onSelect,
  placeholder = "Pick a date",
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          type="button"
          variant="outline"
          className={`w-full justify-start text-left font-normal ${!selected ? "text-muted-foreground" : ""}`}
          id={id}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};
