// app/_layout.tsx
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import "../global.css"; // Importação do NativeWind/Tailwind
import { useAuthStore } from 'stores/useAuthStore';


export default function RootLayout() {
  const { token, isLoading, loadStorageData } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Tenta recuperar o token do SecureStore ao abrir o app
  useEffect(() => {
    loadStorageData();
  }, []);

  // 2. Efeito "Guarda-Costas": Monitora o token e a rota atual
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(app)';
    
    if (!token && inAuthGroup) {
      // Se não tem token e tenta acessar área logada -> Login
      router.replace('/login');
    } else if (token && !inAuthGroup) {
      // Se tem token e está fora (ex: login) -> Dashboard
      router.replace('/(app)/dashboard');
    }
  }, [token, isLoading, segments]);

  // Tela de Loading enquanto verifica o token (Splash Screen manual)
  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {/* O Slot renderiza a rota filha atual */}
      <Slot /> 
    </>
  );
}