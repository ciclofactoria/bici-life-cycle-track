
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceProps } from '@/components/MaintenanceItem';

interface BikeInfo {
  name: string;
  type: string;
  year?: number;
  id?: string;
}

export const generateMaintenanceExcel = (bike: BikeInfo, maintenance: MaintenanceProps[]) => {
  // Create worksheet data
  const wsData = [
    ['Historial de Mantenimiento', bike.name],
    ['Tipo', bike.type],
    ['Año', bike.year || 'N/A'],
    ['Fecha de exportación', format(new Date(), 'dd/MM/yyyy')],
    [],
    ['Fecha', 'Tipo', 'Costo', 'Notas']
  ];
  
  // Calculate total spent
  const totalSpent = maintenance.reduce((sum, record) => sum + (record.cost || 0), 0);
  wsData.push(['Gasto Total', `${totalSpent}€`, '', '']);
  wsData.push([]);
  
  // Add maintenance records
  maintenance.forEach(record => {
    wsData.push([
      record.date,
      record.type,
      `${record.cost}€`,
      record.notes || '-'
    ]);
  });
  
  // Create workbook and sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Apply some styling through cell formatting
  if (!ws['!cols']) ws['!cols'] = [];
  ws['!cols'][0] = { wch: 15 }; // Date column width
  ws['!cols'][1] = { wch: 25 }; // Type column width
  ws['!cols'][2] = { wch: 10 }; // Cost column width
  ws['!cols'][3] = { wch: 40 }; // Notes column width
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Mantenimiento');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `mantenimiento-${bike.name.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

export const generateFullMaintenanceExcel = async (userId?: string) => {
  try {
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }
    
    // Obtener todas las bicicletas del usuario
    const { data: bikes, error: bikesError } = await supabase
      .from('bikes')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('name');
      
    if (bikesError) throw bikesError;
    if (!bikes || bikes.length === 0) {
      throw new Error("No se encontraron bicicletas");
    }
    
    // Obtener todo el mantenimiento para esas bicicletas
    const { data: allMaintenance, error: maintenanceError } = await supabase
      .from('maintenance')
      .select('*')
      .in('bike_id', bikes.map(bike => bike.id))
      .order('date', { ascending: false });
      
    if (maintenanceError) throw maintenanceError;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create summary sheet
    const summaryData = [
      ['Historial de Mantenimiento Completo'],
      ['Generado el', format(new Date(), 'dd/MM/yyyy')],
      ['Total bicicletas', bikes.length.toString()],
      []
    ];
    
    // Calculate total maintenance cost
    const totalGasto = allMaintenance 
      ? allMaintenance.reduce((sum, record) => sum + (record.cost || 0), 0)
      : 0;
    summaryData.push(['Gasto total en mantenimiento', `${totalGasto}€`]);
    summaryData.push([]);
    
    // Add summary sheet
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen');
    
    // For each bike, create a worksheet
    for (const bike of bikes) {
      // Filter maintenance records for this bike
      const bikeMaintenance = allMaintenance
        ? allMaintenance.filter(m => m.bike_id === bike.id)
        : [];
      
      if (bikeMaintenance.length > 0) {
        // Create sheet data
        const bikeSheetData = [
          [bike.name, bike.type],
          [],
          ['Fecha', 'Tipo', 'Costo', 'Notas']
        ];
        
        // Add maintenance records
        bikeMaintenance.forEach(m => {
          bikeSheetData.push([
            format(new Date(m.date), 'dd/MM/yyyy'),
            m.type,
            `${m.cost}€`,
            m.notes || '-'
          ]);
        });
        
        // Calculate bike total cost
        const bikeTotal = bikeMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
        bikeSheetData.push([]);
        bikeSheetData.push(['Total', '', `${bikeTotal}€`, '']);
        
        // Create worksheet and add to workbook
        const ws = XLSX.utils.aoa_to_sheet(bikeSheetData);
        
        // Apply some styling
        if (!ws['!cols']) ws['!cols'] = [];
        ws['!cols'][0] = { wch: 15 }; // Date column width
        ws['!cols'][1] = { wch: 25 }; // Type column width
        ws['!cols'][2] = { wch: 10 }; // Cost column width
        ws['!cols'][3] = { wch: 40 }; // Notes column width
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, bike.name.substring(0, 30)); // Max 31 chars for sheet name
      } else {
        // Create empty sheet for bikes with no maintenance
        const emptySheet = XLSX.utils.aoa_to_sheet([
          [bike.name, bike.type],
          [],
          ['No hay registros de mantenimiento para esta bicicleta']
        ]);
        XLSX.utils.book_append_sheet(wb, emptySheet, bike.name.substring(0, 30));
      }
    }
    
    // Save Excel file
    XLSX.writeFile(wb, "historial-completo-mantenimiento.xlsx");
    
    return true;
  } catch (error) {
    console.error("Error generando Excel completo:", error);
    throw error;
  }
};
