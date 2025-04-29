
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceProps } from '@/components/MaintenanceItem';

// Extender la interfaz de jsPDF con los métodos y propiedades que necesitamos
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
    // Define internal with a more permissive type that still includes the required properties
    internal: {
      events: any;
      scaleFactor: number;
      pageSize: { 
        width: number; 
        getWidth: () => number; 
        height: number; 
        getHeight: () => number; 
      };
      pages: number[];
      getEncryptor(objectId: number): (data: string) => string;
      getNumberOfPages?: () => number;
    };
  }
}

interface BikeInfo {
  name: string;
  type: string;
  year?: number;
  id?: string;
}

export const generateMaintenancePDF = (bike: BikeInfo, maintenance: MaintenanceProps[]) => {
  const doc = new jsPDF();
  
  // Add document title
  doc.setFontSize(20);
  doc.text(`Historial de Mantenimiento: ${bike.name}`, 14, 22);
  
  // Add bike info
  doc.setFontSize(12);
  doc.text(`Tipo: ${bike.type}`, 14, 32);
  doc.text(`Año: ${bike.year || 'N/A'}`, 14, 38);
  doc.text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 44);

  // Add total spent
  const totalSpent = maintenance.reduce((sum, record) => sum + (record.cost || 0), 0);
  doc.text(`Gasto Total: ${totalSpent}€`, 14, 50);

  // Table header and data
  const tableColumn = ["Fecha", "Tipo", "Costo", "Notas"];
  const tableRows = maintenance.map(record => [
    record.date,
    record.type,
    `${record.cost}€`,
    record.notes || '-'
  ]);

  // Create the table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: 'striped',
    headStyles: {
      fillColor: [51, 153, 102], // bicicare-green equivalent
      textColor: [255, 255, 255]
    },
    margin: { top: 60 }
  });
  
  // Add footer
  const pageCount = (doc.internal.pages || []).length - 1;
  
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text('BiciCare - Historial de Mantenimiento', 14, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 36, doc.internal.pageSize.height - 10);
  }

  // Save the PDF
  doc.save(`mantenimiento-${bike.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const generateFullMaintenancePDF = async (userId?: string) => {
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
    
    const doc = new jsPDF();
    
    // Título principal
    doc.setFontSize(22);
    doc.text("Historial de Mantenimiento Completo", 14, 22);
    
    // Fecha de generación
    doc.setFontSize(12);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 32);
    
    // Total de bicicletas
    doc.text(`Total bicicletas: ${bikes.length}`, 14, 38);
    
    // Calcular gasto total
    const totalGasto = allMaintenance 
      ? allMaintenance.reduce((sum, record) => sum + (record.cost || 0), 0)
      : 0;
    doc.text(`Gasto total en mantenimiento: ${totalGasto}€`, 14, 44);

    let yPosition = 60;
    
    // Para cada bicicleta, añadir su historial
    for (const bike of bikes) {
      // Si estamos en la última parte de la página, añadir nueva página
      if (yPosition > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Sección de la bicicleta
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPosition, doc.internal.pageSize.width - 28, 10, 'F');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`${bike.name} (${bike.type})`, 16, yPosition + 7);
      
      // Filtrar mantenimiento para esta bici
      const bikeMaintenance = allMaintenance
        ? allMaintenance.filter(m => m.bike_id === bike.id)
        : [];
        
      if (bikeMaintenance.length > 0) {
        // Datos para la tabla
        const tableData = bikeMaintenance.map(m => [
          format(new Date(m.date), 'dd/MM/yyyy'),
          m.type,
          `${m.cost}€`,
          m.notes || '-'
        ]);
        
        // Crear tabla
        doc.autoTable({
          head: [["Fecha", "Tipo", "Costo", "Notas"]],
          body: tableData,
          startY: yPosition + 15,
          theme: 'striped',
          headStyles: {
            fillColor: [51, 153, 102],
            textColor: [255, 255, 255]
          }
        });
        
        // Actualizar posición Y para la próxima bicicleta
        yPosition = doc.lastAutoTable.finalY + 20;
      } else {
        // Si no hay mantenimiento para esta bici
        doc.setFontSize(12);
        doc.text("No hay registros de mantenimiento", 16, yPosition + 20);
        yPosition += 30;
      }
    }
    
    // Añadir numeración de páginas
    const pageCount = (doc.internal.pages || []).length - 1;
                      
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text('BiciCare - Historial Completo', 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 36, doc.internal.pageSize.height - 10);
    }
    
    // Guardar el PDF
    doc.save("historial-completo-mantenimiento.pdf");
    
    return true;
  } catch (error) {
    console.error("Error generando PDF completo:", error);
    throw error;
  }
};

