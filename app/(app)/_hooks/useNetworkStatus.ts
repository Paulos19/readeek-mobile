import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  const checkConnection = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(!!state.isConnected && !!state.isInternetReachable);
    } catch (e) {
      // Se der erro ao checar, assumimos que está offline por segurança
      setIsConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // Polling simples a cada 5 segundos para atualizar o status sem precisar de lib extra (NetInfo)
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, checkConnection };
};