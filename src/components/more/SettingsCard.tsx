
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumFeatures } from "@/services/premiumService";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];
const DIST_UNITS = [
  { code: "km", label: "Kilómetros" },
  { code: "mi", label: "Millas" },
];

export const SettingsCard = () => {
  const { user } = useAuth();
  const { isPremium } = usePremiumFeatures();
  const { toast } = useToast();

  // Simulación de settings locales. Para guardar de verdad, conecta a backend/Supabase.
  const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
  const [editing, setEditing] = useState(false);
  const [language, setLanguage] = useState("es");
  const [notifications, setNotifications] = useState(true);
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    setLoading(true);
    // Aquí deberías actualizar el nombre del usuario vía Supabase o tu backend.
    setTimeout(() => {
      toast({ title: "Perfil actualizado", description: "Nombre cambiado con éxito." });
      setEditing(false);
      setLoading(false);
    }, 800);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    // Aquí deberías guardar settings en persistencia real.
    setTimeout(() => {
      toast({ title: "Ajustes guardados", description: "Tus preferencias han sido actualizadas." });
      setLoading(false);
    }, 700);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajustes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Perfil */}
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Nombre:</label>
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!editing}
              className="max-w-xs"
            />
            {editing ? (
              <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                Guardar
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={loading}>
                Editar
              </Button>
            )}
          </div>
          <label className="block text-sm font-medium mb-1 mt-4">Email:</label>
          <Input value={user?.email || ""} disabled readOnly className="max-w-xs" />
          <div className="flex items-center gap-2 mt-2">
            <span>Premium:</span>
            {isPremium ? (
              <Badge variant="default">Premium</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </div>
        </div>
        {/* Preferencias */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Idioma de la aplicación:</label>
            <div className="flex gap-2">
              {LANGUAGES.map(lang => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "outline"}
                  onClick={() => setLanguage(lang.code)}
                  size="sm"
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notificaciones:</label>
            <Button
              variant={notifications ? "default" : "outline"}
              onClick={() => setNotifications(!notifications)}
              size="sm"
            >
              {notifications ? "Activadas" : "Desactivadas"}
            </Button>
            <div className="text-xs text-muted-foreground">
              Incluye avisos de alertas y calendario.
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unidad de distancia:</label>
            <div className="flex gap-2">
              {DIST_UNITS.map(unit => (
                <Button
                  key={unit.code}
                  variant={distanceUnit === unit.code ? "default" : "outline"}
                  onClick={() => setDistanceUnit(unit.code)}
                  size="sm"
                >
                  {unit.label}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Las distancias se recalcularán automáticamente si cambias de unidad.
            </div>
          </div>
          <Button className="mt-2" onClick={handleSaveSettings} disabled={loading}>
            Guardar ajustes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
