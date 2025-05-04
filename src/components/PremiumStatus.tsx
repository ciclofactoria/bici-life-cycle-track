
import { Button } from "@/components/ui/button";
import { usePremiumFeatures } from "@/services/premiumService";
import { Shield, ShieldAlert, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const PremiumStatus = () => {
  const { isPremium, premiumUntil, loading, verifyWithWordPress } = usePremiumFeatures();

  return (
    <div className="border rounded-lg p-4 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : isPremium ? (
            <Shield className="h-5 w-5 text-green-500" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          )}
          <div>
            <h3 className="font-medium">
              {loading
                ? "Verificando estado..."
                : isPremium
                ? "Usuario Premium"
                : "Usuario Gratuito"}
            </h3>
            {isPremium && premiumUntil && (
              <p className="text-sm text-muted-foreground">
                Válido hasta: {format(premiumUntil, "d MMMM yyyy", { locale: es })}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={verifyWithWordPress}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar estado"
          )}
        </Button>
      </div>
      
      {!isPremium && !loading && (
        <div className="mt-3 text-sm">
          <p>
            Para acceder a todas las funcionalidades premium (múltiples bicicletas, 
            conexión con Strava y exportaciones), activa tu suscripción en nuestra web.
          </p>
          <a 
            href="https://tu-sitio-wordpress.com/subscripcion" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline mt-1 inline-block"
          >
            Obtener suscripción premium →
          </a>
        </div>
      )}
    </div>
  );
};

export default PremiumStatus;
