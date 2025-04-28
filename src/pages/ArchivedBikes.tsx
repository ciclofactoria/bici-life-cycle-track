
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BikeCard from '@/components/BikeCard';
import BottomNav from '@/components/BottomNav';

interface ArchivedBike {
  id: string;
  name: string;
  type: string;
  year: number;
  image: string;
  totalSpent: number;
  lastMaintenance: string;
}

const ArchivedBikes = () => {
  const [bikes, setBikes] = useState<ArchivedBike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchArchivedBikes = async () => {
      try {
        const { data: archivedBikes, error } = await supabase
          .from('bikes')
          .select('*')
          .eq('archived', true);

        if (error) throw error;

        setBikes(archivedBikes || []);
      } catch (error) {
        console.error('Error fetching archived bikes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las bicicletas archivadas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedBikes();
  }, [toast]);

  const handleRestoreBike = async (bikeId: string) => {
    try {
      const { error } = await supabase
        .from('bikes')
        .update({ archived: false })
        .eq('id', bikeId);

      if (error) throw error;

      setBikes(bikes.filter(bike => bike.id !== bikeId));
      
      toast({
        title: "Bicicleta restaurada",
        description: "La bicicleta se ha restaurado correctamente",
      });
    } catch (error) {
      console.error('Error restoring bike:', error);
      toast({
        title: "Error",
        description: "No se pudo restaurar la bicicleta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/more')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-4">Bicicletas Archivadas</h1>
        </div>
      </div>

      <div className="bici-container pt-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : bikes.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay bicicletas archivadas</p>
        ) : (
          <div className="grid gap-4">
            {bikes.map((bike) => (
              <div key={bike.id} className="relative">
                <BikeCard
                  bike={bike}
                  onClick={() => navigate(`/bike/${bike.id}`)}
                />
                <Button
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white/90"
                  onClick={() => handleRestoreBike(bike.id)}
                >
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav activePage="/more" />
    </div>
  );
};

export default ArchivedBikes;
