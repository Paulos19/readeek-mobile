import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Home, User, BookOpen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Clean look, sem texto
        tabBarActiveTintColor: '#10b981', // Emerald-500
        tabBarInactiveTintColor: '#52525b', // Zinc-600
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#18181b', // Zinc-900
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#27272a', // Zinc-800
          elevation: 10, // Sombra Android
          shadowColor: '#000', // Sombra iOS
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          paddingBottom: 0, // Remove padding padrão do iOS
        },
        // Centraliza os ícones verticalmente na nova barra mais alta
        tabBarItemStyle: {
          height: 64,
          paddingTop: 0,
        }
      }}
    >
      {/* 1. Dashboard (Home) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-emerald-500/10' : ''}`}>
              <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* 2. Rotas a ESCONDER da TabBar (Importante!) */}
      <Tabs.Screen
        name="read/[bookId]"
        options={{
          // Isso remove o botão da barra, mas mantem a rota acessível
          href: null,
          tabBarStyle: { display: 'none' }, // Esconde a barra inteira quando estiver lendo
        }}
      />

      {/* 3. Perfil / Configurações (Exemplo de segunda aba) */}
      {/* Como você ainda não tem um arquivo profile.tsx explícito na lista, 
          vou assumir que pode criar ou usar um placeholder. 
          Se não tiver, remova esta Tab ou aponte para settings. */}
       <Tabs.Screen
        name="profile" // Crie app/(app)/profile.tsx se não existir
        options={{
            href: null, // Deixando null por enquanto pois não vi o arquivo na lista
        }}
      />

    </Tabs>
  );
}