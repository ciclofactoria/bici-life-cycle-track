
// Import specific translation files
import esGeneral from "./i18n-es-general";
import esMaintenance from "./i18n-es-maintenance";
import esPremium from "./i18n-es-premium";

const es = {
  ...esGeneral,
  ...esMaintenance,
  ...esPremium,
  
  // Mantener estos campos aquí porque dependen de lógica de usuario, no cambiar sin motivo:
  profile_updated: "Perfil actualizado",
  name_changed: "Nombre cambiado con éxito",
  settings_saved: "Configuración guardada",
  preferences_updated: "Preferencias actualizadas",
  user_verified: "Usuario verificado",
  not_verified: "No verificado",
  
  // Asegurar que todas las claves básicas estén presentes
  loading_bikes: "Cargando bicicletas...",
  my_bikes: "Mis Bicicletas",
  strava: "Strava",
  total_spent: "Total gastado",
  last_service: "Último servicio",
  distance: "Distancia",
  premium_badge: "Premium",
  free_badge: "Gratis",
  premium: "Premium",
  maintenance_plan: "Plan de mantenimiento",
  more_title: "Más",
  summary: "Resumen",
  bikes: "Bicicletas",
  calendar: "Calendario",
  maintenance_type: "Tipo de mantenimiento",
  
  // Agregar todas las traducciones específicas de mantenimiento que pueden estar faltando
  "Centrado de rueda delantera": "Centrado de rueda delantera",
  "Centrado de rueda trasera": "Centrado de rueda trasera",
  "Sustitución de cámara": "Sustitución de cámara",
  "Sustitución de cubierta": "Sustitución de cubierta",
  "Instalación de sistema tubeless": "Instalación de sistema tubeless",
  "Reparación de pinchazo tubeless": "Reparación de pinchazo tubeless",
  "Sustitución de válvula tubeless": "Sustitución de válvula tubeless",
  "Rodamientos rueda delantera": "Rodamientos rueda delantera",
  "Rodamientos rueda trasera": "Rodamientos rueda trasera",
  "Sustitución eje delantero": "Sustitución eje delantero",
  "Sustitución eje trasero": "Sustitución eje trasero",
  
  // Frenos
  "Purgado freno delantero": "Purgado freno delantero",
  "Purgado freno trasero": "Purgado freno trasero",
  "Sustitución de pastillas": "Sustitución de pastillas",
  "Cambio de disco": "Cambio de disco",
  "Ajuste de freno delantero": "Ajuste de freno delantero",
  "Ajuste de freno trasero": "Ajuste de freno trasero",
  "Sustitución de zapatas": "Sustitución de zapatas",
  "Cambio de cable y funda": "Cambio de cable y funda",
  
  // Transmisión
  "Ajuste de cambios (delantero y trasero)": "Ajuste de cambios (delantero y trasero)",
  "Cambio de cadena": "Cambio de cadena",
  "Cambio de cassette": "Cambio de cassette",
  "Cambio de platos": "Cambio de platos",
  "Cambio de bielas": "Cambio de bielas",
  "Cambio de pedalier": "Cambio de pedalier",
  "Cambio de cambio trasero": "Cambio de cambio trasero",
  "Cambio de desviador delantero": "Cambio de desviador delantero",
  "Cambio de cables y fundas": "Cambio de cables y fundas",
  
  // Dirección y suspensión
  "Ajuste de dirección (juego de dirección)": "Ajuste de dirección (juego de dirección)",
  "Sustitución de dirección": "Sustitución de dirección",
  "Mantenimiento de horquilla (retenes y aceite)": "Mantenimiento de horquilla (retenes y aceite)",
  "Mantenimiento de suspensión trasera": "Mantenimiento de suspensión trasera",
  
  // Montaje y ajustes generales
  "Puesta a punto": "Puesta a punto",
  "Limpieza y engrase completa": "Limpieza y engrase completa",
  "Montaje completo de bicicleta": "Montaje completo de bicicleta",
  "Sustitución de componentes (manillar, potencia, tija, sillín, etc.)": "Sustitución de componentes (manillar, potencia, tija, sillín, etc.)",
};

export const translations = {
  general: esGeneral,
  maintenance: esMaintenance,
  premium: esPremium,
};

export default es;
