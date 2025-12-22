import { Tabs } from 'expo-router';
import { useAuthStore } from 'stores/useAuthStore';
import { CustomTabBar } from './_components/ui/TabBar/CustomTabBar';

export default function AppLayout() {
  const { token } = useAuthStore();
  
  // Se não houver token, retorna null para evitar flash de conteúdo protegido
  if (!token) return null; 

  return (
    <Tabs
      // Substituímos a TabBar nativa pelo nosso componente flutuante customizado
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Garante que a TabBar suma quando o teclado abrir (UX padrão Android)
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* 1. Rotas Visíveis na TabBar */}
      <Tabs.Screen 
        name="dashboard" 
        options={{ title: 'Início' }} 
      />
      
      <Tabs.Screen 
        name="library" 
        options={{ title: 'Biblioteca' }} 
      />
      
      <Tabs.Screen 
        name="community" 
        options={{ title: 'Comunidade' }} 
      />
      
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Perfil' }} 
      />

      {/* 2. Rota do Leitor (Oculta da TabBar) */}
      <Tabs.Screen
        name="read/[bookId]/index"
        options={{
          href: null, // Remove o botão da navegação
          tabBarStyle: { display: 'none' }, // Garante que a barra suma ao entrar
        }}
      />
    </Tabs>
  );
}