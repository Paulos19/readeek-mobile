import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export const useNetworkStatus = () => {
  // Começamos com false por segurança, ou null se quiser tratar "carregando"
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // Novo estado

  const checkConnection = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(!!state.isConnected && !!state.isInternetReachable);
    } catch (e) {
      setIsConnected(false);
    } finally {
      setIsChecking(false); // Finaliza a verificação
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, isChecking, checkConnection };
};