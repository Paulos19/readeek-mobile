import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Search, ChevronRight, BookOpen, Play, ShoppingCart, Sparkles, Gamepad2 } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming, 
  withDelay,
  withRepeat,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '../_types/user';
import { api, Notification } from '../../../lib/api';

// Modais
import { NotificationsSheet } from './NotificationsSheet';
import { SearchSheet } from './SearchSheet';

export interface MinimalBook {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  progress?: number;
}

interface GreetingHeaderProps {
  user: User | null;
  lastReadBook?: MinimalBook | null;
  onContinueReading: (book: MinimalBook) => void;
}

// --- BADGE INTELIGENTE (SHOP) ---
const SmartBadge = () => {
    const progress = useSharedValue(0);
    const shake = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(2000, withSpring(1, { damping: 12 }));
        const interval = setInterval(() => {
            shake.value = withSequence(
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(-10, { duration: 50 }),
                withTiming(10, { duration: 50 }),
                withTiming(0, { duration: 50 })
            );
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const containerStyle = useAnimatedStyle(() => {
        const size = interpolate(progress.value, [0, 1], [18, 8]);
        const top = interpolate(progress.value, [0, 1], [-5, 0]);
        const right = interpolate(progress.value, [0, 1], [-5, 0]);
        return { width: size, height: size, top, right, transform: [{ rotate: `${shake.value}deg` }] };
    });

    return (
        <Animated.View style={[containerStyle, { position: 'absolute', zIndex: 20, borderRadius: 999, overflow: 'hidden' }]}>
            <LinearGradient colors={['#f472b6', '#a78bfa']} style={{ width: '100%', height: '100%' }} />
        </Animated.View>
    );
};

// --- JOYSTICK ANIMADO (NOVO) ---
const JoystickButton = () => {
    const router = useRouter();
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        const interval = setInterval(() => {
            rotation.value = withSequence(
                withTiming(-15, { duration: 100 }),
                withTiming(15, { duration: 100 }),
                withTiming(-15, { duration: 100 }),
                withTiming(15, { duration: 100 }),
                withTiming(0, { duration: 100 })
            );
        }, 5000); 

        return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotation.value}deg` },
            { scale: scale.value }
        ]
    }));

    const onPressIn = () => { scale.value = withSpring(0.9); };
    const onPressOut = () => { scale.value = withSpring(1); };

    return (
        <TouchableOpacity
            onPress={() => router.push('/(app)/games' as any)}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
            className="w-10 h-10 rounded-full bg-zinc-900/60 border border-emerald-500/30 items-center justify-center relative backdrop-blur-md"
        >
             <Animated.View style={animatedStyle}>
                <Gamepad2 size={20} color="#10b981" fill="#10b981" fillOpacity={0.2} />
             </Animated.View>
             <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-900" />
        </TouchableOpacity>
    );
};

// --- EFEITO DE BRILHO (PARTÍCULAS) ---
const MagicSparkle = ({ delay = 0, style }: any) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withDelay(delay, withRepeat(withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
        ), -1, true));
        
        scale.value = withDelay(delay, withRepeat(withSequence(
            withTiming(1.2, { duration: 2000 }),
            withTiming(0.5, { duration: 2000 })
        ), -1, true));
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={[style, animStyle, { position: 'absolute' }]}>
            <Sparkles size={12} color="#fbbf24" fill="#fbbf24" />
        </Animated.View>
    );
};

// --- ÍCONE GENÉRICO ---
const IconButton = ({ icon: Icon, onPress, badgeCount = 0, showSmartBadge = false }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="w-10 h-10 rounded-full bg-zinc-900/60 border border-zinc-700/50 items-center justify-center relative backdrop-blur-md"
  >
    <Icon size={18} color={badgeCount > 0 || showSmartBadge ? "white" : "#a1a1aa"} />
    {badgeCount > 0 && !showSmartBadge && (
        <View className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-zinc-900" />
    )}
    {showSmartBadge && <SmartBadge />}
  </TouchableOpacity>
);

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

    loadNotifications();
    checkShopUpdates();
  }, []);

  const loadNotifications = async () => {
      try {
          const res = await api.get('/mobile/notifications');
          if (res.data && Array.isArray(res.data.notifications)) {
              setNotifications(res.data.notifications);
              setUnreadCount(res.data.unreadCount || 0);
          }
      } catch (e) {}
  };

  const checkShopUpdates = async () => {
      try {
          const res = await api.get('/mobile/marketplace/status');
          const latestProductDateStr = res.data?.lastProductDate;
          if (!latestProductDateStr) return;
          const lastVisitStr = await AsyncStorage.getItem('@last_shop_visit');
          const lastVisitDate = lastVisitStr ? parseInt(lastVisitStr) : 0;
          if (new Date(latestProductDateStr).getTime() > lastVisitDate) setHasNewProducts(true);
      } catch (e) {}
  };

  const handleOpenShop = async () => {
      setHasNewProducts(false);
      await AsyncStorage.setItem('@last_shop_visit', Date.now().toString());
      router.push('/(app)/shop' as any);
  };

  const handleMarkAsRead = async (id?: string) => {
    if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await api.patch('/mobile/notifications', { notificationId: id });
    } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        await api.patch('/mobile/notifications', {});
    }
  };

  return (
    <View className="px-5 pt-2 pb-6 mb-4 z-50">
      
      {/* MODAIS */}
      <NotificationsSheet 
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onMarkAsRead={handleMarkAsRead}
        topOffset={120} 
      />
      <SearchSheet visible={showSearch} onClose={() => setShowSearch(false)} topOffset={120} />

      {/* --- HEADER SUPERIOR --- */}
      <View className="flex-row items-center justify-between mb-6 mt-2">
        <Animated.View entering={FadeInDown.duration(600)} className="flex-row items-center gap-3 flex-1">
          <TouchableOpacity onPress={() => router.push(`/(app)/profile/${user?.id}` as any)}>
            <View className="w-10 h-10 rounded-full border border-zinc-700 overflow-hidden">
                <Image 
                    source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=18181b&color=fff` }} 
                    className="w-full h-full"
                />
            </View>
          </TouchableOpacity>
          <View>
            <Text className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">{greeting}</Text>
            <Text className="text-white text-lg font-bold leading-5" numberOfLines={1}>{user?.name?.split(' ')[0]}</Text>
          </View>
        </Animated.View>

        <View className="flex-row items-center gap-2">
            <JoystickButton />
            <IconButton icon={Search} onPress={() => setShowSearch(true)} />
            <IconButton icon={ShoppingCart} showSmartBadge={hasNewProducts} onPress={handleOpenShop} />
            <IconButton icon={Bell} badgeCount={unreadCount} onPress={() => setShowNotifications(true)} />
        </View>
      </View>

      {/* --- CARD LENDO AGORA --- */}
      {lastReadBook ? (
        <Animated.View entering={FadeInUp.delay(300).springify()} className="w-full">
            <TouchableOpacity 
                activeOpacity={0.95}
                onPress={() => onContinueReading(lastReadBook)}
                className="overflow-hidden rounded-[28px] relative bg-zinc-900 border border-zinc-800/50 shadow-2xl shadow-black/80"
                style={{ height: 220 }}
            >
                {/* 1. Imagem de Fundo (Blur) */}
                {lastReadBook.coverUrl ? (
                    <ImageBackground 
                        source={{ uri: lastReadBook.coverUrl }} 
                        className="absolute inset-0 w-full h-full opacity-60 blur-3xl"
                        resizeMode="cover"
                    />
                ) : (
                    <LinearGradient
                        colors={['#18181b', '#27272a']}
                        className="absolute inset-0 w-full h-full"
                    />
                )}

                {/* 2. Overlay Gradiente */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', '#09090b']}
                    locations={[0, 0.5, 1]}
                    className="absolute inset-0"
                />

                {/* 3. Partículas */}
                <MagicSparkle delay={0} style={{ top: 20, right: 40 }} />
                <MagicSparkle delay={1000} style={{ bottom: 60, left: 30 }} />

                <View className="flex-1 flex-row p-6 items-center">
                    
                    {/* Capa do Livro (Floating 3D) */}
                    <Animated.View 
                        entering={FadeInUp.delay(500)} 
                        className="shadow-2xl shadow-black"
                        style={{ transform: [{ rotate: '-3deg' }] }}
                    >
                        {lastReadBook.coverUrl ? (
                            <Image 
                                source={{ uri: lastReadBook.coverUrl }} 
                                className="w-28 h-40 rounded-lg border-2 border-white/10" 
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-28 h-40 rounded-lg bg-zinc-800 items-center justify-center border-2 border-zinc-700">
                                <BookOpen size={32} color="#52525b" />
                            </View>
                        )}
                    </Animated.View>

                    {/* Informações */}
                    <View className="flex-1 ml-5 justify-center h-full">
                        <View>
                            <View className="bg-white/10 self-start px-2 py-0.5 rounded-md mb-2 backdrop-blur-md border border-white/5">
                                <Text className="text-white/90 text-[9px] font-black uppercase tracking-widest">Lendo Agora</Text>
                            </View>
                            
                            <Text className="text-white font-black text-xl leading-6 mb-1 shadow-black shadow-lg" numberOfLines={2}>
                                {lastReadBook.title}
                            </Text>
                            <Text className="text-zinc-400 text-xs font-medium mb-4" numberOfLines={1}>
                                {lastReadBook.author || 'Autor desconhecido'}
                            </Text>
                        </View>

                        {/* Barra de Progresso e Botão */}
                        <View>
                            <View className="flex-row justify-between mb-1.5 items-end">
                                <Text className="text-zinc-400 text-[10px] font-bold uppercase">Progresso</Text>
                                <Text className="text-emerald-400 text-xs font-black">{Math.round(lastReadBook.progress || 0)}%</Text>
                            </View>
                            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                                <View 
                                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" 
                                    style={{ width: `${Math.min(lastReadBook.progress || 0, 100)}%` }} 
                                />
                            </View>

                            <View className="flex-row items-center gap-2">
                                <View className="w-8 h-8 bg-white rounded-full items-center justify-center shadow-lg shadow-white/20">
                                    <Play size={14} color="black" fill="black" style={{ marginLeft: 2 }} />
                                </View>
                                <Text className="text-white font-bold text-xs uppercase tracking-wide">Continuar</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(300)}>
            <TouchableOpacity className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 flex-row items-center justify-between shadow-lg">
                <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-2xl bg-zinc-800 items-center justify-center border border-zinc-700">
                        <BookOpen size={24} color="#71717a" />
                    </View>
                    <View>
                        <Text className="text-white font-bold text-lg">Sem leitura ativa</Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">Explore a biblioteca para começar.</Text>
                    </View>
                </View>
                <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700">
                    <ChevronRight size={16} color="#a1a1aa" />
                </View>
            </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}