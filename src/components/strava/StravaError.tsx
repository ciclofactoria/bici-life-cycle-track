
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface StravaErrorProps {
  error: string;
}

export const StravaError = ({ error }: StravaErrorProps) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};
