
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
};

export const translations = {
  general: enGeneral,
  maintenance: enMaintenance,
  premium: enPremium,
};

export default en;
