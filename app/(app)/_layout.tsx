// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, BookOpen, User } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useAuthStore } from 'stores/useAuthStore';

export default function AppLayout() {
  // Apenas para garantir que o usuário não acesse se o estado limpar do nada
  const { token } = useAuthStore();
  if (!token) return null; 

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b', // zinc-950
          borderTopColor: '#27272a',  // zinc-800
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10b981', // emerald-500
        tabBarInactiveTintColor: '#71717a', // zinc-500
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}