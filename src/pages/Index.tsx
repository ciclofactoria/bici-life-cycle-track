
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale'; // Import Spanish locale from date-fns
import { DayPicker } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BikeList from '@/components/bike/BikeList';
import StravaRefreshButton from '@/components/strava/StravaRefreshButton';

const Index: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [bikes, setBikes] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const formattedDate = selectedDate ? format(selectedDate, "PPP", { locale: language === 'es' ? es : undefined }) : '';

  useEffect(() => {
    if (!user) {
      console.log("No user found, redirecting to /auth");
      navigate('/auth');
      return;
    }

    const fetchBikes = async () => {
      try {
        const { data, error } = await supabase
          .from('bikes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching bikes:", error);
          return;
        }

        setBikes(data || []);
      } catch (error) {
        console.error("Unexpected error fetching bikes:", error);
      }
    };

    fetchBikes();
  }, [user, navigate]);

  const handleBikeAdded = (newBike: any) => {
    setBikes(prevBikes => [newBike, ...prevBikes]);
  };

  const handleBikeUpdated = (updatedBike: any) => {
    setBikes(prevBikes =>
      prevBikes.map(bike => (bike.id === updatedBike.id ? updatedBike : bike))
    );
  };

  const handleBikeDeleted = (deletedBikeId: string) => {
    setBikes(prevBikes =>
      prevBikes.filter(bike => bike.id !== deletedBikeId)
    );
  };

  const handleRefreshComplete = () => {
    // After refresh, re-fetch bikes
    const fetchBikes = async () => {
      try {
        const { data, error } = await supabase
          .from('bikes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching bikes:", error);
          return;
        }

        setBikes(data || []);
      } catch (error) {
        console.error("Unexpected error fetching bikes:", error);
      }
    };

    fetchBikes();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {language === "en" ? "My Bikes" : "Mis Bicicletas"}
          </h1>
          <p className="text-gray-600">
            {language === "en" ? "Welcome to your bike dashboard" : "Bienvenido a tu panel de bicicletas"}
          </p>
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formattedDate ? formattedDate : (language === 'en' ? "Pick a date" : "Seleccionar fecha")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={language === 'es' ? es : undefined}
                showOutsideDays
                className="border-0 shadow-sm rounded-lg"
              />
            </PopoverContent>
          </Popover>

          <StravaRefreshButton onRefreshComplete={handleRefreshComplete} />
        </div>
      </div>

      {bikes.length > 0 ? (
        <BikeList
          bikeData={bikes}
          isLoading={false}
          isPremium={true}
          onAddBike={() => {}}
        />
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{language === "en" ? "No bikes yet" : "No hay bicicletas aún"}</CardTitle>
            <CardDescription>{language === "en" ? "Add your first bike" : "Añade tu primera bicicleta"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{language === "en" ? "You can add bikes manually" : "Puedes añadir bicicletas manualmente"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
