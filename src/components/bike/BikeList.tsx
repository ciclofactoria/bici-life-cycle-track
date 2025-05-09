
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BikeCard, { BikeProps } from '@/components/BikeCard';
import EmptyState from '@/components/EmptyState';

interface BikeListProps {
  bikeData: BikeProps[];
  isLoading: boolean;
  isPremium: boolean;
  onAddBike: () => void;
}

const BikeList: React.FC<BikeListProps> = ({ 
  bikeData, 
  isLoading, 
  isPremium,
  onAddBike 
}) => {
  const navigate = useNavigate();

  const handleBikeClick = (bikeId: string) => {
    navigate(`/bike/${bikeId}`);
  };

  if (isLoading) {
    return <p className="text-center py-8">Cargando bicicletas...</p>;
  }

  if (bikeData.length === 0) {
    return (
      <EmptyState
        title="No se encontraron bicicletas"
        description="Agrega tu primera bicicleta para comenzar a registrar el mantenimiento"
        actionLabel="Agregar Bicicleta"
        onAction={onAddBike}
      />
    );
  }

  return (
    <div>
      {bikeData.map((bike) => (
        <div key={bike.id} onClick={() => handleBikeClick(bike.id)} className="cursor-pointer">
          <BikeCard bike={bike} />
        </div>
      ))}
    </div>
  );
};

export default BikeList;
