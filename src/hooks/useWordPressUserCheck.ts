
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseWordPressUserCheckProps {
  email: string;
  setActiveTab: (tab: string) => void;
  setRegisterTabDisabled: (disabled: boolean) => void;
  setShowResetDialog: (show: boolean) => void;
  setResetEmail: (email: string) => void;
}

export const useWordPressUserCheck = ({
  email,
  setActiveTab,
  setRegisterTabDisabled,
  setShowResetDialog,
  setResetEmail
}: UseWordPressUserCheckProps) => {
  const [userExistsInWordPress, setUserExistsInWordPress] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const { toast } = useToast();

  // Reset WordPress user status when email changes
  useEffect(() => {
    if (email && userExistsInWordPress) {
      setUserExistsInWordPress(false);
      setRegisterTabDisabled(false);
    }
  }, [email, userExistsInWordPress, setRegisterTabDisabled]);

  const checkWordPressUser = async (email: string) => {
    setCheckingUser(true);
    try {
      console.log("Verificando si el usuario existe en WordPress:", email);
      const response = await supabase.functions.invoke('check-wordpress-user', {
        body: { email }
      });

      console.log("Respuesta de check-wordpress-user:", response);

      // Check if the user exists in WordPress
      if (response.data && response.data.exists === true) {
        console.log("El usuario existe en WordPress:", response.data);
        
        // Automatically show reset password dialog
        setResetEmail(email);
        setUserExistsInWordPress(true);
        setActiveTab('login');
        setRegisterTabDisabled(true);
        setShowResetDialog(true);
        
        toast({
          title: "Usuario ya registrado",
          description: "Este email ya está registrado en ciclofactoria.com. Por favor, utiliza la opción para restablecer tu contraseña.",
          variant: "warning"
        });
        
        return true;
      } else if (email.toLowerCase().endsWith('@wordpress.test')) {
        // For testing purposes, treat any email ending with @wordpress.test as existing
        console.log("Email de prueba detectado, simulando usuario existente en WordPress");
        
        setResetEmail(email);
        setUserExistsInWordPress(true);
        setActiveTab('login');
        setRegisterTabDisabled(true);
        setShowResetDialog(true);
        
        toast({
          title: "Usuario ya registrado",
          description: "Este email ya está registrado en ciclofactoria.com. Por favor, utiliza la opción para restablecer tu contraseña.",
          variant: "warning"
        });
        
        return true;
      }

      // Use the fallback method - checking if the user exists via verify-subscription
      if (response.data && response.data.message && response.data.message.includes("verified via subscription check")) {
        console.log("Usuario verificado a través del endpoint de suscripción:", response.data);
        
        setResetEmail(email);
        setUserExistsInWordPress(true);
        setActiveTab('login');
        setRegisterTabDisabled(true);
        setShowResetDialog(true);
        
        toast({
          title: "Usuario ya registrado",
          description: "Este email ya está registrado en ciclofactoria.com. Por favor, utiliza la opción para restablecer tu contraseña.",
          variant: "warning"
        });
        
        return true;
      }

      console.log("El usuario no existe en WordPress:", response.data);
      return false;
    } catch (error) {
      console.error('Error invoking check-wordpress-user function:', error);
      return false;
    } finally {
      setCheckingUser(false);
    }
  };

  return {
    userExistsInWordPress,
    setUserExistsInWordPress,
    checkingUser,
    checkWordPressUser
  };
};
