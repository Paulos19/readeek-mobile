import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Plus, Search } from 'lucide-react-native';
import { communityService } from 'lib/api';
import { Community } from '../_types/community'; // Ajuste o import conforme criado

export default function CommunityList() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommunities = async () => {
    try {
      const data = await communityService.getAll();
      setCommunities(data);
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommunities();
    setRefreshing(false);
  };

  useEffect(() => { fetchCommunities(); }, []);

  const renderItem = ({ item }: { item: Community }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/community/${item.id}`)}
      className="bg-zinc-900 mb-4 rounded-xl p-4 border border-zinc-800"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-white font-bold text-lg mb-1">{item.name}</Text>
          <Text className="text-zinc-400 text-sm mb-3 line-clamp-2" numberOfLines={2}>
            {item.description || "Sem descrição"}
          </Text>
          
          <View className="flex-row items-center gap-4">
             <View className="flex-row items-center bg-zinc-800 px-2 py-1 rounded-md">
                <Users size={12} color="#a1a1aa" />
                <Text className="text-zinc-400 text-xs ml-1 font-medium">
                  {item._count?.members || 0} membros
                </Text>
             </View>
             {item.visibility === 'PRIVATE' && (
                <View className="bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                    <Text className="text-red-400 text-[10px] font-bold">PRIVADA</Text>
                </View>
             )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-white font-bold text-2xl">Comunidades</Text>
        <TouchableOpacity className="bg-emerald-600 p-2 rounded-full">
            <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={communities}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
            <Text className="text-zinc-500 text-center mt-10">Nenhuma comunidade encontrada.</Text>
        }
      />
    </SafeAreaView>
  );
}