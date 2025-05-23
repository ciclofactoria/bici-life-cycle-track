
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, FileText, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePremiumFeatures } from '@/services/premiumService';
import { generateFullMaintenanceExcel } from '@/utils/excelGenerator';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from "@/utils/i18n";

export const ActionCards = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();
  const { language } = useLanguage();
  const { user } = useAuth();

  const handleExportFullHistory = async () => {
    if (!user) {
      toast(t("error", language), {
        description: t("login_to_export", language),
        variant: "destructive"
      });
      return;
    }
    if (!isPremium) {
      toast(t("premium", language), {
        description: t('excel_exports_premium', language),
        variant: 'destructive',
      });
      return;
    }
    setIsExporting(true);
    try {
      await generateFullMaintenanceExcel(user.id);
      toast(t("export_success", language), {
        description: t("full_history_exported", language),
      });
    } catch (error) {
      console.error("Error exportando historial completo:", error);
      toast(t("error", language), {
        description: t("export_error", language),
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("actions", language)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-between"
          onClick={() => navigate('/archived-bikes')}
        >
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span>{t('archived_bikes', language)}</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-between"
          onClick={handleExportFullHistory}
          disabled={isExporting || isPremiumLoading}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>{isExporting ? t('exporting', language) : t('export_full_history', language)}</span>
          </div>
          {!isPremium && !isPremiumLoading && (
            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
              <img 
                src="/lovable-uploads/c55d72b0-c3b4-4c57-bdbf-fb609210b8dc.png" 
                className="h-3 w-3" 
                alt="Premium" 
              />
            </span>
          )}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
