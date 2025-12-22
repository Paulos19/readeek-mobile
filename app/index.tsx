import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';

export default function Index() {
  const user = useAuthStore((state) => state.user);
  const [isReady, setIsReady] = useState(false);

  // Pequeno delay para garantir que o Zustand/AsyncStorage hidratou o estado do usuário
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100); 
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Lógica de Redirecionamento
  // Se tiver usuário -> Dashboard
  // Se não tiver -> Login
  return <Redirect href={user ? "/(app)/dashboard" : "/login"} />;
}