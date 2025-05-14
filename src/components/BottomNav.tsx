import React from 'react';
import { Link } from 'react-router-dom';
import { Bike, Calendar, ChartBar, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

interface NavItem {
  icon: React.ElementType;
  label: string;
  labelKey: string;
  route: string;
}

const BottomNav = ({ activePage }: { activePage: string }) => {
  const { language } = useLanguage();

  const navItems: NavItem[] = [
    {
      icon: Bike,
      label: t('bikes', language),
      labelKey: 'bikes',
      route: '/'
    },
    {
      icon: Calendar,
      label: t('maintenance_plan', language),
      labelKey: 'maintenance_plan',
      route: '/calendar'
    },
    {
      icon: ChartBar,
      label: t('summary', language),
      labelKey: 'summary',
      route: '/summary'
    },
    {
      icon: MoreHorizontal,
      label: t('more_title', language),
      labelKey: 'more_title',
      route: '/more'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.route}
            to={item.route}
            className={`flex flex-col items-center py-3 px-2 flex-1 ${
              activePage === item.route
                ? 'text-bicicare-green'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
