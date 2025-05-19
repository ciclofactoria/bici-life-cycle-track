
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Processes Strava API errors and returns a user-friendly error message
 * based on the error type and language preference
 */
export const getStravaErrorMessage = (error: any, language: 'en' | 'es'): string => {
  // Extract error message if it exists
  let errorMessage = error?.message || '';
  const errorStatus = error?.status || '';
  
  // Check for authentication errors
  if (errorMessage.includes('autenticado') || errorMessage.includes('authenticated') || 
      errorMessage.includes('login') || errorMessage.includes('sesión')) {
    return language === 'en'
      ? 'You must be logged in to use Strava features.'
      : 'Debes estar autenticado para usar las funciones de Strava.';
  }
  
  // Check for specific error types
  if (errorStatus === 401 || errorMessage.includes('expired') || errorMessage.includes('expirado')) {
    return language === 'en'
      ? 'Your Strava connection has expired. Please reconnect your account.'
      : 'Tu conexión con Strava ha expirado. Por favor, reconecta tu cuenta.';
  }
  
  if (errorStatus === 429 || errorMessage.includes('rate limit')) {
    return language === 'en'
      ? 'Too many requests to Strava. Please try again later.'
      : 'Demasiadas solicitudes a Strava. Por favor, inténtalo más tarde.';
  }
  
  if (errorStatus === 403 || errorMessage.includes('scope') || errorMessage.includes('permission')) {
    return language === 'en'
      ? 'Missing permissions. Please reconnect to Strava with the required permissions.'
      : 'Faltan permisos. Por favor, reconecta con Strava con los permisos necesarios.';
  }
  
  if (errorStatus === 404) {
    return language === 'en'
      ? 'Strava resource not found. Please try again later.'
      : 'Recurso de Strava no encontrado. Por favor, inténtalo más tarde.';
  }
  
  // For Edge Function specific errors
  if (errorMessage.includes('Edge Function') || errorMessage.includes('non-2xx')) {
    return language === 'en'
      ? 'Error connecting to Strava service. Please try again later.'
      : 'Error al conectar con el servicio de Strava. Por favor, inténtalo más tarde.';
  }
  
  // Default message for any other error
  return language === 'en'
    ? 'Error connecting to Strava. Please try again later.'
    : 'Error al conectar con Strava. Por favor, inténtalo más tarde.';
};

/**
 * Hook for handling Strava errors with toast notifications
 */
export const useStravaErrorHandler = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const handleStravaError = (error: any, customTitle?: string) => {
    console.error('Strava error:', error);
    
    const title = customTitle || (language === 'en' ? 'Strava Error' : 'Error de Strava');
    const description = getStravaErrorMessage(error, language);
    
    toast({
      title,
      description,
      variant: 'destructive',
    });
    
    return description;
  };
  
  return { handleStravaError };
};
