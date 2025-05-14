
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PremiumStatus from '@/components/PremiumStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from "@/utils/i18n";

const PremiumInfo = () => {
  const { language } = useLanguage();

  return (
    <div className="pb-16">
      <div className="bici-container pt-6">
        <h1 className="text-2xl font-bold mb-6">{t('premium', language)} {t('plan', language)}</h1>
        
        <PremiumStatus />
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('premium_benefits_title', language)}</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>{t('unlimited_bikes', language)}</strong>: {t('unlimited_bikes_desc', language)}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>{t('strava_connect', language)}</strong>: {t('strava_connect_desc', language)}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>{t('excel_exports', language)}</strong>: {t('excel_exports_desc', language)}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>{t('priority_support', language)}</strong>: {t('priority_support_desc', language)}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('how_to_get', language)}</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4">
                  {t('premium_info_msg', language)}
                </p>
                
                <a
                  href="https://tu-sitio-wordpress.com/suscripcion"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">
                    {t('get_premium_plan', language)}
                  </Button>
                </a>
                
                <p className="mt-4 text-sm text-muted-foreground">
                  {t('already_premium_info', language)}
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
