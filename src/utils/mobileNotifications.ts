
// Import the PushNotifications type only to avoid direct dependency at build time
import type { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

// Function to register FCM token in Supabase - will be fully implemented in the future
const saveTokenToSupabase = async (token: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Update the user's profile with FCM token
      await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', user.id);
      
      console.log('FCM token saved to user profile:', token);
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Initialize push notifications - simplified version for development
export async function initPushNotifications() {
  try {
    // Check if app is running in a Capacitor environment
    if (typeof window === 'undefined' || !(window as any).Capacitor) {
      console.log('Push notifications require Capacitor - running in browser mode');
      return false;
    }
    
    // Dynamically import Capacitor plugins only when in Capacitor environment
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // Request permission and register for push notifications
    const result = await PushNotifications.requestPermissions();
    
    if (result.receive === 'granted') {
      await PushNotifications.register();
      
      // Register notification listeners
      registerNotificationListeners(PushNotifications);
      return true;
    } else {
      console.log('Push notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

// Register event listeners for notifications
async function registerNotificationListeners(PushNotifications: any) {
  // Registration success listener
  PushNotifications.addListener('registration', async (token: { value: string }) => {
    console.log('Push registration success, token:', token.value);
    await saveTokenToSupabase(token.value);
  });
  
  // Registration error listener
  PushNotifications.addListener('registrationError', (err: { error: string }) => {
    console.error('Push registration failed:', err.error);
  });
  
  // Push notification received listener
  PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
    console.log('Push notification received:', notification);
  });
  
  // Push notification action listener (when user taps notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
    console.log('Push notification action performed:', action);
  });
}

// Check next day appointments for mobile devices
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
        // Just add a log for development - in production this would trigger a local notification
        console.log('Appointment scheduled for tomorrow detected on mobile');
        
        // In a full implementation, this would use local notifications:
        // LocalNotifications.schedule({
        //   notifications: [
        //     {
        //       title: 'Recordatorio de cita',
        //       body: `Tienes una cita programada mañana para tu bicicleta ${bike.name}`,
        //       id: 1,
        //       schedule: { at: new Date(Date.now() + 1000) }
        //     }
        //   ]
        // });
      }
    }
  } catch (error) {
    console.error('Error processing appointment date for mobile:', error);
  }
}
