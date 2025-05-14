
import React, { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import AddBikeDialog from '@/components/AddBikeDialog';
import PremiumDowngradeDialog from '@/components/PremiumDowngradeDialog';
import { useToast } from '@/hooks/use-toast';
import { useBikes } from '@/hooks/useBikes';
import BikeList from '@/components/bike/BikeList';
import PremiumBikeAlert from '@/components/bike/PremiumBikeAlert';
import BikesHeader from '@/components/bike/BikesHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

const Index = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { 
    bikeData, 
    isLoading, 
    userId, 
    isPremium, 
    showDowngradeDialog, 
    setShowDowngradeDialog, 
    fetchBikes 
  } = useBikes();
  const { language } = useLanguage();

  const handleAddBike = () => {
    if (!isPremium && bikeData.length >= 1) {
      toast({
        title: t("premium", language),
        description: t("Only premium users can register more than one bike.", language),
        variant: "destructive"
      });
      return;
    }
    setIsAddDialogOpen(true);
  };

  return (
    <div className="pb-28">
      <div className="bici-container pt-6">
        <BikesHeader onRefreshComplete={fetchBikes} />
        {!isPremium && bikeData.length >= 1 && <PremiumBikeAlert />}
        <BikeList 
          bikeData={bikeData}
          isLoading={isLoading}
          isPremium={isPremium}
          onAddBike={handleAddBike}
        />
      </div>
      <FloatingActionButton onClick={handleAddBike} label={t("add_bike", language)} />
      <AddBikeDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchBikes}
      />
      <BottomNav activePage="/" />
      {userId && showDowngradeDialog && !isPremium && (
        <PremiumDowngradeDialog 
          open={showDowngradeDialog} 
          onOpenChange={setShowDowngradeDialog}
          userId={userId}
        />
      )}
    </div>
  );
};

export default Index;
