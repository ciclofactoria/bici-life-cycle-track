
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePremiumFeatures } from "@/services/premiumService";

const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];
const DIST_UNITS = [
  { code: "km", label: "Kilómetros" },
  { code: "mi", label: "Millas" },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { isPremium } = usePremiumFeatures();
  const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
  const [editing, setEditing] = useState(false);
  const [language, setLanguage] = useState("es");
  const [notifications, setNotifications] = useState(true);
  const [distanceUnit, setDistanceUnit] = useState("km");

  const handleSaveName = () => {
    // Aquí se implementaría la llamada para guardar el nombre (ejemplo: Supabase)
    setEditing(false);
  };

  return (
    <div className="bici-container pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ajustes</h1>
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="language">Idioma</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
              <TabsTrigger value="distance">Distancia</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Nombre:</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!editing}
                  />
                  {editing ? (
                    <Button size="sm" onClick={handleSaveName}>
                      Guardar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      Editar
                    </Button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email:</label>
                  <Input value={user?.email || ""} disabled readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <span>Premium:</span>
                  {isPremium ? (
                    <Badge variant="default">Premium</Badge>
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="language">
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Idioma de la aplicación:</label>
                <div className="flex gap-2">
                  {LANGUAGES.map(lang => (
                    <Button
                      key={lang.code}
                      variant={language === lang.code ? "default" : "outline"}
                      onClick={() => setLanguage(lang.code)}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Recibir notificaciones:</label>
                <Button
                  variant={notifications ? "default" : "outline"}
                  onClick={() => setNotifications(!notifications)}
                >
                  {notifications ? "Activadas" : "Desactivadas"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Incluye avisos de alertas y calendario.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="distance">
              <div className="space-y-4">
                <label className="block text-sm font-medium mb-1">Unidad de distancia:</label>
                <div className="flex gap-2">
                  {DIST_UNITS.map(unit => (
                    <Button
                      key={unit.code}
                      variant={distanceUnit === unit.code ? "default" : "outline"}
                      onClick={() => setDistanceUnit(unit.code)}
                    >
                      {unit.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Las distancias se recalcularán automáticamente si cambias de unidad.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;

