export interface Bike {
  id: string;
  name: string;
  type: string;
  year: number;
  image: string;
  totalSpent: number;
  lastMaintenance: string;
  nextCheck: string;
}

export interface Maintenance {
  id: string;
  bikeId: string;
  date: string;
  type: string;
  cost: number;
  notes?: string;
  hasReceipt: boolean;
}

export const bikes: Bike[] = [
  {
    id: '1',
    name: 'Road Master',
    type: 'Road Bike',
    year: 2021,
    image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=900&q=60',
    totalSpent: 450,
    lastMaintenance: 'Mar 15',
    nextCheck: 'Jun 15'
  },
  {
    id: '2',
    name: 'Trail Blazer',
    type: 'Mountain Bike',
    year: 2020,
    image: 'https://images.unsplash.com/photo-1599056407101-7c557a4a0144?auto=format&fit=crop&w=900&q=60',
    totalSpent: 320,
    lastMaintenance: 'Apr 02',
    nextCheck: 'Jul 02'
  },
  {
    id: '3',
    name: 'City Cruiser',
    type: 'Urban Bike',
    year: 2022,
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
    totalSpent: 180,
    lastMaintenance: 'May 10',
    nextCheck: 'Aug 10'
  }
];

export const maintenanceLogs: Maintenance[] = [
  {
    id: '1',
    bikeId: '1',
    date: 'Mar 15, 2023',
    type: 'Brake Replacement',
    cost: 120,
    notes: 'Replaced both front and rear brake pads',
    hasReceipt: true
  },
  {
    id: '2',
    bikeId: '1',
    date: 'Jan 22, 2023',
    type: 'Chain Lubrication',
    cost: 30,
    hasReceipt: false
  },
  {
    id: '3',
    bikeId: '1',
    date: 'Dec 10, 2022',
    type: 'Full Tune-up',
    cost: 300,
    notes: 'Annual service including derailleur adjustment',
    hasReceipt: true
  },
  {
    id: '4',
    bikeId: '2',
    date: 'Apr 02, 2023',
    type: 'Tire Replacement',
    cost: 180,
    notes: 'Replaced both tires with all-terrain model',
    hasReceipt: true
  },
  {
    id: '5',
    bikeId: '2',
    date: 'Feb 14, 2023',
    type: 'Suspension Service',
    cost: 140,
    hasReceipt: true
  },
  {
    id: '6',
    bikeId: '3',
    date: 'May 10, 2023',
    type: 'Basic Tune-up',
    cost: 80,
    notes: 'Basic tune-up and safety check',
    hasReceipt: false
  },
  {
    id: '7',
    bikeId: '3',
    date: 'Mar 05, 2023',
    type: 'Light Installation',
    cost: 100,
    notes: 'Installed front and rear lights',
    hasReceipt: true
  }
];

export const maintenanceCategories = [
  {
    name: 'Ruedas',
    types: [
      'Centrado de rueda delantera',
      'Centrado de rueda trasera',
      'Sustitución de cámara',
      'Sustitución de cubierta',
      'Instalación de sistema tubeless',
      'Reparación de pinchazo tubeless',
      'Sustitución de válvula tubeless',
      'Rodamientos rueda delantera',
      'Rodamientos rueda trasera',
      'Sustitución eje delantero',
      'Sustitución eje trasero',
    ]
  },
  {
    name: 'Frenos',
    types: [
      'Purgado freno delantero',
      'Purgado freno trasero',
      'Sustitución de pastillas',
      'Cambio de disco',
      'Ajuste de freno delantero',
      'Ajuste de freno trasero',
      'Sustitución de zapatas',
      'Cambio de cable y funda',
    ]
  },
  {
    name: 'Transmisión',
    types: [
      'Ajuste de cambios (delantero y trasero)',
      'Cambio de cadena',
      'Cambio de cassette',
      'Cambio de platos',
      'Cambio de bielas',
      'Cambio de pedalier',
      'Cambio de cambio trasero',
      'Cambio de desviador delantero',
      'Cambio de cables y fundas',
    ]
  },
  {
    name: 'Dirección y suspensión',
    types: [
      'Ajuste de dirección (juego de dirección)',
      'Sustitución de dirección',
      'Mantenimiento de horquilla (retenes y aceite)',
      'Mantenimiento de suspensión trasera',
    ]
  },
  {
    name: 'Montaje y ajustes generales',
    types: [
      'Puesta a punto',
      'Limpieza y engrase completa',
      'Montaje completo de bicicleta',
      'Sustitución de componentes (manillar, potencia, tija, sillín, etc.)',
    ]
  }
];

// Flatten all types for backwards compatibility
export const repairTypes = maintenanceCategories.flatMap(category => category.types);
