
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registrado:', registration);
      
      const permission = await Notification.requestPermission();
      console.log('Permiso de notificación:', permission);
      
      if (permission === 'granted') {
        // Obtener la suscripción
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Crear una nueva suscripción si no existe
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // En un entorno de producción, necesitarías agregar tus claves VAPID aquí
            applicationServerKey: 'BBAJw1KgWsL0cG9kXVjn8vKwKq6QMXU977U_BbgHQjz4xoEtxoCKd5gqHHGxR_0FQSP-6tfXmh1eJEB6IiFiHNI'
          });
          console.log('Nueva suscripción creada:', subscription);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al registrar el Service Worker:', error);
      return false;
    }
  }
  return false;
}

export async function checkNextDayAppointments(bike: any) {
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
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Recordatorio de cita', {
            body: `Tienes una cita programada mañana para tu bicicleta ${bike.name}`,
            icon: '/favicon.ico'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error al procesar la fecha de la cita:', error);
  }
}
