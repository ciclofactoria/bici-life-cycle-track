
import { toast } from '@/components/ui/use-toast';

/**
 * Hook para manejar errores de Strava de forma consistente
 */
export function useStravaErrorHandler() {
  const handleStravaError = (error: any, title?: string) => {
    console.error('Error de Strava:', error);
    
    const errorMessage = error?.message || 'Error desconocido con Strava';
    
    toast(title || 'Error de Strava', {
      description: errorMessage,
      // La propiedad variant ahora es compatible con nuestro toast personalizado
    });
  };

  return { handleStravaError };
}
