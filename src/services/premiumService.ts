
import React from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface SubscriptionStatus {
  isPremium: boolean;
  premiumUntil: Date | null;
  lastVerified: Date | null;
}

/**
 * Verifica si el usuario actual tiene estado premium
 */
export const checkUserPremiumStatus = async (): Promise<SubscriptionStatus | null> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error("Error al obtener usuario:", userError);
      return null;
    }

    // Verificar estado premium local
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error("Error al verificar estado premium:", error);
      return null;
    }

    // Si no hay suscripción, el usuario no es premium
    if (!subscription) {
      return {
        isPremium: false,
        premiumUntil: null,
        lastVerified: null
      };
    }

    const isPremium = subscription.is_premium && 
      (!subscription.premium_until || new Date(subscription.premium_until) > new Date());

    return {
      isPremium,
      premiumUntil: subscription.premium_until ? new Date(subscription.premium_until) : null,
      lastVerified: subscription.last_verified_at ? new Date(subscription.last_verified_at) : null
    };
  } catch (error) {
    console.error("Error en checkUserPremiumStatus:", error);
    return null;
  }
};

/**
 * Verifica el estado premium conectándose con WordPress
 * Este método debe ser actualizado para conectar con tu sistema WordPress
 */
export const verifyPremiumWithWordPress = async (userId: string, email: string): Promise<boolean> => {
  try {
    // Esta función debe ser reemplazada con la lógica real de conexión a WordPress
    // Por ahora, usamos una edge function que actuará como puente entre la app y WordPress
    const { data, error } = await supabase.functions.invoke('verify-wordpress-premium', {
      body: { userId, email }
    });

    if (error) {
      console.error("Error verificando estado premium con WordPress:", error);
      return false;
    }

    if (data && data.isPremium) {
      // Actualizar el estado premium en la base de datos
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          is_premium: true,
          premium_until: data.premiumUntil || null,
          last_verified_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error("Error actualizando estado premium:", updateError);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error en verifyPremiumWithWordPress:", error);
    return false;
  }
};

/**
 * Hook personalizado para utilizar el estado premium en componentes
 */
export const usePremiumFeatures = () => {
  const [status, setStatus] = React.useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const checkPremium = async () => {
      setLoading(true);
      const premiumStatus = await checkUserPremiumStatus();
      setStatus(premiumStatus);
      setLoading(false);
    };

    checkPremium();
  }, []);

  const verifyWithWordPress = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData && userData.user) {
      const result = await verifyPremiumWithWordPress(
        userData.user.id,
        userData.user.email || ''
      );
      
      if (result) {
        toast({
          title: "¡Estado premium verificado!",
          description: "Tu cuenta ha sido actualizada a premium.",
        });
        
        // Actualizar el estado local
        const premiumStatus = await checkUserPremiumStatus();
        setStatus(premiumStatus);
      } else {
        toast({
          title: "No se encontró suscripción premium",
          description: "No se encontró una suscripción premium activa en tu cuenta de WordPress.",
          variant: "destructive",
        });
      }
    }
    
    setLoading(false);
  };

  return {
    isPremium: status?.isPremium || false,
    premiumUntil: status?.premiumUntil,
    loading,
    verifyWithWordPress
  };
};
