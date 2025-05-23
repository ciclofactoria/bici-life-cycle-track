
import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkUserPremiumStatus, SubscriptionStatus } from './premiumService';

interface PremiumContextType {
  isPremium: boolean;
  premiumUntil: Date | null;
  loading: boolean;
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  premiumUntil: null,
  loading: true,
  refreshPremiumStatus: async () => {}
});

export const usePremium = () => useContext(PremiumContext);

interface PremiumProviderProps {
  children: React.ReactNode;
}

const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkPremium = async () => {
    setLoading(true);
    try {
      const premiumStatus = await checkUserPremiumStatus();
      console.log("Estado premium obtenido:", premiumStatus);
      setStatus(premiumStatus);
    } catch (error) {
      console.error("Error al verificar estado premium:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPremium();
  }, []);

  const value = {
    isPremium: status?.isPremium || false,
    premiumUntil: status?.premiumUntil || null,
    loading,
    refreshPremiumStatus: checkPremium
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

export default PremiumProvider;
