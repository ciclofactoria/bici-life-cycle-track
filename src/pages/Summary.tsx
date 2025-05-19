
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";

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
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceSummary[]>([]);
  const [bikes, setBikes] = useState<BikeWithSpent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Include archived bikes
        const { data: bikesData, error: bikesError } = await supabase
          .from('bikes')
          .select('*')
          .in('archived', [false, true]);

        if (bikesError) throw bikesError;

        // Get all maintenance records
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance')
          .select('*');

        if (maintenanceError) throw maintenanceError;

        // Defensive filtering: only valid maintenance records
        const validMaintenanceData = maintenanceData ?? [];

        // Calculate total spent
        const total = validMaintenanceData.reduce((sum, record) => sum + (record.cost || 0), 0);
        setTotalSpent(total);

        // Group by type
        const typeSummary: Record<string, {count: number, totalCost: number}> = {};
        validMaintenanceData.forEach(record => {
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

        // Process bike data with total spent
        if (bikesData) {
          const bikeSpentMap: Record<string, number> = {};

          // Calculate total spent per bike
          validMaintenanceData.forEach(record => {
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
          title: t("error", language),
          description: t("summary_load_error", language),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, language]);

  // Filter maintenance types based on search query
  const filteredMaintenanceTypes = maintenanceTypes.filter(item =>
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">{t("summary_title", language)}</h1>

        {isLoading ? (
          <p className="text-center py-8">{t("loading", language)}</p>
        ) : (
          <>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium">{t("total_spent", language)}</h2>
                  <p className="text-2xl font-semibold text-bicicare-green">{totalSpent}€</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {bikes.length} {t("bikes", language)}, {maintenanceTypes.length} {t("maintenance_types", language)}
                </p>
              </CardContent>
            </Card>

            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">{t("by_bike", language)}</h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("bike", language)}</TableHead>
                      <TableHead>{t("type", language)}</TableHead>
                      <TableHead className="text-right">{t("expenses", language)}</TableHead>
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
                          {t("no_bikes_registered", language)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">{t("by_repair_type", language)}</h2>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("search_type", language)}
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
                      <TableHead>{t("repair_type", language)}</TableHead>
                      <TableHead className="text-right">{t("quantity", language)}</TableHead>
                      <TableHead className="text-right">{t("total_cost", language)}</TableHead>
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
                          {searchQuery ? t("no_results_found", language) : t("no_maintenance_records", language)}
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
