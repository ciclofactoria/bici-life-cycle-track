import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PremiumStatus from '@/components/PremiumStatus';
import BottomNav from '@/components/BottomNav';
import { ActionCards } from '@/components/more/ActionCards';
import { StravaConnectCard } from '@/components/more/StravaConnectCard';
import { LogoutButton } from '@/components/more/LogoutButton';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const More = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="pb-24">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Más</h1>
        
        <PremiumStatus />
        
        <div className="space-y-4">
          <ActionCards />
          <StravaConnectCard />
          <LogoutButton />
          <Button
            variant="outline"
            className="w-full flex justify-between items-center mt-2"
            onClick={() => navigate("/settings")}
          >
            <span>Ajustes</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </Button>
        </div>
      </div>
      <BottomNav activePage="/more" />
    </div>
  );
};

export default More;
