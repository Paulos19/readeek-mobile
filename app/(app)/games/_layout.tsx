import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* Define a rota inicial da pasta games como o index.tsx */}
      <Stack.Screen name="index" />
      
      {/* Define a rota do player */}
      <Stack.Screen 
        name="[id]/play" 
        options={{ 
          gestureEnabled: false, // Importante para jogos (não voltar arrastando)
          animation: 'fade_from_bottom',
          statusBarHidden: true,
          navigationBarHidden: true
        }} 
      />
    </Stack>
  );
}