
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
import { useToast } from '@/hooks/use-toast';

export const ActionCards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { isPremium, loading: isPremiumLoading } = usePremiumFeatures();

  const handleExportFullHistory = async () => {
    const { user } = useAuth();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Necesitas iniciar sesión para exportar",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar si el usuario es premium para exportar
    if (!isPremium) {
      toast({
        title: 'Función premium',
        description: 'Las exportaciones a Excel están disponibles solo para usuarios premium',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      await generateFullMaintenanceExcel(user.id);
      toast({
        title: "Exportado con éxito",
        description: "El historial completo se ha exportado a Excel",
      });
    } catch (error) {
      console.error("Error exportando historial completo:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el historial completo",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-between"
          onClick={() => navigate('/archived-bikes')}
        >
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span>Bicicletas archivadas</span>
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
            <span>{isExporting ? 'Exportando...' : 'Exportar historial completo'}</span>
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

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
