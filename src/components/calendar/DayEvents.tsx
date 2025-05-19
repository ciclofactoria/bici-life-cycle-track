
import React from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

interface Event {
  id: string;
  type: string;
  description: string;
  formattedDate: string;
  bikeName: string;
}

interface DayEventsProps {
  date: Date | undefined;
  events: Event[];
}

export const DayEvents: React.FC<DayEventsProps> = ({ date, events }) => {
  const { language } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  if (!date) return null;

  const formattedDate = format(date, 'PPP', { locale });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{formattedDate}</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="p-2 border rounded-md">
                <p className="font-medium">{event.description}</p>
                <p className="text-sm text-muted-foreground">{event.bikeName}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-2">{t("no_events_for_day", language)}</p>
        )}
      </CardContent>
    </Card>
  );
};
