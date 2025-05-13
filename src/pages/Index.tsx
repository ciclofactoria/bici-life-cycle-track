
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

  const handleAddBike = () => {
    // Si el usuario no es premium y ya tiene una bicicleta, mostrar mensaje
    if (!isPremium && bikeData.length >= 1) {
      toast({
        title: "Función premium",
        description: "Solo los usuarios premium pueden registrar más de una bicicleta",
        variant: "destructive"
      });
      return;
    }
    
    setIsAddDialogOpen(true);
  };

  return (
    <div className="pb-28"> {/* Increased bottom padding for more space */}
      <div className="bici-container pt-6">
        <BikesHeader onRefreshComplete={fetchBikes} />
        
        {/* Only show premium alert if user is NOT premium and has at least one bike */}
        {!isPremium && bikeData.length >= 1 && <PremiumBikeAlert />}
        
        <BikeList 
          bikeData={bikeData}
          isLoading={isLoading}
          isPremium={isPremium}
          onAddBike={handleAddBike}
        />
      </div>
      
      <FloatingActionButton onClick={handleAddBike} label="Agregar Bicicleta" />
      <AddBikeDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchBikes}
      />
      <BottomNav activePage="/" />
      
      {/* Only show downgrade dialog if user is not premium and has more than one bike */}
      {userId && showDowngradeDialog && (
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
