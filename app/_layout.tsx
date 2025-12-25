import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import '../global.css';

const InitialLayout = () => {
  // 1. Buscamos token e isLoading diretamente (sem isAuthenticated)
  const { token, isLoading, loadStorageData } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 2. Derivamos o isAuthenticated baseando-se na presença do token
  const isAuthenticated = !!token;

  // 3. Carrega os dados do storage ao montar o componente
  useEffect(() => {
    loadStorageData();
  }, []);

  // 4. Lógica de Redirecionamento e Proteção de Rotas
  useEffect(() => {
    // Se ainda está carregando o storage, não faz nada
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(app)';

    if (isAuthenticated && !inAuthGroup) {
      // Se está logado, mas está na tela de login ou inicial, manda para o dashboard
      router.replace('/(app)/dashboard');
    } else if (!isAuthenticated && inAuthGroup) {
      // Se NÃO está logado e tenta acessar área interna (dashboard/perfil), manda para login
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  // 5. Tela de Loading enquanto verifica a persistência
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <InitialLayout />
    </>
  );
}