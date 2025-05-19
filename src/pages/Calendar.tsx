
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { AppointmentsList } from '@/components/calendar/AppointmentsList';
import { AlertsList } from '@/components/calendar/AlertsList';
import { DayEvents } from '@/components/calendar/DayEvents';
import { BikeSelector } from '@/components/calendar/BikeSelector';

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [bikes, setBikes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  
  const locale = language === 'es' ? es : enUS;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch bikes
      const { data: bikesData, error: bikesError } = await supabase
        .from('bikes')
        .select('*')
        .eq('archived', false);
      
      if (bikesError) {
        console.error('Error fetching bikes:', bikesError);
      } else {
        setBikes(bikesData || []);
        
        // Set first bike as default if there are any bikes
        if (bikesData && bikesData.length > 0 && !selectedBikeId) {
          setSelectedBikeId(bikesData[0].id);
        }
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBikeId) {
      fetchAppointmentsAndAlerts();
    }
  }, [selectedBikeId]);

  const fetchAppointmentsAndAlerts = async () => {
    // Fetch appointments for the selected bike
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*, bikes(*)')
      .eq('bike_id', selectedBikeId);
    
    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
    } else {
      setAppointments(appointmentsData || []);
    }
    
    // Fetch alerts for the selected bike
    const { data: alertsData, error: alertsError } = await supabase
      .from('maintenance_alerts')
      .select('*, bikes(*)')
      .eq('bike_id', selectedBikeId)
      .eq('is_active', true);
    
    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
    } else {
      setAlerts(alertsData || []);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // Get events for the selected day
  const getDayEvents = () => {
    if (!date) return [];
    
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    
    return appointments
      .filter(appt => appt.date === selectedDateStr)
      .map(appt => ({
        ...appt,
        type: 'appointment',
        formattedDate: formatDate(appt.date),
        bikeName: appt.bikes?.name || t("unknown_bike", language)
      }));
  };

  const dayEvents = getDayEvents();

  return (
    <div className="pb-24">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">{t("calendar", language)}</h1>

        {isLoading ? (
          <div className="py-8 text-center">{t("loading", language)}</div>
        ) : bikes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-2">{t("no_bikes", language)}</p>
            <p className="text-sm text-muted-foreground">{t("create_bike_first", language)}</p>
          </div>
        ) : (
          <>
            <BikeSelector 
              bikes={bikes} 
              selectedBikeId={selectedBikeId} 
              setSelectedBikeId={setSelectedBikeId} 
            />

            <Card className="p-2 mb-6">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="mx-auto"
              />
            </Card>

            <DayEvents 
              date={date} 
              events={dayEvents} 
            />

            <Tabs defaultValue="appointments" className="mt-6">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="appointments">{t("appointment", language)}</TabsTrigger>
                <TabsTrigger value="alerts">{t("alerts", language)}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="appointments">
                <AppointmentsList 
                  appointments={appointments}
                  formatDate={formatDate}
                />
              </TabsContent>
              
              <TabsContent value="alerts">
                <AlertsList 
                  alerts={alerts}
                  selectedBikeId={selectedBikeId}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      <BottomNav activePage="/calendar" />
    </div>
  );
};

export default Calendar;
