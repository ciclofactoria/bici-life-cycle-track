
import React from 'react';
import BottomNav from '@/components/BottomNav';

const Calendar = () => {
  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Calendar</h1>
        <div className="bg-card rounded-lg p-4 text-center">
          <p className="text-muted-foreground">Calendar view coming soon</p>
        </div>
      </div>
      <BottomNav activePage="/calendar" />
    </div>
  );
};

export default Calendar;
