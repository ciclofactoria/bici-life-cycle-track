
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
};

export const translations = {
  general: esGeneral,
  maintenance: esMaintenance,
  premium: esPremium,
};

export default es;
