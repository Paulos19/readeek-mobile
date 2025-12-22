// app/_layout.tsx
import 'react-native-reanimated';
import "../global.css"; // Estilos globais
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from 'stores/useAuthStore';

export default function RootLayout() {
  const { token, isLoading, loadStorageData } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(app)';
    const inReader = segments[0] === 'read';

    if (!token && (inAuthGroup || inReader)) {
      router.replace('/login');
    } else if (token && !inAuthGroup && !inReader) {
      router.replace('/(app)/dashboard');
    }
  }, [token, isLoading, segments]);

  if (isLoading) {
    return <View className="flex-1 bg-zinc-950" />;
  }

  // Slot renderiza a rota filha correta ((app), login ou read)
  return <Slot />;
}