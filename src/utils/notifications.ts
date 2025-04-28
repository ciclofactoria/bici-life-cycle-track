
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        // Get the subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Create a new subscription if we don't have one
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            // In a production environment, you would need to add your VAPID keys here
            applicationServerKey: 'BBAJw1KgWsL0cG9kXVjn8vKwKq6QMXU977U_BbgHQjz4xoEtxoCKd5gqHHGxR_0FQSP-6tfXmh1eJEB6IiFiHNI'
          });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
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
    console.error('Error processing appointment date:', error);
  }
}
