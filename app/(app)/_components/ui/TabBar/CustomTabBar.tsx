import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Dimensions, Keyboard, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, User, Users, Store } from 'lucide-react-native';
import { usePathname } from 'expo-router'; 
import { TabIcon } from './TabIcon';
import { CenterBookButton } from './CenterBookButton';
import { TabBarBackground } from './TabBarBackground';
import { useReadingStore } from '../../../../../stores/useReadingStore';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { lastRead } = useReadingStore();
  const { width: screenWidth } = Dimensions.get('window');
  const pathname = usePathname();
  
  // Estado local para visibilidade do teclado
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // === 1. LÓGICA DE OCULTAÇÃO ===
  
  const HIDDEN_ROUTES = [
    '/product',      
    '/read',         
    '/shop/create',  
    '/shop/',        
    '/users',        
    '/ranking'       
  ];

  const isHiddenRoute = HIDDEN_ROUTES.some(route => pathname.includes(route));

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const isHiddenByOptions = focusedDescriptor.options.tabBarStyle && (focusedDescriptor.options.tabBarStyle as any).display === 'none';

  if (isHiddenRoute || isKeyboardVisible || isHiddenByOptions) {
      return null;
  }

  // === 2. CONFIGURAÇÃO DAS ABAS ===

  const LEFT_ROUTES = ['dashboard', 'library'];
  const RIGHT_ROUTES = ['shop', 'profile']; 

  const TAB_CONFIG: Record<string, { icon: any }> = {
    dashboard: { icon: Home },
    library: { icon: BookOpen },
    community: { icon: Users },
    shop: { icon: Store },
    profile: { icon: User },
  };

  const renderTab = (routeName: string, index: number) => {
    const route = state.routes.find(r => r.name === routeName);
    if (!route) return null;

    const { options } = descriptors[route.key];
    const isFocused = state.routes[state.index].name === routeName;
    
    // Configuração do ícone
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
        {/* CORREÇÃO: Passando as props corretas para TabIcon */}
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
      // Ajuste o nome da rota conforme seu File System. Ex: '(reader)/read/[bookId]/index'
      // Se der erro de navegação, use apenas navigation.navigate('read', { ... }) se a rota for nomeada assim
      // ou router.push se preferir a API do expo-router.
      navigation.navigate('read/[bookId]/index', { bookId: lastRead.id });
    } else {
      navigation.navigate('library');
    }
  };

  const TAB_HEIGHT = 65;
  const MARGIN_HORIZONTAL = 20;
  const TAB_WIDTH = screenWidth - (MARGIN_HORIZONTAL * 2);

  return (
    <View 
      pointerEvents="box-none" 
      className="absolute bottom-0 w-full items-center"
      style={{ paddingBottom: insets.bottom + 10 }}
    >
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
        <View style={{ borderRadius: 35, overflow: 'hidden', height: TAB_HEIGHT, width: '100%' }}>
            <TabBarBackground width={TAB_WIDTH} height={TAB_HEIGHT} />
        </View>

        <View className="absolute inset-0 flex-row items-center justify-between px-2">
            <View className="flex-row flex-1 justify-evenly h-full">
                {LEFT_ROUTES.map((route, i) => renderTab(route, i))}
            </View>

            <View className="w-[70px]" pointerEvents="box-none" /> 

            <View className="flex-row flex-1 justify-evenly h-full">
                {RIGHT_ROUTES.map((route, i) => renderTab(route, i))}
            </View>
        </View>
      </View>

      <View className="absolute" style={{ bottom: insets.bottom + 10 + 25 }}>
         <CenterBookButton onPress={handleCenterPress} />
      </View>
      
    </View>
  );
}