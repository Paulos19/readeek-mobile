import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // <--- IMPORTANTE

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

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(app)';

    if (isAuthenticated && !inAuthGroup) {
      router.replace('/(app)/dashboard');
    } else if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, segments]);

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
    // <--- AQUI ESTÁ A CORREÇÃO DO ERRO PRINCIPAL
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AlertProvider>
        <StatusBar style="light" />
        <InitialLayout />
      </AlertProvider>
    </GestureHandlerRootView>
  );
}