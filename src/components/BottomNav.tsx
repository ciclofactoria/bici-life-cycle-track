
import React from 'react';
import { Link } from 'react-router-dom';
import { Bike, Calendar, ChartBar, MoreHorizontal } from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  route: string;
}

const BottomNav = ({ activePage }: { activePage: string }) => {
  const navItems: NavItem[] = [
    {
      icon: Bike,
      label: 'Bikes',
      route: '/'
    },
    {
      icon: Calendar,
      label: 'Calendar',
      route: '/calendar'
    },
    {
      icon: ChartBar,
      label: 'Summary',
      route: '/summary'
    },
    {
      icon: MoreHorizontal,
      label: 'More',
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
