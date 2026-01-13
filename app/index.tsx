import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/useAuthStore'; // Ajuste o caminho se necessário

export default function IndexGateway() {
  const router = useRouter();
  const { user } = useAuthStore(); // Supondo que seu store tenha uma função hydrate ou persistência automática

  useEffect(() => {
    const decideNavigation = async () => {
      // 1. Aguarda a hidratação do Auth (se necessário)
      // await hydrate(); 
      
      // 2. Verifica se o usuário já viu o Onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('@onboarding_completed');

      // 3. Lógica de Decisão
      if (!hasSeenOnboarding) {
        // Cenario A: Nunca viu o onboarding -> Manda para Onboarding
        router.replace('/onboarding');
      } else if (user) {
        // Cenario B: Já viu e está logado (Token válido) -> Manda para Dashboard
        router.replace('/(app)/dashboard');
      } else {
        // Cenario C: Já viu onboarding, mas não está logado -> Manda para Login
        router.replace('/login');
      }
    };

    // Pequeno delay para garantir que o layout montou (evita erros de navegação prematura)
    const timeout = setTimeout(() => {
        decideNavigation();
    }, 100);

    return () => clearTimeout(timeout);
  }, [user]);

  // Renderiza uma tela preta/loading enquanto decide (evita piscar tela branca)
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}