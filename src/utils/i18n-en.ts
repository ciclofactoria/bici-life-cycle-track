
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

export default en;
