
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BikeCard, { BikeProps } from '@/components/BikeCard';
import EmptyState from '@/components/EmptyState';
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import { bikes } from '@/data/mockData';

const Index = () => {
  const navigate = useNavigate();
  const [bikeData] = useState<BikeProps[]>(bikes);

  const handleAddBike = () => {
    // In a real app, this would navigate to an add bike form
    console.log('Add bike clicked');
  };

  const handleBikeClick = (bikeId: string) => {
    navigate(`/bike/${bikeId}`);
  };

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Bikes</h1>
        </div>
        
        {bikeData.length > 0 ? (
          <div>
            {bikeData.map((bike) => (
              <div key={bike.id} onClick={() => handleBikeClick(bike.id)}>
                <BikeCard bike={bike} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No bikes found"
            description="Add your first bike to start tracking maintenance"
            actionLabel="Add Bike"
            onAction={handleAddBike}
          />
        )}
      </div>
      
      <FloatingActionButton onClick={handleAddBike} label="Add Bike" />
      <BottomNav activePage="/" />
    </div>
  );
};

export default Index;
