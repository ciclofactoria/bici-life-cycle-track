
import { toast } from '@/components/ui/use-toast';

/**
 * Hook para manejar errores de Strava de forma consistente
 */
export function useStravaErrorHandler() {
  const handleStravaError = (error: any, title?: string) => {
    console.error('Error de Strava:', error);
    
    const errorMessage = error?.message || 'Error desconocido con Strava';
    const errorTitle = title || 'Error de Strava';
    
    toast({
      title: errorTitle,
      description: errorMessage,
      variant: 'destructive',
    });
  };

  return { handleStravaError };
}
