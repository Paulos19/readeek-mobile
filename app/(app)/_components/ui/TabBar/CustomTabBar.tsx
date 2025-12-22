import React from 'react';
import { View, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, User, Users } from 'lucide-react-native';
import { TabIcon } from './TabIcon';
import { CenterBookButton } from './CenterBookButton';
import { TabBarBackground } from './TabBarBackground';
import { useReadingStore } from 'stores/useReadingStore';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { lastRead } = useReadingStore();
  const { width: screenWidth } = Dimensions.get('window');

  // 1. Lógica de Ocultação: Verifica se a rota atual tem 'tabBarStyle: { display: "none" }'
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const shouldHide = focusedDescriptor.options.tabBarStyle && (focusedDescriptor.options.tabBarStyle as any).display === 'none';

  if (shouldHide) return null;

  const LEFT_ROUTES = ['dashboard', 'library'];
  const RIGHT_ROUTES = ['community', 'profile'];

  const TAB_CONFIG: Record<string, { icon: any }> = {
    dashboard: { icon: Home },
    library: { icon: BookOpen },
    community: { icon: Users },
    profile: { icon: User },
  };

  const renderTab = (routeName: string, index: number) => {
    const route = state.routes.find(r => r.name === routeName);
    if (!route) return null;

    const { options } = descriptors[route.key];
    const isFocused = state.routes[state.index].name === routeName;
    const config = TAB_CONFIG[routeName];

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
        // Alinhamento centralizado sem paddings estranhos
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
      navigation.navigate('read/[bookId]/index', { bookId: lastRead.id });
    } else {
      navigation.navigate('library');
    }
  };

  // Configurações de Dimensão para o efeito Flutuante
  const TAB_HEIGHT = 65;
  const MARGIN_HORIZONTAL = 20;
  const TAB_WIDTH = screenWidth - (MARGIN_HORIZONTAL * 2);

  return (
    <View 
      pointerEvents="box-none" 
      className="absolute bottom-0 w-full items-center"
      style={{ paddingBottom: insets.bottom + 10 }} // Espaço extra do fundo da tela
    >
      
      {/* Container Flutuante com Sombra e Bordas Arredondadas */}
      <View 
        style={{ 
          width: TAB_WIDTH, 
          height: TAB_HEIGHT,
          borderRadius: 35, // Arredondamento forte nas extremidades
          // Sombras para dar profundidade
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {/* 1. O Fundo SVG desenhado exatamente do tamanho do container */}
        {/* Overflow hidden garante que o SVG respeite o borderRadius do container pai */}
        <View style={{ borderRadius: 35, overflow: 'hidden', height: TAB_HEIGHT, width: '100%' }}>
            <TabBarBackground width={TAB_WIDTH} height={TAB_HEIGHT} />
        </View>

        {/* 2. Conteúdo dos Ícones (Sobreposto) */}
        <View className="absolute inset-0 flex-row items-center justify-between px-2">
            {/* Lado Esquerdo */}
            <View className="flex-row flex-1 justify-evenly h-full">
                {LEFT_ROUTES.map((route, i) => renderTab(route, i))}
            </View>

            {/* Espaço Vazio Central (Buraco) */}
            <View className="w-[70px]" pointerEvents="box-none" /> 

            {/* Lado Direito */}
            <View className="flex-row flex-1 justify-evenly h-full">
                {RIGHT_ROUTES.map((route, i) => renderTab(route, i))}
            </View>
        </View>
      </View>

      {/* 3. O Botão Central (Posicionado Absolutamente em relação ao container pai geral) */}
      {/* Ajuste o 'bottom' para alinhar perfeitamente com a cavidade visual */}
      <View className="absolute" style={{ bottom: insets.bottom + 10 + 25 }}>
         <CenterBookButton onPress={handleCenterPress} />
      </View>
      
    </View>
  );
}