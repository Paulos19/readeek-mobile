import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter, Stack, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trophy, Crown } from 'lucide-react-native';
import { getRanking, RankingUser } from '../../lib/api';

export default function RankingScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    setLoading(true);
    const data = await getRanking();
    setUsers(data);
    setLoading(false);
  };

  const renderItem = ({ item, index }: { item: RankingUser, index: number }) => {
    const position = index + 1;
    const isTop3 = position <= 3;
    let iconColor = "#71717a";
    if (position === 1) iconColor = "#fbbf24";
    if (position === 2) iconColor = "#9ca3af";
    if (position === 3) iconColor = "#b45309";

    return (
      <Link href={`/(app)/users/${item.id}`} asChild>
        <TouchableOpacity className="flex-row items-center bg-zinc-900/50 p-4 mb-3 rounded-2xl border border-zinc-800 active:bg-zinc-800/80">
          
          {/* Posição */}
          <View className="w-8 items-center justify-center mr-3">
            {isTop3 ? (
               <Crown size={24} color={iconColor} fill={iconColor} />
            ) : (
               <Text className="text-zinc-500 font-bold text-lg">#{position}</Text>
            )}
          </View>

          {/* Avatar */}
          <Image 
            source={{ uri: item.image || `https://ui-avatars.com/api/?name=${item.name}` }}
            className={`w-12 h-12 rounded-full border-2 mr-4 ${isTop3 ? 'border-emerald-500' : 'border-transparent'}`}
          />

          {/* Info */}
          <View className="flex-1">
            <Text className="text-white font-bold text-base">{item.name}</Text>
            <Text className="text-zinc-500 text-xs uppercase font-bold tracking-wider">{item.role === 'ADMIN' ? 'Admin' : 'Leitor'}</Text>
          </View>

          {/* Pontos */}
          <View className="items-end">
            <Text className="text-emerald-400 font-bold text-lg">{item.score}</Text>
            <Text className="text-zinc-600 text-[10px] uppercase">Pontos</Text>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Fixo */}
      <View className="pt-12 pb-4 px-4 bg-zinc-900/50 border-b border-zinc-800">
        <View className="flex-row items-center gap-4">
            <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center rounded-full bg-zinc-800"
            >
                <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Ranking Global</Text>
        </View>
      </View>

      {/* Lista */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
                <View className="mb-6 items-center">
                    <Text className="text-zinc-400 text-center text-sm">
                        Ganhe pontos lendo livros e participando da comunidade para subir no ranking!
                    </Text>
                </View>
            }
        />
      )}
    </View>
  );
}