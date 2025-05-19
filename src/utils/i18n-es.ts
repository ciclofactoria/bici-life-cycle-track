
// Import specific translation files if they exist
import esGeneral from "./i18n-es-general";
import esMaintenance from "./i18n-es-maintenance";
import esPremium from "./i18n-es-premium";

// Check if the imports are available, otherwise use empty objects
const general = esGeneral || {};
const maintenance = esMaintenance || {};
const premium = esPremium || {};

const es = {
  ...general,
  ...maintenance,
  ...premium,
  
  // Mantener estos campos aquí porque dependen de lógica de usuario, no cambiar sin motivo:
  profile_updated: "Perfil actualizado",
  name_changed: "Nombre cambiado con éxito",
  settings_saved: "Configuración guardada",
  preferences_updated: "Preferencias actualizadas",
  user_verified: "Usuario verificado",
  not_verified: "No verificado",
  
  // New translations for bike page
  my_bikes: "Mis Bicicletas",
  sync_with_strava: "Sincronizar con Strava",
  syncing: "Sincronizando...",
  premium_popup_title: "Función Premium",
  strava_sync_premium_desc: "La sincronización con Strava es una función premium. Actualiza a premium para desbloquear todas las funciones.",
  multiple_bikes: "Múltiples bicicletas",
  auto_strava_sync: "Sincronización automática con Strava",
  import_strava_bikes: "Importar bicicletas desde Strava",
  advanced_stats: "Estadísticas avanzadas",
  maintenance_export: "Exportar historial de mantenimiento",
  custom_alerts: "Alertas personalizadas",
};

export default es;
