import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Gamepad2, Plus, Play, Lock, Coins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gameService } from '../../../lib/api';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Game } from '../_types/game';

export default function GamesMarketplace() {
  const router = useRouter();
  const { user, loadStorageData } = useAuthStore();
  
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const fetchGames = async () => {
    setLoading(true);
    const data = await gameService.getAll();
    setGames(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
    loadStorageData();
  }, []);

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
      loadStorageData();
      Alert.alert("Sucesso!", "Jogo desbloqueado. Divirta-se!");
      router.push(`/games/${game.id}/play` as any);
    } else {
      Alert.alert("Erro", result.error === 'insufficient_funds' ? "Saldo insuficiente." : "Erro ao processar compra.");
    }
    setPurchasingId(null);
  };

  const renderGameCard = ({ item }: { item: Game }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => handleGamePress(item)}
      className="flex-1 m-2 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-sm relative h-64"
    >
      <View className="h-40 bg-zinc-800 items-center justify-center">
        {item.coverUrl ? (
          <Image source={{ uri: item.coverUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Gamepad2 size={40} color="#3f3f46" />
        )}
        
        {!item.isOwned && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <Lock size={24} color="#fbbf24" />
            <View className="flex-row items-center mt-2 bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30">
              <Text className="text-yellow-400 font-bold text-xs mr-1">{item.price}</Text>
              <Coins size={10} color="#fbbf24" />
            </View>
          </View>
        )}
      </View>

      <View className="p-3 flex-1 justify-between">
        <View>
          <Text numberOfLines={1} className="text-zinc-100 font-bold text-base">{item.title}</Text>
          <Text numberOfLines={1} className="text-zinc-500 text-xs mt-0.5">
            por <Text className="text-zinc-400">{item.owner.name || 'Desconhecido'}</Text>
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center bg-zinc-800 px-2 py-1 rounded-md">
                <Text className="text-zinc-400 text-[10px] mr-1">plays</Text>
                <Text className="text-zinc-300 text-[10px] font-bold">{item.plays}</Text>
            </View>
            
            {purchasingId === item.id ? (
                <ActivityIndicator size="small" color="#10b981" />
            ) : item.isOwned ? (
                <View className="bg-emerald-500/10 p-2 rounded-full">
                   <Play size={16} color="#10b981" fill="#10b981" />
                </View>
            ) : (
                <Text className="text-xs text-yellow-500 font-bold">COMPRAR</Text>
            )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View className="pt-14 px-6 pb-6 bg-zinc-950 border-b border-zinc-900 flex-row justify-between items-center">
        <View>
          <Text className="text-emerald-500 font-bold text-xs tracking-widest uppercase mb-1">Arcade</Text>
          <Text className="text-white font-serif text-3xl font-bold">Sala de Games</Text>
        </View>

        <View className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full flex-row items-center gap-2">
            <Coins size={16} color="#fbbf24" />
            <Text className="text-yellow-400 font-bold">{user?.credits || 0}</Text>
        </View>
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={renderGameCard}
        numColumns={2}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchGames} tintColor="#10b981" />}
        ListEmptyComponent={!loading ? (
            <View className="items-center py-20">
                <Gamepad2 size={64} color="#27272a" />
                <Text className="text-zinc-500 mt-4 text-center">
                  Nenhum jogo publicado ainda.{'\n'}Seja o primeiro!
                </Text>
            </View>
        ) : null}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        className="absolute bottom-0 left-0 right-0 h-32 justify-end items-center pb-8 pointer-events-none"
      >
        <TouchableOpacity 
          className="bg-emerald-600 px-6 py-4 rounded-full flex-row items-center shadow-lg shadow-emerald-900/50 pointer-events-auto"
          onPress={() => router.push('/games/create' as any)}
        >
          <Plus size={24} color="#fff" />
          <Text className="text-white font-bold ml-2 text-base">Criar Jogo</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}