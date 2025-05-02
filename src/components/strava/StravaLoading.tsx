
import { Loader2 } from 'lucide-react';

interface StravaLoadingProps {
  status: string;
}

export const StravaLoading = ({ status }: StravaLoadingProps) => {
  return (
    <div className="text-center">
      <Loader2 className="animate-spin mx-auto mb-4 h-8 w-8 text-orange-500" />
      <p className="text-lg mb-2">Conectando con Strava...</p>
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
};
