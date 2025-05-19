
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
};

export const translations = {
  general: esGeneral,
  maintenance: esMaintenance,
  premium: esPremium,
};

export default es;
