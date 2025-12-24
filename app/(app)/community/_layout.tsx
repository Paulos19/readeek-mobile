import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Comunidades' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalhes' }} />
    </Stack>
  );
}