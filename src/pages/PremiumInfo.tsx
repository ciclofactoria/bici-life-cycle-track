
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PremiumStatus from '@/components/PremiumStatus';

const PremiumInfo = () => {
  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">Plan Premium</h1>
        
        <PremiumStatus />
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Beneficios Premium</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>Bicicletas ilimitadas</strong>: Registra todas las bicicletas que tengas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>Conexión con Strava</strong>: Importa automáticamente tus bicicletas desde Strava</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>Exportaciones a Excel</strong>: Exporta tu historial completo de mantenimiento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>Soporte prioritario</strong>: Atención personalizada para resolver dudas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">¿Cómo obtenerlo?</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4">
                  Para disfrutar de todas las funcionalidades premium, visita nuestra web y adquiere tu suscripción.
                  Una vez completado el proceso, tu cuenta será actualizada automáticamente.
                </p>
                
                <a
                  href="https://tu-sitio-wordpress.com/suscripcion"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">
                    Obtener Plan Premium
                  </Button>
                </a>
                
                <p className="mt-4 text-sm text-muted-foreground">
                  Si ya has adquirido un plan premium y no se refleja en la aplicación,
                  haz clic en "Verificar estado" en la parte superior de esta página.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNav activePage="/more" />
    </div>
  );
};

export default PremiumInfo;
