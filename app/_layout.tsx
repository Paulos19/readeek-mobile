import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '../stores/useAuthStore';
import { useThemeStore } from '../stores/useThemeStore';
import { AlertProvider } from './_context/AlertContext';
import '../global.css';

const InitialLayout = () => {
  const { token, isLoading, loadStorageData } = useAuthStore();
  const { fetchPreferences } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();
  
  const isAuthenticated = !!token;

  // 1. Carrega dados do Storage ao iniciar
  useEffect(() => {
    loadStorageData();
  }, []);

  // 2. Se logado, busca preferências de tema
  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  // 3. Guarda de Rotas (Auth Guard)
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(app)';

    if (isAuthenticated && !inAuthGroup) {
      // Se está logado e tenta acessar telas públicas (login, onboarding), manda pro dashboard
      router.replace('/(app)/dashboard');
    } else if (!isAuthenticated && inAuthGroup) {
      // Se NÃO está logado e tenta acessar área protegida, manda pro login
      // (O Gateway no index.tsx tratará o redirecionamento inicial, aqui é uma segurança extra)
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Loader Global enquanto verifica token
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Definimos a navegação como STACK para controlar animações e headers
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090b' } }}>
      
      {/* O Gateway (Decisor de fluxo) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      {/* Onboarding com transição suave */}
      <Stack.Screen 
        name="onboarding" 
        options={{ 
          headerShown: false, 
          animation: 'fade',
          gestureEnabled: false // Impede voltar deslizando para não bugar o fluxo
        }} 
      />

      {/* Login e Cadastro */}
      <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false, animation: 'slide_from_right' }} />

      {/* Grupo Protegido (Dashboard, etc) */}
      <Stack.Screen name="(app)" options={{ headerShown: false, animation: 'fade' }} />
      
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlertProvider>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <InitialLayout />
      </AlertProvider>
    </GestureHandlerRootView>
  );
}