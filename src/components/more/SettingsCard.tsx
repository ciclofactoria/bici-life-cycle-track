
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumFeatures } from "@/services/premiumService";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/utils/i18n";

const LANGUAGES = [
  { code: "es", labelKey: "app_language_es" },
  { code: "en", labelKey: "app_language_en" },
];

export const SettingsCard = () => {
  const { user } = useAuth();
  const { isPremium } = usePremiumFeatures();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();

  const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    setLoading(true);
    setTimeout(() => {
      toast({
        title: t("profile_updated", language),
        description: t("name_changed", language),
      });
      setEditing(false);
      setLoading(false);
    }, 800);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setTimeout(() => {
      toast({
        title: t("settings_saved", language),
        description: t("preferences_updated", language),
      });
      setLoading(false);
    }, 700);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings", language)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Perfil */}
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">{t("name", language)}:</label>
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!editing}
              className="max-w-xs"
            />
            {editing ? (
              <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                {t("save", language)}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={loading}>
                {t("edit", language)}
              </Button>
            )}
          </div>
          <label className="block text-sm font-medium mb-1 mt-4">{t("email", language)}:</label>
          <Input value={user?.email || ""} disabled readOnly className="max-w-xs" />
          <div className="flex items-center gap-2 mt-2">
            <span>{t("premium", language)}:</span>
            {isPremium ? (
              <Badge variant="default">{t("premium_badge", language)}</Badge>
            ) : (
              <Badge variant="outline">{t("free_badge", language)}</Badge>
            )}
          </div>
        </div>
        {/* Preferencias */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("language", language)}:</label>
            <div className="flex gap-2">
              {LANGUAGES.map(lang => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "outline"}
                  onClick={() => setLanguage(lang.code as "es" | "en")}
                  size="sm"
                >
                  {t(lang.labelKey as any, language)}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("notifications", language)}:</label>
            <Button
              variant={notifications ? "default" : "outline"}
              onClick={() => setNotifications(!notifications)}
              size="sm"
            >
              {notifications
                ? t("notifications_on", language)
                : t("notifications_off", language)}
            </Button>
            <div className="text-xs text-muted-foreground">
              {t("notifications_note", language)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("distance_unit", language)}:</label>
            <div className="flex gap-2">
              <Button variant="default" size="sm" disabled>
                {t("kilometers", language)}
              </Button>
            </div>
          </div>
          <Button className="mt-2" onClick={handleSaveSettings} disabled={loading}>
            {t("save_settings", language)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
