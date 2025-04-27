
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaintenanceItem, { MaintenanceProps } from '@/components/MaintenanceItem';
import FloatingActionButton from '@/components/FloatingActionButton';
import BottomNav from '@/components/BottomNav';
import { bikes, maintenanceLogs } from '@/data/mockData';
import EmptyState from '@/components/EmptyState';

const BikeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(bikes.find((b) => b.id === id));
  const [maintenance, setMaintenance] = useState<MaintenanceProps[]>([]);

  useEffect(() => {
    if (id) {
      const filteredLogs = maintenanceLogs
        .filter((log) => log.bikeId === id)
        .map((log) => ({ 
          id: log.id,
          date: log.date,
          type: log.type,
          cost: log.cost,
          notes: log.notes,
          hasReceipt: log.hasReceipt
        }));
      
      setMaintenance(filteredLogs);
    }
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const handleAddMaintenance = () => {
    // In a real app, this would navigate to an add maintenance form
    console.log('Add maintenance clicked');
  };

  if (!bike) {
    return <div>Bike not found</div>;
  }

  return (
    <div className="pb-16">
      <div className="relative aspect-video w-full">
        <img 
          src={bike.image} 
          alt={bike.name} 
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex justify-between items-start p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full"
              onClick={() => console.log('Edit bike settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent pt-16 px-4 pb-4">
          <h1 className="text-2xl font-bold">{bike.name}</h1>
          <p className="text-muted-foreground">{bike.type}, {bike.year}</p>
        </div>
      </div>
      
      <div className="bici-container">
        <div className="grid grid-cols-3 gap-2 my-6 bg-card rounded-lg p-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="font-medium text-bicicare-green">${bike.totalSpent}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Last Service</p>
            <p className="font-medium">{bike.lastMaintenance}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Next Check</p>
            <p className="font-medium">{bike.nextCheck}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">Maintenance History</h2>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 text-muted-foreground hover:text-bicicare-green"
            onClick={() => console.log('Export history')}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">Export</span>
          </Button>
        </div>
        
        {maintenance.length > 0 ? (
          <div className="space-y-3 pb-4">
            {maintenance.map((item) => (
              <MaintenanceItem key={item.id} maintenance={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No maintenance records"
            description="Add your first maintenance record to start tracking"
            actionLabel="Add Record"
            onAction={handleAddMaintenance}
          />
        )}
      </div>
      
      <FloatingActionButton onClick={handleAddMaintenance} label="Add Maintenance" />
      <BottomNav activePage="/" />
    </div>
  );
};

export default BikeDetail;
