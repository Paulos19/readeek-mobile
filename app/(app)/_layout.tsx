import { Tabs } from 'expo-router';
import { Home, BookOpen, User } from 'lucide-react-native';
import { useAuthStore } from 'stores/useAuthStore';

export default function AppLayout() {
  const { token } = useAuthStore();
  
  if (!token) return null; 

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b', 
          borderTopColor: '#27272a',  
          height: 64, 
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#10b981', 
        tabBarInactiveTintColor: '#71717a', 
        tabBarShowLabel: false, 
      }}
    >
      {/* 1. Dashboard (Home) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={24} />,
        }}
      />

      {/* 2. Biblioteca */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={24} />,
        }}
      />

      {/* 3. Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={24} />,
        }}
      />

      {/* 4. Rota do Leitor (CORRIGIDO)
          Removemos o tabBarButton que causava o conflito.
          href: null já é suficiente para removê-lo da barra.
      */}
      <Tabs.Screen
        name="read/[bookId]/index"
        options={{
          href: null, // Isso remove o item da barra de abas
          tabBarStyle: { display: 'none' }, // Isso esconde a barra quando você entra na tela
        }}
      />
    </Tabs>
  );
}