import React, { useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, 
  ActivityIndicator, Alert, Dimensions, StatusBar as RNStatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  Gamepad2, Plus, Play, Lock, Coins, ChevronLeft, 
  Trophy, Flame, Sparkles, Star 
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { gameService } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Game } from '../_types/game';

const { width } = Dimensions.get('window');

export default function GamesMarketplace() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // --- LÓGICA DE DADOS ---
  const fetchGames = async () => {
    setLoading(true);
    // Adicione um delay artificial minúsculo para a animação de refresh ser perceptível e satisfatória
    const [data] = await Promise.all([
        gameService.getAll(),
        new Promise(resolve => setTimeout(resolve, 500))
    ]);
    setGames(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Separação de dados para UI
  const featuredGames = games.filter(g => g.plays > 10).slice(0, 3); // Top 3 jogos
  const allGames = games; 

  // --- LÓGICA DE COMPRA ---
  const handleGamePress = async (game: Game) => {
    if (game.isOwned) {
      router.push(`/games/${game.id}/play` as any);
    } else {
      Alert.alert(
        "Desbloquear Jogo",
        `Deseja gastar 15 créditos para jogar "${game.title}"? \nO valor vai para o criador: ${game.owner.name}`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: `Pagar 15 Créditos`, onPress: () => processPurchase(game) }
        ]
      );
    }
  };

  const processPurchase = async (game: Game) => {
    if ((user?.credits || 0) < 15) {
      Alert.alert("Saldo Insuficiente", "Você precisa de mais créditos para desbloquear este jogo.");
      return;
    }

    setPurchasingId(game.id);
    const result = await gameService.buyOrPlay(game.id);
    
    if (result.success) {
      setGames(prev => prev.map(g => g.id === game.id ? { ...g, isOwned: true, plays: g.plays + 1 } : g));
      
      // Atualização otimista
      if (user) {
         useAuthStore.getState().updateUser({ credits: user.credits - 15 });
      }

      Alert.alert("Sucesso!", "Jogo desbloqueado. Divirta-se!");
      router.push(`/games/${game.id}/play` as any);
    } else {
      Alert.alert("Erro", result.error === 'insufficient_funds' ? "Saldo insuficiente." : "Erro ao processar compra.");
    }
    setPurchasingId(null);
  };

  // --- COMPONENTES VISUAIS ---

  const Header = () => (
    <View className="pt-14 px-6 pb-4 flex-row justify-between items-center z-10">
        <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 rounded-full bg-zinc-800/80 items-center justify-center border border-zinc-700 backdrop-blur-md"
        >
            <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>

        <View className="bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-full flex-row items-center gap-2 shadow-lg">
            <Coins size={16} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-yellow-400 font-bold font-mono">{user?.credits || 0}</Text>
        </View>
    </View>
  );

  const WelcomeBanner = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    
    return (
        <Animated.View entering={FadeInDown.duration(600)} className="px-6 mb-8">
            <Text className="text-zinc-400 font-medium tracking-wide uppercase text-xs mb-1">
                {greeting}, {user?.name?.split(' ')[0]}
            </Text>
            <Text className="text-white text-3xl font-black italic">
                Readeek <Text className="text-emerald-500">Arcade</Text>
            </Text>
        </Animated.View>
    );
  };

  const DailyQuestCard = () => (
    <Animated.View entering={FadeInDown.delay(100).duration(600)} className="px-6 mb-8">
        <LinearGradient
            colors={['#047857', '#065f46']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            className="rounded-2xl p-4 flex-row items-center justify-between shadow-lg shadow-emerald-900/40 border border-emerald-500/30"
        >
            <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2 mb-1">
                    <Flame size={14} color="#fcd34d" fill="#fcd34d" />
                    <Text className="text-emerald-200 font-bold text-xs uppercase tracking-wider">Desafio Diário</Text>
                </View>
                <Text className="text-white font-bold text-lg leading-5">Jogue 3 games diferentes hoje</Text>
                <View className="mt-3 bg-black/20 h-1.5 w-full rounded-full overflow-hidden">
                    <View className="h-full bg-emerald-300 w-1/3 rounded-full" />
                </View>
            </View>
            <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/10">
                <Trophy size={24} color="#fff" />
            </View>
        </LinearGradient>
    </Animated.View>
  );

  const FeaturedSection = () => {
    if (featuredGames.length === 0) return null;
    
    return (
        <Animated.View entering={FadeInRight.delay(200).duration(600)} className="mb-8">
             <View className="px-6 flex-row items-center gap-2 mb-4">
                <Sparkles size={16} color="#fbbf24" />
                <Text className="text-white font-bold text-lg">Em Destaque</Text>
             </View>
             
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
                {featuredGames.map((game) => (
                    <TouchableOpacity 
                        key={game.id}
                        activeOpacity={0.9}
                        onPress={() => handleGamePress(game)}
                        className="w-72 h-44 rounded-2xl overflow-hidden relative shadow-lg shadow-black/50 border border-zinc-700/50"
                    >
                        {game.coverUrl ? (
                            <Image source={{ uri: game.coverUrl }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="w-full h-full bg-zinc-800 items-center justify-center">
                                <Gamepad2 size={48} color="#52525b" />
                            </View>
                        )}
                        <LinearGradient 
                            colors={['transparent', 'rgba(0,0,0,0.9)']} 
                            className="absolute inset-0 justify-end p-4"
                        >
                            <View className="flex-row items-start justify-between">
                                <View className="flex-1 mr-2">
                                    <Text className="text-white font-bold text-lg shadow-sm" numberOfLines={1}>{game.title}</Text>
                                    <Text className="text-zinc-300 text-xs shadow-sm">por {game.owner.name}</Text>
                                </View>
                                {game.isOwned ? (
                                    <View className="bg-emerald-500 p-2 rounded-full shadow-lg shadow-emerald-500/20">
                                        <Play size={16} color="#fff" fill="#fff" />
                                    </View>
                                ) : (
                                    <View className="bg-yellow-500 px-2 py-1 rounded-md shadow-lg">
                                        <Text className="text-black font-bold text-xs">{game.price}c</Text>
                                    </View>
                                )}
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
             </ScrollView>
        </Animated.View>
    );
  };

  const GameGridItem = ({ item, index }: { item: Game, index: number }) => (
    <Animated.View 
        entering={FadeInDown.delay(300 + (index * 50)).springify()} 
        className="flex-1 m-2"
    >
        <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleGamePress(item)}
            className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/80 shadow-md relative"
            style={{ height: 220 }}
        >
            {/* CAPA */}
            <View className="h-32 bg-zinc-800 relative">
                {item.coverUrl ? (
                    <Image source={{ uri: item.coverUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="w-full h-full items-center justify-center bg-zinc-800">
                         <Gamepad2 size={32} color="#3f3f46" />
                    </View>
                )}
                
                {!item.isOwned && (
                    <View className="absolute inset-0 bg-black/40 backdrop-blur-[1px] items-center justify-center">
                        <View className="bg-black/60 p-2 rounded-full border border-yellow-500/30">
                            <Lock size={16} color="#fbbf24" />
                        </View>
                    </View>
                )}
            </View>

            {/* INFO */}
            <View className="p-3 flex-1 justify-between bg-zinc-900">
                <View>
                    <Text numberOfLines={1} className="text-zinc-100 font-bold text-sm mb-0.5">{item.title}</Text>
                    <View className="flex-row items-center gap-1">
                        <Star size={10} color="#71717a" />
                        <Text numberOfLines={1} className="text-zinc-500 text-[10px] flex-1">
                            {item.owner.name || 'Desconhecido'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                    <View className="flex-row items-center">
                        <Gamepad2 size={12} color="#52525b" />
                        <Text className="text-zinc-400 text-[10px] ml-1 font-medium">{item.plays}</Text>
                    </View>
                    
                    {purchasingId === item.id ? (
                        <ActivityIndicator size="small" color="#10b981" />
                    ) : item.isOwned ? (
                        <Text className="text-emerald-500 text-[10px] font-bold uppercase tracking-wide">JOGAR</Text>
                    ) : (
                        <View className="flex-row items-center gap-1">
                            <Text className="text-yellow-500 font-bold text-xs">{item.price}</Text>
                            <Coins size={10} color="#fbbf24" />
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <Header />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchGames} tintColor="#10b981" />}
        showsVerticalScrollIndicator={false}
      >
        <WelcomeBanner />
        <DailyQuestCard />
        <FeaturedSection />

        <View className="px-4">
             <View className="px-2 mb-4 flex-row justify-between items-end">
                <Text className="text-white font-bold text-lg">Biblioteca</Text>
                <Text className="text-zinc-500 text-xs font-medium">{games.length} jogos disponíveis</Text>
             </View>

             {!loading && games.length === 0 ? (
                <View className="items-center py-10 opacity-50">
                    <Gamepad2 size={48} color="#52525b" />
                    <Text className="text-zinc-500 mt-4 text-center">Nenhum jogo encontrado.</Text>
                </View>
             ) : (
                 <View className="flex-row flex-wrap justify-between">
                    {allGames.map((game, index) => (
                        <View key={game.id} style={{ width: '50%' }}>
                            <GameGridItem item={game} index={index} />
                        </View>
                    ))}
                 </View>
             )}
        </View>
      </ScrollView>

      {/* FAB: Criar Jogo */}
      <Animated.View entering={FadeInDown.delay(800)} className="absolute bottom-8 self-center">
        <TouchableOpacity 
            className="bg-emerald-600 px-6 py-4 rounded-full flex-row items-center shadow-2xl shadow-emerald-500/40 border border-emerald-400/20"
            onPress={() => router.push('/games/create' as any)}
            activeOpacity={0.9}
        >
            <Plus size={24} color="#fff" />
            <Text className="text-white font-bold ml-2 text-base">Criar Jogo</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}