
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

// Función para registrar el token de FCM en Supabase
const saveTokenToSupabase = async (token: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Guardar el token FCM en el perfil del usuario
    await supabase.from('profiles')
      .update({ fcm_token: token })
      .eq('id', user.id);
    
    console.log('Token FCM guardado en Supabase');
  } catch (error) {
    console.error('Error al guardar token FCM:', error);
  }
};

// Inicializar las notificaciones push
export async function initPushNotifications() {
  try {
    // Verificar permisos
    const permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      // Solicitar permisos
      const request = await PushNotifications.requestPermissions();
      if (request.receive !== 'granted') {
        console.log('Permiso de notificaciones denegado');
        return;
      }
    } else if (permStatus.receive !== 'granted') {
      console.log('No hay permiso para enviar notificaciones');
      return;
    }
    
    // Registrar los listeners antes de registrar para notificaciones
    await registerNotificationListeners();
    
    // Registrar para recibir notificaciones
    await PushNotifications.register();
    
    return true;
  } catch (error) {
    console.error('Error al inicializar notificaciones:', error);
    return false;
  }
}

// Registrar los listeners de eventos para notificaciones
async function registerNotificationListeners() {
  // Cuando se registra exitosamente en FCM
  PushNotifications.addListener('registration', async (token) => {
    console.log('Token FCM recibido:', token.value);
    await saveTokenToSupabase(token.value);
  });

  // Si hay un error en el registro
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error al registrar notificaciones:', error);
  });

  // Cuando se recibe una notificación mientras la app está en primer plano
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notificación recibida en primer plano:', notification);
  });

  // Cuando el usuario toca una notificación
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Acción de notificación realizada:', action);
    // Aquí puedes manejar la navegación cuando el usuario toca una notificación
    // Por ejemplo, navegar a la página de detalles de la bicicleta
  });
}

// Comprobar citas del día siguiente para dispositivos móviles
export async function checkNextDayAppointmentsMobile(bike: any) {
  if (!bike?.next_check_date) return;

  try {
    const appointmentDate = new Date(bike.next_check_date);
    
    if (!isNaN(appointmentDate.getTime())) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (
        appointmentDate.getDate() === tomorrow.getDate() &&
        appointmentDate.getMonth() === tomorrow.getMonth() &&
        appointmentDate.getFullYear() === tomorrow.getFullYear()
      ) {
        // En móvil no usamos la API de Notification del navegador
        // Las notificaciones se enviarán desde el servidor a FCM
        console.log('Cita programada para mañana detectada en móvil');
        // Aquí podrías llamar a una función de Supabase Edge para enviar la notificación
      }
    }
  } catch (error) {
    console.error('Error al procesar la fecha de la cita móvil:', error);
  }
}
