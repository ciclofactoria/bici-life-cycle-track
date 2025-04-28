
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      return permission === 'granted';
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
  return false;
}
