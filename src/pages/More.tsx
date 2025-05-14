
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PremiumStatus from '@/components/PremiumStatus';
import BottomNav from '@/components/BottomNav';
import { ActionCards } from '@/components/more/ActionCards';
import { StravaConnectCard } from '@/components/more/StravaConnectCard';
import { LogoutButton } from '@/components/more/LogoutButton';
import { SettingsCard } from '@/components/more/SettingsCard';

const More = () => {
  const { user } = useAuth();

  return (
    <div className="pb-24">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Más</h1>

        <PremiumStatus />

        <div className="space-y-4">
          <ActionCards />
          <StravaConnectCard />
          <SettingsCard />
          <LogoutButton />
        </div>
      </div>
      <BottomNav activePage="/more" />
    </div>
  );
};

export default More;
