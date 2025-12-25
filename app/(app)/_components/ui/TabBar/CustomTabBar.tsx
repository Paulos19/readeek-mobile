import React from 'react';
import { View, TouchableOpacity, Dimensions, Platform, Keyboard } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router'; // Importação essencial para saber onde estamos
import { Home, BookOpen, User, Users, Store } from 'lucide-react-native';
import { TabIcon } from './TabIcon';
import { CenterBookButton } from './CenterBookButton';
import { TabBarBackground } from './TabBarBackground';
import { useReadingStore } from '../../../../../stores/useReadingStore'; // Ajuste o caminho conforme sua estrutura

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { lastRead } = useReadingStore();
  const { width: screenWidth } = Dimensions.get('window');
  const pathname = usePathname();

  // === 1. LÓGICA DE OCULTAÇÃO (NOVA) ===
  // Se a rota atual contiver qualquer uma dessas strings, a TabBar não será renderizada.
  const HIDDEN_ROUTES = [
    '/read/',       // Leitor de Livros
    '/chat/',       // Sala de Chat
    '/product/',    // Detalhes do Produto
    '/shop/create', // Criar Loja/Produto
    '/ranking',     // Tela de Ranking (Opcional, se quiser Fullscreen)
  ];

  const shouldHideByPath = HIDDEN_ROUTES.some(route => pathname.includes(route));

  // Verifica também se foi escondido manualmente nas options da rota (backup)
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const shouldHideByOptions = focusedDescriptor.options.tabBarStyle && (focusedDescriptor.options.tabBarStyle as any).display === 'none';

  // Se deve esconder, retorna null (não renderiza nada)
  if (shouldHideByPath || shouldHideByOptions) return null;

  // === 2. CONFIGURAÇÃO ===
  const LEFT_ROUTES = ['dashboard', 'library'];
  // Se você tiver uma rota de 'shop' ou 'community' como aba, ajuste aqui:
  const RIGHT_ROUTES = ['community', 'profile']; 

  const TAB_CONFIG: Record<string, { icon: any }> = {
    dashboard: { icon: Home },
    library: { icon: BookOpen },
    community: { icon: Users },
    shop: { icon: Store },
    profile: { icon: User },
  };

  const renderTab = (routeName: string, index: number) => {
    // Busca a rota correspondente no estado de navegação
    const route = state.routes.find(r => r.name === routeName);
    if (!route) return null; // Se a rota não existir nas abas, ignora

    const { options } = descriptors[route.key];
    const isFocused = state.routes[state.index].name === routeName;
    
    // Fallback seguro para ícone
    const config = TAB_CONFIG[routeName] || { icon: Home };

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName, route.params);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={`tab-btn-${routeName}`}
        onPress={onPress}
        className="flex-1 items-center justify-center h-full"
        activeOpacity={1}
      >
        <TabIcon 
          isFocused={isFocused}
          Icon={config.icon}
          color="#10b981"
        />
      </TouchableOpacity>
    );
  };

  const handleCenterPress = () => {
    if (lastRead?.id) {
        // Redireciona para o leitor com o ID do livro salvo
        // Nota: Como '/read/' está na lista HIDDEN_ROUTES, a TabBar sumirá ao entrar lá.
        navigation.navigate('read/[bookId]/index', { bookId: lastRead.id });
    } else {
        navigation.navigate('library');
    }
  };

  // Dimensões do efeito flutuante
  const TAB_HEIGHT = 65;
  const MARGIN_HORIZONTAL = 20;
  const TAB_WIDTH = screenWidth - (MARGIN_HORIZONTAL * 2);

  return (
    <View 
      pointerEvents="box-none" 
      className="absolute bottom-0 w-full items-center"
      style={{ paddingBottom: insets.bottom + 10 }}
    >
      
      {/* Container Flutuante */}
      <View 
        style={{ 
          width: TAB_WIDTH, 
          height: TAB_HEIGHT,
          borderRadius: 35,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {/* Fundo SVG */}
        <View style={{ borderRadius: 35, overflow: 'hidden', height: TAB_HEIGHT, width: '100%' }}>
            <TabBarBackground width={TAB_WIDTH} height={TAB_HEIGHT} />
        </View>

        {/* Ícones */}
        <View className="absolute inset-0 flex-row items-center justify-between px-2">
            <View className="flex-row flex-1 justify-evenly h-full">
                {LEFT_ROUTES.map((route, i) => renderTab(route, i))}
            </View>

            {/* Espaço Vazio Central */}
            <View className="w-[70px]" pointerEvents="box-none" /> 

            <View className="flex-row flex-1 justify-evenly h-full">
                {RIGHT_ROUTES.map((route, i) => renderTab(route, i))}
            </View>
        </View>
      </View>

      {/* Botão Central Flutuante */}
      <View className="absolute" style={{ bottom: insets.bottom + 10 + 25 }}>
         <CenterBookButton onPress={handleCenterPress} />
      </View>
      
    </View>
  );
}