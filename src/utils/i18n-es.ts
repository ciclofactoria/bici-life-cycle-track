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
  general: generalTranslations,
  maintenance: maintenanceTranslations,
  premium: premiumTranslations,
  
  // Traducciones específicas para errores de autenticación
  "user_not_authenticated": "Debes iniciar sesión para realizar esta acción",
  "strava_disconnected": "Strava desconectado",
  "strava_disconnect_success": "Tu cuenta de Strava ha sido desconectada exitosamente",
  "strava_disconnect_error": "Error al desconectar la cuenta de Strava",
  "connecting": "Conectando...",
  "disconnecting": "Desconectando...",
  "connect_strava": "Conectar con Strava",
  "disconnect_strava": "Desconectar de Strava",
  "connecting_strava": "Conectando con Strava",
  "redirecting_strava": "Serás redirigido a Strava para autorización",
  "strava_auth_url_error": "Error al generar URL de autorización de Strava",
  "strava_auth_start_error": "Error al iniciar autenticación con Strava",
  "verifying_premium": "Verificando estado premium",
  "wait_verifying_subscription": "Por favor espera mientras verificamos tu suscripción",
  "syncing": "Sincronizando...",
  "sync_with_strava": "Sincronizar con Strava",
};

export default es;
