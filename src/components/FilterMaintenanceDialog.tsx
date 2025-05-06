
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import type { MaintenanceProps } from '@/components/MaintenanceItem';
import { maintenanceCategories } from '@/data/mockData';

interface FilterMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: MaintenanceProps[];
}

const FilterMaintenanceDialog = ({ open, onOpenChange, maintenance }: FilterMaintenanceDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMaintenance, setFilteredMaintenance] = useState<MaintenanceProps[]>(maintenance);
  const [repairTypeSummary, setRepairTypeSummary] = useState<{
    type: string;
    category?: string;
    count: number;
    lastDate: string;
    totalCost: number;
  }[]>([]);
  
  // Get category for a type
  const getCategoryForType = (type: string): string => {
    for (const category of maintenanceCategories) {
      if (category.types.includes(type)) {
        return category.name;
      }
    }
    return "Personalizado";
  };
  
  // Filter and summarize maintenance by type
  useEffect(() => {
    // Apply search filter
    const filtered = maintenance.filter(item => 
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMaintenance(filtered);
    
    // Create summary by type
    const typeSummary: Record<string, {
      count: number;
      dates: string[];
      totalCost: number;
      category?: string;
    }> = {};
    
    filtered.forEach(item => {
      if (!typeSummary[item.type]) {
        typeSummary[item.type] = {
          count: 0,
          dates: [],
          totalCost: 0,
          category: getCategoryForType(item.type)
        };
      }
      typeSummary[item.type].count += 1;
      typeSummary[item.type].dates.push(item.date);
      typeSummary[item.type].totalCost += item.cost;
    });
    
    // Convert to array for display and find last date for each type
    const summaryArray = Object.keys(typeSummary).map(type => {
      // Sort dates in descending order to get the most recent
      const sortedDates = typeSummary[type].dates.sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });

      return {
        type,
        category: typeSummary[type].category,
        count: typeSummary[type].count,
        lastDate: sortedDates[0], // Most recent date
        totalCost: typeSummary[type].totalCost
      };
    });
    
    // Sort by count (most frequent first)
    summaryArray.sort((a, b) => b.count - a.count);
    
    setRepairTypeSummary(summaryArray);
  }, [maintenance, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Buscar por tipo de reparación</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipo de reparación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Reparación</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Último Servicio</TableHead>
                <TableHead className="text-right">Costo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairTypeSummary.length > 0 ? (
                repairTypeSummary.map((item) => (
                  <TableRow key={item.type}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.category || "Personalizado"}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{item.lastDate}</TableCell>
                    <TableCell className="text-right">${item.totalCost}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No se encontraron resultados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterMaintenanceDialog;
