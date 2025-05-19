import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BikeList from '@/components/BikeList';
import StravaRefreshButton from '@/components/strava/StravaRefreshButton';

const Index: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [bikes, setBikes] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const formattedDate = selectedDate ? format(selectedDate, "PPP", { locale: language === 'es' ? require('date-fns/locale/es') : undefined }) : '';

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
          <h1 className="text-2xl font-bold text-gray-800">{t('my_bikes')}</h1>
          <p className="text-gray-600">{t('welcome_message')}</p>
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
                {formattedDate ? formattedDate : t('pick_date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={language === 'es' ? 'es' : 'en'}
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
          bikes={bikes}
          onBikeUpdated={handleBikeUpdated}
          onBikeDeleted={handleBikeDeleted}
        />
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{t('no_bikes_yet')}</CardTitle>
            <CardDescription>{t('add_your_first_bike')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('you_can_add_bikes_manually')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
