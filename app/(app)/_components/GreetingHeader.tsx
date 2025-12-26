import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Search, ChevronRight, BookOpen, Play, ShoppingCart } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming, 
  withDelay,
  ZoomIn,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Book } from '../_types/book';
import { User } from '../_types/user';
import { notificationService, Notification, getMarketplaceStatus } from '../../../lib/api';

// Modais
import { NotificationsSheet } from './NotificationsSheet';
import { SearchSheet } from './SearchSheet';

interface GreetingHeaderProps {
  user: User | null;
  lastReadBook: Book | null;
  onContinueReading: (book: Book) => void;
}

// --- BADGE INTELIGENTE (NOVO -> BOLINHA) ---
const SmartBadge = () => {
    const progress = useSharedValue(0); // 0 = Texto "NOVO", 1 = Bolinha
    const shake = useSharedValue(0);

    useEffect(() => {
        // 1. Aguarda 3 segundos e encolhe para bolinha
        progress.value = withDelay(3000, withSpring(1, { damping: 15 }));

        // 2. Vibração ocasional para chamar atenção (a cada 5 seg)
        const interval = setInterval(() => {
            shake.value = withSequence(
                withTiming(-15, { duration: 50 }),
                withTiming(15, { duration: 50 }),
                withTiming(-15, { duration: 50 }),
                withTiming(15, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Animação de tamanho e posição
    const containerStyle = useAnimatedStyle(() => {
        const width = interpolate(progress.value, [0, 1], [36, 8]); 
        const height = interpolate(progress.value, [0, 1], [16, 8]);
        // Ajusta a posição para ficar bem no cantinho quando for bolinha
        const top = interpolate(progress.value, [0, 1], [-10, -2]); 
        const right = interpolate(progress.value, [0, 1], [-10, -2]);

        return {
            width,
            height,
            top,
            right,
            transform: [{ rotate: `${shake.value}deg` }]
        };
    });

    // Texto some quando vira bolinha
    const textStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(progress.value, [0, 0.6], [1, 0], Extrapolation.CLAMP),
            transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0]) }]
        };
    });

    return (
        <Animated.View style={[containerStyle, { position: 'absolute', zIndex: 20, borderRadius: 999, overflow: 'hidden' }]}>
            <LinearGradient
                colors={['#ec4899', '#8b5cf6']} // Gradiente Vibrante
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
                <Animated.Text style={[textStyle, { fontSize: 8, fontWeight: '900', color: 'white' }]}>
                    NOVO
                </Animated.Text>
            </LinearGradient>
        </Animated.View>
    );
};

// --- ÍCONE GENÉRICO ---
const IconButton = ({ 
  icon: Icon, 
  onPress, 
  badgeCount = 0, 
  showSmartBadge = false,
}: { 
  icon: any, 
  onPress: () => void, 
  badgeCount?: number, 
  showSmartBadge?: boolean,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => { scale.value = withSpring(0.9); };
  const handlePressOut = () => { scale.value = withSpring(1); onPress(); };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center shadow-sm relative"
      >
        <Icon size={20} color={badgeCount > 0 || showSmartBadge ? "white" : "#a1a1aa"} />
        
        {/* Badge Numérico Padrão (Sino) */}
        {badgeCount > 0 && !showSmartBadge && (
          <View className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900 z-10" />
        )}

        {/* Badge Inteligente (Carrinho) */}
        {showSmartBadge && <SmartBadge />}
      </TouchableOpacity>
    </Animated.View>
  );
};

export function GreetingHeader({ user, lastReadBook, onContinueReading }: GreetingHeaderProps) {
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [hasNewProducts, setHasNewProducts] = useState(false); 

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    // Carrega notificações
    notificationService.getAll().then(res => {
        if(res) {
            setNotifications(res.notifications);
            setUnreadCount(res.unreadCount);
        }
    });

    // Lógica para verificar novidades no Shop
    checkShopUpdates();
  }, []);

  const checkShopUpdates = async () => {
      try {
          // 1. Busca a data do último produto criado no backend
          const latestProductDateStr = await getMarketplaceStatus();
          if (!latestProductDateStr) return;

          const latestProductDate = new Date(latestProductDateStr).getTime();

          // 2. Busca a data da última visita do usuário ao shop (salva localmente)
          const lastVisitStr = await AsyncStorage.getItem('@last_shop_visit');
          const lastVisitDate = lastVisitStr ? parseInt(lastVisitStr) : 0;

          // 3. Se o produto for mais novo que a última visita, mostra o badge
          if (latestProductDate > lastVisitDate) {
              setHasNewProducts(true);
          }
      } catch (e) {
          console.error("Erro verificando updates", e);
      }
  };

  const handleOpenShop = async () => {
      // 1. Remove o badge visualmente
      setHasNewProducts(false);
      
      // 2. Salva a data/hora atual como última visita
      await AsyncStorage.setItem('@last_shop_visit', Date.now().toString());
      
      // 3. Navega
      router.push('/(app)/shop');
  };

  const handleMarkAsRead = async (id?: string) => {
    if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }
    await notificationService.markAsRead(id);
  };

  return (
    <View className="px-6 pt-4 pb-2 mb-2 z-50">
      
      {/* MODAIS */}
      <NotificationsSheet 
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onMarkAsRead={handleMarkAsRead}
        topOffset={120} 
      />

      <SearchSheet 
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        topOffset={120}
      />

      {/* --- HEADER --- */}
      <View className="flex-row items-center justify-between mb-8">
        
        {/* Avatar e Saudação */}
        <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center gap-3 flex-1">
          <TouchableOpacity onPress={() => router.push(`/(app)/profile/${user?.id}` as any)}>
            <View className="p-0.5 rounded-full border-2 border-emerald-500/30">
                <Image 
                    source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10b981&color=fff` }} 
                    className="w-12 h-12 rounded-full bg-zinc-800"
                />
            </View>
          </TouchableOpacity>
          <View>
            <Text className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                {greeting},
            </Text>
            <Text className="text-white text-xl font-bold leading-6" numberOfLines={1}>
                {user?.name?.split(' ')[0] || 'Leitor'}
            </Text>
          </View>
        </Animated.View>

        {/* Botões de Ação */}
        <View className="flex-row items-center gap-3">
            {/* LUPA */}
            <IconButton 
                icon={Search} 
                onPress={() => setShowSearch(true)} 
            />

            {/* CARRINHO (Com Badge Inteligente) */}
            <IconButton 
                icon={ShoppingCart} 
                showSmartBadge={hasNewProducts}
                onPress={handleOpenShop} 
            />

            {/* SINO */}
            <IconButton 
                icon={Bell} 
                badgeCount={unreadCount}
                onPress={() => setShowNotifications(true)} 
            />
        </View>
      </View>

      {/* --- SESSÃO CONTINUAR LENDO --- */}
      {lastReadBook ? (
        <Animated.View 
            entering={FadeInRight.delay(300).springify()} 
            className="w-full"
        >
            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => onContinueReading(lastReadBook)}
                className="overflow-hidden rounded-3xl relative min-h-[140px]"
            >
                <LinearGradient
                    colors={['#18181b', '#09090b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute inset-0 rounded-3xl border border-zinc-800"
                />
                
                <View className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

                <View className="flex-row p-4 items-center">
                    <Animated.View entering={ZoomIn.delay(500)} className="shadow-xl shadow-black">
                        {lastReadBook.coverUrl ? (
                            <Image 
                                source={{ uri: lastReadBook.coverUrl }} 
                                className="w-20 h-28 rounded-lg bg-zinc-800" 
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-20 h-28 rounded-lg bg-zinc-800 items-center justify-center border border-zinc-700">
                                <BookOpen size={24} color="#52525b" />
                            </View>
                        )}
                    </Animated.View>

                    <View className="flex-1 ml-4 justify-between h-24 py-1">
                        <View>
                            <View className="flex-row items-center mb-1">
                                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                <Text className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                                    Em andamento
                                </Text>
                            </View>
                            <Text className="text-white font-bold text-lg leading-tight" numberOfLines={2}>
                                {lastReadBook.title}
                            </Text>
                            <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
                                {lastReadBook.author || 'Autor desconhecido'}
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-3 mt-2">
                            <View className="flex-1">
                                <View className="flex-row justify-between mb-1.5">
                                    <Text className="text-zinc-400 text-[10px] font-medium">Progresso</Text>
                                    <Text className="text-white text-[10px] font-bold">{lastReadBook.progress}%</Text>
                                </View>
                                <View className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <View 
                                        className="h-full bg-emerald-500 rounded-full" 
                                        style={{ width: `${lastReadBook.progress}%` }} 
                                    />
                                </View>
                            </View>
                            
                            <View className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-lg">
                                <Play size={14} color="black" style={{ marginLeft: 2 }} fill="black" />
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(300)} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
                    <BookOpen size={20} color="#71717a" />
                </View>
                <View>
                    <Text className="text-white font-bold">Comece uma nova leitura</Text>
                    <Text className="text-zinc-500 text-xs">Explore a biblioteca</Text>
                </View>
            </View>
            <ChevronRight size={20} color="#52525b" />
        </Animated.View>
      )}
    </View>
  );
}