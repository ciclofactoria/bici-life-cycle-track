
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { MaintenanceProps } from '@/components/MaintenanceItem';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface BikeInfo {
  name: string;
  type: string;
  year?: number;
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
  doc.text(`Gasto Total: $${totalSpent}`, 14, 50);

  // Table header and data
  const tableColumn = ["Fecha", "Tipo", "Costo", "Notas"];
  const tableRows = maintenance.map(record => [
    record.date,
    record.type,
    `$${record.cost}`,
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
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text('BiciCare - Historial de Mantenimiento', 14, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 36, doc.internal.pageSize.height - 10);
  }

  // Save the PDF
  doc.save(`mantenimiento-${bike.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};
