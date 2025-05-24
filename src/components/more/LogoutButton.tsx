
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { t } from "@/utils/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export const LogoutButton = () => {
  const { signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          <span>{language === 'en' ? 'Logout' : 'Cerrar sesión'}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {language === 'en' ? 'Do you want to logout?' : '¿Quieres cerrar sesión?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {language === 'en' 
              ? 'You will need to log in again to access your data.'
              : 'Tendrás que volver a iniciar sesión para acceder a tus datos.'
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>
            {language === 'en' ? 'Logout' : 'Cerrar sesión'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
