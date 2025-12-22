import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
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
        className="flex-1 items-center justify-start h-full pt-3"
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

  // Altura fixa para garantir consistência visual entre Background e Botões
  const TAB_HEIGHT = Platform.OS === 'ios' ? 70 : 70;

  return (
    <View pointerEvents="box-none" className="absolute bottom-0 w-full">
      
      {/* 1. O Fundo SVG com altura sincronizada */}
      <TabBarBackground height={TAB_HEIGHT} />

      {/* 2. Container dos Botões Laterais */}
      <View 
        className="flex-row w-full absolute bottom-0"
        style={{ 
            height: TAB_HEIGHT,
            // Ajuste de padding safe area apenas para o conteúdo interno
            paddingBottom: Platform.OS === 'ios' ? insets.bottom - 10 : 0 
        }}
      >
        <View className="flex-row flex-1 justify-evenly pr-8">
          {LEFT_ROUTES.map((route, i) => renderTab(route, i))}
        </View>

        <View className="w-[80px]" pointerEvents="box-none" /> 

        <View className="flex-row flex-1 justify-evenly pl-8">
          {RIGHT_ROUTES.map((route, i) => renderTab(route, i))}
        </View>
      </View>

      {/* 3. O Botão Central */}
      <CenterBookButton onPress={handleCenterPress} />
      
    </View>
  );
}