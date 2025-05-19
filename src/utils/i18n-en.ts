
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
};

export const translations = {
  general: enGeneral,
  maintenance: enMaintenance,
  premium: enPremium,
  
  // Traducciones específicas para errores de autenticación
  "user_not_authenticated": "You must be logged in to perform this action",
  "strava_disconnected": "Strava disconnected",
  "strava_disconnect_success": "Your Strava account has been successfully disconnected",
  "strava_disconnect_error": "Error disconnecting Strava account",
  "connecting": "Connecting...",
  "disconnecting": "Disconnecting...",
  "connect_strava": "Connect with Strava",
  "disconnect_strava": "Disconnect from Strava",
  "connecting_strava": "Connecting to Strava",
  "redirecting_strava": "You will be redirected to Strava for authorization",
  "strava_auth_url_error": "Error generating Strava authorization URL",
  "strava_auth_start_error": "Error starting Strava authentication",
  "verifying_premium": "Verifying premium status",
  "wait_verifying_subscription": "Please wait while we verify your subscription",
  "syncing": "Syncing...",
  "sync_with_strava": "Sync with Strava",
};

export default en;
