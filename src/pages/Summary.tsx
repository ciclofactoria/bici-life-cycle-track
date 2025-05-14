
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MaintenanceSummary {
  type: string;
  count: number;
  totalCost: number;
}

interface BikeWithSpent {
  id: string;
  name: string;
  type: string;
  totalSpent: number;
}

const Summary = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceSummary[]>([]);
  const [bikes, setBikes] = useState<BikeWithSpent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Incluir bicis archivadas también
        const { data: bikesData, error: bikesError } = await supabase
          .from('bikes')
          .select('*')
          .in('archived', [false, true]); // incluir archivadas y activas
        
        if (bikesError) throw bikesError;

        // Solo considerar mantenimientos NO eliminados (por ejemplo, donde deleted !== true/null o no existe el flag)
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance')
          .select('*')
          .is('deleted', null); // Asume columna "deleted", filtra los borrados lógicos

        if (maintenanceError) throw maintenanceError;
        
        // Process maintenance data
        if (maintenanceData && maintenanceData.length > 0) {
          // Calculate total spent
          const total = maintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
          setTotalSpent(total);
          
          // Group by type
          const typeSummary: Record<string, {count: number, totalCost: number}> = {};
          
          maintenanceData.forEach(record => {
            if (!typeSummary[record.type]) {
              typeSummary[record.type] = {count: 0, totalCost: 0};
            }
            typeSummary[record.type].count += 1;
            typeSummary[record.type].totalCost += record.cost || 0;
          });
          
          // Convert to array for display
          const summaryArray = Object.keys(typeSummary).map(type => ({
            type,
            count: typeSummary[type].count,
            totalCost: typeSummary[type].totalCost
          }));
          
          // Sort by count (most frequent first)
          summaryArray.sort((a, b) => b.count - a.count);
          
          setMaintenanceTypes(summaryArray);
        }
        
        // Process bike data with total spent
        if (bikesData && maintenanceData) {
          const bikeSpentMap: Record<string, number> = {};
          
          // Calculate total spent per bike
          maintenanceData.forEach(record => {
            if (!bikeSpentMap[record.bike_id]) {
              bikeSpentMap[record.bike_id] = 0;
            }
            bikeSpentMap[record.bike_id] += record.cost || 0;
          });
          
          // Map bikes with their total spent
          const bikesWithSpent = bikesData.map(bike => ({
            id: bike.id,
            name: bike.name,
            type: bike.type,
            totalSpent: bikeSpentMap[bike.id] || 0
          }));
          
          // Sort by total spent (highest first)
          bikesWithSpent.sort((a, b) => b.totalSpent - a.totalSpent);
          
          setBikes(bikesWithSpent);
        }
      } catch (error) {
        console.error('Error fetching summary data:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el resumen",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Filter maintenance types based on search query
  const filteredMaintenanceTypes = maintenanceTypes.filter(item => 
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24"> {/* Increased bottom padding from pb-16 to pb-24 */}
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Resumen de Gastos</h1>
        
        {isLoading ? (
          <p className="text-center py-8">Cargando datos...</p>
        ) : (
          <>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium">Total Gastado</h2>
                  <p className="text-2xl font-semibold text-bicicare-green">{totalSpent}€</p>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {bikes.length} bicicletas, {maintenanceTypes.length} tipos de mantenimiento
                </p>
              </CardContent>
            </Card>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">Por Bicicleta</h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bicicleta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Gasto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bikes.length > 0 ? (
                      bikes.map((bike) => (
                        <TableRow key={bike.id}>
                          <TableCell className="font-medium">{bike.name}</TableCell>
                          <TableCell>{bike.type}</TableCell>
                          <TableCell className="text-right">{bike.totalSpent}€</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No hay bicicletas registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Por Tipo de Reparación</h2>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Reparación</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Costo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenanceTypes.length > 0 ? (
                      filteredMaintenanceTypes.map((item) => (
                        <TableRow key={item.type}>
                          <TableCell className="font-medium">{item.type}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">{item.totalCost}€</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          {searchQuery ? 'No se encontraron resultados' : 'No hay registros de mantenimiento'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav activePage="/summary" />
    </div>
  );
};

export default Summary;
