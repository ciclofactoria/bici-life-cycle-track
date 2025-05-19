
import enWheelMaintenance from "./maintenance/en-wheel-maintenance";
import enBrakeMaintenance from "./maintenance/en-brake-maintenance";
import enTransmissionMaintenance from "./maintenance/en-transmission-maintenance";
import enSuspensionMaintenance from "./maintenance/en-suspension-maintenance";
import enGeneralMaintenance from "./maintenance/en-general-maintenance";
import enUiMaintenance from "./maintenance/en-ui-maintenance";
import enAlerts from "./maintenance/en-alerts";
import enAppointments from "./maintenance/en-appointments";
import enCalendar from "./maintenance/en-calendar";
import enSummary from "./maintenance/en-summary";
import enCategories from "./maintenance/en-categories";
import enStrava from "./maintenance/en-strava";

const enMaintenance = {
  ...enWheelMaintenance,
  ...enBrakeMaintenance,
  ...enTransmissionMaintenance,
  ...enSuspensionMaintenance,
  ...enGeneralMaintenance,
  ...enUiMaintenance,
  ...enAlerts,
  ...enAppointments,
  ...enCalendar,
  ...enSummary,
  ...enCategories,
  ...enStrava,
};

export default enMaintenance;
