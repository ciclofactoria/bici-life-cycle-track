
import enGeneral from "./i18n-en-general";
import enMaintenance from "./i18n-en-maintenance";
import enPremium from "./i18n-en-premium";

const en = {
  ...enGeneral,
  ...enMaintenance,
  ...enPremium,

  // Mantener estos campos aquí porque dependen de lógica de usuario, no cambiar sin motivo:
  profile_updated: "Profile updated",
  name_changed: "Name changed successfully",
  settings_saved: "Settings saved",
  preferences_updated: "Preferences updated",
  user_verified: "User verified",
  not_verified: "Not verified",
  
  // Agregar traducciones que faltan del español
  loading_bikes: "Loading bikes...",
  my_bikes: "My Bikes",
  strava: "Strava",
  total_spent: "Total Spent",
  last_service: "Last Service",
  distance: "Distance",
  premium_badge: "Premium",
  free_badge: "Free",
  premium: "Premium",
  maintenance_plan: "Maintenance Plan",
  more_title: "More",
  summary: "Summary",
  bikes: "Bikes",
  calendar: "Calendar",
  maintenance_type: "Maintenance Type",
  
  // Agregar todas las traducciones específicas de mantenimiento en inglés
  "Centrado de rueda delantera": "Front wheel truing",
  "Centrado de rueda trasera": "Rear wheel truing",
  "Sustitución de cámara": "Tube replacement",
  "Sustitución de cubierta": "Tire replacement",
  "Instalación de sistema tubeless": "Tubeless system installation",
  "Reparación de pinchazo tubeless": "Tubeless puncture repair",
  "Sustitución de válvula tubeless": "Tubeless valve replacement",
  "Rodamientos rueda delantera": "Front wheel bearings",
  "Rodamientos rueda trasera": "Rear wheel bearings",
  "Sustitución eje delantero": "Front axle replacement",
  "Sustitución eje trasero": "Rear axle replacement",
  
  // Frenos
  "Purgado freno delantero": "Front brake bleeding",
  "Purgado freno trasero": "Rear brake bleeding",
  "Sustitución de pastillas": "Pad replacement",
  "Cambio de disco": "Disc replacement",
  "Ajuste de freno delantero": "Front brake adjustment",
  "Ajuste de freno trasero": "Rear brake adjustment",
  "Sustitución de zapatas": "Shoe replacement",
  "Cambio de cable y funda": "Cable and housing replacement",
  
  // Transmisión
  "Ajuste de cambios (delantero y trasero)": "Gear adjustment (front and rear)",
  "Cambio de cadena": "Chain replacement",
  "Cambio de cassette": "Cassette replacement",
  "Cambio de platos": "Chainring replacement",
  "Cambio de bielas": "Crankset replacement",
  "Cambio de pedalier": "Bottom bracket replacement",
  "Cambio de cambio trasero": "Rear derailleur replacement",
  "Cambio de desviador delantero": "Front derailleur replacement",
  "Cambio de cables y fundas": "Cables and housing replacement",
  
  // Dirección y suspensión
  "Ajuste de dirección (juego de dirección)": "Headset adjustment",
  "Sustitución de dirección": "Headset replacement",
  "Mantenimiento de horquilla (retenes y aceite)": "Fork maintenance (seals and oil)",
  "Mantenimiento de suspensión trasera": "Rear suspension maintenance",
  
  // Montaje y ajustes generales
  "Puesta a punto": "Tune-up",
  "Limpieza y engrase completa": "Full cleaning and lubrication",
  "Montaje completo de bicicleta": "Full bike assembly",
  "Sustitución de componentes (manillar, potencia, tija, sillín, etc.)": "Component replacement (handlebar, stem, seatpost, saddle, etc.)",
};

export const translations = {
  general: enGeneral,
  maintenance: enMaintenance,
  premium: enPremium,
};

export default en;
