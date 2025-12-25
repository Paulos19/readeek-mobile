import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router'; // Importação necessária
import { Home, BookOpen, Users, User, MessageCircle } from 'lucide-react-native';

export function StandardTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname(); // Hook para pegar a URL atual

  // --- 1. LÓGICA DE OCULTAÇÃO ---
  
  // Identifica a rota e opções ativas no momento
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  // Verifica se nas options da rota foi definido tabBarStyle: { display: 'none' }
  const shouldHideByOptions = (focusedOptions.tabBarStyle as any)?.display === 'none';

  // Verifica manualmente por rotas específicas na URL
  // Isso garante que a barra suma em sub-rotas profundas
  const hiddenRoutesSegments = [
    '/read/',       // Leitor de Livros
    '/chat/',       // Chat
    '/product/',    // Detalhes de Produto
    '/shop/create', // Criar Loja
    '/ranking'      // Ranking (opcional)
  ];
  
  const shouldHideByPath = hiddenRoutesSegments.some(segment => pathname.includes(segment));

  // SE DEVE ESCONDER, NÃO RENDERIZA NADA
  if (shouldHideByOptions || shouldHideByPath) {
    return null;
  }

  // --- 2. CONFIGURAÇÃO DA UI ---

  const tabsConfig: Record<string, { icon: any, label: string }> = {
    dashboard: { icon: Home, label: "Início" },
    library: { icon: BookOpen, label: "Biblioteca" },
    social: { icon: MessageCircle, label: "Social" },
    community: { icon: Users, label: "Clubes" },
    profile: { icon: User, label: "Perfil" },
  };

  const mainRoutes = ['dashboard', 'library', 'social', 'community', 'profile'];

  return (
    <View 
        className="flex-row bg-zinc-950 border-t border-zinc-800 items-end" 
        style={{ 
            paddingBottom: insets.bottom + 4, 
            paddingTop: 12,
            height: 65 + insets.bottom // Altura fixa garantida
        }}
    >
      {state.routes.map((route, index) => {
        if (!mainRoutes.includes(route.name)) return null;

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const config = tabsConfig[route.name];
        const IconComponent = config?.icon || Home;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // --- LÓGICA DO ÍCONE CENTRAL (SOCIAL) ---
        if (route.name === 'social') {
            return (
                <TouchableOpacity
                    key={route.key}
                    onPress={onPress}
                    activeOpacity={0.9}
                    className="flex-1 items-center justify-center -top-6" // -top-6 faz ele flutuar para fora da barra
                    style={{ zIndex: 50 }} // Garante que fique acima de tudo
                >
                    {/* Círculo com Borda Grossa para simular recorte */}
                    <View 
                        className={`w-16 h-16 rounded-full items-center justify-center border-[5px] border-zinc-950 shadow-lg shadow-emerald-500/40 ${
                            isFocused ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`}
                    >
                        <IconComponent 
                            size={28} 
                            color="white"
                            fill={isFocused ? "white" : "transparent"} // Preenchimento sutil se ativo
                        />
                    </View>
                    
                    {/* Label opcional */}
                    <Text className={`text-[10px] font-bold mt-1 ${isFocused ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        Social
                    </Text>
                </TouchableOpacity>
            );
        }

        // --- ÍCONES NORMAIS ---
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            className="flex-1 items-center justify-center gap-1 pb-1"
            activeOpacity={0.7}
          >
            {/* Pílula de fundo no ícone ativo */}
            <View className={`px-5 py-1.5 rounded-full transition-all ${isFocused ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
                <IconComponent 
                    size={24} 
                    color={isFocused ? '#10b981' : '#71717a'} 
                    strokeWidth={isFocused ? 2.5 : 2}
                />
            </View>
            <Text className={`text-[10px] font-medium ${isFocused ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {config?.label || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}