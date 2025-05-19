
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';
import { MaintenanceForm } from './MaintenanceForm';

interface AddMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeId: string;
  onSuccess?: () => void;
  stravaId?: string;
}

const AddMaintenanceDialog = ({ open, onOpenChange, bikeId, onSuccess, stravaId }: AddMaintenanceDialogProps) => {
  const { language } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("add_maintenance_dialog_title", language)}</DialogTitle>
        </DialogHeader>
        <MaintenanceForm 
          bikeId={bikeId}
          stravaId={stravaId}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddMaintenanceDialog;
