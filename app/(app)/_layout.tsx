import { Tabs } from 'expo-router';
import { Home, BookOpen, User } from 'lucide-react-native';
import { useAuthStore } from 'stores/useAuthStore';

export default function AppLayout() {
  const { token } = useAuthStore();
  
  // Proteção simples: se não tiver token, não renderiza nada (o middleware/root layout deve redirecionar)
  if (!token) return null; 

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b', // zinc-950
          borderTopColor: '#27272a',  // zinc-800
          height: 64, // Um pouco mais alto para conforto
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#10b981', // emerald-500
        tabBarInactiveTintColor: '#71717a', // zinc-500
        tabBarShowLabel: false, // Visual mais limpo, só ícones
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

      {/* 2. Biblioteca (Agora existe!) */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={24} />,
        }}
      />

      {/* 3. Perfil (Agora existe!) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={24} />,
        }}
      />

      {/* 4. Rota do Leitor (Oculta)
         Usamos o nome exato que o aviso mostrou: "read/[bookId]/index"
      */}
      <Tabs.Screen
        name="read/[bookId]/index"
        options={{
          href: null, // Isso remove o ícone da barra de abas
          tabBarStyle: { display: 'none' }, // Garante que a barra suma quando estiver lendo
        }}
      />
    </Tabs>
  );
}