
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BikeCard, { BikeProps } from '@/components/BikeCard';
import EmptyState from '@/components/EmptyState';
import BottomNav from '@/components/BottomNav';
import FloatingActionButton from '@/components/FloatingActionButton';
import AddBikeDialog from '@/components/AddBikeDialog';
import { bikes } from '@/data/mockData';

const Index = () => {
  const navigate = useNavigate();
  const [bikeData] = useState<BikeProps[]>(bikes);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddBike = () => {
    setIsAddDialogOpen(true);
  };

  const handleBikeClick = (bikeId: string) => {
    navigate(`/bike/${bikeId}`);
  };

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mis Bicicletas</h1>
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
            title="No se encontraron bicicletas"
            description="Agrega tu primera bicicleta para comenzar a registrar el mantenimiento"
            actionLabel="Agregar Bicicleta"
            onAction={handleAddBike}
          />
        )}
      </div>
      
      <FloatingActionButton onClick={handleAddBike} label="Agregar Bicicleta" />
      <AddBikeDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          // Here you would typically refresh the bikes list
          // This will be implemented when we connect to the real data
        }}
      />
      <BottomNav activePage="/" />
    </div>
  );
};

export default Index;
